import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ListChecks,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";
import FormularioPreventiva from "@/components/FormularioPreventiva";

export const dynamic = "force-dynamic";

export default async function PreventivasPage() {
  const [setoresBanco, colaboradoresBanco] = await Promise.all([
    prisma.setor.findMany({
      where: {
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        maquinas: {
          where: {
            ativo: true,
          },
          select: {
            id: true,
            nome: true,
          },
          orderBy: {
            nome: "asc",
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    }),

    prisma.user.findMany({
      where: {
        ativo: true,
        perfil: "COLABORADOR",
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
      orderBy: {
        nome: "asc",
      },
    }),
  ]);

  const setores = setoresBanco.map((setor) => ({
    id: setor.id,
    nome: setor.nome,
    maquinas: setor.maquinas.map((maquina) => ({
      id: maquina.id,
      nome: maquina.nome,
    })),
  }));

  const colaboradores = colaboradoresBanco.map((colaborador) => ({
    id: colaborador.id,
    nome: colaborador.nome,
    email: colaborador.email,
  }));

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
                Agende manutenções preventivas.
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

        <FormularioPreventiva
          setores={setores}
          colaboradores={colaboradores}
        />
      </div>
    </main>
  );
}