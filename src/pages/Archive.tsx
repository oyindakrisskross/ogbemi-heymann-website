import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, LoaderCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { getAllWorks, getWorks, getWorksMetadata } from "../api/client";
import { ArtworkGrid } from "../components/ArtworkGrid";
import { Lightbox } from "../components/Lightbox";
import { RotatingLoader } from "../components/RotatingLoader";
import type { Artwork, WorksMetadata } from "../types";
import { Reveal } from "../components/Reveal";
import { Footer } from "../components/Footer";

type SortKey = "year" | "title" | "series" | "material" | "dimensions";
type SortDirection = "asc" | "desc";
type ArchiveFilters = {
  query: string;
  year: string;
  series: string;
  size: string;
  sortKey: SortKey;
  sortDirection: SortDirection;
};

const pageSize = 12;
const emptyMetadata: WorksMetadata = {
  years: [],
  series: [],
  sizes: []
};

function archiveParams(filters: ArchiveFilters): Record<string, string | number | boolean | undefined> {
  return {
    query: filters.query,
    year: filters.year,
    series: filters.series,
    size: filters.size,
    sortKey: filters.sortKey,
    sortDirection: filters.sortDirection
  };
}

export function Archive() {
  const [works, setWorks] = useState<Artwork[]>([]);
  const [metadata, setMetadata] = useState<WorksMetadata>(emptyMetadata);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [series, setSeries] = useState("");
  const [size, setSize] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("year");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxWorks, setLightboxWorks] = useState<Artwork[]>([]);
  const [lightboxSourceKey, setLightboxSourceKey] = useState("");
  const [isLoadingWorks, setIsLoadingWorks] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const requestIdRef = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const filters = useMemo(
    () => ({ query, year, series, size, sortKey, sortDirection }),
    [query, series, size, sortDirection, sortKey, year]
  );
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  const workParams = useMemo(() => archiveParams(filters), [filters]);
  const hasActiveFilters = Boolean(query || year || series || size);

  useEffect(() => {
    let ignore = false;
    setIsLoadingFilters(true);

    getWorksMetadata()
      .then((payload) => {
        if (!ignore) setMetadata(payload);
      })
      .finally(() => {
        if (!ignore) setIsLoadingFilters(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingWorks(true);
    setIsLoadingMore(false);
    setPage(1);
    setHasMore(false);
    setLightboxWorks([]);
    setLightboxSourceKey("");

    getWorks({ ...workParams, page: 1, pageSize })
      .then((payload) => {
        if (requestIdRef.current !== requestId) return;
        setWorks(payload.items);
        setHasMore(payload.hasMore);
        setPage(payload.page);
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setWorks([]);
        setHasMore(false);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setIsLoadingWorks(false);
      });
  }, [workParams]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const payload = await getWorks({ ...workParams, page: nextPage, pageSize });
      setWorks((current) => [...current, ...payload.items]);
      setHasMore(payload.hasMore);
      setPage(payload.page);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, page, workParams]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore || isLoadingWorks) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) {
          observer.disconnect();
          loadMore();
        }
      },
      { rootMargin: "360px 0px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoadingWorks, loadMore, works.length]);

  async function openLightbox(gridIndex: number) {
    const selected = works[gridIndex];
    if (!selected) return;

    const immediateSource = lightboxSourceKey === filterKey && lightboxWorks.length ? lightboxWorks : works;
    const immediateIndex = immediateSource.findIndex((work) => String(work.id) === String(selected.id));
    setLightboxWorks(immediateSource);
    setLightboxIndex(immediateIndex >= 0 ? immediateIndex : gridIndex);

    if (lightboxSourceKey === filterKey && lightboxWorks.length) return;

    const source = await getAllWorks(workParams);
    const sourceIndex = source.findIndex((work) => String(work.id) === String(selected.id));
    setLightboxSourceKey(filterKey);
    setLightboxWorks(source);
    setLightboxIndex(sourceIndex >= 0 ? sourceIndex : gridIndex);
  }

  function toggleDirection() {
    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  }

  function clearFilters() {
    setQuery("");
    setYear("");
    setSeries("");
    setSize("");
  }

  return (
    <>
    <main className="page-shell py-20">
      <section className="text-center">
        <h1 className="page-heading-enter font-display text-[clamp(3.25rem,6vw,5.2rem)]">Archive</h1>
        <p className="page-subheading-enter mx-auto mt-5 max-w-2xl text-lg">
          <strong>Dive into the world of Ogbemi Heymann's past works.</strong>
          <br />
          This archive traces the evolution of his visual language across series and decades.
        </p>
      </section>

      <section className="mt-24 grid items-start gap-10 lg:grid-cols-[1fr_300px]">
        <aside className={`archive-filter-panel sticky top-24 z-20 order-1 grid gap-6 bg-[#f8f7f4] py-4 lg:order-2 lg:top-28 lg:py-0 ${!isLoadingFilters ? "is-loaded" : ""}`}>
          <label className="grid gap-2 text-sm font-semibold">
            Search
            <span className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                size={18}
              />
              <input
                className="text-input text-input-with-icon"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title, medium, series"
                disabled={isLoadingFilters}
              />
            </span>
          </label>

          <span className="relative block">
            <select
              className="text-input text-input-with-loader"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              disabled={isLoadingFilters}
            >
              <option value="">{isLoadingFilters ? "Loading Years" : "Filter By Year"}</option>
              {metadata.years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {isLoadingFilters && (
              <LoaderCircle
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-600"
                size={18}
                aria-hidden="true"
              />
            )}
          </span>

          <span className="relative block">
            <select
              className="text-input text-input-with-loader"
              value={series}
              onChange={(event) => setSeries(event.target.value)}
              disabled={isLoadingFilters}
            >
              <option value="">{isLoadingFilters ? "Loading Series" : "Filter By Series"}</option>
              {metadata.series.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {isLoadingFilters && (
              <LoaderCircle
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-600"
                size={18}
                aria-hidden="true"
              />
            )}
          </span>

          <span className="relative block">
            <select
              className="text-input text-input-with-loader"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              disabled={isLoadingFilters}
            >
              <option value="">{isLoadingFilters ? "Loading Sizes" : "Filter By Size"}</option>
              {metadata.sizes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {isLoadingFilters && (
              <LoaderCircle
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-600"
                size={18}
                aria-hidden="true"
              />
            )}
          </span>

          <label className="grid gap-2 text-sm font-semibold">
            Sort By
            <select
              className="text-input"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              disabled={isLoadingFilters}
            >
              <option value="year">Year</option>
              <option value="title">Title</option>
              <option value="series">Series</option>
              <option value="material">Medium</option>
              <option value="dimensions">Size</option>
            </select>
          </label>

          <button type="button" className="thin-button min-h-10 px-3 py-2" onClick={toggleDirection}>
            <ArrowUpDown size={18} />
            {sortDirection === "asc" ? "Ascending" : "Descending"}
          </button>

          {hasActiveFilters && (
            <button type="button" className="soft-button min-h-10 px-3 py-2" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </aside>

        <div className="order-2 lg:order-1">
          {isLoadingWorks ? (
            <RotatingLoader />
          ) : (
            <>
              <ArtworkGrid
                artworks={works}
                onImageClick={openLightbox}
                showInquire={(work) => work.available}
                showArtworkDetails
                animateRows
              />
              {works.length === 0 && (
                <p className="border border-[#dfdbd2] p-6 text-center text-sm text-neutral-600">
                  No artworks match the current filters.
                </p>
              )}
              {hasMore && <div ref={loadMoreRef} className="h-px" aria-hidden="true" />}
              {isLoadingMore && <RotatingLoader />}
            </>
          )}
        </div>
      </section>

      <div className="mt-20 flex flex-col items-center gap-10">
        <p>
          <strong>Interested in current works?</strong>{" "}
          <Link to="/available-works" className="border-b border-black">
            View Available Works
          </Link>
        </p>
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
