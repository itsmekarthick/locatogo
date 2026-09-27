import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "LocaToGo | Global Tech Atlas & Startup Ecosystem Map",
  description: "Explore 67,000+ tech companies, startups, hubs, and active hiring opportunities across the globe on an interactive map.",
  keywords: [
    "global tech atlas",
    "technology companies map",
    "startup directory",
    "tech company directory",
    "tech hubs",
    "live tech jobs",
    "AI startups",
    "SaaS companies",
    "MNC GCC directory",
  ],
  authors: [{ name: "LocaToGo" }],
  creator: "LocaToGo",
  publisher: "LocaToGo",
  category: "technology",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "LocaToGo | Global Tech Atlas & Startup Ecosystem Map",
    description: "Explore 67,000+ tech companies, startups, hubs, and active hiring opportunities across the globe on an interactive map.",
    type: "website",
    locale: "en_US",
    siteName: "LocaToGo",
  },
  twitter: {
    card: "summary_large_image",
    title: "LocaToGo | Global Tech Atlas & Startup Ecosystem Map",
    description: "Explore tech companies, hubs, startups, and live hiring opportunities across the globe.",
  },
};

import { Suspense } from "react";
import { NavigationProgressBar } from "@/components/navigation-progress-bar";
import { AiCopilot } from "@/components/ai-copilot";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('locatogo_theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <main className="flex-1 w-full h-full animate-app-reveal flex flex-col">
          {children}
        </main>
        <AiCopilot />
        <Analytics />
      </body>
    </html>
  );
}
