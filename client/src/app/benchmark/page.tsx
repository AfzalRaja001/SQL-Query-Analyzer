import { ComingSoon } from "@/components/layout/coming-soon";

export default function BenchmarkPage() {
  return (
    <ComingSoon
      title="Benchmarking"
      phase="Phase 6"
      description="Run the same query N times, then visualize min/max/avg execution time with Recharts."
    />
  );
}
