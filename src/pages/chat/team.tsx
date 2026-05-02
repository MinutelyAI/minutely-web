import { Users } from "lucide-react";

export default function TeamChatPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <Users className="mb-4 h-12 w-12 opacity-20" />
      <h2 className="text-xl font-medium text-foreground">Team Chat</h2>
      <p className="mt-2 text-sm">Your team conversations will appear here.</p>
    </div>
  );
}
