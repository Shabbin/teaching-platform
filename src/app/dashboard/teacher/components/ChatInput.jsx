import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="p-2 border-t flex gap-2">
      <input
        type="text"
        className="flex-1 border px-2 py-1 rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message"
      />
      <button
        className="bg-blue-600 text-white px-3 py-1 rounded"
        onClick={handleSend}
      >
        Send
      </button>
    </div>
  );
}
