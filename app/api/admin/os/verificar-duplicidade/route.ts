import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

const STOPWORDS = new Set([
  "a",
  "as",
  "ao",
  "aos",
  "o",
  "os",
  "de",
  "da",
  "das",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "para",
  "por",
  "com",
  "sem",
  "um",
  "uma",
  "uns",
  "umas",
  "que",
  "esta",
  "está",
  "esse",
  "essa",
  "isso",
  "foi",
  "ser",
  "tem",
  "esta",
  "muito",
  "mais",
  "menos",
  "sobre",
  "entre",
  "desde",
]);

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensRelevantes(valor: string) {
  return normalizarTexto(valor)
    .split(" ")
    .filter(
      (token) => token.length >= 3 && !STOPWORDS.has(token)
    );
}

function coeficienteDiceCaracteres(a: string, b: string) {
  const textoA = normalizarTexto(a).replaceAll(" ", "");
  const textoB = normalizarTexto(b).replaceAll(" ", "");

  if (!textoA || !textoB) return 0;
  if (textoA === textoB) return 1;

  if (textoA.length < 2 || textoB.length < 2) {
    return textoA === textoB ? 1 : 0;
  }

  const paresA = new Map<string, number>();

  for (let i = 0; i < textoA.length - 1; i += 1) {
    const par = textoA.slice(i, i + 2);
    paresA.set(par, (paresA.get(par) ?? 0) + 1);
  }

  let intersecao = 0;

  for (let i = 0; i < textoB.length - 1; i += 1) {
    const par = textoB.slice(i, i + 2);
    const quantidade = paresA.get(par) ?? 0;

    if (quantidade > 0) {
      intersecao += 1;
      paresA.set(par, quantidade - 1);
    }
  }

  return (
    (2 * intersecao) /
    (textoA.length - 1 + (textoB.length - 1))
  );
}

function similaridadeTokens(a: string, b: string) {
  const tokensA = new Set(tokensRelevantes(a));
  const tokensB = new Set(tokensRelevantes(b));

  if (tokensA.size === 0 || tokensB.size === 0) {
    return 0;
  }

  let intersecao = 0;

  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersecao += 1;
    }
  }

  const uniao = new Set([...tokensA, ...tokensB]).size;
  const jaccard = uniao > 0 ? intersecao / uniao : 0;
  const sobreposicao =
    intersecao / Math.min(tokensA.size, tokensB.size);

  return jaccard * 0.45 + sobreposicao * 0.55;
}

function similaridadeTexto(a: string, b: string) {
  const normalizadoA = normalizarTexto(a);
  const normalizadoB = normalizarTexto(b);

  if (!normalizadoA || !normalizadoB) return 0;
  if (normalizadoA === normalizadoB) return 1;

  const tokens = similaridadeTokens(a, b);
  const caracteres = coeficienteDiceCaracteres(a, b);

  return Math.min(
    1,
    Math.max(tokens, tokens * 0.65 + caracteres * 0.35)
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
  };

  return labels[status] ?? status;
}

function nivelDoScore(score: number) {
  if (score >= 85) return "ALTA" as const;
  if (score >= 70) return "POSSIVEL" as const;
  return "ATENCAO" as const;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const empresaId = String(body?.empresaId ?? "").trim();
    const setorId = String(body?.setorId ?? "").trim();
    const maquinaId = String(body?.maquinaId ?? "").trim();
    const descricao = String(body?.descricao ?? "").trim();

    if (!empresaId || !setorId || !maquinaId || !descricao) {
      return NextResponse.json(
        {
          error:
            "Empresa, setor, máquina e descrição são obrigatórios para verificar duplicidade.",
        },
        { status: 400 }
      );
    }

    const limiteHistorico = new Date();
    limiteHistorico.setDate(limiteHistorico.getDate() - 90);

    const candidatas = await prisma.ordemServico.findMany({
      where: {
        empresaId,
        createdAt: {
          gte: limiteHistorico,
        },
        status: {
          in: ["NAO_INICIADA", "EM_ANDAMENTO", "CONCLUIDA"],
        },
        OR: [
          {
            maquinaId,
          },
          {
            setorId,
          },
        ],
      },
      select: {
        id: true,
        numero: true,
        titulo: true,
        descricao: true,
        status: true,
        prioridade: true,
        createdAt: true,
        setorId: true,
        maquinaId: true,
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
          select: {
            user: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 80,
    });

    const agora = Date.now();

    const suspeitas = candidatas
      .map((os) => {
        const mesmaMaquina = os.maquinaId === maquinaId;
        const mesmoSetor = os.setorId === setorId;
        const similaridade = similaridadeTexto(
          descricao,
          os.descricao
        );

        /*
         * Uma OS da mesma máquina com texto praticamente sem relação
         * não deve gerar alerta só porque o equipamento é o mesmo.
         */
        if (mesmaMaquina && similaridade < 0.2) {
          return null;
        }

        /*
         * Se for outra máquina do mesmo setor, exigimos uma descrição
         * muito parecida para considerar como possível duplicidade.
         */
        if (!mesmaMaquina && similaridade < 0.72) {
          return null;
        }

        let score = 0;
        const motivos: string[] = [];

        if (mesmaMaquina) {
          score += 30;
          motivos.push("Mesma máquina/equipamento");
        } else if (mesmoSetor) {
          score += 7;
          motivos.push("Mesmo setor");
        }

        const pontosTexto = Math.round(similaridade * 45);
        score += pontosTexto;

        if (similaridade >= 0.8) {
          motivos.push("Descrição muito semelhante");
        } else if (similaridade >= 0.55) {
          motivos.push("Descrição semelhante");
        } else if (similaridade >= 0.3) {
          motivos.push("Descrição parcialmente semelhante");
        }

        if (
          os.status === "NAO_INICIADA" ||
          os.status === "EM_ANDAMENTO"
        ) {
          score += 15;
          motivos.push("OS ainda aberta");
        } else if (os.status === "CONCLUIDA") {
          score += 2;
        }

        const idadeDias = Math.max(
          0,
          (agora - os.createdAt.getTime()) / 86_400_000
        );

        if (idadeDias <= 3) {
          score += 10;
          motivos.push("Criada nos últimos 3 dias");
        } else if (idadeDias <= 7) {
          score += 8;
          motivos.push("Criada nos últimos 7 dias");
        } else if (idadeDias <= 30) {
          score += 5;
          motivos.push("Criada nos últimos 30 dias");
        } else {
          score += 2;
        }

        score = Math.min(100, score);

        if (score < 60) {
          return null;
        }

        return {
          id: os.id,
          numero: os.numero,
          titulo: os.titulo,
          descricao: os.descricao,
          status: statusLabel(os.status),
          prioridade: os.prioridade,
          createdAt: os.createdAt.toISOString(),
          score,
          nivel: nivelDoScore(score),
          similaridadeTexto: Math.round(similaridade * 100),
          motivos,
          setor: os.setor,
          maquina: os.maquina,
          responsaveis: os.responsaveis.map((responsavel) => ({
            id: responsavel.user.id,
            nome: responsavel.user.nome,
          })),
        };
      })
      .filter(
        (
          suspeita
        ): suspeita is NonNullable<typeof suspeita> =>
          suspeita !== null
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return NextResponse.json({
      encontrouPossivelDuplicidade: suspeitas.length > 0,
      suspeitas,
    });
  } catch (error) {
    console.error("Erro ao verificar duplicidade de OS:", error);

    return NextResponse.json(
      {
        error:
          "Não foi possível verificar possíveis duplicidades agora.",
      },
      { status: 500 }
    );
  }
}
