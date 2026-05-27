"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export default function BotaoEditarColaborador({
  colaboradorId,
}: {
  colaboradorId: string;
}) {
  const router = useRouter();

  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function confirmar() {
    setErro("");

    if (!senha.trim()) {
      setErro("Informe a senha.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/colaboradores/${colaboradorId}/verificar-senha`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ senha }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Senha inválida.");
      }

      router.push(`/admin/colaboradores/${colaboradorId}/editar`);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao verificar senha."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="
          mt-4
          inline-flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-slate-950
          px-4
          py-3
          text-sm
          font-bold
          text-white
          transition
          hover:bg-slate-800
        "
      >
        <Pencil size={16} />
        Editar colaborador
      </button>

      {aberto && (
        <div
  className="
    fixed
    inset-0
    z-[9999]
    flex
    items-center
    justify-center
    overflow-y-auto
    bg-black/70
    p-4
    backdrop-blur-sm
  "
>
          <div
  className="
    relative
    my-auto
    w-full
    max-w-md
    rounded-2xl
    bg-white
    p-6
    shadow-xl
  "
>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-950 p-2 text-white">
                <Lock size={20} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Confirmar senha
                </h2>

                <p className="text-sm text-slate-500">
                  Digite a senha do colaborador para editar.
                </p>
              </div>
            </div>

            {erro && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {erro}
              </div>
            )}

            <div className="relative mt-5">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha do colaborador"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  px-4
                  py-3
                  pr-14
                  text-slate-900
                  placeholder:text-slate-500
                  focus:outline-none
                  focus:ring-2
                  focus:ring-slate-950
                "
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha(!mostrarSenha)
                }
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-500
                  transition
                  hover:text-slate-800
                "
              >
                {mostrarSenha ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="
                  flex-1
                  rounded-xl
                  border
                  border-slate-300
                  px-4
                  py-3
                  font-bold
                  text-slate-700
                  transition
                  hover:bg-slate-50
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmar}
                disabled={loading}
                className="
                  flex-1
                  rounded-xl
                  bg-slate-950
                  px-4
                  py-3
                  font-bold
                  text-white
                  transition
                  hover:bg-slate-800
                  disabled:opacity-60
                "
              >
                {loading ? "Verificando..." : "Entrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}