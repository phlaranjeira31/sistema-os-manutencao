import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  ClipboardCheck,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";

import ExecucaoPreventivaForm from "@/components/ExecucaoPreventivaForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExecucaoPreventivaPage({
  params,
}: PageProps) {
  const { id } = await params;

  const execucao =
    await prisma.execucaoPreventiva.findUnique({
      where: {
        id,
      },

      include: {
        plano: {
          include: {
            empresa: {
              select: {
                nome: true,
                sigla: true,
              },
            },

            setor: {
              select: {
                nome: true,
              },
            },

            maquina: {
              select: {
                nome: true,
              },
            },

            criadoPor: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },

        responsaveis: {
          include: {
            user: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },

        concluidoPor: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

  if (!execucao) {
    notFound();
  }

  const dados = {
    id: execucao.id,

    status: execucao.status,

    dataProgramada:
      execucao.dataProgramada.toISOString(),

    dataInicio:
      execucao.dataInicio?.toISOString() ?? null,

    dataConclusao:
      execucao.dataConclusao?.toISOString() ?? null,

    duracaoEstimadaMinutos:
      execucao.duracaoEstimadaMinutos,

    duracaoRealMinutos:
      execucao.duracaoRealMinutos,

    descricaoExecucao:
      execucao.descricaoExecucao,

    pecasUtilizadas:
      execucao.pecasUtilizadas,

    observacoes:
      execucao.observacoes,

    checkQuantidadePecas:
      execucao.checkQuantidadePecas,

    checkFerramentasRecolhidas:
      execucao.checkFerramentasRecolhidas,

    checkMaterialRepostoRecolhido:
      execucao.checkMaterialRepostoRecolhido,

    checkLimpezaRealizada:
      execucao.checkLimpezaRealizada,

    checkLimpezaEfetiva:
      execucao.checkLimpezaEfetiva,

    concluidoPor:
      execucao.concluidoPor
        ? {
            nome: execucao.concluidoPor.nome,
            email: execucao.concluidoPor.email,
          }
        : null,

    plano: {
      id: execucao.plano.id,

      titulo: execucao.plano.titulo,

      descricao: execucao.plano.descricao,

      prioridade: execucao.plano.prioridade,

      frequencia: execucao.plano.frequencia,

      duracaoEstimadaMinutos:
        execucao.plano.duracaoEstimadaMinutos,

      empresa:
        execucao.plano.empresa,

      setor:
        execucao.plano.setor,

      maquina:
        execucao.plano.maquina,

      criadoPor:
        execucao.plano.criadoPor,
    },

    responsaveis:
      execucao.responsaveis.map((item) => ({
        user: {
          nome: item.user.nome,
          email: item.user.email,
        },
      })),
  };

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
              <ClipboardCheck size={30} />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-widest text-cyan-400">
                Execução preventiva
              </p>

              <h1 className="text-3xl font-black md:text-4xl">
                {execucao.plano.titulo}
              </h1>

              <p className="mt-1 text-slate-400">
                Registre a execução da manutenção preventiva.
              </p>
            </div>
          </div>

          <Link
            href="/admin/os/preventivas/lista"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-slate-950"
          >
            <ArrowLeft size={17} />

            Voltar
          </Link>
        </header>

        <ExecucaoPreventivaForm execucao={dados} />
      </div>
    </main>
  );
}