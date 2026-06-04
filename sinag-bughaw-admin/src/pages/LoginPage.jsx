import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { handleLogin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const logoSrc     = "/images/NU_logo.png";
  const buildingSrc = "/images/NU-building.jpg";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/admin/login", { username, password });
      const { token, admin } = res.data;
      handleLogin(admin, token); // ← pass BOTH admin and token to AuthContext
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 md:p-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">
        <div
          className="relative flex flex-col justify-between gap-6 bg-cover bg-center p-8 text-slate-50 md:p-11"
          style={{
            backgroundImage: `linear-gradient(165deg, rgba(0, 23, 72, .92) 0%, rgba(0, 47, 135, .86) 60%, rgba(0, 53, 150, .82) 100%), url("${buildingSrc}")`,
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400" />

          <div>
            <div className="mb-4 grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-amber-300/60 bg-white shadow-lg">
              <img src={logoSrc} alt="National University Logo" className="h-[86%] w-[86%] object-contain" />
            </div>
            <h2 className="mb-2 text-3xl font-extrabold leading-tight md:text-4xl">National University</h2>
            <p className="max-w-sm text-sm leading-relaxed text-blue-100 md:text-base">
              Digital Yearbook Admin Portal
            </p>
          </div>

          <div className="relative z-10 rounded-xl border border-white/25 bg-slate-900/35 p-3.5 text-xs leading-relaxed text-blue-50 md:text-sm">
            <strong className="text-amber-300">Security Notice:</strong> This system is monitored.
            Unauthorized access attempts are logged and may be reported.
          </div>
        </div>

        <div className="flex flex-col justify-center bg-white p-8 md:p-11">
          <div className="mb-7">
            <h3 className="mb-1 text-2xl font-extrabold text-blue-950 md:text-[1.65rem]">Admin Sign In</h3>
            <p className="text-sm leading-relaxed text-slate-500 md:text-base">
              Use your administrator credentials to continue.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                Admin Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-700 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPw ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-900 text-sm font-extrabold tracking-wide text-white shadow-lg transition hover:bg-blue-950 disabled:cursor-wait disabled:opacity-80"
            >
              {loading ? "Authenticating..." : "SECURE LOGIN"}
            </button>

            <div className="mt-3 text-center">
              <button type="button" className="text-xs font-bold text-amber-700 transition hover:text-amber-800">
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}