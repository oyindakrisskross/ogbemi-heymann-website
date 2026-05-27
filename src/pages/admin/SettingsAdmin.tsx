import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { adminRequest } from "../../api/client";
import type { DownloadableFile, SiteSettings } from "../../types";
import { adminToken } from "./AdminLayout";

const emptySettings: SiteSettings & { airtable: NonNullable<SiteSettings["airtable"]> & { apiKey: string } } = {
  artistEmail: "",
  pressEmail: "",
  instagramUrl: "",
  cvFileUrl: "",
  catalogueFileUrl: "",
  airtable: {
    baseId: "",
    tableName: "Works",
    hasApiKey: false,
    apiKey: ""
  }
};

type SettingsForm = typeof emptySettings;
type PublicTextField = "artistEmail" | "pressEmail" | "instagramUrl";

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
  return extensionFrom(item.fileUrl) || extensionFrom(item.label);
}

function isDocumentFile(item: DownloadableFile) {
  const extension = fileExtension(item);
  const fileType = item.fileType || "";
  return (
    ["pdf", "doc", "docx", "txt"].includes(extension) ||
    fileType.includes("pdf") ||
    fileType.includes("word") ||
    fileType.includes("text")
  );
}

function filesForSetting(files: DownloadableFile[], context: "cv" | "catalogue") {
  return files.filter((file) => isDocumentFile(file) && (!file.context || file.context === "general" || file.context === context));
}

export function SettingsAdmin() {
  const [form, setForm] = useState<SettingsForm>(emptySettings);
  const [files, setFiles] = useState<DownloadableFile[]>([]);
  const [status, setStatus] = useState("");
  const token = adminToken();

  useEffect(() => {
    adminRequest<SiteSettings>(token, "/settings")
      .then((settings) =>
        setForm({
          ...emptySettings,
          ...settings,
          airtable: {
            ...emptySettings.airtable,
            ...(settings.airtable || {}),
            apiKey: ""
          }
        })
      )
      .catch(() => undefined);
    adminRequest<Record<string, unknown>[]>(token, "/files")
      .then((rows) => setFiles(rows.map(normalizeFile)))
      .catch(() => setFiles([]));
  }, [token]);

  function setField(key: PublicTextField, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setAirtableField(key: keyof SettingsForm["airtable"], value: string) {
    setForm((current) => ({
      ...current,
      airtable: { ...current.airtable, [key]: value }
    }));
  }

  function setFileField(key: "cvFileUrl" | "catalogueFileUrl", value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setStatus("Saving...");
    await adminRequest(token, "/settings", {
      method: "PUT",
      body: JSON.stringify(form)
    });
    setStatus("Saved.");
  }

  const cvFiles = filesForSetting(files, "cv");
  const catalogueFiles = filesForSetting(files, "catalogue");

  return (
    <section>
      <h1 className="font-display text-5xl">Settings</h1>
      <form onSubmit={save} className="mt-8 grid max-w-4xl gap-6">
        <div className="admin-card grid gap-4">
          <h2 className="text-xl font-semibold">Public Site</h2>
          {[
            ["artistEmail", "Artist Email"],
            ["pressEmail", "Press Email"],
            ["instagramUrl", "Instagram URL"]
          ].map(([key, label]) => (
            <label key={key} className="grid gap-2 text-sm font-semibold">
              {label}
              <input
                className="admin-input"
                value={form[key as PublicTextField]}
                onChange={(event) => setField(key as PublicTextField, event.target.value)}
              />
            </label>
          ))}

          <label className="grid gap-2 text-sm font-semibold">
            Artist CV
            <select
              className="admin-input"
              value={form.cvFileUrl}
              onChange={(event) => setFileField("cvFileUrl", event.target.value)}
            >
              <option value="">Select uploaded CV file</option>
              {form.cvFileUrl && !cvFiles.some((file) => file.fileUrl === form.cvFileUrl) && (
                <option value={form.cvFileUrl}>Current file</option>
              )}
              {cvFiles.map((file) => (
                <option key={file.id} value={file.fileUrl}>
                  {file.label || file.fileUrl}
                </option>
              ))}
            </select>
            {form.cvFileUrl && (
              <a href={form.cvFileUrl} className="break-all text-sm font-normal text-neutral-600" target="_blank">
                Current file: {form.cvFileUrl}
              </a>
            )}
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Available Works Catalogue
            <select
              className="admin-input"
              value={form.catalogueFileUrl}
              onChange={(event) => setFileField("catalogueFileUrl", event.target.value)}
            >
              <option value="">Select uploaded catalogue file</option>
              {form.catalogueFileUrl && !catalogueFiles.some((file) => file.fileUrl === form.catalogueFileUrl) && (
                <option value={form.catalogueFileUrl}>Current file</option>
              )}
              {catalogueFiles.map((file) => (
                <option key={file.id} value={file.fileUrl}>
                  {file.label || file.fileUrl}
                </option>
              ))}
            </select>
            {form.catalogueFileUrl && (
              <a
                href={form.catalogueFileUrl}
                className="break-all text-sm font-normal text-neutral-600"
                target="_blank"
              >
                Current file: {form.catalogueFileUrl}
              </a>
            )}
          </label>
        </div>

        <div className="admin-card grid gap-4">
          <h2 className="text-xl font-semibold">Airtable Connection</h2>
          <p className="text-sm text-neutral-600">
            API keys are stored server-side. Leave the key blank to keep the current key.
          </p>
          <label className="grid gap-2 text-sm font-semibold">
            API Key
            <input
              className="admin-input"
              type="password"
              value={form.airtable.apiKey}
              placeholder={form.airtable.hasApiKey ? "Configured" : "Not configured"}
              onChange={(event) => setAirtableField("apiKey", event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Base ID
            <input
              className="admin-input"
              value={form.airtable.baseId}
              onChange={(event) => setAirtableField("baseId", event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Table Name
            <input
              className="admin-input"
              value={form.airtable.tableName}
              onChange={(event) => setAirtableField("tableName", event.target.value)}
            />
          </label>
        </div>

        <button type="submit" className="thin-button w-fit">
          <Save size={18} />
          Save Settings
        </button>
        {status && <p className="text-sm">{status}</p>}
      </form>
    </section>
  );
}
