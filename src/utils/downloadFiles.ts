import type { DownloadableFile } from "../types";

export function downloadNameFor(fileUrl: string, files: DownloadableFile[], fallback?: string) {
  const match = files.find((file) => file.fileUrl === fileUrl);
  return match?.label || fallback || fileUrl.split("/").pop() || "download";
}
