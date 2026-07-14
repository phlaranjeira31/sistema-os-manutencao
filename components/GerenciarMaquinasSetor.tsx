"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  Cpu,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

type Maquina = {
  id: string;
  nome: string;
  ativo: boolean;
};

type Props = {
  setorId: string;
  setorNome: string;
  maquinas: Maquina[];
};

export default function GerenciarMaquinasSetor({
  setorId,
  setorNome,
  maquinas,
}: Props) {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function adicionarMaquina() {
    const nomeLimpo = nome.trim();

    if (!nomeLimpo) {
      setErro("Informe o nome da máquina.");
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/maquinas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeLimpo,
          setorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao cadastrar máquina.");
      }

      setNome("");
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar máquina."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#050816] p-4 sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <Cpu size={19} />
        </div>

        <div className="min-w-0">
          <h4 className="text-base font-black text-white">
            Máquinas e equipamentos
          </h4>

          <p className="break-words text-sm text-slate-400">
            Equipamentos vinculados ao setor {setorNome}.
          </p>
        </div>
      </div>

      {erro && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
          {erro}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionarMaquina();
            }
          }}
          placeholder="Ex: Dosador de sal, Esteira, Boleadora..."
          className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080d1f] px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        />

        <button
          type="button"
          onClick={adicionarMaquina}
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={17} />
          {loading ? "Adicionando..." : "Adicionar"}
        </button>
      </div>

      <div className="mt-5">
        {maquinas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center text-sm text-slate-400">
            Nenhuma máquina cadastrada neste setor.
          </div>
        ) : (
          <div className="grid gap-3">
            {maquinas.map((maquina) => (
              <MaquinaItem key={maquina.id} maquina={maquina} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MaquinaItem({ maquina }: { maquina: Maquina }) {
  const router = useRouter();

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(maquina.nome);
  const [loading, setLoading] = useState(false);

  async function salvar() {
    const nomeLimpo = nome.trim();

    if (!nomeLimpo) {
      alert("Informe o nome da máquina.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/admin/maquinas/${maquina.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeLimpo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao editar máquina.");
      }

      setEditando(false);
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Erro ao editar máquina."
      );
    } finally {
      setLoading(false);
    }
  }

  async function alterarStatus() {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin/maquinas/${maquina.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ativo: !maquina.ativo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Erro ao alterar status da máquina."
        );
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao alterar status da máquina."
      );
    } finally {
      setLoading(false);
    }
  }

  async function excluir() {
    const confirmou = confirm(
      `Deseja excluir a máquina "${maquina.nome}"?`
    );

    if (!confirmou) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/admin/maquinas/${maquina.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao excluir máquina.");
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Erro ao excluir máquina."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-3">
      {editando ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={salvar}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-black text-slate-950 disabled:opacity-60"
          >
            <Save size={16} />
            Salvar
          </button>

          <button
            type="button"
            onClick={() => {
              setNome(maquina.nome);
              setEditando(false);
            }}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white disabled:opacity-60"
          >
            <X size={16} />
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                maquina.ativo
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-red-500/10 text-red-300"
              }`}
            >
              <Cpu size={17} />
            </div>

            <div className="min-w-0">
              <p className="break-words text-sm font-black text-white">
                {maquina.nome}
              </p>

              <p
                className={`text-xs font-bold ${
                  maquina.ativo
                    ? "text-emerald-300"
                    : "text-red-300"
                }`}
              >
                {maquina.ativo ? "Ativa" : "Inativa"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Link
              href={`/admin/maquinas/${maquina.id}`}
              title="Abrir dashboard da máquina"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
            >
              <BarChart3 size={15} />
              <span>Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={() => setEditando(true)}
              disabled={loading}
              title="Editar máquina"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-60"
            >
              <Pencil size={15} />
              <span className="hidden lg:inline">Editar</span>
            </button>

            <button
              type="button"
              onClick={alterarStatus}
              disabled={loading}
              title={maquina.ativo ? "Desativar máquina" : "Ativar máquina"}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold disabled:opacity-60 ${
                maquina.ativo
                  ? "border-orange-400/20 bg-orange-500/10 text-orange-300"
                  : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {maquina.ativo ? <X size={15} /> : <Check size={15} />}

              <span className="hidden lg:inline">
                {maquina.ativo ? "Desativar" : "Ativar"}
              </span>
            </button>

            <button
              type="button"
              onClick={excluir}
              disabled={loading}
              title="Excluir máquina"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-bold text-red-300 hover:bg-red-500 hover:text-white disabled:opacity-60"
            >
              <Trash2 size={15} />
              <span className="hidden lg:inline">Excluir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}