import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    const execucao =
      await prisma.execucaoPreventiva.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          status: true,
          dataProgramada: true,

          plano: {
            select: {
              id: true,
              titulo: true,
            },
          },
        },
      });

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
            "Somente preventivas programadas ou pendentes podem ser apagadas do dia.",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.execucaoPreventiva.update({
      where: {
        id,
      },

      data: {
        status: "CANCELADA",
      },
    });

    return NextResponse.json({
      ok: true,

      message:
        "Preventiva removida da programação deste dia.",

      execucao: {
        id: execucao.id,
        planoId:
          execucao.plano.id,
        titulo:
          execucao.plano.titulo,
        dataProgramada:
          execucao.dataProgramada.toISOString(),
        status: "CANCELADA",
      },
    });
  } catch (error) {
    console.error(
      "Erro ao cancelar ocorrência preventiva:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível apagar esta preventiva do dia.",
      },
      {
        status: 500,
      }
    );
  }
}
