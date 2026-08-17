import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export function DeleteButton({ action }: { action: () => void }) {
  return (
    <ConfirmSubmitButton
      action={action}
      confirmMessage="Tem certeza que deseja excluir esta obra? Esta ação não pode ser desfeita."
      className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
    >
      Excluir obra
    </ConfirmSubmitButton>
  );
}
