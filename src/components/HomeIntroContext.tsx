import { createContext, useContext } from "react";

type HomeIntroContextValue = {
  homeIntroComplete: boolean;
  isHome: boolean;
  setHomeIntroComplete: (complete: boolean) => void;
};

export const HomeIntroContext = createContext<HomeIntroContextValue>({
  homeIntroComplete: true,
  isHome: false,
  setHomeIntroComplete: () => undefined
});

export function useHomeIntro() {
  return useContext(HomeIntroContext);
}
