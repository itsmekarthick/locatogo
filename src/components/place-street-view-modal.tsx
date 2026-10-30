"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ArrowUpRightIcon, EyeIcon, GlobeIcon, LayersIcon, MapIcon } from "@/components/ui/icons";

type Option = { href: string; icon: ReactNode; label: string; hint: string };

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

  // Direct deep links, so no maps API key is needed.
  const options: Option[] = [
    {
      href: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`,
      icon: <EyeIcon />,
      label: "Google Street View",
      hint: "360° ground-level view",
    },
    {
      href: `https://earth.google.com/web/@${latitude},${longitude},900a,35y,0h,45t,0r`,
      icon: <GlobeIcon />,
      label: "Google Earth 3D",
      hint: "Aerial and terrain model",
    },
    {
      href: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      icon: <MapIcon />,
      label: "Google Maps",
      hint: "Satellite and navigation",
    },
    {
      href: `https://maps.apple.com/?ll=${latitude},${longitude}&t=k`,
      icon: <LayersIcon />,
      label: "Apple Maps",
      hint: "High-resolution satellite",
    },
  ];

  return (
    <>
      <Button variant="secondary" leadingIcon={<EyeIcon className="size-4" />} onClick={() => setIsOpen(true)}>
        Look around
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
        size="lg"
        title={`Look around ${title}`}
        description={`Open an interactive 360° or aerial view at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}.`}
        footer={
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        }
      >
        <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <li key={option.label}>
              <a
                href={option.href}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring group flex items-center gap-3 rounded-xl border border-line bg-surface-1 p-3.5 lift hover:border-line-strong hover:bg-surface-3/60"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-lg text-accent-text">{option.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">{option.label}</span>
                  <span className="block text-xs text-fg-subtle">{option.hint}</span>
                </span>
                <ArrowUpRightIcon className="size-4 shrink-0 text-fg-subtle transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
