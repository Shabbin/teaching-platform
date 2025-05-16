"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ user, popupMode }) {
  const [messages, setMessages] = useState([]);
  const [recipientId, setRecipientId] = useState(null); // test with any userId for now

  useEffect(() => {
    if (!recipientId) return;
    axios
      .get(`/api/messages/${recipientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setMessages(res.data))
      .catch(console.error);
  }, [recipientId]);

  const handleSend = async (text) => {
    const newMessage = {
      receiver: recipientId,
      text,
    };

    try {
      const res = await axios.post("/api/messages", newMessage, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="p-2 font-bold bg-gray-100 rounded-t-md">
        <div className="flex justify-between items-center">
          <span>Chat</span>
          {!popupMode && (
            <button
              onClick={() => window.location.href = "/messenger"}
              className="text-sm text-blue-500"
            >
              See all in Messenger
            </button>
          )}
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} currentUserId={user._id} />
        ))}
      </div>

      {/* input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
