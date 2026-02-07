import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

export interface Process {
  id: string;
  pid: string;
  arrivalTime: number;
  userId: string;
  groupId: string;
  reqMemory: number;
  reqTime: number;
}

interface ProcessTableProps {
  processes: Process[];
  onProcessesChange: (processes: Process[]) => void;
}

export const ProcessTable = ({ processes, onProcessesChange }: ProcessTableProps) => {
  const addProcess = () => {
    const newProcess: Process = {
      id: `proc-${Date.now()}`,
      pid: `P${processes.length + 1}`,
      arrivalTime: 0,
      userId: "U1",
      groupId: "G1",
      reqMemory: 100,
      reqTime: 10,
    };
    onProcessesChange([...processes, newProcess]);
  };

  const removeProcess = (id: string) => {
    onProcessesChange(processes.filter((p) => p.id !== id));
  };

  const updateProcess = (id: string, field: keyof Process, value: string | number) => {
    onProcessesChange(
      processes.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Process ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Arrival Time</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">User ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Group ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Memory (MB)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">CPU Time</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {processes.map((process) => (
              <tr key={process.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <Input
                    value={process.pid}
                    onChange={(e) => updateProcess(process.id, "pid", e.target.value)}
                    className="h-9"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    value={process.arrivalTime}
                    onChange={(e) => updateProcess(process.id, "arrivalTime", parseInt(e.target.value))}
                    className="h-9"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={process.userId}
                    onChange={(e) => updateProcess(process.id, "userId", e.target.value)}
                    className="h-9"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    value={process.groupId}
                    onChange={(e) => updateProcess(process.id, "groupId", e.target.value)}
                    className="h-9"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    value={process.reqMemory}
                    onChange={(e) => updateProcess(process.id, "reqMemory", parseInt(e.target.value))}
                    className="h-9"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    value={process.reqTime}
                    onChange={(e) => updateProcess(process.id, "reqTime", parseInt(e.target.value))}
                    className="h-9"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProcess(process.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={addProcess} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Process
      </Button>
    </div>
  );
};
