import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getExhibitions } from "../api/client";
import { Reveal } from "../components/Reveal";
import type { Exhibition } from "../types";
import { exhibitionStatus, formatDateRange, locationLine } from "../utils";
import { Footer } from "../components/Footer";

function sortSliderItems(items: Exhibition[]) {
  const ongoing = items
    .filter((item) => exhibitionStatus(item) === "Ongoing")
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  const upcoming = items
    .filter((item) => exhibitionStatus(item) === "Upcoming")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  return [...ongoing, ...upcoming];
}

function excerptPreview(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 250 ? `${trimmed.slice(0, 250).trimEnd()}...` : trimmed;
}

type SlidePhase = "enter" | "idle" | "exit";
type SlideTextPart = "title" | "dates" | "location" | "excerpt" | "button";

const slideTextExitDelays: Record<SlideTextPart, number> = {
  button: 0,
  excerpt: 200,
  location: 400,
  dates: 600,
  title: 800
};

const slideTextEnterDelays: Record<SlideTextPart, number> = {
  title: 0,
  dates: 200,
  location: 400,
  excerpt: 600,
  button: 800
};

const slidePhaseDuration = 1000;
const slideDisplayDuration = 5000;
const slideButtonCompletionGap = 300;
const slideProgressDuration = slideDisplayDuration - slideButtonCompletionGap;

export function Exhibitions() {
  const [items, setItems] = useState<Exhibition[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [slidePhase, setSlidePhase] = useState<SlidePhase>("enter");
  const [pastVisible, setPastVisible] = useState(5);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    getExhibitions().then(setItems);
  }, []);

  const sliderItems = useMemo(() => sortSliderItems(items), [items]);
  const pastItems = useMemo(
    () =>
      items
        .filter((item) => exhibitionStatus(item) === "Past")
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()),
    [items]
  );

  function clearSlideTimers() {
    if (autoAdvanceTimerRef.current) window.clearTimeout(autoAdvanceTimerRef.current);
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    autoAdvanceTimerRef.current = null;
    transitionTimerRef.current = null;
    settleTimerRef.current = null;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function transitionToSlide(nextIndex: number) {
    if (sliderItems.length <= 1 || slidePhase === "exit") return;
    const normalizedIndex = (nextIndex + sliderItems.length) % sliderItems.length;
    if (normalizedIndex === displayIndex) return;

    clearSlideTimers();

    if (prefersReducedMotion()) {
      setDisplayIndex(normalizedIndex);
      setSlidePhase("idle");
      return;
    }

    setSlidePhase("exit");
    transitionTimerRef.current = window.setTimeout(() => {
      setDisplayIndex(normalizedIndex);
      setSlidePhase("enter");

      settleTimerRef.current = window.setTimeout(() => {
        setSlidePhase("idle");
      }, slidePhaseDuration);
    }, slidePhaseDuration);
  }

  useEffect(() => {
    if (displayIndex >= sliderItems.length) setDisplayIndex(0);
  }, [displayIndex, sliderItems.length]);

  useEffect(() => {
    if (sliderItems.length <= 1 || slidePhase !== "idle") return;

    autoAdvanceTimerRef.current = window.setTimeout(() => {
      transitionToSlide(displayIndex + 1);
    }, slideDisplayDuration);

    return () => {
      if (autoAdvanceTimerRef.current) window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    };
  }, [displayIndex, slidePhase, sliderItems.length]);

  useEffect(() => {
    if (sliderItems.length > 0 && slidePhase === "enter") {
      settleTimerRef.current = window.setTimeout(() => setSlidePhase("idle"), slidePhaseDuration);
    }

    return () => clearSlideTimers();
  }, [sliderItems.length]);

  const active = sliderItems[displayIndex] || sliderItems[0];
  const slideTextClass =
    slidePhase === "exit" ? "slide-text-exit" : slidePhase === "enter" ? "slide-text-enter" : "";
  const slideImageClass =
    slidePhase === "exit" ? "slide-image-exit" : slidePhase === "enter" ? "slide-image-enter" : "";

  function slideTextStyle(part: SlideTextPart) {
    if (slidePhase === "idle") return undefined;
    const delays = slidePhase === "exit" ? slideTextExitDelays : slideTextEnterDelays;
    return { animationDelay: `${delays[part]}ms` };
  }

  function slideButtonStyle() {
    return {
      ...slideTextStyle("button"),
      "--slide-progress-duration": `${slideProgressDuration}ms`
    } as CSSProperties;
  }

  return (
    <>
    <main className="page-shell py-20">
      <h1 className="page-heading-enter font-display text-[clamp(3.25rem,6vw,5.3rem)]">Exhibitions</h1>

      {active && (
        <section className="slideshow-shell mt-12 border-b border-neutral-300 pb-16">
          <div className="grid items-center gap-12 md:grid-cols-[1fr_0.76fr]">
            <div>
              <h2 className={`${slideTextClass} text-3xl font-semibold`} style={slideTextStyle("title")}>
                {active.title}
              </h2>
              <p
                className={`${slideTextClass} mt-4 text-xl text-neutral-700`}
                style={slideTextStyle("dates")}
              >
                {formatDateRange(active.startDate, active.endDate)}
              </p>
              <p className={`${slideTextClass} mt-2`} style={slideTextStyle("location")}>
                {locationLine(active.location)}
              </p>
              <p className={`${slideTextClass} mt-7 max-w-2xl leading-7`} style={slideTextStyle("excerpt")}>
                {active.excerpt}
              </p>
              <Link
                to={`/exhibitions/${active.slug}`}
                className={`${slideTextClass} thin-button slideshow-progress-button ${
                  slidePhase === "idle" && sliderItems.length > 1 ? "is-progressing" : ""
                } mt-8`}
                style={slideButtonStyle()}
              >
                <span>Enquire</span>
              </Link>
            </div>
            <img
              src={active.headliningImageUrl}
              alt={active.title}
              className={`${slideImageClass} aspect-[1.16/1] w-full object-cover`}
            />
          </div>
          {sliderItems.length > 1 && (
            <div className="mt-10 flex justify-center gap-3">
              {sliderItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show ${item.title}`}
                  className={`h-3 w-3 rounded-full border border-neutral-700 ${
                    index === displayIndex ? "bg-neutral-700" : "bg-transparent"
                  }`}
                  onClick={() => transitionToSlide(index)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section className={`${active ? "pt-16" : "pt-6"} page-body-after-heading`}>
        <Reveal effect="fade">
          <h2 className="font-display text-[clamp(2.8rem,5vw,4.6rem)]">Past Exhibitions</h2>
        </Reveal>
        <div className="mt-8 grid gap-12">
          {pastItems.slice(0, pastVisible).map((item) => (
            <Reveal
              as="article"
              effect="fade-up"
              key={item.id}
              className="grid items-center gap-8 border-b border-transparent py-4 md:grid-cols-[140px_1fr_260px]"
            >
              <p className="text-3xl">{new Date(item.endDate).getFullYear()}</p>
              <div>
                <Link to={`/exhibitions/${item.slug}`} className="text-3xl font-medium">
                  {item.title}
                </Link>
                <p className="mt-1 text-2xl">
                  {item.location.galleryName} <span className="mx-4 inline-block h-px w-12 bg-black align-middle" />
                  {item.location.city}, {item.location.country}
                </p>
                <p className="mt-5 max-w-3xl leading-6">{excerptPreview(item.excerpt)}</p>
              </div>
              <Link to={`/exhibitions/${item.slug}`}>
                <img
                  src={item.headliningImageUrl}
                  alt={item.title}
                  className="aspect-[2.1/1] w-full object-cover"
                />
              </Link>
            </Reveal>
          ))}
        </div>

        {pastVisible < pastItems.length && (
          <div className="mt-14 text-center">
            <button type="button" className="thin-button" onClick={() => setPastVisible((value) => value + 5)}>
              Load More
            </button>
          </div>
        )}
      </section>

      <Reveal effect="fade">
        <p className="mt-20 text-center page-body-after-heading">
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
