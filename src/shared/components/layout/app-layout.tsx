import Link from "next/link";
import { Archive, Boxes, ClipboardList, FileBarChart, Package, Settings } from "lucide-react";
import type * as React from "react";
import type { ReactNode } from "react";

// lib
import { requireSessionUser } from "@/shared/lib/auth";

const navItems = [
    { href: "/", label: "Resumen", icon: Boxes },
    { href: "/stock", label: "Stock", icon: Archive },
    { href: "/productos", label: "Productos", icon: Package },
    { href: "/orden-entrada", label: "Orden entrada", icon: ClipboardList },
    { href: "/orden-salida", label: "Orden salida", icon: ClipboardList },
    { href: "/reporte", label: "Reporte", icon: FileBarChart },
    { href: "/configuraciones", label: "Configuraciones", icon: Settings }
];

export async function AppLayout({ children }: { children: ReactNode }): Promise<React.ReactElement> {
    const user = await requireSessionUser();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:block">
                <div className="border-b px-5 py-4">
                    <p className="text-sm text-muted-foreground">Inventario APS</p>
                    <h1 className="text-lg font-semibold">Valparaiso</h1>
                </div>
                <nav className="space-y-1 p-3">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>
            <div className="lg:pl-64">
                <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">Sesion local</p>
                            <p className="text-sm font-medium">
                                {user.nombre} {user.apPaterno} · {user.rol}
                            </p>
                        </div>
                        <div className="flex gap-2 lg:hidden">
                            {navItems.slice(1, 5).map((item) => (
                                <Link key={item.href} href={item.href} className="rounded-md border px-2 py-1 text-xs">
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </header>
                <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
}
