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

  // Universal Google Maps 360° Street View Pano Deep Link (Bypasses API key restrictions)
  const streetViewDirectUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
  const satellite3dUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const googleEarth3dUrl = `https://earth.google.com/web/@${latitude},${longitude},900a,35y,0h,45t,0r`;

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
          <div className="relative flex flex-col w-full max-w-2xl rounded-3xl bg-gray-950 border border-gray-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/90">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 text-sm">
                  👁️
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">{title}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    360° Street View &amp; 3D Aerial Exploration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 space-y-6 text-white">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 text-center space-y-3">
                <span className="text-4xl">🌐</span>
                <h4 className="font-serif text-xl font-bold text-white">
                  Explore {title} in Full 360°
                </h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  Launch interactive Google Street View panoramas, 3D aerial photography, or 360° ground camera footage at exact GPS coordinates ({latitude.toFixed(4)}, {longitude.toFixed(4)}).
                </p>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <a
                  href={streetViewDirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-orange-600 to-[#e26a4f] text-white font-bold text-xs hover:from-orange-500 hover:to-orange-600 transition-all shadow-lg cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">👁️</span>
                    <div className="text-left">
                      <span className="block text-white font-bold">Google Street View</span>
                      <span className="block text-[10px] text-orange-100 font-normal">
                        360° Interactive Ground View
                      </span>
                    </div>
                  </div>
                  <span>→</span>
                </a>

                <a
                  href={googleEarth3dUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gray-900 border border-gray-700 text-white font-bold text-xs hover:bg-gray-800 transition-all shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🛰️</span>
                    <div className="text-left">
                      <span className="block text-white font-bold">Google Earth 3D</span>
                      <span className="block text-[10px] text-gray-400 font-normal">
                        3D Aerial &amp; Terrain Model
                      </span>
                    </div>
                  </div>
                  <span>→</span>
                </a>

                <a
                  href={satellite3dUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gray-900 border border-gray-700 text-white font-bold text-xs hover:bg-gray-800 transition-all shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🗺️</span>
                    <div className="text-left">
                      <span className="block text-white font-bold">Google Maps Live</span>
                      <span className="block text-[10px] text-gray-400 font-normal">
                        Live Satellite &amp; Navigation
                      </span>
                    </div>
                  </div>
                  <span>→</span>
                </a>

                <a
                  href={`https://maps.apple.com/?ll=${latitude},${longitude}&t=k`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gray-900 border border-gray-700 text-white font-bold text-xs hover:bg-gray-800 transition-all shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🍎</span>
                    <div className="text-left">
                      <span className="block text-white font-bold">Apple Maps</span>
                      <span className="block text-[10px] text-gray-400 font-normal">
                        High-Res Satellite View
                      </span>
                    </div>
                  </div>
                  <span>→</span>
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-gray-900/70 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
              <span>📍 {latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
