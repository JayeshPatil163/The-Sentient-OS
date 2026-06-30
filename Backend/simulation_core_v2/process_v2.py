"""
process_v2.py — Extended Process model for category-aware scheduling.

The new ML model (cpu_scheduler_full_pipeline.joblib) classifies each process
into one of three burst-time categories:
    0 → Short
    1 → Medium
    2 → Long

This Process class carries the raw category label alongside the mapped
representative burst time so schedulers can use either value.
"""

CATEGORY_LABELS = {
    0: "Short",
    1: "Medium",
    2: "Long",
}

# Representative burst times (ms) for each category.
# These values are used when the scheduler needs a concrete numeric burst time.
CATEGORY_BURST_MAP = {
    0: 10,    # Short
    1: 50,    # Medium
    2: 150,   # Long
}


class ProcessV2:
    def __init__(self, pid: int, arrival_time: int, category: int):
        """
        Args:
            pid:          Process identifier.
            arrival_time: Time (ms) at which the process arrives.
            category:     ML-predicted category — 0 (Short), 1 (Medium), 2 (Long).
        """
        self.pid = pid
        self.arrival_time = arrival_time

        # Category info from the ML model
        self.category: int = category
        self.category_label: str = CATEGORY_LABELS.get(category, "Unknown")

        # Map category → representative burst time for the schedulers
        self.burst_time: int = CATEGORY_BURST_MAP.get(category, 50)
        self.remaining_time: int = self.burst_time

        # Scheduling bookkeeping
        self.start_time: int = -1
        self.completion_time: int = -1
        self.waiting_time: int = 0
        self.turnaround_time: int = 0
        self.execution_segment: list = []

    def __repr__(self):
        return (
            f"ProcessV2(pid={self.pid}, category={self.category_label}, "
            f"burst={self.burst_time}, arrival={self.arrival_time})"
        )
