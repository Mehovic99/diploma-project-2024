import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

export default function useFeed(path) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const data = await api(path);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setItems(list);
    } catch (err) {
      setError(err?.data?.message || err.message || "Failed to load feed.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    setItems,
    loading,
    error,
    reload: load,
  };
}
