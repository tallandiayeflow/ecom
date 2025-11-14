import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#2563eb] text-white hover:bg-[#2563eb]/80",
        secondary: "border-transparent bg-[#f3f4f6] text-[#1f2937] hover:bg-[#e5e7eb]",
        success: "border-transparent bg-[#10b981] text-white hover:bg-[#10b981]/80",
        warning: "border-transparent bg-[#f59e0b] text-[#1f2937] hover:bg-[#f59e0b]/80",
        info: "border-transparent bg-[#0ea5e9] text-white hover:bg-[#0ea5e9]/80",
        destructive: "border-transparent bg-[#dc2626] text-white hover:bg-[#b91c1c]",
        outline: "text-[#111827] border-[#d1d5db]",
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

