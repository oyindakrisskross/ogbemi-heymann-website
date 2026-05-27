import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useHomeIntro } from "./HomeIntroContext";

const navItems = [
  { to: "/available-works", label: "Available Works" },
  { to: "/exhibitions", label: "Exhibitions" },
  { to: "/articles", label: "Articles" },
  { to: "/about", label: "About" },
  { to: "/archive", label: "Archive" },
  { to: "/contact", label: "Contact" }
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { homeIntroComplete, isHome } = useHomeIntro();
  const homeIntroClass = isHome
    ? `home-intro-header ${homeIntroComplete ? "is-complete" : ""}`
    : "";

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-scroll-lock", open);
    return () => document.body.classList.remove("mobile-menu-scroll-lock");
  }, [open]);

  return (
    <header className={`site-header ${homeIntroClass}`}>
      <div className="header-inner page-shell relative z-50 flex h-24 items-center justify-between gap-8">
        <Link
          to="/"
          className="header-logo font-display text-[clamp(1.7rem,3vw,2.5rem)] leading-none"
        >
          Ogbemi Heymann
        </Link>
        <nav className="hidden items-center gap-10 text-[15px] md:flex">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={{ "--nav-delay": `${900 + index * 120}ms` } as CSSProperties}
              className={({ isActive }) =>
                `header-nav-item nav-link-draw transition-colors ${isActive ? "is-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className={`home-menu-button mobile-menu-button inline-flex md:hidden ${open ? "is-open" : ""}`}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {open && (
        <div className="mobile-menu-overlay fixed inset-0 z-40 bg-[#f8f7f4] md:hidden">
          <nav className="page-shell grid gap-6 pt-36 text-2xl">
            {navItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={{ "--mobile-nav-delay": `${120 + index * 110}ms` } as CSSProperties}
                className={({ isActive }) =>
                  `mobile-nav-link nav-link-draw w-fit ${isActive ? "is-active" : ""}`
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
