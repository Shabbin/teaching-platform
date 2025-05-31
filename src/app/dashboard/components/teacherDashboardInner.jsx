'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setTeacherData, updateProfileImage } from './../../redux/userSlice';
import Link from 'next/link';
import {
  ImageIcon,
  ShieldCheck,
  ShieldOff,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Users,
  Star,
  BookOpen,
  Video,
  CalendarClock,
  MailCheck
} from 'lucide-react';

export default function TeacherDashboardInner() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [teacherData, setTeacherDataLocal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const dispatch = useDispatch();

  const fetchDashboard = async () => {
    const token = localStorage.getItem('token');
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

  const handleImageClick = () => fileInputRef.current.click();

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

  if (loading) return <div className="text-center mt-10 text-lg text-gray-500 animate-pulse">Loading your dashboard...</div>;

  if (!teacherData)
    return (
      <div className="p-6 text-red-600 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="font-semibold text-lg">Unable to load dashboard</h2>
        <p className="text-sm">Please try refreshing or check your internet connection.</p>
      </div>
    );

  const teacher = teacherData.teacher || {};
  const teacherPosts = teacherData.teacherPosts || [];
  const upcomingSessions = teacherData.upcomingSessions || [];
  const sessionRequests = teacherData.sessionRequests || [];
 const mediaAds = [
  {
    _id: "1",
    title: "Public University Male/Lady Tutor Wanted at Savar Radio Colony TNT Gate",
    class: "Class: 9",
    subject: "Sub: Only English",
    days: "Days: 4",
    salary: "Salary: 3000",
    code: "Savar9engML.Tud1023",
    contact: "sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222",
  },
  {
    _id: "2",
    title: "👔 Buet/Du Male Tutor Wanted at Sadarghat Near Kotowali Thana Bikrompur Garden City",
    class: "Class: 10",
    subject: "Sub: Phy+Chem+Biology",
    days: "Days: 4",
    salary: "Salary: 7000",
    code: "Sadarghat10sciM.Tud1021",
    contact: "sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222",
  },
  {
    _id: "3",
    title: "👔🧥 Male/Lady Tutor Wanted at Gazipur Near Bhabanipur Kindergarten",
    class: "Class: 5",
    subject: "Sub: All",
    days: "Days: 5",
    salary: "Salary: 3000",
    code: "Gazipur5ML.Tud1024",
    contact: "sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222",
  },
  {
    _id: "4",
    title: "🧥 Lady Tutor Wanted at Keraniganj Ambagicha Boubazar",
    class: "Class: 6",
    subject: "Sub: All",
    days: "Days: 5",
    salary: "Salary: 3000",
    code: "Keraniganj6L.Tud1020",
    contact: "sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222",
  },
  {
    _id: "5",
    title: "🧥 Lady Tutor Wanted at Abdullahpur Bus-stand, South Keranigonj",
    class: "Class: 7",
    subject: "Sub: All",
    days: "Days: 5",
    salary: "Salary: 5000",
    code: "Abdullahpur7L.Tud1018",
    contact: "sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222",
  },
  {
    _id: "6",
    title: "🧥 Lady Tutor Wanted at Songramy Soroni Uttara Azimpur Kachabazar",
    class: "Class: 4",
    subject: "Sub: Math+Eng+Bangla",
    days: "Days: 5",
    salary: "Salary: 3000",
    code: "Uttara4L.Tud1022",
    contact: "sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222",
  },
];

  const paymentSummary = {
    monthlyEarnings: 45000,
    totalSessions: 18,
    commissionPaid: 4500,
  };

  const studentStats = {
    taught: 12,
    repeat: 5,
    rating: 4.7,
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-10">
      {/* Top Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Profile Overview */}
        <div className="bg-white shadow rounded-2xl p-6 flex gap-6 items-center">
          <div className="relative w-32 h-32">
            <img
              src={teacher?.profileImage?.startsWith('http') ? teacher.profileImage : `http://localhost:5000/${teacher.profileImage}`}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-4 border-blue-600"
            />
            <button
              onClick={handleImageClick}
              className="absolute inset-0 bg-black bg-opacity-40 text-white flex items-center justify-center rounded-full opacity-0 hover:opacity-100"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{teacher.name}</h1>
            <p className="text-gray-600">{teacher.email}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Role: {teacher.role}</span>
              <span className={`px-3 py-1 rounded-full text-sm ${teacher.isEligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {teacher.isEligible ? <ShieldCheck className="inline w-4 h-4 mr-1" /> : <ShieldOff className="inline w-4 h-4 mr-1" />}
                {teacher.isEligible ? 'Eligible for Tuition' : 'Not Eligible'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${teacher.hasPaid ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}>
                {teacher.hasPaid ? <CheckCircle className="inline w-4 h-4 mr-1" /> : <AlertCircle className="inline w-4 h-4 mr-1" />}
                {teacher.hasPaid ? 'Payment Done' : 'Not Paid'}
              </span>
            </div>
            {uploading && <p className="text-sm text-blue-500 mt-2">Uploading new profile image...</p>}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white shadow rounded-2xl p-4 text-sm">
            <h2 className="text-lg font-semibold text-blue-600 mb-3"><CreditCard className="inline w-5 h-5 mr-2" />Payment</h2>
            <p>Monthly: <span className="font-medium">PKR {paymentSummary.monthlyEarnings}</span></p>
            <p>Sessions: <span className="font-medium">{paymentSummary.totalSessions}</span></p>
            <p>Commission: <span className="font-medium">PKR {paymentSummary.commissionPaid}</span></p>
            <button className="mt-2 text-blue-600 hover:underline text-xs">History</button>
          </div>

          <div className="bg-white shadow rounded-2xl p-4 text-sm">
            <h2 className="text-lg font-semibold text-blue-600 mb-3"><Users className="inline w-5 h-5 mr-2" />Students</h2>
            <p>Taught: <span className="font-medium">{studentStats.taught}</span></p>
            <p>Repeat: <span className="font-medium">{studentStats.repeat}</span></p>
            <p>Rating: <span className="font-medium">{studentStats.rating} <Star className="inline w-4 h-4 text-yellow-500" /></span></p>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tuition Posts */}
        <div className="bg-white shadow rounded-2xl p-6 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-600"><BookOpen className="inline w-5 h-5 mr-2" />Tuition Posts</h2>
            <Link href="/dashboard/teacher/post-content" passHref>
              <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">+ Post</button>
            </Link>
          </div>
          <div className="grid gap-3">
            {teacherPosts.length ? teacherPosts.map((post) => (
              <div key={post._id} className="bg-gray-50 border border-gray-200 rounded p-3">
                <h3 className="font-semibold text-gray-800">{post.title}</h3>
                <p className="text-gray-600">{post.subject}</p>
              </div>
            )) : <p className="text-gray-500">No tuition posts found.</p>}
          </div>
        </div>

        {/* Tuition Media Ads */}
      {/* Tuition Media Ads */}
{/* Tuition Media Ads */}
<div className="bg-white shadow rounded-2xl p-6 h-fit">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold text-blue-600">
      <Video className="inline w-5 h-5 mr-2" />Tuition Media Ads
    </h2>
    <Link href="/dashboard/teacher/media-tuitions" passHref>
      <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">
        + Media
      </button>
    </Link>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1 custom-scroll">
    {mediaAds.length ? (
      mediaAds.map((ad) => (
        <div
          key={ad._id}
          className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="font-semibold text-gray-800 text-md mb-1">{ad.title}</h3>
            <p className="text-sm text-gray-600">{ad.class}</p>
            <p className="text-sm text-gray-600">{ad.subject}</p>
            <p className="text-sm text-gray-600">{ad.days}</p>
            <p className="text-sm text-gray-600">{ad.salary}</p>
            <p className="text-sm text-gray-600">Code: {ad.code}</p>
            <p className="text-sm text-gray-600 mt-1">{ad.contact}</p>
          </div>
          <button
            className="mt-3 w-full bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700 text-sm transition"
            onClick={() => alert(`Applied to ad: ${ad.code}`)} // Placeholder logic
          >
            Apply
          </button>
        </div>
      ))
    ) : (
      <p className="text-gray-500">No media ads available.</p>
    )}
  </div>
</div>

      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white shadow rounded-2xl p-6 h-fit">
          <h2 className="text-xl font-semibold text-blue-600 mb-4"><CalendarClock className="inline w-5 h-5 mr-2" />Upcoming Sessions</h2>
          <div className="grid gap-3">
            {upcomingSessions.length ? upcomingSessions.map((session, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-gray-800 font-medium">{session.topic}</p>
                <p className="text-gray-600 text-sm">{session.date} at {session.time}</p>
              </div>
            )) : <p className="text-gray-500">No upcoming sessions found.</p>}
          </div>
        </div>

        {/* Session Requests */}
        <div className="bg-white shadow rounded-2xl p-6 h-fit">
          <h2 className="text-xl font-semibold text-blue-600 mb-4"><MailCheck className="inline w-5 h-5 mr-2" />Session Requests</h2>
          <div className="grid gap-3">
            {sessionRequests.length ? sessionRequests.map((req, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-gray-800 font-medium">From: {req.studentName}</p>
                <p className="text-gray-600 text-sm">Subject: {req.subject}</p>
              </div>
            )) : <p className="text-gray-500">No session requests at the moment.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
