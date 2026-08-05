"use client";

import { Pencil, Save, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Colaborador = {
  id: string;
  nome: string;
  email: string;
};

type ResponsavelAtual = {
  id: string;
  nome: string;
};

export default function AtribuirOSForm({
  osId,
  colaboradores,
  responsaveisAtuais = [],
}: {
  osId: string;
  colaboradores: Colaborador[];
  responsaveisAtuais?: ResponsavelAtual[];
}) {
  const router = useRouter();

  const [montado, setMontado] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const possuiResponsavel = responsaveisAtuais.length > 0;

  const responsaveisTexto = responsaveisAtuais
    .map((responsavel) => responsavel.nome)
    .join(", ");

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!modalAberto) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function fecharComEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        setModalAberto(false);
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, [modalAberto, loading]);

  function abrirModal() {
    setUserId("");
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (loading) return;

    setModalAberto(false);
    setUserId("");
    setErro("");
  }

  async function atribuir(substituirResponsaveis = false) {
    if (!userId) {
      const mensagem = "Selecione um colaborador.";

      if (substituirResponsaveis) {
        setErro(mensagem);
      } else {
        alert(mensagem);
      }

      return;
    }

    setLoading(true);
    setErro("");

    try {
      const res = await fetch(`/api/admin/os/${osId}/atribuir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          substituirResponsaveis,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const mensagem = data?.error || "Erro ao atribuir OS.";

        if (substituirResponsaveis) {
          setErro(mensagem);
        } else {
          alert(mensagem);
        }

        return;
      }

      setModalAberto(false);
      setUserId("");
      router.refresh();
    } catch {
      const mensagem =
        "Não foi possível alterar a atribuição. Tente novamente.";

      if (substituirResponsaveis) {
        setErro(mensagem);
      } else {
        alert(mensagem);
      }
    } finally {
      setLoading(false);
    }
  }

  const modal =
    montado && modalAberto
      ? createPortal(
          <div className="fixed inset-0 z-[2147483647] flex items-end justify-center p-3 sm:items-center sm:p-5">
            <button
              type="button"
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={fecharModal}
              aria-label="Fechar alteração de responsável"
            />

            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby={`titulo-alterar-${osId}`}
              className="relative z-[1] w-full max-w-md overflow-hidden rounded-3xl border border-cyan-400/20 bg-[#050816] text-white shadow-[0_28px_100px_rgba(0,0,0,0.8)]"
            >
              <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    Ordem de serviço
                  </p>

                  <h2
                    id={`titulo-alterar-${osId}`}
                    className="mt-1 text-xl font-black"
                  >
                    Alterar responsável
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={loading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                  aria-label="Fechar"
                >
                  <X size={19} />
                </button>
              </header>

              <div className="space-y-4 p-5">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-300">
                    Responsável atual
                  </p>

                  <p className="mt-1 break-words text-sm font-bold text-slate-200">
                    {responsaveisTexto}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor={`novo-responsavel-${osId}`}
                    className="mb-2 block text-sm font-bold text-slate-300"
                  >
                    Novo responsável
                  </label>

                  <div className="relative">
                    <select
                      id={`novo-responsavel-${osId}`}
                      value={userId}
                      onChange={(event) => {
                        setUserId(event.target.value);
                        setErro("");
                      }}
                      disabled={loading}
                      className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#020617] px-4 pr-10 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 disabled:opacity-60"
                    >
                      <option value="">
                        Selecione um colaborador
                      </option>

                      {colaboradores.map((colaborador) => (
                        <option
                          key={colaborador.id}
                          value={colaborador.id}
                        >
                          {colaborador.nome}
                        </option>
                      ))}
                    </select>

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      ▼
                    </span>
                  </div>
                </div>

                {erro && (
                  <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200">
                    {erro}
                  </p>
                )}
              </div>

              <footer className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => atribuir(true)}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {loading ? "Salvando..." : "Salvar alteração"}
                </button>
              </footer>
            </section>
          </div>,
          document.body
        )
      : null;

  if (possuiResponsavel) {
    return (
      <>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <p className="min-w-0 flex-1 truncate text-sm font-black text-emerald-300">
            OS atribuída
            <span className="font-semibold text-slate-300">
              {" "}• {responsaveisTexto}
            </span>
          </p>

          <button
            type="button"
            onClick={abrirModal}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 text-xs font-black text-emerald-200 transition hover:bg-emerald-400/20"
          >
            <Pencil size={14} />
            Alterar
          </button>
        </div>

        {modal}
      </>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row">
      <div className="relative w-full flex-1">
        <select
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          disabled={loading}
          className="w-full appearance-none rounded-xl border border-white/10 bg-[#050816] px-4 py-2.5 pr-10 text-sm font-semibold text-white outline-none transition focus:border-cyan-400 disabled:opacity-60"
        >
          <option value="" className="bg-[#050816] text-slate-400">
            Enviar para colaborador:
          </option>

          {colaboradores.map((colaborador) => (
            <option
              key={colaborador.id}
              value={colaborador.id}
              className="bg-[#050816] text-white"
            >
              {colaborador.nome}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          ▼
        </div>
      </div>

      <button
        type="button"
        onClick={() => atribuir(false)}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
      >
        <Send size={16} />
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </div>
  );
}