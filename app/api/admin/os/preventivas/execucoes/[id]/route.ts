import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

const RESPOSTAS_VALIDAS = ["SIM", "NAO", "NA"];

async function usuarioLogado() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      ativo: true,
    },
  });
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
    const usuario = await usuarioLogado();

    if (!usuario || !usuario.ativo) {
      return NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    const body = await req.json();

    const acao = String(body?.acao ?? "").trim();

    const execucao =
      await prisma.execucaoPreventiva.findUnique({
        where: {
          id,
        },
        include: {
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
          error: "Execução preventiva não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ==========================================================
     * INICIAR EXECUÇÃO
     * ==========================================================
     */

    if (acao === "INICIAR") {
      if (execucao.status === "CONCLUIDA") {
        return NextResponse.json(
          {
            error: "Esta preventiva já foi concluída.",
          },
          {
            status: 400,
          }
        );
      }

      if (execucao.status === "CANCELADA") {
        return NextResponse.json(
          {
            error: "Esta preventiva está cancelada.",
          },
          {
            status: 400,
          }
        );
      }

      if (execucao.status === "NAO_REALIZADA") {
        return NextResponse.json(
          {
            error:
              "Esta preventiva está marcada como não realizada.",
          },
          {
            status: 400,
          }
        );
      }

      if (execucao.status === "EM_EXECUCAO") {
        return NextResponse.json({
          success: true,
          message: "A preventiva já está em execução.",
        });
      }

      const atualizada =
        await prisma.execucaoPreventiva.update({
          where: {
            id,
          },
          data: {
            status: "EM_EXECUCAO",
            dataInicio: execucao.dataInicio ?? new Date(),
          },
        });

      return NextResponse.json({
        success: true,
        execucao: atualizada,
      });
    }

    /*
     * ==========================================================
     * CONCLUIR EXECUÇÃO
     * ==========================================================
     */

    if (acao === "CONCLUIR") {
      if (!execucao.dataInicio) {
        return NextResponse.json(
          {
            error:
              "Inicie a preventiva antes de concluí-la.",
          },
          {
            status: 400,
          }
        );
      }

      if (execucao.status === "CONCLUIDA") {
        return NextResponse.json(
          {
            error: "Esta preventiva já foi concluída.",
          },
          {
            status: 400,
          }
        );
      }

      const descricaoExecucao = String(
        body?.descricaoExecucao ?? ""
      ).trim();

      const pecasUtilizadas = String(
        body?.pecasUtilizadas ?? ""
      ).trim();

      const observacoes = String(
        body?.observacoes ?? ""
      ).trim();

      const checkQuantidadePecas = String(
        body?.checkQuantidadePecas ?? ""
      ).trim();

      const checkFerramentasRecolhidas = String(
        body?.checkFerramentasRecolhidas ?? ""
      ).trim();

      const checkMaterialRepostoRecolhido = String(
        body?.checkMaterialRepostoRecolhido ?? ""
      ).trim();

      const checkLimpezaRealizada = String(
        body?.checkLimpezaRealizada ?? ""
      ).trim();

      const checkLimpezaEfetiva = String(
        body?.checkLimpezaEfetiva ?? ""
      ).trim();

      if (!descricaoExecucao) {
        return NextResponse.json(
          {
            error:
              "Descreva o serviço executado antes de concluir.",
          },
          {
            status: 400,
          }
        );
      }

      const checklist = [
        checkQuantidadePecas,
        checkFerramentasRecolhidas,
        checkMaterialRepostoRecolhido,
        checkLimpezaRealizada,
        checkLimpezaEfetiva,
      ];

      if (
        checklist.some(
          (resposta) =>
            !RESPOSTAS_VALIDAS.includes(resposta)
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Responda todas as perguntas do checklist.",
          },
          {
            status: 400,
          }
        );
      }

      const agora = new Date();

      const duracaoRealMinutos = Math.max(
        1,
        Math.round(
          (agora.getTime() -
            execucao.dataInicio.getTime()) /
            60000
        )
      );

      const atualizada =
        await prisma.execucaoPreventiva.update({
          where: {
            id,
          },
          data: {
            status: "CONCLUIDA",

            dataConclusao: agora,

            duracaoRealMinutos,

            descricaoExecucao,

            pecasUtilizadas:
              pecasUtilizadas || null,

            observacoes:
              observacoes || null,

            checkQuantidadePecas,

            checkFerramentasRecolhidas,

            checkMaterialRepostoRecolhido,

            checkLimpezaRealizada,

            checkLimpezaEfetiva,

            concluidoPorId: usuario.id,
          },
        });

      return NextResponse.json({
        success: true,
        execucao: atualizada,
      });
    }

    return NextResponse.json(
      {
        error: "Ação inválida.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar execução preventiva:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro interno ao atualizar execução preventiva.",
      },
      {
        status: 500,
      }
    );
  }
}