"use client";

import { useState } from "react";

export function PlaceStreetViewButton({
  latitude,
  longitude,
  title,
}: {
  latitude: number;
  longitude: number;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    "";

  // Google Maps Street View Embed URL
  const streetViewEmbedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${latitude},${longitude}&heading=210&pitch=10&fov=80`;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-2xl border border-gray-200/90 bg-white/95 px-4 py-2.5 text-xs font-bold text-gray-800 shadow-sm hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer"
      >
        <span className="text-sm">👁️</span>
        <span>Look Around 360°</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative flex flex-col w-full max-w-4xl h-[550px] sm:h-[600px] rounded-3xl bg-gray-950 border border-gray-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
              <div className="flex items-center gap-2">
                <span className="text-lg">👁️</span>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">{title}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Google Street View 360° Panorama</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Street View Iframe / Interactive Viewer */}
            <div className="flex-1 w-full bg-black relative">
              {apiKey ? (
                <iframe
                  title={`Street View for ${title}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={streetViewEmbedUrl}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <span className="text-4xl mb-2">🧭</span>
                  <p className="text-sm text-gray-300 font-semibold">Street View Preview</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-md">
                    Open Google Street View directly at this place's coordinates.
                  </p>
                  <a
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 rounded-xl bg-[#e26a4f] px-4 py-2 text-xs font-bold text-white hover:bg-[#d05c43] transition-colors"
                  >
                    Open in Google Maps 360° →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

