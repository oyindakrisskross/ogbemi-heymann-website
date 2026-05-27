import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getExhibition, getExhibitions } from "../api/client";
import { ArtworkGrid } from "../components/ArtworkGrid";
import { Lightbox } from "../components/Lightbox";
import type { Exhibition } from "../types";
import { exhibitionStatus, formatDateRange, locationLine } from "../utils";
import { Reveal } from "../components/Reveal";
import { Footer } from "../components/Footer";

export function ExhibitionDetail() {
  const { slug } = useParams();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (slug) getExhibition(slug).then(setExhibition);
    getExhibitions().then(setExhibitions);
  }, [slug]);

  const moreUpcoming = useMemo(() => {
    const ongoing = exhibitions
      .filter((item) => item.slug !== slug && exhibitionStatus(item) === "Ongoing")
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    const upcoming = exhibitions
      .filter((item) => item.slug !== slug && exhibitionStatus(item) === "Upcoming")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return [...ongoing, ...upcoming].slice(0, 5);
  }, [exhibitions, slug]);

  if (!exhibition) {
    return (
      <main className="page-shell py-24">
        <p>Exhibition not found.</p>
      </main>
    );
  }

  return (
    <>
    <main className="page-shell py-20">
      <section className="exhibition-intro-section">
        <h1 className="page-heading-enter font-display text-[clamp(3.4rem,6vw,5.4rem)]">{exhibition.title}</h1>
        <div className="mt-16 grid items-start gap-12 overflow-visible md:grid-cols-[1fr_0.76fr]">
          <div>
            <p className="slide-text-enter text-2xl text-neutral-700">
              {formatDateRange(exhibition.startDate, exhibition.endDate)}
            </p>
            <p className="slide-text-enter mt-2 text-lg">{locationLine(exhibition.location)}</p>
            <div className="mt-8 grid max-w-2xl gap-6 leading-7 slide-text-enter">
              {exhibition.description.split("\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <Link
              to={`/contact?message=${encodeURIComponent(
                `I would like to inquire about ${exhibition.title}.`
              )}`}
              className="thin-button mt-8"
            >
              Enquire
            </Link>
            {exhibition.materials.length > 0 && (
              <div className="mt-8 grid gap-2">
                {exhibition.materials.map((file) => (
                  <a
                    key={file.id}
                    href={file.fileUrl}
                    download={file.label || file.fileUrl.split("/").pop() || "download"}
                    className="border-b border-black text-sm"
                  >
                    Download {file.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="exhibition-featured-sticky">
            <img
              src={exhibition.headliningImageUrl}
              alt={exhibition.title}
              className="aspect-[1.16/1] w-full object-cover slide-image-enter"
            />
          </div>
        </div>
      </section>

      <section className="mt-20 border-t border-neutral-300 pt-12">
        <Reveal as="h2" effect="fade-up" className="font-display text-5xl">
          Works
        </Reveal>
        <div className="mt-12">
          <ArtworkGrid
            artworks={exhibition.works}
            showInquire={false}
            showMaterial
            onImageClick={setLightboxIndex}
            animateRows
          />
        </div>
      </section>

      {moreUpcoming.length > 0 && (
        <section className="mt-24 text-center">
          <h2 className="font-display text-4xl">More Upcoming</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {moreUpcoming.map((item) => (
              <Link key={item.id} to={`/exhibitions/${item.slug}`} className="block">
                <img
                  src={item.headliningImageUrl}
                  alt={item.title}
                  className="aspect-square w-full object-cover"
                />
                <h3 className="mt-4 font-semibold leading-snug">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{formatDateRange(item.startDate, item.endDate)}</p>
              </Link>
            ))}
          </div>
          <Link to="/exhibitions" className="thin-button mt-10">
            All Exhibitions
          </Link>
        </section>
      )}

      <p className="mt-20 text-center">
        <strong>Interested in current works?</strong>{" "}
        <Link to="/available-works" className="border-b border-black">
          View Available Works
        </Link>
      </p>

      {lightboxIndex !== null && (
        <Lightbox
          artworks={exhibition.works}
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
