'use client';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendTuitionRequest, clearMessages } from '../../../redux/requestSlice';
import { fetchConversationsThunk } from '../../../redux/chatThunks'; // <-- Import this thunk

export default function TuitionRequestModal({ teacherId, postId, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);
  const { loading, error, successMessage } = useSelector((state) => state.requests);

  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Message is required');
      return;
    }

    const result = await dispatch(sendTuitionRequest({ teacherId, postId, message }));

    if (sendTuitionRequest.fulfilled.match(result)) {
      dispatch(clearMessages());
      setMessage('');

      // Fetch updated conversations so messenger updates immediately
      dispatch(
        fetchConversationsThunk({
          userId: user?.id || user?._id,
          role: user?.role || 'student',
        })
      );

      onSuccess();
    }
  };

  const handleClose = () => {
    dispatch(clearMessages());
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all">
      <div className="relative w-full max-w-lg mx-4 sm:mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 animate-fade-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
          aria-label="Close request modal"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Request Tuition</h2>
        <p className="text-gray-500 mb-4">
          Send a message to the teacher explaining your needs. Be clear and polite!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={6}
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
