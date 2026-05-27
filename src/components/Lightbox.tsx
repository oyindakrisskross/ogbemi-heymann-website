import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Artwork } from "../types";

type Props = {
  artworks: Artwork[];
  startIndex: number;
  onClose: () => void;
};

type LightboxPhase = "enter" | "idle" | "exit";
const lightboxAnimationDuration = 1000;

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const decoded = image.decode?.();
      if (!decoded) {
        resolve();
        return;
      }

      decoded.then(() => resolve()).catch(() => resolve());
    };
    image.onerror = () => resolve();
    image.src = src;
  });
}

export function Lightbox({ artworks, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [phase, setPhase] = useState<LightboxPhase>("enter");
  const transitionTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const transitionIdRef = useRef(0);
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = artworks[index];

  function clearTransitionTimers() {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    transitionTimerRef.current = null;
    settleTimerRef.current = null;
    transitionIdRef.current += 1;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function moveTo(nextIndex: number) {
    if (!artworks.length || phase === "exit") return;
    const normalizedIndex = (nextIndex + artworks.length) % artworks.length;
    if (normalizedIndex === index) return;

    clearTransitionTimers();

    if (prefersReducedMotion()) {
      setIndex(normalizedIndex);
      setPhase("idle");
      return;
    }

    const transitionId = transitionIdRef.current;
    const targetArtwork = artworks[normalizedIndex];
    const imageReady = preloadImage(targetArtwork.imageUrl);

    setPhase("exit");
    transitionTimerRef.current = window.setTimeout(() => {
      imageReady.then(() => {
        if (transitionIdRef.current !== transitionId) return;
        setIndex(normalizedIndex);
        setPhase("enter");
        settleTimerRef.current = window.setTimeout(() => setPhase("idle"), lightboxAnimationDuration);
      });
    }, lightboxAnimationDuration);
  }

  useEffect(() => {
    setIndex(startIndex);
    setPhase(prefersReducedMotion() ? "idle" : "enter");
    clearTransitionTimers();

    if (!prefersReducedMotion()) {
      settleTimerRef.current = window.setTimeout(() => setPhase("idle"), lightboxAnimationDuration);
    }

    return () => clearTransitionTimers();
  }, [startIndex]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") moveTo(index + 1);
      if (event.key === "ArrowLeft") moveTo(index - 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [artworks.length, index, onClose, phase]);

  useEffect(() => {
    const activeThumbnail = thumbnailRefs.current[index];
    if (!activeThumbnail || !thumbnailStripRef.current) return;

    activeThumbnail.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
      inline: "center"
    });
  }, [index]);

  const imageAnimationClass =
    phase === "exit" ? "slide-image-exit-left" : phase === "enter" ? "slide-image-enter-right" : "";
  const textAnimationClass =
    phase === "exit" ? "lightbox-text-exit" : phase === "enter" ? "lightbox-text-enter" : "";

  if (!active) return null;

  return (
    <div className="lightbox-root fixed inset-0 z-50 bg-black/80 px-4 py-6 text-white">
      <button
        type="button"
        className="lightbox-close absolute right-6 top-6 z-10"
        aria-label="Close image viewer"
        onClick={onClose}
      >
        <X size={32} />
      </button>
      <div className="lightbox-panel mx-auto flex h-full max-w-6xl flex-col items-center">
        <div key={`text-${active.id}-${index}`} className={`lightbox-caption ${textAnimationClass} mb-5 text-center`}>
          <h2 className="text-2xl font-bold md:text-4xl">
            {active.title} ({active.year})
          </h2>
          <p className="mt-2 text-lg">{active.material}</p>
        </div>
        <div className="lightbox-stage grid w-full flex-1 grid-cols-[56px_1fr_56px] items-center gap-3">
          <button
            type="button"
            className="flex h-16 items-center justify-center opacity-30 transition-opacity hover:opacity-100 focus:opacity-100"
            aria-label="Previous image"
            onClick={() => moveTo(index - 1)}
          >
            <ChevronLeft size={48} />
          </button>
          <div className="flex min-h-0 items-center justify-center">
            <img
              key={`image-${active.id}-${index}`}
              src={active.imageUrl}
              alt={active.title}
              className={`lightbox-image ${imageAnimationClass} max-h-[62vh] w-auto max-w-full object-contain`}
              decoding="async"
            />
          </div>
          <button
            type="button"
            className="flex h-16 items-center justify-center opacity-30 transition-opacity hover:opacity-100 focus:opacity-100"
            aria-label="Next image"
            onClick={() => moveTo(index + 1)}
          >
            <ChevronRight size={48} />
          </button>
        </div>
        <div
          ref={thumbnailStripRef}
          className="lightbox-thumbnail-strip mt-5 flex max-w-full gap-5 overflow-x-auto overflow-y-hidden"
        >
          {artworks.map((artwork, artworkIndex) => (
            <button
              key={artwork.id}
              ref={(element) => {
                thumbnailRefs.current[artworkIndex] = element;
              }}
              type="button"
              className={`lightbox-thumbnail-button h-20 w-24 flex-none border-2 ${
                artworkIndex === index ? "border-red-500" : "border-transparent"
              }`}
              onClick={() => moveTo(artworkIndex)}
            >
              <img
                src={artwork.thumbnailUrl || artwork.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
