"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrencyARS } from "@/lib/cuenta-corriente/utils";
import type { Rendicion } from "@/lib/types/cobranza";

interface ComprobanteRendicionButtonProps {
  rendicion: Rendicion;
}

const LOGO_PATH = "/club-escudo.png";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFechaCierre(rendicion: Rendicion) {
  return rendicion.fechaCierre ?? `${rendicion.fecha}T12:00:00`;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ComprobanteRendicionButton({
  rendicion,
}: ComprobanteRendicionButtonProps) {
  const handleImprimir = () => {
    const ventana = window.open("", "_blank", "width=900,height=1100");
    if (!ventana) return;

    const fechaCierre = getFechaCierre(rendicion);
    const logoUrl = new URL(LOGO_PATH, window.location.origin).toString();
    const observaciones = rendicion.observaciones?.trim();

    ventana.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Comprobante de rendición</title>
          <style>
            @page {
              size: A4;
              margin: 18mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              color: #111;
              background: #fff;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 13px;
              line-height: 1.45;
            }

            .sheet {
              width: 100%;
              min-height: 257mm;
              padding: 0;
            }

            .header {
              text-align: center;
              border-bottom: 2px solid #111;
              padding-bottom: 18px;
              margin-bottom: 28px;
            }

            .logo {
              display: block;
              width: 96px;
              height: 96px;
              object-fit: contain;
              margin: 0 auto 10px;
              filter: grayscale(100%);
            }

            .club {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 0.08em;
              margin: 0;
            }

            .city {
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.18em;
              margin: 2px 0 18px;
            }

            .title {
              display: inline-block;
              border: 1px solid #111;
              padding: 8px 18px;
              font-size: 15px;
              font-weight: 800;
              letter-spacing: 0.1em;
            }

            .section {
              margin-top: 22px;
            }

            .section-title {
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              border-bottom: 1px solid #111;
              padding-bottom: 6px;
              margin-bottom: 12px;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px 28px;
            }

            .field {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              border-bottom: 1px dotted #aaa;
              padding: 6px 0;
            }

            .label {
              color: #444;
              font-weight: 600;
            }

            .value {
              font-weight: 700;
              text-align: right;
            }

            .summary {
              border: 2px solid #111;
              padding: 18px;
              margin-top: 12px;
            }

            .summary-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              margin-bottom: 14px;
            }

            .summary-row:last-child {
              margin-bottom: 0;
            }

            .total-label {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }

            .total {
              font-size: 30px;
              font-weight: 900;
            }

            .observations {
              min-height: 58px;
              border: 1px solid #111;
              padding: 12px;
              white-space: pre-wrap;
            }

            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 56px;
              margin-top: 82px;
            }

            .signature {
              text-align: center;
              border-top: 1px solid #111;
              padding-top: 10px;
              font-weight: 700;
            }

            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <header class="header">
              <img class="logo" src="${logoUrl}" alt="Escudo Club 9 de Julio Olímpico" />
              <p class="club">CLUB ATLÉTICO 9 DE JULIO OLÍMPICO</p>
              <p class="city">FREYRE</p>
              <div class="title">COMPROBANTE DE RENDICIÓN</div>
            </header>

            <section class="section">
              <div class="section-title">Datos de la rendición</div>
              <div class="grid">
                <div class="field">
                  <span class="label">Fecha de rendición</span>
                  <span class="value">${formatFecha(fechaCierre)}</span>
                </div>
                <div class="field">
                  <span class="label">Hora de rendición</span>
                  <span class="value">${formatHora(fechaCierre)}</span>
                </div>
                <div class="field">
                  <span class="label">Cobrador</span>
                  <span class="value">${escapeHtml(rendicion.cobradorNombre)}</span>
                </div>
              </div>
            </section>

            <section class="section">
              <div class="section-title">Resumen</div>
              <div class="summary">
                <div class="summary-row">
                  <span class="label">Cantidad de cobros</span>
                  <span class="value">${rendicion.cantidadPagos}</span>
                </div>
                <div class="summary-row">
                  <span class="total-label">Total rendido</span>
                  <span class="total">${formatCurrencyARS(rendicion.totalRendido)}</span>
                </div>
              </div>
            </section>

            ${
              observaciones
                ? `<section class="section">
                    <div class="section-title">Observaciones</div>
                    <div class="observations">${escapeHtml(observaciones)}</div>
                  </section>`
                : ""
            }

            <section class="signatures">
              <div class="signature">Firma Cobrador</div>
              <div class="signature">Firma Tesorería</div>
            </section>
          </main>

          <script>
            const logo = document.querySelector(".logo");
            const imprimir = () => {
              window.focus();
              window.print();
            };

            if (logo && !logo.complete) {
              logo.addEventListener("load", imprimir, { once: true });
              logo.addEventListener("error", imprimir, { once: true });
            } else {
              setTimeout(imprimir, 150);
            }
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  return (
    <Button size="sm" variant="outline" className="gap-2" onClick={handleImprimir}>
      <Printer className="h-4 w-4" />
      Imprimir comprobante
    </Button>
  );
}
