// src/app/dashboard/teacher/components/MessageBubble.jsx

export default function MessageBubble({ message, currentUserId, avatar }) {
  const isMine = message.senderId === currentUserId;

  return (
    <div className={`flex items-start max-w-[70%] ${isMine ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}>
      {/* Show avatar only if message is NOT mine */}
      {!isMine && (
        <img
          src={avatar}
          alt="Sender avatar"
          className="w-8 h-8 rounded-full mr-2 object-cover select-none"
          loading="lazy"
          draggable={false}
        />
      )}
      
      <div
        className={`p-2 rounded-md ${
          isMine ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
