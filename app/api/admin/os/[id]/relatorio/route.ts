import { AcaoAuditoria } from "@prisma/client";
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

type RelatorioBody = {
  relatorio?: unknown;
  observacoes?: unknown;

  dataInicio?: unknown;
  horaInicio?: unknown;
  dataTermino?: unknown;
  horaTermino?: unknown;
};

function criarDataHoraExecucao(
  data: string,
  hora: string
) {
  const dataValida =
    /^\d{4}-\d{2}-\d{2}$/.test(data);

  const horaValida =
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora);

  if (!dataValida || !horaValida) {
    return null;
  }

  /*
   * Os campos date e time não possuem informação
   * de fuso horário.
   *
   * O sistema utiliza o horário de Brasília.
   */
  const dataHora = new Date(
    `${data}T${hora}:00-03:00`
  );

  if (Number.isNaN(dataHora.getTime())) {
    return null;
  }

  return dataHora;
}

export async function PATCH(
  req: Request,
  { params }: Props
) {
  try {
    const session =
      await getServerSession(authOptions);

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

    let body: RelatorioBody;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Dados do relatório inválidos.",
        },
        {
          status: 400,
        }
      );
    }

    const relatorio = String(
      body?.relatorio ?? ""
    ).trim();

    const observacoes = String(
      body?.observacoes ?? ""
    ).trim();

    const dataInicio = String(
      body?.dataInicio ?? ""
    ).trim();

    const horaInicio = String(
      body?.horaInicio ?? ""
    ).trim();

    const dataTermino = String(
      body?.dataTermino ?? ""
    ).trim();

    const horaTermino = String(
      body?.horaTermino ?? ""
    ).trim();

    if (!relatorio) {
      return NextResponse.json(
        {
          error: "Escreva o relatório do serviço.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !dataInicio ||
      !horaInicio ||
      !dataTermino ||
      !horaTermino
    ) {
      return NextResponse.json(
        {
          error:
            "Informe a data e a hora de início e término do serviço.",
        },
        {
          status: 400,
        }
      );
    }

    const inicioExecucaoReal =
      criarDataHoraExecucao(
        dataInicio,
        horaInicio
      );

    const fimExecucaoReal =
      criarDataHoraExecucao(
        dataTermino,
        horaTermino
      );

    if (
      !inicioExecucaoReal ||
      !fimExecucaoReal
    ) {
      return NextResponse.json(
        {
          error:
            "A data ou o horário da execução é inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      fimExecucaoReal.getTime() <=
      inicioExecucaoReal.getTime()
    ) {
      return NextResponse.json(
        {
          error:
            "O término do serviço precisa ser posterior ao início.",
        },
        {
          status: 400,
        }
      );
    }

    const duracaoExecucaoMinutos =
      Math.round(
        (fimExecucaoReal.getTime() -
          inicioExecucaoReal.getTime()) /
          60000
      );

    if (duracaoExecucaoMinutos <= 0) {
      return NextResponse.json(
        {
          error:
            "A duração calculada do serviço é inválida.",
        },
        {
          status: 400,
        }
      );
    }

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
            registroFinal: true,

            inicioExecucaoReal: true,
            fimExecucaoReal: true,
            duracaoExecucaoMinutos: true,
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

    if (!osAnterior) {
      return NextResponse.json(
        {
          error:
            "Ordem de serviço não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const registroFinal = [
      `Relatório: ${relatorio}`,

      observacoes &&
        `Observações finais: ${observacoes}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const relatorioJaExistia = Boolean(
      osAnterior.registroFinal?.trim()
    );

    const houveAlteracao =
      osAnterior.registroFinal !==
        registroFinal ||
      osAnterior.inicioExecucaoReal?.getTime() !==
        inicioExecucaoReal.getTime() ||
      osAnterior.fimExecucaoReal?.getTime() !==
        fimExecucaoReal.getTime() ||
      osAnterior.duracaoExecucaoMinutos !==
        duracaoExecucaoMinutos;

    const osAtualizada =
      await prisma.ordemServico.update({
        where: {
          id: osAnterior.id,
        },

        data: {
          registroFinal,

          inicioExecucaoReal,
          fimExecucaoReal,
          duracaoExecucaoMinutos,
        },
      });

    if (houveAlteracao) {
      await registrarAuditoria({
        acao: relatorioJaExistia
          ? AcaoAuditoria.EDITAR
          : AcaoAuditoria.CRIAR,

        entidade: "OrdemServico",
        entidadeId: osAtualizada.id,

        descricao: relatorioJaExistia
          ? `${usuarioLogado.nome} atualizou o relatório final da OS #${osAtualizada.numero}.`
          : `${usuarioLogado.nome} criou o relatório final da OS #${osAtualizada.numero}.`,

        usuarioId: usuarioLogado.id,
        usuarioNome: usuarioLogado.nome,
        usuarioEmail: usuarioLogado.email,

        dadosAnteriores: {
          tipoRegistro: "RELATORIO_FINAL",
          numeroOS: osAnterior.numero,
          tituloOS: osAnterior.titulo,

          registroFinal:
            osAnterior.registroFinal ?? null,

          inicioExecucaoReal:
            osAnterior.inicioExecucaoReal ??
            null,

          fimExecucaoReal:
            osAnterior.fimExecucaoReal ?? null,

          duracaoExecucaoMinutos:
            osAnterior.duracaoExecucaoMinutos ??
            null,
        },

        dadosNovos: {
          tipoRegistro: "RELATORIO_FINAL",
          numeroOS: osAtualizada.numero,
          tituloOS: osAtualizada.titulo,

          relatorio,
          observacoes:
            observacoes || null,

          registroFinal:
            osAtualizada.registroFinal,

          inicioExecucaoReal:
            osAtualizada.inicioExecucaoReal,

          fimExecucaoReal:
            osAtualizada.fimExecucaoReal,

          duracaoExecucaoMinutos:
            osAtualizada.duracaoExecucaoMinutos,
        },

        request: req,
      });
    }

    return NextResponse.json(
      osAtualizada
    );
  } catch (error) {
    console.error(
      "Erro ao salvar relatório:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao salvar relatório.",
      },
      {
        status: 500,
      }
    );
  }
}