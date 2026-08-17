import { memo } from "react";

interface Props {
  points: number[];
  width?: number;
  height?: number;
  up: boolean;
}

/** 60px inline sparkline (last ~30 ticks), green/red by day direction. */
function SparklineInner({ points, width = 60, height = 20, up }: Props) {
  const color = up ? "#00E68C" : "#FF4D5E";
  let path = "";
  if (points.length >= 2) {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const step = width / (points.length - 1);
    path = points
      .map((p, i) => {
        const x = i * step;
        const y = height - 2 - ((p - min) / span) * (height - 4);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  } else {
    const y = height / 2;
    path = `M0,${y} L${width},${y}`;
  }
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={points.length >= 2 ? 1 : 0.35}
      />
    </svg>
  );
}

const Sparkline = memo(SparklineInner);
export default Sparkline;
