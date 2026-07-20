import type * as React from "react";

// actions
import { listarConfiguraciones } from "@/modules/configuraciones/actions/configuraciones.action";

// components
import { BodegaForm, CentroForm, UnidadForm, UsuarioForm } from "@/modules/configuraciones/components/configuracion-forms";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Td, Th, Table } from "@/shared/components/ui/table";
import { AppLayout } from "@/shared/components/layout/app-layout";

export const dynamic = "force-dynamic";

export default async function ConfiguracionesPage(): Promise<React.ReactElement> {
    const data = await listarConfiguraciones();

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Mantenedores iniciales</p>
                    <h2 className="text-2xl font-semibold">Configuraciones</h2>
                </div>
                <section className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Centro</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CentroForm />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Bodega</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BodegaForm centros={data.centros} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Unidad</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <UnidadForm />
                        </CardContent>
                    </Card>
                </section>
                <Card>
                    <CardHeader>
                        <CardTitle>Usuario</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UsuarioForm centros={data.centros} bodegas={data.bodegas} roles={data.roles} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Usuarios registrados</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Nombre</Th>
                                    <Th>Email</Th>
                                    <Th>Rol</Th>
                                    <Th>Centro</Th>
                                    <Th>Bodega</Th>
                                    <Th>Estado</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.usuarios.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <Td>{usuario.nombre} {usuario.apPaterno}</Td>
                                        <Td>{usuario.email}</Td>
                                        <Td>{usuario.rol.descripcion}</Td>
                                        <Td>{usuario.centro.nombre}</Td>
                                        <Td>{usuario.bodega?.nombre ?? "Sin bodega"}</Td>
                                        <Td>
                                            <Badge tone={usuario.estado ? "success" : "muted"}>
                                                {usuario.estado ? "Activo" : "Inactivo"}
                                            </Badge>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
