export default function MessageBubble({ message, currentUserId }) {
  const isMine = message.sender === currentUserId;

  return (
    <div
      className={`p-2 rounded-md max-w-[70%] ${
        isMine ? "bg-blue-500 text-white ml-auto" : "bg-gray-200 text-black"
      }`}
    >
      {message.text}
    </div>
  );
}
