import * as React from "react";

// utils
import { cn } from "@/shared/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: "default" | "success" | "warning" | "danger" | "muted";
}

export function Badge({ className, tone = "default", ...props }: BadgeProps): React.ReactElement {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium",
                tone === "default" && "border-primary/20 bg-primary/10 text-primary",
                tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
                tone === "danger" && "border-red-200 bg-red-50 text-red-700",
                tone === "muted" && "border-border bg-muted text-muted-foreground",
                className
            )}
            {...props}
        />
    );
}
