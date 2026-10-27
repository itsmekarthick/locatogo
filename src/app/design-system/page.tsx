import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignSystemShowcase } from "./showcase";

export const metadata: Metadata = {
  title: "Design System | LocaToGo",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DesignSystemShowcase />;
}
