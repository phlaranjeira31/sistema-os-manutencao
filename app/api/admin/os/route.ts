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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
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

    return NextResponse.json(os, { status: 201 });
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