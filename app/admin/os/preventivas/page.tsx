import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ListChecks,
  Save,
  ShieldAlert,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";

export default async function PreventivasPage() {
  const setores = await prisma.setor.findMany({
    where: {
      ativo: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10">
              <CalendarClock className="text-cyan-300" size={32} />
            </div>

            <div>
              <span className="text-sm font-black uppercase tracking-widest text-cyan-400">
                Preventivas
              </span>

              <h1 className="text-4xl font-black">
                OS Preventiva
              </h1>

              <p className="mt-1 text-slate-400">
                Agende manutenções preventivas automáticas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/os/preventivas/lista"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-6 font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
            >
              <ListChecks size={18} />
              Ver preventivas
            </Link>

            <Link
              href="/admin"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 font-black text-slate-950 transition hover:scale-[1.02]"
            >
              <ArrowLeft size={18} />
              Voltar
            </Link>
          </div>
        </div>

        <form
          action="/api/admin/os/preventivas"
          method="POST"
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Título
              </label>

              <input
                type="text"
                name="titulo"
                required
                placeholder="Ex: Troca de rolamento"
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Setor
              </label>

              <select
                name="setorId"
                required
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
              >
                <option value="">
                  Selecione o setor
                </option>

                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Descrição
              </label>

              <textarea
                name="descricao"
                required
                rows={5}
                placeholder="Detalhes da preventiva..."
                className="w-full rounded-2xl border border-white/10 bg-[#050816] p-4 text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Prioridade
              </label>

              <select
                name="prioridade"
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                Data agendada
              </label>

              <input
                type="date"
                name="dataAgendada"
                required
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
                <ShieldAlert size={16} />
                Avisar admins antes
              </label>

              <select
                name="diasAntesAviso"
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
              >
                <option value="1">1 dia antes</option>
                <option value="2">2 dias antes</option>
                <option value="3">3 dias antes</option>
                <option value="7">7 dias antes</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-8 font-black text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-300"
          >
            <Save size={18} />
            Salvar preventiva
          </button>
        </form>
      </div>
    </main>
  );
}