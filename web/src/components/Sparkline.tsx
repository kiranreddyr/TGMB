interface SparklineProps {
  values: number[];
  height?: number;
  color?: string;
}

const VIEW_WIDTH = 480;

/** Minimal 48h score sparkline (F3) — no charting library needed for one line. */
export default function Sparkline({ values, height = 70, color = "#ffc94a" }: SparklineProps) {
  if (values.length < 2) return null;

  const max = 100;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * VIEW_WIDTH;
      const y = height - (v / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Faint guides at the 40 and 65 band thresholds, for context.
  const guideAt = (score: number) => height - (score / max) * height;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="48 hour Melt Score forecast"
    >
      <line x1={0} x2={VIEW_WIDTH} y1={guideAt(65)} y2={guideAt(65)} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
      <line x1={0} x2={VIEW_WIDTH} y1={guideAt(40)} y2={guideAt(40)} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
