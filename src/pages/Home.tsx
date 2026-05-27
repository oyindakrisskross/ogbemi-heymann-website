import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getFeaturedExhibition } from "../api/client";
import { Reveal } from "../components/Reveal";
import { TypewriterText } from "../components/TypewriterText";
import type { Exhibition } from "../types";
import { formatDateRange, locationLine } from "../utils";
import { Footer } from "../components/Footer";
import { useHomeIntro } from "../components/HomeIntroContext";

const heroQuote = `"I don't paint for decorative purposes.\nI want to be functional to society."`;
const homeHeaderEntryDelay = 500;
const homeHeaderIntroDuration = 3000;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Home() {
  const [featured, setFeatured] = useState<Exhibition | null>(null);
  const [showScrollCue, setShowScrollCue] = useState(false);
  const [heroTextComplete, setHeroTextComplete] = useState(false);
  const { homeIntroComplete, setHomeIntroComplete } = useHomeIntro();
  const headerStartTimerRef = useRef<number | null>(null);
  const scrollUnlockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    getFeaturedExhibition().then(setFeatured);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    document.body.classList.add("home-intro-scroll-lock");
    return () => {
      document.body.classList.remove("home-intro-scroll-lock");
    };
  }, []);

  useEffect(() => {
    if (!showScrollCue) return;

    function hideScrollCue() {
      if (window.scrollY > 8) setShowScrollCue(false);
    }

    window.addEventListener("scroll", hideScrollCue, { passive: true });
    return () => window.removeEventListener("scroll", hideScrollCue);
  }, [showScrollCue]);

  useEffect(
    () => () => {
      if (headerStartTimerRef.current) window.clearTimeout(headerStartTimerRef.current);
      if (scrollUnlockTimerRef.current) window.clearTimeout(scrollUnlockTimerRef.current);
    },
    []
  );

  const finishHeroIntro = useCallback(() => {
    if (headerStartTimerRef.current) window.clearTimeout(headerStartTimerRef.current);
    if (scrollUnlockTimerRef.current) window.clearTimeout(scrollUnlockTimerRef.current);

    if (prefersReducedMotion()) {
      setHomeIntroComplete(true);
      document.body.classList.remove("home-intro-scroll-lock");
      setShowScrollCue(true);
      return;
    }

    headerStartTimerRef.current = window.setTimeout(() => {
      setHomeIntroComplete(true);
    }, homeHeaderEntryDelay);

    scrollUnlockTimerRef.current = window.setTimeout(() => {
      document.body.classList.remove("home-intro-scroll-lock");
      setShowScrollCue(true);
    }, homeHeaderEntryDelay + homeHeaderIntroDuration);
  }, [setHomeIntroComplete]);

  const handleTypewriterComplete = useCallback(() => {
    setHeroTextComplete(true);
    finishHeroIntro();
  }, [finishHeroIntro]);

  return (
    <>
    <main className={homeIntroComplete ? "home-intro-complete" : "home-intro-start"}>
      <section className="home-hero-section relative overflow-hidden">
        <img
          src="/assets/homeward-tide.jpg"
          alt=""
          className="home-hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="home-hero-content page-shell relative flex items-center justify-center text-center text-white">
          <div>
            <p className="font-display text-[clamp(2.2rem,5vw,4.8rem)] leading-tight">
              <TypewriterText
                delay={1050}
                onComplete={handleTypewriterComplete}
                text={heroQuote}
              />
            </p>
            {heroTextComplete && (
              <Reveal className="mt-12 font-display text-3xl">
                Ogbemi Heymann
              </Reveal>
            )}
          </div>
        </div>
        {showScrollCue && (
          <div className="home-scroll-cue" aria-hidden="true">
            <div className="home-scroll-circles">
              <span />
              <span />
              <span />
            </div>
            <p>Scroll Down</p>
          </div>
        )}
      </section>

      <section className="page-shell grid gap-16 py-20">

        <div className="grid items-center gap-10 md:grid-cols-[1fr_1fr]">
          <Reveal effect="fade">
            <h2 className="font-display text-4xl">Governance & Satire</h2>
            <p className="mt-6 max-w-xl leading-6">
              Influenced by literary satire and journalism, Heymann examines governance as lived
              condition. Through allegory and restrained figuration, his works invite reflection on
              power as an everyday structure shaping collective experience.
            </p>
            <Link to="/available-works" className="thin-button mt-8">
              View All Works
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            <Reveal effect="fade-up">
              <img src="/assets/royal-suite.jpg" alt="" className="aspect-square w-full object-cover" />
            </Reveal>
            <Reveal effect="fade-up" delay={180}>
              <img src="/assets/civil-service.jpg" alt="" className="aspect-square w-full object-cover" />
            </Reveal>
          </div>
        </div>

        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <Reveal effect="fade-up" className="order-2 md:order-1">
            <img src="/assets/bountiful-wish.jpg" alt="" className="aspect-[1.8/1] w-full object-cover" />
          </Reveal>
          <Reveal effect="fade" className="order-1 md:order-2">
            <h2 className="font-display text-4xl">Resource Politics</h2>
            <p className="mt-6 max-w-xl leading-6">
              Through allegorical trees, degraded landscapes, and recurring figures, Heymann
              explores abundance within scarcity. His compositions address extraction, imbalance,
              and deferred collective benefit.
            </p>
            <Link to="/available-works" className="thin-button mt-8">
              View All Works
            </Link>
          </Reveal>
        </div>

        <div className="grid items-center gap-10 md:grid-cols-[1fr_1fr]">
          <Reveal effect="fade">
            <h2 className="font-display text-4xl">Communal Living</h2>
            <p className="mt-6 max-w-xl leading-6">
              Drawing from personal memory and social observation, Heymann examines communal
              living through clustered figures and compressed interiors. His works challenge
              assumptions about progress, protection, resilience, and what is lost as individualism
              reshapes collective bonds.
            </p>
            <Link to="/available-works" className="thin-button mt-8">
              View All Works
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            <Reveal effect="fade-up">
              <img src="/assets/untitled-roommates.jpg" alt="" className="aspect-square w-full object-cover" />
            </Reveal>
            <Reveal effect="fade-up" delay={180}>
              <img src="/assets/untitled2-roommates.jpg" alt="" className="aspect-square w-full object-cover" />
            </Reveal>
          </div>
        </div>
        
      </section>

      {featured && (
        <section className="page-shell border-t border-neutral-300 py-16">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_0.75fr]">
            <Reveal effect="fade">
              <p className="text-sm uppercase tracking-[0.14em] text-neutral-600">Featured Exhibition</p>
              <h2 className="mt-4 font-display text-5xl">{featured.title}</h2>
              <p className="mt-6 text-xl text-neutral-700">
                {formatDateRange(featured.startDate, featured.endDate)}
              </p>
              <p className="mt-2">{locationLine(featured.location)}</p>
              <p className="mt-6 max-w-2xl leading-7">{featured.excerpt}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link className="thin-button" to={`/exhibitions/${featured.slug}`}>
                  Read More
                </Link>
                <Link className="thin-button" to="/exhibitions">
                  View All Exhibitions
                </Link>
              </div>
            </Reveal>
            <Reveal effect="fade-right">
              <img
                src={featured.headliningImageUrl}
                alt={featured.title}
                className="aspect-[1.2/1] w-full object-cover"
              />
            </Reveal>
          </div>
        </section>
      )}

      <section className="page-shell border-t border-neutral-300 py-16 text-center">
        <Reveal effect="fade">
          <h2 className="font-display text-4xl">Explore the Complete Body of Work</h2>
        </Reveal>
        <Reveal effect="fade" delay={180}>
          <Link to="/available-works" className="thin-button mt-8">
            View All Works
          </Link>
        </Reveal>
      </section>
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
