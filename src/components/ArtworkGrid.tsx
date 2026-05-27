import { Link } from "react-router-dom";
import type { Artwork } from "../types";
import { makeInquiryMessage } from "../utils";
import { Reveal } from "./Reveal";

type Props = {
  artworks: Artwork[];
  showInquire?: boolean | ((work: Artwork) => boolean);
  onImageClick: (index: number) => void;
  showMaterial?: boolean;
  showArtworkDetails?: boolean;
  animateRows?: boolean;
  animationBaseDelay?: number;
};

export function ArtworkGrid({
  artworks,
  showInquire = true,
  onImageClick,
  showMaterial,
  showArtworkDetails,
  animateRows = false,
  animationBaseDelay = 0
}: Props) {
  return (
    <div className="grid gap-x-7 gap-y-20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {artworks.map((work, index) => {
        const canInquire = typeof showInquire === "function" ? showInquire(work) : showInquire;
        const inquiry = makeInquiryMessage(work.title, work.dimensions);
        const rowDelay = animationBaseDelay + Math.floor(index / 4) * 80;
        const article = (
          <>
            <button
              type="button"
              className="artwork-image-trigger aspect-[1.18/1] w-full overflow-hidden bg-[#e8e4dc]"
              onClick={() => onImageClick(index)}
            >
              <img
                src={work.thumbnailUrl || work.imageUrl}
                alt={work.title}
                className="art-image"
                loading="lazy"
                decoding="async"
              />
            </button>
            <h3 className="mt-6 text-xl font-bold">
              {work.title} { work.year !== '' && <>({work.year})</>}
            </h3>
            {showArtworkDetails && (
              <div className="mt-2 text-sm">
                {work.material && <p>{work.material}</p>}
                {work.dimensions && <p className="mt-1">{work.dimensions}</p>}
              </div>
            )}
            {showMaterial && <p className="mt-1 text-sm">{work.material}</p>}
            {canInquire && (
              <Link
                to={`/contact?message=${encodeURIComponent(inquiry)}&artworkTitle=${encodeURIComponent(
                  work.title
                )}`}
                className="mt-2 inline-block border-b border-black text-sm"
              >
                Inquire
              </Link>
            )}
          </>
        );

        if (animateRows) {
          return (
            <Reveal
              key={`${work.id}-${index}`}
              as="article"
              className="text-center"
              delay={rowDelay}
              effect="fade-up"
            >
              {article}
            </Reveal>
          );
        }

        return (
          <article key={`${work.id}-${index}`} className="text-center">
            {article}
          </article>
        );
      })}
    </div>
  );
}
