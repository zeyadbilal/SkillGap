import { Link } from "react-router-dom";

function AnalysisResult({ result, onReset }) {
  if (!result) {
    return null;
  }

  const matchScore = result?.profileSummary?.matchScore ?? 0;

  const detectedSkills = result?.profileSummary?.detectedSkills ?? 0;

  const missingSkills = result?.profileSummary?.missingSkills ?? 0;

  const currentSkills = result?.currentSkills ?? [];

  const skillGaps = result?.skillGaps ?? [];

  const learningRoadmap = result?.learningRoadmap ?? [];

  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      {/* Result header */}

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-8">
        <div>
          <p className="text-blue-600 uppercase tracking-widest text-xs font-bold">
            Analysis complete
          </p>

          <h2 className="text-5xl md:text-7xl font-black tracking-[-0.05em] leading-none mt-4">
            HERE'S WHERE
            <br />
            <span className="text-slate-400">YOU STAND.</span>
          </h2>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="border border-slate-300 bg-white px-5 py-3 rounded-full font-semibold hover:bg-slate-50"
          >
            Analyze another CV
          </button>
        )}
      </div>

      {/* ================= MATCH SCORE ================= */}

      <div className="grid lg:grid-cols-3 gap-6 mt-12">
        <div className="lg:col-span-2 bg-[#111111] text-white rounded-[2rem] p-8 md:p-10">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Overall market match
          </p>

          <div className="flex items-end gap-3 mt-8">
            <span className="text-8xl font-black tracking-[-0.07em]">
              {matchScore}
            </span>

            <span className="text-3xl text-slate-500 font-bold mb-4">%</span>
          </div>

          <div className="h-4 bg-white/10 rounded-full mt-8 overflow-hidden">
            <div
              className="h-4 bg-blue-500 rounded-full"
              style={{
                width: `${Math.min(Math.max(matchScore, 0), 100)}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-sm text-slate-500 mt-3">
            <span>Your current profile</span>

            <span>100% market alignment</span>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10">
            <p className="text-slate-400">
              Your profile currently matches {matchScore}% of the reviewed
              market skills. Focus on the recommended gaps below to improve your
              alignment.
            </p>
          </div>
        </div>

        {/* Quick stats */}

        <div className="bg-[#d8ff4f] rounded-[2rem] p-8">
          <p className="text-xs uppercase tracking-widest font-bold">
            Analysis summary
          </p>

          <div className="space-y-7 mt-10">
            <ResultStat number={detectedSkills} label="Skills detected" />

            <ResultStat number={currentSkills.length} label="Current skills" />

            <ResultStat number={missingSkills} label="Skill gaps" />
          </div>
        </div>
      </div>

      {/* ================= SKILLS ================= */}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Current skills */}

        <div className="bg-white rounded-[2rem] border border-slate-200 p-8">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Detected from your CV
          </p>

          <h3 className="text-3xl font-black mt-3">YOUR SKILLS</h3>

          <div className="flex flex-wrap gap-3 mt-8">
            {currentSkills.length > 0 ? (
              currentSkills.map((item) => (
                <span
                  key={item.skill}
                  className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {formatSkillName(item.skill)}
                </span>
              ))
            ) : (
              <p className="text-slate-400">No skills were detected.</p>
            )}
          </div>
        </div>

        {/* Skill gaps */}

        <div className="bg-white rounded-[2rem] border border-slate-200 p-8">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Market comparison
          </p>

          <h3 className="text-3xl font-black mt-3">SKILL GAPS</h3>

          <div className="space-y-4 mt-8">
            {skillGaps.length > 0 ? (
              skillGaps.slice(0, 5).map((gap, index) => {
                const demandPercent = Math.round(
                  (gap.demandScore ?? 0) * 100,
                );

                const priorityLabel =
                  gap.priority >= 8
                    ? "HIGH"
                    : gap.priority >= 5
                      ? "MEDIUM"
                      : "LOW";

                return (
                  <GapRow
                    key={gap.skill || index}
                    skill={formatSkillName(gap.skill)}
                    demand={`${demandPercent}%`}
                    priority={priorityLabel}
                    reason={gap.reason}
                    track={gap.track}
                  />
                );
              })
            ) : (
              <p className="text-slate-400">No skill gaps were returned.</p>
            )}
          </div>
        </div>
      </div>

      {/* ================= ROADMAP ================= */}

      <section className="bg-[#bcd5ff] rounded-[2rem] p-8 md:p-12 mt-6">
        <p className="text-xs uppercase tracking-widest font-bold">
          Personalized roadmap
        </p>

        <h2 className="text-5xl md:text-6xl font-black tracking-[-0.05em] leading-none mt-5">
          WHAT TO
          <br />
          <span className="text-white">LEARN NEXT.</span>
        </h2>

        <p className="max-w-xl mt-6 text-slate-700">
          Based on your current profile and market demand, these learning stages
          should be your next priorities.
        </p>

        <div className="space-y-4 mt-12">
          {learningRoadmap.length > 0 ? (
            learningRoadmap.map((item, index) => (
              <RoadmapRow
                key={item.month || index}
                number={String(index + 1).padStart(2, "0")}
                skill={item.title}
                reason={`${item.estimatedHours} estimated hours · ${item.hoursPerWeek} hours/week`}
                priority={`MONTH ${item.month}`}
              />
            ))
          ) : (
            <p className="text-slate-700">
              No roadmap was returned for this CV.
            </p>
          )}
        </div>
      </section>

      {/* ================= CTA ================= */}

      <section className="bg-[#111111] text-white rounded-[2rem] p-8 md:p-12 mt-6">
        <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
          <div>
            <p className="text-blue-400 text-xs uppercase tracking-widest font-bold">
              Next step
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4">
              READY TO CLOSE
              <br />
              <span className="text-blue-500">THE GAP?</span>
            </h2>
          </div>

          <Link
            to="/market"
            className="bg-white text-black px-7 py-4 rounded-full font-bold hover:bg-slate-200 transition"
          >
            Explore Job Market →
          </Link>
        </div>
      </section>
    </section>
  );
}

/* ================= COMPONENTS ================= */

function ResultStat({ number, label }) {
  return (
    <div className="border-b border-black/10 pb-5">
      <p className="text-5xl font-black">{number}</p>

      <p className="text-sm font-medium mt-1">{label}</p>
    </div>
  );
}

function GapRow({ skill, demand, priority, reason, track }) {
  return (
    <div className="border-b border-slate-100 pb-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-black shrink-0">
          !
        </div>

        <div className="flex-1">
          <div className="flex justify-between gap-4">
            <div>
              <p className="font-bold">{skill}</p>

              {track && <p className="text-xs text-slate-400 mt-1">{track}</p>}
            </div>

            <span className="text-sm text-slate-400 whitespace-nowrap">
              {demand} demand
            </span>
          </div>

          <div className="h-2 bg-slate-100 rounded-full mt-3">
            <div
              className="h-2 bg-orange-400 rounded-full"
              style={{
                width: demand,
              }}
            />
          </div>

          {reason && <p className="text-sm text-slate-500 mt-3">{reason}</p>}
        </div>

        <span className="text-[10px] font-black whitespace-nowrap">
          {priority}
        </span>
      </div>
    </div>
  );
}

function RoadmapRow({ number, skill, reason, priority }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-5">
      <span className="text-slate-400 font-mono">{number}</span>

      <h3 className="text-2xl font-black md:w-1/4">{skill}</h3>

      <p className="text-slate-600 flex-1">{reason}</p>

      <span className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap">
        {priority}
      </span>
    </div>
  );
}

function formatSkillName(skill) {
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
    "machine learning": "Machine Learning",
    "rest api": "REST API",
    "rest apis": "REST APIs",
    "c++": "C++",
    llm: "LLM",
    pytorch: "PyTorch",
  };

  return (
    specialCases[skill.toLowerCase()] ||
    skill.charAt(0).toUpperCase() + skill.slice(1)
  );
}

export default AnalysisResult;