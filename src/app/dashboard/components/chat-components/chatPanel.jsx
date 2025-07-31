'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MessageBubble from './MessageBubble';
import useSocket from '../../../hooks/useSocket';
import {
  clearMessagesForThread as clearMessagesAction,
  addMessageToThread as addMessageAction,
} from '../../../redux/chatSlice';
import {
  fetchMessagesThunk,

} from '../../../redux/chatThunks';

export default function ChatPanel({ chat, user, onApprove, onReject }) {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.chat.messagesByThread[chat?.threadId] || []);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef();
  const { sendMessage: socketSendMessage, joinThread } = useSocket(chat?.threadId);

  // Debug logs
  // console.log('🔄 ChatPanel render');
  // console.log('🧾 Props -> chat:', chat);
  // console.log('🧑‍💼 Props -> user:', user);
  // console.log('🧵 Current threadId:', chat?.threadId);
  // console.log('📨 Existing messages:', messages);
  

  const latestMessagesRef = useRef(messages);
  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chat?.threadId || chat.status !== 'approved') {
      console.log('⛔ No valid threadId or chat not approved. Clearing messages...');
      if (chat?.threadId) dispatch(clearMessagesAction(chat.threadId));
      return;
    }

    console.log('📥 Fetching messages for thread:', chat.threadId);
    dispatch(clearMessagesAction(chat.threadId));
    dispatch(fetchMessagesThunk(chat.threadId));
  }, [chat?.threadId, chat?.status, dispatch]);

  useEffect(() => {
    if (chat?.threadId && joinThread) {
      console.log('🔌 Joining socket thread:', chat.threadId);
      joinThread(chat.threadId);
    }
  }, [chat?.threadId, joinThread]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chat?.threadId || !socketSendMessage) return;

    const messageData = {
      threadId: chat.threadId,
      senderId: user?._id || user?.id,
      senderName: user?.name,
      senderProfileImage: user?.profileImage,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    console.log('📤 Sending message:', messageData);

    try {
      socketSendMessage(messageData);
      setNewMessage('');
    } catch (err) {
      console.error('❌ Failed to send message:', err);
    }
  };

  const getAvatar = (msg) => {
    return (
      msg.senderProfileImage ||
      msg.senderId?.profileImage ||
      `https://i.pravatar.cc/150?u=${msg.senderId?._id || msg.senderId}`
    );
  };

  if (!chat) {
    console.log('❕ No chat selected');
    return <p className="p-4 text-gray-500">Select a conversation to view messages.</p>;
  }

  const currentUserId = user?._id || user?.id;

  const chatName =
    chat.name ||
    chat.participantName ||
    chat.studentName ||
    chat.teacherName ||
    chat.participants?.find((p) => p && p._id !== currentUserId)?.name ||
    'No Name';

  console.log('📛 Chat name resolved:', chatName);

  return (
    <div className="flex-1 p-4 flex flex-col justify-between bg-gray-50">
      <div>
        <h2 className="text-lg font-semibold">{chatName}</h2>

        <div className="space-y-2 mt-2 max-h-[70vh] overflow-y-auto">
          {chat.status === 'pending' ? (
            <>
              <p className="text-gray-600 mb-2">Request: {chat.topic || 'Tuition Request'}</p>

              {user?.role === 'student' ? (
                <p className="italic text-gray-700">
                  You: {chat.topic || 'Tuition Request'} (Pending approval)
                </p>
              ) : (
                <div className="space-x-4">
                  <button
                    onClick={() => {
                      console.log('✅ Approve clicked for requestId:', chat.requestId);
                      onApprove(chat.requestId);
                    }}
                    className="px-4 py-1 bg-green-500 text-white rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      console.log('❌ Reject clicked for requestId:', chat.requestId);
                      onReject(chat.requestId);
                    }}
                    className="px-4 py-1 bg-red-500 text-white rounded"
                  >
                    Reject
                  </button>
                </div>
              )}
            </>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={msg._id || `${msg.timestamp}-${i}`}
                message={msg}
                currentUserId={currentUserId}
                avatar={getAvatar(msg)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {chat.status === 'approved' && (
        <div className="flex items-center space-x-2 mt-4 border border-gray-300 rounded-full px-4 py-2 bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow outline-none text-gray-700 placeholder-gray-400 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 transition-shadow shadow-md"
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
