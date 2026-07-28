import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

import DashboardRelatorios from "@/components/DashboardRelatorios";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardRelatoriosPage() {
  const [relatoriosEncontrados, colaboradores, setores, maquinas] =
    await Promise.all([
      prisma.ordemServico.findMany({
        where: {
          registroFinal: {
            not: null,
          },
        },

        select: {
          id: true,
          numero: true,
          titulo: true,
          status: true,
          prioridade: true,
          registroFinal: true,
          updatedAt: true,
          dataConclusao: true,

          setor: {
            select: {
              id: true,
              nome: true,
            },
          },

          maquina: {
            select: {
              id: true,
              nome: true,
              setorId: true,
            },
          },

          responsaveis: {
            select: {
              user: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },

        orderBy: {
          updatedAt: "asc",
        },
      }),

      prisma.user.findMany({
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
      }),

      prisma.setor.findMany({
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
      }),

      prisma.maquina.findMany({
        where: {
          ativo: true,
        },

        select: {
          id: true,
          nome: true,
          setorId: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),
    ]);

  const relatorios = relatoriosEncontrados
    .filter((relatorio) => relatorio.registroFinal?.trim())
    .map((relatorio) => ({
      id: relatorio.id,
      numero: relatorio.numero,
      titulo: relatorio.titulo,
      status: relatorio.status,
      prioridade: relatorio.prioridade,
      registroFinal: relatorio.registroFinal ?? "",
      updatedAt: relatorio.updatedAt.toISOString(),
      dataConclusao: relatorio.dataConclusao?.toISOString() ?? null,
      setor: relatorio.setor,
      maquina: relatorio.maquina,

      responsaveis: relatorio.responsaveis.map((responsavel) => ({
        id: responsavel.user.id,
        nome: responsavel.user.nome,
      })),
    }));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-10">
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
              <BarChart3 size={27} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-cyan-300">
                Análise de documentos
              </p>

              <h1 className="break-words text-3xl font-black tracking-tight sm:text-4xl">
                Dashboard de Relatórios
              </h1>

              <p className="mt-1 text-slate-400">
                Indicadores, gráficos e exportações dos relatórios de
                manutenção.
              </p>
            </div>
          </div>

          <Link
            href="/admin/relatorios"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-cyan-50 sm:w-fit"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
        </header>

        <DashboardRelatorios
          relatorios={relatorios}
          colaboradores={colaboradores}
          setores={setores}
          maquinas={maquinas}
          geradoEm={new Date().toISOString()}
        />
      </div>
    </main>
  );
}