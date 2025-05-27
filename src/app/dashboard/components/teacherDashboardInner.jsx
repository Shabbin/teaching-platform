'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setTeacherData, updateProfileImage } from './../../redux/userSlice';

export default function TeacherDashboardInner() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [teacherData, setTeacherDataLocal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const dispatch = useDispatch();

  const fetchDashboard = async () => {
    const token = localStorage.getItem('token'); //ssss
    try {
      const res = await fetch('http://localhost:5000/api/auth/teacher/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();

      setTeacherDataLocal(data);
      dispatch(setTeacherData({ ...data.teacher, canApplyToTuitions: data.canApplyToTuitions }));
    } catch (err) {
      console.error(err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      fetchDashboard();
    }
  }, [router]);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      setUploading(true);
      const res = await fetch('http://localhost:5000/api/teachers/profile-picture', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      setTeacherDataLocal((prev) => ({
        ...prev,
        teacher: { ...prev.teacher, profileImage: data.profileImage },
      }));

      dispatch(updateProfileImage(data.profileImage));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p className="p-6">Loading dashboard...</p>;
  if (!teacherData) return <p className="p-6 text-red-500">Unable to load dashboard data.</p>;

  const { teacher } = teacherData;

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row items-center gap-6 relative">
        <div className="relative w-32 h-32 group">
          <img
            src={teacher?.profileImage || '/SHABBU.jpg'}
            alt="Profile"
            className="w-full h-full rounded-full object-cover border-4 border-blue-500"
          />
          <div
            onClick={handleImageClick}
            className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <span className="text-white text-2xl">📷</span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-800">{teacher.name}</h1>
          <p className="text-gray-600 mt-1">{teacher.email}</p>
          <div className="flex gap-3 mt-2 flex-wrap">
            <span className="badge badge-outline">Role: {teacher.role}</span>
            <span className="badge badge-outline">
              {teacher.isEligible ? '✅ Eligible' : '❌ Not Eligible'}
            </span>
            <span className="badge badge-outline">
              {teacher.hasPaid ? '💰 Paid' : '🚫 Not Paid'}
            </span>
          </div>
          {uploading && <p className="text-sm text-blue-500 mt-2">Uploading...</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-2 text-blue-600">📦 Post Stats</h2>
          <p className="text-gray-500">You haven't posted any tuition yet.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-2 text-blue-600">📅 Upcoming Schedule</h2>
          <p className="text-gray-500">No upcoming sessions scheduled.</p>
        </div>
      </div>
    </div>
  );
}
