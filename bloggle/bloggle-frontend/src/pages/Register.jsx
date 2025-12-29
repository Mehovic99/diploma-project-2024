import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import Button from "../components/Button.jsx";
import logoTrans from "../resources/Images/logo-trans.png";

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
      navigate("/profile/me?setup=1", { replace: true });
    } catch (err) {
      setError(err?.data?.message || err.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black"></div>

      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <img src={logoTrans} alt="Bloggle" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create account</h1>
          <p className="text-zinc-500">Join Bloggle in a few seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white focus:border-white focus:outline-none transition-all placeholder:text-zinc-700"
              placeholder="Enter your name"
              required
            />
          </div>
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white focus:border-white focus:outline-none transition-all placeholder:text-zinc-700"
              placeholder="Create a password"
              required
            />
          </div>
          <div>
            <label
              className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2"
              htmlFor="password_confirmation"
            >
              Confirm password
            </label>
            <input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white focus:border-white focus:outline-none transition-all placeholder:text-zinc-700"
              placeholder="Confirm your password"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button type="submit" className="w-full py-3 text-base" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            <Link className="text-white hover:underline font-medium" to="/login">
              Already have an account? Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
