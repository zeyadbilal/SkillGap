import { Link } from "react-router-dom";

function Dashboard() {
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
                <span className="text-blue-500">AHMED.</span>
              </h1>

              <p className="text-slate-400 max-w-lg text-lg mt-8 leading-relaxed">
                Here's where you stand against the current job market — and what
                you should focus on next.
              </p>
            </div>

            {/* Match score */}

            <div className="lg:w-[380px]">
              <div className="bg-white text-slate-950 rounded-[2rem] p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                      Market match
                    </p>

                    <p className="text-sm text-slate-500 mt-2">
                      Compared with current jobs
                    </p>
                  </div>

                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-2 rounded-full">
                    GOOD
                  </span>
                </div>

                <div className="flex items-end gap-2 mt-8">
                  <span className="text-7xl font-black tracking-[-0.06em]">
                    68
                  </span>

                  <span className="text-2xl font-bold text-slate-400 mb-3">
                    %
                  </span>
                </div>

                <div className="h-3 bg-slate-100 rounded-full mt-5">
                  <div className="h-3 bg-blue-600 rounded-full w-[68%]" />
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
            number="12"
            label="Skills detected"
            description="From your CV"
          />

          <StatCard
            number="24"
            label="Skills in demand"
            description="Across analyzed jobs"
          />

          <StatCard
            number="05"
            label="Skill gaps"
            description="Recommended for you"
          />
        </div>
      </section>

      {/* ================= MAIN CONTENT ================= */}

      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ================= YOUR SKILLS ================= */}

          <section className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                  Your profile
                </p>

                <h2 className="text-3xl font-black mt-2">YOUR SKILLS</h2>
              </div>

              <Link
                to="/analysis"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View analysis →
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              {[
                "Python",
                "JavaScript",
                "React",
                "HTML",
                "CSS",
                "Git",
                "C++",
                "Java",
                "Machine Learning",
                "REST APIs",
                "SQL",
                "Linux",
              ].map((skill) => (
                <span
                  key={skill}
                  className="px-4 py-3 rounded-full bg-slate-100 text-sm font-medium hover:bg-slate-200 transition"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <p className="text-sm text-slate-500">Your strongest area</p>

              <div className="flex items-end justify-between mt-3">
                <div>
                  <h3 className="text-4xl font-black">Frontend</h3>

                  <p className="text-slate-500 mt-1">
                    React · JavaScript · CSS
                  </p>
                </div>

                <span className="text-4xl font-black text-blue-600">82%</span>
              </div>

              <div className="h-3 bg-slate-100 rounded-full mt-5">
                <div className="h-3 bg-blue-600 rounded-full w-[82%]" />
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
              These skills could have the biggest impact on your market match.
            </p>

            <div className="space-y-3 mt-8">
              <Recommendation number="01" skill="SQL" priority="HIGH" />

              <Recommendation number="02" skill="Docker" priority="MEDIUM" />

              <Recommendation number="03" skill="AWS" priority="MEDIUM" />

              <Recommendation
                number="04"
                skill="System Design"
                priority="LOW"
              />
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
              Skills appearing frequently across the job postings currently
              analyzed by SkillGap.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mt-12">
            <TrendCard skill="Python" percentage="78%" change="+12%" />

            <TrendCard skill="SQL" percentage="71%" change="+9%" />

            <TrendCard skill="React" percentage="64%" change="+7%" />

            <TrendCard skill="AWS" percentage="52%" change="+15%" />
          </div>
        </section>

        {/* ================= CV ANALYSIS ================= */}

        <section className="mt-6 bg-[#111111] text-white rounded-[2rem] p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <p className="text-blue-400 text-xs uppercase tracking-widest font-bold">
                Ready for the next step?
              </p>

              <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mt-4">
                UPDATE YOUR
                <br />
                <span className="text-blue-500">PROFILE.</span>
              </h2>

              <p className="text-slate-400 mt-5 max-w-lg">
                Upload your latest CV to get an updated skill-gap analysis and
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
      </main>
    </div>
  );
}

/* ================= COMPONENTS ================= */

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

function TrendCard({ skill, percentage, change }) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex justify-between">
        <span className="font-bold">{skill}</span>

        <span className="text-green-600 text-sm font-bold">{change}</span>
      </div>

      <p className="text-4xl font-black mt-8">{percentage}</p>

      <p className="text-xs text-slate-400 mt-2">job demand</p>

      <div className="h-2 bg-slate-100 rounded-full mt-5">
        <div
          className="h-2 bg-black rounded-full"
          style={{ width: percentage }}
        />
      </div>
    </div>
  );
}

export default Dashboard;
