import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Newspaper, RefreshCw, User } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { getUsername } from "../lib/userUtils";
import Avatar from "./Avatar.jsx";
import smallLogo from "../resources/Images/small-logo.png";

export default function Navbar({ onRefresh, isRefreshing = false }) {
  const { user, token, logout, initializing } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const showTabs = location.pathname === "/" || location.pathname.startsWith("/news");
  const isAuthed = Boolean(user && token && !initializing);

  const tabBase = "px-5 py-1.5 rounded-full text-sm font-medium transition-all";
  const tabActive = "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700";
  const tabInactive = "text-zinc-500 hover:text-zinc-300";

  const handleProfile = () => {
    if (!user) return;
    setIsMenuOpen(false);
    navigate(`/profile/${user.id ?? "me"}`);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate("/", { replace: false });
  };

  const username = getUsername(user);

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3 cursor-pointer group">
          <img
            src={smallLogo}
            alt="Bloggle"
            className="h-9 w-auto group-hover:scale-105 transition-transform"
          />
        </NavLink>

        {showTabs ? (
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${tabBase} ${isActive ? tabActive : tabInactive}`
                }
              >
                Global
              </NavLink>
              <NavLink
                to="/news"
                className={({ isActive }) =>
                  `${tabBase} ${isActive ? tabActive : tabInactive}`
                }
              >
                <div className="flex items-center gap-2">
                  <Newspaper size={14} /> News
                </div>
              </NavLink>
            </div>
            <button
              type="button"
              onClick={onRefresh ?? undefined}
              disabled={!onRefresh}
              className={`p-2 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all ${
                isRefreshing ? "animate-spin text-white" : ""
              } ${!onRefresh ? "opacity-50 cursor-not-allowed" : ""}`}
              title="Refresh Feed"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-4">
          {isAuthed ? (
            <div className="relative group">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="focus:outline-none flex items-center gap-2"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">@{username}</p>
                </div>
                <Avatar name={user?.name ?? "User"} src={user?.avatar_url} />
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={handleProfile}
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 border-b border-zinc-800"
                  >
                    <User size={16} /> Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/login"
                className="px-4 py-2 rounded-full text-sm font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
              >
                Log in
              </NavLink>
              <NavLink
                to="/register"
                className="px-4 py-2 rounded-full text-sm font-bold bg-zinc-100 hover:bg-white text-black shadow-lg shadow-zinc-900/50 transition-colors"
              >
                Register
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
