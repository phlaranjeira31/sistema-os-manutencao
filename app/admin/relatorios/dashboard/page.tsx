import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  FileText,
} from "lucide-react";

import DashboardRelatorios from "@/components/DashboardRelatorios";
import { prisma } from "@/src/lib/prisma";
import { obterDataTerminoRelatorio } from "@/src/lib/kpiColaborador";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardRelatoriosPage() {
  const [
    relatoriosEncontrados,
    colaboradores,
    setores,
    maquinas,
  ] = await Promise.all([
    prisma.ordemServico.findMany({
      where: {
        OR: [
          {
            registroFinal: {
              not: null,
            },
          },
          {
            status: "CONCLUIDA",
          },
        ],
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
        numero: "asc",
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

  const relatorios =
    relatoriosEncontrados
      .filter(
        (relatorio) =>
          relatorio.status ===
            "CONCLUIDA" ||
          Boolean(
            relatorio.registroFinal?.trim()
          )
      )
      .map((relatorio) => {
        const temRelatorio =
          Boolean(
            relatorio.registroFinal?.trim()
          );

        const dataRelatorio =
          temRelatorio
            ? obterDataTerminoRelatorio(
                relatorio.registroFinal
              )
            : null;

        return {
          id: relatorio.id,
          numero:
            relatorio.numero,
          titulo:
            relatorio.titulo,
          status:
            relatorio.status,
          prioridade:
            relatorio.prioridade,
          registroFinal:
            relatorio.registroFinal ??
            "",
          temRelatorio,

          /*
           * DATA OFICIAL DO DOCUMENTO
           *
           * A análise temporal usa exclusivamente
           * Data/Hora de término preenchida no relatório.
           * updatedAt permanece apenas como metadado técnico.
           */
          dataRelatorio:
            dataRelatorio?.toISOString() ??
            null,

          updatedAt:
            relatorio.updatedAt.toISOString(),

          dataConclusao:
            relatorio.dataConclusao?.toISOString() ??
            null,

          setor:
            relatorio.setor,

          maquina:
            relatorio.maquina,

          responsaveis:
            relatorio.responsaveis.map(
              (responsavel) => ({
                id:
                  responsavel.user.id,
                nome:
                  responsavel.user.nome,
              })
            ),
        };
      })
      .sort((a, b) => {
        const dataA =
          a.temRelatorio
            ? a.dataRelatorio
            : a.dataConclusao;

        const dataB =
          b.temRelatorio
            ? b.dataRelatorio
            : b.dataConclusao;

        return (
          new Date(
            dataB ?? 0
          ).getTime() -
          new Date(
            dataA ?? 0
          ).getTime()
        );
      });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-5 text-white sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1700px] space-y-5">
        <header className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(120deg,#07101f_0%,#071827_55%,#06101d_100%)] p-5 shadow-[0_18px_55px_rgba(0,0,0,.22)] sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-400/[0.08] blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
                <BarChart3 size={25} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">
                  Inteligência de documentos
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                  Dashboard de Relatórios
                </h1>

                <p className="mt-1 max-w-3xl text-sm text-slate-400">
                  Indicadores calculados pela data real informada no relatório técnico, não pela data em que o documento foi salvo.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/admin/relatorios"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
              >
                <FileText size={17} />
                Documentos
              </Link>

              <Link
                href="/admin"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
              >
                <ArrowLeft size={17} />
                Voltar
              </Link>
            </div>
          </div>
        </header>

        <DashboardRelatorios
          relatorios={relatorios}
          colaboradores={
            colaboradores
          }
          setores={setores}
          maquinas={maquinas}
          geradoEm={
            new Date().toISOString()
          }
        />
      </div>
    </main>
  );
}
