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

  const diaFinal =
    Math.min(
      dia,
      ultimoDiaDestino
    );

  return new Date(
    Date.UTC(
      primeiroDiaDestino.getUTCFullYear(),
      primeiroDiaDestino.getUTCMonth(),
      diaFinal
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

  const hojeUTC =
    new Date(
      Date.UTC(
        agora.getUTCFullYear(),
        agora.getUTCMonth(),
        agora.getUTCDate()
      )
    );

  if (data <= hojeUTC) {
    return "PENDENTE";
  }

  return "PROGRAMADA";
}

export async function POST(
  req: Request
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (
      !session?.user?.email
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

    const usuarioLogado =
      await prisma.user.findUnique({
        where: {
          email:
            session.user.email,
        },

        select: {
          id: true,
          ativo: true,
        },
      });

    if (
      !usuarioLogado ||
      !usuarioLogado.ativo
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário logado não encontrado ou inativo.",
        },
        {
          status: 401,
        }
      );
    }

    const formData =
      await req.formData();

    const titulo = String(
      formData.get("titulo") ??
        ""
    ).trim();

    const descricao =
      String(
        formData.get(
          "descricao"
        ) ?? ""
      ).trim();

    const setorId = String(
      formData.get("setorId") ??
        ""
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

    const duracaoEstimadaHoras =
      Number(
        formData.get(
          "duracaoEstimadaHoras"
        ) ?? 0
      );

    const duracaoEstimadaMinutosAdicionais =
      Number(
        formData.get(
          "duracaoEstimadaMinutosAdicionais"
        ) ?? 0
      );

    const duracaoEstimadaMinutos =
      duracaoEstimadaHoras *
        60 +
      duracaoEstimadaMinutosAdicionais;

    const intervaloTexto =
      String(
        formData.get(
          "intervaloPersonalizadoDias"
        ) ?? ""
      ).trim();

    const intervaloPersonalizadoDias =
      intervaloTexto !== ""
        ? Number(
            intervaloTexto
          )
        : null;

    const gerarAutomaticamente =
      formData.get(
        "gerarAutomaticamente"
      ) === "on";

    const responsavelIds =
      Array.from(
        new Set(
          formData
            .getAll(
              "responsavelIds"
            )
            .map((valor) =>
              String(
                valor
              ).trim()
            )
            .filter(Boolean)
        )
      );

    if (!titulo) {
      return NextResponse.json(
        {
          error:
            "Título obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (!descricao) {
      return NextResponse.json(
        {
          error:
            "Descrição obrigatória.",
        },
        {
          status: 400,
        }
      );
    }

    if (!setorId) {
      return NextResponse.json(
        {
          error:
            "Setor obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (!dataInicioTexto) {
      return NextResponse.json(
        {
          error:
            "A primeira execução é obrigatória.",
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
      !Number.isInteger(
        duracaoEstimadaHoras
      ) ||
      duracaoEstimadaHoras < 0
    ) {
      return NextResponse.json(
        {
          error:
            "A quantidade de horas da preventiva é inválida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        duracaoEstimadaMinutosAdicionais
      ) ||
      duracaoEstimadaMinutosAdicionais <
        0 ||
      duracaoEstimadaMinutosAdicionais >
        59
    ) {
      return NextResponse.json(
        {
          error:
            "Os minutos devem estar entre 0 e 59.",
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
            "Informe uma duração estimada para a preventiva.",
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
            "Informe o intervalo em dias para a periodicidade personalizada.",
        },
        {
          status: 400,
        }
      );
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
      Number.isNaN(
        dataInicio.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Data inicial inválida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      dataFim &&
      (
        Number.isNaN(
          dataFim.getTime()
        ) ||
        dataFim <
          dataInicio
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A data final deve ser igual ou posterior à primeira execução.",
        },
        {
          status: 400,
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
            "Setor não encontrado ou inativo.",
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
              id: maquinaId,
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
              "A máquina não pertence ao setor ou está inativa.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      responsavelIds.length >
      0
    ) {
      const usuariosValidos =
        await prisma.user.count({
          where: {
            id: {
              in: responsavelIds,
            },

            ativo: true,
          },
        });

      if (
        usuariosValidos !==
        responsavelIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Um ou mais responsáveis são inválidos ou estão inativos.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const datasExecucao =
      gerarDatasExecucao({
        dataInicio,
        dataFim,
        frequencia,
        intervaloPersonalizadoDias,
      });

    if (
      datasExecucao.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível gerar as datas da preventiva.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.planoPreventivo.create(
      {
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
            maquinaId || null,

          frequencia:
            frequencia as any,

          intervaloPersonalizadoDias:
            frequencia ===
            "PERSONALIZADA"
              ? intervaloPersonalizadoDias
              : null,

          dataInicio,

          proximaExecucao:
            datasExecucao[0],

          dataFim,

          diasAntesAviso,

          duracaoEstimadaMinutos,

          ativo: true,

          gerarAutomaticamente,

          ultimaGeracaoEm:
            new Date(),

          criadoPorId:
            usuarioLogado.id,

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
              datasExecucao.map(
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

    return NextResponse.redirect(
      new URL(
        "/admin/os/preventivas/lista",
        req.url
      ),
      303
    );
  } catch (error) {
    console.error(
      "Erro ao criar plano preventivo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao criar plano preventivo.",
      },
      {
        status: 500,
      }
    );
  }
}