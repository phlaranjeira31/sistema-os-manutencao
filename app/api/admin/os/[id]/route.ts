import {
  AcaoAuditoria,
  PrioridadeOS,
  StatusOS,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { registrarAuditoria } from "@/src/lib/auditoria";
import { authOptions } from "@/src/lib/auth";
import cloudinary from "@/src/lib/cloudinary";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type DadosPatch = {
  titulo?: unknown;
  descricao?: unknown;
  setorId?: unknown;
  maquinaId?: unknown;
  status?: unknown;
  prioridade?: unknown;
  dataInicio?: unknown;
  dataPrevista?: unknown;
  dataConclusao?: unknown;
  dataParada?: unknown;
  anotacoes?: unknown;
  registroFinal?: unknown;
  arquivos: File[];
};

function parseDate(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) return null;

  const date = new Date(`${text}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateTime(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) return null;

  let date: Date;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) {
    date = new Date(`${text}:00-03:00`);
  } else if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)
  ) {
    date = new Date(`${text}-03:00`);
  } else {
    date = new Date(text);
  }

  return Number.isNaN(date.getTime()) ? null : date;
}

function statusLabel(status: StatusOS) {
  const labels: Record<StatusOS, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return labels[status];
}

function prioridadeLabel(prioridade: PrioridadeOS) {
  const labels: Record<PrioridadeOS, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return labels[prioridade];
}

function valorComparavel(valor: unknown) {
  if (valor instanceof Date) {
    return valor.toISOString();
  }

  return valor;
}

async function uploadParaCloudinary(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise<{
    url: string;
    publicId: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "os",
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          reject(
            error ||
              new Error(
                "Erro ao enviar arquivo para o Cloudinary."
              )
          );

          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
}

async function lerDadosPatch(req: Request): Promise<DadosPatch> {
  const contentType = req.headers.get("content-type") ?? "";

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await req.formData();

    const arquivos = formData
      .getAll("arquivos")
      .filter(
        (item): item is File =>
          item instanceof File && item.size > 0
      );

    return {
      titulo: formData.get("titulo"),
      descricao: formData.get("descricao"),
      setorId: formData.get("setorId"),
      maquinaId: formData.get("maquinaId"),
      status: formData.get("status"),
      prioridade: formData.get("prioridade"),
      dataInicio: formData.get("dataInicio"),
      dataPrevista: formData.get("dataPrevista"),
      dataConclusao: formData.get("dataConclusao"),
      dataParada: formData.get("dataParada"),
      anotacoes: formData.get("anotacoes"),
      registroFinal: formData.get("registroFinal"),
      arquivos,
    };
  }

  const body = (await req.json()) as Record<string, unknown>;

  return {
    titulo: body.titulo,
    descricao: body.descricao,
    setorId: body.setorId,
    maquinaId: body.maquinaId,
    status: body.status,
    prioridade: body.prioridade,
    dataInicio: body.dataInicio,
    dataPrevista: body.dataPrevista,
    dataConclusao: body.dataConclusao,
    dataParada: body.dataParada,
    anotacoes: body.anotacoes,
    registroFinal: body.registroFinal,
    arquivos: [],
  };
}

export async function PATCH(
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

    let body: DadosPatch;

    try {
      body = await lerDadosPatch(req);
    } catch {
      return NextResponse.json(
        {
          error: "Dados da OS inválidos.",
        },
        {
          status: 400,
        }
      );
    }

    const titulo = String(
      body.titulo ?? ""
    ).trim();

    const descricao = String(
      body.descricao ?? ""
    ).trim();

    const setorId = String(
      body.setorId ?? ""
    ).trim();

    const maquinaId = String(
      body.maquinaId ?? ""
    ).trim();

    const statusRecebido = String(
      body.status ?? "NAO_INICIADA"
    ).trim();

    const prioridadeRecebida = String(
      body.prioridade ?? "MEDIA"
    ).trim();

    const anotacoes = String(
      body.anotacoes ?? ""
    ).trim();

    const registroFinal = String(
      body.registroFinal ?? ""
    ).trim();

    if (!titulo) {
      return NextResponse.json(
        {
          error: "O título é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (!descricao) {
      return NextResponse.json(
        {
          error: "A descrição é obrigatória.",
        },
        {
          status: 400,
        }
      );
    }

    if (!setorId) {
      return NextResponse.json(
        {
          error: "O setor é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (!maquinaId) {
      return NextResponse.json(
        {
          error: "A máquina ou equipamento é obrigatória.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Object.values(StatusOS).includes(
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

    if (
      !Object.values(PrioridadeOS).includes(
        prioridadeRecebida as PrioridadeOS
      )
    ) {
      return NextResponse.json(
        {
          error: "Prioridade inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const novoStatus = statusRecebido as StatusOS;
    const novaPrioridade =
      prioridadeRecebida as PrioridadeOS;

    const dataInicio = parseDate(body.dataInicio);
    const dataPrevista = parseDate(body.dataPrevista);
    const dataConclusao = parseDate(body.dataConclusao);
    const dataParada = parseDateTime(body.dataParada);

    const [
      osAnterior,
      setorNovo,
      maquinaNova,
      usuarioLogado,
    ] = await Promise.all([
      prisma.ordemServico.findUnique({
        where: {
          id,
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
              setorId: true,
              ativo: true,
            },
          },

          _count: {
            select: {
              fotos: true,
            },
          },
        },
      }),

      prisma.setor.findUnique({
        where: {
          id: setorId,
        },

        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      }),

      prisma.maquina.findUnique({
        where: {
          id: maquinaId,
        },

        select: {
          id: true,
          nome: true,
          setorId: true,
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

    if (!setorNovo) {
      return NextResponse.json(
        {
          error: "Setor não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !setorNovo.ativo &&
      setorNovo.id !== osAnterior.setorId
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível mover a OS para um setor inativo.",
        },
        {
          status: 400,
        }
      );
    }

    if (!maquinaNova) {
      return NextResponse.json(
        {
          error: "Máquina ou equipamento não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (maquinaNova.setorId !== setorNovo.id) {
      return NextResponse.json(
        {
          error:
            "A máquina selecionada não pertence ao setor informado.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !maquinaNova.ativo &&
      maquinaNova.id !== osAnterior.maquinaId
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível mover a OS para uma máquina inativa.",
        },
        {
          status: 400,
        }
      );
    }

    const arquivosSalvos: {
      url: string;
      publicId: string;
    }[] = [];

    for (const arquivo of body.arquivos) {
      const upload = await uploadParaCloudinary(arquivo);

      arquivosSalvos.push(upload);
    }

    const dadosAnteriores: Record<string, unknown> = {};
    const dadosNovos: Record<string, unknown> = {};
    const camposAlterados: string[] = [];

    function adicionarAlteracao(
      campo: string,
      nomeCampo: string,
      valorAnterior: unknown,
      valorNovo: unknown
    ) {
      const anteriorComparavel =
        valorComparavel(valorAnterior);

      const novoComparavel =
        valorComparavel(valorNovo);

      if (
        JSON.stringify(anteriorComparavel) ===
        JSON.stringify(novoComparavel)
      ) {
        return;
      }

      camposAlterados.push(nomeCampo);
      dadosAnteriores[campo] = anteriorComparavel;
      dadosNovos[campo] = novoComparavel;
    }

    adicionarAlteracao(
      "titulo",
      "Título",
      osAnterior.titulo,
      titulo
    );

    adicionarAlteracao(
      "descricao",
      "Descrição",
      osAnterior.descricao,
      descricao
    );

    adicionarAlteracao(
      "setor",
      "Setor",
      {
        id: osAnterior.setor.id,
        nome: osAnterior.setor.nome,
      },
      {
        id: setorNovo.id,
        nome: setorNovo.nome,
      }
    );

    adicionarAlteracao(
      "maquina",
      "Máquina",
      osAnterior.maquina
        ? {
            id: osAnterior.maquina.id,
            nome: osAnterior.maquina.nome,
          }
        : null,
      {
        id: maquinaNova.id,
        nome: maquinaNova.nome,
      }
    );

    adicionarAlteracao(
      "status",
      "Status",
      {
        valor: osAnterior.status,
        descricao: statusLabel(osAnterior.status),
      },
      {
        valor: novoStatus,
        descricao: statusLabel(novoStatus),
      }
    );

    adicionarAlteracao(
      "prioridade",
      "Prioridade",
      {
        valor: osAnterior.prioridade,
        descricao: prioridadeLabel(
          osAnterior.prioridade
        ),
      },
      {
        valor: novaPrioridade,
        descricao: prioridadeLabel(novaPrioridade),
      }
    );

    adicionarAlteracao(
      "dataInicio",
      "Data de início",
      osAnterior.dataInicio,
      dataInicio
    );

    adicionarAlteracao(
      "dataPrevista",
      "Data prevista",
      osAnterior.dataPrevista,
      dataPrevista
    );

    adicionarAlteracao(
      "dataConclusao",
      "Data de conclusão",
      osAnterior.dataConclusao,
      dataConclusao
    );

    adicionarAlteracao(
      "dataParada",
      "Data e horário da parada",
      osAnterior.dataParada,
      dataParada
    );

    adicionarAlteracao(
      "anotacoes",
      "Anotações",
      osAnterior.anotacoes,
      anotacoes || null
    );

    adicionarAlteracao(
      "registroFinal",
      "Registro final",
      osAnterior.registroFinal,
      registroFinal || null
    );

    if (arquivosSalvos.length > 0) {
      camposAlterados.push("Anexos");

      dadosAnteriores.anexos = {
        quantidade: osAnterior._count.fotos,
      };

      dadosNovos.anexos = {
        quantidadeAnterior: osAnterior._count.fotos,
        quantidadeAdicionada: arquivosSalvos.length,
        quantidadeTotal:
          osAnterior._count.fotos + arquivosSalvos.length,

        arquivosAdicionados: arquivosSalvos.map(
          (arquivo) => ({
            url: arquivo.url,
            publicId: arquivo.publicId,
          })
        ),
      };
    }

    const osAtualizada =
      await prisma.ordemServico.update({
        where: {
          id: osAnterior.id,
        },

        data: {
          titulo,
          descricao,
          setorId: setorNovo.id,
          maquinaId: maquinaNova.id,
          status: novoStatus,
          prioridade: novaPrioridade,
          dataInicio,
          dataPrevista,
          dataConclusao,
          dataParada,
          anotacoes: anotacoes || null,
          registroFinal: registroFinal || null,

          ...(arquivosSalvos.length > 0
            ? {
                fotos: {
                  create: arquivosSalvos.map(
                    (arquivo) => ({
                      url: arquivo.url,
                      publicId: arquivo.publicId,
                    })
                  ),
                },
              }
            : {}),
        },

        include: {
          setor: true,
          maquina: true,
          criadoPor: true,
          fotos: true,
        },
      });

    if (camposAlterados.length > 0) {
      await registrarAuditoria({
        acao: AcaoAuditoria.EDITAR,
        entidade: "OrdemServico",
        entidadeId: osAtualizada.id,

        descricao: `${
          usuarioLogado.nome
        } editou a OS #${
          osAtualizada.numero
        }. Campos alterados: ${camposAlterados.join(", ")}.`,

        usuarioId: usuarioLogado.id,
        usuarioNome: usuarioLogado.nome,
        usuarioEmail: usuarioLogado.email,

        dadosAnteriores,
        dadosNovos,

        request: req,
      });
    }

    if (osAnterior.status !== osAtualizada.status) {
      await registrarAuditoria({
        acao: AcaoAuditoria.ALTERAR_STATUS,
        entidade: "OrdemServico",
        entidadeId: osAtualizada.id,

        descricao: `${
          usuarioLogado.nome
        } alterou o status da OS #${
          osAtualizada.numero
        } de "${statusLabel(
          osAnterior.status
        )}" para "${statusLabel(
          osAtualizada.status
        )}" durante a edição.`,

        usuarioId: usuarioLogado.id,
        usuarioNome: usuarioLogado.nome,
        usuarioEmail: usuarioLogado.email,

        dadosAnteriores: {
          status: osAnterior.status,
          statusLabel: statusLabel(osAnterior.status),
        },

        dadosNovos: {
          status: osAtualizada.status,
          statusLabel: statusLabel(osAtualizada.status),
          origem: "Edição da OS",
        },

        request: req,
      });
    }

    return NextResponse.json(osAtualizada);
  } catch (error) {
    console.error("Erro ao editar OS:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao editar OS.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
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

    const [os, usuarioLogado] = await Promise.all([
      prisma.ordemServico.findUnique({
        where: {
          id,
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
                  id: true,
                  nome: true,
                  email: true,
                },
              },
            },
          },

          _count: {
            select: {
              fotos: true,
            },
          },
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

    if (!os) {
      return NextResponse.json(
        {
          error: "Ordem de serviço não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const dadosExcluidos = {
      id: os.id,
      numero: os.numero,
      titulo: os.titulo,
      descricao: os.descricao,
      status: os.status,
      prioridade: os.prioridade,

      setor: {
        id: os.setor.id,
        nome: os.setor.nome,
      },

      maquina: os.maquina
        ? {
            id: os.maquina.id,
            nome: os.maquina.nome,
          }
        : null,

      responsaveis: os.responsaveis.map(
        (responsavel) => ({
          id: responsavel.user.id,
          nome: responsavel.user.nome,
          email: responsavel.user.email,
        })
      ),

      quantidadeFotos: os._count.fotos,
      createdAt: os.createdAt,
      updatedAt: os.updatedAt,
    };

    await prisma.ordemServico.delete({
      where: {
        id: os.id,
      },
    });

    await registrarAuditoria({
      acao: AcaoAuditoria.EXCLUIR,
      entidade: "OrdemServico",
      entidadeId: os.id,

      descricao: `${usuarioLogado.nome} excluiu a OS #${os.numero} (${os.titulo}).`,

      usuarioId: usuarioLogado.id,
      usuarioNome: usuarioLogado.nome,
      usuarioEmail: usuarioLogado.email,

      dadosAnteriores: dadosExcluidos,

      dadosNovos: {
        excluida: true,
      },

      request: req,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao excluir OS:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao excluir OS.",
      },
      {
        status: 500,
      }
    );
  }
}