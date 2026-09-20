import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#090d16] px-6 text-center font-sans text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-xl">
        <div className="flex justify-center mb-4">
          <BrandLogo size={44} />
        </div>
        <span className="rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
          404 • Page Not Found
        </span>
        <h1 className="mt-4 font-serif text-3xl font-bold text-slate-950 dark:text-slate-50">
          Lost in the Atlas?
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          The place, city directory, or company profile you are searching for does not exist or has been relocated.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Link
            href="/"
            className="w-full sm:w-auto rounded-full bg-cyan-600 px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-cyan-700 transition-all text-center flex items-center justify-center gap-2"
          >
            <span>💼</span>
            <span>Back to Tech Atlas</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
