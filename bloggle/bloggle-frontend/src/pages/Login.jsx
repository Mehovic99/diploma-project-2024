import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

export default function Login() {
  const { user, token, initializing } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initializing) return;
    if (user && token) {
      navigate("/", { replace: true });
    }
  }, [user, token, initializing, navigate]);

  const google = `${API_BASE}/auth/google/redirect`;
  const facebook = `${API_BASE}/auth/facebook/redirect`;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bloggle</h1>
          <p className="text-zinc-400">Sign in to continue</p>
        </div>

        <div className="flex flex-col gap-3">
          <a href={google} className="px-4 py-3 rounded-xl bg-white text-black font-bold text-center">
            Continue with Google
          </a>
          <a href={facebook} className="px-4 py-3 rounded-xl bg-zinc-800 text-white font-bold text-center border border-zinc-700">
            Continue with Facebook
          </a>
        </div>
      </div>
    </div>
  );
}
