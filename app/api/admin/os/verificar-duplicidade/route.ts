
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";

/*
 * ============================================================
 * DETECTOR INTELIGENTE DE POSSÍVEL DUPLICIDADE DE OS
 * ============================================================
 *
 * Princípios:
 * - mesma máquina NÃO significa automaticamente duplicidade;
 * - texto parecido sozinho NÃO significa automaticamente duplicidade;
 * - problemas semanticamente equivalentes devem ser reconhecidos;
 * - problemas claramente diferentes devem ser descartados;
 * - OS concluída só alerta em situação muito recente e muito semelhante;
 * - o sistema apenas AVISA: nunca bloqueia a criação.
 */

const STOPWORDS = new Set([
  "a", "as", "ao", "aos", "o", "os", "de", "da", "das", "do", "dos",
  "e", "em", "na", "nas", "no", "nos", "para", "por", "com", "um",
  "uma", "uns", "umas", "que", "esta", "estava", "estar", "esse", "essa",
  "isso", "foi", "ser", "tem", "muito", "mais", "menos", "sobre", "entre",
  "desde", "favor", "verificar", "verifica", "olhar", "avaliar", "checar",
]);

const PALAVRAS_GENERICAS = new Set([
  "problema", "defeito", "falha", "maquina", "equipamento", "peca",
  "componente", "sistema", "manutencao", "verificar",
]);

type RegraSemantica = {
  id: string;
  label: string;
  padroes: RegExp[];
};

const CONCEITOS: RegraSemantica[] = [
  {
    id: "EXPOSICAO",
    label: "componente exposto / proteção ausente",
    padroes: [
      /\bexpost[oa]s?\b/,
      /\ba mostra\b/,
      /\bsem protecao\b/,
      /\bprotecao ausente\b/,
      /\bprotecao removida\b/,
      /\bprotecao retirada\b/,
      /\bdesprotegido\b/,
      /\bcarcaca aberta\b/,
    ],
  },
  {
    id: "VAZAMENTO",
    label: "vazamento",
    padroes: [
      /\bvazamento\b/,
      /\bvazando\b/,
      /\bvaza\b/,
      /\bperda de oleo\b/,
      /\bperdendo oleo\b/,
      /\bpingando\b/,
      /\bgotejando\b/,
      /\bescorrendo\b/,
      /\bfuga de (oleo|agua|ar|fluido)\b/,
    ],
  },
  {
    id: "RUIDO",
    label: "ruído / barulho anormal",
    padroes: [
      /\bruido\b/,
      /\bbarulho\b/,
      /\broncando\b/,
      /\bronco\b/,
      /\bchiando\b/,
      /\bchiado\b/,
      /\bestalando\b/,
      /\bestalo\b/,
    ],
  },
  {
    id: "VIBRACAO",
    label: "vibração",
    padroes: [
      /\bvibracao\b/,
      /\bvibrando\b/,
      /\btrepidacao\b/,
      /\btrepidando\b/,
    ],
  },
  {
    id: "SUPERAQUECIMENTO",
    label: "superaquecimento",
    padroes: [
      /\bsuperaquecimento\b/,
      /\bsuperaquecendo\b/,
      /\baquecendo demais\b/,
      /\bmuito quente\b/,
      /\btemperatura alta\b/,
      /\besquentando\b/,
    ],
  },
  {
    id: "TRAVAMENTO",
    label: "travamento",
    padroes: [
      /\btravando\b/,
      /\btravado\b/,
      /\btravamento\b/,
      /\benroscando\b/,
      /\bemperrando\b/,
      /\bpreso\b/,
      /\bnao gira\b/,
      /\bnao movimenta\b/,
    ],
  },
  {
    id: "DESALINHAMENTO",
    label: "desalinhamento",
    padroes: [
      /\bdesalinhad[oa]\b/,
      /\bdesalinhamento\b/,
      /\bfora de alinhamento\b/,
      /\btorto\b/,
    ],
  },
  {
    id: "FOLGA",
    label: "folga",
    padroes: [
      /\bfolga\b/,
      /\bfroux[oa]\b/,
      /\bfolgado\b/,
      /\bsolto\b/,
      /\bafrouxado\b/,
    ],
  },
  {
    id: "DESGASTE",
    label: "desgaste",
    padroes: [
      /\bdesgaste\b/,
      /\bgasto\b/,
      /\bgasta\b/,
      /\bdesgastad[oa]\b/,
      /\bconsumido\b/,
    ],
  },
  {
    id: "QUEBRA",
    label: "quebra / rompimento",
    padroes: [
      /\bquebrad[oa]\b/,
      /\bquebrou\b/,
      /\bquebra\b/,
      /\brompid[oa]\b/,
      /\brompeu\b/,
      /\bpartid[oa]\b/,
      /\btrincad[oa]\b/,
      /\btrinca\b/,
      /\brachad[oa]\b/,
    ],
  },
  {
    id: "NAO_LIGA",
    label: "não liga / falha de partida",
    padroes: [
      /\bnao liga\b/,
      /\bnao inicia\b/,
      /\bnao parte\b/,
      /\bsem partida\b/,
      /\bfalha na partida\b/,
      /\bnao aciona\b/,
    ],
  },
  {
    id: "SEM_ENERGIA",
    label: "falta de energia / alimentação elétrica",
    padroes: [
      /\bsem energia\b/,
      /\bsem alimentacao\b/,
      /\bsem tensao\b/,
      /\bsem corrente\b/,
      /\bfalta de energia\b/,
      /\bfalta de tensao\b/,
    ],
  },
  {
    id: "CURTO_ELETRICO",
    label: "falha elétrica / curto",
    padroes: [
      /\bcurto\b/,
      /\bcurto circuito\b/,
      /\bdesarme\b/,
      /\bdesarmando\b/,
      /\bdisjuntor desarma\b/,
      /\bfalha eletrica\b/,
      /\bqueimou\b/,
      /\bqueimado\b/,
    ],
  },
  {
    id: "SUJEIRA",
    label: "sujeira / acúmulo",
    padroes: [
      /\bsujeira\b/,
      /\bsujo\b/,
      /\bacumulo\b/,
      /\bentupido\b/,
      /\bentupimento\b/,
      /\bobstruido\b/,
      /\bobstrucao\b/,
    ],
  },
  {
    id: "CORROSAO",
    label: "corrosão / oxidação",
    padroes: [
      /\bcorrosao\b/,
      /\boxidacao\b/,
      /\boxidado\b/,
      /\bferrugem\b/,
      /\benferrujado\b/,
    ],
  },
  {
    id: "LUBRIFICACAO",
    label: "falta de lubrificação",
    padroes: [
      /\bsem lubrificacao\b/,
      /\bfalta de lubrificacao\b/,
      /\bsem graxa\b/,
      /\bfalta de graxa\b/,
    ],
  },
  {
    id: "PRESSAO",
    label: "pressão incorreta",
    padroes: [
      /\bsem pressao\b/,
      /\bbaixa pressao\b/,
      /\bpressao baixa\b/,
      /\bpressao alta\b/,
      /\bperda de pressao\b/,
    ],
  },
  {
    id: "TEMPERATURA",
    label: "temperatura incorreta",
    padroes: [
      /\btemperatura baixa\b/,
      /\bnao aquece\b/,
      /\bnao esquenta\b/,
      /\btemperatura incorreta\b/,
      /\btemperatura oscilando\b/,
    ],
  },
  {
    id: "VELOCIDADE",
    label: "velocidade incorreta",
    padroes: [
      /\bvelocidade baixa\b/,
      /\bvelocidade alta\b/,
      /\bvelocidade oscilando\b/,
      /\bnao atinge velocidade\b/,
      /\blento\b/,
      /\blenta\b/,
    ],
  },
  {
    id: "PARADA",
    label: "equipamento parado / sem funcionamento",
    padroes: [
      /\bparou\b/,
      /\bparada\b/,
      /\bparado\b/,
      /\bnao funciona\b/,
      /\bsem funcionar\b/,
      /\binoperante\b/,
    ],
  },
];

const COMPONENTES: RegraSemantica[] = [
  { id: "ENGRENAGEM", label: "engrenagem", padroes: [/\bengrenagem\b/, /\bengrenagens\b/] },
  { id: "ROLAMENTO", label: "rolamento", padroes: [/\brolamento\b/, /\brolamentos\b/] },
  { id: "MOTOR", label: "motor", padroes: [/\bmotor\b/, /\bmotores\b/] },
  { id: "REDUTOR", label: "redutor", padroes: [/\bredutor\b/, /\bmotorredutor\b/, /\bmotoredutor\b/] },
  { id: "CORREIA", label: "correia", padroes: [/\bcorreia\b/, /\bcorreias\b/] },
  { id: "CORRENTE", label: "corrente", padroes: [/\bcorrente\b/, /\bcorrentes\b/] },
  { id: "POLIA", label: "polia", padroes: [/\bpolia\b/, /\bpolias\b/] },
  { id: "BOMBA", label: "bomba", padroes: [/\bbomba\b/, /\bbombas\b/] },
  { id: "VALVULA", label: "válvula", padroes: [/\bvalvula\b/, /\bvalvulas\b/] },
  { id: "MANGUEIRA", label: "mangueira", padroes: [/\bmangueira\b/, /\bmangueiras\b/] },
  { id: "CILINDRO", label: "cilindro", padroes: [/\bcilindro\b/, /\bcilindros\b/] },
  { id: "PISTAO", label: "pistão", padroes: [/\bpistao\b/, /\bpistoes\b/] },
  { id: "SENSOR", label: "sensor", padroes: [/\bsensor\b/, /\bsensores\b/] },
  { id: "INVERSOR", label: "inversor", padroes: [/\binversor\b/, /\binversores\b/] },
  { id: "PAINEL", label: "painel elétrico", padroes: [/\bpainel\b/, /\bquadro eletrico\b/] },
  { id: "DISJUNTOR", label: "disjuntor", padroes: [/\bdisjuntor\b/, /\bdisjuntores\b/] },
  { id: "CABO", label: "cabo / fiação", padroes: [/\bcabo\b/, /\bcabos\b/, /\bfiacao\b/, /\bfio\b/, /\bfios\b/] },
  { id: "ESTEIRA", label: "esteira", padroes: [/\besteira\b/, /\besteiras\b/] },
  { id: "ROSCA", label: "rosca", padroes: [/\brosca\b/, /\broscas\b/] },
  { id: "EIXO", label: "eixo", padroes: [/\beixo\b/, /\beixos\b/] },
  { id: "ACOPLAMENTO", label: "acoplamento", padroes: [/\bacoplamento\b/, /\bacoplamentos\b/] },
  { id: "PROTECAO", label: "proteção", padroes: [/\bprotecao\b/, /\bgrade\b/, /\bcarenagem\b/, /\btampa\b/, /\bcarcaca\b/] },
];

const SUBSTITUICOES_SEMANTICAS: Array<[RegExp, string]> = [
  [/\ba mostra\b/g, " exposto "],
  [/\bsem protecao\b/g, " exposto "],
  [/\bprotecao ausente\b/g, " exposto "],
  [/\bprotecao removida\b/g, " exposto "],
  [/\bprotecao retirada\b/g, " exposto "],
  [/\bdesprotegido\b/g, " exposto "],
  [/\bvazando\b/g, " vazamento "],
  [/\bvaza\b/g, " vazamento "],
  [/\bpingando\b/g, " vazamento "],
  [/\bgotejando\b/g, " vazamento "],
  [/\bperdendo oleo\b/g, " vazamento oleo "],
  [/\bbarulho\b/g, " ruido "],
  [/\broncando\b/g, " ruido "],
  [/\bronco\b/g, " ruido "],
  [/\bchiando\b/g, " ruido "],
  [/\bchiado\b/g, " ruido "],
  [/\besquentando\b/g, " superaquecimento "],
  [/\baquecendo demais\b/g, " superaquecimento "],
  [/\bmuito quente\b/g, " superaquecimento "],
  [/\btravando\b/g, " travamento "],
  [/\btravado\b/g, " travamento "],
  [/\benroscando\b/g, " travamento "],
  [/\bemperrando\b/g, " travamento "],
  [/\bfrouxo\b/g, " folga "],
  [/\bfrouxa\b/g, " folga "],
  [/\bfolgado\b/g, " folga "],
  [/\bsolto\b/g, " folga "],
  [/\bquebrou\b/g, " quebrado "],
  [/\brompeu\b/g, " quebrado "],
  [/\brompido\b/g, " quebrado "],
  [/\bpartido\b/g, " quebrado "],
  [/\bnao liga\b/g, " falha partida "],
  [/\bnao inicia\b/g, " falha partida "],
  [/\bnao parte\b/g, " falha partida "],
  [/\bnao aciona\b/g, " falha partida "],
  [/\bnao funciona\b/g, " equipamento parado "],
  [/\bsem funcionar\b/g, " equipamento parado "],
  [/\binoperante\b/g, " equipamento parado "],
];

function normalizarBasico(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarTexto(valor: string) {
  let texto = normalizarBasico(valor);

  for (const [padrao, substituicao] of SUBSTITUICOES_SEMANTICAS) {
    texto = texto.replace(padrao, substituicao);
  }

  return texto.replace(/\s+/g, " ").trim();
}

function tokensRelevantes(valor: string) {
  return normalizarTexto(valor)
    .split(" ")
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function distanciaLevenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const atual = [i];

    for (let j = 1; j <= b.length; j += 1) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(
        atual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + custo
      );
    }

    anterior = atual;
  }

  return anterior[b.length];
}

function similaridadeToken(a: string, b: string) {
  if (a === b) return 1;

  const menor = Math.min(a.length, b.length);
  const maior = Math.max(a.length, b.length);

  if (menor < 4) return 0;

  if (menor >= 5 && (a.startsWith(b) || b.startsWith(a))) {
    return menor / maior >= 0.78 ? 0.9 : 0;
  }

  const distancia = distanciaLevenshtein(a, b);
  const similaridade = 1 - distancia / maior;

  if (maior >= 7 && similaridade >= 0.84) return similaridade;
  if (maior >= 5 && similaridade >= 0.88) return similaridade;

  return 0;
}

function similaridadeTokensFuzzy(a: string, b: string) {
  const tokensA = [...new Set(tokensRelevantes(a))];
  const tokensB = [...new Set(tokensRelevantes(b))];

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const usados = new Set<number>();
  let soma = 0;
  let correspondencias = 0;

  for (const tokenA of tokensA) {
    let melhorIndice = -1;
    let melhor = 0;

    for (let i = 0; i < tokensB.length; i += 1) {
      if (usados.has(i)) continue;
      const sim = similaridadeToken(tokenA, tokensB[i]);
      if (sim > melhor) {
        melhor = sim;
        melhorIndice = i;
      }
    }

    if (melhorIndice >= 0 && melhor >= 0.8) {
      usados.add(melhorIndice);
      soma += melhor;
      correspondencias += 1;
    }
  }

  if (correspondencias === 0) return 0;

  const coberturaMenor = soma / Math.min(tokensA.length, tokensB.length);
  const coberturaMaior = soma / Math.max(tokensA.length, tokensB.length);

  return Math.min(1, coberturaMenor * 0.65 + coberturaMaior * 0.35);
}

function ngrams(texto: string, tamanho = 3) {
  const limpo = normalizarTexto(texto).replaceAll(" ", "");
  if (limpo.length < tamanho) return limpo ? [limpo] : [];

  const resultado: string[] = [];
  for (let i = 0; i <= limpo.length - tamanho; i += 1) {
    resultado.push(limpo.slice(i, i + tamanho));
  }
  return resultado;
}

function similaridadeCaracteres(a: string, b: string) {
  const aNgrams = ngrams(a);
  const bNgrams = ngrams(b);
  if (aNgrams.length === 0 || bNgrams.length === 0) return 0;

  const mapa = new Map<string, number>();
  for (const item of aNgrams) {
    mapa.set(item, (mapa.get(item) ?? 0) + 1);
  }

  let intersecao = 0;
  for (const item of bNgrams) {
    const quantidade = mapa.get(item) ?? 0;
    if (quantidade > 0) {
      intersecao += 1;
      mapa.set(item, quantidade - 1);
    }
  }

  return (2 * intersecao) / (aNgrams.length + bNgrams.length);
}

function extrairRegras(textoOriginal: string, regras: RegraSemantica[]) {
  const texto = normalizarBasico(textoOriginal);
  return regras.filter((regra) => regra.padroes.some((padrao) => padrao.test(texto)));
}

function intersecaoRegras(a: RegraSemantica[], b: RegraSemantica[]) {
  const idsB = new Set(b.map((item) => item.id));
  return a.filter((item) => idsB.has(item.id));
}

function apenasTokensEspecificos(texto: string) {
  return tokensRelevantes(texto).filter((token) => !PALAVRAS_GENERICAS.has(token));
}

function similaridadeLexical(a: string, b: string) {
  const normalizadoA = normalizarTexto(a);
  const normalizadoB = normalizarTexto(b);

  if (!normalizadoA || !normalizadoB) return 0;
  if (normalizadoA === normalizadoB) return 1;

  const fuzzy = similaridadeTokensFuzzy(a, b);
  const caracteres = similaridadeCaracteres(a, b);
  const tokensA = apenasTokensEspecificos(a);
  const tokensB = apenasTokensEspecificos(b);
  const curto = Math.min(tokensA.length, tokensB.length) <= 3;

  return Math.min(
    1,
    curto ? fuzzy * 0.82 + caracteres * 0.18 : fuzzy * 0.7 + caracteres * 0.3
  );
}

type AnaliseSemantica = {
  afinidade: number;
  lexical: number;
  conceitosComuns: RegraSemantica[];
  componentesComuns: RegraSemantica[];
  conceitosA: RegraSemantica[];
  conceitosB: RegraSemantica[];
  componentesA: RegraSemantica[];
  componentesB: RegraSemantica[];
  conflitoDeDefeito: boolean;
};

function analisarSemantica(
  descricaoNova: string,
  descricaoExistente: string
): AnaliseSemantica {
  const lexical = similaridadeLexical(descricaoNova, descricaoExistente);
  const conceitosA = extrairRegras(descricaoNova, CONCEITOS);
  const conceitosB = extrairRegras(descricaoExistente, CONCEITOS);
  const componentesA = extrairRegras(descricaoNova, COMPONENTES);
  const componentesB = extrairRegras(descricaoExistente, COMPONENTES);
  const conceitosComuns = intersecaoRegras(conceitosA, conceitosB);
  const componentesComuns = intersecaoRegras(componentesA, componentesB);

  const temConceitosNosDois = conceitosA.length > 0 && conceitosB.length > 0;
  const temComponentesNosDois = componentesA.length > 0 && componentesB.length > 0;
  const conflitoDeDefeito = temConceitosNosDois && conceitosComuns.length === 0;

  let afinidade = lexical;

  if (conceitosComuns.length > 0) {
    const bonusConceito = Math.min(0.58, 0.42 + conceitosComuns.length * 0.08);
    afinidade = Math.max(afinidade, bonusConceito + lexical * 0.28);
  }

  if (componentesComuns.length > 0) {
    afinidade = Math.min(1, afinidade + Math.min(0.16, componentesComuns.length * 0.08));
  }

  if (
    temComponentesNosDois &&
    componentesComuns.length === 0 &&
    conceitosComuns.length === 0
  ) {
    afinidade *= 0.62;
  }

  if (conflitoDeDefeito) {
    afinidade *= 0.48;
  }

  return {
    afinidade: Math.min(1, afinidade),
    lexical,
    conceitosComuns,
    componentesComuns,
    conceitosA,
    conceitosB,
    componentesA,
    componentesB,
    conflitoDeDefeito,
  };
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
  if (score >= 86) return "ALTA" as const;
  if (score >= 73) return "POSSIVEL" as const;
  return "ATENCAO" as const;
}

function diferencaDias(data: Date, agora: number) {
  return Math.max(0, (agora - data.getTime()) / 86_400_000);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
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
    limiteHistorico.setDate(limiteHistorico.getDate() - 60);

    const candidatas = await prisma.ordemServico.findMany({
      where: {
        empresaId,
        createdAt: { gte: limiteHistorico },
        status: { in: ["NAO_INICIADA", "EM_ANDAMENTO", "CONCLUIDA"] },
        OR: [{ maquinaId }, { setorId }],
      },
      select: {
        id: true,
        numero: true,
        titulo: true,
        descricao: true,
        status: true,
        prioridade: true,
        createdAt: true,
        dataConclusao: true,
        setorId: true,
        maquinaId: true,
        setor: { select: { id: true, nome: true } },
        maquina: { select: { id: true, nome: true } },
        responsaveis: {
          select: {
            user: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const agora = Date.now();

    const suspeitas = candidatas
      .map((os) => {
        const mesmaMaquina = os.maquinaId === maquinaId;
        const mesmoSetor = os.setorId === setorId;
        const aberta = os.status === "NAO_INICIADA" || os.status === "EM_ANDAMENTO";
        const idadeDias = diferencaDias(os.createdAt, agora);
        const analise = analisarSemantica(descricao, os.descricao);

        const {
          afinidade,
          lexical,
          conceitosComuns,
          componentesComuns,
          conceitosA,
          conceitosB,
          conflitoDeDefeito,
        } = analise;

        /* Outra máquina: só passa com evidência extremamente forte. */
        if (!mesmaMaquina) {
          const evidenciaMuitoForte =
            aberta &&
            idadeDias <= 7 &&
            afinidade >= 0.9 &&
            lexical >= 0.76;

          if (!evidenciaMuitoForte) return null;
        }

        /* Mesma máquina, mas defeitos claramente diferentes: descarta. */
        if (mesmaMaquina && conflitoDeDefeito) {
          const textoQuaseIgual = lexical >= 0.9 && afinidade >= 0.82;
          if (!textoQuaseIgual) return null;
        }

        /* Mesma máquina aberta: exige evidência semântica real. */
        if (mesmaMaquina && aberta) {
          const temConceitoComum = conceitosComuns.length > 0;
          const evidenciaSemantica = temConceitoComum
            ? afinidade >= 0.5
            : afinidade >= 0.68 && lexical >= 0.58;

          if (!evidenciaSemantica) return null;
        }

        /* Concluída: regra bem mais conservadora para não confundir recorrência com duplicidade. */
        if (os.status === "CONCLUIDA") {
          const referencia = os.dataConclusao ?? os.createdAt;
          const diasDesdeConclusao = diferencaDias(referencia, agora);

          const evidenciaConcluida =
            mesmaMaquina &&
            diasDesdeConclusao <= 5 &&
            afinidade >= 0.82 &&
            (lexical >= 0.72 || conceitosComuns.length > 0);

          if (!evidenciaConcluida) return null;
        }

        let score = 0;
        const motivos: string[] = [];

        if (mesmaMaquina) {
          score += 24;
          motivos.push("Mesma máquina/equipamento");
        } else if (mesmoSetor) {
          score += 4;
          motivos.push("Mesmo setor");
        }

        score += Math.round(afinidade * 45);

        if (conceitosComuns.length > 0) {
          score += Math.min(14, 8 + conceitosComuns.length * 3);
          motivos.push(
            `Mesmo tipo de problema: ${conceitosComuns
              .map((conceito) => conceito.label)
              .join(", ")}`
          );
        } else if (afinidade >= 0.84) {
          motivos.push("Descrições muito semelhantes");
        } else if (afinidade >= 0.68) {
          motivos.push("Descrições semelhantes");
        }

        if (componentesComuns.length > 0) {
          score += Math.min(8, componentesComuns.length * 4);
          motivos.push(
            `Mesmo componente citado: ${componentesComuns
              .map((componente) => componente.label)
              .join(", ")}`
          );
        }

        if (aberta) {
          score += 10;
          motivos.push("OS ainda aberta");
        } else {
          score += 1;
        }

        if (idadeDias <= 1) {
          score += 10;
          motivos.push("Criada nas últimas 24 horas");
        } else if (idadeDias <= 3) {
          score += 8;
          motivos.push("Criada nos últimos 3 dias");
        } else if (idadeDias <= 7) {
          score += 5;
          motivos.push("Criada nos últimos 7 dias");
        } else if (idadeDias <= 15) {
          score += 2;
        }

        if (conceitosA.length === 0 && conceitosB.length === 0 && lexical < 0.7) {
          score -= 8;
        }

        if (
          analise.componentesA.length > 0 &&
          analise.componentesB.length > 0 &&
          componentesComuns.length === 0 &&
          conceitosComuns.length === 0
        ) {
          score -= 12;
        }

        score = Math.max(0, Math.min(100, score));

        /* Limite final conservador: evita alertas fracos. */
        if (score < 68) return null;

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
          similaridadeTexto: Math.round(afinidade * 100),
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
        (suspeita): suspeita is NonNullable<typeof suspeita> => suspeita !== null
      )
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 3);

    return NextResponse.json({
      encontrouPossivelDuplicidade: suspeitas.length > 0,
      suspeitas,
    });
  } catch (error) {
    console.error("Erro ao verificar duplicidade de OS:", error);

    return NextResponse.json(
      {
        error: "Não foi possível verificar possíveis duplicidades agora.",
      },
      { status: 500 }
    );
  }
}
