export default function ErrorState({ message }) {
  if (!message) return null;

  return (
    <div className="text-center py-6 text-red-400">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
