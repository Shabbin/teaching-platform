'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import MessageBubble from './MessageBubble';
import useSocket from '../../../hooks/useSocket';
import {
  clearMessagesForThread as clearMessagesAction,
  addMessageToThread as resetUnreadCount,
} from '../../../redux/chatSlice';
import { fetchMessagesThunk } from '../../../redux/chatThunks';
import { CheckCircle, XCircle } from 'lucide-react';
import { makeSelectMessagesByThread } from '../../../redux/chatSelectors';

export default function ChatPanel({ chat, user, onApprove, onReject }) {
  const dispatch = useDispatch();

  const selectMessages = useMemo(
    () => makeSelectMessagesByThread(chat?.threadId),
    [chat?.threadId]
  );
  const messages = useSelector(selectMessages);

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef();
  const { sendMessage: socketSendMessage, joinThread, socketRef } = useSocket(chat?.threadId);

  const latestMessagesRef = useRef(messages);
  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chat?.threadId || chat.status !== 'approved') {
      if (chat?.threadId) dispatch(clearMessagesAction(chat.threadId));
      return;
    }

    dispatch(clearMessagesAction(chat.threadId));
    dispatch(fetchMessagesThunk(chat.threadId));

    if (socketRef && socketRef.current) {
      socketRef.current.emit('mark_thread_read', {
        threadId: chat.threadId,
        userId: user?._id || user?.id,
      });
    }
  }, [chat?.threadId, chat?.status, dispatch, user, socketRef]);

  useEffect(() => {
    if (chat?.threadId && joinThread) {
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

    try {
      socketSendMessage(messageData);
      setNewMessage('');

      dispatch(resetUnreadCount({ threadId: chat.threadId, userId: user?._id || user?.id }));

      if (socketRef && socketRef.current) {
        socketRef.current.emit('mark_thread_read', {
          threadId: chat.threadId,
          userId: user?._id || user?.id,
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const getAvatar = (msg) => {
    return (
      msg.sender?.profileImage ||
      `https://i.pravatar.cc/150?u=${msg.sender?._id || msg.senderId}`
    );
  };

  if (!chat) {
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

  return (
    <div className="flex-1 p-4 flex flex-col justify-between bg-gray-50">
      <div>
        <h2 className="text-lg font-semibold">{chatName}</h2>

        <div className="space-y-2 mt-2 max-h-[70vh] overflow-y-auto">
          {chat.status === 'pending' ? (
            <div className="bg-white p-4 rounded-xl shadow border border-gray-200 max-w-[90%] w-full break-words">
              <p className="text-gray-600 mb-2 font-medium">
                Request: {chat.topic || 'Tuition Request'}
              </p>
              <p className="text-gray-800 whitespace-pre-wrap break-words break-all mb-4 leading-relaxed w-full">
                {chat.lastMessage || 'No message provided'}
              </p>

              {user?.role === 'student' ? (
                <p className="italic text-gray-700">
                  You: {chat.topic || 'Tuition Request'} (Pending approval)
                </p>
              ) : (
                <div className="flex gap-3 justify-end flex-wrap">
                  <button
                    onClick={() => onApprove(chat.requestId)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => onReject(chat.requestId)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
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
