"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function ExcluirOSButton({ osId }: { osId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function excluir() {
    const confirmar = confirm(
      "Tem certeza que deseja excluir esta OS? Essa ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    setLoading(true);

    const res = await fetch(`/api/admin/os/${osId}`, {
      method: "DELETE",
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data?.error || "Erro ao excluir OS.");
      return;
    }

    alert("OS excluída com sucesso.");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={excluir}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
    >
      <Trash2 size={17} />
      {loading ? "Excluindo..." : "Excluir"}
    </button>
  );
}