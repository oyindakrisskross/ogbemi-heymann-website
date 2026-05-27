import express from "express";
import { tryQuery } from "../db.js";
import {
  blogPosts,
  contactSubmissions,
  downloadableFiles,
  exhibitions,
  mailingList,
  settings
} from "../mockData.js";
import { getWorks, getWorksMetadata } from "../services/airtable.js";
import { sendArtistNotification } from "../services/email.js";

export const publicRouter = express.Router();

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function asDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function normalizeExhibition(row, works = [], materials = []) {
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
    works,
    materials
  };
}

function normalizePost(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || "",
    coverImageUrl: row.cover_image_url || row.coverImageUrl || "/assets/art-03.svg",
    content:
      row.content ||
      (typeof row.content_json === "string" ? JSON.parse(row.content_json) : row.content_json) ||
      [],
    isPublished: row.is_published ?? row.isPublished ?? true,
    publishedAt: row.published_at || row.publishedAt || row.created_at
  };
}

async function loadPublishedExhibitions() {
  const rows = await tryQuery(
    "SELECT * FROM exhibitions WHERE is_published = TRUE ORDER BY start_date DESC"
  );
  if (!rows) return exhibitions.map((item) => normalizeExhibition(item, item.works, item.materials));
  return rows.map((row) => normalizeExhibition(row));
}

async function loadExhibitionBySlug(slug) {
  const rows = await tryQuery(
    "SELECT * FROM exhibitions WHERE slug = ? AND is_published = TRUE LIMIT 1",
    [slug]
  );
  if (!rows) {
    const found = exhibitions.find((item) => item.slug === slug);
    return found ? normalizeExhibition(found, found.works, found.materials) : null;
  }
  if (!rows[0]) return null;

  const workRows =
    (await tryQuery("SELECT * FROM exhibition_works WHERE exhibition_id = ? ORDER BY display_order, id", [
      rows[0].id
    ])) || [];
  const materialRows =
    (await tryQuery(
      "SELECT * FROM downloadable_files WHERE exhibition_id = ? ORDER BY display_order, id",
      [rows[0].id]
    )) || [];

  return normalizeExhibition(
    rows[0],
    workRows.map((work) => ({
      id: work.id,
      title: work.title,
      year: work.year,
      dimensions: work.dimensions,
      material: work.material,
      imageUrl: work.image_url
    })),
    materialRows.map((file) => ({
      id: file.id,
      label: file.label,
      fileUrl: file.file_url,
      fileType: file.file_type
    }))
  );
}

function featuredExhibition(items) {
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

publicRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const rows = await tryQuery("SELECT * FROM site_settings WHERE id = 1 LIMIT 1");
    const row = rows?.[0];
    if (!row) return res.json(settings);
    return res.json({
      artistEmail: row.artist_email,
      pressEmail: row.press_email,
      instagramUrl: row.instagram_url,
      cvFileUrl: row.cv_file_url,
      catalogueFileUrl: row.catalogue_file_url
    });
  })
);

publicRouter.get(
  "/works/metadata",
  asyncHandler(async (req, res) => {
    const payload = await getWorksMetadata(req.query);
    res.json(payload);
  })
);

publicRouter.get(
  "/works",
  asyncHandler(async (req, res) => {
    const payload = await getWorks(req.query);
    res.json(payload);
  })
);

publicRouter.get(
  "/exhibitions/featured",
  asyncHandler(async (_req, res) => {
    const items = await loadPublishedExhibitions();
    res.json(featuredExhibition(items));
  })
);

publicRouter.get(
  "/exhibitions",
  asyncHandler(async (_req, res) => {
    const items = await loadPublishedExhibitions();
    res.json(items);
  })
);

publicRouter.get(
  "/exhibitions/:slug",
  asyncHandler(async (req, res) => {
    const exhibition = await loadExhibitionBySlug(req.params.slug);
    if (!exhibition) return res.status(404).json({ error: "Exhibition not found" });
    res.json(exhibition);
  })
);

publicRouter.get(
  "/blog",
  asyncHandler(async (_req, res) => {
    const rows = await tryQuery(
      "SELECT * FROM blog_posts WHERE is_published = TRUE ORDER BY COALESCE(published_at, created_at) DESC"
    );
    if (!rows) return res.json(blogPosts.filter((post) => post.isPublished).map(normalizePost));
    res.json(rows.map(normalizePost));
  })
);

publicRouter.get(
  "/blog/:slug",
  asyncHandler(async (req, res) => {
    const rows = await tryQuery(
      "SELECT * FROM blog_posts WHERE slug = ? AND is_published = TRUE LIMIT 1",
      [req.params.slug]
    );
    const post = rows
      ? rows[0] && normalizePost(rows[0])
      : blogPosts.find((item) => item.slug === req.params.slug);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(normalizePost(post));
  })
);

publicRouter.get(
  "/downloads",
  asyncHandler(async (_req, res) => {
    const rows = await tryQuery("SELECT * FROM downloadable_files ORDER BY display_order, id");
    if (!rows) return res.json(downloadableFiles);
    res.json(
      rows.map((file) => ({
        id: file.id,
        label: file.label,
        fileUrl: file.file_url,
        fileType: file.file_type,
        context: file.context
      }))
    );
  })
);

publicRouter.post(
  "/contact",
  asyncHandler(async (req, res) => {
    const { name, email, message, artworkTitle, source } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }

    const result = await tryQuery(
      "INSERT INTO contact_submissions (name, email, message, artwork_title, source) VALUES (?, ?, ?, ?, ?)",
      [name, email, message, artworkTitle || null, source || "website"]
    );

    if (!result) {
      contactSubmissions.unshift({
        id: Date.now(),
        name,
        email,
        message,
        artworkTitle,
        source: source || "website",
        createdAt: new Date().toISOString()
      });
    }

    await sendArtistNotification({
      subject: "New website enquiry",
      text: `Name: ${name}\nEmail: ${email}\nArtwork: ${artworkTitle || "N/A"}\n\n${message}`
    });

    res.status(201).json({ ok: true });
  })
);

publicRouter.post(
  "/mailing-list",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const result = await tryQuery(
      "INSERT INTO mailing_list_subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE email = VALUES(email)",
      [email]
    );

    if (!result && !mailingList.some((item) => item.email === email)) {
      mailingList.unshift({ id: Date.now(), email, createdAt: new Date().toISOString() });
    }

    await sendArtistNotification({
      subject: "New mailing list signup",
      text: `${email} joined the mailing list.`
    });

    res.status(201).json({ ok: true });
  })
);
