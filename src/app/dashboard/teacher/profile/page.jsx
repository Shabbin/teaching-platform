'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import { updateProfileImage } from '../../../redux/userSlice'
import { Camera, Star, MessageSquare, DollarSign, CheckCircle } from 'lucide-react'
import API, { absUrl } from '../../../api/axios' // ← use env-driven axios + URL helper

export default function TeacherProfilePage() {
  const dispatch = useDispatch()
  const teacherId = useSelector((state) => state.user.userInfo?._id)

  const [teacher, setTeacher] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    hourlyRate: '',
    skills: '',
    location: '',
    availability: ''
  })

  const fetchProfile = async () => {
    setLoading(true)
    if (!teacherId) {
      setLoading(false)
      return
    }

    try {
      const res = await API.get(`/teachers/${teacherId}/profile`)
      const { teacher, posts } = res.data
      setTeacher(teacher)
      setPosts(posts)
      setFormData({
        name: teacher.name || '',
        bio: teacher.bio || '',
        hourlyRate: teacher.hourlyRate || '',
        skills: teacher.skills?.join(', ') || '',
        location: teacher.location || '',
        availability: teacher.availability || ''
      })
    } catch (err) {
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (teacherId) fetchProfile()
  }, [teacherId])

  const handleUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    const uploadData = new FormData()
    uploadData.append(type, file)

    try {
      const route =
        type === 'profileImage' ? '/teachers/profile-picture' : '/teachers/cover-image'

      const res = await API.put(route, uploadData, {
        // let browser set multipart boundary; interceptor removes Content-Type for FormData
      })

      if (type === 'profileImage') {
        // update redux user slice thumbnail/avatar if you keep it there
        dispatch(updateProfileImage(res.data.profileImage))
      }

      toast.success('Image uploaded successfully')
      fetchProfile()
    } catch {
      toast.error('Image upload failed')
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.bio || !formData.hourlyRate) {
      return toast.error('Name, bio, and hourly rate are required')
    }
    try {
      const res = await API.put('/teachers/profile-info', formData)
      setTeacher(res.data.user)
      toast.success('Profile updated')
      setIsEditing(false)
    } catch {
      toast.error('Profile update failed')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="h-72 bg-gray-200 animate-pulse rounded-2xl mb-8"></div>
        <div className="flex gap-4 mb-4">
          <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-4">
            <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="max-w-7xl mx-auto p-4 text-center text-red-600">
        Unable to load teacher profile.
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Toaster />

      {/* Cover Section */}
      <div className="relative w-full h-60 sm:h-72 md:h-[20rem] rounded-2xl overflow-hidden shadow-md">
        <img
          src={teacher.coverImage ? absUrl(teacher.coverImage) : '/default-cover.jpg'}
          alt="Cover"
          className="object-cover w-full h-full"
        />
        <label className="absolute top-4 right-4 bg-white px-3 py-1 text-sm rounded-lg shadow cursor-pointer hover:bg-gray-100">
          Change Cover
          <input
            type="file"
            onChange={(e) => handleUpload(e, 'coverImage')}
            className="hidden"
          />
        </label>
      </div>

      {/* Profile Info Card */}
      <div className="relative bg-white rounded-2xl shadow-lg p-6 mt-[-4rem] z-10 border border-gray-100">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Image with Edit Overlay */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-md ring-4 ring-white">
              <img
                src={
                  teacher?.profileImage
                    ? absUrl(teacher.profileImage)
                    : '/default-avatar.png'
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <label className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-indigo-700">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                onChange={(e) => handleUpload(e, 'profileImage')}
                className="hidden"
              />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h2 className="text-2xl font-bold">{teacher.name}</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-indigo-600 text-white px-4 py-1 rounded-md shadow hover:bg-indigo-700 text-sm"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            <p className="text-gray-500">@{teacher.username || teacher.email?.split('@')[0]}</p>
            <p className="text-sm text-gray-400 mt-1">
              {teacher.role || 'Tutor'} · Joined on {teacher.createdAt ? new Date(teacher.createdAt).toDateString() : 'N/A'}
            </p>

            {/* Rating + Stats */}
            <div className="mt-4 flex flex-wrap items-center gap-6 text-gray-700">
              {/* Rating */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(teacher.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
                <span className="ml-2 font-medium">{teacher.rating || 0}.0</span>
              </div>

              {/* Reviews */}
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                {teacher.reviewsCount || 0} Reviews
              </div>

              {/* Earnings */}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-400" />
                ${teacher.totalEarnings || 0}
              </div>

              {/* Completion */}
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                {teacher.completionRate || 0}%
              </div>
            </div>

            {/* Bio & Info */}
            {!isEditing ? (
              <div className="mt-4 space-y-2 text-gray-700">
                <p><strong>Bio:</strong> {teacher.bio || 'Not added yet'}</p>
                <p><strong>Hourly Rate:</strong> ${teacher.hourlyRate || 0} / hour</p>
                <p><strong>Skills:</strong> {Array.isArray(teacher.skills) ? teacher.skills.join(', ') : (teacher.skills || 'Not listed')}</p>
                <p><strong>Location:</strong> {teacher.location || 'Not specified'}</p>
                <p><strong>Availability:</strong> {teacher.availability || 'Not specified'}</p>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="mt-4 space-y-3 w-full max-w-2xl">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  required
                />
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Hourly Rate (USD)"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  required
                />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Skills (comma separated)"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Availability"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow hover:bg-indigo-700">
                  Save
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">Your Tuition Posts</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500">No posts yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white border border-gray-100 p-5 rounded-xl shadow hover:shadow-md transition"
              >
                <h4 className="font-semibold text-lg mb-2">{post.title}</h4>
                <p className="text-gray-600 text-sm">{post.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
