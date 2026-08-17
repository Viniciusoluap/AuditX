"use client";

import { ReactNode } from "react";

/**
 * Botão de exclusão com confirmação — mesmo padrão já usado em Obras,
 * generalizado pra Corretores e Lotes (que excluíam direto no clique,
 * sem nenhuma confirmação, lado a lado com o botão "Salvar").
 */
export function ConfirmSubmitButton({
  action,
  confirmMessage,
  children,
  className,
  formClassName,
}: {
  action: () => void;
  confirmMessage: string;
  children: ReactNode;
  className?: string;
  formClassName?: string;
}) {
  return (
    <form
      action={action}
      className={formClassName}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
