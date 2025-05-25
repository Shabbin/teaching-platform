'use client';
import ProtectedRoute from '././../../components/auth/protectedRoute';
import TeacherDashboardInner from './components/TeacherDashboardInner';

export default function TeacherDashboardPage() {
  return (
    <ProtectedRoute allowedRole="teacher">
      <TeacherDashboardInner />
    </ProtectedRoute>
  );
}
