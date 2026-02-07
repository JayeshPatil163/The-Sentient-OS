import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AlgorithmSelectorProps {
  selectedAlgorithms: string[];
  timeQuantum: number;
  onAlgorithmChange: (algorithm: string[]) => void;
  onTimeQuantumChange: (quantum: number) => void;
}

export const AlgorithmSelector = ({
  selectedAlgorithms,
  timeQuantum,
  onAlgorithmChange,
  onTimeQuantumChange,
}: AlgorithmSelectorProps) => {

  const toggleAlgorithm = (algorithm: string) => {
    if (selectedAlgorithms.includes(algorithm)) {
      if (selectedAlgorithms.length === 1) {
        toast.error("Please select at least one algorithm");
        return;
      }
      onAlgorithmChange(selectedAlgorithms.filter((a) => a !== algorithm));
    } else {
      onAlgorithmChange([...selectedAlgorithms, algorithm]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-3">Select Scheduling Algorithm</h3>
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox value="ADRR" id="adrr" checked={selectedAlgorithms.includes("ADRR")} onCheckedChange={() => toggleAlgorithm("ADRR")} />
            <Label htmlFor="adrr" className="cursor-pointer flex-1 font-medium">
              ADRR (AI-Powered)
            </Label>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox value="RR" id="rr" checked={selectedAlgorithms.includes("RR")} onCheckedChange={() => toggleAlgorithm("RR")} />
              <Label htmlFor="rr" className="cursor-pointer flex-1 font-medium">
                Traditional Round Robin
              </Label>
            </div>
            {selectedAlgorithms.includes("RR") && (
              <div className="ml-9 pl-3 border-l-2 border-primary/30">
                <Label htmlFor="quantum" className="text-sm text-muted-foreground">
                  Time Quantum
                </Label>
                <Input
                  id="quantum"
                  type="number"
                  value={timeQuantum}
                  onChange={(e) => onTimeQuantumChange(parseInt(e.target.value))}
                  className="mt-1.5 max-w-[200px]"
                  min="1"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox value="SJF" id="sjf" checked={selectedAlgorithms.includes("SJF")} onCheckedChange={() => toggleAlgorithm("SJF")} />
            <Label htmlFor="sjf" className="cursor-pointer flex-1 font-medium">
              Shortest Job First (SJF)
            </Label>
          </div>
      </div>
    </div>
  );
};
