import { useEffect } from "react";
import { api, getToken, clearToken } from "../lib/api";
import { useAuth } from "../lib/auth.jsx";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const token = getToken();

  useEffect(() => {
    (async () => {
      if (!token) {
        nav("/login", { replace: true });
        return;
      }
      if (!user) {
        const data = await api("/api/auth/me", { token });
        setUser(data);
      }
    })();
  }, [token, nav, user, setUser]);

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST", token });
    clearToken();
    setUser(null);
    nav("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Home</h1>
          <button onClick={logout} className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700">
            Logout
          </button>
        </div>

        <pre className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 overflow-auto">
{JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
