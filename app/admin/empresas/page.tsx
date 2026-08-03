import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Factory,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

const ORDEM_EMPRESAS: Record<string, number> = {
  SEQ: 1,
  SHA: 2,
  OCO: 3,
};

export default async function EmpresasPage() {
  const empresasEncontradas = await prisma.empresa.findMany({
    where: {
      sigla: {
        in: ["SEQ", "SHA", "OCO"],
      },
    },
    select: {
      id: true,
      nome: true,
      sigla: true,
      ativo: true,
      cor: true,
      _count: {
        select: {
          setores: true,
          ordens: true,
        },
      },
    },
  });

  const empresas = empresasEncontradas.sort(
    (a, b) =>
      (ORDEM_EMPRESAS[a.sigla] ?? 99) -
      (ORDEM_EMPRESAS[b.sigla] ?? 99)
  );

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Building2 size={27} />
            </div>

            <div>
              <p className="text-sm font-bold text-cyan-300">
                Gestão corporativa
              </p>

              <h1 className="text-3xl font-black md:text-4xl">
                Empresas do grupo
              </h1>

              <p className="text-slate-400">
                Selecione uma empresa para acessar seu dashboard.
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
        </header>

        {empresas.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/20 bg-white/[0.03] p-10 text-center">
            <Building2
              size={38}
              className="mx-auto mb-4 text-slate-500"
            />

            <h2 className="text-xl font-black">
              Empresas não encontradas
            </h2>

            <p className="mt-2 text-slate-400">
              As empresas do grupo ainda não estão disponíveis neste banco.
            </p>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-3">
            {empresas.map((empresa) => {
              const cor = empresa.cor || "#22D3EE";

              return (
                <article
                  key={empresa.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-[#080d1f] shadow-2xl transition hover:-translate-y-1 hover:border-cyan-400/40"
                >
                  <div
                    className="h-2"
                    style={{
                      backgroundColor: cor,
                    }}
                  />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                        style={{
                          borderColor: `${cor}55`,
                          backgroundColor: `${cor}15`,
                          color: cor,
                        }}
                      >
                        <Factory size={27} />
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                          empresa.ativo
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-red-500/15 text-red-300"
                        }`}
                      >
                        <CheckCircle2 size={13} />

                        {empresa.ativo ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    <div className="mt-6">
                      <p
                        className="text-sm font-black"
                        style={{
                          color: cor,
                        }}
                      >
                        {empresa.sigla}
                      </p>

                      <h2 className="mt-1 text-3xl font-black">
                        {empresa.nome}
                      </h2>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Building2 size={16} />

                          <p className="text-xs font-bold uppercase">
                            Setores
                          </p>
                        </div>

                        <p className="mt-2 text-2xl font-black">
                          {empresa._count.setores}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <ClipboardList size={16} />

                          <p className="text-xs font-bold uppercase">
                            Ordens
                          </p>
                        </div>

                        <p className="mt-2 text-2xl font-black">
                          {empresa._count.ordens}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/admin/empresas/${empresa.sigla.toLowerCase()}`}
                      className="mt-6 inline-flex w-full items-center justify-between rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                    >
                      Acessar empresa
                      <ChevronRight
                        size={19}
                        className="transition group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}