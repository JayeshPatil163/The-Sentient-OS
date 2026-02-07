import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GanttChart } from "./GanttChart";

interface GanttDataPoint {
  pid: string;
  start: number;
  end: number;
}

interface results {
  Algorithm: string;
  "Average Waiting Time": number;
  "Average Turnaround Time": number;
  "Gantt Chart": GanttDataPoint[];
}

interface SimulationMetrics {
  "status": "success",
  "results": results[],
  "predictions": number[]
}

interface GanttDataPoint {
  pid: string;
  start: number;
  end: number;
}

interface ResultsDisplayProps {
  metrics: SimulationMetrics | null;
}
export const ResultsDisplay = ({ metrics }: ResultsDisplayProps) => {
  if (!metrics) {
    return null;
  }

  const ganttData = metrics.results.map((result: results) => result["Gantt Chart"]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
            {metrics.results.map((result: results) => (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Algorithm</p>
              <p className="text-xl font-semibold text-primary">{result.Algorithm}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Avg. Waiting Time</p>
              <p className="text-xl font-semibold text-accent">{result["Average Waiting Time"]}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Avg. Turnaround Time</p>
              <p className="text-xl font-semibold text-accent">{result["Average Turnaround Time"]}</p>
            </div>
          </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gantt Chart Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.results.map((result: results) => (
            <GanttChart key={result.Algorithm} data={result["Gantt Chart"]} algorithm={result.Algorithm} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
