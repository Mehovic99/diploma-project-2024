import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-zinc-700 selection:text-white">
      <Navbar />
      <Outlet />
    </div>
  );
}
