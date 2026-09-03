import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface ThemeContextType {
  theme: "dark" | "light" | "auto";
  setTheme: (theme: "dark" | "light" | "auto") => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "auto", setTheme: () => {} });

function getSystemTheme(): "dark" | "light" {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function getEffectiveTheme(theme: "dark" | "light" | "auto"): "dark" | "light" {
  if (theme === "auto") return getSystemTheme();
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light" | "auto">(() => {
    try {
      const stored = localStorage.getItem("abhistream_theme");
      if (stored === "dark" || stored === "light" || stored === "auto") return stored;
    } catch {
      // ignore
    }
    return "auto";
  });

  useEffect(() => {
    const effective = getEffectiveTheme(theme);
    document.documentElement.setAttribute("data-theme", effective);
    try {
      localStorage.setItem("abhistream_theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.setAttribute("data-theme", media.matches ? "dark" : "light");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}