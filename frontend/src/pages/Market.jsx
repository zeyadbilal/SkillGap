import { Link } from "react-router-dom";

function Market() {
  /* ======================================================
     LOAD LATEST ANALYSIS
  ====================================================== */
  /* ======================================================
   LOAD USER-SPECIFIC ANALYSIS
====================================================== */

  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

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
  const usefulStuff = analysis?.usefulStuff ?? {};

  const topMarketSkills = usefulStuff?.topMarketSkills ?? [];

  const marketSkillsReviewed = Number(
    profileSummary?.marketSkillsReviewed ?? 0,
  );

  const matchScore = Number(profileSummary?.matchScore ?? 0);

  const careerTrack = profileSummary?.track || "Career Track";

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
      tensorflow: "TensorFlow",
      "machine learning": "Machine Learning",
      "deep learning": "Deep Learning",
      "rest api": "REST API",
      "rest apis": "REST APIs",
      "c++": "C++",
    };

    const lowerSkill = skill.toLowerCase();

    return (
      specialCases[lowerSkill] || skill.charAt(0).toUpperCase() + skill.slice(1)
    );
  };

  const userSkillNames = currentSkills.map((item) => item.skill?.toLowerCase());

  const gapSkillNames = skillGaps.map((item) => item.skill?.toLowerCase());

  /* ======================================================
     MARKET SKILLS
  ====================================================== */

  const highestMarketCount =
    topMarketSkills.length > 0
      ? Math.max(...topMarketSkills.map((item) => Number(item.count ?? 0)))
      : 0;

  const topSkill = topMarketSkills.length > 0 ? topMarketSkills[0] : null;

  const topGap =
    skillGaps.length > 0
      ? [...skillGaps].sort(
          (a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0),
        )[0]
      : null;

  return (
    <div className="bg-[#f5f5f0] min-h-screen text-slate-950">
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
            Explore the skills employers are demanding and see how your profile
            compares with the market.
          </p>
        </div>
      </section>

      {/* ================= MARKET NUMBERS ================= */}

      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid md:grid-cols-4 gap-4">
          <MarketStat
            number={analysis ? marketSkillsReviewed : "--"}
            label="Market skills reviewed"
          />

          <MarketStat
            number={analysis ? topMarketSkills.length : "--"}
            label="Top skills identified"
          />

          <MarketStat
            number={analysis ? `${matchScore}%` : "--"}
            label="Your market match"
          />

          <MarketStat
            number={topSkill ? formatSkillName(topSkill.skill) : "--"}
            label="Top market skill"
          />
        </div>
      </section>

      {/* ================= CONTENT ================= */}

      <section className="max-w-7xl mx-auto px-6 py-16">
        {!analysis ? (
          /* ================= NO ANALYSIS ================= */

          <div className="bg-white rounded-[2rem] border border-slate-200 p-10 md:p-16 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto">
              ↑
            </div>

            <p className="text-blue-600 text-xs uppercase tracking-widest font-bold mt-8">
              Analysis required
            </p>

            <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-4">
              ANALYZE YOUR CV
              <br />
              <span className="text-slate-400">FIRST.</span>
            </h2>

            <p className="text-slate-500 max-w-xl mx-auto mt-6">
              SkillGap needs your CV analysis before it can compare your profile
              with current market skills.
            </p>

            <Link
              to="/analysis"
              className="inline-block bg-blue-600 text-white px-7 py-4 rounded-full font-bold mt-8 hover:bg-blue-700 transition"
            >
              Analyze My CV →
            </Link>
          </div>
        ) : (
          <>
            {/* ================= PROFILE SUMMARY ================= */}

            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 p-8">
                <p className="text-blue-600 text-xs uppercase tracking-widest font-bold">
                  Your target market
                </p>

                <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-3">
                  {careerTrack.toUpperCase()}
                </h2>

                <p className="text-slate-500 max-w-xl mt-5">
                  Your CV currently matches{" "}
                  <strong className="text-slate-950">{matchScore}%</strong> of
                  the skills reviewed for this market.
                </p>

                <div className="h-4 bg-slate-100 rounded-full mt-8 overflow-hidden">
                  <div
                    className="h-4 bg-blue-600 rounded-full"
                    style={{
                      width: `${Math.min(Math.max(matchScore, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-[#d8ff4f] rounded-[2rem] p-8">
                <p className="text-xs uppercase tracking-widest font-bold">
                  Biggest opportunity
                </p>

                <h3 className="text-3xl font-black mt-5">
                  {topGap ? formatSkillName(topGap.skill) : "No major gap"}
                </h3>

                {topGap && (
                  <>
                    <p className="text-sm mt-4">{topGap.reason}</p>

                    <p className="text-5xl font-black mt-8">
                      {Math.round(Number(topGap.demandScore ?? 0) * 100)}%
                    </p>

                    <p className="text-sm mt-1">demand score</p>
                  </>
                )}
              </div>
            </div>

            {/* ================= SKILLS IN DEMAND ================= */}

            <div className="mt-16">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-5">
                <div>
                  <p className="text-blue-600 text-xs uppercase tracking-widest font-bold">
                    Market trends
                  </p>

                  <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-3">
                    SKILLS IN DEMAND.
                  </h2>
                </div>

                <span className="text-sm text-slate-400">
                  Based on analyzed market data
                </span>
              </div>

              {topMarketSkills.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  {topMarketSkills.map((item, index) => {
                    const count = Number(item.count ?? 0);

                    const demandPercent =
                      highestMarketCount > 0
                        ? Math.round((count / highestMarketCount) * 100)
                        : 0;

                    const skillLower = item.skill?.toLowerCase();

                    const alreadyHave = userSkillNames.includes(skillLower);

                    const isGap = gapSkillNames.includes(skillLower);

                    return (
                      <SkillDemand
                        key={`${item.skill}-${index}`}
                        skill={formatSkillName(item.skill)}
                        count={count}
                        rank={item.rank ?? index + 1}
                        demand={demandPercent}
                        status={
                          alreadyHave
                            ? "YOU HAVE THIS"
                            : isGap
                              ? "SKILL GAP"
                              : "MARKET SKILL"
                        }
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center mt-8">
                  <h3 className="text-xl font-bold">No skills found</h3>

                  <p className="text-slate-500 mt-2">Try another search.</p>
                </div>
              )}
            </div>

            {/* ================= YOUR GAPS ================= */}

            <div className="mt-20">
              <div>
                <p className="text-blue-600 text-xs uppercase tracking-widest font-bold">
                  Personalized opportunities
                </p>

                <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-3">
                  YOUR MARKET GAPS.
                </h2>

                <p className="text-slate-500 max-w-2xl mt-5">
                  These are market skills your analysis recommends developing to
                  improve your profile.
                </p>
              </div>

              <div className="space-y-4 mt-8">
                {skillGaps.length > 0 ? (
                  [...skillGaps]
                    .sort(
                      (a, b) =>
                        Number(b.priority ?? 0) - Number(a.priority ?? 0),
                    )
                    .map((gap, index) => (
                      <GapCard
                        key={`${gap.skill}-${index}`}
                        gap={gap}
                        formatSkillName={formatSkillName}
                      />
                    ))
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10">
                    <h3 className="font-black text-xl">No major skill gaps</h3>

                    <p className="text-slate-500 mt-2">
                      Your profile covers the market skills returned by the
                      analysis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
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

          <Link
            to="/analysis"
            className="inline-block bg-black text-white px-7 py-4 rounded-full font-bold mt-10 hover:bg-slate-800 transition"
          >
            Update My Analysis →
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ======================================================
   COMPONENTS
====================================================== */

function MarketStat({ number, label }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <p className="text-4xl font-black break-words">{number}</p>

      <p className="text-sm text-slate-500 mt-2">{label}</p>
    </div>
  );
}

function SkillDemand({ skill, count, rank, demand, status }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex justify-between gap-4">
        <span className="font-bold">{skill}</span>

        <span className="text-blue-600 text-sm font-bold">#{rank}</span>
      </div>

      <p className="text-4xl font-black mt-7">{count}</p>

      <p className="text-xs text-slate-400 mt-1">market mentions</p>

      <div className="h-2 bg-slate-100 rounded-full mt-5 overflow-hidden">
        <div
          className="h-2 bg-black rounded-full"
          style={{
            width: `${Math.min(Math.max(demand, 0), 100)}%`,
          }}
        />
      </div>

      <div className="mt-5">
        <span
          className={`text-[10px] font-black px-3 py-2 rounded-full ${
            status === "YOU HAVE THIS"
              ? "bg-green-100 text-green-700"
              : status === "SKILL GAP"
                ? "bg-orange-100 text-orange-700"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function GapCard({ gap, formatSkillName }) {
  const demand = Math.round(Number(gap.demandScore ?? 0) * 100);

  const priority = Number(gap.priority ?? 0);

  const priorityLabel =
    priority >= 8 ? "HIGH" : priority >= 5 ? "MEDIUM" : "LOW";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-black text-xl shrink-0">
          !
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black">{formatSkillName(gap.skill)}</h3>

            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">
              {gap.track}
            </span>
          </div>

          <p className="text-slate-500 mt-2">{gap.reason}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-slate-100 text-slate-600 text-xs px-3 py-2 rounded-full">
              Demand: {demand}%
            </span>

            <span className="bg-slate-100 text-slate-600 text-xs px-3 py-2 rounded-full">
              Market rank: #{gap.marketRank}
            </span>

            <span className="bg-slate-100 text-slate-600 text-xs px-3 py-2 rounded-full">
              Mentions: {gap.count}
            </span>
          </div>
        </div>

        <div className="lg:text-right">
          <p className="font-black text-sm">{priorityLabel} PRIORITY</p>

          <p className="text-xs text-slate-400 mt-2">Score {priority}/10</p>
        </div>
      </div>
    </div>
  );
}

export default Market;
