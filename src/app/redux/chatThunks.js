import { createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';
import {
  setConversations,
  addOrUpdateConversation,
  setConversationsLoaded,
  setLoading,
  setCurrentUserId,
  setError,
  setMessagesForThread,
} from './chatSlice';

// ---------- helpers (stable identity) ----------
const isGenericName = (n) =>
  !n || n === 'User' || n === 'Unknown' || n === 'No Name';

const pickOther = (conv, myId) => {
  // prefer participants
  if (Array.isArray(conv?.participants) && myId) {
    const other = conv.participants.find((p) => String(p?._id) !== String(myId));
    if (other) return other;
  }
  // fall back to explicit fields
  return {
    _id: conv?.studentId || conv?.teacherId || conv?.participantId,
    name: conv?.studentName || conv?.teacherName || conv?.name,
    profileImage:
      conv?.studentProfileImage || conv?.teacherProfileImage || conv?.profileImage,
  };
};

const deriveDisplay = (conv, myId, existing = {}) => {
  const other = pickOther(conv, myId) || {};
  const name = !isGenericName(other?.name) ? other.name : existing.displayName;
  const profileImage = other?.profileImage || existing.displayProfileImage;

  return {
    displayName: name || existing.displayName || 'Unknown',
    displayProfileImage:
      profileImage ||
      `https://i.pravatar.cc/150?u=${other?._id || conv?.threadId || 'unknown'}`,
  };
};

const makeClientKey = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// ---------- fetch conversations ----------
export const fetchConversationsThunk = createAsyncThunk(
  'chat/fetchConversations',
  async ({ userId }, thunkAPI) => {
    try {
      thunkAPI.dispatch(setLoading(true));
      if (!userId) throw new Error('No userId found');

      thunkAPI.dispatch(setCurrentUserId(userId));
      const { data } = await API.get(`/chat/conversations/${userId}`, {
        withCredentials: true,
      });

      const normalized = (data || [])
        .filter(Boolean)
        .map((chat) => {
          const threadId = chat.threadId || chat._id || chat.requestId;
          const lastTs =
            chat.lastMessage?.timestamp ||
            chat.lastMessage?.createdAt ||
            chat.updatedAt ||
            chat.createdAt ||
            null;

          const base = {
            ...chat,
            threadId,
            unreadCount: chat.unreadCount || 0,
            lastMessage: chat.lastMessage || '',
            lastMessageTimestamp: lastTs,
            sessions: chat.sessions || [],
          };

          // compute stable identity once and store on the convo
          const disp = deriveDisplay(base, userId, {
            displayName: chat.displayName,
            displayProfileImage: chat.displayProfileImage,
          });

          return { ...base, ...disp };
        })
        .filter((c) => c.threadId);

      thunkAPI.dispatch(setConversations(normalized));
      thunkAPI.dispatch(setConversationsLoaded(true));
      return normalized;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to fetch conversations';
      thunkAPI.dispatch(setError(msg));
      return thunkAPI.rejectWithValue(msg);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

// ---------- normalize a message ----------
export function normalizeMessage(msg) {
  const senderObj = msg.sender || msg.senderId;
  const senderId =
    typeof senderObj === 'object' && senderObj !== null ? senderObj._id : senderObj;

  return {
    ...msg,
    senderId,
    sender:
      typeof senderObj === 'object'
        ? senderObj
        : {
            _id: senderId,
            name: 'Unknown',
            profileImage: `https://i.pravatar.cc/150?u=${senderId}`,
            role: null,
          },
  };
}

// ---------- fetch messages for a thread ----------
export const fetchMessagesThunk = createAsyncThunk(
  'chat/fetchMessages',
  async (threadId, thunkAPI) => {
    try {
      if (!threadId) return [];
      thunkAPI.dispatch(setLoading(true));

      const res = await API.get(`/chat/messages/${threadId}`, {
        withCredentials: true,
        params: { limit: 30 },
      });

      const fetched = (res.data || []).map(normalizeMessage);

      const state = thunkAPI.getState();
      const existing = state.chat.messagesByThread[threadId] || [];

      const byKey = new Set(existing.map((m) => m._id || `${m.text}-${m.timestamp}`));
      const unique = fetched.filter((m) => !byKey.has(m._id || `${m.text}-${m.timestamp}`));

      if (unique.length) {
        thunkAPI.dispatch(
          setMessagesForThread({ threadId, messages: [...existing, ...unique] })
        );
      }
      return fetched;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to fetch messages';
      thunkAPI.dispatch(setError(msg));
      return thunkAPI.rejectWithValue(msg);
    } finally {
      thunkAPI.dispatch(setLoading(false));
    }
  }
);

// ---------- send message via HTTP (optional; you also use socket) ----------
export const sendMessageThunk = createAsyncThunk(
  'chat/sendMessage',
  async ({ threadId, text }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const user = state.user?.userInfo || {};
      const senderId = user.id || user._id;
      if (!senderId) throw new Error('No senderId in user state');

      const clientKey = makeClientKey();
      const payload = { threadId, senderId, text, clientKey };

      const { data } = await API.post('/chat/messages', payload, {
        withCredentials: true,
      });
      return data;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to send message';
      thunkAPI.dispatch(setError(msg));
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// ---------- refresh single conversation by requestId ----------
export const refreshConversationThunk = createAsyncThunk(
  'chat/refreshConversation',
  async (requestId, thunkAPI) => {
    try {
      const { data } = await API.get(`/teacher-requests/request/${requestId}`, {
        withCredentials: true,
      });

      const state = thunkAPI.getState();
      const myId = state.user.userInfo.id || state.user.userInfo._id;

      const normalized = {
        ...data,
        threadId: data._id,
        requestId: data.requestId || requestId,
        messages: data.messages || [],
        lastMessage: data.messages?.at?.(-1)?.text || '',
        unreadCount: 0,
        status: data.sessions?.[data.sessions.length - 1]?.status || 'approved',
      };

      const disp = deriveDisplay(normalized, myId, {});
      const convo = { ...normalized, ...disp };

      thunkAPI.dispatch(addOrUpdateConversation(convo));
      return convo;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to refresh conversation';
      thunkAPI.dispatch(setError(msg));
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// ---------- approve request then ensure convo has stable display fields ----------
// ✅ Approve request → ensure thread exists/updated
export const approveRequestThunk = createAsyncThunk(
  'chat/approveRequest',
  async (requestId, thunkAPI) => {
    try {
      // ⬅️ CHANGED: POST -> PATCH and use /:id/approve
      const { data } = await API.patch(
        `/teacher-requests/${requestId}/approve`,
        {},
        { withCredentials: true }
      );

      // If your backend returns { threadId }, prefer that instead of fetching by requestId
      const threadId = data?.threadId || requestId; // fallback keeps previous behavior

      // (Optional) If you have an endpoint to fetch a thread by threadId, use it:
      // const threadRes = await API.get(`/chat/thread/by-id/${threadId}`, { withCredentials: true });
      // const threadData = threadRes.data;

      // Keeping your existing normalization logic as-is:
      const threadRes = await API.get(`/chat/thread/${requestId}`, { withCredentials: true }); // if this exists in your API
      const threadData = threadRes.data;

      const state = thunkAPI.getState();
      const userId = state.user.userInfo.id || state.user.userInfo._id;

      const otherParticipant = (threadData.participants || []).find((p) => p._id !== userId);
      const latestSession = threadData.sessions?.[threadData.sessions.length - 1];
      const status = latestSession?.status || 'approved';

      const lastMsg =
        threadData.lastMessage?.text ||
        (threadData.messages?.length ? threadData.messages[threadData.messages.length - 1].text : '');

      const normalizedConvo = {
        threadId: threadData._id || threadId,
        requestId,
        messages: threadData.messages || [],
        lastMessage: lastMsg,
        unreadCount: 0,
        status,
        teacherId: otherParticipant?._id,
        teacherName: otherParticipant?.name || 'Unknown',
        teacherImage: otherParticipant?.profileImage || '',
      };

      thunkAPI.dispatch(addOrUpdateConversation(normalizedConvo));
      return normalizedConvo;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to approve request';
      thunkAPI.dispatch(setError(msg));
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

