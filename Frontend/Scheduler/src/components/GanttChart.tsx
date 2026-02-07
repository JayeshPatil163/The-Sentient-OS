import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GanttDataPoint {
  pid: string;
  start: number;
  end: number;
}

interface GanttChartProps {
  data: GanttDataPoint[];
  algorithm: string;
}

export const GanttChart = ({ data, algorithm }: GanttChartProps) => {
  const chartRef = useRef(null);

  const processIds = [...new Set(data.map((d) => d.pid))].sort();
  
  const colors = [
    "rgba(59, 130, 246, 0.8)",
    "rgba(45, 212, 191, 0.8)",
    "rgba(34, 197, 94, 0.8)",
    "rgba(168, 85, 247, 0.8)",
    "rgba(239, 68, 68, 0.8)",
  ];

  const datasets = processIds.map((pid, index) => ({
    label: pid,
    data: data
      .filter((item) => item.pid === pid)
      .map((item) => ({
        y: item.pid,
        x: [item.start, item.end],
      })),
    backgroundColor: colors[index % colors.length],
    borderColor: colors[index % colors.length].replace("0.8", "1"),
    borderWidth: 1,
    borderRadius: 4,
    borderSkipped: false,
    barPercentage: 0.6,
  }));

  const chartData = {
    labels: processIds,
    datasets: datasets,
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const raw = context.raw.x;
            return `${context.dataset.label}: ${raw[0]} - ${raw[1]} (${raw[1] - raw[0]} ms)`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time (ms)",
          font: { weight: "bold" as const },
        },
        beginAtZero: true,
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "Process",
          font: { weight: "bold" as const },
        },
      },
    },
  };

  return (
    <div className="h-[400px] w-full p-4">
      <h3 className="text-lg font-semibold mb-4">{algorithm}</h3>
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
};