import { Outlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { HomeIntroContext } from "./HomeIntroContext";
import { ScrollTopButton } from "./ScrollTopButton";

export function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [homeIntroComplete, setHomeIntroComplete] = useState(!isHome);

  useEffect(() => {
    setHomeIntroComplete(!isHome);
  }, [isHome]);

  const homeIntroValue = useMemo(
    () => ({ homeIntroComplete, isHome, setHomeIntroComplete }),
    [homeIntroComplete, isHome]
  );

  return (
    <HomeIntroContext.Provider value={homeIntroValue}>
      <div className="layout-root bg-[#f8f7f4] text-[#111111]">
        <Header />
        <div className="layout-content">
          <Outlet />
        </div>
        <ScrollTopButton />
      </div>
    </HomeIntroContext.Provider>
  );
}
