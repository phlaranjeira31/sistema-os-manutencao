import Link from "next/link";

import {
  ArrowLeft,
  CalendarClock,
  History,
  ListChecks,
  Repeat2,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";

import CardPreventiva from "@/components/CardPreventiva";
import CardPlanoPreventivo from "@/components/CardPlanoPreventivo";
import DashboardPreventivas from "@/components/DashboardPreventivas";

export const dynamic =
  "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    mes?: string;
  }>;
};

function obterHojeSaoPaulo() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Sao_Paulo",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const ano =
    partes.find(
      (item) =>
        item.type ===
        "year"
    )?.value;

  const mes =
    partes.find(
      (item) =>
        item.type ===
        "month"
    )?.value;

  const dia =
    partes.find(
      (item) =>
        item.type ===
        "day"
    )?.value;

  return `${ano}-${mes}-${dia}`;
}

function validarMes(
  valor: string | undefined,
  padrao: string
) {
  if (
    !valor ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      valor
    )
  ) {
    return padrao;
  }

  return valor;
}

export default async function ListaPreventivasPage({
  searchParams,
}: PageProps) {
  const params =
    searchParams
      ? await searchParams
      : {};

  const hojeTexto =
    obterHojeSaoPaulo();

  const mesPadrao =
    hojeTexto.slice(
      0,
      7
    );

  const mesAtual =
    validarMes(
      params?.mes,
      mesPadrao
    );

  const [
    anoSelecionado,
    mesSelecionado,
  ] = mesAtual
    .split("-")
    .map(Number);

  const hoje =
    new Date(
      `${hojeTexto}T00:00:00.000Z`
    );

  const inicioMes =
    new Date(
      Date.UTC(
        anoSelecionado,
        mesSelecionado - 1,
        1
      )
    );

  const fimMes =
    new Date(
      Date.UTC(
        anoSelecionado,
        mesSelecionado,
        1
      )
    );

  const fimProximos7 =
    new Date(hoje);

  fimProximos7.setUTCDate(
    fimProximos7.getUTCDate() +
      7
  );

  const [
    planos,
    preventivasAntigas,
    planosAtivos,
    execucoesMes,
    proximas7,
    atrasadas,
    concluidasMes,
  ] = await Promise.all([
    prisma.planoPreventivo.findMany({
      include: {
        empresa: {
          select: {
            nome: true,
            sigla: true,
          },
        },

        setor: true,

        maquina: true,

        criadoPor: {
          select: {
            nome: true,
            email: true,
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

        execucoes: {
          where: {
            status: {
              notIn: [
                "CONCLUIDA",
                "CANCELADA",
                "NAO_REALIZADA",
              ],
            },
          },

          orderBy: {
            dataProgramada:
              "asc",
          },

          take: 12,
        },

        _count: {
          select: {
            execucoes: true,
          },
        },
      },

      orderBy: {
        proximaExecucao:
          "asc",
      },
    }),

    prisma.ordemPreventiva.findMany({
      include: {
        setor: true,

        maquina: true,

        responsaveis: {
          include: {
            user: true,
          },
        },
      },

      orderBy: {
        dataAgendada:
          "asc",
      },
    }),

    prisma.planoPreventivo.count({
      where: {
        ativo: true,
      },
    }),

    prisma.execucaoPreventiva.findMany({
      where: {
        dataProgramada: {
          gte: inicioMes,
          lt: fimMes,
        },
      },

      include: {
        plano: {
          select: {
            id: true,
            titulo: true,
            prioridade: true,
            frequencia: true,

            duracaoEstimadaMinutos:
              true,

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
          },
        },

        responsaveis: {
          include: {
            user: {
              select: {
                nome: true,
              },
            },
          },
        },
      },

      orderBy: {
        dataProgramada:
          "asc",
      },
    }),

    prisma.execucaoPreventiva.findMany({
      where: {
        dataProgramada: {
          gte: hoje,
          lt: fimProximos7,
        },

        status: {
          in: [
            "PROGRAMADA",
            "PENDENTE",
            "EM_EXECUCAO",
          ],
        },
      },

      include: {
        plano: {
          select: {
            id: true,
            titulo: true,
            prioridade: true,
            frequencia: true,

            duracaoEstimadaMinutos:
              true,

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
          },
        },

        responsaveis: {
          include: {
            user: {
              select: {
                nome: true,
              },
            },
          },
        },
      },

      orderBy: {
        dataProgramada:
          "asc",
      },
    }),

    prisma.execucaoPreventiva.count({
      where: {
        dataProgramada: {
          lt: hoje,
        },

        status: {
          in: [
            "PROGRAMADA",
            "PENDENTE",
          ],
        },
      },
    }),

    prisma.execucaoPreventiva.count({
      where: {
        dataProgramada: {
          gte: inicioMes,
          lt: fimMes,
        },

        status:
          "CONCLUIDA",
      },
    }),
  ]);

  const minutosPrevistosMes =
    execucoesMes
      .filter(
        (execucao) =>
          execucao.status !==
          "CANCELADA"
      )
      .reduce(
        (
          total,
          execucao
        ) => {
          const minutos =
            execucao.duracaoEstimadaMinutos ??
            execucao.plano
              .duracaoEstimadaMinutos ??
            0;

          return (
            total +
            minutos
          );
        },
        0
      );

  const horasPrevistasMes =
    Math.round(
      (minutosPrevistosMes /
        60) *
        10
    ) / 10;

  const serializarExecucao =
    (
      execucao: any
    ) => ({
      id: execucao.id,

      dataProgramada:
        execucao.dataProgramada.toISOString(),

      status:
        execucao.status,

      duracaoEstimadaMinutos:
        execucao.duracaoEstimadaMinutos,

      plano: {
        id:
          execucao.plano.id,

        titulo:
          execucao.plano
            .titulo,

        prioridade:
          execucao.plano
            .prioridade,

        frequencia:
          execucao.plano
            .frequencia,

        duracaoEstimadaMinutos:
          execucao.plano
            .duracaoEstimadaMinutos,

        setor: {
          nome:
            execucao.plano
              .setor.nome,
        },

        maquina:
          execucao.plano
            .maquina
            ? {
                nome:
                  execucao
                    .plano
                    .maquina
                    .nome,
              }
            : null,
      },

      responsaveis:
        execucao.responsaveis.map(
          (
            responsavel: any
          ) => ({
            user: {
              nome:
                responsavel
                  .user
                  .nome,
            },
          })
        ),
    });

  const execucoesMesSerializadas =
    execucoesMes.map(
      serializarExecucao
    );

  const proximas7Serializadas =
    proximas7.map(
      serializarExecucao
    );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
              <ListChecks
                size={28}
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-widest text-cyan-400">
                Preventivas
              </p>

              <h1 className="break-words text-3xl font-black md:text-4xl">
                Gestão preventiva
              </h1>

              <p className="mt-1 text-slate-400">
                Planejamento,
                calendário e
                acompanhamento das
                manutenções
                preventivas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/os/preventivas"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-5 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
            >
              <CalendarClock
                size={17}
              />

              Novo plano
            </Link>

            <Link
              href="/admin"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:scale-[1.02]"
            >
              <ArrowLeft
                size={17}
              />

              Voltar
            </Link>
          </div>
        </header>

        <DashboardPreventivas
          mesAtual={
            mesAtual
          }
          hoje={
            hojeTexto
          }
          metricas={{
            planosAtivos,

            proximas7Dias:
              proximas7.length,

            atrasadas,

            concluidasMes,

            horasPrevistasMes,
          }}
          execucoesMes={
            execucoesMesSerializadas
          }
          proximas7={
            proximas7Serializadas
          }
        />

        <section className="border-t border-white/10 pt-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
              <Repeat2
                size={19}
              />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">
                Planos preventivos
              </h2>

              <p className="text-sm text-slate-400">
                Programações recorrentes gerenciadas automaticamente.
              </p>
            </div>
          </div>

          {planos.length ===
          0 ? (
            <div className="rounded-3xl border border-dashed border-cyan-400/20 bg-cyan-500/[0.03] p-8 text-center">
              <p className="font-black text-white">
                Nenhum plano preventivo criado ainda.
              </p>

              <p className="mt-2 text-sm text-slate-400">
                As preventivas anteriores continuam disponíveis abaixo.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {planos.map(
                (
                  plano: any
                ) => (
                  <CardPlanoPreventivo
                    key={
                      plano.id
                    }
                    plano={
                      plano
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {preventivasAntigas.length >
          0 && (
          <section className="border-t border-white/10 pt-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300">
                <History
                  size={19}
                />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">
                  Preventivas anteriores
                </h2>

                <p className="text-sm text-slate-400">
                  Todos os registros do sistema anterior foram preservados.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {preventivasAntigas.map(
                (
                  preventiva: any
                ) => (
                  <CardPreventiva
                    key={
                      preventiva.id
                    }
                    preventiva={
                      preventiva
                    }
                  />
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}