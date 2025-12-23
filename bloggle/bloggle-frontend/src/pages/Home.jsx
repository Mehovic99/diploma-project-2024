import { useAuth } from "../lib/auth.jsx";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Welcome back</p>
          <h1 className="text-3xl font-bold">Home</h1>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-sm text-zinc-400 mb-2">Current user</p>
        <pre className="bg-black/40 border border-zinc-800 rounded-xl p-4 overflow-auto text-sm">
{JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
