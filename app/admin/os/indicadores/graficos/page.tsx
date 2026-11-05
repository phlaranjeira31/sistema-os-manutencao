import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  FileText,
} from "lucide-react";

import DashboardGraficosOS from "@/components/DashboardGraficosOS";
import { prisma } from "@/src/lib/prisma";
import {
  obterDataTerminoRelatorio,
} from "@/src/lib/kpiColaborador";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{
    dataInicio?: string;
    dataFim?: string;
    status?: string;
    colaborador?: string;
    setor?: string;
    prioridade?: string;
    maquina?: string;
  }>;
};

export default async function GraficosIndicadoresOSPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const [
    ordens,
    setores,
    colaboradores,
    maquinas,
  ] = await Promise.all([
    prisma.ordemServico.findMany({
      select: {
        id: true,
        numero: true,
        titulo: true,
        descricao: true,
        status: true,
        prioridade: true,
        createdAt: true,
        updatedAt: true,
        dataPrevista: true,
        dataConclusao: true,
        registroFinal: true,

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
        createdAt: "asc",
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

    prisma.user.findMany({
      where: {
        ativo: true,
        perfil: "COLABORADOR",
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

  const dados = ordens.map((os) => {
    const dataConclusaoRelatorio =
      os.status === "CONCLUIDA" &&
      os.registroFinal
        ? obterDataTerminoRelatorio(
            os.registroFinal
          )
        : null;

    return {
      id: os.id,
      numero: os.numero,
      titulo: os.titulo,
      descricao: os.descricao,
      status: os.status,
      prioridade: os.prioridade,
      createdAt:
        os.createdAt.toISOString(),
      updatedAt:
        os.updatedAt.toISOString(),
      dataPrevista:
        os.dataPrevista?.toISOString() ??
        null,
      dataConclusao:
        os.dataConclusao?.toISOString() ??
        null,

      /*
       * Fonte oficial para indicadores temporais.
       *
       * Nunca usamos dataConclusao/updatedAt como fallback
       * para a data real do serviço concluído.
       */
      dataConclusaoRelatorio:
        dataConclusaoRelatorio?.toISOString() ??
        null,

      setor: os.setor,
      maquina: os.maquina,

      responsaveis:
        os.responsaveis.map(
          (responsavel) => ({
            id:
              responsavel.user.id,
            nome:
              responsavel.user.nome,
          })
        ),
    };
  });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-5 text-white sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1700px] space-y-5">
        <header className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(120deg,#07101f_0%,#071827_55%,#06101d_100%)] p-5 shadow-[0_18px_55px_rgba(0,0,0,.22)] sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/[0.08] blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
                <BarChart3 size={26} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">
                  Inteligência da manutenção
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                  Indicadores de Ordens de Serviço
                </h1>

                <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-400">
                  Visão executiva com conclusões e tempos calculados pela data real informada no relatório técnico.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/admin/relatorios"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-5 text-sm font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
              >
                <FileText size={17} />
                Relatórios
              </Link>

              <Link
                href="/admin/os/indicadores"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
              >
                <ArrowLeft size={17} />
                Voltar
              </Link>
            </div>
          </div>
        </header>

        <DashboardGraficosOS
          ordens={dados}
          setores={setores}
          colaboradores={colaboradores}
          maquinas={maquinas}
          filtrosIniciais={{
            dataInicio: String(
              params?.dataInicio ?? ""
            ),
            dataFim: String(
              params?.dataFim ?? ""
            ),
            status: String(
              params?.status ?? ""
            ),
            colaborador: String(
              params?.colaborador ?? ""
            ),
            setor: String(
              params?.setor ?? ""
            ),
            prioridade: String(
              params?.prioridade ?? ""
            ),
            maquina: String(
              params?.maquina ?? ""
            ),
          }}
        />
      </div>
    </main>
  );
}
