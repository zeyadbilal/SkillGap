import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const darkPages = ["/", "/dashboard", "/analysis"];

  const isDarkPage = darkPages.includes(location.pathname);

  const accessToken = localStorage.getItem("accessToken");
  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const isLoggedIn = Boolean(accessToken && user);

  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "User";

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;

    if (isDarkPage) {
      return isActive
        ? "text-white font-bold"
        : "text-white/70 hover:text-white transition";
    }

    return isActive
      ? "text-blue-600 font-bold"
      : "text-slate-600 hover:text-blue-600 transition";
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <nav
      className={
        isDarkPage
          ? "absolute top-0 left-0 right-0 z-50 text-white"
          : "relative z-50 bg-white border-b border-slate-200 text-slate-900"
      }
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* ================= LOGO ================= */}

        <Link to="/" className="text-2xl font-black tracking-tight">
          Skill
          <span className="text-blue-500">Gap</span>
        </Link>

        {/* ================= DESKTOP NAV ================= */}

        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/" className={getLinkClass("/")}>
            Home
          </Link>

          {isLoggedIn && (
            <>
              <Link to="/dashboard" className={getLinkClass("/dashboard")}>
                Dashboard
              </Link>

              <Link to="/analysis" className={getLinkClass("/analysis")}>
                Analysis
              </Link>

              <Link to="/jobs" className={getLinkClass("/jobs")}>
                Jobs
              </Link>
            </>
          )}

          {/* ================= LOGGED OUT ================= */}

          {!isLoggedIn && (
            <>
              <Link to="/login" className={getLinkClass("/login")}>
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
            </>
          )}

          {/* ================= LOGGED IN ================= */}

          {isLoggedIn && (
            <div className="flex items-center gap-4">
              <span className={isDarkPage ? "text-white/60" : "text-slate-400"}>
                Hi, {firstName}
              </span>

              <button
                onClick={handleLogout}
                className={
                  isDarkPage
                    ? "bg-white text-black px-5 py-3 rounded-full font-semibold hover:bg-slate-200 transition"
                    : "bg-black text-white px-5 py-3 rounded-full font-semibold hover:bg-slate-800 transition"
                }
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
