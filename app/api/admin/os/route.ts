import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/src/lib/prisma";
import { authOptions } from "@/src/lib/auth";
import cloudinary from "@/src/lib/cloudinary";

export const runtime = "nodejs";

async function gerarNumeroOS() {
  const ultimaOS = await prisma.ordemServico.aggregate({
    _max: {
      numero: true,
    },
  });

  return (ultimaOS._max.numero ?? 0) + 1;
}

function parseDate(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) return undefined;

  const date = new Date(`${text}T00:00:00`);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseDateTime(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) return undefined;

  const possuiSegundos =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text);

  const date = new Date(
    possuiSegundos ? `${text}-03:00` : `${text}:00-03:00`
  );

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

function prioridadeLabel(prioridade: string) {
  const map: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return map[prioridade] ?? prioridade;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return map[status] ?? status;
}

function escaparHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function enviarEmailNovaOS({
  to,
  osId,
  numero,
  maquina,
  setor,
  descricao,
  prioridade,
  status,
  criadaPor,
  criadaEm,
  dataParada,
}: {
  to: string;
  osId: string;
  numero: number;
  maquina: string;
  setor: string;
  descricao: string;
  prioridade: string;
  status: string;
  criadaPor: string;
  criadaEm: Date;
  dataParada?: Date;
}) {
  if (!process.env.MAILERSEND_API_TOKEN) {
    console.error(
      "E-mail da nova OS não enviado: MAILERSEND_API_TOKEN não configurado."
    );

    return {
      enviado: false,
      erro: "MAILERSEND_API_TOKEN não configurado.",
    };
  }

  if (!process.env.MAILERSEND_FROM_EMAIL) {
    console.error(
      "E-mail da nova OS não enviado: MAILERSEND_FROM_EMAIL não configurado."
    );

    return {
      enviado: false,
      erro: "MAILERSEND_FROM_EMAIL não configurado.",
    };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  const urlOS = `${baseUrl}/admin/os/${osId}`;

  const resposta = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MAILERSEND_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: {
        email: process.env.MAILERSEND_FROM_EMAIL,
        name: process.env.MAILERSEND_FROM_NAME || "Sistema de OS",
      },
      to: [
        {
          email: to,
        },
      ],
      subject: `Nova OS #${numero} criada - ${maquina}`,
      html: `
        <div
          style="
            margin: 0;
            padding: 24px;
            background-color: #f1f5f9;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
          "
        >
          <div
            style="
              max-width: 680px;
              margin: 0 auto;
              overflow: hidden;
              border: 1px solid #dbeafe;
              border-radius: 16px;
              background-color: #ffffff;
            "
          >
            <div
              style="
                padding: 24px;
                background-color: #050816;
                color: #ffffff;
              "
            >
              <p
                style="
                  margin: 0 0 6px;
                  color: #67e8f9;
                  font-size: 13px;
                  font-weight: bold;
                  text-transform: uppercase;
                "
              >
                Sistema de Manutenção
              </p>

              <h1
                style="
                  margin: 0;
                  font-size: 24px;
                  line-height: 1.3;
                "
              >
                Nova Ordem de Serviço criada
              </h1>

              <p
                style="
                  margin: 10px 0 0;
                  color: #cbd5e1;
                  font-size: 14px;
                "
              >
                Uma nova ocorrência foi registrada no sistema.
              </p>
            </div>

            <div style="padding: 24px;">
              <div
                style="
                  margin-bottom: 20px;
                  padding: 16px;
                  border: 1px solid #bae6fd;
                  border-radius: 12px;
                  background-color: #ecfeff;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #0891b2;
                    font-size: 13px;
                    font-weight: bold;
                  "
                >
                  OS #${numero}
                </p>

                <p
                  style="
                    margin: 5px 0 0;
                    font-size: 21px;
                    font-weight: bold;
                  "
                >
                  ${escaparHtml(maquina)}
                </p>
              </div>

              <table
                cellpadding="0"
                cellspacing="0"
                style="
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 14px;
                "
              >
                <tr>
                  <td
                    style="
                      width: 160px;
                      padding: 10px;
                      border-bottom: 1px solid #e2e8f0;
                      color: #64748b;
                      font-weight: bold;
                    "
                  >
                    Setor
                  </td>

                  <td
                    style="
                      padding: 10px;
                      border-bottom: 1px solid #e2e8f0;
                      font-weight: bold;
                    "
                  >
                    ${escaparHtml(setor)}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 10px;
                      border-bottom: 1px solid #e2e8f0;
                      color: #64748b;
                      font-weight: bold;
                    "
                  >
                    Prioridade
                  </td>

                  <td
                    style="
                      padding: 10px;
                      border-bottom: 1px solid #e2e8f0;
                      font-weight: bold;
                    "
                  >
                    ${escaparHtml(prioridadeLabel(prioridade))}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 10px;
                      border-bottom: 1px solid #e2e8f0;
                      color: #64748b;
                      font-weight: bold;
                    "
                  >
                    Status
                  </td>

                  <td
                    style="
                      padding: 10px;
                      border-bottom: 1px solid #e2e8f0;
                      font-weight: bold;
                    "
                  >
                    ${escaparHtml(statusLabel(status))}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 10px;
                      border-bottom: 1px solid #e2e8f0;
                      color: #64748b;
                      font-weight: bold;
                    "
                  >
                    Criada por
                  </td>

                  <td
                    style="
                      padding: 10px;
                      border-bottom: 1px solid #e2e8f0;
                      font-weight: bold;
                    "
                  >
                    ${escaparHtml(criadaPor)}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 10px;
                      border-bottom: 1px solid #e2e8f0;
                      color: #64748b;
                      font-weight: bold;
                    "
                  >
                    Criada em
                  </td>

                  <td
                    style="
                      padding: 10px;
                      border-bottom: 1px solid #e2e8f0;
                      font-weight: bold;
                    "
                  >
                    ${formatDateTime(criadaEm)}
                  </td>
                </tr>

                ${
                  dataParada
                    ? `
                      <tr>
                        <td
                          style="
                            padding: 10px;
                            border-bottom: 1px solid #e2e8f0;
                            color: #c2410c;
                            font-weight: bold;
                          "
                        >
                          Máquina parada desde
                        </td>

                        <td
                          style="
                            padding: 10px;
                            border-bottom: 1px solid #e2e8f0;
                            color: #c2410c;
                            font-weight: bold;
                          "
                        >
                          ${formatDateTime(dataParada)}
                        </td>
                      </tr>
                    `
                    : ""
                }
              </table>

              <div style="margin-top: 22px;">
                <p
                  style="
                    margin: 0 0 8px;
                    color: #64748b;
                    font-size: 13px;
                    font-weight: bold;
                  "
                >
                  Descrição do problema
                </p>

                <div
                  style="
                    padding: 15px;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    background-color: #f8fafc;
                    color: #334155;
                    font-size: 14px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                  "
                >${escaparHtml(descricao)}</div>
              </div>

              <div style="margin-top: 26px; text-align: center;">
                <a
                  href="${urlOS}"
                  style="
                    display: inline-block;
                    padding: 13px 22px;
                    border-radius: 10px;
                    background-color: #06b6d4;
                    color: #020617;
                    font-size: 14px;
                    font-weight: bold;
                    text-decoration: none;
                  "
                >
                  Abrir Ordem de Serviço
                </a>
              </div>
            </div>

            <div
              style="
                padding: 16px 24px;
                border-top: 1px solid #e2e8f0;
                background-color: #f8fafc;
                color: #64748b;
                font-size: 12px;
                text-align: center;
              "
            >
              Notificação automática do Sistema de OS da Sequoia.
            </div>
          </div>
        </div>
      `,
    }),
  });

  const respostaTexto = await resposta.text();

  if (!resposta.ok) {
    console.error(
      `Erro ao enviar e-mail da nova OS para ${to}:`,
      resposta.status,
      respostaTexto
    );

    return {
      enviado: false,
      erro: `MailerSend retornou ${resposta.status}: ${respostaTexto}`,
    };
  }

  console.log(
    `E-mail da nova OS #${numero} enviado para o supervisor: ${to}`
  );

  return {
    enviado: true,
    erro: null,
  };
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
          reject(error || new Error("Erro ao enviar arquivo."));
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    const usuarioLogadoId = String(
      (session?.user as { id?: string } | undefined)?.id ?? ""
    ).trim();

    if (!usuarioLogadoId) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const setorId = String(formData.get("setorId") ?? "").trim();
    const maquinaId = String(formData.get("maquinaId") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();

    const status = String(
      formData.get("status") ?? "NAO_INICIADA"
    ).trim();

    const prioridade = String(
      formData.get("prioridade") ?? "MEDIA"
    ).trim();

    const dataInicio = parseDate(formData.get("dataInicio"));
    const dataPrevista = parseDate(formData.get("dataPrevista"));
    const dataParada = parseDateTime(formData.get("dataParada"));

    const arquivos = formData
      .getAll("arquivos")
      .filter(
        (item): item is File =>
          item instanceof File && item.size > 0
      );

    if (!setorId) {
      return NextResponse.json(
        { error: "Selecione o setor." },
        { status: 400 }
      );
    }

    if (!maquinaId) {
      return NextResponse.json(
        { error: "Selecione a máquina ou equipamento." },
        { status: 400 }
      );
    }

    if (!descricao) {
      return NextResponse.json(
        { error: "A descrição é obrigatória." },
        { status: 400 }
      );
    }

    const statusPermitidos = [
      "NAO_INICIADA",
      "EM_ANDAMENTO",
      "CONCLUIDA",
      "CANCELADA",
    ];

    const prioridadesPermitidas = [
      "BAIXA",
      "MEDIA",
      "ALTA",
      "URGENTE",
    ];

    if (!statusPermitidos.includes(status)) {
      return NextResponse.json(
        { error: "Status inválido." },
        { status: 400 }
      );
    }

    if (!prioridadesPermitidas.includes(prioridade)) {
      return NextResponse.json(
        { error: "Prioridade inválida." },
        { status: 400 }
      );
    }

    const [setor, maquina, usuarioCriador] = await Promise.all([
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
          ativo: true,
          setorId: true,
        },
      }),

      prisma.user.findUnique({
        where: {
          id: usuarioLogadoId,
        },
        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      }),
    ]);

    if (!setor) {
      return NextResponse.json(
        { error: "Setor não encontrado." },
        { status: 404 }
      );
    }

    if (!setor.ativo) {
      return NextResponse.json(
        { error: "O setor selecionado está inativo." },
        { status: 400 }
      );
    }

    if (!maquina) {
      return NextResponse.json(
        { error: "Máquina ou equipamento não encontrado." },
        { status: 404 }
      );
    }

    if (!maquina.ativo) {
      return NextResponse.json(
        { error: "A máquina selecionada está inativa." },
        { status: 400 }
      );
    }

    if (maquina.setorId !== setor.id) {
      return NextResponse.json(
        {
          error:
            "A máquina selecionada não pertence ao setor informado.",
        },
        { status: 400 }
      );
    }

    if (!usuarioCriador) {
      return NextResponse.json(
        { error: "Usuário da sessão não encontrado." },
        { status: 404 }
      );
    }

    if (!usuarioCriador.ativo) {
      return NextResponse.json(
        { error: "O usuário da sessão está inativo." },
        { status: 403 }
      );
    }

    const arquivosSalvos: {
      url: string;
      publicId: string;
    }[] = [];

    for (const arquivo of arquivos) {
      const upload = await uploadParaCloudinary(arquivo);
      arquivosSalvos.push(upload);
    }

    const numero = await gerarNumeroOS();

    const os = await prisma.ordemServico.create({
      data: {
        numero,

        titulo: maquina.nome,
        descricao,

        status: status as
          | "NAO_INICIADA"
          | "EM_ANDAMENTO"
          | "CONCLUIDA"
          | "CANCELADA",

        prioridade: prioridade as
          | "BAIXA"
          | "MEDIA"
          | "ALTA"
          | "URGENTE",

        dataInicio,
        dataPrevista,
        dataParada,

        setor: {
          connect: {
            id: setor.id,
          },
        },

        maquina: {
          connect: {
            id: maquina.id,
          },
        },

        criadoPor: {
          connect: {
            id: usuarioCriador.id,
          },
        },

        anotacoes: [
          `Equipamento: ${maquina.nome}`,
          `Setor: ${setor.nome}`,
          `Descrição: ${descricao}`,
          `Prioridade: ${prioridade}`,
          dataParada &&
            `Máquina parada desde: ${formatDateTime(dataParada)}`,
          dataPrevista &&
            `Data prevista: ${dataPrevista.toLocaleDateString(
              "pt-BR"
            )}`,
          dataInicio &&
            `Data de início: ${dataInicio.toLocaleDateString(
              "pt-BR"
            )}`,
          `Criada por: ${usuarioCriador.nome}`,
        ]
          .filter(Boolean)
          .join("\n"),

        fotos: {
          create: arquivosSalvos.map((arquivo) => ({
            url: arquivo.url,
            publicId: arquivo.publicId,
          })),
        },
      },

      include: {
        fotos: true,
        criadoPor: true,
        setor: true,
        maquina: true,
      },
    });

    const supervisorEmail =
      process.env.SUPERVISOR_EMAIL?.trim() ||
      "npinto@tortillas.com.br";

    let notificacaoSupervisor: {
      enviado: boolean;
      erro: string | null;
    };

    try {
      notificacaoSupervisor = await enviarEmailNovaOS({
        to: supervisorEmail,
        osId: os.id,
        numero: os.numero,
        maquina: maquina.nome,
        setor: setor.nome,
        descricao: os.descricao,
        prioridade: os.prioridade,
        status: os.status,
        criadaPor: usuarioCriador.nome,
        criadaEm: os.createdAt,
        dataParada: os.dataParada ?? undefined,
      });
    } catch (erroEmail) {
      console.error(
        "Erro inesperado ao notificar supervisor sobre nova OS:",
        erroEmail
      );

      notificacaoSupervisor = {
        enviado: false,
        erro:
          erroEmail instanceof Error
            ? erroEmail.message
            : "Erro inesperado no envio do e-mail.",
      };
    }

    return NextResponse.json(
      {
        ...os,

        notificacaoSupervisor: {
          destinatario: supervisorEmail,
          enviado: notificacaoSupervisor.enviado,
          erro: notificacaoSupervisor.erro,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ERRO REAL AO CRIAR OS:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao criar OS.",
      },
      { status: 500 }
    );
  }
}