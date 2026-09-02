import { useState } from "react";

function Jobs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const jobs = [
    {
      title: "Frontend React Developer",
      company: "Tech Company",
      location: "Cairo, Egypt",
      type: "Full-time",
      salary: "20K - 35K EGP",
      skills: ["React", "JavaScript", "Git"],
      category: "Frontend",
    },
    {
      title: "Python Data Analyst",
      company: "Data Solutions",
      location: "Giza, Egypt",
      type: "Full-time",
      salary: "18K - 30K EGP",
      skills: ["Python", "SQL", "Pandas"],
      category: "Data",
    },
    {
      title: "Backend Developer",
      company: "Cloud Systems",
      location: "Cairo, Egypt",
      type: "Full-time",
      salary: "25K - 40K EGP",
      skills: ["Python", "Docker", "AWS"],
      category: "Backend",
    },
    {
      title: "Machine Learning Engineer",
      company: "AI Labs",
      location: "Cairo, Egypt",
      type: "Full-time",
      salary: "30K - 50K EGP",
      skills: ["Python", "Machine Learning", "SQL"],
      category: "AI / ML",
    },
    {
      title: "React Frontend Engineer",
      company: "Digital Studio",
      location: "Alexandria, Egypt",
      type: "Hybrid",
      salary: "22K - 38K EGP",
      skills: ["React", "TypeScript", "CSS"],
      category: "Frontend",
    },
    {
      title: "Cloud Engineer",
      company: "Cloud Technologies",
      location: "Cairo, Egypt",
      type: "Full-time",
      salary: "28K - 45K EGP",
      skills: ["AWS", "Docker", "Linux"],
      category: "Cloud",
    },
  ];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.skills.some((skill) =>
        skill.toLowerCase().includes(search.toLowerCase()),
      );

    const matchesCategory = category === "All" || job.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#f5f5f0] min-h-screen">
      {/* ================= HEADER ================= */}

      <section className="bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20">
          <p className="text-blue-400 text-xs uppercase tracking-widest font-bold">
            Market intelligence
          </p>

          <h1 className="text-6xl md:text-8xl font-black tracking-[-0.06em] leading-[0.85] mt-6">
            THE JOB
            <br />
            <span className="text-blue-500">MARKET.</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mt-8">
            Explore job opportunities and understand which skills employers are
            demanding right now.
          </p>
        </div>
      </section>

      {/* ================= MARKET NUMBERS ================= */}

      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid md:grid-cols-4 gap-4">
          <MarketStat number="1,000+" label="Jobs analyzed" />

          <MarketStat number="150+" label="Skills tracked" />

          <MarketStat number="78%" label="Python demand" />

          <MarketStat number="+15%" label="AWS growth" />
        </div>
      </section>

      {/* ================= SEARCH ================= */}

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <input
              type="text"
              placeholder="Search jobs, companies, or skills..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            >
              <option>All</option>
              <option>Frontend</option>
              <option>Backend</option>
              <option>Data</option>
              <option>AI / ML</option>
              <option>Cloud</option>
            </select>

            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="px-6 py-4 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ================= TRENDING ================= */}

        <div className="mt-16">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-blue-600 text-xs uppercase tracking-widest font-bold">
                Market trends
              </p>

              <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-3">
                SKILLS IN DEMAND.
              </h2>
            </div>

            <span className="hidden md:block text-sm text-slate-400">
              Based on analyzed job postings
            </span>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mt-8">
            <SkillDemand skill="Python" demand="78%" change="+12%" />

            <SkillDemand skill="SQL" demand="71%" change="+9%" />

            <SkillDemand skill="React" demand="64%" change="+7%" />

            <SkillDemand skill="AWS" demand="52%" change="+15%" />
          </div>
        </div>

        {/* ================= JOB LISTINGS ================= */}

        <div className="mt-20">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-600 text-xs uppercase tracking-widest font-bold">
                Opportunities
              </p>

              <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-3">
                LATEST JOBS.
              </h2>
            </div>

            <span className="text-sm text-slate-500">
              {filteredJobs.length} results
            </span>
          </div>

          <div className="space-y-4 mt-8">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => <JobCard key={job.title} job={job} />)
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <h3 className="text-xl font-bold">No jobs found</h3>

                <p className="text-slate-500 mt-2">
                  Try another search or category.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}

      <section className="bg-[#d8ff4f]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <p className="text-xs uppercase tracking-widest font-black">
            Don't just search for jobs
          </p>

          <h2 className="text-5xl md:text-7xl font-black tracking-[-0.05em] leading-[0.9] mt-5">
            BUILD THE
            <br />
            SKILLS THEY
            <br />
            <span className="text-white">WANT.</span>
          </h2>
        </div>
      </section>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function MarketStat({ number, label }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <p className="text-4xl font-black">{number}</p>

      <p className="text-sm text-slate-500 mt-2">{label}</p>
    </div>
  );
}

function SkillDemand({ skill, demand, change }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex justify-between">
        <span className="font-bold">{skill}</span>

        <span className="text-green-600 text-sm font-bold">{change}</span>
      </div>

      <p className="text-4xl font-black mt-7">{demand}</p>

      <p className="text-xs text-slate-400 mt-1">job demand</p>

      <div className="h-2 bg-slate-100 rounded-full mt-5">
        <div className="h-2 bg-black rounded-full" style={{ width: demand }} />
      </div>
    </div>
  );
}

function JobCard({ job }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 hover:-translate-y-1 transition duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center font-black text-xl">
          {job.company.charAt(0)}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black">{job.title}</h3>

            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">
              {job.category}
            </span>
          </div>

          <p className="text-slate-500 mt-2">
            {job.company} · {job.location} · {job.type}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="bg-slate-100 text-slate-600 text-xs px-3 py-2 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:text-right">
          <p className="font-black text-lg">{job.salary}</p>

          <button className="mt-3 bg-black text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800">
            View Job →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Jobs;
