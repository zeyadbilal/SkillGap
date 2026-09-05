import { Link } from "react-router-dom";

function Dashboard() {
  /* ======================================================
     USER DATA
  ====================================================== */

  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "User";

  /* ======================================================
     LATEST ANALYSIS DATA
  ====================================================== */
  /* ======================================================
   USER-SPECIFIC ANALYSIS DATA
====================================================== */

  const userIdentifier = user?.id || user?.email;

  const analysisStorageKey = userIdentifier
    ? `latestAnalysis_${userIdentifier}`
    : null;

  const storedAnalysis = analysisStorageKey
    ? localStorage.getItem(analysisStorageKey)
    : null;

  let analysis = null;

  try {
    analysis = storedAnalysis ? JSON.parse(storedAnalysis) : null;
  } catch {
    analysis = null;
  }
  const profileSummary = analysis?.profileSummary ?? {};

  const currentSkills = analysis?.currentSkills ?? [];

  const skillGaps = analysis?.skillGaps ?? [];

  const learningRoadmap = analysis?.learningRoadmap ?? [];

  const usefulStuff = analysis?.usefulStuff ?? {};

  const topMarketSkills = usefulStuff?.topMarketSkills ?? [];

  const matchScore = Number(profileSummary?.matchScore ?? 0);

  const detectedSkills = Number(
    profileSummary?.detectedSkills ?? currentSkills.length ?? 0,
  );

  const missingSkills = Number(
    profileSummary?.missingSkills ?? skillGaps.length ?? 0,
  );

  const marketSkillsReviewed = Number(
    profileSummary?.marketSkillsReviewed ?? 0,
  );

  const careerTrack = profileSummary?.track || "Not available";

  const bestSkills = profileSummary?.bestSkills ?? [];

  /* ======================================================
     HELPERS
  ====================================================== */

  const formatSkillName = (skill) => {
    if (!skill) return "";

    const specialCases = {
      "node.js": "Node.js",
      javascript: "JavaScript",
      html: "HTML",
      css: "CSS",
      sql: "SQL",
      python: "Python",
      java: "Java",
      react: "React",
      docker: "Docker",
      git: "Git",
      linux: "Linux",
      aws: "AWS",
      github: "GitHub",
      llm: "LLM",
      pytorch: "PyTorch",
      "machine learning": "Machine Learning",
      "rest api": "REST API",
      "rest apis": "REST APIs",
      "c++": "C++",
    };

    return (
      specialCases[skill.toLowerCase()] ||
      skill.charAt(0).toUpperCase() + skill.slice(1)
    );
  };

  const getMatchStatus = (score) => {
    if (score >= 75) {
      return {
        label: "STRONG",
        className: "bg-green-100 text-green-700",
      };
    }

    if (score >= 50) {
      return {
        label: "GOOD",
        className: "bg-blue-100 text-blue-700",
      };
    }

    if (score >= 25) {
      return {
        label: "DEVELOPING",
        className: "bg-orange-100 text-orange-700",
      };
    }

    return {
      label: "START HERE",
      className: "bg-slate-100 text-slate-600",
    };
  };

  const getPriorityLabel = (priority) => {
    const value = Number(priority ?? 0);

    if (value >= 8) return "HIGH";

    if (value >= 5) return "MEDIUM";

    return "LOW";
  };

  const matchStatus = getMatchStatus(matchScore);

  const sortedSkillGaps = [...skillGaps]
    .sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0))
    .slice(0, 4);

  const displayedMarketSkills = topMarketSkills.slice(0, 4);

  /* ======================================================
     PAGE
  ====================================================== */

  return (
    <div className="bg-[#f5f5f0] min-h-screen text-slate-950">
      {/* ================= TOP HERO ================= */}

      <section className="bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-32">
          <div className="flex flex-col lg:flex-row justify-between gap-12">
            <div>
              <p className="text-blue-400 uppercase tracking-widest text-xs font-bold">
                Your career dashboard
              </p>

              <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] leading-[0.9] mt-6">
                WELCOME
                <br />
                BACK,
                <br />
                <span className="text-blue-500">
                  {firstName.toUpperCase()}.
                </span>
              </h1>

              <p className="text-slate-400 max-w-lg text-lg mt-8 leading-relaxed">
                {analysis
                  ? "Here's where you stand against the current job market — and what you should focus on next."
                  : "Upload your CV to discover your skills, market match and personalized learning recommendations."}
              </p>
            </div>

            {/* ================= MATCH SCORE ================= */}

            <div className="lg:w-[380px]">
              <div className="bg-white text-slate-950 rounded-[2rem] p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                      Market match
                    </p>

                    <p className="text-sm text-slate-500 mt-2">
                      Compared with current market skills
                    </p>
                  </div>

                  {analysis && (
                    <span
                      className={`${matchStatus.className} text-xs font-bold px-3 py-2 rounded-full`}
                    >
                      {matchStatus.label}
                    </span>
                  )}
                </div>

                <div className="flex items-end gap-2 mt-8">
                  <span className="text-7xl font-black tracking-[-0.06em]">
                    {analysis ? matchScore : "--"}
                  </span>

                  {analysis && (
                    <span className="text-2xl font-bold text-slate-400 mb-3">
                      %
                    </span>
                  )}
                </div>

                <div className="h-3 bg-slate-100 rounded-full mt-5 overflow-hidden">
                  <div
                    className="h-3 bg-blue-600 rounded-full transition-all"
                    style={{
                      width: analysis
                        ? `${Math.min(Math.max(matchScore, 0), 100)}%`
                        : "0%",
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-400 mt-3">
                  <span>Current profile</span>

                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= OVERVIEW ================= */}

      <section className="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
        <div className="grid md:grid-cols-3 gap-5">
          <StatCard
            number={analysis ? detectedSkills : "--"}
            label="Skills detected"
            description="From your CV"
          />

          <StatCard
            number={analysis ? marketSkillsReviewed : "--"}
            label="Market skills reviewed"
            description="Used for your comparison"
          />

          <StatCard
            number={analysis ? missingSkills : "--"}
            label="Skill gaps"
            description="Recommended for you"
          />
        </div>
      </section>

      {/* ================= MAIN CONTENT ================= */}

      <main className="max-w-7xl mx-auto px-6 py-24">
        {!analysis ? (
          /* ================= NO ANALYSIS ================= */

          <section className="bg-white border border-slate-200 rounded-[2rem] p-10 md:p-16 text-center">
            <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">
              ↑
            </div>

            <p className="text-blue-600 uppercase tracking-widest text-xs font-bold mt-7">
              No analysis yet
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4">
              ANALYZE YOUR CV
              <br />
              <span className="text-slate-400">TO BUILD YOUR DASHBOARD.</span>
            </h2>

            <p className="text-slate-500 max-w-xl mx-auto mt-6">
              Once your CV has been analyzed, your skills, skill gaps, market
              match and recommendations will appear here.
            </p>

            <Link
              to="/analysis"
              className="inline-block mt-8 bg-blue-600 text-white px-7 py-4 rounded-full font-bold hover:bg-blue-700 transition"
            >
              Analyze My CV →
            </Link>
          </section>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* ================= YOUR SKILLS ================= */}

              <section className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-200">
                <div className="flex justify-between items-center gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                      Your profile
                    </p>

                    <h2 className="text-3xl font-black mt-2">YOUR SKILLS</h2>
                  </div>

                  <Link
                    to="/analysis"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                  >
                    View analysis →
                  </Link>
                </div>

                {/* Current Skills */}

                <div className="flex flex-wrap gap-3 mt-8">
                  {currentSkills.length > 0 ? (
                    currentSkills.map((item, index) => (
                      <span
                        key={`${item.skill}-${index}`}
                        className="px-4 py-3 rounded-full bg-slate-100 text-sm font-medium hover:bg-slate-200 transition"
                      >
                        {formatSkillName(item.skill)}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-400">No skills detected.</p>
                  )}
                </div>

                {/* Career Track */}

                <div className="mt-10 pt-8 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    Your analyzed career track
                  </p>

                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mt-3">
                    <div>
                      <h3 className="text-3xl md:text-4xl font-black">
                        {careerTrack}
                      </h3>

                      {bestSkills.length > 0 && (
                        <p className="text-slate-500 mt-2">
                          {bestSkills
                            .slice(0, 3)
                            .map(formatSkillName)
                            .join(" · ")}
                        </p>
                      )}
                    </div>

                    <span className="text-4xl font-black text-blue-600">
                      {matchScore}%
                    </span>
                  </div>

                  <div className="h-3 bg-slate-100 rounded-full mt-5 overflow-hidden">
                    <div
                      className="h-3 bg-blue-600 rounded-full"
                      style={{
                        width: `${Math.min(Math.max(matchScore, 0), 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* ================= NEXT SKILLS ================= */}

              <section className="bg-[#d8ff4f] rounded-[2rem] p-8">
                <p className="text-xs uppercase tracking-widest font-bold">
                  Priority list
                </p>

                <h2 className="text-3xl font-black mt-2 leading-none">
                  LEARN
                  <br />
                  NEXT.
                </h2>

                <p className="text-sm mt-5 max-w-xs">
                  These skills could have the biggest impact on your market
                  match.
                </p>

                <div className="space-y-3 mt-8">
                  {sortedSkillGaps.length > 0 ? (
                    sortedSkillGaps.map((gap, index) => (
                      <Recommendation
                        key={`${gap.skill}-${index}`}
                        number={String(index + 1).padStart(2, "0")}
                        skill={formatSkillName(gap.skill)}
                        priority={getPriorityLabel(gap.priority)}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-2xl p-5">
                      <p className="font-bold">No major gaps detected.</p>

                      <p className="text-sm text-slate-500 mt-1">
                        Your current skills already cover the reviewed market
                        areas.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ================= MARKET TRENDS ================= */}

            <section className="mt-6 bg-[#bcd5ff] rounded-[2rem] p-8 md:p-10">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold">
                    Market intelligence
                  </p>

                  <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-3">
                    WHAT'S
                    <br />
                    TRENDING.
                  </h2>
                </div>

                <p className="max-w-md text-slate-700">
                  Top market skills identified from the job-market data used in
                  your analysis.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
                {displayedMarketSkills.length > 0 ? (
                  displayedMarketSkills.map((item, index) => (
                    <TrendCard
                      key={`${item.skill}-${index}`}
                      skill={formatSkillName(item.skill)}
                      count={item.count}
                      rank={item.rank ?? index + 1}
                    />
                  ))
                ) : (
                  <div className="md:col-span-2 lg:col-span-4 bg-white rounded-2xl p-6">
                    <p className="font-bold">
                      Market trend data is not available for this analysis.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ================= ROADMAP PREVIEW ================= */}

            {learningRoadmap.length > 0 && (
              <section className="mt-6 bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-blue-600 font-bold">
                      Personalized plan
                    </p>

                    <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-3">
                      YOUR
                      <br />
                      ROADMAP.
                    </h2>
                  </div>

                  <Link
                    to="/analysis"
                    className="text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    View full analysis →
                  </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-10">
                  {learningRoadmap.map((item, index) => (
                    <RoadmapPreview
                      key={item.month ?? index}
                      month={item.month ?? index + 1}
                      title={item.title}
                      hours={item.estimatedHours}
                      weeklyHours={item.hoursPerWeek}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ================= CV ANALYSIS ================= */}

            <section className="mt-6 bg-[#111111] text-white rounded-[2rem] p-8 md:p-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                  <p className="text-blue-400 text-xs uppercase tracking-widest font-bold">
                    Keep your profile current
                  </p>

                  <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-4">
                    UPDATE YOUR
                    <br />
                    <span className="text-blue-500">ANALYSIS.</span>
                  </h2>

                  <p className="text-slate-400 mt-5 max-w-lg">
                    Upload your latest CV to refresh your skill-gap analysis and
                    personalized recommendations.
                  </p>
                </div>

                <Link
                  to="/analysis"
                  className="bg-white text-black px-7 py-4 rounded-full font-bold hover:bg-slate-200 transition whitespace-nowrap"
                >
                  Analyze My CV →
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/* ======================================================
   COMPONENTS
====================================================== */

function StatCard({ number, label, description }) {
  return (
    <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
      <p className="text-5xl font-black tracking-[-0.04em]">{number}</p>

      <p className="font-bold text-lg mt-3">{label}</p>

      <p className="text-sm text-slate-400 mt-1">{description}</p>
    </div>
  );
}

function Recommendation({ number, skill, priority }) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-400 font-mono">{number}</span>

        <div className="flex-1">
          <p className="font-bold">{skill}</p>
        </div>

        <span className="text-[10px] font-black">{priority}</span>
      </div>
    </div>
  );
}

function TrendCard({ skill, count, rank }) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between items-start gap-4">
        <span className="font-bold">{skill}</span>

        <span className="text-blue-600 text-xs font-bold whitespace-nowrap">
          #{rank}
        </span>
      </div>

      <p className="text-4xl font-black mt-8">{count ?? 0}</p>

      <p className="text-xs text-slate-400 mt-2">market mentions</p>

      <div className="h-2 bg-slate-100 rounded-full mt-5">
        <div
          className="h-2 bg-black rounded-full"
          style={{
            width: `${Math.max(20, 100 - (Number(rank ?? 1) - 1) * 15)}%`,
          }}
        />
      </div>
    </div>
  );
}

function RoadmapPreview({ month, title, hours, weeklyHours }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
      <span className="text-xs uppercase tracking-widest text-blue-600 font-bold">
        Month {month}
      </span>

      <h3 className="text-xl font-black mt-4">{title}</h3>

      <p className="text-sm text-slate-500 mt-4">
        {hours ?? 0} estimated hours
      </p>

      <p className="text-sm text-slate-400 mt-1">
        {weeklyHours ?? 0} hours/week
      </p>
    </div>
  );
}

export default Dashboard;
