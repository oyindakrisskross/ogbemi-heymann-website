import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  ImagePlus,
  Plus,
  Save,
  Search,
  Trash2
} from "lucide-react";
import { adminRequest } from "../../api/client";
import type { Artwork, Exhibition } from "../../types";
import { exhibitionStatus } from "../../utils";
import { adminToken } from "./AdminLayout";

type AdminExhibition = Exhibition & {
  isPublished: boolean;
  workCount: number;
};

type SortKey = "startDate" | "endDate" | "title" | "status";
type SortDirection = "asc" | "desc";
type FilterStatus = "All" | "Ongoing" | "Upcoming" | "Past" | "Draft";

type WorkForm = {
  clientId: string;
  id?: string | number;
  title: string;
  year: string;
  material: string;
  dimensions: string;
  imageUrl: string;
  imageFile: File | null;
  imagePreview: string;
};

type ExhibitionForm = {
  id: string;
  slug: string;
  title: string;
  startDate: string;
  endDate: string;
  galleryName: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  excerpt: string;
  description: string;
  headliningImageUrl: string;
  headliningImageFile: File | null;
  headliningImagePreview: string;
  isPublished: boolean;
  works: WorkForm[];
};

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyWork(): WorkForm {
  return {
    clientId: createClientId(),
    title: "",
    year: "",
    material: "",
    dimensions: "",
    imageUrl: "",
    imageFile: null,
    imagePreview: ""
  };
}

function emptyForm(): ExhibitionForm {
  return {
    id: "",
    slug: "",
    title: "",
    startDate: "",
    endDate: "",
    galleryName: "",
    streetAddress: "",
    city: "",
    state: "",
    country: "",
    excerpt: "",
    description: "",
    headliningImageUrl: "",
    headliningImageFile: null,
    headliningImagePreview: "",
    isPublished: true,
    works: []
  };
}

function asDate(value: unknown) {
  return String(value || "").slice(0, 10);
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return value !== "false" && value !== "0";
  return true;
}

function normalizeWork(row: Record<string, unknown>): Artwork {
  const title = (row.title as string) || "";
  return {
    id: (row.id as string | number) || createClientId(),
    slug: (row.slug as string) || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title,
    year: (row.year as string) || "",
    dimensions: (row.dimensions as string) || "",
    material: (row.material as string) || "",
    series: (row.series as string) || "",
    available: asBoolean(row.available),
    imageUrl: (row.image_url as string) || (row.imageUrl as string) || ""
  };
}

function toAdminExhibition(row: Record<string, unknown>): AdminExhibition {
  const location = (row.location || {}) as Exhibition["location"];
  const works = Array.isArray(row.works) ? row.works : [];

  return {
    id: (row.id as string | number) || "",
    slug: (row.slug as string) || "",
    title: (row.title as string) || "",
    startDate: asDate(row.start_date || row.startDate),
    endDate: asDate(row.end_date || row.endDate),
    location: {
      galleryName: (row.gallery_name as string) || location.galleryName || "",
      streetAddress: (row.street_address as string) || location.streetAddress || "",
      city: (row.city as string) || location.city || "",
      state: (row.state as string) || location.state || "",
      country: (row.country as string) || location.country || ""
    },
    excerpt: (row.excerpt as string) || "",
    description: (row.description as string) || "",
    headliningImageUrl: (row.headlining_image_url as string) || (row.headliningImageUrl as string) || "",
    isPublished: asBoolean(row.is_published ?? row.isPublished),
    works: works.map((work) => normalizeWork(work as Record<string, unknown>)),
    workCount: Number(row.work_count ?? row.workCount ?? works.length),
    materials: []
  };
}

function formFromExhibition(item: AdminExhibition): ExhibitionForm {
  return {
    id: String(item.id),
    slug: item.slug,
    title: item.title,
    startDate: item.startDate,
    endDate: item.endDate,
    galleryName: item.location.galleryName,
    streetAddress: item.location.streetAddress || "",
    city: item.location.city,
    state: item.location.state || "",
    country: item.location.country,
    excerpt: item.excerpt,
    description: item.description,
    headliningImageUrl: item.headliningImageUrl,
    headliningImageFile: null,
    headliningImagePreview: item.headliningImageUrl,
    isPublished: item.isPublished,
    works: item.works.map((work) => ({
      clientId: `work-${work.id || createClientId()}`,
      id: work.id,
      title: work.title,
      year: work.year,
      material: work.material,
      dimensions: work.dimensions,
      imageUrl: work.imageUrl,
      imageFile: null,
      imagePreview: work.imageUrl
    }))
  };
}

function listStatus(item: AdminExhibition): FilterStatus {
  return item.isPublished ? exhibitionStatus(item) : "Draft";
}

function compareValues(a: string, b: string, direction: SortDirection) {
  const result = a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

export function ExhibitionsAdmin() {
  const [items, setItems] = useState<AdminExhibition[]>([]);
  const [form, setForm] = useState<ExhibitionForm>(() => emptyForm());
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");
  const [sortKey, setSortKey] = useState<SortKey>("startDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [status, setStatus] = useState("");
  const token = adminToken();

  async function refresh() {
    const rows = await adminRequest<Record<string, unknown>[]>(token, "/exhibitions");
    setItems(rows.map(toAdminExhibition));
  }

  useEffect(() => {
    refresh().catch((err) => {
      setStatus(err instanceof Error ? err.message : "Could not load exhibitions.");
    });
  }, []);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items
      .filter((item) => {
        const status = listStatus(item);
        const text = [
          item.title,
          item.location.galleryName,
          item.location.city,
          item.location.country,
          item.excerpt
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!normalizedQuery || text.includes(normalizedQuery)) &&
          (statusFilter === "All" || status === statusFilter)
        );
      })
      .sort((a, b) => {
        if (sortKey === "status") return compareValues(listStatus(a), listStatus(b), sortDirection);
        return compareValues(String(a[sortKey] || ""), String(b[sortKey] || ""), sortDirection);
      });
  }, [items, query, sortDirection, sortKey, statusFilter]);

  function setField(key: keyof ExhibitionForm, value: string | boolean | File | null) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setHeadlineFile(file: File | null) {
    setForm((current) => ({
      ...current,
      headliningImageFile: file,
      headliningImagePreview: file ? URL.createObjectURL(file) : current.headliningImageUrl
    }));
  }

  function setWorkField(clientId: string, key: keyof WorkForm, value: string | File | null) {
    setForm((current) => ({
      ...current,
      works: current.works.map((work) => (work.clientId === clientId ? { ...work, [key]: value } : work))
    }));
  }

  function setWorkFile(clientId: string, file: File | null) {
    setForm((current) => ({
      ...current,
      works: current.works.map((work) =>
        work.clientId === clientId
          ? {
              ...work,
              imageFile: file,
              imagePreview: file ? URL.createObjectURL(file) : work.imageUrl
            }
          : work
      )
    }));
  }

  async function openEditor(item: AdminExhibition) {
    setStatus("Loading exhibition...");
    const row = await adminRequest<Record<string, unknown>>(token, `/exhibitions/${item.id}`);
    setForm(formFromExhibition(toAdminExhibition(row)));
    setMode("edit");
    setStatus("");
  }

  function openEditorFromKeyboard(event: KeyboardEvent<HTMLTableRowElement>, item: AdminExhibition) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEditor(item);
    }
  }

  function createNew() {
    setForm(emptyForm());
    setMode("edit");
    setStatus("");
  }

  function backToList() {
    setMode("list");
    setForm(emptyForm());
    setStatus("");
  }

  function addWork() {
    setForm((current) => ({ ...current, works: [...current.works, emptyWork()] }));
  }

  function removeWork(clientId: string) {
    setForm((current) => ({ ...current, works: current.works.filter((work) => work.clientId !== clientId) }));
  }

  async function remove(id: string | number) {
    if (!window.confirm("Delete this exhibition?")) return;
    await adminRequest(token, `/exhibitions/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setStatus("Saving...");

    const data = new FormData();
    data.append("slug", form.slug);
    data.append("title", form.title);
    data.append("startDate", form.startDate);
    data.append("endDate", form.endDate);
    data.append(
      "location",
      JSON.stringify({
        galleryName: form.galleryName,
        streetAddress: form.streetAddress,
        city: form.city,
        state: form.state,
        country: form.country
      })
    );
    data.append("excerpt", form.excerpt);
    data.append("description", form.description);
    data.append("headliningImageUrl", form.headliningImageUrl);
    data.append("isPublished", String(form.isPublished));
    data.append("materials", "[]");
    data.append(
      "works",
      JSON.stringify(
        form.works.map((work) => ({
          clientId: work.clientId,
          title: work.title,
          year: work.year,
          material: work.material,
          dimensions: work.dimensions,
          imageUrl: work.imageUrl
        }))
      )
    );

    if (form.headliningImageFile) data.append("headliningImage", form.headliningImageFile);
    form.works.forEach((work) => {
      if (work.imageFile) data.append(`workImage:${work.clientId}`, work.imageFile);
    });

    const path = form.id ? `/exhibitions/${form.id}` : "/exhibitions";
    await adminRequest(token, path, {
      method: form.id ? "PUT" : "POST",
      body: data
    });

    await refresh();
    setStatus("Saved.");
    setMode("list");
    setForm(emptyForm());
  }

  function toggleDirection() {
    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  }

  if (mode === "edit") {
    return (
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={backToList}>
              <ArrowLeft size={18} />
              Back
            </button>
            <h1 className="font-display text-5xl">{form.id ? "Edit Exhibition" : "Create Exhibition"}</h1>
          </div>
        </div>

        <form onSubmit={save} className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-6">
            <section className="admin-card grid gap-4">
              <h2 className="text-xl font-semibold">Exhibition Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                  Title
                  <input
                    className="admin-input"
                    value={form.title}
                    onChange={(event) => setField("title", event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Start Date
                  <input
                    type="date"
                    className="admin-input"
                    value={form.startDate}
                    onChange={(event) => setField("startDate", event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  End Date
                  <input
                    type="date"
                    className="admin-input"
                    value={form.endDate}
                    onChange={(event) => setField("endDate", event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Gallery Name
                  <input
                    className="admin-input"
                    value={form.galleryName}
                    onChange={(event) => setField("galleryName", event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Street Address
                  <input
                    className="admin-input"
                    value={form.streetAddress}
                    onChange={(event) => setField("streetAddress", event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  City
                  <input
                    className="admin-input"
                    value={form.city}
                    onChange={(event) => setField("city", event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  State
                  <input
                    className="admin-input"
                    value={form.state}
                    onChange={(event) => setField("state", event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Country
                  <input
                    className="admin-input"
                    value={form.country}
                    onChange={(event) => setField("country", event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Publish
                  <select
                    className="admin-input"
                    value={form.isPublished ? "published" : "draft"}
                    onChange={(event) => setField("isPublished", event.target.value === "published")}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Excerpt
                <textarea
                  className="admin-input min-h-24"
                  value={form.excerpt}
                  onChange={(event) => setField("excerpt", event.target.value)}
                  maxLength={1000}
                />
                <span
                  className={`text-xs font-normal ${
                    form.excerpt.length >= 1000 ? "text-red-700" : "text-neutral-500"
                  }`}
                >
                  {form.excerpt.length} of 1,000 max characters
                </span>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Description
                <textarea
                  className="admin-input min-h-40"
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                />
              </label>
            </section>

            <section className="admin-card grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Works</h2>
                <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={addWork}>
                  <Plus size={18} />
                  Add Work
                </button>
              </div>

              {form.works.length === 0 && (
                <p className="border border-dashed border-[#d8d4cc] p-4 text-sm text-neutral-600">
                  Add works one by one, including image, name, creation date, medium, and size.
                </p>
              )}

              <div className="grid gap-4">
                {form.works.map((work, index) => (
                  <article key={work.clientId} className="grid gap-4 border border-[#dfdbd2] p-4 lg:grid-cols-[170px_1fr_auto]">
                    <div>
                      <div className="aspect-square overflow-hidden bg-[#e8e4dc]">
                        {work.imagePreview ? (
                          <img src={work.imagePreview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-neutral-500">
                            <ImagePlus size={28} />
                          </div>
                        )}
                      </div>
                      <label className="mt-3 grid gap-2 text-sm font-semibold">
                        Work Image
                        <input
                          type="file"
                          accept="image/*"
                          className="admin-input"
                          onChange={(event) => setWorkFile(work.clientId, event.target.files?.[0] || null)}
                          required={!work.imageUrl}
                        />
                      </label>
                    </div>
                    <div className="grid content-start gap-3 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                        Work Name
                        <input
                          className="admin-input"
                          value={work.title}
                          onChange={(event) => setWorkField(work.clientId, "title", event.target.value)}
                          required
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold">
                        Creation Date
                        <input
                          className="admin-input"
                          value={work.year}
                          onChange={(event) => setWorkField(work.clientId, "year", event.target.value)}
                          required
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold">
                        Medium
                        <input
                          className="admin-input"
                          value={work.material}
                          onChange={(event) => setWorkField(work.clientId, "material", event.target.value)}
                          required
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                        Size
                        <input
                          className="admin-input"
                          value={work.dimensions}
                          onChange={(event) => setWorkField(work.clientId, "dimensions", event.target.value)}
                          required
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="thin-button min-h-10 px-3 py-2 self-start"
                      onClick={() => removeWork(work.clientId)}
                      aria-label={`Remove work ${index + 1}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="admin-card grid content-start gap-4">
            <h2 className="text-xl font-semibold">Headlining Image</h2>
            <div className="aspect-[1.16/1] overflow-hidden bg-[#e8e4dc]">
              {form.headliningImagePreview ? (
                <img src={form.headliningImagePreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-500">
                  <ImagePlus size={32} />
                </div>
              )}
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              Upload Image
              <input
                type="file"
                accept="image/*"
                className="admin-input"
                onChange={(event) => setHeadlineFile(event.target.files?.[0] || null)}
                required={!form.headliningImageUrl}
              />
            </label>
            <button type="submit" className="thin-button">
              <Save size={18} />
              {form.id ? "Save Changes" : "Create Exhibition"}
            </button>
            {form.id && (
              <button type="button" className="thin-button" onClick={() => remove(form.id)}>
                <Trash2 size={16} />
                Delete Exhibition
              </button>
            )}
            {status && <p className="text-sm text-neutral-700">{status}</p>}
          </aside>
        </form>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-5xl">Exhibitions</h1>
        <button type="button" className="thin-button" onClick={createNew}>
          <Plus size={18} />
          Create New
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[minmax(220px,1fr)_220px_220px_auto]">
        <label className="grid gap-2 text-sm font-semibold">
          Search
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
              className="admin-input admin-input-with-icon"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Title, venue, city"
            />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Status
          <select className="admin-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}>
            <option value="All">All</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Past">Past</option>
            <option value="Draft">Draft</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Sort By
          <select className="admin-input" value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="startDate">Start Date</option>
            <option value="endDate">End Date</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
        </label>
        <button type="button" className="thin-button mt-auto min-h-10 px-3 py-2" onClick={toggleDirection}>
          <ArrowUpDown size={18} />
          {sortDirection === "asc" ? "Ascending" : "Descending"}
        </button>
      </div>

      <div className="mt-6 overflow-x-auto border border-[#dfdbd2] bg-white">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead className="bg-[#f0eee9] text-sm">
            <tr>
              <th className="px-4 py-3 font-semibold">Image</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Venue</th>
              <th className="px-4 py-3 font-semibold">Dates</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Works</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr
                key={item.id}
                tabIndex={0}
                className="cursor-pointer border-t border-[#dfdbd2] hover:bg-[#faf9f6] focus:bg-[#faf9f6] focus:outline-none"
                onClick={() => openEditor(item)}
                onKeyDown={(event) => openEditorFromKeyboard(event, item)}
              >
                <td className="px-4 py-3">
                  <img src={item.headliningImageUrl || "/assets/art-01.svg"} alt="" className="h-16 w-24 object-cover" />
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{item.title || "Untitled exhibition"}</p>
                  <p className="mt-1 max-w-xs truncate text-sm text-neutral-600">{item.excerpt}</p>
                </td>
                <td className="px-4 py-3 text-sm">
                  <p>{item.location.galleryName}</p>
                  <p className="text-neutral-600">
                    {[item.location.city, item.location.country].filter(Boolean).join(", ")}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.startDate} to {item.endDate}
                </td>
                <td className="px-4 py-3 text-sm">{listStatus(item)}</td>
                <td className="px-4 py-3 text-sm">{item.workCount}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="thin-button min-h-10 px-3 py-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      remove(item.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleItems.length === 0 && (
          <p className="border-t border-[#dfdbd2] p-6 text-sm text-neutral-600">No exhibitions match the current filters.</p>
        )}
      </div>
      {status && <p className="mt-4 text-sm text-neutral-700">{status}</p>}
    </section>
  );
}
