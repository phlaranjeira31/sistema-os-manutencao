import { AcaoAuditoria } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { registrarAuditoria } from "@/src/lib/auditoria";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return labels[status] ?? status;
}

async function enviarEmail({
  to,
  titulo,
  descricao,
  numero,
  setor,
  id,
}: {
  to: string;
  titulo: string;
  descricao: string;
  numero: number;
  setor?: string;
  id: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY não configurada no Vercel."
    );
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "EMAIL_FROM não configurado no Vercel."
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://sequoiamanutencao.vercel.app";

  const res = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject: `Você foi atribuído à OS #${numero} - ${titulo}`,

        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #020617;">
            <h2>Nova Ordem de Serviço atribuída</h2>

            <p>
              Você foi atribuído a uma nova Ordem de Serviço no sistema.
            </p>

            <p><strong>OS:</strong> #${numero}</p>
            <p><strong>Título:</strong> ${titulo}</p>
            <p>
              <strong>Setor:</strong>
              ${setor || "Não informado"}
            </p>
            <p>
              <strong>Descrição:</strong>
              ${descricao || "Sem descrição"}
            </p>

            <div style="margin-top: 24px;">
              <a
                href="${baseUrl}/admin/os/${id}"
                style="
                  display: inline-block;
                  padding: 12px 18px;
                  background-color: #020617;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  margin-right: 10px;
                "
              >
                Ver OS
              </a>

              <a
                href="${baseUrl}/admin/relatorios/${id}"
                style="
                  display: inline-block;
                  padding: 12px 18px;
                  background-color: #16a34a;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                "
              >
                Fazer relatório
              </a>
            </div>

            <p style="margin-top: 24px;">
              Ou acesse o sistema completo:
            </p>

            <a
              href="${baseUrl}/admin"
              style="color:#2563eb; font-weight:bold;"
            >
              Acessar sistema
            </a>
          </div>
        `,
      }),
    }
  );

  const data = await res.text();

  if (!res.ok) {
    console.error("Erro Resend:", data);

    throw new Error(
      `Erro ao enviar email pelo Resend: ${data}`
    );
  }

  console.log(
    "Email de atribuição enviado para:",
    to
  );
}

export async function POST(
  req: Request,
  { params }: Props
) {
  try {
    const session = await getServerSession(authOptions);

    const usuarioLogadoId = String(
      (
        session?.user as
          | {
              id?: string;
            }
          | undefined
      )?.id ?? ""
    ).trim();

    if (!usuarioLogadoId) {
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

    if (!id) {
      return NextResponse.json(
        {
          error: "Identificador da OS inválido.",
        },
        {
          status: 400,
        }
      );
    }

    let body: {
      userId?: unknown;
      substituirResponsaveis?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Dados da atribuição inválidos.",
        },
        {
          status: 400,
        }
      );
    }

    const userId = String(
      body?.userId ?? ""
    ).trim();

    const substituirResponsaveis =
      body?.substituirResponsaveis === true;

    if (!userId) {
      return NextResponse.json(
        {
          error: "Selecione um colaborador.",
        },
        {
          status: 400,
        }
      );
    }

    const [
      os,
      colaborador,
      usuarioLogado,
    ] = await Promise.all([
      prisma.ordemServico.findUnique({
        where: {
          id,
        },

        include: {
          setor: true,

          responsaveis: {
            include: {
              user: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },
            },
          },
        },
      }),

      prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          nome: true,
          email: true,
          ativo: true,
        },
      }),

      prisma.user.findUnique({
        where: {
          id: usuarioLogadoId,
        },

        select: {
          id: true,
          nome: true,
          email: true,
          ativo: true,
          perfil: true,
        },
      }),
    ]);

    if (!usuarioLogado) {
      return NextResponse.json(
        {
          error:
            "Usuário da sessão não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (!usuarioLogado.ativo) {
      return NextResponse.json(
        {
          error:
            "O usuário da sessão está inativo.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      substituirResponsaveis &&
      usuarioLogado.perfil !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente administradores podem alterar uma atribuição existente.",
        },
        {
          status: 403,
        }
      );
    }

    if (!os) {
      return NextResponse.json(
        {
          error: "OS não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    if (!colaborador) {
      return NextResponse.json(
        {
          error: "Colaborador não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (!colaborador.ativo) {
      return NextResponse.json(
        {
          error:
            "O colaborador selecionado está inativo.",
        },
        {
          status: 400,
        }
      );
    }

    if (!colaborador.email) {
      return NextResponse.json(
        {
          error:
            "O colaborador selecionado não possui email cadastrado.",
        },
        {
          status: 400,
        }
      );
    }

    const responsaveisAnteriores =
      os.responsaveis.map((responsavel) => ({
        id: responsavel.user.id,
        nome: responsavel.user.nome,
        email: responsavel.user.email,
      }));

    const jaEraResponsavel =
      os.responsaveis.some(
        (responsavel) =>
          responsavel.userId === colaborador.id
      );

    const statusAnterior = os.status;

    const osAtualizada = await prisma.$transaction(
      async (transaction) => {
        if (substituirResponsaveis) {
          await transaction.responsavelOS.deleteMany({
            where: {
              osId: os.id,
            },
          });

          await transaction.responsavelOS.create({
            data: {
              osId: os.id,
              userId: colaborador.id,
            },
          });
        } else {
          await transaction.responsavelOS.upsert({
            where: {
              osId_userId: {
                osId: os.id,
                userId: colaborador.id,
              },
            },

            update: {},

            create: {
              osId: os.id,
              userId: colaborador.id,
            },
          });
        }

        return transaction.ordemServico.update({
          where: {
            id: os.id,
          },

          data: {
            status: "EM_ANDAMENTO",
          },

          include: {
            setor: true,

            responsaveis: {
              include: {
                user: {
                  select: {
                    id: true,
                    nome: true,
                    email: true,
                  },
                },
              },
            },
          },
        });
      }
    );

    const responsaveisNovos =
      osAtualizada.responsaveis.map(
        (responsavel) => ({
          id: responsavel.user.id,
          nome: responsavel.user.nome,
          email: responsavel.user.email,
        })
      );

    await registrarAuditoria({
      acao: AcaoAuditoria.ATRIBUIR,
      entidade: "OrdemServico",
      entidadeId: osAtualizada.id,

      descricao: substituirResponsaveis
        ? `${usuarioLogado.nome} alterou a atribuição da OS #${osAtualizada.numero} de ${
            responsaveisAnteriores.length > 0
              ? responsaveisAnteriores
                  .map((responsavel) => responsavel.nome)
                  .join(", ")
              : "sem responsável"
          } para ${colaborador.nome}.`
        : jaEraResponsavel
          ? `${usuarioLogado.nome} confirmou ${colaborador.nome} como responsável pela OS #${osAtualizada.numero}.`
          : `${usuarioLogado.nome} atribuiu a OS #${osAtualizada.numero} para ${colaborador.nome}.`,

      usuarioId: usuarioLogado.id,
      usuarioNome: usuarioLogado.nome,
      usuarioEmail: usuarioLogado.email,

      dadosAnteriores: {
        numero: os.numero,
        titulo: os.titulo,
        status: statusAnterior,
        statusLabel: statusLabel(
          statusAnterior
        ),
        responsaveis:
          responsaveisAnteriores,
      },

      dadosNovos: {
        numero: osAtualizada.numero,
        titulo: osAtualizada.titulo,
        status: osAtualizada.status,
        statusLabel: statusLabel(
          osAtualizada.status
        ),

        colaboradorAtribuido: {
          id: colaborador.id,
          nome: colaborador.nome,
          email: colaborador.email,
        },

        responsaveis: responsaveisNovos,
        jaEraResponsavel,
        substituirResponsaveis,
        tipoAtribuicao: substituirResponsaveis
          ? "SUBSTITUICAO"
          : "ADICAO",
      },

      request: req,
    });

    if (
      statusAnterior !==
      osAtualizada.status
    ) {
      await registrarAuditoria({
        acao:
          AcaoAuditoria.ALTERAR_STATUS,

        entidade: "OrdemServico",
        entidadeId: osAtualizada.id,

        descricao: `O status da OS #${osAtualizada.numero} foi alterado automaticamente de "${statusLabel(
          statusAnterior
        )}" para "${statusLabel(
          osAtualizada.status
        )}" após a atribuição para ${colaborador.nome}.`,

        usuarioId: usuarioLogado.id,
        usuarioNome: usuarioLogado.nome,
        usuarioEmail: usuarioLogado.email,

        dadosAnteriores: {
          status: statusAnterior,
          statusLabel:
            statusLabel(statusAnterior),
        },

        dadosNovos: {
          status: osAtualizada.status,
          statusLabel: statusLabel(
            osAtualizada.status
          ),
          motivo:
            "Atribuição de responsável",
        },

        request: req,
      });
    }

    await enviarEmail({
      to: colaborador.email,
      titulo: os.titulo,
      descricao: os.descricao,
      numero: os.numero,
      setor: os.setor?.nome,
      id: os.id,
    });

    return NextResponse.json({
      ...osAtualizada,
      emailEnviado: true,
      emailPara: colaborador.email,
    });
  } catch (error) {
    console.error(
      "Erro ao atribuir OS:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao atribuir OS.",
      },
      {
        status: 500,
      }
    );
  }
}