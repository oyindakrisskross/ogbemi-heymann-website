import { useEffect, useState } from "react";
import { adminRequest, getDashboardStats } from "../../api/client";
import type { DashboardStats } from "../../types";
import { exportMailingList, type MailingListExportRow } from "../../utils/mailingListExport";
import { adminToken } from "./AdminLayout";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [exportStatus, setExportStatus] = useState("");

  useEffect(() => {
    getDashboardStats(adminToken())
      .then(setStats)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load dashboard data.");
      });
  }, []);

  const tiles = [
    ["Exhibitions", stats?.exhibitionCount ?? 0],
    ["Articles", stats?.postCount ?? 0],
    ["Contact Forms", stats?.contactCount ?? 0],
    ["Mailing List", stats?.subscriberCount ?? 0]
  ];

  async function downloadMailingList(format: "csv" | "txt") {
    setExportStatus("Preparing export...");
    try {
      const subscribers = await adminRequest<MailingListExportRow[]>(adminToken(), "/mailing-list");
      exportMailingList(subscribers, format);
      setExportStatus(`Downloaded ${format.toUpperCase()} export.`);
    } catch (err) {
      setExportStatus(err instanceof Error ? err.message : "Could not export mailing list.");
    }
  }

  return (
    <section>
      <h1 className="font-display text-5xl">Dashboard</h1>
      {error && <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="admin-card">
            <p className="text-sm text-neutral-600">{label}</p>
            <p className="mt-4 text-4xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="admin-card mt-8 max-w-3xl">
        <h2 className="text-xl font-semibold">Setup Notes</h2>
        <p className="mt-3 leading-6 text-neutral-700">
          Public pages read from the API first and fall back to placeholder content while MySQL and
          Airtable are being configured. Contact forms, mailing list signups, exhibitions, files,
          and article posts persist to MySQL once the database credentials are added.
        </p>
      </div>
      <div className="admin-card mt-6 max-w-3xl">
        <h2 className="text-xl font-semibold">Mailing List Export</h2>
        <p className="mt-3 text-sm text-neutral-600">
          Download the current mailing list as a spreadsheet-ready CSV or a plain text email list.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={() => downloadMailingList("csv")}>
            Export CSV
          </button>
          <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={() => downloadMailingList("txt")}>
            Export TXT
          </button>
        </div>
        {exportStatus && <p className="mt-3 text-sm text-neutral-600">{exportStatus}</p>}
      </div>
    </section>
  );
}
