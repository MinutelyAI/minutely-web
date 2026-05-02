import { Video } from "lucide-react";

export default function StartMeetingPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <Video className="mb-4 h-12 w-12 opacity-20" />
      <h2 className="text-xl font-medium text-foreground">Start Meeting</h2>
      <p className="mt-2 text-sm">Configure your meeting settings and start a session.</p>
    </div>
  );
}
