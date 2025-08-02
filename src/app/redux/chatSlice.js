import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  messagesByThread: {}, // threadId -> messages[]
  loading: false,
  error: null,
  conversationsLoaded: false,
};

// Deduplicates messages by _id or fallback
function deduplicateMessages(messages) {
  const seen = new Set();
  return messages.filter((msg) => {
    const id = msg._id || `${msg.text}-${msg.timestamp}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// Sort helper for conversations by latest message timestamp
function sortConversationsByLatest(convos) {
  return convos.slice().sort((a, b) => {
    const dateA = new Date(a.lastMessageTimestamp || 0);
    const dateB = new Date(b.lastMessageTimestamp || 0);
    return dateB - dateA;
  });
}

// Async thunk to mark thread as read (already exists)
export const markThreadAsRead = createAsyncThunk(
  'chat/markThreadAsRead',
  async ({ threadId, userId }, thunkAPI) => {
    try {
      const response = await fetch('/api/chat/markRead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to mark thread as read');
      }
      return { threadId, userId };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
  setConversations(state, action) {
  const normalized = action.payload.map((convo) => {
    const rawLastMessage = convo.lastMessage;

    const lastMessageText =
      typeof rawLastMessage === 'string'
        ? rawLastMessage
        : rawLastMessage?.text || rawLastMessage?.content || '';

    const lastTimestamp =
      rawLastMessage?.timestamp ||
      rawLastMessage?.createdAt ||
      convo.lastMessageTimestamp ||
      null;

    return {
      ...convo,
      lastMessage: lastMessageText,
      lastMessageTimestamp: lastTimestamp,
      unreadCount: convo.unreadCount || 0,  // ✅ keep as is
    };
  });

  console.log("Normalized conversations after refresh:", normalized);

  state.conversations = sortConversationsByLatest(normalized);
},
setConversationsLoaded(state, action) {
  state.conversationsLoaded = action.payload;
},
setCurrentThreadId(state, action) {
  state.currentThreadId = action.payload;
},
addOrUpdateConversation(state, action) {
  const convo = action.payload;
  console.log('[addOrUpdateConversation] convo payload:', convo);
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

  const lastMessageTimestamp = lastTimestampRaw
    ? new Date(lastTimestampRaw).toISOString()
    : null;

  // Extract names with fallbacks
  const studentName =
    convo.studentName ||
    convo.request?.studentName ||
    (convo.participants && convo.participants.find(p => p.role === 'student')?.name) ||
    'No Name';

  const teacherName =
    convo.teacherName ||
    convo.request?.teacherName ||
    (convo.participants && convo.participants.find(p => p.role === 'teacher')?.name) ||
    'No Name';

  const existingIndex = state.conversations.findIndex(
    (c) => (c.threadId || c._id || c.requestId) === id
  );

  if (existingIndex === -1) {
    const normalizedConvo = {
      ...convo,
      threadId: id,
      lastMessage,
      lastMessageTimestamp,
      unreadCount: convo.incrementUnread ? 1 : (convo.unreadCount ?? 0),
      studentName,
      teacherName,
    };
    state.conversations.push(normalizedConvo);
  } else {
    const existingConvo = state.conversations[existingIndex];

    const mergedConvo = {
      ...existingConvo,
      ...convo,
      threadId: id,
      lastMessage,
      lastMessageTimestamp,
      unreadCount:
        convo.unreadCount !== undefined
          ? convo.unreadCount
          : existingConvo.unreadCount ?? 0,
      messages: convo.messages || existingConvo.messages,
      participants: convo.participants || existingConvo.participants,
      sessions: convo.sessions || existingConvo.sessions,
      studentName,
      teacherName,
    };

    if (convo.incrementUnread) {
      mergedConvo.unreadCount = (existingConvo.unreadCount || 0) + 1;
    }

    state.conversations[existingIndex] = mergedConvo;
  }

  state.conversations = sortConversationsByLatest(state.conversations);
},




    // New reducer to increment unread count for a conversation by threadId
    incrementUnreadCount(state, action) {
      const { threadId } = action.payload;
      const convo = state.conversations.find((c) => c.threadId === threadId);
      if (convo) {
        convo.unreadCount = (convo.unreadCount || 0) + 1;
      }
    },

    setMessagesForThread(state, action) {
      const { threadId, messages } = action.payload;
      state.messagesByThread[threadId] = deduplicateMessages(messages);
    },

  addMessageToThread(state, action) {
  const { threadId, message } = action.payload;

  if (!message || !threadId) {
    // Defensive: ignore if message or threadId is missing
    return;
  }

  if (!state.messagesByThread[threadId]) {
    state.messagesByThread[threadId] = [];
  }

  // Defensive: make sure message has _id or text and timestamp before generating ID
  const messageId =
    (typeof message._id === 'string' && message._id) ||
    (typeof message.text === 'string' && message.timestamp
      ? `${message.text}-${message.timestamp}`
      : null);

  if (!messageId) {
    // Invalid message id, ignore this message
    return;
  }

  const exists = state.messagesByThread[threadId].some((m) => {
    const existingId =
      (typeof m._id === 'string' && m._id) ||
      (typeof m.text === 'string' && m.timestamp
        ? `${m.text}-${m.timestamp}`
        : null);
    return existingId === messageId;
  });

  if (!exists) {
    state.messagesByThread[threadId].push(message);
  }
},


    updateLastMessageInConversation(state, action) {
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
resetUnreadCount(state, action) {
  const { threadId } = action.payload;
  const convo = state.conversations.find((c) => c.threadId === threadId);
  if (convo) {
    convo.unreadCount = 0;
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

  extraReducers: (builder) => {
    builder
      .addCase(markThreadAsRead.fulfilled, (state, action) => {
        const { threadId } = action.payload;
        const convo = state.conversations.find(c => c.threadId === threadId);
        if (convo) {
          convo.unreadCount = 0;  // reset unread count locally
        }
      })
      .addCase(markThreadAsRead.rejected, (state, action) => {
        state.error = action.payload || 'Failed to mark thread as read';
      });
  },
});

export const {
  setConversations,
  addOrUpdateConversation,
  incrementUnreadCount,
  setMessagesForThread,
  addMessageToThread,
  updateConversationStatus,
  clearMessagesForThread,
  updateLastMessageInConversation,
    resetUnreadCount,
    setCurrentThreadId,
    setConversationsLoaded,
  setLoading,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
