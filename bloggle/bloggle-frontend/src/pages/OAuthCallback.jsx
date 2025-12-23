import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { clearToken } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Missing token.");
      return;
    }

    (async () => {
      try {
        await loginWithToken(token);
        navigate("/", { replace: true });
      } catch {
        clearToken();
        setError("Login failed. Please try again.");
        navigate("/login", { replace: true });
      }
    })();
  }, [token, loginWithToken, navigate]);

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
      Completing login...
    </div>
  );
}
