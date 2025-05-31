'use client';
import ProtectedRoute from '././../../components/auth/protectedRoute';
import StudentDashboardInner from '../components/studentDashboardInner';

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentDashboardInner/>
    </ProtectedRoute>
  );
}
