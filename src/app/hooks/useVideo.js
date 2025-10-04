// src/hooks/useVideo.js
"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { canJoin, issueJoinToken } from "../../api/video";

export function useCanJoin(scheduleId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["video-can-join", scheduleId],
    queryFn: () => canJoin(scheduleId),
    enabled: !!scheduleId && enabled,
    refetchInterval: 20_000, // poll quietly; keeps the button in sync
    staleTime: 10_000,
  });
}

export function useIssueJoinToken() {
  return useMutation({
    mutationFn: (scheduleId) => issueJoinToken(scheduleId),
  });
}
