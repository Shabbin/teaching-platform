// src/app/redux/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// --- initial state ---
const initialState = {
  currentUserId: null,
  currentThreadId: null,

  conversations: [],
  conversationsLoaded: false,         // ✅ load once guard

  messagesByThread: {},               // { [threadId]: Message[] }
  messagesLoadedByThread: {},         // ✅ { [threadId]: true } -> load once per thread

  onlineUserIds: [],

  loading: false,                     // legacy flag (kept for compatibility)
  error: null,
};

// --- helpers ---
const isGenericName = (n) =>
  !n || n === 'User' || n === 'Unknown' || n === 'No Name';

function deduplicateMessages(messages) {
  const seen = new Set();
  return messages.filter((msg) => {
    const id = msg._id || `${msg.text}-${msg.timestamp}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function sortConversationsByLatest(convos) {
  return convos.slice().sort((a, b) => {
    const dateA = new Date(a.lastMessageTimestamp || 0);
    const dateB = new Date(b.lastMessageTimestamp || 0);
    return dateB - dateA;
  });
}

function getOtherParticipant(convo, currentUserId) {
  if (Array.isArray(convo?.participants) && currentUserId) {
    return convo.participants.find((p) => String(p?._id) !== String(currentUserId)) || null;
  }
  return null;
}

function computeIdentity({ incoming, existing, currentUserId }) {
  const other = getOtherParticipant(incoming, currentUserId);

  // Fresh values derived from incoming payload
  const freshName =
    other?.name ||
    incoming.teacherName ||
    incoming.studentName ||
    incoming.name ||
    '';

  const freshImg =
    other?.profileImage ||
    incoming.teacherProfileImage ||
    incoming.studentProfileImage ||
    incoming.profileImage ||
    incoming.displayProfileImage ||
    '';

  // Start with existing if it’s already good
  let displayName =
    (!isGenericName(existing?.displayName) && existing?.displayName) ||
    (!isGenericName(existing?.name) && existing?.name) ||
    '';

  let displayProfileImage = existing?.displayProfileImage || existing?.profileImage || '';

  // Upgrade with fresh values if needed
  if (!displayName || isGenericName(displayName)) {
    if (freshName && !isGenericName(freshName)) displayName = freshName;
  }
  if (!displayProfileImage && freshImg) {
    displayProfileImage = freshImg;
  }

  // Deterministic fallback avatar if still missing
  if (!displayProfileImage) {
    const seed =
      other?._id ||
      incoming.participantId ||
      incoming.studentId ||
      incoming.teacherId ||
      incoming.threadId ||
      existing?.participantId ||
      existing?.studentId ||
      existing?.teacherId ||
      existing?.threadId ||
      'unknown';
    displayProfileImage = `https://i.pravatar.cc/150?u=${seed}`;
  }

  if (!displayName) {
    displayName =
      incoming.name ||
      existing?.name ||
      incoming.teacherName ||
      incoming.studentName ||
      'Unknown';
  }

  return { displayName, displayProfileImage };
}

// Find an existing conversation by ANY stable key so we don't duplicate
function findExistingConvo(state, payload) {
  const tId = payload.threadId || payload._id || null;
  const rId = payload.requestId || null;
  if (!state.conversations?.length) return { index: -1, item: null };

  const idx = state.conversations.findIndex((c) => {
    const cTid = c.threadId || c._id || null;
    const cRid = c.requestId || null;
    return (tId && cTid && cTid === tId) || (rId && cRid && cRid === rId);
  });

  return { index: idx, item: idx >= 0 ? state.conversations[idx] : null };
}

// --- optional async kept for markThreadAsRead compatibility ---
export const markThreadAsRead = createAsyncThunk(
  'chat/markThreadAsRead',
  async ({ threadId, userId }, thunkAPI) => {
    try {
      const response = await fetch('/api/chat/threads/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ threadId, userId }),
      });
      if (!response.ok) throw new Error('Failed to mark thread as read');
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
    // -------- conversations --------
    setConversations(state, action) {
      const incomingList = Array.isArray(action.payload) ? action.payload : [];

      const mapped = incomingList.map((convo) => {
        const rawLastMessage = convo.lastMessage;

        const lastMessageText =
          typeof rawLastMessage === 'string'
            ? rawLastMessage
            : rawLastMessage?.text || rawLastMessage?.content || '';

        const lastTimestamp =
          rawLastMessage?.timestamp ||
          rawLastMessage?.createdAt ||
          convo.lastMessageTimestamp ||
          convo.updatedAt ||
          convo.createdAt ||
          null;

        // 🔑 canonical thread id: prefer threadId, but we'll merge if only requestId matches
        const id = convo.threadId || convo._id || null;

        // Merge with any existing by threadId OR requestId
        const { item: existing } = findExistingConvo(state, { threadId: id, requestId: convo.requestId });

        const { displayName, displayProfileImage } = computeIdentity({
          incoming: { ...convo, threadId: id || existing?.threadId || convo.threadId },
          existing: existing || {},
          currentUserId: state.currentUserId,
        });

        return {
          ...(existing || {}),
          ...convo,
          threadId: id || existing?.threadId || convo.threadId || existing?._id || convo._id,
          requestId: convo.requestId || existing?.requestId,
          lastMessage: lastMessageText,
          lastMessageTimestamp: lastTimestamp ? new Date(lastTimestamp).toISOString() : null,
          unreadCount:
            typeof convo.unreadCount === 'number'
              ? convo.unreadCount
              : existing?.unreadCount || 0,
          participants: convo.participants || existing?.participants,
          messages: convo.messages || existing?.messages,
          sessions: convo.sessions || existing?.sessions,
          sender: convo.sender || existing?.sender,
          // stable identity
          displayName,
          displayProfileImage,
        };
      });

      state.conversations = sortConversationsByLatest(mapped);
    },

    setConversationsLoaded(state, action) {
      state.conversationsLoaded = !!action.payload;
    },

    setCurrentThreadId(state, action) {
      state.currentThreadId = action.payload || null;
    },

    addOrUpdateConversation(state, action) {
      const convo = action.payload || {};
      if (!convo) return;

      // Prefer threadId but allow requestId-only payloads and merge into existing
      const preferredThreadId = convo.threadId || convo._id || null;
      const { index: existingIndex, item: existingConvo } = findExistingConvo(state, {
        threadId: preferredThreadId,
        requestId: convo.requestId,
      });

      // Normalize last message
      let lastMessage = convo.lastMessage;
      if (lastMessage && typeof lastMessage !== 'string') {
        lastMessage = lastMessage.text || '';
      }

      const lastTimestampRaw =
        convo.lastMessage?.timestamp ||
        convo.lastMessage?.createdAt ||
        convo.lastMessageTimestamp ||
        convo.updatedAt ||
        convo.messages?.at?.(-1)?.timestamp ||
        null;

      const lastMessageTimestamp = lastTimestampRaw
        ? new Date(lastTimestampRaw).toISOString()
        : null;

      const currentUserId = state.currentUserId;

      const { displayName, displayProfileImage } = computeIdentity({
        incoming: { ...convo, threadId: preferredThreadId || existingConvo?.threadId },
        existing: existingConvo || {},
        currentUserId,
      });

      const baseData = {
        ...(existingConvo || {}),
        ...convo,
        threadId: preferredThreadId || existingConvo?.threadId || convo._id || existingConvo?._id,
        requestId: convo.requestId || existingConvo?.requestId,
        lastMessage,
        lastMessageTimestamp,
        participants: convo.participants || existingConvo?.participants,
        messages: convo.messages || existingConvo?.messages,
        sessions: convo.sessions || existingConvo?.sessions,
        sender: convo.sender || existingConvo?.sender,
        // stable identity (never downgrade to generic)
        displayName,
        displayProfileImage,
        unreadCount: convo.incrementUnread
          ? (existingConvo?.unreadCount || 0) + 1
          : (typeof convo.unreadCount === 'number'
              ? convo.unreadCount
              : existingConvo?.unreadCount || 0),
      };

      if (existingIndex === -1) {
        state.conversations.push(baseData);
      } else {
        state.conversations[existingIndex] = baseData;
      }

      state.conversations = sortConversationsByLatest(state.conversations);
    },

    // -------- presence --------
    setOnlineUserIds(state, action) {
      const ids = (action.payload || []).map((x) => String(x));
      state.onlineUserIds = Array.from(new Set(ids));
    },
    addOnlineUserId(state, action) {
      const id = String(action.payload || '');
      if (!id) return;
      if (!state.onlineUserIds.includes(id)) {
        state.onlineUserIds.push(id);
      }
    },
    removeOnlineUserId(state, action) {
      const id = String(action.payload || '');
      if (!id) return;
      state.onlineUserIds = state.onlineUserIds.filter((x) => x !== id);
    },

    // 🔁 RESET STATE WHEN USER CHANGES
    setCurrentUserId(state, action) {
      const newId = action.payload || null;
      if (state.currentUserId !== newId) {
        return {
          ...initialState,
          currentUserId: newId,
        };
      }
      state.currentUserId = newId;
    },

    incrementUnreadCount(state, action) {
      const { threadId } = action.payload || {};
      const convo = state.conversations.find((c) => c.threadId === threadId);
      if (convo) {
        convo.unreadCount = (convo.unreadCount || 0) + 1;
      }
    },

    // -------- messages --------
    setMessagesForThread(state, action) {
      const { threadId, messages } = action.payload || {};
      if (!threadId) return;
      state.messagesByThread[threadId] = deduplicateMessages(messages || []);
    },

    addMessageToThread(state, action) {
      const { threadId, message } = action.payload || {};
      if (!threadId || !message) return;

      if (!state.messagesByThread[threadId]) {
        state.messagesByThread[threadId] = [];
      }

      const messageId =
        message._id ||
        (typeof message.text === 'string' && message.timestamp
          ? `${message.text}-${message.timestamp}`
          : null);
      if (!messageId) return;

      const exists = state.messagesByThread[threadId].some((m) => {
        const existingId =
          m._id ||
          (typeof m.text === 'string' && m.timestamp
            ? `${m.text}-${m.timestamp}`
            : null);
        return existingId === messageId;
      });

      if (!exists) {
        state.messagesByThread[threadId].push(message);
      }
    },

    // ✅ mark a thread as "loaded once"
    setThreadLoaded(state, action) {
      const { threadId } = action.payload || {};
      if (!threadId) return;
      state.messagesLoadedByThread[threadId] = true;
    },

    updateLastMessageInConversation(state, action) {
      const { threadId, message } = action.payload || {};
      const conversation = state.conversations.find((c) => c.threadId === threadId);
      if (conversation) {
        conversation.lastMessage = message?.text || '';
        const ts = message?.timestamp || new Date().toISOString();
        conversation.lastMessageTimestamp = new Date(ts).toISOString();
        state.conversations = sortConversationsByLatest(state.conversations);
      }
    },

    resetUnreadCount(state, action) {
      const { threadId } = action.payload || {};
      const convo = state.conversations.find((c) => c.threadId === threadId);
      if (convo) convo.unreadCount = 0;
    },

    updateConversationStatus(state, action) {
      const { requestId, status } = action.payload || {};
      const { index } = findExistingConvo(state, { requestId });
      if (index !== -1) {
        state.conversations[index].status = status;
      }
    },

    clearMessagesForThread(state, action) {
      const threadId = action.payload;
      delete state.messagesByThread[threadId];
      delete state.messagesLoadedByThread[threadId];
    },

    // legacy flags (left in place so nothing else breaks)
    setLoading(state, action) {
      state.loading = !!action.payload;
    },
    setError(state, action) {
      state.error = action.payload || null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(markThreadAsRead.fulfilled, (state, action) => {
        const { threadId } = action.payload || {};
        const convo = state.conversations.find((c) => c.threadId === threadId);
        if (convo) convo.unreadCount = 0;
      })
      .addCase(markThreadAsRead.rejected, (state, action) => {
        state.error = action.payload || 'Failed to mark thread as read';
      });
  },
});

export const {
  setConversations,
  setConversationsLoaded,
  setCurrentThreadId,
  addOrUpdateConversation,

  // presence
  setOnlineUserIds,
  addOnlineUserId,
  removeOnlineUserId,

  setCurrentUserId,

  incrementUnreadCount,

  setMessagesForThread,
  addMessageToThread,
  setThreadLoaded,
  updateLastMessageInConversation,
  resetUnreadCount,
  updateConversationStatus,
  clearMessagesForThread,

  setLoading,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
