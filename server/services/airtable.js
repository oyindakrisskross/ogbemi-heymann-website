import { config } from "../config.js";
import { tryQuery } from "../db.js";
import { decryptSecret } from "./secrets.js";
import { works as mockWorks } from "../mockData.js";

const AIRTABLE_CACHE_TTL_MS = Number(process.env.AIRTABLE_CACHE_TTL_MS || 5 * 60 * 1000);
let worksCache = {
  key: "",
  expiresAt: 0,
  items: null,
  pending: null
};

function fieldValue(fields, candidates) {
  for (const name of candidates) {
    if (fields[name] !== undefined && fields[name] !== null) return fields[name];
  }
  return "";
}

function attachmentUrls(value) {
  if (Array.isArray(value) && value.length > 0) {
    const attachment = value[0];
    if (typeof attachment === "string") return { imageUrl: attachment, thumbnailUrl: attachment };

    const imageUrl = attachment?.url || "";
    const thumbnailUrl =
      attachment?.thumbnails?.large?.url ||
      attachment?.thumbnails?.small?.url ||
      attachment?.thumbnails?.full?.url ||
      imageUrl;

    return { imageUrl, thumbnailUrl };
  }

  if (typeof value === "string") return { imageUrl: value, thumbnailUrl: value };
  return { imageUrl: "", thumbnailUrl: "" };
}

function textValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.name || item.title || "";
        return "";
      })
      .filter(Boolean)
      .join(", ");
  }
  if (value && typeof value === "object") return value.name || value.title || "";
  return String(value || "");
}

function booleanValue(value) {
  if (Array.isArray(value)) return value.some(booleanValue);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;

  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return ["1", "true", "yes", "y", "available", "for sale", "available for purchase"].includes(normalized);
}

function normalizeAirtableRecord(record) {
  const fields = record.fields || {};
  const title = textValue(fieldValue(fields, ["Title", "Name", "Artwork Name"]));
  const year = textValue(fieldValue(fields, ["Year", "Creation Date", "Date"]));
  const dimensions = textValue(fieldValue(fields, ["Dimensions", "Size"]));
  const material = textValue(fieldValue(fields, ["Material", "Medium"]));
  const series = textValue(fieldValue(fields, ["Series"]));
  const availableRaw = fieldValue(fields, ["Available", "For Sale", "Available for Purchase"]);
  const available = booleanValue(availableRaw);
  const image = attachmentUrls(fieldValue(fields, ["Image", "Images", "Artwork Image"]));

  return {
    id: record.id,
    slug: String(title || record.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    title: title || "Untitled",
    year,
    dimensions,
    material,
    series,
    available,
    imageUrl: image.imageUrl || "/assets/art-01.svg",
    thumbnailUrl: image.thumbnailUrl || image.imageUrl || "/assets/art-01.svg"
  };
}

async function airtableConnectionFromDatabase() {
  const rows = await tryQuery("SELECT * FROM airtable_connections WHERE id = 1 LIMIT 1");
  if (!rows || !rows[0]) return null;
  return {
    apiKey: decryptSecret(rows[0].api_key_encrypted || ""),
    baseId: rows[0].base_id,
    tableName: rows[0].table_name || "Works"
  };
}

async function airtableConfig() {
  const dbConfig = await airtableConnectionFromDatabase();
  return {
    apiKey: dbConfig?.apiKey || config.airtable.apiKey,
    baseId: dbConfig?.baseId || config.airtable.baseId,
    tableName: dbConfig?.tableName || config.airtable.tableName
  };
}

function filterWorks(items, { available, year, series, size }) {
  return items.filter((work) => {
    if (booleanValue(available) && !work.available) return false;
    if (year && work.year !== year) return false;
    if (series && work.series !== series) return false;
    if (size && work.dimensions !== size) return false;
    return true;
  });
}

function searchWorks(items, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((work) =>
    [work.title, work.year, work.material, work.dimensions, work.series]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

function sortWorks(items, sortKey, sortDirection = "desc") {
  if (!sortKey) return items;

  const direction = sortDirection === "asc" ? 1 : -1;
  const allowedKeys = new Set(["year", "title", "series", "material", "dimensions"]);
  const key = allowedKeys.has(sortKey) ? sortKey : "year";

  return [...items].sort((a, b) => {
    const result = String(a[key] || "").localeCompare(String(b[key] || ""), undefined, {
      numeric: true,
      sensitivity: "base"
    });
    return result * direction;
  });
}

function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    items: pageItems,
    page,
    pageSize,
    total: items.length,
    hasMore: start + pageSize < items.length
  };
}

async function fetchAirtableRecords(connection) {
  const encodedTable = encodeURIComponent(connection.tableName);
  const records = [];
  let offset = "";

  do {
    const url = new URL(`https://api.airtable.com/v0/${connection.baseId}/${encodedTable}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${connection.apiKey}` }
    });

    if (!response.ok) {
      throw new Error(`Airtable responded with ${response.status}`);
    }

    const payload = await response.json();
    records.push(...(payload.records || []));
    offset = payload.offset || "";
  } while (offset);

  return records;
}

function connectionCacheKey(connection) {
  return [connection.baseId, connection.tableName, connection.apiKey ? connection.apiKey.slice(-8) : ""].join("|");
}

async function loadAirtableWorks(connection) {
  const key = connectionCacheKey(connection);
  const now = Date.now();

  if (worksCache.key === key && worksCache.items && worksCache.expiresAt > now) {
    return worksCache.items;
  }

  if (worksCache.key === key && worksCache.pending) {
    return worksCache.pending;
  }

  const previousItems = worksCache.key === key ? worksCache.items : null;
  const previousExpiresAt = worksCache.key === key ? worksCache.expiresAt : 0;

  const pending = fetchAirtableRecords(connection)
    .then((records) => {
      const items = records.map(normalizeAirtableRecord);
      worksCache = {
        key,
        expiresAt: Date.now() + AIRTABLE_CACHE_TTL_MS,
        items,
        pending: null
      };
      return items;
    })
    .catch((error) => {
      worksCache = {
        key,
        expiresAt: previousItems ? Date.now() + 60 * 1000 : previousExpiresAt,
        items: previousItems,
        pending: null
      };

      if (previousItems) return previousItems;
      throw error;
    });

  worksCache = {
    key,
    expiresAt: previousItems ? previousExpiresAt : 0,
    items: previousItems,
    pending
  };

  return pending;
}

async function loadWorks() {
  const connection = await airtableConfig();

  if (!connection.apiKey || !connection.baseId || !connection.tableName) {
    return mockWorks.map((work) => ({ ...work, thumbnailUrl: work.thumbnailUrl || work.imageUrl }));
  }

  return loadAirtableWorks(connection);
}

function filteredAndSortedWorks(items, params = {}) {
  return sortWorks(searchWorks(filterWorks(items, params), params.query), params.sortKey, params.sortDirection);
}

export async function getWorks(params = {}) {
  const page = Math.max(Number(params.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(params.pageSize || 12), 1), 100);
  const items = await loadWorks();
  return paginate(filteredAndSortedWorks(items, params), page, pageSize);
}

export async function getWorksMetadata(params = {}) {
  const items = filterWorks(await loadWorks(), params);

  return {
    years: Array.from(new Set(items.map((work) => work.year).filter(Boolean))).sort(
      (a, b) => Number(b) - Number(a)
    ),
    series: Array.from(new Set(items.map((work) => work.series).filter(Boolean))).sort(),
    sizes: Array.from(new Set(items.map((work) => work.dimensions).filter(Boolean))).sort()
  };
}
