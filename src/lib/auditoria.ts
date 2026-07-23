import {
  AcaoAuditoria,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

type RegistrarAuditoriaParams = {
  acao: AcaoAuditoria;
  entidade: string;
  entidadeId?: string | null;
  descricao: string;

  usuarioId?: string | null;
  usuarioNome?: string | null;
  usuarioEmail?: string | null;

  dadosAnteriores?: unknown;
  dadosNovos?: unknown;

  request?: Request;
};

const CAMPOS_SENSIVEIS = new Set([
  "senha",
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "secret",
  "apikey",
  "api_key",
  "chave",
  "credencial",
]);

function normalizarNomeCampo(campo: string) {
  return campo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

function campoEhSensivel(campo: string) {
  const campoNormalizado = normalizarNomeCampo(campo);

  return Array.from(CAMPOS_SENSIVEIS).some(
    (campoSensivel) =>
      campoNormalizado === campoSensivel ||
      campoNormalizado.includes(campoSensivel)
  );
}

function limparDadosSensiveis(
  valor: unknown
): Prisma.InputJsonValue {
  if (valor === null) {
    return "null";
  }

  if (valor instanceof Date) {
    return valor.toISOString();
  }

  if (typeof valor === "bigint") {
    return valor.toString();
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number" ||
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (Array.isArray(valor)) {
    return valor.map((item) =>
      limparDadosSensiveis(item)
    );
  }

  if (typeof valor === "object") {
    const objeto = valor as Record<string, unknown>;

    const resultado: Record<
      string,
      Prisma.InputJsonValue
    > = {};

    for (const [campo, conteudo] of Object.entries(
      objeto
    )) {
      if (campoEhSensivel(campo)) {
        resultado[campo] = "[DADO PROTEGIDO]";
        continue;
      }

      if (conteudo === undefined) {
        continue;
      }

      resultado[campo] =
        limparDadosSensiveis(conteudo);
    }

    return resultado;
  }

  return String(valor);
}

function obterIp(request?: Request) {
  if (!request) {
    return null;
  }

  const forwardedFor = request.headers.get(
    "x-forwarded-for"
  );

  if (forwardedFor) {
    return (
      forwardedFor
        .split(",")
        .map((ip) => ip.trim())
        .find(Boolean) ?? null
    );
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    null
  );
}

function obterRota(request?: Request) {
  if (!request) {
    return null;
  }

  try {
    return new URL(request.url).pathname;
  } catch {
    return null;
  }
}

export async function registrarAuditoria({
  acao,
  entidade,
  entidadeId,
  descricao,
  usuarioId,
  usuarioNome,
  usuarioEmail,
  dadosAnteriores,
  dadosNovos,
  request,
}: RegistrarAuditoriaParams): Promise<boolean> {
  try {
    await prisma.logAuditoria.create({
      data: {
        acao,
        entidade,
        entidadeId: entidadeId ?? null,
        descricao,

        usuarioId: usuarioId ?? null,
        usuarioNome: usuarioNome ?? null,
        usuarioEmail: usuarioEmail ?? null,

        dadosAnteriores:
          dadosAnteriores === undefined
            ? undefined
            : limparDadosSensiveis(
                dadosAnteriores
              ),

        dadosNovos:
          dadosNovos === undefined
            ? undefined
            : limparDadosSensiveis(dadosNovos),

        ip: obterIp(request),

        userAgent:
          request?.headers.get("user-agent") ??
          null,

        rota: obterRota(request),

        metodo: request?.method ?? null,
      },
    });

    return true;
  } catch (error) {
    console.error(
      "Erro ao registrar log de auditoria:",
      error
    );

    return false;
  }
}