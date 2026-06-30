/**
 * CategoryBadge.tsx — Reusable badge for displaying process category labels.
 *
 * Category mapping:
 *   0 → Short   (green)
 *   1 → Medium  (amber/yellow)
 *   2 → Long    (red)
 */

interface CategoryBadgeProps {
  category: number;
  label: string;
  showDot?: boolean;
}

const CATEGORY_STYLES: Record<number, { bg: string; text: string; dot: string }> = {
  0: {
    bg: "bg-emerald-500/15 border border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  1: {
    bg: "bg-amber-500/15 border border-amber-500/30",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  2: {
    bg: "bg-red-500/15 border border-red-500/30",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

export const CategoryBadge = ({
  category,
  label,
  showDot = true,
}: CategoryBadgeProps) => {
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES[1];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      )}
      {label}
    </span>
  );
};
