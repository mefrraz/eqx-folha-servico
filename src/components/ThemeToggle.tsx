"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("eqx-dark");
    if (stored === "true" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("eqx-dark", String(next));
    setDark(next);
  };

  return (
    <button onClick={toggle} className="text-sm" title={dark ? "Modo claro" : "Modo escuro"}>
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
