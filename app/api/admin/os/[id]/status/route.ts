import {
  AcaoAuditoria,
  StatusOS,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { registrarAuditoria } from "@/src/lib/auditoria";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const STATUS_PERMITIDOS: StatusOS[] = [
  StatusOS.NAO_INICIADA,
  StatusOS.EM_ANDAMENTO,
  StatusOS.CONCLUIDA,
  StatusOS.CANCELADA,
];

function statusLabel(status: StatusOS) {
  const labels: Record<StatusOS, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return labels[status];
}

export async function PATCH(
  req: Request,
  { params }: Props
) {
  try {
    const session = await getServerSession(authOptions);

    const usuarioLogadoId = String(
      (session?.user as { id?: string } | undefined)?.id ??
        ""
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
      status?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
        },
        {
          status: 400,
        }
      );
    }

    const statusRecebido = String(
      body?.status ?? ""
    ).trim();

    if (!statusRecebido) {
      return NextResponse.json(
        {
          error: "Status é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !STATUS_PERMITIDOS.includes(
        statusRecebido as StatusOS
      )
    ) {
      return NextResponse.json(
        {
          error: "Status inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const novoStatus = statusRecebido as StatusOS;

    const [osAnterior, usuarioLogado] =
      await Promise.all([
        prisma.ordemServico.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            numero: true,
            titulo: true,
            status: true,
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
          },
        }),
      ]);

    if (!usuarioLogado) {
      return NextResponse.json(
        {
          error: "Usuário da sessão não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (!usuarioLogado.ativo) {
      return NextResponse.json(
        {
          error: "O usuário da sessão está inativo.",
        },
        {
          status: 403,
        }
      );
    }

    if (!osAnterior) {
      return NextResponse.json(
        {
          error: "Ordem de serviço não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    if (osAnterior.status === novoStatus) {
      return NextResponse.json({
        ...osAnterior,
        mensagem: "A OS já possui esse status.",
      });
    }

    const osAtualizada =
      await prisma.ordemServico.update({
        where: {
          id: osAnterior.id,
        },
        data: {
          status: novoStatus,
        },
      });

    await registrarAuditoria({
      acao: AcaoAuditoria.ALTERAR_STATUS,
      entidade: "OrdemServico",
      entidadeId: osAtualizada.id,

      descricao: `${usuarioLogado.nome} alterou o status da OS #${osAtualizada.numero} de "${statusLabel(
        osAnterior.status
      )}" para "${statusLabel(osAtualizada.status)}".`,

      usuarioId: usuarioLogado.id,
      usuarioNome: usuarioLogado.nome,
      usuarioEmail: usuarioLogado.email,

      dadosAnteriores: {
        numero: osAnterior.numero,
        titulo: osAnterior.titulo,
        status: osAnterior.status,
        statusLabel: statusLabel(osAnterior.status),
      },

      dadosNovos: {
        numero: osAtualizada.numero,
        titulo: osAtualizada.titulo,
        status: osAtualizada.status,
        statusLabel: statusLabel(
          osAtualizada.status
        ),
      },

      request: req,
    });

    return NextResponse.json(osAtualizada);
  } catch (error) {
    console.error(
      "Erro ao atualizar status da OS:",
      error
    );

    return NextResponse.json(
      {
        error: "Erro interno ao atualizar status.",
      },
      {
        status: 500,
      }
    );
  }
}