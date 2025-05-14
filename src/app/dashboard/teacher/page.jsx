'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
console.log(teacherData, "TeacherData")
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/teacher/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
      
        });
        if (!res.ok) {
          throw new Error('Unauthorized');
        }
    console.log(res)
        const data = await res.json();
        setTeacherData(data);
      } catch (err) {
        console.error(err);
        router.push('/login'); // In case of token issues
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  if (loading) return <p className="p-6">Loading dashboard...</p>;

  if (!teacherData) return <p className="p-6 text-red-500">Unable to load dashboard data.</p>;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-5xl mx-auto py-10 px-6">
        <h1 className="text-3xl font-bold mb-4 text-indigo-600">Welcome, {teacherData.teacher.name} 👋</h1>
        <p className="mb-6">Here's a summary of your dashboard:</p>

        <div className="bg-white shadow p-6 rounded-lg">
          <p><strong>Email:</strong> {teacherData.teacher.email}</p>
          <p><strong>Role:</strong> {teacherData.teacher.role}</p>
          <p><strong>Eligibility:</strong> {teacherData.teacher.isEligible ? '✅ Eligible' : '❌ Not Eligible'}</p>
          
        </div>
      </div>
    </main>
  );
}
