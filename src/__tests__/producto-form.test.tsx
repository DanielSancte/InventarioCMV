import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// components
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

describe("componentes UI", () => {
    it("renderiza card y badge base", () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Stock</CardTitle>
                </CardHeader>
                <CardContent>
                    <Badge tone="warning">Stock minimo</Badge>
                </CardContent>
            </Card>
        );

        expect(screen.getByText("Stock")).toBeInTheDocument();
        expect(screen.getByText("Stock minimo")).toBeInTheDocument();
    });
});
