"use server";

import { prisma } from "@/src/lib/prisma";

type FiltrosPlanoPdf = {
  inicio: string;
  fim: string;
  setorId?: string;
  maquinaId?: string;
};

function validarData(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

export async function buscarProgramacaoPlanoPdfAction(
  filtros: FiltrosPlanoPdf
) {
  if (
    !validarData(filtros.inicio) ||
    !validarData(filtros.fim)
  ) {
    throw new Error(
      "Período inválido para geração do plano."
    );
  }

  const inicio = new Date(
    `${filtros.inicio}T00:00:00.000Z`
  );

  const fimInclusivo = new Date(
    `${filtros.fim}T00:00:00.000Z`
  );

  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fimInclusivo.getTime()) ||
    fimInclusivo < inicio
  ) {
    throw new Error(
      "A data final deve ser igual ou posterior à data inicial."
    );
  }

  const fimExclusivo = new Date(
    fimInclusivo
  );

  fimExclusivo.setUTCDate(
    fimExclusivo.getUTCDate() + 1
  );

  const filtroPlano = {
    ...(filtros.setorId
      ? {
          setorId: filtros.setorId,
        }
      : {}),

    ...(filtros.maquinaId
      ? {
          maquinaId: filtros.maquinaId,
        }
      : {}),
  };

  const [
    execucoes,
    preventivasAntigas,
  ] = await Promise.all([
    prisma.execucaoPreventiva.findMany({
      where: {
        dataProgramada: {
          gte: inicio,
          lt: fimExclusivo,
        },

        status: {
          notIn: [
            "CANCELADA",
            "NAO_REALIZADA",
          ],
        },

        plano: filtroPlano,
      },

      include: {
        plano: {
          select: {
            id: true,
            titulo: true,
            descricao: true,
            prioridade: true,
            frequencia: true,
            duracaoEstimadaMinutos:
              true,

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
        dataProgramada: "asc",
      },
    }),

    prisma.ordemPreventiva.findMany({
      where: {
        dataAgendada: {
          gte: inicio,
          lt: fimExclusivo,
        },

        ...(filtros.setorId
          ? {
              setorId: filtros.setorId,
            }
          : {}),

        ...(filtros.maquinaId
          ? {
              maquinaId:
                filtros.maquinaId,
            }
          : {}),

        status: {
          notIn: [
            "CANCELADA",
            "NAO_REALIZADA",
          ],
        },
      },

      include: {
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
        dataAgendada: "asc",
      },
    }),
  ]);

  const recorrentes =
    execucoes.map((execucao) => {
      const responsaveisExecucao =
        execucao.responsaveis.map(
          (item) => item.user.nome
        );

      const responsaveisPlano =
        execucao.plano.responsaveis.map(
          (item) => item.user.nome
        );

      const responsaveis =
        responsaveisExecucao.length > 0
          ? responsaveisExecucao
          : responsaveisPlano;

      return {
        id: execucao.id,
        origem: "RECORRENTE",
        data:
          execucao.dataProgramada.toISOString(),
        titulo: execucao.plano.titulo,
        descricao:
          execucao.descricaoExecucao ||
          execucao.plano.descricao ||
          "",
        status: execucao.status,
        prioridade:
          execucao.plano.prioridade,
        setor: {
          id: execucao.plano.setor.id,
          nome:
            execucao.plano.setor.nome,
        },
        maquina: execucao.plano.maquina
          ? {
              id:
                execucao.plano.maquina.id,
              nome:
                execucao.plano.maquina
                  .nome,
            }
          : null,
        duracaoEstimadaMinutos:
          execucao.duracaoEstimadaMinutos ??
          execucao.plano
            .duracaoEstimadaMinutos ??
          null,
        responsaveis,
      };
    });

  const antigas =
    preventivasAntigas.map(
      (preventiva) => ({
        id: preventiva.id,
        origem: "LEGADA",
        data:
          preventiva.dataAgendada.toISOString(),
        titulo: preventiva.titulo,
        descricao:
          preventiva.descricao || "",
        status: preventiva.status,
        prioridade:
          preventiva.prioridade,
        setor: {
          id: preventiva.setor.id,
          nome: preventiva.setor.nome,
        },
        maquina: preventiva.maquina
          ? {
              id: preventiva.maquina.id,
              nome:
                preventiva.maquina.nome,
            }
          : null,
        duracaoEstimadaMinutos: null,
        responsaveis:
          preventiva.responsaveis.map(
            (item) => item.user.nome
          ),
      })
    );

  const itens = [
    ...recorrentes,
    ...antigas,
  ].sort(
    (a, b) =>
      new Date(a.data).getTime() -
      new Date(b.data).getTime()
  );

  return {
    inicio: filtros.inicio,
    fim: filtros.fim,
    geradoEm: new Date().toISOString(),
    itens,
  };
}
