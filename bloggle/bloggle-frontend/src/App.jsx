import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";

export default function App() {
  const [refreshHandler, setRefreshHandler] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!refreshHandler) return;
    setIsRefreshing(true);
    try {
      await refreshHandler();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshHandler]);

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-zinc-700 selection:text-white">
      <Navbar
        onRefresh={refreshHandler ? handleRefresh : null}
        isRefreshing={isRefreshing}
      />
      <Outlet context={{ setRefreshHandler }} />
    </div>
  );
}
