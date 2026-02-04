import { cn } from "@repo/ui/lib/utils";
import { getPriorityOption } from "~/lib/card-config";

interface PriorityIconProps {
  priority: string;
  size?: number;
  className?: string;
}

export function PriorityIcon({ priority, size = 14, className }: PriorityIconProps) {
  const Icon = getPriorityOption(priority).icon;

  return (
    <Icon className={cn("shrink-0", className)} style={{ width: size, height: size }} />
  );
}
