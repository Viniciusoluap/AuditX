"use client";

import { useState } from "react";

function parseMoneyInput(raw: string): string {
  const cleaned = raw.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : "0";
}

function formatMoneyDisplay(raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/**
 * Campo de valor monetário: mostra/edita no padrão pt-BR (ex. "7.200,00"),
 * mas envia no submit um número puro (ex. "7200.5") via input hidden — as
 * server actions continuam recebendo o mesmo formato de sempre.
 */
export function MoneyInput({
  name,
  defaultValue,
  className = "",
  formId,
  placeholder,
  id,
}: {
  name: string;
  defaultValue?: string | number | null;
  className?: string;
  formId?: string;
  placeholder?: string;
  id?: string;
}) {
  const hasDefault = defaultValue !== null && defaultValue !== undefined;
  const initialRaw = hasDefault ? String(defaultValue) : "0";
  const [raw, setRaw] = useState(initialRaw);
  const [display, setDisplay] = useState(hasDefault ? formatMoneyDisplay(initialRaw) : "");

  return (
    <>
      <input type="hidden" name={name} value={raw} form={formId} />
      <input
        id={id}
        type="text"
        inputMode="decimal"
        form={formId}
        placeholder={placeholder}
        value={display}
        onChange={(e) => setDisplay(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => {
          const parsed = parseMoneyInput(e.target.value);
          setRaw(parsed);
          setDisplay(e.target.value === "" ? "" : formatMoneyDisplay(parsed));
        }}
        className={className}
      />
    </>
  );
}
