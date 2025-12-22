import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, setToken } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

export default function OAuthCallback() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const token = sp.get("token");

      if (!token) {
        setError("Missing token.");
        return;
      }

      setToken(token);

      try {
        const me = await api("/api/auth/me", { token });
        setUser(me);
        nav("/", { replace: true });
      } catch {
        localStorage.removeItem("token");
        setError("Login failed. Please try again.");
      }
    })();
  }, [sp, nav, setUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold">{error}</p>
          <Link to="/login" className="text-blue-400 underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      Logging in...
    </div>
  );
}
