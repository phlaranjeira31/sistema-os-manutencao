import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function dataUTC(
  valor: string
) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      valor
    );

  if (!match) {
    return null;
  }

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);

  const data = new Date(
    Date.UTC(
      ano,
      mes - 1,
      dia
    )
  );

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !==
      mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null;
  }

  return data;
}

function adicionarDias(
  data: Date,
  dias: number
) {
  const proxima = new Date(
    data.getTime()
  );

  proxima.setUTCDate(
    proxima.getUTCDate() +
      dias
  );

  return proxima;
}

function adicionarMeses(
  data: Date,
  meses: number
) {
  const diaOriginal =
    data.getUTCDate();

  const primeiroDiaDestino =
    new Date(
      Date.UTC(
        data.getUTCFullYear(),
        data.getUTCMonth() +
          meses,
        1
      )
    );

  const ultimoDiaDestino =
    new Date(
      Date.UTC(
        primeiroDiaDestino.getUTCFullYear(),
        primeiroDiaDestino.getUTCMonth() +
          1,
        0
      )
    ).getUTCDate();

  return new Date(
    Date.UTC(
      primeiroDiaDestino.getUTCFullYear(),
      primeiroDiaDestino.getUTCMonth(),
      Math.min(
        diaOriginal,
        ultimoDiaDestino
      )
    )
  );
}

function calcularProximaData({
  data,
  frequencia,
  intervaloPersonalizadoDias,
}: {
  data: Date;
  frequencia: string;
  intervaloPersonalizadoDias:
    | number
    | null;
}) {
  switch (frequencia) {
    case "SEMANAL":
      return adicionarDias(
        data,
        7
      );

    case "QUINZENAL":
      return adicionarDias(
        data,
        15
      );

    case "MENSAL":
      return adicionarMeses(
        data,
        1
      );

    case "BIMESTRAL":
      return adicionarMeses(
        data,
        2
      );

    case "TRIMESTRAL":
      return adicionarMeses(
        data,
        3
      );

    case "SEMESTRAL":
      return adicionarMeses(
        data,
        6
      );

    case "ANUAL":
      return adicionarMeses(
        data,
        12
      );

    case "PERSONALIZADA": {
      const dias =
        intervaloPersonalizadoDias ??
        0;

      if (dias <= 0) {
        throw new Error(
          "O plano possui periodicidade personalizada sem intervalo válido."
        );
      }

      return adicionarDias(
        data,
        dias
      );
    }

    default:
      throw new Error(
        "Periodicidade do plano inválida."
      );
  }
}

export async function PATCH(
  request: Request,
  { params }: Props
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    const usuarioId = String(
      (session?.user as any)?.id ??
        ""
    ).trim();

    if (!usuarioId) {
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

    const usuario =
      await prisma.user.findUnique({
        where: {
          id: usuarioId,
        },
        select: {
          ativo: true,
          perfil: true,
        },
      });

    if (!usuario?.ativo) {
      return NextResponse.json(
        {
          error:
            "Usuário sem permissão para reagendar preventivas.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      usuario.perfil !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente administradores podem reagendar preventivas.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    const body =
      await request.json();

    const valorData = String(
      body?.dataProgramada ??
        ""
    ).trim();

    const novaData =
      dataUTC(valorData);

    if (!novaData) {
      return NextResponse.json(
        {
          error:
            "Informe uma data válida para o reagendamento.",
        },
        {
          status: 400,
        }
      );
    }

    const execucao =
      await prisma.execucaoPreventiva.findUnique(
        {
          where: {
            id,
          },
          select: {
            id: true,
            planoId: true,
            dataProgramada: true,
            status: true,
            plano: {
              select: {
                titulo: true,
                frequencia: true,
                intervaloPersonalizadoDias:
                  true,
                dataFim: true,
              },
            },
          },
        }
      );

    if (!execucao) {
      return NextResponse.json(
        {
          error:
            "Execução preventiva não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      execucao.status !==
        "PROGRAMADA" &&
      execucao.status !==
        "PENDENTE"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente preventivas programadas ou pendentes podem ser reagendadas.",
        },
        {
          status: 400,
        }
      );
    }

    const execucoesAfetadas =
      await prisma.execucaoPreventiva.findMany(
        {
          where: {
            planoId:
              execucao.planoId,
            dataProgramada: {
              gte:
                execucao.dataProgramada,
            },
            status: {
              in: [
                "PROGRAMADA",
                "PENDENTE",
              ],
            },
          },
          orderBy: {
            dataProgramada:
              "asc",
          },
          select: {
            id: true,
            dataProgramada:
              true,
          },
        }
      );

    if (
      !execucoesAfetadas.some(
        (item) =>
          item.id ===
          execucao.id
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível localizar a execução na programação futura do plano.",
        },
        {
          status: 400,
        }
      );
    }

    const datasNovas: Date[] =
      [];

    let dataAtual = novaData;

    for (
      let indice = 0;
      indice <
      execucoesAfetadas.length;
      indice++
    ) {
      datasNovas.push(
        dataAtual
      );

      if (
        indice <
        execucoesAfetadas.length -
          1
      ) {
        dataAtual =
          calcularProximaData({
            data: dataAtual,
            frequencia:
              execucao.plano
                .frequencia,
            intervaloPersonalizadoDias:
              execucao.plano
                .intervaloPersonalizadoDias,
          });
      }
    }

    if (
      execucao.plano.dataFim
    ) {
      const ultrapassaDataFim =
        datasNovas.some(
          (data) =>
            data >
            execucao.plano
              .dataFim!
        );

      if (ultrapassaDataFim) {
        return NextResponse.json(
          {
            error:
              "O reagendamento faria uma ou mais execuções ultrapassarem a data final do plano. Ajuste a data escolhida ou a data final do plano.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const idsAfetados =
      execucoesAfetadas.map(
        (item) =>
          item.id
      );

    const conflito =
      await prisma.execucaoPreventiva.findFirst(
        {
          where: {
            planoId:
              execucao.planoId,
            id: {
              notIn:
                idsAfetados,
            },
            dataProgramada: {
              in: datasNovas,
            },
          },
          select: {
            id: true,
            dataProgramada:
              true,
          },
        }
      );

    if (conflito) {
      return NextResponse.json(
        {
          error:
            "Já existe outra execução deste plano em uma das novas datas calculadas. O reagendamento foi cancelado para evitar duplicidade.",
        },
        {
          status: 409,
        }
      );
    }

    const moverParaFrente =
      novaData.getTime() >
      execucoesAfetadas[0]
        .dataProgramada.getTime();

    const indices =
      execucoesAfetadas.map(
        (_, indice) =>
          indice
      );

    if (moverParaFrente) {
      indices.reverse();
    }

    await prisma.$transaction(
      async (tx) => {
        for (const indice of indices) {
          await tx.execucaoPreventiva.update(
            {
              where: {
                id:
                  execucoesAfetadas[
                    indice
                  ].id,
              },
              data: {
                dataProgramada:
                  datasNovas[
                    indice
                  ],
                notificado:
                  false,
                avisoEnviadoEm:
                  null,
              },
            }
          );
        }

        const ultimaNovaData =
          datasNovas[
            datasNovas.length - 1
          ];

        const proximaDepoisDaGrade =
          calcularProximaData({
            data:
              ultimaNovaData,
            frequencia:
              execucao.plano
                .frequencia,
            intervaloPersonalizadoDias:
              execucao.plano
                .intervaloPersonalizadoDias,
          });

        await tx.planoPreventivo.update(
          {
            where: {
              id:
                execucao.planoId,
            },
            data: {
              proximaExecucao:
                proximaDepoisDaGrade,
            },
          }
        );
      }
    );

    return NextResponse.json({
      ok: true,
      titulo:
        execucao.plano.titulo,
      execucoesAtualizadas:
        execucoesAfetadas.length,
      primeiraData:
        datasNovas[0].toISOString(),
      ultimaData:
        datasNovas[
          datasNovas.length - 1
        ].toISOString(),
    });
  } catch (error) {
    console.error(
      "Erro ao reagendar preventiva:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao reagendar a preventiva.",
      },
      {
        status: 500,
      }
    );
  }
}
