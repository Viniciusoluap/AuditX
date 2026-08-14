import { PageHeader, Card } from "@/components/ui";
import { ObraForm } from "../ObraForm";
import { createObra } from "../actions";

export default async function NovaObraPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano: anoParam } = await searchParams;
  const ano = anoParam === "2026" ? 2026 : 2025;

  return (
    <div>
      <PageHeader title="Nova obra" description={`Cadastrar uma nova obra no ano ${ano}.`} />
      <Card>
        <ObraForm ano={ano} action={createObra} />
      </Card>
    </div>
  );
}
