import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const darkPages = ["/", "/dashboard", "/analysis"];

  const isDarkPage = darkPages.includes(location.pathname);

  return (
    <nav
      className={
        isDarkPage
          ? "absolute top-0 left-0 right-0 z-50 text-white"
          : "relative z-50 bg-white border-b border-slate-200 text-slate-900"
      }
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-tight">
          Skill<span className="text-blue-500">Gap</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link
            to="/"
            className={
              isDarkPage
                ? "text-white/70 hover:text-white transition"
                : "text-slate-600 hover:text-blue-600 transition"
            }
          >
            Home
          </Link>

          <Link
            to="/jobs"
            className={
              isDarkPage
                ? "text-white/70 hover:text-white transition"
                : "text-slate-600 hover:text-blue-600 transition"
            }
          >
            Jobs
          </Link>

          <Link
            to="/dashboard"
            className={
              isDarkPage
                ? "text-white/70 hover:text-white transition"
                : "text-slate-600 hover:text-blue-600 transition"
            }
          >
            Dashboard
          </Link>

          <Link
            to="/login"
            className={
              isDarkPage
                ? "text-white/70 hover:text-white transition"
                : "text-slate-600 hover:text-blue-600 transition"
            }
          >
            Login
          </Link>

          <Link
            to="/register"
            className={
              isDarkPage
                ? "bg-white text-black px-5 py-3 rounded-full font-semibold hover:bg-slate-200 transition"
                : "bg-blue-600 text-white px-5 py-3 rounded-full font-semibold hover:bg-blue-700 transition"
            }
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
