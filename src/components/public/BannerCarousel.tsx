"use client";

import React, { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link: string;
}

/** Carrusel de banners promocionales del home (administrados desde Gestión Interna). */
export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/catalog/banners/public/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBanners(Array.isArray(d) ? d : d.results || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;
  const b = banners[idx];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 mt-6">
      <div className="relative rounded-2xl overflow-hidden shadow-md">
        <a href={b.link || "#"} target={b.link ? "_blank" : undefined} rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.image_url} alt={b.title} className="w-full h-44 md:h-56 object-cover" />
          {b.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white font-semibold text-lg">{b.title}</p>
            </div>
          )}
        </a>
        {banners.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`}
                aria-label={`Banner ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
