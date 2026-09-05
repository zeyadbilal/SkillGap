import { useEffect, useState } from "react";
import { analyzeCv } from "../api/api";
import AnalysisResult from "../components/AnalysisResult";

function Analysis() {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");

  /* ================= USER-SPECIFIC STORAGE ================= */

  const getAnalysisStorageKey = () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      const user = JSON.parse(storedUser);

      const identifier = user?.id || user?.email;

      if (!identifier) {
        return null;
      }

      return `latestAnalysis_${identifier}`;
    } catch {
      return null;
    }
  };

  /* ================= RESTORE SAVED ANALYSIS ================= */

  useEffect(() => {
    const storageKey = getAnalysisStorageKey();

    if (!storageKey) {
      return;
    }

    try {
      const savedAnalysis = localStorage.getItem(storageKey);

      if (savedAnalysis) {
        const parsedAnalysis = JSON.parse(savedAnalysis);

        setAnalysisResult(parsedAnalysis);
        setAnalyzed(true);
      }
    } catch (err) {
      console.error("Could not restore saved analysis:", err);
    }

    // Remove old global analysis storage from the previous version
    localStorage.removeItem("latestAnalysis");
  }, []);

  /* ================= FRIENDLY ERRORS ================= */

  const getFriendlyErrorMessage = (err) => {
    // api.js already converts backend errors to friendly messages.
    // Don't re-process those — fall through to them.
    if (err?.isFriendly && err?.message) {
      return err.message;
    }

    const message = err?.message?.toLowerCase() || "";

    if (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("network error") ||
      message.includes("load failed")
    ) {
      return "We couldn't connect to the server. Please make sure the service is running and try again.";
    }

    if (
      message.includes("unauthorized") ||
      message.includes("invalid token") ||
      message.includes("token expired") ||
      message.includes("authentication")
    ) {
      return "Your session has expired. Please log in again.";
    }

    return "We couldn't analyze your CV right now. Please try again.";
  };

  /* ================= FILE SELECTION ================= */

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);

      // Show the upload screen for the newly selected CV.
      // The previous successful result remains safely stored
      // until the new analysis succeeds.
      setAnalyzed(false);
      setAnalysisResult(null);
      setError("");
    }
  };

  /* ================= ANALYZE ================= */

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please choose a CV before starting the analysis.");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const response = await analyzeCv(file);

      console.log("CV analysis response:", response);

      const result = response?.data;

      if (!result) {
        throw new Error("No analysis result was returned");
      }

      setAnalysisResult(result);
      setAnalyzed(true);

      const storageKey = getAnalysisStorageKey();

      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(result));
      }

      // Remove the old shared storage key
      localStorage.removeItem("latestAnalysis");
    } catch (err) {
      console.error("CV analysis failed:", err);

      setError(getFriendlyErrorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  /* ================= ANALYZE ANOTHER CV ================= */

  const handleReset = () => {
    setFile(null);
    setAnalyzed(false);
    setAnalysisResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-slate-950">
      {/* ================= HEADER ================= */}

      <section className="bg-[#111111] text-white">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">
          <p className="text-blue-400 uppercase tracking-widest text-xs font-bold">
            AI skill analysis
          </p>

          <h1 className="text-6xl md:text-8xl font-black tracking-[-0.06em] leading-[0.85] mt-6">
            FIND YOUR
            <br />
            <span className="text-blue-500">SKILL GAP.</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mt-8 leading-relaxed">
            Upload your CV and compare your current skills with what employers
            are looking for.
          </p>
        </div>
      </section>

      {/* ================= UPLOAD ================= */}

      {!analyzed && (
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 md:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">
                ↑
              </div>

              <h2 className="text-3xl font-black mt-6">UPLOAD YOUR CV</h2>

              <p className="text-slate-500 max-w-md mt-3">
                Upload a PDF, DOCX or TXT file. We'll analyze your skills and
                compare them with current market demand.
              </p>

              {/* File input */}

              <label className="mt-8 w-full max-w-xl border-2 border-dashed border-slate-300 rounded-2xl p-10 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!file ? (
                  <div>
                    <p className="font-bold text-lg">Drop your CV here</p>

                    <p className="text-sm text-slate-400 mt-2">
                      or click to browse
                    </p>

                    <p className="text-xs text-slate-400 mt-5">
                      PDF, DOCX, TXT · Max 10 MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-blue-600 font-bold text-lg">
                      {file.name}
                    </p>

                    <p className="text-sm text-slate-400 mt-2">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </label>

              {/* Analyze button */}

              <button
                onClick={handleAnalyze}
                disabled={!file || analyzing}
                className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                {analyzing ? "Analyzing your CV..." : "Analyze My CV →"}
              </button>

              {/* Friendly error */}

              {error && (
                <div className="mt-6 w-full max-w-xl bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
                  <p className="font-bold">We couldn't complete the analysis</p>

                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}

              {analyzing && (
                <div className="mt-8 w-full max-w-md">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-blue-600 rounded-full w-2/3 animate-pulse" />
                  </div>

                  <p className="text-sm text-slate-400 mt-3">
                    Extracting skills and comparing market demand...
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================= RESULTS ================= */}

      {analyzed && analysisResult && (
        <AnalysisResult result={analysisResult} onReset={handleReset} />
      )}
    </div>
  );
}

export default Analysis;
