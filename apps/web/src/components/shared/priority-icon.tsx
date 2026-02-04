import { cn } from "@repo/ui/lib/utils";
import { getPriorityOption } from "./card-schema";

interface PriorityIconProps {
  priority: string | null;
  size?: number;
  className?: string;
}

export function PriorityIcon({ priority, size = 14, className }: PriorityIconProps) {
  const option = getPriorityOption(priority ?? "no priority");
  const Icon = option.icon;

  return <Icon className={cn("shrink-0", className)} style={{ width: size, height: size }} />;
}
