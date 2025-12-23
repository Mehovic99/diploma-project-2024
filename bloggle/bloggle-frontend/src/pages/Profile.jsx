import { useParams } from "react-router-dom";

export default function Profile() {
  const { id } = useParams();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="text-zinc-300">Profile page for {id}</p>
    </div>
  );
}
