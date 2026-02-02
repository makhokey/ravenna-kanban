import { cn } from "@repo/ui/lib/utils";
import type { StatusValue } from "./card-schema";

interface StatusIconProps {
  status: StatusValue;
  size?: number;
  className?: string;
}

// Color mapping for each status
const statusColors: Record<StatusValue, string> = {
  backlog: "text-muted-foreground",
  todo: "text-muted-foreground",
  in_progress: "text-yellow-500",
  review: "text-blue-500",
  done: "text-green-500",
};

// Progress percentage for ring fill
const statusProgress: Record<StatusValue, number> = {
  backlog: 0,
  todo: 0,
  in_progress: 50,
  review: 75,
  done: 100,
};

export function StatusIcon({ status, size = 16, className }: StatusIconProps) {
  const center = size / 2;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const colorClass = statusColors[status];

  // Ring progress calculations
  const circumference = 2 * Math.PI * radius;
  const progress = statusProgress[status];
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0", colorClass, className)}
      fill="none"
    >
      {status === "backlog" && (
        // Dashed circle outline
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray="2.5 2"
          strokeLinecap="round"
        />
      )}

      {status === "todo" && (
        // Solid circle outline
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      )}

      {status === "in_progress" && (
        <>
          {/* Track circle (background) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            opacity={0.25}
          />
          {/* Progress ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
          {/* Center dot */}
          <circle cx={center} cy={center} r={2} fill="currentColor" />
        </>
      )}

      {status === "review" && (
        <>
          {/* Track circle (background) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            opacity={0.25}
          />
          {/* Progress ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
          {/* Center dot */}
          <circle cx={center} cy={center} r={2} fill="currentColor" />
        </>
      )}

      {status === "done" && (
        <>
          {/* Filled circle */}
          <circle cx={center} cy={center} r={radius} fill="currentColor" />
          {/* White checkmark */}
          <path
            d={`M ${size * 0.3} ${size * 0.5} L ${size * 0.45} ${size * 0.65} L ${size * 0.7} ${size * 0.35}`}
            stroke="white"
            strokeWidth={strokeWidth + 0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
