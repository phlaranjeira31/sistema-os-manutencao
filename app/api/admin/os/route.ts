import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

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

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

async function salvarArquivoOS(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "os");
  await mkdir(uploadDir, { recursive: true });

  const nomeArquivo = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const caminho = path.join(uploadDir, nomeArquivo);

  await writeFile(caminho, buffer);

  return {
    url: `/uploads/os/${nomeArquivo}`,
    publicId: nomeArquivo,
  };
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let titulo = "";
    let descricao = "";
    let setorNome = "";
    let status = "NAO_INICIADA";
    let prioridade = "MEDIA";
    let criadoPorId = "";
    let dataInicio: Date | undefined;
    let dataPrevista: Date | undefined;
    let arquivos: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      titulo = String(formData.get("titulo") ?? "").trim();
      descricao = String(formData.get("descricao") ?? "").trim();
      setorNome = String(formData.get("setor") ?? "").trim();
      status = String(formData.get("status") ?? "NAO_INICIADA").trim();
      prioridade = String(formData.get("prioridade") ?? "MEDIA").trim();
      criadoPorId = String(formData.get("criadoPorId") ?? "").trim();

      dataInicio = parseDate(formData.get("dataInicio"));
      dataPrevista = parseDate(formData.get("dataPrevista"));

      arquivos = formData
        .getAll("arquivos")
        .filter((item): item is File => item instanceof File && item.size > 0);
    } else {
      const body = await req.json();

      titulo = String(body?.titulo ?? "").trim();
      descricao = String(body?.descricao ?? "").trim();
      setorNome = String(body?.setor ?? "").trim();
      status = String(body?.status ?? "NAO_INICIADA").trim();
      prioridade = String(body?.prioridade ?? "MEDIA").trim();
      criadoPorId = String(body?.criadoPorId ?? "").trim();

      dataInicio = parseDate(body?.dataInicio);
      dataPrevista = parseDate(body?.dataPrevista);
    }

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
      const arquivoSalvo = await salvarArquivoOS(arquivo);
      arquivosSalvos.push(arquivoSalvo);
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
            `Data prevista: ${dataPrevista.toLocaleDateString("pt-BR")}`,
          dataInicio &&
            `Data de início: ${dataInicio.toLocaleDateString("pt-BR")}`,
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
          error instanceof Error ? error.message : "Erro interno ao criar OS.",
      },
      { status: 500 }
    );
  }
}