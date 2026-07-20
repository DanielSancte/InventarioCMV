import * as React from "react";

// utils
import { cn } from "@/shared/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
    size?: "sm" | "md";
}

export function Button({
    className,
    variant = "default",
    size = "md",
    ...props
}: ButtonProps): React.ReactElement {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
                size === "sm" ? "h-8 px-3" : "h-10 px-4",
                variant === "default" && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                variant === "secondary" && "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80",
                variant === "ghost" && "border-transparent bg-transparent hover:bg-accent",
                variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
                variant === "outline" && "border-input bg-background hover:bg-accent",
                className
            )}
            {...props}
        />
    );
}
