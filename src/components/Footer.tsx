import { useEffect, useState } from "react";
import { getDownloads, getSettings } from "../api/client";
import type { DownloadableFile, SiteSettings } from "../types";
import { downloadNameFor } from "../utils/downloadFiles";

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [files, setFiles] = useState<DownloadableFile[]>([]);

  useEffect(() => {
    getSettings().then(setSettings);
    getDownloads().then(setFiles).catch(() => setFiles([]));
  }, []);

  const cvFileUrl = settings?.cvFileUrl || "/downloads/ogbemi-heymann-cv.txt";

  return (
    <footer className="mt-20 bg-[#f0eee9] py-16 text-black">
      <div className="page-shell flex flex-wrap items-center justify-center gap-x-16 gap-y-4 text-sm">
        <a href={cvFileUrl} download={downloadNameFor(cvFileUrl, files, "ogbemi-heymann-cv.txt")}>
          Download CV
        </a>
        <a
          href={settings?.instagramUrl || "https://www.instagram.com/"}
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>
        <span>Copyright {new Date().getFullYear()} Ogbemi Heymann</span>
      </div>
    </footer>
  );
}
