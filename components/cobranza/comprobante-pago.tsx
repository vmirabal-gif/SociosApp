"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Printer, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyARS } from "@/lib/cuenta-corriente/utils";
import { mediosPago, type ComprobantePago } from "@/lib/types/cobranza";

interface ComprobantePagoViewProps {
  comprobante: ComprobantePago;
  onNuevoPago?: () => void;
}

export function ComprobantePagoView({
  comprobante,
  onNuevoPago,
}: ComprobantePagoViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleImprimir = () => {
    const content = printRef.current;
    if (!content) return;

    const ventana = window.open("", "_blank", "width=400,height=600");
    if (!ventana) return;

    ventana.document.write(`
      <html><head><title>Comprobante de pago</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; max-width: 360px; margin: 0 auto; }
        h1 { font-size: 16px; margin: 0 0 4px; }
        .muted { color: #666; font-size: 12px; }
        .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
        .total { font-weight: bold; font-size: 16px; border-top: 1px solid #ddd; padding-top: 12px; margin-top: 12px; }
        hr { border: none; border-top: 1px dashed #ccc; margin: 16px 0; }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

  const medioLabel =
    mediosPago.find((m) => m.value === comprobante.medioPago)?.label ??
    comprobante.medioPago;

  const normalizarTelefonoWhatsApp = (telefono: string): string | null => {
    const digits = telefono.replace(/\D/g, "");
    if (!digits) return null;

    if (digits.startsWith("54")) return digits;
    if (digits.startsWith("0")) return `54${digits.slice(1)}`;
    return `54${digits}`;
  };

  const generarMensajeWhatsApp = () => {
    const conceptos = comprobante.items
      .map(
        (item) =>
          `- ${item.concepto} (${item.periodo}): ${formatCurrencyARS(
            item.importe
          )}`
      )
      .join("\n");

    return [
      "Comprobante de pago - Club 9 de Julio Olímpico",
      "",
      `Socio: ${comprobante.socioNombre} ${comprobante.socioApellido}`,
      `DNI: ${comprobante.dni}`,
      `Fecha: ${formatFecha(comprobante.fechaHora)}`,
      `Cobrador: ${comprobante.cobradorNombre} ${comprobante.cobradorApellido}`,
      `Medio de pago: ${medioLabel}`,
      "",
      "Conceptos abonados:",
      conceptos,
      "",
      `Total: ${formatCurrencyARS(comprobante.importeTotal)}`,
      comprobante.observaciones
        ? `Observaciones: ${comprobante.observaciones}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleEnviarWhatsApp = () => {
    const telefono = normalizarTelefonoWhatsApp(comprobante.telefono);

    if (!telefono) {
      toast.error(
        "El socio no tiene teléfono registrado. Completá el teléfono para enviar el comprobante por WhatsApp."
      );
      return;
    }

    const mensaje = encodeURIComponent(generarMensajeWhatsApp());
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div ref={printRef} className="space-y-4">
            <div className="text-center">
              <p className="text-sm font-semibold">Club 9 de Julio Olímpico</p>
              <p className="text-xs text-muted-foreground">Comprobante de pago</p>
            </div>

            <hr className="border-dashed border-border" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Socio</span>
                <span className="font-medium text-right">
                  {comprobante.socioNombre} {comprobante.socioApellido}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">DNI</span>
                <span className="font-medium">{comprobante.dni}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-medium">
                  {formatFecha(comprobante.fechaHora)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Cobrador</span>
                <span className="font-medium text-right">
                  {comprobante.cobradorNombre} {comprobante.cobradorApellido}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Medio de pago</span>
                <span className="font-medium">{medioLabel}</span>
              </div>
            </div>

            <hr className="border-dashed border-border" />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Conceptos abonados
              </p>
              {comprobante.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.concepto}</span>
                  <span className="font-medium">
                    {formatCurrencyARS(item.importe)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrencyARS(comprobante.importeTotal)}</span>
            </div>

            {comprobante.observaciones && (
              <p className="text-xs text-muted-foreground">
                Obs: {comprobante.observaciones}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleImprimir} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir comprobante
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleEnviarWhatsApp}
        >
          <MessageCircle className="h-4 w-4" />
          Enviar por WhatsApp
        </Button>
        {onNuevoPago && (
          <Button variant="secondary" onClick={onNuevoPago}>
            Registrar otro pago
          </Button>
        )}
      </div>
    </div>
  );
}
