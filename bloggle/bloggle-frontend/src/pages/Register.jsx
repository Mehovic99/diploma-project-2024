import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

export default function Register() {
  const { user, token, initializing, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initializing) return;
    if (user && token) {
      navigate("/", { replace: true });
    }
  }, [user, token, initializing, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: {
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        },
      });
      await loginWithToken(data.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.data?.message || err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Create account</h1>
          <p className="text-zinc-400">Join Bloggle in a few seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="w-full rounded-xl bg-black/40 border border-zinc-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
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
              autoComplete="new-password"
              className="w-full rounded-xl bg-black/40 border border-zinc-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-300" htmlFor="password_confirmation">
              Confirm password
            </label>
            <input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl bg-black/40 border border-zinc-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl bg-white text-black font-bold text-center disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-zinc-400">
          Already have an account?{" "}
          <Link className="text-white underline" to="/login">
            Sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
