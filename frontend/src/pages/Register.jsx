import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { registerUser } from "../api/api";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [graduationYear, setGraduationYear] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // Password validation
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinimumLength = password.length >= 8;

    if (!hasMinimumLength || !hasUppercase || !hasLowercase || !hasNumber) {
      setError(
        "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        fullName: name,
        email,
        password,
        fieldOfStudy,
        graduationYear: Number(graduationYear),
      });

      console.log("Registration successful:", response);

      const { accessToken, refreshToken } = response.data.tokens;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      localStorage.setItem("user", JSON.stringify(response.data.user));

      const from = location.state?.from?.pathname || "/dashboard";

      navigate(from, { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#f5f5f0] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
        {/* Left */}

        <div className="hidden lg:flex bg-[#d8ff4f] text-black p-12 flex-col justify-between min-h-[700px]">
          <div>
            <p className="text-xs uppercase tracking-widest font-black">
              Start here
            </p>

            <h2 className="text-6xl font-black tracking-[-0.06em] leading-[0.85] mt-8">
              YOUR
              <br />
              NEXT
              <br />
              MOVE
              <br />
              STARTS
              <br />
              HERE.
            </h2>
          </div>

          <p className="max-w-sm">
            Build your profile and discover which skills can make you more
            competitive in the job market.
          </p>
        </div>

        {/* Right */}

        <div className="p-8 md:p-12">
          <p className="text-blue-600 text-xs uppercase tracking-widest font-bold">
            Get started
          </p>

          <h1 className="text-4xl font-black mt-3">CREATE ACCOUNT</h1>

          <p className="text-slate-500 mt-3">
            Build your personalized career profile.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Full Name */}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ahmed Mohamed"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}

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

            {/* Password */}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-14 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                At least 8 characters, including uppercase, lowercase, and a
                number.
              </p>
            </div>

            {/* Field of Study */}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Career Track
              </label>

              <select
                value={fieldOfStudy}
                onChange={(event) => setFieldOfStudy(event.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select your track</option>

                <option value="Backend Development">Backend Development</option>

                <option value="Frontend Development">
                  Frontend Development
                </option>

                <option value="Full-Stack Development">
                  Full-Stack Development
                </option>

                <option value="Mobile Development">Mobile Development</option>

                <option value="DevOps & Cloud Engineering">
                  DevOps & Cloud Engineering
                </option>

                <option value="Network Administration">
                  Network Administration
                </option>

                <option value="Network Security">Network Security</option>

                <option value="Machine Learning / AI">
                  Machine Learning / AI
                </option>
              </select>
            </div>

            {/* Graduation Year */}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Graduation Year
              </label>

              <input
                type="number"
                value={graduationYear}
                onChange={(event) => setGraduationYear(event.target.value)}
                placeholder="2027"
                min="2000"
                max={new Date().getFullYear() + 1}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error */}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-8 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;