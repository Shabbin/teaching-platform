import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTeacherSchedules,
  getStudentSchedules,   // ⬅️ make sure this exists in ../../api/schedules
  createSchedule,
  cancelSchedule,
} from "../../api/schedules";

// (existing) teacher
export function useTeacherSchedules() {
  return useQuery({
    queryKey: ["schedules","teacher"],
    queryFn: getTeacherSchedules,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

// ✅ NEW: student
export function useStudentSchedules() {
  return useQuery({
    queryKey: ["schedules","student"],
    queryFn: getStudentSchedules,   // if your API name differs, swap it here
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

// (keep your existing create/cancel mutations)
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
