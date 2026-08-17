import { z } from "zod";

const moneySchema = z.coerce.number().finite();

/**
 * Converte um valor de FormData num numeric(...) seguro para gravar no banco.
 *
 * Postgres aceita a string literal 'NaN' como valor válido de `numeric` —
 * `Number("qualquer coisa")` vira `NaN`, e `String(NaN)` vira `"NaN"`, que
 * entrava sem erro e contaminava qualquer `SUM()`/agregação futura com esse
 * valor. Esta função nunca deixa passar NaN/Infinity: cai para "0".
 */
export function toMoneyString(value: FormDataEntryValue | null): string {
  if (value === null || value === "") return "0";
  const parsed = moneySchema.safeParse(value);
  return parsed.success ? String(parsed.data) : "0";
}
