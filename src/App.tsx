import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { About } from "./pages/About";
import { Archive } from "./pages/Archive";
import { AvailableWorks } from "./pages/AvailableWorks";
import { BlogDetail } from "./pages/BlogDetail";
import { BlogList } from "./pages/BlogList";
import { Contact } from "./pages/Contact";
import { ExhibitionDetail } from "./pages/ExhibitionDetail";
import { Exhibitions } from "./pages/Exhibitions";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { BlogAdmin } from "./pages/admin/BlogAdmin";
import { Dashboard } from "./pages/admin/Dashboard";
import { ExhibitionsAdmin } from "./pages/admin/ExhibitionsAdmin";
import { FilesAdmin } from "./pages/admin/FilesAdmin";
import { FormsAdmin } from "./pages/admin/FormsAdmin";
import { AdminLogin } from "./pages/admin/Login";
import { SettingsAdmin } from "./pages/admin/SettingsAdmin";

const exitDuration = 700;
const exitStagger = 200;

function isAdminPath(pathname: string) {
  return pathname === "/admin/login" || pathname.startsWith("/admin");
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function visibleExitElements(root: HTMLElement | null) {
  const main = root?.querySelector("main");
  if (!main) return [];

  const selectors = [
    ":scope > h1",
    ":scope > h2",
    ":scope > p",
    ":scope > div",
    ":scope > article",
    ":scope > form",
    ":scope > aside",
    ":scope > section > h1",
    ":scope > section > h2",
    ":scope > section > p",
    ":scope > section > div",
    ":scope > section > img",
    ":scope > section > form",
    ":scope > section > aside",
    ":scope > section > article"
  ].join(", ");

  return Array.from(main.querySelectorAll<HTMLElement>(selectors))
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.height > 0 &&
        rect.width > 0 &&
        rect.bottom >= 0 &&
        rect.top <= window.innerHeight &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    })
    .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
}

function clearExitStyles(root: HTMLElement | null) {
  root?.querySelectorAll<HTMLElement>("[data-page-exiting='true']").forEach((element) => {
    element.style.animation = "";
    element.style.willChange = "";
    delete element.dataset.pageExiting;
  });
}

function runExitAnimation(root: HTMLElement | null) {
  const elements = visibleExitElements(root);

  elements.forEach((element, index) => {
    element.dataset.pageExiting = "true";
    element.style.willChange = "opacity, transform";
    element.style.animation = `page-exit-fade-down ${exitDuration}ms ease ${
      index * exitStagger
    }ms forwards`;
  });

  return elements.length ? exitDuration + (elements.length - 1) * exitStagger : exitDuration;
}

export function App() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isExiting, setIsExiting] = useState(false);
  const transitionRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const currentPath = `${displayLocation.pathname}${displayLocation.search}`;
    const nextPath = `${location.pathname}${location.search}`;
    if (currentPath === nextPath) return;

    if (
      prefersReducedMotion() ||
      isAdminPath(displayLocation.pathname) ||
      isAdminPath(location.pathname)
    ) {
      clearExitStyles(transitionRef.current);
      setIsExiting(false);
      setDisplayLocation(location);
      return;
    }

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    clearExitStyles(transitionRef.current);
    setIsExiting(true);
    const totalDuration = runExitAnimation(transitionRef.current);

    timeoutRef.current = window.setTimeout(() => {
      setDisplayLocation(location);
      setIsExiting(false);
      window.scrollTo({ top: 0, left: 0 });
      window.requestAnimationFrame(() => clearExitStyles(transitionRef.current));
    }, totalDuration);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [displayLocation, location]);

  return (
    <div ref={transitionRef} className={`page-transition-shell ${isExiting ? "is-exiting" : ""}`}>
    <Routes location={displayLocation}>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="available-works" element={<AvailableWorks />} />
        <Route path="archive" element={<Archive />} />
        <Route path="exhibitions" element={<Exhibitions />} />
        <Route path="exhibitions/:slug" element={<ExhibitionDetail />} />
        <Route path="articles" element={<BlogList />} />
        <Route path="articles/:slug" element={<BlogDetail />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="blog" element={<Navigate to="/articles" replace />} />
      </Route>

      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="exhibitions" element={<ExhibitionsAdmin />} />
        <Route path="blog" element={<BlogAdmin />} />
        <Route path="files" element={<FilesAdmin />} />
        <Route path="forms" element={<FormsAdmin />} />
        <Route path="settings" element={<SettingsAdmin />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </div>
  );
}
