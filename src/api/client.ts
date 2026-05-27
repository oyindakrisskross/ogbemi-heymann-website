import {
  mockBlogPosts,
  mockExhibitions,
  mockFiles,
  mockSettings,
  mockWorks
} from "../data/mockData";
import type {
  Artwork,
  BlogPost,
  ContactPayload,
  DashboardStats,
  DownloadableFile,
  Exhibition,
  PaginatedWorks,
  SiteSettings,
  WorksMetadata
} from "../types";

const configuredApiBase = import.meta.env.VITE_API_URL?.trim();
const API_BASE = import.meta.env.DEV ? "/api" : configuredApiBase || "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response.json();
}

function filterWorks(params: Record<string, string | number | boolean | undefined>) {
  const normalizedQuery = String(params.query || "").trim().toLowerCase();

  return mockWorks.filter((work) => {
    if (params.available === true || params.available === "true") {
      if (!work.available) return false;
    }
    if (params.year && work.year !== String(params.year)) return false;
    if (params.series && work.series !== String(params.series)) return false;
    if (params.size && work.dimensions !== String(params.size)) return false;
    if (
      normalizedQuery &&
      ![work.title, work.year, work.material, work.dimensions, work.series]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    ) {
      return false;
    }
    return true;
  });
}

function sortWorks(
  items: Artwork[],
  sortKey?: string | number | boolean,
  sortDirection?: string | number | boolean
) {
  if (!sortKey) return items;

  const direction = sortDirection === "asc" ? 1 : -1;
  const allowedKeys = new Set(["year", "title", "series", "material", "dimensions"]);
  const key = allowedKeys.has(String(sortKey)) ? String(sortKey) : "year";

  return [...items].sort((a, b) => {
    const result = String(a[key as keyof Artwork] || "").localeCompare(
      String(b[key as keyof Artwork] || ""),
      undefined,
      { numeric: true, sensitivity: "base" }
    );
    return result * direction;
  });
}

function paginateWorks(
  params: Record<string, string | number | boolean | undefined> = {}
): PaginatedWorks {
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 12);
  const filtered = sortWorks(filterWorks(params), params.sortKey, params.sortDirection);
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
    hasMore: start + pageSize < filtered.length
  };
}

function workMetadata(items: Artwork[]): WorksMetadata {
  return {
    years: Array.from(new Set(items.map((work) => work.year).filter(Boolean))).sort(
      (a, b) => Number(b) - Number(a)
    ),
    series: Array.from(new Set(items.map((work) => work.series).filter(Boolean))).sort(),
    sizes: Array.from(new Set(items.map((work) => work.dimensions).filter(Boolean))).sort()
  };
}

function queryString(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
}

function featuredExhibition(items: Exhibition[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ongoing = items
    .filter((item) => new Date(item.startDate) <= today && new Date(item.endDate) >= today)
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  const upcoming = items
    .filter((item) => new Date(item.startDate) > today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const past = items
    .filter((item) => new Date(item.endDate) < today)
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  return upcoming[0] || ongoing[0] || past[0] || null;
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    return await request<SiteSettings>("/settings");
  } catch {
    return mockSettings;
  }
}

export async function getWorks(
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<PaginatedWorks> {
  try {
    const search = queryString(params);
    return await request<PaginatedWorks>(`/works${search ? `?${search}` : ""}`);
  } catch {
    return paginateWorks(params);
  }
}

export async function getWorksMetadata(
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<WorksMetadata> {
  try {
    const search = queryString(params);
    return await request<WorksMetadata>(`/works/metadata${search ? `?${search}` : ""}`);
  } catch {
    return workMetadata(filterWorks(params));
  }
}

export async function getAllWorks(
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<Artwork[]> {
  try {
    const pageSize = 100;
    const items: Artwork[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const payload = await getWorks({ ...params, page, pageSize });
      items.push(...payload.items);
      hasMore = payload.hasMore;
      page += 1;
    }

    return items;
  } catch {
    const pageSize = 100;
    const items: Artwork[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const payload = paginateWorks({ ...params, page, pageSize });
      items.push(...payload.items);
      hasMore = payload.hasMore;
      page += 1;
    }

    return items;
  }
}

export async function getAllMockWorks(): Promise<Artwork[]> {
  return getAllWorks();
}

export async function getExhibitions(): Promise<Exhibition[]> {
  try {
    return await request<Exhibition[]>("/exhibitions");
  } catch {
    return mockExhibitions;
  }
}

export async function getFeaturedExhibition(): Promise<Exhibition | null> {
  try {
    return await request<Exhibition | null>("/exhibitions/featured");
  } catch {
    return featuredExhibition(mockExhibitions);
  }
}

export async function getExhibition(slug: string): Promise<Exhibition | null> {
  try {
    return await request<Exhibition>(`/exhibitions/${slug}`);
  } catch {
    return mockExhibitions.find((item) => item.slug === slug) || null;
  }
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    return await request<BlogPost[]>("/blog");
  } catch {
    return mockBlogPosts;
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    return await request<BlogPost>(`/blog/${slug}`);
  } catch {
    return mockBlogPosts.find((item) => item.slug === slug) || null;
  }
}

export async function getDownloads(): Promise<DownloadableFile[]> {
  try {
    return await request<DownloadableFile[]>("/downloads");
  } catch {
    return mockFiles;
  }
}

export async function submitContact(payload: ContactPayload) {
  return request<{ ok: boolean }>("/contact", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function joinMailingList(email: string) {
  return request<{ ok: boolean }>("/mailing-list", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function login(email: string, password: string) {
  return request<{ token: string }>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function adminRequest<T>(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit =
    options.body instanceof FormData
      ? { Authorization: `Bearer ${token}`, ...(options.headers || {}) }
      : {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers || {})
        };

  const response = await fetch(`${API_BASE}/admin${path}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("ogbemi-admin-token");
      if (window.location.pathname !== "/admin/login") {
        window.location.assign("/admin/login?expired=1");
      }
      throw new Error("Your admin session expired. Please log in again.");
    }

    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response.json();
}

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  return adminRequest<DashboardStats>(token, "/dashboard");
}
