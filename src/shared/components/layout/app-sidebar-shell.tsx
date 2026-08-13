"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Archive,
    Boxes,
    Building2,
    ClipboardList,
    FileBarChart,
    HeartPulse,
    Package,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    ShieldCheck,
    Warehouse
} from "lucide-react";
import { useEffect, useState } from "react";
import type * as React from "react";
import type { ReactNode } from "react";

// actions
import { cerrarSesion } from "@/modules/auth/actions/auth.action";

// components
import { BotonCerrarSesion } from "@/modules/auth/components/boton-cerrar-sesion";
import { Button } from "@/shared/components/ui/button";

// utils
import { cn } from "@/shared/utils/cn";

export interface LayoutUserProfile {
    nombreCompleto: string;
    email: string;
    rol: string;
    centro: string;
    bodegas: string[];
}

interface AppSidebarShellProps {
    children: ReactNode;
    profile: LayoutUserProfile;
}

const STORAGE_KEY = "inventario-aps-sidebar-collapsed";

const navItems = [
    { href: "/", label: "Resumen", icon: Boxes },
    { href: "/stock", label: "Stock", icon: Archive },
    { href: "/productos", label: "Productos", icon: Package },
    { href: "/orden-entrada", label: "Orden entrada", icon: ClipboardList },
    { href: "/orden-salida", label: "Orden salida", icon: ClipboardList },
    { href: "/reporte", label: "Reporte", icon: FileBarChart },
    { href: "/configuraciones", label: "Configuraciones", icon: Settings }
] as const;

export function AppSidebarShell({ children, profile }: AppSidebarShellProps): React.ReactElement {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
    }, []);

    function toggleCollapsed(): void {
        setCollapsed((current) => {
            const next = !current;
            window.localStorage.setItem(STORAGE_KEY, String(next));
            return next;
        });
    }

    const isCollapsed = mounted && collapsed;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/60 text-foreground">
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 hidden border-r border-teal-100/80 bg-white/95 shadow-sm shadow-teal-900/5 backdrop-blur lg:flex lg:flex-col",
                    isCollapsed ? "w-20" : "w-72"
                )}
            >
                <div className={cn("border-b border-teal-100 px-4 py-4", isCollapsed && "px-3")}>
                    <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-600 text-white shadow-sm">
                            <HeartPulse className="h-5 w-5" />
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <p className="text-xs font-medium uppercase text-teal-700">Inventario APS</p>
                                <h1 className="truncate text-lg font-semibold text-slate-950">Valparaiso</h1>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-1 flex-col overflow-hidden">
                    <nav className={cn("space-y-1 p-3", isCollapsed && "px-2")}>
                        {navItems.map((item) => {
                            const active = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={isCollapsed ? item.label : undefined}
                                    aria-label={item.label}
                                    className={cn(
                                        "flex h-10 items-center rounded-md text-sm font-medium transition-colors",
                                        isCollapsed ? "justify-center px-2" : "gap-3 px-3",
                                        active
                                            ? "bg-teal-600 text-white shadow-sm shadow-teal-900/10"
                                            : "text-slate-600 hover:bg-teal-50 hover:text-teal-800"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className={cn("mt-auto border-t border-teal-100 p-3", isCollapsed && "px-2")}>
                        <UserProfileCard profile={profile} collapsed={isCollapsed} />
                        <div className="mt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={toggleCollapsed}
                                aria-label={isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
                                title={isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
                                className={cn(
                                    "border-teal-200 bg-white text-teal-800 hover:bg-teal-50",
                                    isCollapsed ? "h-9 w-full px-0" : "flex-1"
                                )}
                            >
                                {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                                {!isCollapsed && <span>Contraer</span>}
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            <div className={cn("transition-[padding] duration-200", isCollapsed ? "lg:pl-20" : "lg:pl-72")}>
                <header className="sticky top-0 z-10 border-b border-teal-100 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase text-teal-700">Gestion de demanda APS</p>
                            <p className="text-sm font-medium text-slate-900">Inventario clinico y bodegas</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-2 lg:hidden">
                                {navItems.slice(1, 5).map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="rounded-md border border-teal-200 bg-white px-2 py-1 text-xs text-teal-800"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                            <form action={cerrarSesion}>
                                <BotonCerrarSesion />
                            </form>
                        </div>
                    </div>
                </header>
                <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
}

function UserProfileCard({
    profile,
    collapsed
}: {
    profile: LayoutUserProfile;
    collapsed: boolean;
}): React.ReactElement {
    if (collapsed) {
        return (
            <div
                className="flex h-11 w-full items-center justify-center rounded-md border border-teal-100 bg-teal-50 text-sm font-semibold text-teal-800"
                title={`${profile.nombreCompleto} - ${profile.rol}`}
                aria-label={`${profile.nombreCompleto} - ${profile.rol}`}
            >
                {obtenerIniciales(profile.nombreCompleto)}
            </div>
        );
    }

    return (
        <section className="rounded-md border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50/70 p-3">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-sm font-semibold text-teal-800 shadow-sm">
                    {obtenerIniciales(profile.nombreCompleto)}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{profile.nombreCompleto}</p>
                    <p className="truncate text-xs text-slate-500">{profile.email}</p>
                </div>
            </div>

            <dl className="mt-4 space-y-3 text-xs">
                <ProfileItem icon={Building2} label="Centro" value={profile.centro} />
                <ProfileItem icon={ShieldCheck} label="Rol" value={profile.rol} />
                <div>
                    <dt className="mb-1 flex items-center gap-2 font-medium text-teal-800">
                        <Warehouse className="h-3.5 w-3.5" />
                        Bodegas asociadas
                    </dt>
                    <dd className="space-y-1 text-slate-700">
                        {profile.bodegas.length > 0 ? (
                            profile.bodegas.map((bodega) => (
                                <span key={bodega} className="block truncate rounded-sm bg-white/80 px-2 py-1">
                                    {bodega}
                                </span>
                            ))
                        ) : (
                            <span className="block rounded-sm bg-white/80 px-2 py-1 text-slate-500">Sin bodegas asociadas</span>
                        )}
                    </dd>
                </div>
            </dl>
        </section>
    );
}

function ProfileItem({
    icon: Icon,
    label,
    value
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}): React.ReactElement {
    return (
        <div>
            <dt className="mb-1 flex items-center gap-2 font-medium text-teal-800">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </dt>
            <dd className="truncate rounded-sm bg-white/80 px-2 py-1 text-slate-700">{value}</dd>
        </div>
    );
}

function obtenerIniciales(nombreCompleto: string): string {
    return nombreCompleto
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase())
        .join("");
}
