import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-3xl">
          <p className="text-blue-600 font-semibold mb-4">
            AI-Powered Career Advisor
          </p>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
            Know What the
            <span className="text-blue-600"> Job Market </span>
            Wants.
          </h1>

          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            Upload your CV and discover the skills Egyptian employers are
            looking for, identify your skill gaps, and get a personalized
            learning roadmap.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Analyze My CV
            </Link>

            <Link
              to="/jobs"
              className="border border-slate-300 bg-white text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100"
            >
              Explore Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>

            <p className="mt-3 text-slate-600">
              Understand the market and build the skills you actually need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-slate-200 rounded-xl">
              <div className="text-3xl mb-4">📄</div>

              <h3 className="text-xl font-semibold mb-2">1. Upload Your CV</h3>

              <p className="text-slate-600">
                Upload your CV and let the system identify your current skills
                and experience.
              </p>
            </div>

            <div className="p-6 border border-slate-200 rounded-xl">
              <div className="text-3xl mb-4">📊</div>

              <h3 className="text-xl font-semibold mb-2">
                2. Analyze the Market
              </h3>

              <p className="text-slate-600">
                Compare your skills with what employers are currently demanding.
              </p>
            </div>

            <div className="p-6 border border-slate-200 rounded-xl">
              <div className="text-3xl mb-4">🚀</div>

              <h3 className="text-xl font-semibold mb-2">
                3. Learn What Matters
              </h3>

              <p className="text-slate-600">
                Get prioritized recommendations and a learning roadmap based on
                your skill gaps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <h3 className="text-4xl font-bold text-blue-600">1000+</h3>
              <p className="mt-2 text-slate-600">Job Postings</p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <h3 className="text-4xl font-bold text-blue-600">150+</h3>
              <p className="mt-2 text-slate-600">Skills Analyzed</p>
            </div>

            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <h3 className="text-4xl font-bold text-blue-600">AI</h3>
              <p className="mt-2 text-slate-600">
                Personalized Recommendations
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
