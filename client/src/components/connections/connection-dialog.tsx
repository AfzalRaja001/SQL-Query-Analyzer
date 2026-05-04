"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { createConnection, type CreateConnectionInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

const DEFAULTS: CreateConnectionInput = {
  name: "",
  host: "localhost",
  port: 5432,
  database: "",
  username: "",
  password: "",
  sslMode: "prefer",
};

export function ConnectionDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateConnectionInput>(DEFAULTS);
  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createConnection,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections"] });
      setOpen(false);
      setForm(DEFAULTS);
      setServerError(null);
    },
    onError: (err: Error) => {
      setServerError(err.message);
    },
  });

  function set(field: keyof CreateConnectionInput, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setServerError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add connection
        </Button>
      } />
      <DialogPopup>
        <DialogTitle>Add database connection</DialogTitle>
        <DialogDescription>Credentials are encrypted at rest with AES-256-GCM.</DialogDescription>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <Field label="Display name">
            <Input
              placeholder="My Postgres DB"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Field label="Host">
                <Input
                  placeholder="localhost"
                  value={form.host}
                  onChange={(e) => set("host", e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field label="Port">
              <Input
                type="number"
                placeholder="5432"
                value={form.port}
                onChange={(e) => set("port", parseInt(e.target.value, 10))}
                min={1}
                max={65535}
                required
              />
            </Field>
          </div>

          <Field label="Database">
            <Input
              placeholder="postgres"
              value={form.database}
              onChange={(e) => set("database", e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Username">
              <Input
                placeholder="postgres"
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="SSL mode">
            <select
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              value={form.sslMode}
              onChange={(e) => set("sslMode", e.target.value)}
            >
              <option value="prefer">prefer</option>
              <option value="require">require</option>
              <option value="disable">disable</option>
            </select>
          </Field>

          {serverError && (
            <p className="text-xs text-destructive rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose render={
              <Button type="button" variant="ghost" size="sm" disabled={mutation.isPending}>
                Cancel
              </Button>
            } />
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin h-3.5 w-3.5" />}
              {mutation.isPending ? "Testing & saving…" : "Save connection"}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}