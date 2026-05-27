import { FormEvent, useEffect, useState } from "react";
import { Check, Pencil, Trash2, Upload, X } from "lucide-react";
import { adminRequest } from "../../api/client";
import type { DownloadableFile } from "../../types";
import { adminToken } from "./AdminLayout";

function normalizeFile(row: Record<string, unknown>): DownloadableFile {
  return {
    id: (row.id as string | number) || "",
    label: (row.label as string) || "",
    fileUrl: (row.file_url as string) || (row.fileUrl as string) || "",
    fileType: (row.file_type as string) || (row.fileType as string) || "",
    context: (row.context as string) || "general"
  };
}

function extensionFrom(value: string) {
  const cleanValue = value.split("?")[0].split("#")[0];
  const match = cleanValue.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "";
}

function fileExtension(item: DownloadableFile) {
  return extensionFrom(item.fileUrl) || extensionFrom(item.label) || "file";
}

function fileBaseName(item: DownloadableFile) {
  const extension = fileExtension(item);
  const fallback = item.fileUrl.split("/").pop() || "Untitled";
  const name = item.label || fallback;
  return name.replace(new RegExp(`\\.${extension}$`, "i"), "");
}

function labelWithLockedExtension(name: string, extension: string) {
  const cleanName = name.trim().replace(/\.[a-z0-9]+$/i, "");
  return extension && extension !== "file" ? `${cleanName}.${extension}` : cleanName;
}

function isImageFile(item: DownloadableFile) {
  const extension = fileExtension(item);
  return Boolean(item.fileType?.startsWith("image/") || ["avif", "gif", "jpg", "jpeg", "png", "svg", "webp"].includes(extension));
}

export function FilesAdmin() {
  const [files, setFiles] = useState<DownloadableFile[]>([]);
  const [label, setLabel] = useState("");
  const [context, setContext] = useState("general");
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [status, setStatus] = useState("");
  const token = adminToken();

  async function refresh() {
    const rows = await adminRequest<Record<string, unknown>[]>(token, "/files");
    setFiles(rows.map(normalizeFile));
  }

  useEffect(() => {
    refresh().catch(() => setFiles([]));
  }, []);

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setStatus("Uploading...");
    const data = new FormData();
    data.append("file", file);
    data.append("label", label || file.name);
    data.append("context", context);
    await adminRequest(token, "/files", { method: "POST", body: data });
    setFile(null);
    setLabel("");
    setContext("general");
    setShowUploadForm(false);
    setStatus("Uploaded.");
    refresh();
  }

  function startRename(item: DownloadableFile) {
    setEditingId(item.id);
    setEditingName(fileBaseName(item));
  }

  async function saveRename(item: DownloadableFile) {
    const nextLabel = labelWithLockedExtension(editingName, fileExtension(item));
    if (!nextLabel) return;

    setStatus("Renaming...");
    await adminRequest(token, `/files/${item.id}`, {
      method: "PUT",
      body: JSON.stringify({ label: nextLabel })
    });
    setEditingId(null);
    setEditingName("");
    setStatus("Renamed.");
    refresh();
  }

  async function remove(id: string | number) {
    await adminRequest(token, `/files/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-5xl">Files</h1>
        <button type="button" className="thin-button" onClick={() => setShowUploadForm((current) => !current)}>
          <Upload size={18} />
          Upload New File
        </button>
      </div>

      {showUploadForm && (
        <form onSubmit={upload} className="admin-card mt-8 grid gap-4 lg:grid-cols-[1fr_220px_1fr_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-semibold">
            Name
            <input className="admin-input" value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Context
            <select className="admin-input" value={context} onChange={(event) => setContext(event.target.value)}>
              <option value="general">General</option>
              <option value="cv">Artist CV</option>
              <option value="catalogue">Available Works Catalogue</option>
              <option value="exhibition">Exhibition Material</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            File
            <input className="admin-input" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <button type="submit" className="thin-button min-h-10 px-3 py-2">
            Upload
          </button>
        </form>
      )}

      <div className="mt-8 overflow-x-auto border border-[#dfdbd2] bg-white">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead className="bg-[#f0eee9] text-sm">
            <tr>
              <th className="px-4 py-3 font-semibold">Preview</th>
              <th className="px-4 py-3 font-semibold">File Name</th>
              <th className="px-4 py-3 font-semibold">Context</th>
              <th className="px-4 py-3 font-semibold">URL</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((item) => {
              const extension = fileExtension(item);
              const isEditing = editingId === item.id;

              return (
                <tr key={item.id} className="border-t border-[#dfdbd2] hover:bg-[#faf9f6]">
                  <td className="px-4 py-3">
                    {isImageFile(item) ? (
                      <img src={item.fileUrl} alt="" className="h-16 w-24 object-cover" />
                    ) : (
                      <div className="flex h-16 w-24 items-center justify-center border border-[#dfdbd2] bg-[#f8f7f4] text-3xl font-black uppercase leading-none tracking-[0.08em]">
                        {extension}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="admin-input min-w-0"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                        />
                        {extension !== "file" && <span className="text-sm text-neutral-500">.{extension}</span>}
                      </div>
                    ) : (
                      <p className="font-semibold">{item.label || item.fileUrl.split("/").pop()}</p>
                    )}
                    {item.fileType && <p className="mt-1 text-xs text-neutral-500">{item.fileType}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm uppercase tracking-[0.14em] text-neutral-500">
                    {item.context || "general"}
                  </td>
                  <td className="px-4 py-3">
                    <a href={item.fileUrl} className="block max-w-xs truncate text-sm text-neutral-600" target="_blank">
                      {item.fileUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="thin-button min-h-10 px-3 py-2"
                          onClick={() => saveRename(item)}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          className="thin-button min-h-10 px-3 py-2"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="thin-button min-h-10 px-3 py-2"
                          onClick={() => startRename(item)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="thin-button min-h-10 px-3 py-2"
                          onClick={() => remove(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {files.length === 0 && <p className="border-t border-[#dfdbd2] p-6 text-sm text-neutral-600">No files uploaded yet.</p>}
      </div>
      {status && <p className="mt-4 text-sm text-neutral-700">{status}</p>}
    </section>
  );
}
