import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const token = searchParams.get("token");
  const isNewUser = searchParams.get("new") === "1";

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    localStorage.setItem("auth_token", token);

    (async () => {
      try {
        await loginWithToken(token);
        navigate(isNewUser ? "/profile/me?setup=1" : "/", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    })();
  }, [token, loginWithToken, navigate]);

  return <div>Completing login...</div>;
}
