'use client';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { sendTuitionRequest, clearMessages } from '../../../redux/requestSlice';

export default function TuitionRequestModal({ teacherId, postId, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.requests);

  const [topic, setTopic] = useState('');
  const [message, setDescription] = useState('');

  // Clear messages when modal opens or closes
  useEffect(() => {
    return () => {
      dispatch(clearMessages());
    };
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!topic.trim()) {
      alert('Topic is required');
      return;
    }

    // Combine topic and message into one message string
    const message = message.trim()
      ? `${topic.trim()}: ${message.trim()}`
      : topic.trim();

    // Dispatch Redux async thunk
    dispatch(sendTuitionRequest({ teacherId, message, postId }))
      .unwrap()
      .then(() => {
        onSuccess();
        dispatch(clearMessages());
      })
      .catch(() => {
        // Error handled in Redux slice, just keep it here
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white rounded p-6 w-96 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Request Tuition / Topic Help</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="topic" className="block font-semibold mb-1">Topic*</label>
            <input
              type="text"
              id="topic"
              className="w-full border rounded px-3 py-2"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              placeholder="Enter the topic you need help with"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="message" className="block font-semibold mb-1">message</label>
            <textarea
              id="message"
              className="w-full border rounded px-3 py-2"
              rows={4}
              value={message}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details (optional)"
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-600">{error}</p>}
          {successMessage && <p className="text-green-600">{successMessage}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 border rounded" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-70"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
