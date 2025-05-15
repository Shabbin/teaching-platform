'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MessengerPopup() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-600 hover:text-indigo-600"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white shadow-lg border rounded-xl p-4 z-50 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Messenger</h2>
            <button onClick={() => setOpen(false)}>❌</button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <p className="text-sm text-gray-500">No messages yet.</p>
          </div>

          {/* ✅ Button that navigates to full-page Messenger */}
          <button
            onClick={() => {
              setOpen(false); // close popup
              router.push('/dashboard/teacher/messenger'); // go to page
            }}
            className="mt-4 text-sm text-indigo-600 hover:underline self-end"
          >
            See all in Messenger →
          </button>
        </div>
      )}
    </>
  );
}
