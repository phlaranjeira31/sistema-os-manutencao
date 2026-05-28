import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import cloudinary from "../../../../src/lib/cloudinary";

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

  return new Date(`${text}T00:00:00`);
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
          reject(error);
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
    const formData = await req.formData();

    const titulo = String(formData.get("titulo") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();
    const setorNome = String(formData.get("setor") ?? "").trim();
    const status = String(
      formData.get("status") ?? "NAO_INICIADA"
    ).trim();

    const prioridade = String(
      formData.get("prioridade") ?? "MEDIA"
    ).trim();

    const criadoPorId = String(
      formData.get("criadoPorId") ?? ""
    ).trim();

    const dataInicio = parseDate(formData.get("dataInicio"));

    const dataPrevista = parseDate(
      formData.get("dataPrevista")
    );

    const arquivos = formData
      .getAll("arquivos")
      .filter(
        (item): item is File =>
          item instanceof File && item.size > 0
      );

    if (!titulo) {
      return NextResponse.json(
        { error: "O título é obrigatório." },
        { status: 400 }
      );
    }

    if (!descricao) {
      return NextResponse.json(
        { error: "A descrição é obrigatória." },
        { status: 400 }
      );
    }

    if (!setorNome) {
      return NextResponse.json(
        { error: "O setor é obrigatório." },
        { status: 400 }
      );
    }

    if (!criadoPorId) {
      return NextResponse.json(
        { error: "Selecione quem criou a OS." },
        { status: 400 }
      );
    }

    const usuarioCriador = await prisma.user.findUnique({
      where: {
        id: criadoPorId,
      },
      select: {
        id: true,
        nome: true,
      },
    });

    if (!usuarioCriador) {
      return NextResponse.json(
        { error: "Usuário criador não encontrado." },
        { status: 404 }
      );
    }

    const arquivosSalvos = [];

    for (const arquivo of arquivos) {
      const upload = await uploadParaCloudinary(arquivo);

      arquivosSalvos.push(upload);
    }

    const os = await prisma.ordemServico.create({
      data: {
        numero: await gerarNumeroOS(),

        titulo,
        descricao,

        status: status as any,
        prioridade: prioridade as any,

        dataInicio,
        dataPrevista,

        criadoPor: {
          connect: {
            id: usuarioCriador.id,
          },
        },

        anotacoes: [
          `Descrição: ${descricao}`,
          `Prioridade: ${prioridade}`,
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

        setor: {
          connectOrCreate: {
            where: {
              nome: setorNome,
            },
            create: {
              nome: setorNome,
            },
          },
        },

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
      },
    });

    return NextResponse.json(os, { status: 201 });
  } catch (error) {
    console.error("🔥 ERRO REAL AO CRIAR OS:", error);

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