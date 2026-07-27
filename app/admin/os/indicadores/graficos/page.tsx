import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

import DashboardGraficosOS from "@/components/DashboardGraficosOS";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

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

  const [ordens, setores, colaboradores, maquinas] = await Promise.all([
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

  const dados = ordens.map((os) => ({
    id: os.id,
    numero: os.numero,
    titulo: os.titulo,
    descricao: os.descricao,
    status: os.status,
    prioridade: os.prioridade,
    createdAt: os.createdAt.toISOString(),
    updatedAt: os.updatedAt.toISOString(),
    dataPrevista: os.dataPrevista?.toISOString() ?? null,
    dataConclusao: os.dataConclusao?.toISOString() ?? null,
    setor: os.setor,
    maquina: os.maquina,
    responsaveis: os.responsaveis.map((responsavel) => ({
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
                Análise geral
              </p>

              <h1 className="break-words text-3xl font-black tracking-tight sm:text-4xl">
                Dashboard Gráfico de OS
              </h1>

              <p className="mt-1 break-words text-slate-400">
                Visão interativa dos principais indicadores da manutenção.
              </p>
            </div>
          </div>

          <Link
            href="/admin/os/indicadores"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-cyan-50 sm:w-fit"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>
        </header>

        <DashboardGraficosOS
          ordens={dados}
          setores={setores}
          colaboradores={colaboradores}
          maquinas={maquinas}
          filtrosIniciais={{
            dataInicio: String(params?.dataInicio ?? ""),
            dataFim: String(params?.dataFim ?? ""),
            status: String(params?.status ?? ""),
            colaborador: String(params?.colaborador ?? ""),
            setor: String(params?.setor ?? ""),
            prioridade: String(params?.prioridade ?? ""),
            maquina: String(params?.maquina ?? ""),
          }}
        />
      </div>
    </main>
  );
}