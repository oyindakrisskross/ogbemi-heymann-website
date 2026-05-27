import express from "express";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { query, tryQuery } from "../db.js";
import { createToken, requireAdmin, validateAdminCredentials } from "../middleware/auth.js";
import {
  blogPosts,
  contactSubmissions,
  downloadableFiles,
  exhibitions,
  mailingList,
  settings
} from "../mockData.js";
import { encryptSecret } from "../services/secrets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_req, file, cb) => {
    const safeName = file.originalname.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage });

export const adminRouter = express.Router();

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseJson(value, fallback) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function asDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function isPublishedValue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value !== "false";
  return value !== false;
}

function uploadedFileUrl(file) {
  return file ? `/uploads/${file.filename}` : "";
}

function uploadMap(files = []) {
  return new Map(files.map((file) => [file.fieldname, uploadedFileUrl(file)]));
}

function extensionFrom(value = "") {
  const cleanValue = String(value).split("?")[0].split("#")[0];
  const match = cleanValue.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "";
}

function labelWithLockedExtension(label, currentFile) {
  const extension = extensionFrom(currentFile?.file_url || currentFile?.fileUrl || currentFile?.label || "");
  const cleanLabel = String(label || "").trim().replace(/\.[a-z0-9]+$/i, "");
  if (!cleanLabel) return "";
  return extension ? `${cleanLabel}.${extension}` : cleanLabel;
}

function normalizeExhibitionBody(body, files = []) {
  const location = parseJson(body.location, body.location || {});
  const filesByField = uploadMap(files);
  const parsedWorks = parseJson(body.works, body.works || []);
  const works = (Array.isArray(parsedWorks) ? parsedWorks : []).map((work) => ({
    ...work,
    imageUrl:
      filesByField.get(`workImage:${work.clientId}`) ||
      work.imageUrl ||
      work.image_url ||
      ""
  }));

  return {
    slug: body.slug || slugify(body.title),
    title: body.title,
    startDate: body.startDate,
    endDate: body.endDate,
    location,
    excerpt: body.excerpt || "",
    description: body.description || "",
    headliningImageUrl: filesByField.get("headliningImage") || body.headliningImageUrl || "/assets/art-01.svg",
    isPublished: isPublishedValue(body.isPublished),
    works,
    materials: parseJson(body.materials, body.materials || [])
  };
}

function normalizeAdminExhibition(row, works = [], materials = []) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    startDate: asDate(row.start_date || row.startDate),
    endDate: asDate(row.end_date || row.endDate),
    location: row.location || {
      galleryName: row.gallery_name,
      streetAddress: row.street_address,
      city: row.city,
      state: row.state,
      country: row.country
    },
    excerpt: row.excerpt || "",
    description: row.description || "",
    headliningImageUrl: row.headlining_image_url || row.headliningImageUrl || "/assets/art-01.svg",
    isPublished: row.is_published ?? row.isPublished ?? true,
    workCount: Number(row.work_count ?? row.workCount ?? works.length),
    works: works.map((work) => ({
      id: work.id,
      slug: work.slug || slugify(work.title),
      title: work.title,
      year: work.year || "",
      dimensions: work.dimensions || "",
      material: work.material || "",
      series: work.series || "",
      available: work.available ?? false,
      imageUrl: work.image_url || work.imageUrl || ""
    })),
    materials: materials.map((file) => ({
      id: file.id,
      label: file.label,
      fileUrl: file.file_url || file.fileUrl,
      fileType: file.file_type || file.fileType,
      context: file.context
    }))
  };
}

function mysqlDateTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function normalizePostBody(body, files = []) {
  const filesByField = uploadMap(files);
  const isPublished = isPublishedValue(body.isPublished);
  const parsedContent = parseJson(body.content, body.content || []);
  const content = (Array.isArray(parsedContent) ? parsedContent : []).map((block) => ({
    ...block,
    value:
      block.type === "image"
        ? filesByField.get(`contentImage:${block.id}`) || block.value || ""
        : block.value || ""
  }));

  return {
    slug: body.slug || slugify(body.title),
    title: body.title,
    excerpt: body.excerpt || "",
    coverImageUrl: filesByField.get("coverImage") || body.coverImageUrl || "/assets/art-03.svg",
    content,
    isPublished,
    publishedAt: isPublished ? mysqlDateTime(body.publishedAt || new Date()) : null
  };
}

async function replaceExhibitionChildren(exhibitionId, works, materials) {
  await query("DELETE FROM exhibition_works WHERE exhibition_id = ?", [exhibitionId]);
  await query("DELETE FROM downloadable_files WHERE exhibition_id = ?", [exhibitionId]);

  for (const [index, work] of works.entries()) {
    await query(
      "INSERT INTO exhibition_works (exhibition_id, title, year, dimensions, material, image_url, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        exhibitionId,
        work.title,
        work.year || null,
        work.dimensions || null,
        work.material || null,
        work.imageUrl || work.image_url || null,
        index
      ]
    );
  }

  for (const [index, file] of materials.entries()) {
    await query(
      "INSERT INTO downloadable_files (exhibition_id, label, file_url, file_type, context, display_order) VALUES (?, ?, ?, ?, 'exhibition', ?)",
      [exhibitionId, file.label, file.fileUrl || file.file_url, file.fileType || null, index]
    );
  }
}

adminRouter.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!validateAdminCredentials(email, password)) {
      return res.status(401).json({ error: "Invalid login details." });
    }
    res.json({ token: createToken({ email, role: "admin" }) });
  })
);

adminRouter.use(requireAdmin);

adminRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const rows = await tryQuery(`
      SELECT
        (SELECT COUNT(*) FROM exhibitions) AS exhibitionCount,
        (SELECT COUNT(*) FROM blog_posts) AS postCount,
        (SELECT COUNT(*) FROM contact_submissions) AS contactCount,
        (SELECT COUNT(*) FROM mailing_list_subscribers) AS subscriberCount
    `);
    if (!rows) {
      return res.json({
        exhibitionCount: exhibitions.length,
        postCount: blogPosts.length,
        contactCount: contactSubmissions.length,
        subscriberCount: mailingList.length
      });
    }
    res.json(rows[0]);
  })
);

adminRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const siteRows = await tryQuery("SELECT * FROM site_settings WHERE id = 1 LIMIT 1");
    const airtableRows = await tryQuery("SELECT * FROM airtable_connections WHERE id = 1 LIMIT 1");
    if (!siteRows && !airtableRows) {
      return res.json({
        ...settings,
        airtable: {
          baseId: config.airtable.baseId || "",
          tableName: config.airtable.tableName || "Works",
          hasApiKey: Boolean(config.airtable.apiKey)
        }
      });
    }
    const site = siteRows?.[0] || {};
    const airtable = airtableRows?.[0] || {};
    res.json({
      artistEmail: site.artist_email || config.artistEmail,
      pressEmail: site.press_email || config.pressEmail,
      instagramUrl: site.instagram_url || settings.instagramUrl,
      cvFileUrl: site.cv_file_url || settings.cvFileUrl,
      catalogueFileUrl: site.catalogue_file_url || settings.catalogueFileUrl,
      airtable: {
        baseId: airtable.base_id || config.airtable.baseId || "",
        tableName: airtable.table_name || config.airtable.tableName || "Works",
        hasApiKey: Boolean(airtable.api_key_encrypted || config.airtable.apiKey)
      }
    });
  })
);

adminRouter.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const body = req.body;
    const rows = await tryQuery(
      `INSERT INTO site_settings (id, artist_email, press_email, instagram_url, cv_file_url, catalogue_file_url)
       VALUES (1, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        artist_email = VALUES(artist_email),
        press_email = VALUES(press_email),
        instagram_url = VALUES(instagram_url),
        cv_file_url = VALUES(cv_file_url),
        catalogue_file_url = VALUES(catalogue_file_url)`,
      [
        body.artistEmail || "",
        body.pressEmail || "",
        body.instagramUrl || "",
        body.cvFileUrl || "",
        body.catalogueFileUrl || ""
      ]
    );

    if (body.airtable) {
      const encryptedApiKey = body.airtable.apiKey ? encryptSecret(body.airtable.apiKey) : null;
      if (encryptedApiKey) {
        await tryQuery(
          `INSERT INTO airtable_connections (id, api_key_encrypted, base_id, table_name)
           VALUES (1, ?, ?, ?)
           ON DUPLICATE KEY UPDATE api_key_encrypted = VALUES(api_key_encrypted), base_id = VALUES(base_id), table_name = VALUES(table_name)`,
          [encryptedApiKey, body.airtable.baseId || "", body.airtable.tableName || "Works"]
        );
      } else {
        await tryQuery(
          `INSERT INTO airtable_connections (id, base_id, table_name)
           VALUES (1, ?, ?)
           ON DUPLICATE KEY UPDATE base_id = VALUES(base_id), table_name = VALUES(table_name)`,
          [body.airtable.baseId || "", body.airtable.tableName || "Works"]
        );
      }
    }

    if (!rows) Object.assign(settings, body);
    res.json({ ok: true });
  })
);

adminRouter.get(
  "/exhibitions",
  asyncHandler(async (_req, res) => {
    const rows = await tryQuery(`
      SELECT e.*,
        (SELECT COUNT(*) FROM exhibition_works w WHERE w.exhibition_id = e.id) AS work_count
      FROM exhibitions e
      ORDER BY e.start_date DESC
    `);
    if (!rows) {
      return res.json(
        exhibitions.map((item) => normalizeAdminExhibition(item, item.works || [], item.materials || []))
      );
    }
    res.json(rows.map((row) => normalizeAdminExhibition(row)));
  })
);

adminRouter.get(
  "/exhibitions/:id",
  asyncHandler(async (req, res) => {
    const rows = await tryQuery("SELECT * FROM exhibitions WHERE id = ? LIMIT 1", [req.params.id]);
    if (!rows) {
      const found = exhibitions.find((entry) => String(entry.id) === String(req.params.id));
      if (!found) return res.status(404).json({ error: "Exhibition not found" });
      return res.json(normalizeAdminExhibition(found, found.works || [], found.materials || []));
    }
    if (!rows[0]) return res.status(404).json({ error: "Exhibition not found" });

    const workRows =
      (await tryQuery("SELECT * FROM exhibition_works WHERE exhibition_id = ? ORDER BY display_order, id", [
        rows[0].id
      ])) || [];
    const materialRows =
      (await tryQuery(
        "SELECT * FROM downloadable_files WHERE exhibition_id = ? ORDER BY display_order, id",
        [rows[0].id]
      )) || [];

    res.json(normalizeAdminExhibition(rows[0], workRows, materialRows));
  })
);

adminRouter.post(
  "/exhibitions",
  upload.any(),
  asyncHandler(async (req, res) => {
    const item = normalizeExhibitionBody(req.body, req.files);
    const result = await tryQuery(
      `INSERT INTO exhibitions
       (slug, title, start_date, end_date, gallery_name, street_address, city, state, country, excerpt, description, headlining_image_url, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.slug,
        item.title,
        item.startDate,
        item.endDate,
        item.location.galleryName || "",
        item.location.streetAddress || "",
        item.location.city || "",
        item.location.state || "",
        item.location.country || "",
        item.excerpt,
        item.description,
        item.headliningImageUrl,
        item.isPublished
      ]
    );

    if (result?.insertId) await replaceExhibitionChildren(result.insertId, item.works, item.materials);
    if (!result) exhibitions.unshift({ id: Date.now(), ...item });
    res.status(201).json({ ok: true });
  })
);

adminRouter.put(
  "/exhibitions/:id",
  upload.any(),
  asyncHandler(async (req, res) => {
    const item = normalizeExhibitionBody(req.body, req.files);
    const result = await tryQuery(
      `UPDATE exhibitions SET
        slug = ?, title = ?, start_date = ?, end_date = ?, gallery_name = ?, street_address = ?,
        city = ?, state = ?, country = ?, excerpt = ?, description = ?, headlining_image_url = ?, is_published = ?
       WHERE id = ?`,
      [
        item.slug,
        item.title,
        item.startDate,
        item.endDate,
        item.location.galleryName || "",
        item.location.streetAddress || "",
        item.location.city || "",
        item.location.state || "",
        item.location.country || "",
        item.excerpt,
        item.description,
        item.headliningImageUrl,
        item.isPublished,
        req.params.id
      ]
    );
    if (result) await replaceExhibitionChildren(req.params.id, item.works, item.materials);
    if (!result) {
      const index = exhibitions.findIndex((entry) => String(entry.id) === String(req.params.id));
      if (index >= 0) exhibitions[index] = { ...exhibitions[index], ...item };
    }
    res.json({ ok: true });
  })
);

adminRouter.delete(
  "/exhibitions/:id",
  asyncHandler(async (req, res) => {
    const result = await tryQuery("DELETE FROM exhibitions WHERE id = ?", [req.params.id]);
    if (!result) {
      const index = exhibitions.findIndex((entry) => String(entry.id) === String(req.params.id));
      if (index >= 0) exhibitions.splice(index, 1);
    }
    res.json({ ok: true });
  })
);

adminRouter.get(
  "/blog",
  asyncHandler(async (_req, res) => {
    const rows = await tryQuery("SELECT * FROM blog_posts ORDER BY COALESCE(published_at, created_at) DESC");
    if (!rows) return res.json(blogPosts);
    res.json(rows);
  })
);

adminRouter.post(
  "/blog",
  upload.any(),
  asyncHandler(async (req, res) => {
    const post = normalizePostBody(req.body, req.files);
    const result = await tryQuery(
      `INSERT INTO blog_posts (slug, title, excerpt, cover_image_url, content_json, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        post.slug,
        post.title,
        post.excerpt,
        post.coverImageUrl,
        JSON.stringify(post.content),
        post.isPublished,
        post.publishedAt
      ]
    );
    if (!result) blogPosts.unshift({ id: Date.now(), ...post });
    res.status(201).json({ ok: true });
  })
);

adminRouter.put(
  "/blog/:id",
  upload.any(),
  asyncHandler(async (req, res) => {
    const post = normalizePostBody(req.body, req.files);
    const result = await tryQuery(
      `UPDATE blog_posts SET slug = ?, title = ?, excerpt = ?, cover_image_url = ?, content_json = ?, is_published = ?, published_at = ? WHERE id = ?`,
      [
        post.slug,
        post.title,
        post.excerpt,
        post.coverImageUrl,
        JSON.stringify(post.content),
        post.isPublished,
        post.publishedAt,
        req.params.id
      ]
    );
    if (!result) {
      const index = blogPosts.findIndex((entry) => String(entry.id) === String(req.params.id));
      if (index >= 0) blogPosts[index] = { ...blogPosts[index], ...post };
    }
    res.json({ ok: true });
  })
);

adminRouter.delete(
  "/blog/:id",
  asyncHandler(async (req, res) => {
    const result = await tryQuery("DELETE FROM blog_posts WHERE id = ?", [req.params.id]);
    if (!result) {
      const index = blogPosts.findIndex((entry) => String(entry.id) === String(req.params.id));
      if (index >= 0) blogPosts.splice(index, 1);
    }
    res.json({ ok: true });
  })
);

adminRouter.get(
  "/files",
  asyncHandler(async (_req, res) => {
    const rows = await tryQuery("SELECT * FROM downloadable_files ORDER BY display_order, id");
    if (!rows) return res.json(downloadableFiles);
    res.json(rows);
  })
);

adminRouter.post(
  "/files",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl;
    const label = labelWithLockedExtension(req.body.label || req.file?.originalname || "Download", {
      fileUrl: fileUrl,
      label: req.file?.originalname || req.body.label || ""
    });
    const payload = {
      label,
      fileUrl,
      fileType: req.file?.mimetype || req.body.fileType || "",
      context: req.body.context || "general"
    };
    const result = await tryQuery(
      "INSERT INTO downloadable_files (label, file_url, file_type, context) VALUES (?, ?, ?, ?)",
      [payload.label, payload.fileUrl, payload.fileType, payload.context]
    );
    if (!result) downloadableFiles.unshift({ id: Date.now(), ...payload });
    res.status(201).json({ ok: true, file: payload });
  })
);

adminRouter.put(
  "/files/:id",
  asyncHandler(async (req, res) => {
    const currentRows = await tryQuery("SELECT * FROM downloadable_files WHERE id = ? LIMIT 1", [req.params.id]);
    const currentFile =
      currentRows?.[0] || downloadableFiles.find((entry) => String(entry.id) === String(req.params.id));
    if (!currentFile) return res.status(404).json({ error: "File not found." });
    const label = labelWithLockedExtension(req.body.label, currentFile);
    if (!label) return res.status(400).json({ error: "File name is required." });

    const result = await tryQuery("UPDATE downloadable_files SET label = ? WHERE id = ?", [
      label,
      req.params.id
    ]);
    if (!result) {
      const found = downloadableFiles.find((entry) => String(entry.id) === String(req.params.id));
      if (found) found.label = label;
    }
    res.json({ ok: true });
  })
);

adminRouter.delete(
  "/files/:id",
  asyncHandler(async (req, res) => {
    const result = await tryQuery("DELETE FROM downloadable_files WHERE id = ?", [req.params.id]);
    if (!result) {
      const index = downloadableFiles.findIndex((entry) => String(entry.id) === String(req.params.id));
      if (index >= 0) downloadableFiles.splice(index, 1);
    }
    res.json({ ok: true });
  })
);

adminRouter.get(
  "/contacts",
  asyncHandler(async (_req, res) => {
    const rows = await tryQuery("SELECT * FROM contact_submissions ORDER BY created_at DESC");
    if (!rows) return res.json(contactSubmissions);
    res.json(rows);
  })
);

adminRouter.get(
  "/mailing-list",
  asyncHandler(async (_req, res) => {
    const rows = await tryQuery("SELECT * FROM mailing_list_subscribers ORDER BY created_at DESC");
    if (!rows) return res.json(mailingList);
    res.json(rows);
  })
);
