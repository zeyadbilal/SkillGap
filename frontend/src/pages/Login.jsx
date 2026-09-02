import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    // Temporary frontend login
    // Later this will call the backend API.

    navigate("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#f5f5f0] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
        {/* Left side */}

        <div className="hidden lg:flex bg-[#111111] text-white p-12 flex-col justify-between min-h-[600px]">
          <div>
            <p className="text-blue-400 text-xs uppercase tracking-widest font-bold">
              SkillGap
            </p>

            <h2 className="text-6xl font-black tracking-[-0.06em] leading-[0.85] mt-8">
              KNOW
              <br />
              WHERE
              <br />
              YOU
              <br />
              STAND.
            </h2>
          </div>

          <p className="text-slate-400 max-w-sm">
            Understand your skills, compare them with the market, and discover
            what you should learn next.
          </p>
        </div>

        {/* Right side */}

        <div className="p-8 md:p-12">
          <p className="text-blue-600 text-xs uppercase tracking-widest font-bold">
            Welcome back
          </p>

          <h1 className="text-4xl font-black mt-3">LOGIN</h1>

          <p className="text-slate-500 mt-3">Continue your career journey.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold">Password</label>

                <button type="button" className="text-xs text-blue-600">
                  Forgot password?
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition"
            >
              Login →
            </button>
          </form>

          <p className="text-center text-slate-500 mt-8 text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
