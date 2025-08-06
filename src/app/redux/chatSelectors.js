import { createSelector } from '@reduxjs/toolkit';

export const makeSelectMessagesByThread = (threadId) =>
  createSelector(
    (state) => state.chat.messagesByThread,
    (messagesByThread) => messagesByThread[threadId] || []
  );
