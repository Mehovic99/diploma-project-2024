import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, API_BASE } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import Button from "../components/Button.jsx";
import logoTrans from "../resources/Images/logo-trans.png";
import logoGoogle from "../resources/Images/logo-google.png";
import logoFacebook from "../resources/Images/logo-facebook.png";

export default function Login() {
  const { user, token, initializing, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.message ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lookupUser, setLookupUser] = useState(null);
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(false);
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

  const emailInitials = useMemo(() => {
    const trimmed = email.trim();
    if (!trimmed) return "";
    return trimmed.slice(0, 2).toUpperCase();
  }, [email]);

  const handleNext = async (event) => {
    event.preventDefault();
    if (checking) return;

    const trimmed = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailPattern.test(trimmed);


    if (!trimmed) {
      setError("Email is required.");
      return;
    }

    if (!isValidEmail) {
      setError("Enter a valid email address.");
      return;
    }

    setChecking(true);
    setError("");

    try {
      const data = await api("/api/auth/lookup", {
        method: "POST",
        body: { email: trimmed },
      });


      if (!data?.exists) {
        setError("No account found for that email.");
        return;
      }

      setLookupUser(data.user ?? null);
      setStep(2);
    } catch (err) {
      setError(err?.data?.message || err.message || "Unable to find that account.");
    } finally {
      setChecking(false);
    }
  };

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
          <img src={logoTrans} alt="Bloggle" className="h-72 w-auto mx-auto mb-4" />
          <h1 className="sr-only">Bloggle</h1>
          <p className="text-zinc-500">Welcome back.</p>
        </div>

        {notice ? <p className="text-sm text-amber-300 mb-4">{notice}</p> : null}

        <form
          onSubmit={step === 1 ? handleNext : handleSubmit}
          className="space-y-4"
          noValidate
        >
          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-white focus:border-white focus:outline-none transition-all placeholder:text-zinc-700"
                  placeholder="Enter your email"
                  autoFocus
                  required
                />
              </div>
              <div className="pt-4">
                {error ? <p className="text-sm text-red-400 mt-3">{error}</p> : null}
                <Button type="submit" className="w-full py-3 text-base" disabled={checking}>
                  {checking ? "Checking..." : "Next"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-3 border border-zinc-800 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                    {lookupUser?.avatar_url ? (
                      <img
                        src={lookupUser.avatar_url}
                        alt={lookupUser?.name ?? email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      emailInitials || "?"
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="text-white font-medium">
                      {lookupUser?.name ?? email}
                    </p>
                    <p className="text-zinc-500 text-xs">Signing in</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setPassword("");
                    setLookupUser(null);
                    setError("");
                  }}
                  className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Change
                </button>
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
                  autoFocus
                  required
                />
              </div>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setPassword("");
                    setLookupUser(null);
                    setError("");
                  }}
                  className="px-4 py-3 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <Button
                  type="submit"
                  className="w-full py-3 text-base flex-1"
                  disabled={submitting}
                >
                  {submitting ? "Signing in..." : "Log in"}
                </Button>
              </div>
            </div>
          )}
        </form>

        <div className="flex items-center gap-3 text-xs text-zinc-500 my-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span>OR</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={google}
            className="px-4 py-3 rounded-full bg-zinc-100 text-black font-bold text-center shadow-lg shadow-zinc-900/50 flex items-center justify-center"
            aria-label="Continue with Google"
          >
            <img src={logoGoogle} alt="Google" className="h-5 w-auto" />
          </a>
          <a
            href={facebook}
            className="px-4 py-3 rounded-full bg-black text-white font-bold text-center border border-zinc-700 flex items-center justify-center"
            aria-label="Continue with Facebook"
          >
            <img src={logoFacebook} alt="Facebook" className="h-5 w-auto" />
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
