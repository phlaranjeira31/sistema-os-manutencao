"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  id?: string;
};

export default function PerfilPage() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      router.push("/login");
      return;
    }

    const usuario: Usuario = JSON.parse(user);

    if (!usuario.id) {
      router.push("/admin");
      return;
    }

    router.replace(`/admin/colaboradores/${usuario.id}/editar`);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
      <p className="text-sm font-semibold text-slate-400">
        Carregando seu perfil...
      </p>
    </main>
  );
}