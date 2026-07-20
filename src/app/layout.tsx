import type { Metadata } from "next";
import { Toaster } from "sonner";
import type * as React from "react";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
    title: "Inventario APS",
    description: "Gestion local de stock, entradas, salidas y reportes"
};

export default function RootLayout({ children }: { children: ReactNode }): React.ReactElement {
    return (
        <html lang="es">
            <body>
                {children}
                <Toaster richColors position="top-right" />
            </body>
        </html>
    );
}
