'use client';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendTopicHelpRequest, clearMessages } from '../../../redux/requestSlice';

export default function TopicHelpRequestModal({ teacherId, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.requests);

  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!topic.trim() || !message.trim()) {
      alert('Both topic and message are required');
      return;
    }

    const result = await dispatch(sendTopicHelpRequest({ teacherId, topic, message }));

    if (sendTopicHelpRequest.fulfilled.match(result)) {
      dispatch(clearMessages());
      setTopic('');
      setMessage('');
      onSuccess();
    }
  };

  const handleClose = () => {
    dispatch(clearMessages());
    setTopic('');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all">
      <div className="relative w-full max-w-lg mx-4 sm:mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 animate-fade-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Request Topic Help</h2>
        <p className="text-gray-500 mb-4">
          Let the teacher know which topic you’re struggling with and what kind of help you need.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter Topic (e.g., Algebra - Linear Equations)"
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <textarea
            rows={5}
            placeholder="Describe what kind of help you need..."
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
