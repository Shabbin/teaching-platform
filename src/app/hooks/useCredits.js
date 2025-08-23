// src/hooks/useCredits.js
import { useEffect, useState, useCallback } from "react";
import { getTopicCredits } from "@/api/payments";

export function useCredits(studentId) {
  const [credits, setCredits] = useState(null);
  const refresh = useCallback(async () => {
    if (!studentId) return;
    const { topicCredits } = await getTopicCredits(studentId);
    setCredits(topicCredits ?? 0);
  }, [studentId]);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return { credits, refresh, setCredits };
}
