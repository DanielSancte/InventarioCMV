import * as React from "react";

// utils
import { cn } from "@/shared/utils/cn";

export function Card({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
    return <div className={cn("rounded-md border bg-card text-card-foreground", className)} {...props} />;
}

export function CardHeader({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
    return <div className={cn("border-b px-5 py-4", className)} {...props} />;
}

export function CardTitle({
    className,
    ...props
}: React.HTMLAttributes<HTMLHeadingElement>): React.ReactElement {
    return <h2 className={cn("text-base font-semibold", className)} {...props} />;
}

export function CardContent({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
    return <div className={cn("p-5", className)} {...props} />;
}
