"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plug, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { listConnections, deleteConnection, testConnection, type Connection } from "@/lib/api";
import { useQueryStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ConnectionsList() {
  const qc = useQueryClient();
  const { activeConnectionId, setActiveConnectionId } = useQueryStore();
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; latencyMs?: number; error?: string }>>({});
  const [testing, setTesting] = useState<string | null>(null);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: listConnections,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConnection,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["connections"] });
      if (activeConnectionId === id) setActiveConnectionId(null);
    },
  });

  async function handleTest(id: string) {
    setTesting(id);
    const result = await testConnection(id);
    setTestResults((prev) => ({ ...prev, [id]: result }));
    setTesting(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <Plug className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No connections yet</p>
        <p className="text-xs text-muted-foreground">Add a connection to start querying your own database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {connections.map((conn) => (
        <ConnectionRow
          key={conn.id}
          conn={conn}
          isActive={activeConnectionId === conn.id}
          testResult={testResults[conn.id]}
          isTesting={testing === conn.id}
          isDeleting={deleteMutation.isPending && deleteMutation.variables === conn.id}
          onActivate={() => setActiveConnectionId(activeConnectionId === conn.id ? null : conn.id)}
          onTest={() => handleTest(conn.id)}
          onDelete={() => deleteMutation.mutate(conn.id)}
        />
      ))}
    </div>
  );
}

function ConnectionRow({
  conn,
  isActive,
  testResult,
  isTesting,
  isDeleting,
  onActivate,
  onTest,
  onDelete,
}: {
  conn: Connection;
  isActive: boolean;
  testResult?: { ok: boolean; latencyMs?: number; error?: string };
  isTesting: boolean;
  isDeleting: boolean;
  onActivate: () => void;
  onTest: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors",
        isActive ? "border-primary/40 bg-primary/5" : "border-border hover:border-border/80"
      )}
    >
      <button
        className="h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer"
        style={{ borderColor: isActive ? "var(--color-primary)" : "var(--color-border)" }}
        onClick={onActivate}
        title={isActive ? "Deactivate" : "Set as active connection"}
      >
        {isActive && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{conn.name}</span>
          {isActive && (
            <Badge variant="success" className="text-[10px] normal-case tracking-normal font-normal py-0">
              active
            </Badge>
          )}
        </div>
        <p className="font-mono text-[11px] text-muted-foreground truncate mt-0.5">
          {conn.username}@{conn.host}:{conn.port}/{conn.database}
        </p>
        {conn.lastUsedAt && (
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground/60 mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            Last used {new Date(conn.lastUsedAt).toLocaleString()}
          </p>
        )}
      </div>

      {testResult && (
        <div className="shrink-0 flex items-center gap-1 text-xs">
          {testResult.ok ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-mono">{testResult.latencyMs}ms</span>
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-destructive max-w-[120px] truncate" title={testResult.error}>
                {testResult.error}
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onTest}
          disabled={isTesting}
          className="h-7 px-2 text-xs"
        >
          {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3" />}
          Test
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}