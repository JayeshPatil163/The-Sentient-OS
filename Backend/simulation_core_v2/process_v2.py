CATEGORY_LABELS = { 0: "Short", 1: "Medium", 2: "Long" }

CATEGORY_BURST_MAP = { 0: 10, 1: 50, 2: 150 }


class ProcessV2:
    def __init__(self, pid: int, arrival_time: int, category: int):
        self.pid = pid
        self.arrival_time = arrival_time
        self.category: int = category
        self.category_label: str = CATEGORY_LABELS.get(category, "Unknown")
        self.burst_time: int = CATEGORY_BURST_MAP.get(category, 50)
        self.remaining_time: int = self.burst_time
        self.start_time: int = -1
        self.completion_time: int = -1
        self.waiting_time: int = 0
        self.turnaround_time: int = 0
        self.execution_segment: list = []

    def __repr__(self):
        return f"ProcessV2(pid={self.pid}, category={self.category_label}, burst={self.burst_time}, arrival={self.arrival_time})"
