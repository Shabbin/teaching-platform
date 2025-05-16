"use client";
import ChatWindow from "@/components/ChatWindow";
import { useEffect, useState } from "react";
import axios from "axios";

export default function MessengerPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // fetch your logged-in user from localStorage or backend
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data))
      .catch(console.error);
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Messenger</h1>
      <div className="border rounded-lg h-[600px]">
        <ChatWindow user={user} popupMode={false} />
      </div>
    </div>
  );
}
