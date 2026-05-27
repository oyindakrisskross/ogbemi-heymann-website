import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDownloads, getSettings } from "../api/client";
import type { DownloadableFile, SiteSettings } from "../types";
import { Reveal } from "../components/Reveal";
import { Footer } from "../components/Footer";
import { downloadNameFor } from "../utils/downloadFiles";

export function About() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [files, setFiles] = useState<DownloadableFile[]>([]);

  useEffect(() => {
    getSettings().then(setSettings);
    getDownloads().then(setFiles).catch(() => setFiles([]));
  }, []);

  const cvFileUrl = settings?.cvFileUrl || "/downloads/ogbemi-heymann-cv.txt";

  return (
    <>
    <main className="page-shell py-20">
      <section className="grid items-center gap-16 md:grid-cols-[1fr_0.72fr]">
        <div>
          <h1 className="page-heading-enter font-display text-5xl">About Ogbemi Heymann</h1>
          <div className="about-copy-enter">
            <p className="mt-12 max-w-2xl text-lg leading-7">
              Ogbemi Heymann is a Nigerian expressionist painter whose work examines governance,
              resource politics, and communal identity. Working primarily in square compositions, he
              constructs restrained yet psychologically charged scenes that reflect social structures,
              economic tension, and the fragility of collective memory.
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-7">
              Through recurring motifs, clustered bodies, and satirical allegories, Heymann
              investigates the systems that shape both individual and communal life.
            </p>
          </div>
          <a
            href={cvFileUrl}
            download={downloadNameFor(cvFileUrl, files, "ogbemi-heymann-cv.txt")}
            className="wipe-button-enter thin-button mt-12"
          >
            Download Ogbemi's CV
          </a>
        </div>
        <img
          src="/assets/untitled-cold.jpg"
          alt="Ogbemi Heymann"
          className="about-image-enter mx-auto w-full max-w-sm"
        />
      </section>
      <Reveal
      effect="fade" 
      >
        <p className="mt-24 text-center page-body-after-heading">
        <strong>Interested in current works?</strong>{" "}
        <Link to="/available-works" className="border-b border-black">
          View Available Works
        </Link>
      </p>
      </Reveal>
    </main>
    <Reveal 
    as="div" 
    effect="fade-up" 
    className="page-body-after-heading"
    >
      <Footer />
    </Reveal>
    </>
  );
}
