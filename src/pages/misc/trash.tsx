import { Trash } from "lucide-react";

export default function TrashPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <Trash className="mb-4 h-12 w-12 opacity-20" />
      <h2 className="text-xl font-medium text-foreground">Trash</h2>
      <p className="mt-2 text-sm">Deleted items will appear here before they are permanently removed.</p>
    </div>
  );
}
