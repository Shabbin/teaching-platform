// src/app/redux/chatSelectors.js
// Selector helpers for chat

import { createSelector } from '@reduxjs/toolkit';

// ---- shared empty fallbacks (never mutate these)
const EMPTY = Object.freeze([]);
const EMPTY_MAP = Object.freeze({});

// ---- basic slices (return stable references)
export const selectChatState = (state) => state.chat || {};
export const selectConversations = (state) =>
  state.chat?.conversations ?? EMPTY;
export const selectMessagesByThreadMap = (state) =>
  state.chat?.messagesByThread ?? EMPTY_MAP;
export const selectCurrentUserId = (state) =>
  state.chat?.currentUserId ||
  state.user?.userInfo?.id ||
  state.user?.userInfo?._id ||
  null;

// ---- factory: messages for a given threadId (stable EMPTY when missing)
export const makeSelectMessagesByThread = (threadId) =>
  createSelector([selectMessagesByThreadMap], (map) => map[threadId] ?? EMPTY);

// ---- badge: distinct other users who have any unread
export const selectUnreadUserIds = createSelector(
  [selectConversations, selectCurrentUserId],
  (convos, myId) => {
    const set = new Set();
    for (const c of convos) {
      const unread = Number(c?.unreadCount || 0);
      if (unread > 0 && Array.isArray(c?.participants)) {
        const other = c.participants.find(
          (p) => String(p?._id) !== String(myId)
        );
        if (other?._id) set.add(String(other._id));
      }
    }
    // Reselect memoizes the entire projector result; returning the same array
    // instance when inputs don't change prevents re-renders.
    return Array.from(set);
  }
);

export const selectUnreadUsersCount = createSelector(
  [selectUnreadUserIds],
  (ids) => ids.length
);

// ---- optional helpers (safe, stable fallbacks)
export const selectOnlineUserIds = (state) =>
  state.chat?.onlineUserIds ?? EMPTY;

export const makeSelectConversationByThreadId = (threadId) =>
  createSelector([selectConversations], (convos) =>
    convos.find((c) => (c.threadId || c._id || c.requestId) === threadId) ||
    null
  );
