import { ClipboardList } from "lucide-react";
import { Outlet } from "react-router-dom";

export default function MeetingNotesPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <ClipboardList className="mb-4 h-12 w-12 opacity-20" />
      <h2 className="text-xl font-medium text-foreground">Meeting Notes</h2>
      <p className="mt-2 text-sm">Your meeting notes and transcriptions will appear here.</p>
      <Outlet />
    </div>
  );
}
