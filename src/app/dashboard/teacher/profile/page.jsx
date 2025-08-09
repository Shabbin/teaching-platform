'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { updateProfileImage } from '../../../redux/userSlice'

export default function TeacherProfilePage() {
  
  const dispatch = useDispatch()
  const teacherId = useSelector((state) => state.user.userInfo?._id)

  console.log('redux TeacherId:', teacherId)
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

  // Fetch teacher profile and posts, with cookies sent automatically
  const fetchProfile = async () => {
    setLoading(true)
    console.log('fetchProfile called')
    if (!teacherId) {
      console.log('No teacherId, skipping fetch')
      setLoading(false)
      return
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/teachers/${teacherId}/profile`,
        {
          withCredentials: true, // send cookies automatically
        }
      )
      console.log('Profile API response:', res.data)
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
      console.error('Failed to fetch profile:', err)
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (teacherId) fetchProfile()
  }, [teacherId])

  // Upload image handler
  const handleUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const uploadData = new FormData()
    uploadData.append(type, file)

    try {
      const res = await axios.put(
        `http://localhost:5000/api/teachers/${type === 'profileImage' ? 'profile-picture' : 'cover-image'}`,
        uploadData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true, // send cookies automatically
        }
      )

      if (type === 'profileImage') {
        dispatch(updateProfileImage(res.data.profileImage))
      }

      toast.success('Image uploaded successfully')
      fetchProfile()
    } catch (error) {
      console.error('Image upload failed:', error)
      toast.error('Image upload failed')
    }
  }

  // Handle profile form submission
  const handleProfileUpdate = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.bio || !formData.hourlyRate) {
      return toast.error('Name, bio, and hourly rate are required')
    }

    try {
      const res = await axios.put(
        'http://localhost:5000/api/teachers/profile-info',
        formData,
        {
          withCredentials: true, // send cookies automatically
        }
      )
      setTeacher(res.data.user)
      toast.success('Profile updated')
      setIsEditing(false)
    } catch (err) {
      console.error('Profile update failed:', err)
      toast.error('Profile update failed')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="h-72 bg-gray-200 animate-pulse rounded-md mb-8"></div>
        <div className="flex gap-4 mb-4">
          <div className="w-48 h-64 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-4">
            <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
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

      {/* Cover Image */}
      <div className="relative w-full h-60 sm:h-72 md:h-[30rem] rounded-lg overflow-hidden bg-gray-200">
        <img
          src={teacher.coverImage || '/default-cover.jpg'}
          alt="Cover"
          className="object-cover w-full h-full opacity-80"
        />
        <input
          type="file"
          onChange={(e) => handleUpload(e, 'coverImage')}
          className="absolute top-2 right-2 file-input file-input-sm"
        />
      </div>

      {/* Profile Image */}
      <div className="relative z-20 mt-[-5rem] sm:mt-[-7rem] md:mt-[-9rem] pl-4">
        <div className="w-48 h-64 shadow-lg border-4 border-white overflow-hidden rounded-full">
          <img
            src={
              teacher?.profileImage?.startsWith('http')
                ? teacher.profileImage
                : `http://localhost:5000/${teacher.profileImage}`
            }
            alt="Profile"
            className="w-full h-full object-cover border-4 border-blue-500"
          />
        </div>
        <div className="mt-2">
          <input
            type="file"
            onChange={(e) => handleUpload(e, 'profileImage')}
            className="file-input file-input-sm"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-8 px-4 text-left">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">{teacher.name}</h2>
          <button onClick={() => setIsEditing(!isEditing)} className="btn btn-sm">
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        <p className="text-gray-600">{teacher.email}</p>
        <p className="text-sm text-gray-500 mt-1">Age: {teacher.age || 'N/A'}</p>

        {!isEditing ? (
          <div className="mt-4 space-y-2 text-gray-700">
            <p><strong>Bio:</strong> {teacher.bio || 'Not added yet'}</p>
            <p><strong>Hourly Rate:</strong> ${teacher.hourlyRate || 0}</p>
            <p><strong>Skills:</strong> {teacher.skills?.join(', ') || 'Not listed'}</p>
            <p><strong>Location:</strong> {teacher.location || 'Not specified'}</p>
            <p><strong>Availability:</strong> {teacher.availability || 'Not specified'}</p>
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate} className="mt-4 space-y-3 max-w-2xl">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              required
            />
            <input
              type="number"
              className="input input-bordered w-full"
              placeholder="Hourly Rate (USD)"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              required
            />
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Skills (comma separated)"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            />
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Availability"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
            />
            <button type="submit" className="btn btn-primary mt-2">Save</button>
          </form>
        )}
      </div>

      {/* Posts */}
      <div className="mt-10 px-4">
        <h3 className="text-xl font-semibold mb-3">Your Tuition Posts</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500">No posts yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {posts.map((post) => (
              <div key={post._id} className="border p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-lg mb-1">{post.title}</h4>
                <p className="text-gray-600 text-sm">{post.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
