import { notFound } from "next/navigation";
import { getObraById } from "@/lib/queries";
import { PageHeader, Card } from "@/components/ui";
import { ObraForm } from "../ObraForm";
import { DeleteButton } from "../DeleteButton";
import { deleteObra, updateObra } from "../actions";

export default async function ObraDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const obraId = Number(id);
  const obra = await getObraById(obraId);

  if (!obra) notFound();

  const boundUpdate = updateObra.bind(null, obraId);
  const boundDelete = deleteObra.bind(null, obraId);

  return (
    <div>
      <PageHeader
        title={obra.cliente}
        description={`Obra ${obra.ano} • ${obra.cidadeUf || "cidade não informada"}`}
        action={<DeleteButton action={boundDelete} />}
      />
      <Card>
        <ObraForm obra={obra} ano={obra.ano} action={boundUpdate} />
      </Card>
    </div>
  );
}
