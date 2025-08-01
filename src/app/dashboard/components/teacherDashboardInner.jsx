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

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh] text-lg text-gray-500 animate-pulse">
        Loading your dashboard...
      </div>
    );

  if (!teacherData)
    return (
      <div className="max-w-xl mx-auto p-6 text-red-700 bg-red-50 border border-red-300 rounded-lg shadow-md">
        <h2 className="font-semibold text-xl mb-2">Unable to load dashboard</h2>
        <p className="text-sm">Please try refreshing or check your internet connection.</p>
      </div>
    );

  const teacher = teacherData.teacher || {};
  const teacherPosts = teacherData.teacherPosts || [];
  const upcomingSessions = teacherData.upcomingSessions || [];
  const sessionRequests = teacherData.sessionRequests || [];
  const mediaAds = [
    {
      _id: '1',
      title: 'Public University Male/Lady Tutor Wanted at Savar Radio Colony TNT Gate',
      class: 'Class: 9',
      subject: 'Sub: Only English',
      days: 'Days: 4',
      salary: 'Salary: 3000',
      code: 'Savar9engML.Tud1023',
      contact: 'sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222',
    },
    {
      _id: '2',
      title: '👔 Buet/Du Male Tutor Wanted at Sadarghat Near Kotowali Thana Bikrompur Garden City',
      class: 'Class: 10',
      subject: 'Sub: Phy+Chem+Biology',
      days: 'Days: 4',
      salary: 'Salary: 7000',
      code: 'Sadarghat10sciM.Tud1021',
      contact: 'sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222',
    },
    {
      _id: '3',
      title: '👔🧥 Male/Lady Tutor Wanted at Gazipur Near Bhabanipur Kindergarten',
      class: 'Class: 5',
      subject: 'Sub: All',
      days: 'Days: 5',
      salary: 'Salary: 3000',
      code: 'Gazipur5ML.Tud1024',
      contact: 'sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222',
    },
    {
      _id: '4',
      title: '🧥 Lady Tutor Wanted at Keraniganj Ambagicha Boubazar',
      class: 'Class: 6',
      subject: 'Sub: All',
      days: 'Days: 5',
      salary: 'Salary: 3000',
      code: 'Keraniganj6L.Tud1020',
      contact: 'sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222',
    },
    {
      _id: '5',
      title: '🧥 Lady Tutor Wanted at Abdullahpur Bus-stand, South Keranigonj',
      class: 'Class: 7',
      subject: 'Sub: All',
      days: 'Days: 5',
      salary: 'Salary: 5000',
      code: 'Abdullahpur7L.Tud1018',
      contact: 'sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222',
    },
    {
      _id: '6',
      title: '🧥 Lady Tutor Wanted at Songramy Soroni Uttara Azimpur Kachabazar',
      class: 'Class: 4',
      subject: 'Sub: Math+Eng+Bangla',
      days: 'Days: 5',
      salary: 'Salary: 3000',
      code: 'Uttara4L.Tud1022',
      contact: 'sms Your short cv & Tuition screen shot to WhatsApp number : 01890078222',
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Profile Overview */}
        <section className="bg-white shadow-lg rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-full overflow-hidden border-8 border-indigo-600 shadow-md cursor-pointer group">
            <img
              src={
                teacher?.profileImage?.startsWith('http')
                  ? teacher.profileImage
                  : `http://localhost:5000/${teacher.profileImage}`
              }
              alt="Profile"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <button
              onClick={handleImageClick}
              className="absolute inset-0 bg-black bg-opacity-40 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Change Profile Picture"
              aria-label="Change Profile Picture"
              type="button"
            >
              <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex flex-col justify-center flex-grow min-w-0 text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 truncate">{teacher.name}</h1>
            <p className="text-gray-600 text-sm sm:text-lg mb-2 sm:mb-3 truncate">{teacher.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
              <span className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm rounded-full shadow-sm select-none">
                Role: {teacher.role}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-sm select-none ${
                  teacher.isEligible
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {teacher.isEligible ? (
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                ) : (
                  <ShieldOff className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                )}
                {teacher.isEligible ? 'Eligible for Tuition' : 'Not Eligible'}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-sm select-none ${
                  teacher.hasPaid ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {teacher.hasPaid ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                ) : (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                )}
                {teacher.hasPaid ? 'Payment Done' : 'Not Paid'}
              </span>
            </div>
            {uploading && (
              <p className="mt-2 text-indigo-600 font-medium animate-pulse text-sm sm:text-base">
                Uploading new profile image...
              </p>
            )}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-3xl p-6 flex flex-col justify-between min-w-0">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" /> Payment Summary
              </h2>
              <p className="text-gray-700 text-base sm:text-lg mb-1 sm:mb-2">
                Monthly Earnings: <span className="font-semibold">PKR {paymentSummary.monthlyEarnings.toLocaleString()}</span>
              </p>
              <p className="text-gray-700 text-base sm:text-lg mb-1 sm:mb-2">
                Total Sessions: <span className="font-semibold">{paymentSummary.totalSessions}</span>
              </p>
              <p className="text-gray-700 text-base sm:text-lg">
                Commission Paid: <span className="font-semibold">PKR {paymentSummary.commissionPaid.toLocaleString()}</span>
              </p>
            </div>
            <button className="mt-6 bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 transition shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400">
              View History
            </button>
          </div>

          <div className="bg-white shadow-lg rounded-3xl p-6 flex flex-col justify-between min-w-0">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-indigo-600 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" /> Student Stats
              </h2>
              <p className="text-gray-700 text-base sm:text-lg mb-1 sm:mb-2">
                Students Taught: <span className="font-semibold">{studentStats.taught}</span>
              </p>
              <p className="text-gray-700 text-base sm:text-lg mb-1 sm:mb-2">
                Repeat Students: <span className="font-semibold">{studentStats.repeat}</span>
              </p>
              <p className="text-gray-700 text-base sm:text-lg flex items-center gap-1">
                Rating:{' '}
                <span className="font-semibold flex items-center gap-1">
                  {studentStats.rating}{' '}
                  <Star className="w-5 h-5 text-yellow-400" />
                </span>
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Tuition Posts */}
        <section className="bg-white shadow-lg rounded-3xl p-6 sm:p-8 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-700 flex items-center gap-2">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" /> Tuition Posts
            </h2>
            <Link href="/dashboard/teacher/post-content" passHref>
              <button className="bg-indigo-600 text-white px-4 sm:px-5 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400">
                + Post
              </button>
            </Link>
          </div>
          <div className="space-y-4">
            {teacherPosts.length ? (
              teacherPosts.map((post) => (
                <div
                  key={post._id}
                  className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:shadow-lg transition cursor-pointer"
                >
                  <h3 className="font-semibold text-indigo-900 text-lg truncate">{post.title}</h3>
                  <p className="text-indigo-700 text-sm truncate">{post.subject}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-10">No tuition posts found.</p>
            )}
          </div>
        </section>

        {/* Tuition Media Ads */}
        <section className="bg-white shadow-lg rounded-3xl p-6 sm:p-8 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-indigo-700 flex items-center gap-2">
              <Video className="w-5 h-5 sm:w-6 sm:h-6" /> Tuition Media Ads
            </h2>
            <Link href="/dashboard/teacher/media-tuitions" passHref>
              <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400">
                + Media
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {mediaAds.length ? (
              mediaAds.map((ad) => (
                <article
                  key={ad._id}
                  className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <h3 className="font-semibold text-indigo-900 text-lg mb-1 truncate">{ad.title}</h3>
                    <p className="text-indigo-700 text-sm">{ad.class}</p>
                    <p className="text-indigo-700 text-sm">{ad.subject}</p>
                    <p className="text-indigo-700 text-sm">{ad.days}</p>
                    <p className="text-indigo-700 text-sm">{ad.salary}</p>
                    <p className="text-indigo-700 text-sm font-mono mt-1">Code: {ad.code}</p>
                    <p className="text-indigo-800 text-xs mt-2 leading-tight">{ad.contact}</p>
                  </div>
                  <button
                    className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-semibold shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    onClick={() => alert(`Applied to ad: ${ad.code}`)}
                  >
                    Apply
                  </button>
                </article>
              ))
            ) : (
              <p className="text-gray-500 text-center py-12">No media ads available.</p>
            )}
          </div>
        </section>
      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Upcoming Sessions */}
        <section className="bg-white shadow-lg rounded-3xl p-6 sm:p-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
            <CalendarClock className="w-6 h-6" /> Upcoming Sessions
          </h2>
          <div className="space-y-4">
            {upcomingSessions.length ? (
              upcomingSessions.map((session, index) => (
                <div
                  key={index}
                  className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md transition cursor-default"
                >
                  <p className="text-indigo-900 font-semibold truncate">{session.topic}</p>
                  <p className="text-indigo-700 text-sm">
                    {session.date} at {session.time}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-10">No upcoming sessions found.</p>
            )}
          </div>
        </section>

        {/* Session Requests */}
        <section className="bg-white shadow-lg rounded-3xl p-6 sm:p-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
            <MailCheck className="w-6 h-6" /> Session Requests
          </h2>
          <div className="space-y-4">
            {sessionRequests.length ? (
              sessionRequests.map((req, index) => (
                <div
                  key={index}
                  className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 hover:shadow-md transition cursor-default"
                >
                  <p className="text-indigo-900 font-semibold truncate">From: {req.studentName}</p>
                  <p className="text-indigo-700 text-sm truncate">Subject: {req.subject}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-10">No session requests at the moment.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
