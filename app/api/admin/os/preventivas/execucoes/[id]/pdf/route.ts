import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import {
  gerarPdfExecucaoPreventiva,
} from "@/src/lib/pdfExecucaoPreventiva";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _req: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    /*
     * ==========================================================
     * BUSCA A EXECUÇÃO COMPLETA
     * ==========================================================
     */

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

    /*
     * ==========================================================
     * EXECUÇÃO NÃO ENCONTRADA
     * ==========================================================
     */

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

    /*
     * ==========================================================
     * GERA O PDF
     * ==========================================================
     */

    const pdf =
      await gerarPdfExecucaoPreventiva({
        id: execucao.id,

        status:
          execucao.status,

        dataProgramada:
          execucao.dataProgramada,

        dataInicio:
          execucao.dataInicio,

        dataConclusao:
          execucao.dataConclusao,

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
                nome:
                  execucao.concluidoPor.nome,

                email:
                  execucao.concluidoPor.email,
              }
            : null,

        plano: {
          id:
            execucao.plano.id,

          titulo:
            execucao.plano.titulo,

          descricao:
            execucao.plano.descricao,

          prioridade:
            execucao.plano.prioridade,

          frequencia:
            execucao.plano.frequencia,

          duracaoEstimadaMinutos:
            execucao.plano
              .duracaoEstimadaMinutos,

          empresa:
            execucao.plano.empresa
              ? {
                  nome:
                    execucao.plano.empresa.nome,

                  sigla:
                    execucao.plano.empresa.sigla,
                }
              : null,

          setor: {
            nome:
              execucao.plano.setor.nome,
          },

          maquina:
            execucao.plano.maquina
              ? {
                  nome:
                    execucao.plano.maquina.nome,
                }
              : null,

          criadoPor:
            execucao.plano.criadoPor
              ? {
                  nome:
                    execucao.plano.criadoPor.nome,

                  email:
                    execucao.plano.criadoPor.email,
                }
              : null,
        },

        responsaveis:
          execucao.responsaveis.map(
            (responsavel) => ({
              user: {
                nome:
                  responsavel.user.nome,

                email:
                  responsavel.user.email,
              },
            })
          ),
      });

    /*
     * ==========================================================
     * NOME DO ARQUIVO
     * ==========================================================
     */

    const tituloLimpo =
      execucao.plano.titulo
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-zA-Z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        )
        .toLowerCase();

    const data =
      execucao.dataProgramada;

    const dataArquivo =
      `${String(
        data.getUTCDate()
      ).padStart(
        2,
        "0"
      )}-${String(
        data.getUTCMonth() + 1
      ).padStart(
        2,
        "0"
      )}-${data.getUTCFullYear()}`;

    const nomeArquivo =
      `preventiva-${tituloLimpo}-${dataArquivo}.pdf`;

    /*
     * ==========================================================
     * RETORNA O PDF
     * ==========================================================
     */

    return new Response(
      new Uint8Array(pdf),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `inline; filename="${nomeArquivo}"`,

          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "ERRO AO GERAR PDF DA EXECUÇÃO PREVENTIVA:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao gerar PDF.",
      },
      {
        status: 500,
      }
    );
  }
}