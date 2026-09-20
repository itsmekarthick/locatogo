"use client";

type StatsProps = {
  totalPlaces: number;
  totalCategories: number;
  totalLocalities: number;
  totalDomains: number;
};

export function LandingStats({ totalPlaces, totalCategories, totalLocalities, totalDomains }: StatsProps) {
  const stats = [
    { label: "Curated Places", value: `${totalPlaces}+`, icon: "📍", desc: "Verified businesses & public assets", accent: "text-cyan-600 dark:text-cyan-400" },
    { label: "Taxonomy Sectors", value: `${totalCategories}+`, icon: "🏷️", desc: "Healthcare, Tech, Dining, Schools", accent: "text-violet-600 dark:text-violet-400" },
    { label: "Localities Covered", value: `${totalLocalities}+`, icon: "🏙️", desc: "Neighborhoods & metropolitan hubs", accent: "text-sky-600 dark:text-sky-400" },
    { label: "Active Atlases", value: `${totalDomains}`, icon: "🌐", desc: "Specialized multi-domain portals", accent: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <section className="border-y border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-16 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 text-center shadow-xs transition-all duration-300 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-800 hover:-translate-y-1"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl shadow-inner">
                {stat.icon}
              </span>
              <p className={`mt-5 font-display text-4xl font-extrabold tracking-tight ${stat.accent}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{stat.label}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFeatures() {
  const features = [
    {
      title: "Interactive Leaflet & 3D Satellite Maps",
      desc: "Superclustered coordinate pins with instant popups, street-view 360 modals, and custom interactive map filters.",
      icon: "🗺️",
      color: "from-cyan-500/20 to-cyan-500/20 text-cyan-600 dark:text-cyan-400",
    },
    {
      title: "Real-Time Weather Atmosphere",
      desc: "Live temperature, atmospheric condition badges, and interactive simulation overlays matching any city's climate.",
      icon: "⛅",
      color: "from-sky-500/20 to-cyan-500/20 text-sky-600 dark:text-sky-400",
    },
    {
      title: "1-Click Transit & Ride Booking",
      desc: "Instant Uber & Ola direct booking deep-links preloaded with exact destination GPS coordinates.",
      icon: "🚕",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Verified Community Reviews",
      desc: "Authentic star ratings, user testimonials, verified badges, and Google Place details sync.",
      icon: "⭐",
      color: "from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400",
    },
    {
      title: "Strict Multi-Tenant RLS Security",
      desc: "Complete tenant data isolation, granular staff permissions, audited mutations, and Supabase RLS policies.",
      icon: "🛡️",
      color: "from-cyan-500/20 to-cyan-500/20 text-cyan-600 dark:text-cyan-400",
    },
    {
      title: "Turnkey Monetization Engine",
      desc: "Featured listing upgrades, scheduled advertising slot inventory, and Stripe & Razorpay integration.",
      icon: "💳",
      color: "from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-50/60 dark:bg-slate-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            Platform Capabilities
          </p>
          <h2 className="mt-2 font-serif text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Everything needed to run high-impact directories.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Engineered with modern web standards, ultra-low latency server rendering, and intuitive map ergonomics.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-cyan-300 dark:hover:border-cyan-800 hover:-translate-y-1"
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feat.color} text-2xl shadow-inner transition-transform group-hover:scale-110`}>
                {feat.icon}
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {feat.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
