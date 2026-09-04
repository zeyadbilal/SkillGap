import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/api";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [graduationYear, setGraduationYear] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
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

      // Store authentication tokens
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Store user information
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
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

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="text-xs text-slate-400 mt-2">
                At least 8 characters, including uppercase, lowercase, and a
                number.
              </p>
            </div>

            {/* Field of Study */}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Field of Study
              </label>

              <select
                value={fieldOfStudy}
                onChange={(event) => setFieldOfStudy(event.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select your field</option>

                <option value="Software Development">
                  Software Development
                </option>

                <option value="Data Science & Analytics">
                  Data Science & Analytics
                </option>

                <option value="DevOps & Cloud Infrastructure">
                  DevOps & Cloud Infrastructure
                </option>

                <option value="Product Management">Product Management</option>

                <option value="UI/UX Design">UI/UX Design</option>

                <option value="Business Analysis">Business Analysis</option>

                <option value="Cybersecurity">Cybersecurity</option>

                <option value="Mobile Development">Mobile Development</option>
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
                max="2027"
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
