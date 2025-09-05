// src/hooks/useRoutines.js
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyRoutines,
  setRoutineStatus,
  deleteRoutine,
} from '../api/routines';

export function useTeacherRoutines() {
  return useQuery({
    queryKey: ['routines', 'mine'],
    queryFn: async () => {
      const res = await getMyRoutines();         // { items, page, limit, total }
      return Array.isArray(res?.items) ? res.items : [];
    },
  });
}

export function useRoutineActions() {
  const qc = useQueryClient();

  const status = useMutation({
    mutationFn: ({ id, status }) => setRoutineStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines', 'mine'] }),
  });

  const remove = useMutation({
    mutationFn: (id) => deleteRoutine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines', 'mine'] }),
  });

  return { status, remove };
}
