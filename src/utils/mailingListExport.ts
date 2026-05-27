export type MailingListExportRow = {
  email: string;
  created_at?: string;
  createdAt?: string;
};

type ExportFormat = "csv" | "txt";

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function createdAt(row: MailingListExportRow) {
  return row.created_at || row.createdAt || "";
}

function mailingListCsv(rows: MailingListExportRow[]) {
  return [
    ["email", "created_at"].map(csvCell).join(","),
    ...rows.map((row) => [row.email, createdAt(row)].map(csvCell).join(","))
  ].join("\r\n");
}

function mailingListTxt(rows: MailingListExportRow[]) {
  return rows.map((row) => row.email).join("\r\n");
}

export function exportMailingList(rows: MailingListExportRow[], format: ExportFormat) {
  const content = format === "csv" ? mailingListCsv(rows) : mailingListTxt(rows);
  const mime = format === "csv" ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8";
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `mailing-list-${date}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
