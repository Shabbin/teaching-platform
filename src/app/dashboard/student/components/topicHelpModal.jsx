'use client';
//dashboard\student\components\topicHelpModal.jsx
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

    // Dispatch action with correct payload keys according to your backend teacherRequest model
    const result = await dispatch(sendTopicHelpRequest({ 
      teacherId,   // matches backend "teacherId"
      topic,       // topic string
      message,     // message string
    }));

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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Ask for Topic Help</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="w-full p-2 border rounded mb-4"
            placeholder="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
          <textarea
            className="w-full p-2 border rounded mb-4"
            rows={5}
            placeholder="Write your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          {error && <p className="text-red-600 mb-2">{error}</p>}
          {successMessage && <p className="text-green-600 mb-2">{successMessage}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
