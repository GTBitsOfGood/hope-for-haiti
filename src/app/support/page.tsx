"use client";

import SupportScreen from "@/screens/SupportScreen";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import useChat from "@/hooks/useChat";
import { Chat } from "stream-chat-react";
import LoadingScreen from "@/screens/LoadingScreen";
import { hasPermission, isPartner } from "@/lib/userUtils";

export default function SupportPage() {
  const { data: session } = useSession();
  const client = useChat();
  const [activeTab, setActiveTab] = useState<"Unresolved" | "Resolved">("Unresolved");
  const [searchQuery, setSearchQuery] = useState("");

  if (!session?.user?.type) {
    redirect("/signIn");
  }

  if (!isPartner(session.user.type) && !hasPermission(session.user, "supportRead")) {
    redirect("/");
  }

  if (!client) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-grow h-full max-h-[calc(100vh-64px)]">
      <Chat client={client}>
        <SupportScreen
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          streamUserId={session.user.streamUserId!}
        />
      </Chat>
    </div>
  );
}
