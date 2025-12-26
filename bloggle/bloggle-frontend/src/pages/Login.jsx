import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, API_BASE } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import Button from "../components/Button.jsx";

export default function Login() {
  const { user, token, initializing, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.message ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initializing) return;
    if (user && token) {
      navigate("/", { replace: true });
    }
  }, [user, token, initializing, navigate]);

  const google = `${API_BASE}/auth/google/redirect`;
  const facebook = `${API_BASE}/auth/facebook/redirect`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      await loginWithToken(data.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.data?.message || err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black"></div>

      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-zinc-700 shadow-lg">
            <span className="text-2xl font-black text-white">B</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Bloggle</h1>
          <p className="text-zinc-500">Sign in to continue.</p>
        </div>

        {notice ? <p className="text-sm text-amber-300 mb-4">{notice}</p> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white focus:border-white focus:outline-none transition-all placeholder:text-zinc-700"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white focus:border-white focus:outline-none transition-all placeholder:text-zinc-700"
              placeholder="Enter your password"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button type="submit" className="w-full py-3 text-base" disabled={submitting}>
            {submitting ? "Signing in..." : "Log in"}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-zinc-500 my-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span>OR</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <div className="flex flex-col gap-3">
          <a href={google} className="px-4 py-3 rounded-full bg-zinc-100 text-black font-bold text-center shadow-lg shadow-zinc-900/50">
            Continue with Google
          </a>
          <a href={facebook} className="px-4 py-3 rounded-full bg-zinc-800 text-white font-bold text-center border border-zinc-700">
            Continue with Facebook
          </a>
        </div>

        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            <Link className="text-white hover:underline font-medium" to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
