import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ListChecks,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";
import CardPreventiva from "@/components/CardPreventiva";

export default async function ListaPreventivasPage() {
  const preventivas = await prisma.ordemPreventiva.findMany({
    include: {
      setor: true,
    },
    orderBy: {
      dataAgendada: "asc",
    },
  });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-10">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
              <ListChecks size={28} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-widest text-cyan-400">
                Preventivas
              </p>

              <h1 className="break-words text-3xl font-black md:text-4xl">
                Preventivas agendadas
              </h1>

              <p className="mt-1 break-words text-slate-400">
                Consulte todas as OS preventivas cadastradas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/os/preventivas"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-5 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
            >
              <CalendarClock size={17} />
              Nova preventiva
            </Link>

            <Link
              href="/admin/os/preventivas"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:scale-[1.02]"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>
          </div>
        </header>

        {preventivas.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-8 text-center">
            <p className="text-lg font-bold text-white">
              Nenhuma preventiva cadastrada ainda.
            </p>

            <p className="mt-2 text-slate-400">
              Clique em “Nova preventiva” para criar o primeiro agendamento.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {preventivas.map((preventiva) => (
              <CardPreventiva
                key={preventiva.id}
                preventiva={preventiva}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}