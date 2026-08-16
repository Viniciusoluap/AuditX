import type { obras } from "@/db/schema";
import { MoneyInput } from "@/components/money-input";

type Obra = typeof obras.$inferSelect;

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  step,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  step?: string;
  required?: boolean;
}) {
  const isMoney = type === "number" && step === "0.01";
  const inputClassName = "mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-slate-500">
        {label}
      </label>
      {isMoney ? (
        <MoneyInput id={name} name={name} defaultValue={defaultValue} className={inputClassName} />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          step={step}
          required={required}
          defaultValue={defaultValue ?? ""}
          className={inputClassName}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </div>
  );
}

export function ObraForm({
  obra,
  ano,
  action,
}: {
  obra?: Obra;
  ano: number;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="ano" value={ano} />

      <Section title="Identificação">
        <Field label="Cliente" name="cliente" defaultValue={obra?.cliente} required />
        <Field label="Status" name="status" defaultValue={obra?.status} />
        <Field label="Empreiteiro" name="empreiteiro" defaultValue={obra?.empreiteiro} />
        <Field label="Cidade e UF" name="cidadeUf" defaultValue={obra?.cidadeUf} />
      </Section>

      <Section title="Financiamento / Venda">
        <Field label="VGV" name="vgv" type="number" step="0.01" defaultValue={obra?.vgv} />
        <Field label="Vlr Financiado" name="vlrFinanciado" type="number" step="0.01" defaultValue={obra?.vlrFinanciado} />
        <Field label="FGTS" name="fgts" type="number" step="0.01" defaultValue={obra?.fgts} />
        <Field label="Subsídio" name="subsidio" type="number" step="0.01" defaultValue={obra?.subsidio} />
        <Field label="Entrada" name="entrada" type="number" step="0.01" defaultValue={obra?.entrada} />
        <Field label="Vlr já pago da Entrada" name="vlrPagoEntrada" type="number" step="0.01" defaultValue={obra?.vlrPagoEntrada} />
        <Field label="Vlr a Receber da Entrada" name="vlrReceberEntrada" type="number" step="0.01" defaultValue={obra?.vlrReceberEntrada} />
      </Section>

      <Section title="Repasse CEF">
        <Field label="% PLS CEF" name="pctPlsCef" type="number" step="0.000001" defaultValue={obra?.pctPlsCef} />
        <Field label="% Real Recebida" name="pctRealRecebida" type="number" step="0.000001" defaultValue={obra?.pctRealRecebida} />
        <Field label="Vlr Recebido CEF" name="vlrRecebidoCef" type="number" step="0.01" defaultValue={obra?.vlrRecebidoCef} />
        <Field label="Vlr Gasto Obra" name="vlrGastoObra" type="number" step="0.01" defaultValue={obra?.vlrGastoObra} />
        <Field label="Vlr a Receber CEF" name="vlrReceberCef" type="number" step="0.01" defaultValue={obra?.vlrReceberCef} />
      </Section>

      <Section title="Custos">
        <Field label="Custo do Lote" name="custoLote" type="number" step="0.01" defaultValue={obra?.custoLote} />
        <Field label="Corretor (comissão)" name="vlrComissaoCorretor" type="number" step="0.01" defaultValue={obra?.vlrComissaoCorretor} />
        <Field label="Corretor já Recebeu" name="corretorJaRecebeu" type="number" step="0.01" defaultValue={obra?.corretorJaRecebeu} />
        <Field label="Custo de Obra" name="custoObra" type="number" step="0.01" defaultValue={obra?.custoObra} />
        <Field label="Vlr Disponível" name="vlrDisponivel" type="number" step="0.01" defaultValue={obra?.vlrDisponivel} />
        <Field label="Vlr P/ Terminar a Obra" name="vlrTerminarObra" type="number" step="0.01" defaultValue={obra?.vlrTerminarObra} />
      </Section>

      <Section title="Prazos">
        <Field label="Prazo de Início" name="prazoInicio" type="date" defaultValue={obra?.prazoInicio} />
        <Field label="Prazo de Término" name="prazoTermino" type="date" defaultValue={obra?.prazoTermino} />
      </Section>

      <Section title="Lucro">
        <Field label="Lucro Estimado" name="lucroEstimado" type="number" step="0.01" defaultValue={obra?.lucroEstimado} />
        <Field label="Lucro Investidor" name="lucroInvestidor" type="number" step="0.01" defaultValue={obra?.lucroInvestidor} />
        {ano === 2026 ? (
          <Field label="Lucro Cliente" name="lucroCliente" type="number" step="0.01" defaultValue={obra?.lucroCliente} />
        ) : null}
        <Field label="Lucro Prospecta" name="lucroProspecta" type="number" step="0.01" defaultValue={obra?.lucroProspecta} />
      </Section>

      <Section title="Pró-soluto / Parcelamento">
        <Field label="Pro Soluto" name="proSoluto" type="number" step="0.01" defaultValue={obra?.proSoluto} />
        <Field label="Taxa" name="taxa" type="number" step="0.0001" defaultValue={obra?.taxa} />
        <Field label="Qtd Parcelas" name="qtdParcelas" type="number" step="1" defaultValue={obra?.qtdParcelas} />
        <Field label="Vlr Parcela" name="vlrParcela" type="number" step="0.01" defaultValue={obra?.vlrParcela} />
        <Field label="Valor Final" name="valorFinal" type="number" step="0.01" defaultValue={obra?.valorFinal} />
        <Field label="Lucro Total" name="lucroTotal" type="number" step="0.01" defaultValue={obra?.lucroTotal} />
      </Section>

      <Section title="Observações">
        <div className="col-span-full">
          <label htmlFor="observacoes" className="block text-xs font-medium text-slate-500">
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={obra?.observacoes ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </Section>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Salvar obra
        </button>
      </div>
    </form>
  );
}
