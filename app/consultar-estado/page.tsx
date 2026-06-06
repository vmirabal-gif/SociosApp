import { PublicPageLayout } from "@/components/portal/public-page-layout";
import { ConsultaEstadoSection } from "@/components/portal/consulta-estado-section";

export default function ConsultarEstadoPage() {
  return (
    <PublicPageLayout
      title="Portal del Socio"
      subtitle="Consultá tu estado ingresando tu DNI."
    >
      <ConsultaEstadoSection />
    </PublicPageLayout>
  );
}
