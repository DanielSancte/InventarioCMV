"use client";

import type * as React from "react";
import { useId, useState } from "react";
import { X } from "lucide-react";

// components
import { Button } from "@/shared/components/ui/button";

interface SimpleModalProps {
    title: string;
    triggerLabel: string;
    triggerClassName?: string;
    children: React.ReactNode;
}

export function SimpleModal({ title, triggerLabel, triggerClassName, children }: SimpleModalProps): React.ReactElement {
    const [open, setOpen] = useState(false);
    const titleId = useId();

    return (
        <>
            <Button type="button" variant="outline" size="sm" className={triggerClassName} onClick={() => setOpen(true)}>
                {triggerLabel}
            </Button>
            {open ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                >
                    <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-md border bg-background shadow-lg">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h3 id={titleId} className="text-base font-semibold">
                                {title}
                            </h3>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Cerrar modal">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="max-h-[70vh] overflow-auto p-4">{children}</div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
