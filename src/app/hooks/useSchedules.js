// src/hooks/useSchedules.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeacherSchedules, createSchedule, cancelSchedule } from "../api/schedules";

export function useTeacherSchedules() {
  return useQuery({ queryKey: ["schedules"], queryFn: getTeacherSchedules });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSchedule,
    onSuccess: () => qc.invalidateQueries(["schedules"]),
  });
}

export function useCancelSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelSchedule,
    onSuccess: () => qc.invalidateQueries(["schedules"]),
  });
}
