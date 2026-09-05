import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAnalysisById } from "../api/api";
import AnalysisResult from "../components/AnalysisResult";

function HistoryDetail() {
  const { id } = useParams();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getAnalysisById(id)
      .then((response) => {
        if (active) {
          setAnalysis(response?.data ?? null);
        }
      })
      .catch((err) => {
        if (active) {
          const message =
            err?.isFriendly && err?.message
              ? err.message
              : "We couldn't load this analysis. Please try again.";

          setError(message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-slate-950">
      {/* ================= HEADER ================= */}

      <section className="bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            ← Back to history
          </Link>

          <p className="text-blue-400 uppercase tracking-widest text-xs font-bold mt-8">
            Previous analysis
          </p>

          <h1 className="text-5xl md:text-7xl font-black tracking-[-0.06em] leading-[0.85] mt-4">
            YOUR SKILL
            <br />
            <span className="text-blue-500">GAP RESULTS.</span>
          </h1>

          {analysis && (
            <p className="text-slate-400 text-lg mt-6">
              {analysis.track || "General analysis"} ·{" "}
              {formatDate(analysis.createdAt)}
            </p>
          )}
        </div>
      </section>

      {/* ================= CONTENT ================= */}

      {loading ? (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-10">
            <p className="text-slate-500">Loading this analysis...</p>
          </div>
        </section>
      ) : error ? (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="bg-white rounded-[2rem] border border-red-200 p-10 text-center">
            <p className="font-bold text-red-700">
              We couldn't load this analysis
            </p>

            <p className="text-sm text-red-600 mt-1">{error}</p>

            <Link
              to="/history"
              className="inline-block mt-8 border border-slate-300 bg-white px-5 py-3 rounded-full font-semibold hover:bg-slate-50"
            >
              Back to history
            </Link>
          </div>
        </section>
      ) : (
        <AnalysisResult result={analysis?.result} />
      )}
    </div>
  );
}

export default HistoryDetail;
