"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Pencil, Eye, MoreHorizontal } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchSocios } from "@/lib/socios/api";
import { fetchSaldosPorMiembros } from "@/lib/cuenta-corriente/api";
import { formatCurrencyARS } from "@/lib/cuenta-corriente/utils";
import type { SaldoCuenta } from "@/lib/types/cuenta-corriente";
import {
  memberTypes,
  memberStatuses,
  type Member,
} from "@/lib/types/socios";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [saldos, setSaldos] = useState<Record<string, SaldoCuenta>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchSocios();
        const saldosMap = await fetchSaldosPorMiembros(data);
        if (!cancelled) {
          setMembers(data);
          setSaldos(saldosMap);
        }
      } catch {
        if (!cancelled) {
          setError("No se pudieron cargar los socios. Intentá nuevamente.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        searchQuery === "" ||
        member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.memberNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.dni.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;

      const matchesType =
        typeFilter === "all" || member.memberType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [members, searchQuery, statusFilter, typeFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMemberTypeLabel = (type: Member["memberType"]) => {
    const found = memberTypes.find((t) => t.value === type);
    return found?.label ?? type;
  };

  const renderTableBody = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 9 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow>
          <TableCell
            colSpan={9}
            className="h-24 text-center text-destructive"
          >
            {error}
          </TableCell>
        </TableRow>
      );
    }

    if (filteredMembers.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={9}
            className="h-24 text-center text-muted-foreground"
          >
            No se encontraron socios.
          </TableCell>
        </TableRow>
      );
    }

    return filteredMembers.map((member) => (
      <TableRow key={member.id}>
        <TableCell className="font-medium text-primary">
          {member.memberNumber}
        </TableCell>
        <TableCell className="font-medium">
          {member.firstName} {member.lastName}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {member.dni}
        </TableCell>
        <TableCell>
          <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            {getMemberTypeLabel(member.memberType)}
          </span>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {member.familyGroup ?? "—"}
        </TableCell>
        <TableCell>
          <StatusBadge status={member.status} />
        </TableCell>
        <TableCell className="text-right">
          {(() => {
            const saldo = saldos[member.id] ?? { monto: 0, tipo: "al_dia" as const };
            if (saldo.tipo === "debe") {
              return (
                <span className="font-medium text-status-overdue-foreground">
                  {formatCurrencyARS(saldo.monto)}
                </span>
              );
            }
            if (saldo.tipo === "a_favor") {
              return (
                <span className="text-primary">
                  +{formatCurrencyARS(saldo.monto)}
                </span>
              );
            }
            return <span className="text-muted-foreground">Al día</span>;
          })()}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {formatDate(member.registrationDate)}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/members/${member.id}`} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Ver Detalles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/members/${member.id}/edit`} className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar Socio
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <DashboardLayout
      title="Socios"
      subtitle="Gestiona los socios de tu club"
      allowedRoles={["ADMINISTRADOR"]}
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:max-w-sm sm:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar socios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                {memberStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Tipos</SelectItem>
                {memberTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Member Button */}
          <Link href="/members/new" className="w-full sm:w-auto">
            <Button className="w-full gap-2 sm:w-auto">
              <Plus className="h-4 w-4" />
              Nuevo Socio
            </Button>
          </Link>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>N° Socio</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Grupo Familiar</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Deuda Actual</TableHead>
                <TableHead>Fecha Alta</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderTableBody()}</TableBody>
          </Table>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          {loading
            ? "Cargando socios..."
            : `Mostrando ${filteredMembers.length} de ${members.length} socios`}
        </div>
      </div>
    </DashboardLayout>
  );
}
