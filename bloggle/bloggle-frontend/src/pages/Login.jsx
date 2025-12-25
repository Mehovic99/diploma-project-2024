import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, API_BASE } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

export default function Login() {
  const { user, token, initializing, loginWithToken } = useAuth();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bloggle</h1>
          <p className="text-zinc-400">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl bg-black/40 border border-zinc-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl bg-black/40 border border-zinc-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl bg-white text-black font-bold text-center disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <div className="flex-1 h-px bg-zinc-800" />
          <span>OR</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <div className="flex flex-col gap-3">
          <a href={google} className="px-4 py-3 rounded-xl bg-white text-black font-bold text-center">
            Continue with Google
          </a>
          <a href={facebook} className="px-4 py-3 rounded-xl bg-zinc-800 text-white font-bold text-center border border-zinc-700">
            Continue with Facebook
          </a>
        </div>

        <p className="text-sm text-zinc-400">
          New here?{" "}
          <Link className="text-white underline" to="/register">
            Create an account
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
