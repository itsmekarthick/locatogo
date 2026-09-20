"use client";

import { useState } from "react";

export function SponsorInquiryForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    email: "",
    slotType: "Top Flash Announcement ($299)",
    budget: "$500 - $2,500",
    goals: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 p-6 text-center text-xs space-y-2">
        <span className="text-2xl">🎉</span>
        <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
          Advertising Inquiry Received!
        </h4>
        <p className="text-emerald-800 dark:text-emerald-300">
          Thank you for partnering with Mapora. Our sponsorship director will review your campaign details and reach out to <span className="font-semibold">{formData.email}</span> within 2 business hours.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="mt-2 text-xs font-semibold text-emerald-700 underline cursor-pointer"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1">
            Company / Brand Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.company}
            onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
            placeholder="e.g. Acme Tech, WeWork"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1">
            Work Email <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            placeholder="you@company.com"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1">Target Placement Slot</label>
          <select
            value={formData.slotType}
            onChange={(e) => setFormData((p) => ({ ...p, slotType: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
          >
            <option>Top Flash Announcement ($299)</option>
            <option>In-Feed Promoted Card ($499)</option>
            <option>Profile Sidebar Spotlight ($999)</option>
            <option>Custom Enterprise Network Sponsorship</option>
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1">Estimated Budget</label>
          <input
            type="text"
            value={formData.budget}
            onChange={(e) => setFormData((p) => ({ ...p, budget: e.target.value }))}
            placeholder="$500 - $2,500"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1">
          Campaign Goals / Link Destination
        </label>
        <textarea
          rows={3}
          value={formData.goals}
          onChange={(e) => setFormData((p) => ({ ...p, goals: e.target.value }))}
          placeholder="Tell us about the product or service you'd like to promote and your target audience..."
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-[#06b6d4] hover:bg-[#0891b2] text-white font-bold py-3 text-xs shadow-md transition-all cursor-pointer"
      >
        Submit Advertising Request 🚀
      </button>
    </form>
  );
}
