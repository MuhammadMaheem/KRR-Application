"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

interface Props {
  compact?: boolean;
}

export default function ThemeToggle({ compact }: Props) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("krr_theme") as Theme) || "dark";
    setTheme(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  const apply = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("krr_theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  return (
    <div className="theme-toggle">
      {(["light", "dark"] as Theme[]).map((val) => (
        <button
          key={val}
          type="button"
          onClick={() => apply(val)}
          title={val}
          className={[
            "theme-toggle__btn",
            compact ? "theme-toggle__btn--compact" : "",
            theme === val ? "theme-toggle__btn--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {val === "light" ? <Sun size={13} strokeWidth={2} /> : <Moon size={13} strokeWidth={2} />}
          {!compact && <span>{val}</span>}
        </button>
      ))}
    </div>
  );
}
