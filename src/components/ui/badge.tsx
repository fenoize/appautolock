import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive-soft text-destructive hover:bg-destructive/15",
        outline: "border-border text-foreground bg-transparent",
        success: "bg-success-soft text-success hover:bg-success/15",
        warning: "bg-warning-soft text-[hsl(35_80%_30%)] hover:bg-warning/20",
        info: "bg-info-soft text-info hover:bg-info/15",
        neutral: "bg-neutral-soft text-muted-foreground hover:bg-muted",
        purple: "bg-purple-soft text-purple-600 hover:bg-purple-100",
        soft: "bg-muted text-muted-foreground hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
