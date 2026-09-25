"use client";

type StatsProps = {
  totalPlaces: number;
  totalCategories: number;
  totalLocalities: number;
  totalDomains: number;
};

export function LandingStats({ totalPlaces, totalCategories, totalLocalities, totalDomains }: StatsProps) {
  const stats = [
    { label: "Tech Companies", value: `${totalPlaces}+`, icon: "🏢", desc: "Startups, scaleups, and global teams", accent: "text-cyan-600 dark:text-cyan-400" },
    { label: "Tech Sectors", value: `${totalCategories}+`, icon: "◈", desc: "AI, SaaS, fintech, cloud, and more", accent: "text-violet-600 dark:text-violet-400" },
    { label: "Hubs & Localities", value: `${totalLocalities}+`, icon: "⌖", desc: "Technology clusters around the world", accent: "text-sky-600 dark:text-sky-400" },
    { label: "Live Job Signals", value: `${totalDomains}+`, icon: "↗", desc: "Roles linked to company career pages", accent: "text-emerald-600 dark:text-emerald-400" },
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
      title: "Explore Tech Hubs on a Live Map",
      desc: "Move from country to city to company with geographic context for every technology cluster.",
      icon: "🗺️",
      color: "from-cyan-500/20 to-cyan-500/20 text-cyan-600 dark:text-cyan-400",
    },
    {
      title: "Filter the Ecosystem",
      desc: "Narrow companies by sector, funding stage, workplace model, technology stack, and hiring activity.",
      icon: "⛅",
      color: "from-sky-500/20 to-cyan-500/20 text-sky-600 dark:text-sky-400",
    },
    {
      title: "Find Live Opportunities",
      desc: "Browse active openings by role, experience, department, location, and workplace type.",
      icon: "🚕",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Understand Each Company",
      desc: "Open a detailed profile for company type, stage, location, stack, team scale, and available roles.",
      icon: "⭐",
      color: "from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400",
    },
    {
      title: "Direct Paths to Apply",
      desc: "Follow current career links from the source company instead of relying on stale job-board copies.",
      icon: "🛡️",
      color: "from-cyan-500/20 to-cyan-500/20 text-cyan-600 dark:text-cyan-400",
    },
    {
      title: "Built for the Ecosystem",
      desc: "Companies can submit and maintain their presence while operators keep the atlas structured and useful.",
      icon: "💳",
      color: "from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-50/60 dark:bg-slate-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            Why Tech Atlas
          </p>
          <h2 className="mt-2 font-serif text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            A clearer way to understand where technology is being built.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            LocaToGo brings geographic context, company intelligence, and live hiring signals into one searchable atlas.
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
