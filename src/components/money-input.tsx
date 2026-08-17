"use client";

import { useState } from "react";

/**
 * Converte texto digitado em número. Reconhece tanto o formato pt-BR
 * ("1.500,50") quanto alguém digitando com ponto decimal por hábito
 * ("1500.50") — sem isso, "1500.50" virava 150050 (ponto tratado sempre
 * como separador de milhar, removido antes de ler o número).
 */
function parseMoneyInput(raw: string): string {
  let cleaned = raw.trim().replace(/[^\d.,-]/g, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    // pt-BR completo: "1.500,50" -> ponto = milhar, vírgula = decimal
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // só vírgula -> é o separador decimal: "1500,50"
    cleaned = cleaned.replace(",", ".");
  } else if (hasDot) {
    const parts = cleaned.split(".");
    const lastGroup = parts[parts.length - 1];
    // um único ponto seguido de 1-2 dígitos = decimal ("1500.5"); senão,
    // são pontos de milhar sem centavos ("1.500", "1.234.567")
    const isDecimalPoint = parts.length === 2 && lastGroup.length <= 2;
    if (!isDecimalPoint) cleaned = cleaned.replace(/\./g, "");
  }

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
  const [display, setDisplay] = useState(hasDefault ? formatMoneyDisplay(initialRaw) : "");

  // O valor enviado no submit é sempre derivado do que está na tela agora —
  // nada de estado "raw" separado que só atualiza no onBlur. Isso evitava
  // sincronizar: dar Enter no campo (submit antes do blur disparar) mandava
  // o valor anterior (ou 0, ao criar).
  const rawValue = display === "" ? "0" : parseMoneyInput(display);

  return (
    <>
      <input type="hidden" name={name} value={rawValue} form={formId} />
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
          setDisplay(e.target.value === "" ? "" : formatMoneyDisplay(parseMoneyInput(e.target.value)));
        }}
        className={className}
      />
    </>
  );
}
