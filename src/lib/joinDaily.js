// src/lib/joinDaily.js
const DAILY_SUBDOMAIN = process.env.NEXT_PUBLIC_DAILY_SUBDOMAIN || '';

export function dailyRoomUrl(roomName) {
  const base = DAILY_SUBDOMAIN ? `https://${DAILY_SUBDOMAIN}.daily.co` : 'https://meet.daily.co';
  return `${base}/${roomName}`;
}

/**
 * Dynamically imports @daily-co/daily-js on the client,
 * creates an iframe inside containerEl, and joins with token.
 */
export async function joinDaily({ roomName, token, containerEl, userName = 'User' }) {
  if (typeof window === 'undefined') throw new Error('Client-only');
  const DailyIframe = (await import('@daily-co/daily-js')).default;

  const call = DailyIframe.createFrame(containerEl, {
    iframeStyle: {
      width: '100%',
      height: '100%',
      border: '0',
      borderRadius: '12px',
    },
    showLeaveButton: true,
  });

  await call.join({ url: dailyRoomUrl(roomName), token, userName });
  return call;
}
