import { useEffect } from "react";

type Theme = "dark";

export function useTheme() {
  const theme: Theme = "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
  }, []);

  const toggleTheme = () => {};
  const setTheme = () => {};

  return { theme, setTheme, toggleTheme };
}
