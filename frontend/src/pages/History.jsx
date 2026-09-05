import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAnalysisHistory } from "../api/api";

function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getAnalysisHistory()
      .then((response) => {
        if (active) {
          setItems(response?.data ?? []);
        }
      })
      .catch((err) => {
        if (active) {
          const message =
            err?.isFriendly && err?.message
              ? err.message
              : "We couldn't load your analysis history right now. Please try again.";

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
  }, []);

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-slate-950">
      {/* ================= HEADER ================= */}

      <section className="bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">
          <p className="text-blue-400 uppercase tracking-widest text-xs font-bold">
            Analysis history
          </p>

          <h1 className="text-6xl md:text-8xl font-black tracking-[-0.06em] leading-[0.85] mt-6">
            YOUR PAST
            <br />
            <span className="text-blue-500">ANALYSES.</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mt-8 leading-relaxed">
            Review every CV you've analyzed and revisit its skill gap results.
          </p>
        </div>
      </section>

      {/* ================= LIST ================= */}

      <section className="max-w-5xl mx-auto px-6 py-20">
        {loading ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-10">
            <p className="text-slate-500">Loading your history...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[2rem] border border-red-200 p-10">
            <p className="font-bold text-red-700">
              We couldn't load your history
            </p>

            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-10 md:p-14">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto">
                CV
              </div>

              <h2 className="text-3xl font-black mt-6">NO ANALYSES YET</h2>

              <p className="text-slate-500 max-w-md mx-auto mt-3">
                Analyze your CV once and it will show up here so you can revisit
                the results anytime.
              </p>

              <Link
                to="/analysis"
                className="inline-block mt-8 bg-blue-600 text-white px-7 py-3 rounded-full font-bold hover:bg-blue-700 transition"
              >
                Analyze your CV →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/history/${item.id}`}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-[1.5rem] border border-slate-200 p-6 hover:border-blue-400 hover:shadow-sm transition"
              >
                <div>
                  <p className="text-lg font-black">
                    {item.track || "General analysis"}
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    {formatDate(item.createdAt)}
                    <span className="mx-2">·</span>
                    {item.source === "file" ? "File upload" : "Pasted text"}
                  </p>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-left md:text-right">
                    <p className="text-2xl font-black text-blue-600">
                      {item.matchScore ?? "—"}%
                    </p>

                    <p className="text-xs text-slate-400 font-medium">Match</p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-2xl font-black">
                      {item.detectedSkills ?? "—"}
                    </p>

                    <p className="text-xs text-slate-400 font-medium">
                      Skills detected
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-2xl font-black text-orange-600">
                      {item.missingSkills ?? "—"}
                    </p>

                    <p className="text-xs text-slate-400 font-medium">Gaps</p>
                  </div>

                  <span className="text-slate-300">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default History;
