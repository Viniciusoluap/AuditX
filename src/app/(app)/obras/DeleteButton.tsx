"use client";

export function DeleteButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Tem certeza que deseja excluir esta obra? Esta ação não pode ser desfeita.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
        Excluir obra
      </button>
    </form>
  );
}
