export function statusTone(status: string): "default" | "positive" | "negative" | "warning" {
  const s = status.toLowerCase();
  if (s.includes("distrato")) return "negative";
  if (s.includes("vendida") || s.includes("finalizada")) return "positive";
  if (s.includes("andamento")) return "warning";
  if (s.includes("disponível") || s.includes("disponivel")) return "default";
  return "default";
}
