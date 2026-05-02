import { Archive } from "lucide-react";

export default function ArchivePage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <Archive className="mb-4 h-12 w-12 opacity-20" />
      <h2 className="text-xl font-medium text-foreground">Archive</h2>
      <p className="mt-2 text-sm">Your archived meetings and notes will appear here.</p>
    </div>
  );
}
