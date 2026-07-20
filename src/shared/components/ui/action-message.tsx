"use client";

import type * as React from "react";

// types
import type { ActionState } from "@/shared/types/action-state";

export function ActionMessage({ state }: { state: ActionState }): React.ReactElement | null {
    if (!state.message) {
        return null;
    }

    return (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"} role="status">
            {state.message}
        </p>
    );
}
