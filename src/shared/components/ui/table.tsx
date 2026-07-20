import * as React from "react";

// utils
import { cn } from "@/shared/utils/cn";

export function Table({
    className,
    ...props
}: React.TableHTMLAttributes<HTMLTableElement>): React.ReactElement {
    return <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
}

export function Th({
    className,
    ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
    return (
        <th
            className={cn("border-b bg-muted/60 px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground", className)}
            {...props}
        />
    );
}

export function Td({
    className,
    ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
    return <td className={cn("border-b px-3 py-2 align-middle", className)} {...props} />;
}
