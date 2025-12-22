import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const rawUser = params.get("user");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    localStorage.setItem("token", token);

    if (rawUser) {
      try {
        let parsedUser = null;

        try {
          parsedUser = JSON.parse(rawUser);
        } catch {
          const normalized = rawUser.replace(/-/g, "+").replace(/_/g, "/");
          const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
          const decoded = atob(padded);
          parsedUser = JSON.parse(decoded);
        }

        if (parsedUser) {
          localStorage.setItem("user", JSON.stringify(parsedUser));
        }
      } catch {
        // Ignore malformed user payloads
      }
    }

    navigate("/", { replace: true });
  }, [location.search, navigate]);

  return <div>Logging you in...</div>;
}
