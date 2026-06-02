// src/components/ui/input-with-icon.tsx
import { Input } from "../../../../components/ui/input";
import { cn } from "../../../../lib/utils";
import type { LucideIcon } from "lucide-react";

interface InputWithIconProps extends React.ComponentProps<typeof Input> {
  icon: LucideIcon;
  iconPosition?: "left" | "right";
}

export function InputWithIcon({
  icon: Icon,
  iconPosition = "left",
  className,
  ...props
}: InputWithIconProps) {
  return (
    <div className="relative">
      <Input
        className={cn(
          "pl-10", // padding kiri untuk icon di kiri
          iconPosition === "right" && "pr-10 pl-3",
          className
        )}
        {...props}
      />
      <Icon
        className={cn(
          "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
          iconPosition === "left" ? "left-3" : "right-3"
        )}
      />
    </div>
  );
}
