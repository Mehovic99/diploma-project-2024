export default function Loading({ message = "Loading..." }) {
  return (
    <div className="text-center py-10 text-zinc-500">
      <p className="text-lg">{message}</p>
    </div>
  );
}
