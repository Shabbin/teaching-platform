'use client';
//dashboard\teacher\chat\[threadID]
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import ChatWindow from '../../components/ChatWindow';

export default function ChatPage() {
  const params = useParams();
  const threadID = params?.threadID;

  const userInfo = useSelector((state) => state.user.userInfo);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [requestId, setRequestId] = useState(null);
  const [isReady, setIsReady] = useState(false);
console.log('👤 userInfo:', userInfo);
  // 🛠️ Fetch requestId using threadID
  useEffect(() => {
    const fetchThread = async () => {
      if (!threadID || !token) return;

      try {
        const res = await fetch(`http://localhost:5000/api/chat/threadById/${threadID}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch thread');

        const data = await res.json();
        setRequestId(data.requestId);
        console.log(data,"DataCheck")
      } catch (err) {
        console.error('❌ Error loading thread:', err);
      }
    };

    fetchThread();
  }, [threadID, token]);

  useEffect(() => {
    if (requestId && userInfo && token) {
      setIsReady(true);
    }
  }, [requestId, userInfo, token]);

  if (!threadID) return <p>Loading thread info...</p>;
  if (!userInfo || !token) return <p>Please login to chat.</p>;
  if (!isReady) return <p>Loading chat...</p>;

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
      <ChatWindow requestId={requestId} user={userInfo} token={token} />
    </div>
  );
}
