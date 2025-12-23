import { NavLink, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import RequireAuth from "./routes/RequireAuth.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import News from "./pages/News.jsx";
import Profile from "./pages/Profile.jsx";
import OAuthCallback from "./pages/OAuthCallback.jsx";

function ProtectedLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

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

function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-xl font-semibold">Page not found</p>
        <p className="text-zinc-400">Check the address or go back home.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/profile/:id" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
