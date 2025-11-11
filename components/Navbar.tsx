"use client";

import { useState, useEffect } from "react";
import { pizzeriaConfig } from "@/config/pizzeria.config";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";

const links = [
  { id: "home", label: "Hem" },
  { id: "menu", label: "Meny" },
  { id: "gallery", label: "Galleri" },
  { id: "opening-hours", label: "Öppettider" },
  { id: "about", label: "Varför oss" },
  { id: "reviews", label: "Omdömen" },
  { id: "contact", label: "Kontakt" },
];

export function Navbar() {
  const { name } = pizzeriaConfig;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleNavClick(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setOpen(false);
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 border-b border-slate-800 transition-colors
      ${scrolled ? "bg-slate-950/90 backdrop-blur" : "bg-slate-950/70"}
    `}
    >
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2 text-sm md:text-base font-semibold text-white"
        >
          <span className="rounded-full w-8 h-8 flex items-center justify-center text-sm bg-red-600">
            🍕
          </span>
          <span className="hidden sm:inline">{name}</span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5 text-sm md:text-base">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="text-slate-200 hover:text-white hover:underline underline-offset-4"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setOpen((v) => !v)}
          aria-label="Öppna meny"
        >
          {open ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col gap-1 text-sm">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="py-1 text-left text-slate-200 hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
