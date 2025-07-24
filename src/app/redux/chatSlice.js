// redux/chatSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  messagesByThread: {}, // threadId -> messages[]
  loading: false,
  error: null,
};

// Helper to deduplicate an array of messages by _id or fallback key
function deduplicateMessages(messages) {
  const seen = new Set();
  return messages.filter(msg => {
    const id = msg._id || `${msg.text}-${msg.timestamp}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations(state, action) {
      const normalizedConversations = action.payload.map(convo => {
        let lastMessage = convo.lastMessage;
        if (lastMessage && typeof lastMessage !== 'string') {
          lastMessage = lastMessage.text || '';
        }
        return {
          ...convo,
          lastMessage,
        };
      });
      state.conversations = normalizedConversations;
    },
    addOrUpdateConversation(state, action) {
      const convo = action.payload;
      const id = convo.threadId || convo.requestId;

      let lastMessage = convo.lastMessage;
      if (lastMessage && typeof lastMessage !== 'string') {
        lastMessage = lastMessage.text || '';
      }

      const normalizedConvo = {
        ...convo,
        lastMessage,
      };

      const index = state.conversations.findIndex(c => (c.threadId || c.requestId) === id);
      if (index === -1) {
        state.conversations.push(normalizedConvo);
      } else {
        state.conversations[index] = normalizedConvo;
      }
    },
    setMessagesForThread(state, action) {
      const { threadId, messages } = action.payload;
      // Deduplicate messages before setting state
      state.messagesByThread[threadId] = deduplicateMessages(messages);
    },
    addMessageToThread(state, action) {
      const { threadId, message } = action.payload;
      if (!state.messagesByThread[threadId]) {
        state.messagesByThread[threadId] = [];
      }

      // Deduplicate by _id or fallback to text+timestamp combo
      const messageId = message._id || `${message.text}-${message.timestamp}`;
      const exists = state.messagesByThread[threadId].some(m => {
        const existingId = m._id || `${m.text}-${m.timestamp}`;
        return existingId === messageId;
      });

      if (!exists) {
        state.messagesByThread[threadId].push(message);
      }
    },
    updateLastMessageInConversation(state, action) {
      const { threadId, message } = action.payload;

      const convo = state.conversations.find(
        (c) => c.threadId === threadId || c.requestId === threadId
      );

      if (convo) {
        convo.lastMessage = message.text || message.content || '';
        convo.lastMessageTimestamp = message.timestamp || message.createdAt || new Date().toISOString();
      }

      // Sort conversations by latest message timestamp descending
      state.conversations = [...state.conversations].sort((a, b) => {
        const dateA = new Date(a.lastMessageTimestamp || 0);
        const dateB = new Date(b.lastMessageTimestamp || 0);
        return dateB - dateA;
      });
    },
    updateConversationStatus(state, action) {
      const { requestId, status } = action.payload;

      const convo = state.conversations.find(c => c.requestId === requestId);
      if (convo) {
        convo.status = status;
      }
    },
    clearMessagesForThread(state, action) {
      const threadId = action.payload;
      delete state.messagesByThread[threadId];
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  setConversations,
  addOrUpdateConversation,
  setMessagesForThread,
  addMessageToThread,
  updateConversationStatus,
  clearMessagesForThread,
  updateLastMessageInConversation,
  setLoading,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
