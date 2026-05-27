import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowUpDown,
  Eye,
  GripVertical,
  Image,
  Maximize2,
  Plus,
  Quote,
  Save,
  Search,
  Text,
  Trash2
} from "lucide-react";
import { adminRequest } from "../../api/client";
import type { BlogPost, ContentBlock } from "../../types";
import { adminToken } from "./AdminLayout";

type EditableBlock = ContentBlock & {
  imageFile?: File | null;
  imagePreview?: string;
};

type PostForm = {
  id: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageFile: File | null;
  coverImagePreview: string;
  isPublished: boolean;
  content: EditableBlock[];
};

type SortKey = "title" | "publishedAt" | "status" | "blocks";
type SortDirection = "asc" | "desc";
type FilterStatus = "All" | "Published" | "Draft";
type EditorMode = "blocks" | "page";

const imageAlignOptions: Array<{
  value: NonNullable<ContentBlock["imageAlign"]>;
  label: string;
  icon: typeof AlignLeft;
}> = [
  { value: "full", label: "Full", icon: Maximize2 },
  { value: "center", label: "Center", icon: AlignCenter },
  { value: "left", label: "Left Wrap", icon: AlignLeft },
  { value: "right", label: "Right Wrap", icon: AlignRight }
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function newPostForm(): PostForm {
  return {
    id: "",
    title: "",
    excerpt: "",
    coverImageUrl: "/assets/art-03.svg",
    coverImageFile: null,
    coverImagePreview: "/assets/art-03.svg",
    isPublished: true,
    content: [
      {
        id: createId(),
        type: "paragraph",
        value: "Start writing here."
      }
    ]
  };
}

function contentFromRow(row: Record<string, unknown>): EditableBlock[] {
  const content = row.content || row.content_json;
  let blocks: ContentBlock[] = [];

  if (Array.isArray(content)) blocks = content as ContentBlock[];
  if (typeof content === "string") {
    try {
      blocks = JSON.parse(content) as ContentBlock[];
    } catch {
      blocks = [];
    }
  }

  return blocks.map((block) => ({
    ...block,
    imageWidth: block.type === "image" ? block.imageWidth || 100 : block.imageWidth,
    imageAlign: block.type === "image" ? block.imageAlign || "full" : block.imageAlign,
    imagePreview: block.type === "image" ? block.value : undefined,
    imageFile: null
  }));
}

function normalizePost(row: Record<string, unknown>): BlogPost {
  return {
    id: (row.id as string | number) || "",
    slug: (row.slug as string) || "",
    title: (row.title as string) || "",
    excerpt: (row.excerpt as string) || "",
    coverImageUrl: (row.cover_image_url as string) || (row.coverImageUrl as string) || "/assets/art-03.svg",
    content: contentFromRow(row),
    isPublished: Boolean(row.is_published ?? row.isPublished),
    publishedAt: (row.published_at as string) || (row.publishedAt as string) || ""
  };
}

function postStatus(post: BlogPost): FilterStatus {
  return post.isPublished ? "Published" : "Draft";
}

function compareValues(a: string, b: string, direction: SortDirection) {
  const result = a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

function cleanBlock(block: EditableBlock): ContentBlock {
  const { imageFile, imagePreview, ...persisted } = block;
  return persisted;
}

type EditorProps = {
  blocks: EditableBlock[];
  onChange: (blocks: EditableBlock[]) => void;
};

function BlockEditor({ blocks, onChange }: EditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function update(index: number, patch: Partial<EditableBlock>) {
    onChange(blocks.map((block, blockIndex) => (blockIndex === index ? { ...block, ...patch } : block)));
  }

  function addBlock(type: ContentBlock["type"]) {
    onChange([
      ...blocks,
      {
        id: createId(),
        type,
        value: "",
        imageWidth: type === "image" ? 100 : undefined,
        imageAlign: type === "image" ? "full" : undefined
      }
    ]);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, blockIndex) => blockIndex !== index));
  }

  function drop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...blocks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDragIndex(null);
  }

  function setImageFile(index: number, file: File | null) {
    update(index, {
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : blocks[index].value
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={() => addBlock("paragraph")}>
          <Text size={16} />
          Text
        </button>
        <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={() => addBlock("image")}>
          <Image size={16} />
          Image
        </button>
        <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={() => addBlock("quote")}>
          <Quote size={16} />
          Quote
        </button>
      </div>

      {blocks.map((block, index) => (
        <div
          key={block.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => drop(index)}
          className="border border-[#dfdbd2] bg-[#fbfaf7] p-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              className="flex cursor-grab items-center gap-2 text-sm font-semibold capitalize active:cursor-grabbing"
            >
              <GripVertical size={16} />
              {block.type}
            </span>
            <button type="button" onClick={() => removeBlock(index)} aria-label="Remove block">
              <Trash2 size={16} />
            </button>
          </div>
          {block.type === "image" ? (
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-semibold">
                Image
                <input
                  type="file"
                  accept="image/*"
                  className="admin-input"
                  onChange={(event) => setImageFile(index, event.target.files?.[0] || null)}
                />
              </label>
              {(block.imagePreview || block.value) && (
                <img src={block.imagePreview || block.value} alt="" className="h-40 w-full object-cover" />
              )}
              <input
                className="admin-input"
                value={block.caption || ""}
                onChange={(event) => update(index, { caption: event.target.value })}
                placeholder="Caption"
              />
              <ImageLayoutControls block={block} onChange={(patch) => update(index, patch)} />
            </div>
          ) : (
            <textarea
              className="admin-input min-h-28"
              value={block.value}
              onChange={(event) => update(index, { value: event.target.value })}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ImageLayoutControls({
  block,
  onChange
}: {
  block: EditableBlock;
  onChange: (patch: Partial<EditableBlock>) => void;
}) {
  return (
    <div className="grid gap-3">
      <label className="grid gap-2 text-sm font-semibold">
        Image Width
        <input
          type="range"
          min={25}
          max={100}
          step={5}
          value={block.imageWidth || 100}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onDragStart={(event) => event.preventDefault()}
          onChange={(event) => onChange({ imageWidth: Number(event.target.value) })}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {imageAlignOptions.map((option) => {
          const Icon = option.icon;
          const isActive = (block.imageAlign || "full") === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`thin-button min-h-10 px-3 py-2 ${isActive ? "bg-black text-white" : ""}`}
              onClick={() => onChange({ imageAlign: option.value })}
            >
              <Icon size={16} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type PageEditorProps = {
  title: string;
  excerpt: string;
  coverImage: string;
  blocks: EditableBlock[];
  status: string;
  onChange: (blocks: EditableBlock[]) => void;
  onBack: () => void;
  onSave: () => void;
};

function PageEditor({ title, excerpt, coverImage, blocks, status, onChange, onBack, onSave }: PageEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function update(index: number, patch: Partial<EditableBlock>) {
    onChange(blocks.map((block, blockIndex) => (blockIndex === index ? { ...block, ...patch } : block)));
  }

  function drop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...blocks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDragIndex(null);
  }

  function setImageFile(index: number, file: File | null) {
    update(index, {
      imageFile: file,
      imagePreview: file ? URL.createObjectURL(file) : blocks[index].value
    });
  }

  function addBlock(type: ContentBlock["type"]) {
    onChange([
      ...blocks,
      {
        id: createId(),
        type,
        value: "",
        imageWidth: type === "image" ? 100 : undefined,
        imageAlign: type === "image" ? "full" : undefined
      }
    ]);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, blockIndex) => blockIndex !== index));
  }

  function dragHandle(index: number, label: string) {
    return (
      <span
        draggable
        onDragStart={() => setDragIndex(index)}
        onDragEnd={() => setDragIndex(null)}
        className="inline-flex cursor-grab items-center gap-2 text-sm font-semibold capitalize active:cursor-grabbing"
      >
        <GripVertical size={16} />
        {label}
      </span>
    );
  }

  function blockToolbar(index: number, label: string) {
    return (
      <div className="page-edit-toolbar">
        {dragHandle(index, label)}
        <button type="button" onClick={() => removeBlock(index)} aria-label="Remove block">
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  function renderEditableBlock(block: EditableBlock, index: number) {
    if (block.type === "image") {
      const width = Math.min(Math.max(block.imageWidth || 100, 25), 100);
      const align = block.imageAlign || "full";
      const isFloating = align === "left" || align === "right";

      return (
        <figure
          key={block.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => drop(index)}
          className={`article-image article-image-${align} page-edit-block`}
          style={{ width: isFloating ? `${width}%` : align === "center" ? `${width}%` : undefined }}
        >
          {blockToolbar(index, "image")}
          {(block.imagePreview || block.value) ? (
            <img src={block.imagePreview || block.value} alt={block.caption || ""} className="w-full object-cover" />
          ) : (
            <div className="flex aspect-[1.35/1] items-center justify-center bg-[#e8e4dc] text-sm text-neutral-600">
              No image selected
            </div>
          )}
          <div className="mt-3 grid gap-3 bg-white/95 p-3 shadow-sm">
            <label className="grid gap-2 text-sm font-semibold">
              Replace Image
              <input
                type="file"
                accept="image/*"
                className="admin-input"
                onChange={(event) => setImageFile(index, event.target.files?.[0] || null)}
              />
            </label>
            <input
              className="admin-input"
              value={block.caption || ""}
              onChange={(event) => update(index, { caption: event.target.value })}
              placeholder="Caption"
            />
            <ImageLayoutControls block={block} onChange={(patch) => update(index, patch)} />
          </div>
          {block.caption && <figcaption className="mt-2 text-sm text-neutral-600">{block.caption}</figcaption>}
        </figure>
      );
    }

    if (block.type === "quote") {
      return (
        <div
          key={block.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => drop(index)}
          className="article-quote page-edit-block"
        >
          {blockToolbar(index, "quote")}
          <textarea
            className="admin-input min-h-24 border-l-2 border-black pl-6 font-display text-3xl leading-tight"
            value={block.value}
            onChange={(event) => update(index, { value: event.target.value })}
          />
        </div>
      );
    }

    return (
      <div
        key={block.id}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => drop(index)}
        className="page-edit-block"
      >
        {blockToolbar(index, "paragraph")}
        <textarea
          className="page-edit-textarea"
          value={block.value}
          onChange={(event) => update(index, { value: event.target.value })}
        />
      </div>
    );
  }

  const introBlocks = blocks.slice(0, 2);
  const quoteInIntro = introBlocks.some((block) => block.type === "quote");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f8f7f4] text-[#111111]">
      <header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-[#dfdbd2] bg-white/95 px-4 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={onBack}>
            <ArrowLeft size={18} />
            Blocks
          </button>
          <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={() => addBlock("paragraph")}>
            <Text size={16} />
            Text
          </button>
          <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={() => addBlock("image")}>
            <Image size={16} />
            Image
          </button>
          <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={() => addBlock("quote")}>
            <Quote size={16} />
            Quote
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {status && <p className="text-sm text-neutral-600">{status}</p>}
          <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={onSave}>
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </header>

      <main className="page-shell py-12">
        <article>
          <h1 className="mx-auto max-w-5xl text-center font-display text-[clamp(3rem,5vw,5rem)] leading-tight">
            {title || "Untitled Article"}
          </h1>
          {excerpt && <p className="mx-auto mt-5 max-w-2xl text-center text-neutral-700">{excerpt}</p>}
          {quoteInIntro ? (
            <>
              <img src={coverImage} alt="" className="mx-auto mt-16 aspect-square w-full max-w-xl object-cover" />
              <div className="mt-12">
                <div className="article-content text-[17px] leading-7">
                  {blocks.map((block, index) => renderEditableBlock(block, index))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_0.76fr]">
                <div className="article-content text-[17px] leading-7">
                  {introBlocks.map((block, offset) => renderEditableBlock(block, offset))}
                </div>
                <img src={coverImage} alt="" className="aspect-square w-full object-cover" />
              </div>
              <div className="mt-12">
                <div className="article-content text-[17px] leading-7">
                  {blocks.slice(2).map((block, offset) => renderEditableBlock(block, offset + 2))}
                </div>
              </div>
            </>
          )}
        </article>
      </main>
    </div>
  );
}

function coverPreview(form: PostForm) {
  return form.coverImagePreview || form.coverImageUrl || "/assets/art-03.svg";
}

function formFromPost(post: BlogPost): PostForm {
  return {
    id: String(post.id),
    title: post.title,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    coverImageFile: null,
    coverImagePreview: post.coverImageUrl,
    isPublished: post.isPublished,
    content: post.content.length ? contentFromRow({ content: post.content }) : []
  };
}

export function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<PostForm>(() => newPostForm());
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editorMode, setEditorMode] = useState<EditorMode>("blocks");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");
  const [sortKey, setSortKey] = useState<SortKey>("publishedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [status, setStatus] = useState("");
  const token = adminToken();

  async function refresh() {
    const rows = await adminRequest<Record<string, unknown>[]>(token, "/blog");
    setPosts(rows.map(normalizePost));
  }

  useEffect(() => {
    refresh().catch(() => setPosts([]));
  }, []);

  const visiblePosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return posts
      .filter((post) => {
        const status = postStatus(post);
        const searchableText = [post.title, post.excerpt, post.publishedAt, status]
          .join(" ")
          .toLowerCase();

        return (
          (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
          (statusFilter === "All" || status === statusFilter)
        );
      })
      .sort((a, b) => {
        if (sortKey === "status") return compareValues(postStatus(a), postStatus(b), sortDirection);
        if (sortKey === "blocks") return compareValues(String(a.content.length), String(b.content.length), sortDirection);
        return compareValues(String(a[sortKey] || ""), String(b[sortKey] || ""), sortDirection);
      });
  }, [posts, query, sortDirection, sortKey, statusFilter]);

  function edit(post: BlogPost) {
    setForm(formFromPost(post));
    setEditorMode("blocks");
    setMode("edit");
    setStatus("");
  }

  function createNew() {
    setForm(newPostForm());
    setEditorMode("blocks");
    setMode("edit");
    setStatus("");
  }

  function backToList() {
    setForm(newPostForm());
    setMode("list");
    setStatus("");
  }

  function openEditorFromKeyboard(event: KeyboardEvent<HTMLTableRowElement>, post: BlogPost) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      edit(post);
    }
  }

  function setCoverFile(file: File | null) {
    setForm((current) => ({
      ...current,
      coverImageFile: file,
      coverImagePreview: file ? URL.createObjectURL(file) : current.coverImageUrl
    }));
  }

  async function save(event?: FormEvent) {
    event?.preventDefault();
    setStatus("Saving...");

    const data = new FormData();
    data.append("title", form.title);
    data.append("excerpt", form.excerpt);
    data.append("coverImageUrl", form.coverImageUrl);
    data.append("isPublished", String(form.isPublished));
    data.append("content", JSON.stringify(form.content.map(cleanBlock)));

    if (form.coverImageFile) data.append("coverImage", form.coverImageFile);
    form.content.forEach((block) => {
      if (block.type === "image" && block.imageFile) {
        data.append(`contentImage:${block.id}`, block.imageFile);
      }
    });

    await adminRequest(token, form.id ? `/blog/${form.id}` : "/blog", {
      method: form.id ? "PUT" : "POST",
      body: data
    });

    setForm(newPostForm());
    setStatus("Saved.");
    await refresh();
    setMode("list");
  }

  async function remove(id: string | number) {
    if (!window.confirm("Delete this article?")) return;
    await adminRequest(token, `/blog/${id}`, { method: "DELETE" });
    await refresh();
    if (form.id === String(id)) {
      setForm(newPostForm());
      setMode("list");
    }
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
            <h1 className="font-display text-5xl">{form.id ? "Edit Article" : "Create Article"}</h1>
          </div>
        </div>

        <form onSubmit={save} className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5">
            <section className="admin-card grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Article Details</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`thin-button min-h-10 px-3 py-2 ${editorMode === "blocks" ? "bg-black text-white" : ""}`}
                    onClick={() => setEditorMode("blocks")}
                  >
                    Blocks
                  </button>
                  <button
                    type="button"
                    className={`thin-button min-h-10 px-3 py-2 ${editorMode === "page" ? "bg-black text-white" : ""}`}
                    onClick={() => setEditorMode("page")}
                  >
                    <Eye size={16} />
                    Edit In Page
                  </button>
                </div>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Title
                <input
                  className="admin-input"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Excerpt
                <textarea
                  className="admin-input min-h-24"
                  value={form.excerpt}
                  onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
                />
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
                />
                Published
              </label>
            </section>

            {editorMode === "blocks" ? (
              <section className="admin-card">
                <BlockEditor
                  blocks={form.content}
                  onChange={(content) => setForm((current) => ({ ...current, content }))}
                />
              </section>
            ) : (
              <PageEditor
                title={form.title}
                excerpt={form.excerpt}
                coverImage={coverPreview(form)}
                blocks={form.content}
                status={status}
                onChange={(content) => setForm((current) => ({ ...current, content }))}
                onBack={() => setEditorMode("blocks")}
                onSave={() => save()}
              />
            )}
          </div>

          <aside className="admin-card grid content-start gap-4">
            <h2 className="text-xl font-semibold">Cover Image</h2>
            <img src={coverPreview(form)} alt="" className="aspect-square w-full object-cover" />
            <label className="grid gap-2 text-sm font-semibold">
              Upload Cover
              <input
                type="file"
                accept="image/*"
                className="admin-input"
                onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
              />
            </label>
            <button type="submit" className="thin-button">
              <Save size={18} />
              {form.id ? "Save Changes" : "Create Article"}
            </button>
            {form.id && (
              <button type="button" className="thin-button" onClick={() => remove(form.id)}>
                <Trash2 size={16} />
                Delete Article
              </button>
            )}
            {status && <p className="text-sm">{status}</p>}
            <p className="text-sm text-neutral-600">
              Use left or right image alignment to let nearby paragraph text wrap around the image on the website.
            </p>
          </aside>
        </form>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-5xl">Articles</h1>
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
              placeholder="Title, excerpt, date"
            />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Status
          <select className="admin-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FilterStatus)}>
            <option value="All">All</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Sort By
          <select className="admin-input" value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="publishedAt">Published Date</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
            <option value="blocks">Blocks</option>
          </select>
        </label>
        <button type="button" className="thin-button mt-auto min-h-10 px-3 py-2" onClick={toggleDirection}>
          <ArrowUpDown size={18} />
          {sortDirection === "asc" ? "Ascending" : "Descending"}
        </button>
      </div>

      <div className="mt-6 overflow-x-auto border border-[#dfdbd2] bg-white">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead className="bg-[#f0eee9] text-sm">
            <tr>
              <th className="px-4 py-3 font-semibold">Cover</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Published</th>
              <th className="px-4 py-3 font-semibold">Blocks</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visiblePosts.map((post) => (
              <tr
                key={post.id}
                tabIndex={0}
                className="cursor-pointer border-t border-[#dfdbd2] hover:bg-[#faf9f6] focus:bg-[#faf9f6] focus:outline-none"
                onClick={() => edit(post)}
                onKeyDown={(event) => openEditorFromKeyboard(event, post)}
              >
                <td className="px-4 py-3">
                  <img src={post.coverImageUrl} alt="" className="h-16 w-24 object-cover" />
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{post.title || "Untitled article"}</p>
                  <p className="mt-1 max-w-md truncate text-sm text-neutral-600">{post.excerpt}</p>
                </td>
                <td className="px-4 py-3 text-sm">{post.isPublished ? "Published" : "Draft"}</td>
                <td className="px-4 py-3 text-sm">{post.publishedAt ? String(post.publishedAt).slice(0, 10) : "Not published"}</td>
                <td className="px-4 py-3 text-sm">{post.content.length}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="thin-button min-h-10 px-3 py-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      remove(post.id);
                    }}
                    aria-label={`Delete ${post.title || "article"}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visiblePosts.length === 0 && (
          <p className="border-t border-[#dfdbd2] p-6 text-sm text-neutral-600">
            {posts.length === 0 ? "No articles have been created yet." : "No articles match the current filters."}
          </p>
        )}
      </div>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </section>
  );
}
