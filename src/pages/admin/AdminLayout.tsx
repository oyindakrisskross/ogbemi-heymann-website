import { FileText, GalleryVerticalEnd, Home, LogOut, Mail, Newspaper, Settings } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: Home },
  { to: "/admin/exhibitions", label: "Exhibitions", icon: GalleryVerticalEnd },
  { to: "/admin/blog", label: "Articles", icon: Newspaper },
  { to: "/admin/files", label: "Files", icon: FileText },
  { to: "/admin/forms", label: "Forms", icon: Mail },
  { to: "/admin/settings", label: "Settings", icon: Settings }
];

export function adminToken() {
  return localStorage.getItem("ogbemi-admin-token") || "";
}

export function AdminLayout() {
  const navigate = useNavigate();
  const token = adminToken();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-scroll-lock", mobileMenuOpen);
    return () => document.body.classList.remove("mobile-menu-scroll-lock");
  }, [mobileMenuOpen]);

  if (!token) return <Navigate to="/admin/login" replace />;

  function logout() {
    localStorage.removeItem("ogbemi-admin-token");
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#111111]">
      <div className="grid min-h-screen min-w-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <header className="admin-mobile-header sticky top-0 z-50 flex h-24 items-center justify-between border-b border-[#dfdbd2] bg-white px-5 lg:hidden">
          <Link to="/" className="font-display text-3xl">
            Ogbemi Heymann
          </Link>
          <button
            type="button"
            className={`mobile-menu-button inline-flex lg:hidden ${mobileMenuOpen ? "is-open" : ""}`}
            aria-label={mobileMenuOpen ? "Close admin navigation" : "Open admin navigation"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="mobile-menu-overlay fixed inset-0 z-40 bg-white lg:hidden">
            <nav className="grid gap-4 px-5 pt-36 text-2xl">
              {adminLinks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/admin"}
                    style={{ "--mobile-nav-delay": `${120 + index * 110}ms` } as CSSProperties}
                    className={({ isActive }) =>
                      `mobile-nav-link flex w-fit items-center gap-3 ${isActive ? "border-b border-black" : ""}`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon size={22} />
                    {item.label}
                  </NavLink>
                );
              })}
              <button
                type="button"
                className="mobile-nav-link mt-6 flex w-fit items-center gap-3"
                style={{ "--mobile-nav-delay": `${120 + adminLinks.length * 110}ms` } as CSSProperties}
                onClick={logout}
              >
                <LogOut size={22} />
                Log Out
              </button>
            </nav>
          </div>
        )}

        <aside className="hidden border-r border-[#dfdbd2] bg-white p-5 lg:block">
          <Link to="/" className="font-display text-3xl">
            Ogbemi Heymann
          </Link>
          <p className="mt-2 text-sm text-neutral-600">Content Management</p>
          <nav className="mt-10 grid gap-2">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 text-sm ${
                      isActive ? "bg-[#111111] text-white" : "hover:bg-[#f0eee9]"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <button type="button" className="mt-10 flex items-center gap-3 px-3 py-3 text-sm" onClick={logout}>
            <LogOut size={18} />
            Log Out
          </button>
        </aside>
        <main className="min-w-0 max-w-full overflow-x-hidden p-4 sm:p-5 md:p-8 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
