import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-xl flex flex-col items-center justify-center text-center py-20">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Construction className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <span className="mt-4 text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-2 py-0.5">
        {phase}
      </span>
    </div>
  );
}
