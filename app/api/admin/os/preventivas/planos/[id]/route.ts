import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/src/lib/prisma";
import { authOptions } from "@/src/lib/auth";

const FREQUENCIAS_VALIDAS = [
  "SEMANAL",
  "QUINZENAL",
  "MENSAL",
  "BIMESTRAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
  "PERSONALIZADA",
];

const PRIORIDADES_VALIDAS = [
  "BAIXA",
  "MEDIA",
  "ALTA",
  "URGENTE",
];

function criarDataUTC(valor: string) {
  return new Date(
    `${valor}T00:00:00.000Z`
  );
}

function adicionarDias(
  data: Date,
  dias: number
) {
  const nova = new Date(data);

  nova.setUTCDate(
    nova.getUTCDate() + dias
  );

  return nova;
}

function adicionarMesesMantendoDia(
  data: Date,
  quantidadeMeses: number
) {
  const ano =
    data.getUTCFullYear();

  const mes =
    data.getUTCMonth();

  const dia =
    data.getUTCDate();

  const primeiroDiaDestino =
    new Date(
      Date.UTC(
        ano,
        mes + quantidadeMeses,
        1
      )
    );

  const ultimoDiaDestino =
    new Date(
      Date.UTC(
        primeiroDiaDestino.getUTCFullYear(),
        primeiroDiaDestino.getUTCMonth() + 1,
        0
      )
    ).getUTCDate();

  return new Date(
    Date.UTC(
      primeiroDiaDestino.getUTCFullYear(),
      primeiroDiaDestino.getUTCMonth(),
      Math.min(
        dia,
        ultimoDiaDestino
      )
    )
  );
}

function calcularProximaData(
  atual: Date,
  frequencia: string,
  intervaloPersonalizadoDias:
    | number
    | null
) {
  switch (frequencia) {
    case "SEMANAL":
      return adicionarDias(
        atual,
        7
      );

    case "QUINZENAL":
      return adicionarDias(
        atual,
        15
      );

    case "MENSAL":
      return adicionarMesesMantendoDia(
        atual,
        1
      );

    case "BIMESTRAL":
      return adicionarMesesMantendoDia(
        atual,
        2
      );

    case "TRIMESTRAL":
      return adicionarMesesMantendoDia(
        atual,
        3
      );

    case "SEMESTRAL":
      return adicionarMesesMantendoDia(
        atual,
        6
      );

    case "ANUAL":
      return adicionarMesesMantendoDia(
        atual,
        12
      );

    case "PERSONALIZADA":
      return adicionarDias(
        atual,
        intervaloPersonalizadoDias ??
          1
      );

    default:
      return adicionarMesesMantendoDia(
        atual,
        1
      );
  }
}

function gerarDatasExecucao({
  dataInicio,
  dataFim,
  frequencia,
  intervaloPersonalizadoDias,
}: {
  dataInicio: Date;

  dataFim:
    | Date
    | null;

  frequencia: string;

  intervaloPersonalizadoDias:
    | number
    | null;
}) {
  const datas: Date[] = [];

  const limiteAutomatico =
    adicionarMesesMantendoDia(
      dataInicio,
      12
    );

  const limite =
    dataFim &&
    dataFim < limiteAutomatico
      ? dataFim
      : limiteAutomatico;

  let atual =
    new Date(dataInicio);

  let contador = 0;

  while (
    atual <= limite &&
    contador < 100
  ) {
    datas.push(
      new Date(atual)
    );

    atual =
      calcularProximaData(
        atual,
        frequencia,
        intervaloPersonalizadoDias
      );

    contador++;
  }

  return datas;
}

function calcularStatusInicial(
  data: Date
) {
  const agora =
    new Date();

  const hoje =
    new Date(
      Date.UTC(
        agora.getUTCFullYear(),
        agora.getUTCMonth(),
        agora.getUTCDate()
      )
    );

  if (data <= hoje) {
    return "PENDENTE";
  }

  return "PROGRAMADA";
}

async function verificarUsuario() {
  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      email:
        session.user.email,
    },

    select: {
      id: true,
      ativo: true,
      perfil: true,
    },
  });
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const usuario =
      await verificarUsuario();

    if (
      !usuario ||
      !usuario.ativo
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      usuario.perfil !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente administradores podem excluir planos preventivos.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await params;

    const plano =
      await prisma.planoPreventivo.findUnique(
        {
          where: {
            id,
          },

          select: {
            id: true,
            titulo: true,

            _count: {
              select: {
                execucoes:
                  true,
              },
            },
          },
        }
      );

    if (!plano) {
      return NextResponse.json(
        {
          error:
            "Plano preventivo não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.planoPreventivo.delete(
      {
        where: {
          id,
        },
      }
    );

    return NextResponse.json({
      success: true,

      message:
        "Plano preventivo excluído com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao excluir plano preventivo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao excluir plano preventivo.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const usuario =
      await verificarUsuario();

    if (
      !usuario ||
      !usuario.ativo
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      usuario.perfil !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente administradores podem editar planos preventivos.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await params;

    const formData =
      await req.formData();

    const titulo =
      String(
        formData.get(
          "titulo"
        ) ?? ""
      ).trim();

    const descricao =
      String(
        formData.get(
          "descricao"
        ) ?? ""
      ).trim();

    const setorId =
      String(
        formData.get(
          "setorId"
        ) ?? ""
      ).trim();

    const maquinaId =
      String(
        formData.get(
          "maquinaId"
        ) ?? ""
      ).trim();

    const prioridade =
      String(
        formData.get(
          "prioridade"
        ) ?? "MEDIA"
      ).trim();

    const frequencia =
      String(
        formData.get(
          "frequencia"
        ) ?? "MENSAL"
      ).trim();

    const dataInicioTexto =
      String(
        formData.get(
          "dataInicio"
        ) ?? ""
      ).trim();

    const dataFimTexto =
      String(
        formData.get(
          "dataFim"
        ) ?? ""
      ).trim();

    const diasAntesAviso =
      Number(
        formData.get(
          "diasAntesAviso"
        ) ?? 1
      );

    const duracaoHoras =
      Number(
        formData.get(
          "duracaoEstimadaHoras"
        ) ?? 0
      );

    const duracaoMinutos =
      Number(
        formData.get(
          "duracaoEstimadaMinutosAdicionais"
        ) ?? 0
      );

    const duracaoEstimadaMinutos =
      duracaoHoras * 60 +
      duracaoMinutos;

    const intervaloTexto =
      String(
        formData.get(
          "intervaloPersonalizadoDias"
        ) ?? ""
      ).trim();

    const intervaloPersonalizadoDias =
      intervaloTexto
        ? Number(
            intervaloTexto
          )
        : null;

    const gerarAutomaticamente =
      formData.get(
        "gerarAutomaticamente"
      ) === "on";

    const ativo =
      formData.get(
        "ativo"
      ) === "on";

    const responsavelIds =
      Array.from(
        new Set(
          formData
            .getAll(
              "responsavelIds"
            )
            .map(
              (item) =>
                String(
                  item
                ).trim()
            )
            .filter(
              Boolean
            )
        )
      );

    if (
      !titulo ||
      !descricao ||
      !setorId ||
      !dataInicioTexto
    ) {
      return NextResponse.json(
        {
          error:
            "Preencha todos os campos obrigatórios.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !PRIORIDADES_VALIDAS.includes(
        prioridade
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Prioridade inválida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !FREQUENCIAS_VALIDAS.includes(
        frequencia
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Periodicidade inválida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      duracaoEstimadaMinutos <=
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Informe uma duração estimada válida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      frequencia ===
        "PERSONALIZADA" &&
      (
        !intervaloPersonalizadoDias ||
        intervaloPersonalizadoDias <
          1
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o intervalo personalizado em dias.",
        },
        {
          status: 400,
        }
      );
    }

    const planoAtual =
      await prisma.planoPreventivo.findUnique(
        {
          where: {
            id,
          },

          select: {
            id: true,
          },
        }
      );

    if (!planoAtual) {
      return NextResponse.json(
        {
          error:
            "Plano preventivo não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const setor =
      await prisma.setor.findFirst({
        where: {
          id: setorId,
          ativo: true,
        },

        select: {
          id: true,
          empresaId: true,
        },
      });

    if (!setor) {
      return NextResponse.json(
        {
          error:
            "Setor inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (maquinaId) {
      const maquina =
        await prisma.maquina.findFirst(
          {
            where: {
              id:
                maquinaId,

              setorId,

              ativo: true,
            },

            select: {
              id: true,
            },
          }
        );

      if (!maquina) {
        return NextResponse.json(
          {
            error:
              "Máquina inválida para o setor selecionado.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const dataInicio =
      criarDataUTC(
        dataInicioTexto
      );

    const dataFim =
      dataFimTexto
        ? criarDataUTC(
            dataFimTexto
          )
        : null;

    if (
      dataFim &&
      dataFim < dataInicio
    ) {
      return NextResponse.json(
        {
          error:
            "A data final não pode ser anterior à primeira execução.",
        },
        {
          status: 400,
        }
      );
    }

    const novasDatas =
      gerarDatasExecucao({
        dataInicio,
        dataFim,
        frequencia,
        intervaloPersonalizadoDias,
      });

    await prisma.$transaction(
      async (tx) => {
        /*
         * Apagamos somente execuções que
         * ainda não viraram histórico.
         *
         * CONCLUIDA
         * NAO_REALIZADA
         * CANCELADA
         * EM_EXECUCAO
         *
         * são preservadas.
         */
        await tx.execucaoPreventiva.deleteMany(
          {
            where: {
              planoId: id,

              status: {
                in: [
                  "PROGRAMADA",
                  "PENDENTE",
                ],
              },
            },
          }
        );

        await tx.responsavelPlanoPreventivo.deleteMany(
          {
            where: {
              planoId: id,
            },
          }
        );

        await tx.planoPreventivo.update(
          {
            where: {
              id,
            },

            data: {
              titulo,

              descricao,

              prioridade:
                prioridade as any,

              empresaId:
                setor.empresaId ??
                null,

              setorId,

              maquinaId:
                maquinaId ||
                null,

              frequencia:
                frequencia as any,

              intervaloPersonalizadoDias:
                frequencia ===
                "PERSONALIZADA"
                  ? intervaloPersonalizadoDias
                  : null,

              dataInicio,

              dataFim,

              proximaExecucao:
                novasDatas[0],

              diasAntesAviso,

              duracaoEstimadaMinutos,

              gerarAutomaticamente,

              ativo,

              ultimaGeracaoEm:
                new Date(),

              responsaveis:
                responsavelIds.length >
                0
                  ? {
                      create:
                        responsavelIds.map(
                          (
                            userId
                          ) => ({
                            userId,
                          })
                        ),
                    }
                  : undefined,

              execucoes: {
                create:
                  novasDatas.map(
                    (
                      dataProgramada
                    ) => ({
                      dataProgramada,

                      status:
                        calcularStatusInicial(
                          dataProgramada
                        ) as any,

                      duracaoEstimadaMinutos,

                      responsaveis:
                        responsavelIds.length >
                        0
                          ? {
                              create:
                                responsavelIds.map(
                                  (
                                    userId
                                  ) => ({
                                    userId,
                                  })
                                ),
                            }
                          : undefined,
                    })
                  ),
              },
            },
          }
        );
      }
    );

    return NextResponse.json({
      success: true,

      message:
        "Plano preventivo atualizado com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao editar plano preventivo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao editar plano preventivo.",
      },
      {
        status: 500,
      }
    );
  }
}