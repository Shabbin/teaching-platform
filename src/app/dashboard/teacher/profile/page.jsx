'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function TeacherProfilePage() {
  const [teacher, setTeacher] = useState(null)
  const [posts, setPosts] = useState([])
  const teacherId = '682532838376c0b56fe68c7d' // until Redux is ready

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/teachers/${teacherId}/profile`)
      setTeacher(res.data.teacher)
      setPosts(res.data.posts)
    } catch (err) {
      console.error('Failed to fetch profile', err)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append(type, file)

    try {
      const token = localStorage.getItem('token') // or use Redux if available
      await axios.put(
        `http://localhost:5000/api/teachers/${type === 'profileImage' ? 'profile-picture' : 'cover-image'}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      )
      fetchProfile() // refresh data
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  if (!teacher) return <div className="text-center mt-10">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Cover Photo */}
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

      {/* Profile Photo */}
      <div className="relative z-20 mt-[-5rem] sm:mt-[-7rem] md:mt-[-9rem] pl-4">
        <div className="w-48 h-64 shadow-lg border-4 border-white overflow-hidden">
          <img
            src={teacher.profileImage || '/default-avatar.png'}
            alt="Profile"
            className="object-cover w-full h-full"
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

      {/* Teacher Info */}
      <div className="mt-8 px-4 text-left">
        <h2 className="text-3xl font-bold">{teacher.name}</h2>
        <p className="text-gray-600">{teacher.email}</p>
        <p className="text-sm text-gray-500 mt-1">Age: {teacher.age || 'N/A'}</p>

        {/* ...rest of the info stays the same */}
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
