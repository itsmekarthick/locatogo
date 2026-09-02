import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#090d16] px-6 text-center font-sans text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-xl">
        <div className="flex justify-center mb-4">
          <BrandLogo size={44} />
        </div>
        <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
          404 • Page Not Found
        </span>
        <h1 className="mt-4 font-serif text-3xl font-bold text-slate-950 dark:text-slate-50">
          Lost in the Atlas?
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          The place, city directory, or company profile you are searching for does not exist or has been relocated.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto rounded-full bg-[#e26a4f] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#d8583c] transition-all text-center"
          >
            🗺️ Live City Atlas
          </Link>
          <Link
            href="/tech-atlas"
            className="w-full sm:w-auto rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-indigo-700 transition-all text-center"
          >
            💼 Tech Atlas (67k+ MNCs)
          </Link>
        </div>
      </div>
    </div>
  );
}
