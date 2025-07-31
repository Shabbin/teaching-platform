// redux/chatSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  messagesByThread: {}, // threadId -> messages[]
  loading: false,
  error: null,
};

// 🔁 Deduplicates messages by _id or fallback
function deduplicateMessages(messages) {
  const seen = new Set();
  return messages.filter((msg) => {
    const id = msg._id || `${msg.text}-${msg.timestamp}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// 🧠 Sort helper for conversations
function sortConversationsByLatest(convos) {
  return convos.slice().sort((a, b) => {
    const dateA = new Date(a.lastMessageTimestamp || 0);
    const dateB = new Date(b.lastMessageTimestamp || 0);
    return dateB - dateA;
  });
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
setConversations(state, action) {
  const normalized = action.payload.map((convo) => {
    let lastMessage = convo.lastMessage;

    if (lastMessage && typeof lastMessage !== 'string') {
      lastMessage = lastMessage.text || lastMessage.content || '';
    } else if (typeof lastMessage === 'string') {
      lastMessage = lastMessage;
    }

    const lastTimestamp =
      convo.lastMessage?.timestamp ||
      convo.lastMessage?.createdAt ||
      convo.lastMessageTimestamp ||
      null;

    return {
      ...convo,
      lastMessage,
      lastMessageTimestamp: lastTimestamp,
    };
  });

  console.log("Normalized conversations after refresh:", normalized);

  state.conversations = sortConversationsByLatest(normalized);
},

addOrUpdateConversation(state, action) {
  const convo = action.payload;
  const id = convo.threadId || convo._id || convo.requestId;

  let lastMessage = convo.lastMessage;
  if (lastMessage && typeof lastMessage !== 'string') {
    lastMessage = lastMessage.text || '';
  }

  const lastTimestampRaw =
    convo.lastMessage?.timestamp ||
    convo.lastMessage?.createdAt ||
    convo.lastMessageTimestamp ||
    convo.updatedAt ||
    convo.messages?.at(-1)?.timestamp ||
    null;

  const lastMessageTimestamp = lastTimestampRaw ? new Date(lastTimestampRaw).toISOString() : null;

  const existingIndex = state.conversations.findIndex(
    (c) => (c.threadId || c._id || c.requestId) === id
  );

  if (existingIndex === -1) {
    // New conversation: add normalized
    const normalizedConvo = {
      ...convo,
      threadId: id,
      lastMessage,
      lastMessageTimestamp,
    };
    state.conversations.push(normalizedConvo);
  } else {
    // Merge with care to not overwrite arrays (messages, participants)
    const existingConvo = state.conversations[existingIndex];

    const mergedConvo = {
      ...existingConvo,
      ...convo,
      threadId: id,
      lastMessage,
      lastMessageTimestamp,
      messages: convo.messages || existingConvo.messages,
      participants: convo.participants || existingConvo.participants,
      sessions: convo.sessions || existingConvo.sessions,
    };

    state.conversations[existingIndex] = mergedConvo;
  }

  state.conversations = sortConversationsByLatest(state.conversations);
},



    setMessagesForThread(state, action) {
      const { threadId, messages } = action.payload;
      state.messagesByThread[threadId] = deduplicateMessages(messages);
    },

    addMessageToThread(state, action) {
      const { threadId, message } = action.payload;
      if (!state.messagesByThread[threadId]) {
        state.messagesByThread[threadId] = [];
      }

      const messageId = message._id || `${message.text}-${message.timestamp}`;
      const exists = state.messagesByThread[threadId].some((m) => {
        const existingId = m._id || `${m.text}-${m.timestamp}`;
        return existingId === messageId;
      });

      if (!exists) {
        state.messagesByThread[threadId].push(message);
      }
    },

updateLastMessageInConversation: (state, action) => {
  const { threadId, message } = action.payload;
  const conversation = state.conversations.find(c => c.threadId === threadId);
  if (conversation) {
    conversation.lastMessage = message.text || '';
    
    // Normalize timestamp: ensure it's a valid Date or ISO string
    const ts = message.timestamp || new Date().toISOString();
    conversation.lastMessageTimestamp = new Date(ts).toISOString();

    state.conversations = [...sortConversationsByLatest(state.conversations)];
  }
},

    updateConversationStatus(state, action) {
      const { requestId, status } = action.payload;

      const convo = state.conversations.find((c) => c.requestId === requestId);
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
