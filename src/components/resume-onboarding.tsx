"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export function ResumeOnboarding() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState("Bangalore");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("location", location);

    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process resume");

      // Reload dashboard to show recommended jobs
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl text-white relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          Unlock Personalized Job Matches 🚀
        </h2>
        <p className="text-slate-300 mb-8 max-w-xl">
          Upload your resume and our Gemini AI will extract your core skills to find perfectly matching open roles in your preferred city.
        </p>

        {isProcessing ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-pulse">
            <div className="text-4xl mb-4 animate-bounce">✨</div>
            <h3 className="font-bold text-lg mb-1">AI is parsing your resume...</h3>
            <p className="text-sm text-cyan-200">Extracting skills and matching jobs. This takes just a moment.</p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                ⚠️ {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Resume (PDF)</label>
                <div className="relative border-2 border-dashed border-white/20 hover:border-cyan-400/50 transition-colors rounded-xl p-6 text-center cursor-pointer bg-white/5">
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="text-slate-300 text-sm">
                    {file ? (
                      <span className="text-cyan-300 font-bold flex items-center justify-center gap-2">
                        📄 {file.name}
                      </span>
                    ) : (
                      <>
                        <span className="block text-2xl mb-2">📂</span>
                        Click to upload or drag and drop<br/>
                        <span className="text-xs text-slate-400 mt-1 block">PDF up to 5MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Select */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Preferred Hub</label>
                <select 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 appearance-none"
                >
                  <option value="Bangalore" className="text-slate-900">🇮🇳 Bangalore</option>
                  <option value="San Francisco" className="text-slate-900">🇺🇸 San Francisco</option>
                  <option value="New York" className="text-slate-900">🇺🇸 New York</option>
                  <option value="Seattle" className="text-slate-900">🇺🇸 Seattle</option>
                  <option value="Austin" className="text-slate-900">🇺🇸 Austin</option>
                  <option value="London" className="text-slate-900">🇬🇧 London</option>
                  <option value="Remote" className="text-slate-900">🌍 Remote Anywhere</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">
                  Where would you like to work next?
                </p>
              </div>
            </div>

            <button 
              type="submit"
              disabled={!file}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg hover:shadow-cyan-500/25"
            >
              Analyze Resume & Find Matches
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
