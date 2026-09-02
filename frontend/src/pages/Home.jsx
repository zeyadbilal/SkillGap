import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="bg-[#f5f5f0] text-slate-950 overflow-hidden">
      {/* ================= HERO ================= */}

      <section className="relative min-h-[90vh] bg-[#111111] text-white">
        {/* Background glow */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[140px] opacity-40" />

        <div className="absolute bottom-0 left-[-200px] w-[400px] h-[400px] bg-purple-600 rounded-full blur-[130px] opacity-30" />

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 relative">
          <div className="max-w-5xl">
            <p className="text-blue-400 font-semibold tracking-widest uppercase text-sm">
              AI-Powered Career Advisor
            </p>

            <h1 className="mt-8 text-6xl md:text-8xl font-black tracking-[-0.05em] leading-[0.9]">
              YOUR CAREER
              <br />
              SHOULD WORK
              <br />
              <span className="text-blue-500">FOR YOU.</span>
            </h1>

            <p className="mt-10 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
              Discover what Egyptian employers actually want, identify your
              skill gaps, and build a roadmap based on real job-market demand.
            </p>

            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                to="/analysis"
                className="bg-blue-600 hover:bg-blue-500 px-7 py-4 rounded-full font-semibold transition"
              >
                Analyze My CV →
              </Link>

              <Link
                to="/jobs"
                className="border border-white/20 hover:bg-white/10 px-7 py-4 rounded-full font-semibold transition"
              >
                Explore Market
              </Link>
            </div>
          </div>

          {/* Floating cards */}

          <div className="hidden lg:block absolute right-10 bottom-20">
            <div className="relative w-[400px] h-[350px]">
              {/* Main card */}

              <div className="absolute top-10 right-0 w-80 bg-white text-slate-900 rounded-3xl p-6 shadow-2xl rotate-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">
                    Your Market Match
                  </span>

                  <span className="text-green-600 text-sm font-bold">+12%</span>
                </div>

                <div className="text-6xl font-black mt-5">78%</div>

                <div className="h-3 bg-slate-100 rounded-full mt-6">
                  <div className="h-3 bg-blue-600 rounded-full w-[78%]" />
                </div>

                <p className="text-sm text-slate-500 mt-4">
                  You're closer than you think.
                </p>
              </div>

              {/* Skill card */}

              <div className="absolute bottom-5 left-0 bg-[#d9ff4f] text-black rounded-2xl p-5 w-64 -rotate-6 shadow-xl">
                <p className="text-xs uppercase font-bold">Recommended</p>

                <p className="text-2xl font-black mt-2">Docker</p>

                <p className="text-sm mt-1">High demand</p>
              </div>

              {/* Small card */}

              <div className="absolute top-0 left-10 bg-purple-400 text-black rounded-2xl px-5 py-4 rotate-6 shadow-xl">
                <p className="font-black">+1,000</p>

                <p className="text-xs">jobs analyzed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MARKET TICKER ================= */}

      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Trending skills
            </span>

            <div className="flex flex-wrap gap-3">
              {[
                "Python ↑",
                "SQL ↑",
                "React ↑",
                "AWS ↑",
                "Docker ↑",
                "Machine Learning ↑",
              ].map((skill) => (
                <span
                  key={skill}
                  className="bg-slate-100 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTRO ================= */}

      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-blue-600 uppercase tracking-widest text-sm font-bold">
            The problem
          </p>

          <h2 className="mt-6 text-5xl md:text-7xl font-black tracking-[-0.04em] leading-[0.95] max-w-5xl">
            THE MARKET MOVES.
            <br />
            <span className="text-slate-400">YOUR SKILLS SHOULD TOO.</span>
          </h2>

          <p className="mt-10 text-lg text-slate-600 max-w-2xl leading-relaxed">
            University teaches you the fundamentals. SkillGap shows you what
            employers are asking for right now.
          </p>
        </div>
      </section>

      {/* ================= MARKET SECTION ================= */}

      <section className="bg-[#d8ff4f] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div>
              <p className="uppercase tracking-widest text-xs font-bold">
                Market intelligence
              </p>

              <h2 className="text-5xl md:text-7xl font-black tracking-[-0.05em] mt-5 leading-none">
                WHAT
                <br />
                EMPLOYERS
                <br />
                WANT.
              </h2>
            </div>

            <p className="max-w-md text-lg leading-relaxed">
              We analyze job postings to reveal which technical skills are
              appearing most often in the market.
            </p>
          </div>

          {/* Skill cards */}

          <div className="grid md:grid-cols-3 gap-5 mt-20">
            {[
              {
                skill: "Python",
                demand: "78%",
                jobs: "780+ jobs",
              },
              {
                skill: "SQL",
                demand: "71%",
                jobs: "710+ jobs",
              },
              {
                skill: "React",
                demand: "64%",
                jobs: "640+ jobs",
              },
            ].map((item, index) => (
              <div
                key={item.skill}
                className="bg-white rounded-3xl p-7 min-h-[260px] flex flex-col justify-between"
              >
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">0{index + 1}</span>

                  <span className="text-green-600 font-bold">↑ Demand</span>
                </div>

                <div>
                  <h3 className="text-4xl font-black">{item.skill}</h3>

                  <div className="flex justify-between items-end mt-6">
                    <span className="text-6xl font-black">{item.demand}</span>

                    <span className="text-sm text-slate-500">{item.jobs}</span>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full mt-5">
                    <div
                      className="h-2 bg-black rounded-full"
                      style={{
                        width: item.demand,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SKILL GAP ================= */}

      <section className="py-32 bg-[#f5f5f0]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-blue-600 uppercase tracking-widest text-sm font-bold">
                Personalized analysis
              </p>

              <h2 className="text-5xl md:text-7xl font-black tracking-[-0.05em] leading-[0.9] mt-6">
                YOUR SKILL
                <br />
                GAP,
                <br />
                <span className="text-slate-400">MADE OBVIOUS.</span>
              </h2>

              <p className="mt-8 text-lg text-slate-600 max-w-lg">
                Upload your CV and we'll compare your skills against what the
                market is demanding.
              </p>

              <Link
                to="/analysis"
                className="inline-block mt-8 bg-black text-white px-7 py-4 rounded-full font-semibold hover:bg-slate-800 transition"
              >
                Analyze my skills →
              </Link>
            </div>

            {/* Skill comparison */}

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
              <div className="flex justify-between items-center border-b pb-6">
                <div>
                  <p className="text-xs uppercase text-slate-400">Candidate</p>

                  <p className="font-bold mt-1">Your Profile</p>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase text-slate-400">Match</p>

                  <p className="text-3xl font-black text-blue-600">68%</p>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <SkillRow name="Python" status="Strong" width="90%" positive />

                <SkillRow name="React" status="Strong" width="80%" positive />

                <SkillRow name="SQL" status="Missing" width="35%" />

                <SkillRow name="Docker" status="Missing" width="20%" />

                <SkillRow name="AWS" status="Missing" width="15%" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ROADMAP ================= */}

      <section className="bg-[#bcd5ff] py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="uppercase tracking-widest text-xs font-bold">
              Your next move
            </p>

            <h2 className="text-5xl md:text-7xl font-black tracking-[-0.05em] leading-[0.9] mt-6">
              A ROADMAP
              <br />
              BUILT
              <br />
              <span className="text-white">FOR YOU.</span>
            </h2>
          </div>

          <div className="mt-20 space-y-4">
            <RoadmapItem
              number="01"
              skill="SQL"
              reason="High demand across software and data roles"
              priority="HIGH PRIORITY"
            />

            <RoadmapItem
              number="02"
              skill="Docker"
              reason="Frequently requested in modern development teams"
              priority="MEDIUM PRIORITY"
            />

            <RoadmapItem
              number="03"
              skill="AWS"
              reason="Growing demand for cloud engineering skills"
              priority="MEDIUM PRIORITY"
            />
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}

      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="text-blue-600 uppercase tracking-widest text-sm font-bold">
              Simple process
            </p>

            <h2 className="text-5xl md:text-7xl font-black tracking-[-0.05em] mt-5">
              THREE STEPS.
              <br />
              <span className="text-slate-300">ONE BETTER CAREER.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <ProcessCard
              number="01"
              title="Upload"
              description="Upload your CV and let SkillGap understand your current skills."
            />

            <ProcessCard
              number="02"
              title="Compare"
              description="We compare your profile with skills demanded by real job postings."
            />

            <ProcessCard
              number="03"
              title="Improve"
              description="Get a prioritized roadmap showing exactly what to learn next."
            />
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}

      <section className="bg-[#111111] text-white py-32">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-blue-400 uppercase tracking-widest text-sm font-bold">
            Your next opportunity starts here
          </p>

          <h2 className="text-6xl md:text-8xl font-black tracking-[-0.06em] leading-[0.85] mt-8">
            STOP GUESSING.
            <br />
            <span className="text-blue-500">START BUILDING.</span>
          </h2>

          <p className="text-slate-400 max-w-xl mx-auto text-lg mt-10">
            Find the skills that matter and build your career around where the
            market is going.
          </p>

          <Link
            to="/analysis"
            className="inline-block mt-10 bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-slate-200 transition"
          >
            Analyze My CV →
          </Link>
        </div>
      </section>

      {/* ================= FOOTER ================= */}

      <footer className="bg-[#111111] border-t border-white/10 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="text-2xl font-black text-white">
                Skill<span className="text-blue-500">Gap</span>
              </div>

              <p className="mt-3 max-w-sm text-sm">
                Helping Egyptian graduates understand the job market and close
                their skill gaps.
              </p>
            </div>

            <div className="flex gap-8 text-sm">
              <Link to="/" className="hover:text-white">
                Home
              </Link>

              <Link to="/jobs" className="hover:text-white">
                Jobs
              </Link>

              <Link to="/analysis" className="hover:text-white">
                Analysis
              </Link>

              <Link to="/login" className="hover:text-white">
                Login
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 text-xs">
            © 2026 SkillGap. Built for Egyptian graduates.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function SkillRow({ name, status, width, positive }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-semibold">{name}</span>

        <span
          className={
            positive
              ? "text-green-600 text-sm font-medium"
              : "text-orange-500 text-sm font-medium"
          }
        >
          {status}
        </span>
      </div>

      <div className="h-3 bg-slate-100 rounded-full">
        <div
          className={
            positive
              ? "h-3 bg-blue-600 rounded-full"
              : "h-3 bg-orange-400 rounded-full"
          }
          style={{ width }}
        />
      </div>
    </div>
  );
}

function RoadmapItem({ number, skill, reason, priority }) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
      <div className="text-slate-400 font-mono text-sm">{number}</div>

      <div className="md:w-1/4">
        <h3 className="text-3xl font-black">{skill}</h3>
      </div>

      <p className="text-slate-600 flex-1">{reason}</p>

      <span className="bg-black text-white text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap">
        {priority}
      </span>
    </div>
  );
}

function ProcessCard({ number, title, description }) {
  return (
    <div className="border border-slate-200 rounded-3xl p-8 min-h-[280px] flex flex-col justify-between hover:-translate-y-2 transition duration-300">
      <span className="text-slate-400 font-mono">{number}</span>

      <div>
        <h3 className="text-3xl font-black">{title}</h3>

        <p className="text-slate-500 mt-4 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default Home;
