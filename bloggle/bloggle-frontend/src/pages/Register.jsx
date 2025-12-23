import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function Register() {
  const { user, token, initializing } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initializing) return;
    if (user && token) {
      navigate("/", { replace: true });
    }
  }, [user, token, initializing, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Create account</h1>
          <p className="text-zinc-400">Registration form coming soon.</p>
        </div>
        <p className="text-sm text-zinc-400">
          Please use one of the sign-in options on the login page while we finish this flow.
        </p>
      </div>
    </div>
  );
}
