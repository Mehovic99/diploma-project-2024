export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded-full border border-zinc-800 shadow-lg">
      {message}
    </div>
  );
}
