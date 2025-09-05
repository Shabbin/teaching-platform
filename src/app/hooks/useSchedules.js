// src/hooks/useSchedules.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeacherSchedules, createSchedule, cancelSchedule } from "../../api/schedules";

export function useTeacherSchedules() {
  return useQuery({
    queryKey: ["schedules"],           // keep as-is (used elsewhere)
    queryFn: getTeacherSchedules,
    staleTime: 10_000,                 // optional: reduces refetch flicker
    refetchOnWindowFocus: false,       // optional
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

export function useCancelSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
}
