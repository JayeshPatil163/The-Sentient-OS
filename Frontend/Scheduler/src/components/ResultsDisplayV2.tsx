/**
 * ResultsDisplayV2.tsx — Results panel for the v2 classification-based pipeline.
 *
 * Differences from ResultsDisplay.tsx (v1):
 *  - Accepts `SimulationResponseV2` with `category_labels` + `category_names`
 *  - Shows a "Category Breakdown" card with Short / Medium / Long counts
 *  - Shows per-process category badge alongside each Gantt chart
 *  - All styles match the existing design system
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GanttChart } from "./GanttChart";
import { CategoryBadge } from "./CategoryBadge";
import { SimulationResponseV2 } from "@/services/apiServiceV2";
import { BarChart3, Clock, Cpu, Layers } from "lucide-react";

interface ResultsDisplayV2Props {
  metrics: SimulationResponseV2 | null;
}

// Count occurrences of each category in the prediction results
function buildCategoryBreakdown(
  labels: number[],
  names: string[]
): { category: number; label: string; count: number }[] {
  const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  labels.forEach((l) => {
    counts[l] = (counts[l] ?? 0) + 1;
  });
  const seen = new Set<number>();
  const uniqueNames: Record<number, string> = {};
  labels.forEach((l, i) => {
    if (!seen.has(l)) {
      uniqueNames[l] = names[i];
      seen.add(l);
    }
  });

  return [0, 1, 2].map((cat) => ({
    category: cat,
    label: uniqueNames[cat] ?? ["Short", "Medium", "Long"][cat],
    count: counts[cat] ?? 0,
  }));
}

export const ResultsDisplayV2 = ({ metrics }: ResultsDisplayV2Props) => {
  if (!metrics) return null;

  const breakdown = buildCategoryBreakdown(
    metrics.category_labels,
    metrics.category_names
  );

  const total = metrics.category_labels.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ------------------------------------------------------------------ */}
      {/* Category Breakdown Card                                             */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Category Breakdown</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Classification result from{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              cpu_scheduler_full_pipeline
            </code>
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {breakdown.map(({ category, label, count }) => (
              <div
                key={category}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/40 border border-border"
              >
                <CategoryBadge category={category} label={label} />
                <p className="text-3xl font-bold tabular-nums">{count}</p>
                <p className="text-xs text-muted-foreground">
                  {total > 0
                    ? `${Math.round((count / total) * 100)}% of processes`
                    : "—"}
                </p>
              </div>
            ))}
          </div>

          {/* Per-process category list */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Per-process predictions
            </p>
            <div className="flex flex-wrap gap-2">
              {metrics.category_labels.map((cat, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-mono font-medium">P{i + 1}</span>
                  <CategoryBadge category={cat} label={metrics.category_names[i]} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Performance Metrics Card                                            */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics.results.map((result) => (
            <div
              key={result.Algorithm}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/30 border border-border"
            >
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Algorithm
                </p>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm font-semibold text-primary leading-tight">
                    {result.Algorithm}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Avg. Waiting Time
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent shrink-0" />
                  <p className="text-xl font-bold text-accent tabular-nums">
                    {result["Average Waiting Time"]}
                    <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Avg. Turnaround Time
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent shrink-0" />
                  <p className="text-xl font-bold text-accent tabular-nums">
                    {result["Average Turnaround Time"]}
                    <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Gantt Chart Card                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gantt Chart Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.results.map((result) => (
            <GanttChart
              key={result.Algorithm}
              data={result["Gantt Chart"]}
              algorithm={result.Algorithm}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
