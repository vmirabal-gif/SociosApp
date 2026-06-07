"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Users,
  Receipt,
  PlusCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDashboardCobranza } from "@/lib/cobranza/api";
import { formatCurrencyARS } from "@/lib/cuenta-corriente/utils";
import { mediosPago, type DashboardCobranza } from "@/lib/types/cobranza";
import { useAuth } from "@/components/auth/auth-provider";
import { canSeeGeneralReports } from "@/lib/auth/permissions";
import { canManageCobradores, canRegisterCobranza } from "@/lib/auth/permissions";

export function DashboardCobranzaSection() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardCobranza | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardCobranza()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatFechaHora = (iso: string) =>
    new Date(iso).toLocaleString("es-AR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-muted-foreground">
        No se pudo cargar el dashboard de cobranza.
      </p>
    );
  }

  const stats = [
    {
      title: "Recaudado hoy",
      value: formatCurrencyARS(data.totalHoy),
      sub: `${data.cantidadPagosHoy} pagos`,
      icon: DollarSign,
    },
    {
      title: "Recaudado este mes",
      value: formatCurrencyARS(data.totalMes),
      sub: `${data.cantidadPagosMes} pagos`,
      icon: TrendingUp,
    },
    {
      title: "Cobradores activos",
      value: String(data.porCobrador.length),
      sub: "Con cobranza en el mes",
      icon: Users,
    },
    {
      title: "Últimos pagos",
      value: String(data.ultimosPagos.length),
      sub: "Registros recientes",
      icon: Receipt,
    },
  ];
  const showGeneralReports = canSeeGeneralReports(profile?.rol);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {showGeneralReports
            ? "Resumen de recaudación y cobranza del club."
            : "Resumen de tus cobros registrados."}
        </p>
        <div className="flex flex-wrap gap-2">
          {canRegisterCobranza(profile?.rol) && (
            <Link href="/cobranza/registrar">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Registrar pago
              </Button>
            </Link>
          )}
          {canManageCobradores(profile?.rol) && (
            <Link href="/cobranza/cobradores">
              <Button variant="outline">Cobradores</Button>
            </Link>
          )}
          <Link href="/cobranza/rendiciones">
            <Button variant="outline">Rendiciones</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.title}
              </CardTitle>
              <s.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {showGeneralReports && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recaudación por cobrador</CardTitle>
            </CardHeader>
            <CardContent>
              {data.porCobrador.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos del mes.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cobrador</TableHead>
                      <TableHead className="text-right">Pagos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.porCobrador.map((c) => (
                      <TableRow key={c.cobradorId}>
                        <TableCell>{c.cobradorNombre}</TableCell>
                        <TableCell className="text-right">{c.cantidad}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrencyARS(c.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recaudación por período</CardTitle>
            </CardHeader>
            <CardContent>
              {data.porPeriodo.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos del mes.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Pagos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.porPeriodo.map((p) => (
                      <TableRow key={p.periodo}>
                        <TableCell>{p.periodo}</TableCell>
                        <TableCell className="text-right">{p.cantidad}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrencyARS(p.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimos pagos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {data.ultimosPagos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay pagos registrados por cobradores.
            </p>
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Socio</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Cobrador</TableHead>
                    <TableHead>Medio</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ultimosPagos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">
                        {formatFechaHora(p.fechaHora)}
                      </TableCell>
                      <TableCell>
                        {p.socioApellido}, {p.socioNombre}
                      </TableCell>
                      <TableCell>{p.concepto}</TableCell>
                      <TableCell>{p.cobradorNombre}</TableCell>
                      <TableCell>
                        {mediosPago.find((m) => m.value === p.medioPago)?.label ??
                          p.medioPago}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrencyARS(p.importe)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
