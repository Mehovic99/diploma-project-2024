import { API_BASE } from "../lib/api";

export default function Login() {
  const google = `${API_BASE}/auth/google/redirect`;
  const facebook = `${API_BASE}/auth/facebook/redirect`;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-3xl font-bold mb-2">Bloggle</h1>
        <p className="text-zinc-400 mb-6">Sign in</p>

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