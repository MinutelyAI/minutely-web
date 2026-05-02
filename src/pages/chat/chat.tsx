import { MessageSquare } from "lucide-react";
import { Outlet } from "react-router-dom";

export default function ChatPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
      <h2 className="text-xl font-medium text-foreground">Chat</h2>
      <p className="mt-2 text-sm">Your conversations will appear here.</p>
      <Outlet />
    </div>
  );
}
