import { useCallback, useEffect, useRef, useState } from "react";
import { ArtworkGrid } from "../components/ArtworkGrid";
import { Lightbox } from "../components/Lightbox";
import { RotatingLoader } from "../components/RotatingLoader";
import { getAllWorks, getDownloads, getSettings, getWorks } from "../api/client";
import type { Artwork, DownloadableFile, SiteSettings } from "../types";
import { Reveal } from "../components/Reveal";
import { Footer } from "../components/Footer";
import { downloadNameFor } from "../utils/downloadFiles";

export function AvailableWorks() {
  const [works, setWorks] = useState<Artwork[]>([]);
  const [lightboxWorks, setLightboxWorks] = useState<Artwork[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [files, setFiles] = useState<DownloadableFile[]>([]);
  const [isLoadingWorks, setIsLoadingWorks] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async (targetPage: number) => {
    if (targetPage === 1) setIsLoadingWorks(true);
    else setIsLoadingMore(true);

    try {
      const payload = await getWorks({ available: true, page: targetPage, pageSize: 12 });
      setWorks((current) => (targetPage === 1 ? payload.items : [...current, ...payload.items]));
      setHasMore(payload.hasMore);
      setPage(targetPage);
    } finally {
      if (targetPage === 1) setIsLoadingWorks(false);
      else setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
    getSettings().then(setSettings);
    getDownloads().then(setFiles).catch(() => setFiles([]));
  }, [loadPage]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore || isLoadingWorks) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) {
          observer.disconnect();
          loadPage(page + 1);
        }
      },
      { rootMargin: "360px 0px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoadingWorks, loadPage, page, works.length]);

  async function openLightbox(gridIndex: number) {
    const selected = works[gridIndex];
    if (!selected) return;

    const immediateSource = lightboxWorks.length ? lightboxWorks : works;
    const immediateIndex = immediateSource.findIndex((work) => String(work.id) === String(selected.id));
    setLightboxWorks(immediateSource);
    setLightboxIndex(immediateIndex >= 0 ? immediateIndex : gridIndex);

    if (lightboxWorks.length) return;

    const source = await getAllWorks({ available: true });
    setLightboxWorks(source);
    const sourceIndex = source.findIndex((work) => String(work.id) === String(selected?.id));
    setLightboxIndex(sourceIndex >= 0 ? sourceIndex : gridIndex);
  }

  const catalogueFileUrl = settings?.catalogueFileUrl || "/downloads/available-works-catalogue.txt";

  return (
    <>
    <main className="page-shell py-20">
      <section className="text-center">
        <h1 className="page-heading-enter font-display text-[clamp(3.25rem,6vw,5.2rem)]">Available Works</h1>
        <p className="page-subheading-enter mx-auto mt-6 max-w-2xl text-lg">
          <strong>Explore a curated selection of available works from Heymann's studio.</strong>
          <br />
          Each piece marks a focused moment within his evolving practice.
        </p>
      </section>

      <section className="mt-24">
        {isLoadingWorks ? (
          <RotatingLoader />
        ) : (
          <>
            <ArtworkGrid artworks={works} onImageClick={openLightbox} showArtworkDetails animateRows />
            {hasMore && <div ref={loadMoreRef} className="h-px" aria-hidden="true" />}
            {isLoadingMore && <RotatingLoader />}
          </>
        )}
      </section>

      <div className="mt-20 flex flex-col items-center gap-10">
        <a
          href={catalogueFileUrl}
          download={downloadNameFor(catalogueFileUrl, files, "available-works-catalogue.txt")}
          className="soft-button"
        >
          Download 2026 Collector Catalogue
        </a>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          artworks={lightboxWorks.length ? lightboxWorks : works}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
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
