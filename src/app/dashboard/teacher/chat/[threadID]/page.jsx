'use client';
import { useSelector } from 'react-redux';
import ChatWindow from '../../../../../../components/ChatWindow';

export default function ChatPage({ params }) {
  const { requestId } = params;
  const user = useSelector((state) => state.user.userInfo);

  if (!user) return <p>Loading user...</p>;

  return (
    <div className="p-4 min-h-screen bg-gray-100 flex justify-center items-center">
      <ChatWindow requestId={requestId} />
    </div>
  );
}
