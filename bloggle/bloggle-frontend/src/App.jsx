import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";

export default function App() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const initials =
    user?.name
      ? user.name
          .split(" ")
          .filter(Boolean)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "?";

  const linkBase =
    "px-3 py-2 rounded-xl border border-transparent text-sm font-medium transition-colors";

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-6">
          <div className="text-xl font-bold">Bloggle</div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "bg-zinc-800 text-white border-zinc-700"
                    : "text-zinc-300 hover:text-white hover:border-zinc-700"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/news"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "bg-zinc-800 text-white border-zinc-700"
                    : "text-zinc-300 hover:text-white hover:border-zinc-700"
                }`
              }
            >
              News
            </NavLink>
            <NavLink
              to={`/profile/${user?.id ?? "me"}`}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "bg-zinc-800 text-white border-zinc-700"
                    : "text-zinc-300 hover:text-white hover:border-zinc-700"
                }`
              }
            >
              Profile
            </NavLink>
            <div className="w-9 h-9 rounded-full border border-zinc-700 overflow-hidden bg-zinc-900 flex items-center justify-center text-xs font-semibold">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name ?? "User avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
