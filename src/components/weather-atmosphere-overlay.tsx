"use client";

import { useEffect, useRef, useState } from "react";
import type { WeatherType } from "@/lib/services/weather";

type Props = {
  weatherType?: WeatherType | null;
  intensity?: "light" | "medium" | "heavy";
  className?: string;
  allowSimulate?: boolean;
  onClose?: () => void;
};

type RainDrop = {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  thickness: number;
};

type SplashParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  opacity: number;
};

export function WeatherAtmosphereOverlay({
  weatherType = "rain",
  intensity = "medium",
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeWeather, setActiveWeather] = useState<WeatherType>(weatherType || "rain");
  const [isLightning, setIsLightning] = useState(false);

  useEffect(() => {
    if (weatherType) {
      setActiveWeather(weatherType);
    }
  }, [weatherType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle arrays
    const drops: RainDrop[] = [];
    const splashes: SplashParticle[] = [];

    const dropCount =
      activeWeather === "thunderstorm"
        ? 120
        : activeWeather === "rain"
        ? intensity === "heavy"
          ? 100
          : 60
        : activeWeather === "drizzle"
        ? 35
        : 0;

    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: activeWeather === "drizzle" ? 6 + Math.random() * 6 : 14 + Math.random() * 16,
        speed: activeWeather === "drizzle" ? 3 + Math.random() * 2 : 8 + Math.random() * 8,
        opacity: 0.25 + Math.random() * 0.45,
        thickness: activeWeather === "drizzle" ? 0.75 : 1.2,
      });
    }

    // Lightning timer for thunderstorm
    let lightningTimeout: NodeJS.Timeout | null = null;
    const scheduleLightning = () => {
      if (activeWeather !== "thunderstorm") return;
      const delay = 3000 + Math.random() * 7000;
      lightningTimeout = setTimeout(() => {
        setIsLightning(true);
        setTimeout(() => {
          setIsLightning(false);
          scheduleLightning();
        }, 120);
      }, delay);
    };

    if (activeWeather === "thunderstorm") {
      scheduleLightning();
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Rain & Drizzle Drawing
      if (activeWeather === "rain" || activeWeather === "drizzle" || activeWeather === "thunderstorm") {
        ctx.strokeStyle = "rgba(174, 214, 241, 0.75)";
        ctx.lineCap = "round";

        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          ctx.lineWidth = d.thickness;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          // 8-degree diagonal slant
          ctx.lineTo(d.x + 2, d.y + d.length);
          ctx.stroke();

          d.y += d.speed;
          d.x += 1.5;

          // Splash upon hitting bottom
          if (d.y > height - 10) {
            // Spawn 2 splash particles
            if (activeWeather !== "drizzle" && splashes.length < 50) {
              splashes.push({
                x: d.x,
                y: height - 5,
                vx: (Math.random() - 0.5) * 2.5,
                vy: -(Math.random() * 2 + 1),
                life: 0,
                maxLife: 12 + Math.random() * 8,
                opacity: d.opacity,
              });
            }
            d.y = -d.length;
            d.x = Math.random() * width;
          }
          if (d.x > width) d.x = 0;
        }

        // Draw Splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.2; // gravity
          s.life++;
          s.opacity *= 0.92;

          ctx.fillStyle = `rgba(180, 220, 255, ${s.opacity})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1, 0, Math.PI * 2);
          ctx.fill();

          if (s.life >= s.maxLife || s.opacity < 0.05) {
            splashes.splice(i, 1);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (lightningTimeout) clearTimeout(lightningTimeout);
    };
  }, [activeWeather, intensity]);

  // If sunny / clear, render warm ambient sunbeams
  if (activeWeather === "clear") {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-[350] overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gradient-to-br from-amber-300/20 via-orange-300/10 to-transparent blur-3xl" />
      </div>
    );
  }

  // If cloudy / overcast
  if (activeWeather === "clouds" || activeWeather === "fog") {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-[350] overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-500/10 via-transparent to-slate-900/10" />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[350] overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Lightning Flash Overlay */}
      {isLightning && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] transition-opacity duration-75" />
      )}

      {/* Atmospheric Overcast Ambient Tint */}
      <div className="absolute inset-0 bg-slate-900/[0.07]" />

      {/* Rain Canvas Particle Layer */}
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

