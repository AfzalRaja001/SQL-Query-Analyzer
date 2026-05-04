import { ConnectionsList } from "@/components/connections/connections-list";
import { ConnectionDialog } from "@/components/connections/connection-dialog";

export default function ConnectionsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Saved Connections</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Point QueryLab at your own database. Passwords are encrypted at rest.
          </p>
        </div>
        <ConnectionDialog />
      </div>

      <ConnectionsList />
    </div>
  );
}