import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  BrainCircuit,
  CalendarClock,
  ClipboardX,
  Repeat2,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import PainelReincidenciasInteligentes, {
  type ReincidenciaPainel,
} from "@/components/PainelReincidenciasInteligentes";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

const DIA_MS = 86_400_000;

type OrdemInteligencia = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  createdAt: Date;
  updatedAt: Date;
  dataPrevista: Date | null;
  dataConclusao: Date | null;
  registroFinal: string | null;
  setorId: string;
  maquinaId: string | null;
  setor: {
    id: string;
    nome: string;
  };
  maquina: {
    id: string;
    nome: string;
  } | null;
  responsaveis: Array<{
    user: {
      id: string;
      nome: string;
    };
  }>;
};

type ConceitoFalha = {
  id: string;
  label: string;
  padroes: RegExp[];
  generico?: boolean;
};

type ComponenteFalha = {
  id: string;
  label: string;
  padroes: RegExp[];
};

type Reincidencia = {
  chave: string;
  maquinaId: string;
  maquinaNome: string;
  setorNome: string;
  conceitoId: string;
  conceitoLabel: string;
  componenteLabel: string | null;
  ocorrencias: OrdemInteligencia[];
  total: number;
  abertas: number;
  urgentes: number;
  janelaDias: number;
  nivel: "ALTA" | "MODERADA";
};

const CONCEITOS_FALHA: ConceitoFalha[] = [
  {
    id: "VAZAMENTO",
    label: "Vazamento",
    padroes: [
      /\bvazamento\b/,
      /\bvazando\b/,
      /\bgotejando\b/,
      /\bpingando\b/,
      /\bescorrendo\b/,
      /\bperdendo oleo\b/,
      /\bfuga de (oleo|agua|ar|fluido)\b/,
    ],
  },
  {
    id: "RUIDO",
    label: "Ruído / barulho anormal",
    padroes: [
      /\bruido\b/,
      /\bbarulho\b/,
      /\broncando\b/,
      /\bronco\b/,
      /\bchiado\b/,
      /\bchiando\b/,
      /\bestalo\b/,
      /\bestalando\b/,
    ],
  },
  {
    id: "VIBRACAO",
    label: "Vibração",
    padroes: [
      /\bvibracao\b/,
      /\bvibrando\b/,
      /\btrepidacao\b/,
      /\btrepidando\b/,
    ],
  },
  {
    id: "SUPERAQUECIMENTO",
    label: "Superaquecimento",
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
    label: "Travamento",
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
    label: "Desalinhamento",
    padroes: [
      /\bdesalinhad[oa]\b/,
      /\bdesalinhamento\b/,
      /\bfora de alinhamento\b/,
      /\btorto\b/,
    ],
  },
  {
    id: "FOLGA",
    label: "Folga / fixação",
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
    label: "Desgaste",
    padroes: [
      /\bdesgaste\b/,
      /\bgasto\b/,
      /\bgasta\b/,
      /\bdesgastad[oa]\b/,
    ],
  },
  {
    id: "QUEBRA",
    label: "Quebra / rompimento",
    padroes: [
      /\bquebrad[oa]\b/,
      /\bquebrou\b/,
      /\brompid[oa]\b/,
      /\brompeu\b/,
      /\bpartid[oa]\b/,
      /\btrincad[oa]\b/,
      /\btrinca\b/,
      /\brachad[oa]\b/,
    ],
  },
  {
    id: "EXPOSICAO",
    label: "Proteção ausente / componente exposto",
    padroes: [
      /\bexpost[oa]s?\b/,
      /\ba mostra\b/,
      /\bsem protecao\b/,
      /\bprotecao ausente\b/,
      /\bprotecao retirada\b/,
      /\bprotecao removida\b/,
      /\bdesprotegido\b/,
    ],
  },
  {
    id: "FALHA_PARTIDA",
    label: "Falha de partida",
    padroes: [
      /\bnao liga\b/,
      /\bnao inicia\b/,
      /\bnao parte\b/,
      /\bnao aciona\b/,
      /\bfalha na partida\b/,
      /\bsem partida\b/,
    ],
  },
  {
    id: "FALHA_ELETRICA",
    label: "Falha elétrica",
    padroes: [
      /\bcurto\b/,
      /\bcurto circuito\b/,
      /\bdesarmando\b/,
      /\bdisjuntor desarma\b/,
      /\bfalha eletrica\b/,
      /\bqueimou\b/,
      /\bqueimado\b/,
      /\bsem energia\b/,
      /\bsem tensao\b/,
    ],
  },
  {
    id: "OBSTRUCAO",
    label: "Obstrução / acúmulo",
    padroes: [
      /\bentupido\b/,
      /\bentupimento\b/,
      /\bobstruido\b/,
      /\bobstrucao\b/,
      /\bacumulo\b/,
    ],
  },
  {
    id: "CORROSAO",
    label: "Corrosão / oxidação",
    padroes: [
      /\bcorrosao\b/,
      /\boxidacao\b/,
      /\boxidado\b/,
      /\bferrugem\b/,
      /\benferrujado\b/,
    ],
  },
  {
    id: "PRESSAO",
    label: "Pressão incorreta",
    padroes: [
      /\bsem pressao\b/,
      /\bbaixa pressao\b/,
      /\bpressao baixa\b/,
      /\bpressao alta\b/,
      /\bperda de pressao\b/,
    ],
  },
  {
    id: "PARADA",
    label: "Parada / sem funcionamento",
    generico: true,
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

const COMPONENTES_FALHA: ComponenteFalha[] = [
  {
    id: "ENGRENAGEM",
    label: "Engrenagem",
    padroes: [
      /\bengrenagem\b/,
      /\bengrenagens\b/,
    ],
  },
  {
    id: "ROLAMENTO",
    label: "Rolamento",
    padroes: [
      /\brolamento\b/,
      /\brolamentos\b/,
    ],
  },
  {
    id: "MOTOR",
    label: "Motor",
    padroes: [
      /\bmotor\b/,
      /\bmotores\b/,
    ],
  },
  {
    id: "REDUTOR",
    label: "Redutor",
    padroes: [
      /\bredutor\b/,
      /\bmotorredutor\b/,
      /\bmotoredutor\b/,
    ],
  },
  {
    id: "CORREIA",
    label: "Correia",
    padroes: [
      /\bcorreia\b/,
      /\bcorreias\b/,
    ],
  },
  {
    id: "CORRENTE",
    label: "Corrente",
    padroes: [
      /\bcorrente\b/,
      /\bcorrentes\b/,
    ],
  },
  {
    id: "POLIA",
    label: "Polia",
    padroes: [
      /\bpolia\b/,
      /\bpolias\b/,
    ],
  },
  {
    id: "BOMBA",
    label: "Bomba",
    padroes: [
      /\bbomba\b/,
      /\bbombas\b/,
    ],
  },
  {
    id: "VALVULA",
    label: "Válvula",
    padroes: [
      /\bvalvula\b/,
      /\bvalvulas\b/,
    ],
  },
  {
    id: "MANGUEIRA",
    label: "Mangueira",
    padroes: [
      /\bmangueira\b/,
      /\bmangueiras\b/,
    ],
  },
  {
    id: "CILINDRO",
    label: "Cilindro",
    padroes: [
      /\bcilindro\b/,
      /\bcilindros\b/,
    ],
  },
  {
    id: "PISTAO",
    label: "Pistão",
    padroes: [
      /\bpistao\b/,
      /\bpistoes\b/,
    ],
  },
  {
    id: "SENSOR",
    label: "Sensor",
    padroes: [
      /\bsensor\b/,
      /\bsensores\b/,
    ],
  },
  {
    id: "INVERSOR",
    label: "Inversor",
    padroes: [
      /\binversor\b/,
      /\binversores\b/,
    ],
  },
  {
    id: "EIXO",
    label: "Eixo",
    padroes: [
      /\beixo\b/,
      /\beixos\b/,
    ],
  },
  {
    id: "ACOPLAMENTO",
    label: "Acoplamento",
    padroes: [
      /\bacoplamento\b/,
      /\bacoplamentos\b/,
    ],
  },
  {
    id: "ESTEIRA",
    label: "Esteira",
    padroes: [
      /\besteira\b/,
      /\besteiras\b/,
    ],
  },
];

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function diasDesde(data: Date, agora: Date) {
  return Math.max(
    0,
    Math.floor(
      (agora.getTime() - data.getTime()) / DIA_MS
    )
  );
}

function formatarData(data: Date | null | undefined) {
  if (!data) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

function formatarDataHora(
  data: Date | null | undefined
) {
  if (!data) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function inicioDoDiaSaoPaulo(data: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const ano =
    partes.find(
      (parte) => parte.type === "year"
    )?.value ?? "1970";

  const mes =
    partes.find(
      (parte) => parte.type === "month"
    )?.value ?? "01";

  const dia =
    partes.find(
      (parte) => parte.type === "day"
    )?.value ?? "01";

  return new Date(
    `${ano}-${mes}-${dia}T00:00:00-03:00`
  );
}

function extrairConceito(textoOriginal: string) {
  const texto = normalizarTexto(textoOriginal);

  return (
    CONCEITOS_FALHA.find((conceito) =>
      conceito.padroes.some((padrao) =>
        padrao.test(texto)
      )
    ) ?? null
  );
}

function extrairComponente(textoOriginal: string) {
  const texto = normalizarTexto(textoOriginal);

  return (
    COMPONENTES_FALHA.find((componente) =>
      componente.padroes.some((padrao) =>
        padrao.test(texto)
      )
    ) ?? null
  );
}

function montarReincidencias(
  ordens: OrdemInteligencia[],
  agora: Date
) {
  const limite60Dias =
    agora.getTime() - 60 * DIA_MS;

  const grupos = new Map<
    string,
    {
      maquinaId: string;
      maquinaNome: string;
      setorNome: string;
      conceito: ConceitoFalha;
      componente: ComponenteFalha | null;
      ocorrencias: OrdemInteligencia[];
    }
  >();

  for (const os of ordens) {
    if (
      !os.maquina ||
      !os.maquinaId ||
      os.createdAt.getTime() < limite60Dias
    ) {
      continue;
    }

    const texto = `${os.titulo} ${os.descricao}`;
    const conceito = extrairConceito(texto);

    if (!conceito) {
      continue;
    }

    const componente = extrairComponente(texto);

    if (conceito.generico && !componente) {
      continue;
    }

    const chave =
      `${os.maquinaId}:${conceito.id}:` +
      `${componente?.id ?? "GERAL"}`;

    const grupo = grupos.get(chave);

    if (grupo) {
      grupo.ocorrencias.push(os);
      continue;
    }

    grupos.set(chave, {
      maquinaId: os.maquinaId,
      maquinaNome: os.maquina.nome,
      setorNome: os.setor.nome,
      conceito,
      componente,
      ocorrencias: [os],
    });
  }

  const reincidencias: Reincidencia[] = [];

  for (const [chave, grupo] of grupos) {
    const ocorrencias = [...grupo.ocorrencias].sort(
      (a, b) =>
        b.createdAt.getTime() -
        a.createdAt.getTime()
    );

    if (ocorrencias.length < 2) {
      continue;
    }

    const maisNova = ocorrencias[0].createdAt;
    const maisAntiga =
      ocorrencias[
        ocorrencias.length - 1
      ].createdAt;

    const janelaDias = Math.max(
      0,
      Math.ceil(
        (maisNova.getTime() -
          maisAntiga.getTime()) /
          DIA_MS
      )
    );

    const relevante =
      ocorrencias.length >= 3 ||
      (ocorrencias.length === 2 &&
        janelaDias <= 14);

    if (!relevante) {
      continue;
    }

    const abertas = ocorrencias.filter(
      (os) =>
        os.status === "NAO_INICIADA" ||
        os.status === "EM_ANDAMENTO"
    ).length;

    const urgentes = ocorrencias.filter(
      (os) =>
        os.prioridade === "URGENTE" ||
        os.prioridade === "ALTA"
    ).length;

    const nivel =
      ocorrencias.length >= 4 ||
      abertas >= 2 ||
      urgentes >= 2
        ? "ALTA"
        : "MODERADA";

    reincidencias.push({
      chave,
      maquinaId: grupo.maquinaId,
      maquinaNome: grupo.maquinaNome,
      setorNome: grupo.setorNome,
      conceitoId: grupo.conceito.id,
      conceitoLabel: grupo.conceito.label,
      componenteLabel:
        grupo.componente?.label ?? null,
      ocorrencias,
      total: ocorrencias.length,
      abertas,
      urgentes,
      janelaDias,
      nivel,
    });
  }

  return reincidencias.sort((a, b) => {
    if (a.nivel !== b.nivel) {
      return a.nivel === "ALTA" ? -1 : 1;
    }

    return b.total - a.total;
  });
}

function CardResumo({
  titulo,
  valor,
  descricao,
  icon,
  destaque = "cyan",
}: {
  titulo: string;
  valor: number;
  descricao: string;
  icon: ReactNode;
  destaque?:
    | "cyan"
    | "rose"
    | "amber"
    | "violet";
}) {
  const estilos = {
    cyan: {
      borda: "border-cyan-400/20",
      fundo: "bg-cyan-400/10",
      texto: "text-cyan-300",
    },
    rose: {
      borda: "border-rose-400/20",
      fundo: "bg-rose-400/10",
      texto: "text-rose-300",
    },
    amber: {
      borda: "border-amber-400/20",
      fundo: "bg-amber-400/10",
      texto: "text-amber-300",
    },
    violet: {
      borda: "border-violet-400/20",
      fundo: "bg-violet-400/10",
      texto: "text-violet-300",
    },
  }[destaque];

  return (
    <div
      className={`rounded-3xl border ${estilos.borda} bg-white/[0.04] p-5 shadow-xl shadow-black/20`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
            {titulo}
          </p>

          <p className="mt-3 text-4xl font-black text-white">
            {valor}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {descricao}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${estilos.fundo} ${estilos.texto}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function InteligenciaManutencaoPage() {
  const agora = new Date();
  const inicioHoje = inicioDoDiaSaoPaulo(agora);

  const [
    ordensBrutas,
    execucoesPreventivasAtrasadas,
  ] = await Promise.all([
    prisma.ordemServico.findMany({
      where: {
        status: {
          not: "CANCELADA",
        },
      },

      select: {
        id: true,
        numero: true,
        titulo: true,
        descricao: true,
        status: true,
        prioridade: true,
        createdAt: true,
        updatedAt: true,
        dataPrevista: true,
        dataConclusao: true,
        registroFinal: true,
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
    }),

    prisma.execucaoPreventiva.findMany({
      where: {
        dataProgramada: {
          lt: inicioHoje,
        },

        status: {
          in: [
            "PROGRAMADA",
            "PENDENTE",
            "EM_EXECUCAO",
          ],
        },
      },

      select: {
        id: true,
        dataProgramada: true,
        status: true,

        plano: {
          select: {
            id: true,
            titulo: true,
            prioridade: true,

            setor: {
              select: {
                nome: true,
              },
            },

            maquina: {
              select: {
                nome: true,
              },
            },
          },
        },

        responsaveis: {
          select: {
            user: {
              select: {
                nome: true,
              },
            },
          },
        },
      },

      orderBy: {
        dataProgramada: "asc",
      },

      take: 50,
    }),
  ]);

  const ordens =
    ordensBrutas as OrdemInteligencia[];

  const reincidencias = montarReincidencias(
    ordens,
    agora
  );

  const semRelatorio = ordens
    .filter(
      (os) =>
        os.status === "CONCLUIDA" &&
        !os.registroFinal?.trim()
    )
    .sort((a, b) => {
      const dataA =
        a.dataConclusao?.getTime() ??
        a.updatedAt.getTime();

      const dataB =
        b.dataConclusao?.getTime() ??
        b.updatedAt.getTime();

      return dataB - dataA;
    });

  const reincidenciasPainel: ReincidenciaPainel[] =
    reincidencias.map((item) => ({
      chave: item.chave,
      maquinaId: item.maquinaId,
      maquinaNome: item.maquinaNome,
      setorNome: item.setorNome,
      conceitoId: item.conceitoId,
      conceitoLabel: item.conceitoLabel,
      componenteLabel: item.componenteLabel,
      total: item.total,
      abertas: item.abertas,
      urgentes: item.urgentes,
      janelaDias: item.janelaDias,
      nivel: item.nivel,

      ocorrencias: item.ocorrencias.map(
        (os) => ({
          id: os.id,
          numero: os.numero,
          titulo: os.titulo,
          descricao: os.descricao,
          status: os.status,
          prioridade: os.prioridade,
          createdAt: os.createdAt.toISOString(),
        })
      ),
    }));

  const totalOcorrenciasReincidentes =
    reincidencias.reduce(
      (total, item) => total + item.total,
      0
    );

  const reincidenciasAltas =
    reincidencias.filter(
      (item) => item.nivel === "ALTA"
    ).length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] px-3 py-6 text-white sm:px-4 md:px-10">
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        <header className="overflow-hidden rounded-[30px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_34%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_30%),linear-gradient(135deg,#091224_0%,#050816_55%,#0d0b24_100%)] p-6 shadow-2xl shadow-black/30 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-950/30">
                <BrainCircuit size={29} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                    Inteligência operacional
                  </p>

                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-300">
                    <Sparkles size={11} />
                    análise automática
                  </span>
                </div>

                <h1 className="mt-2 break-words text-3xl font-black tracking-tight sm:text-4xl">
                  Central de Inteligência da Manutenção
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  Identifique falhas reincidentes, padrões de
                  manutenção e pendências importantes usando os
                  dados reais das ordens de serviço e preventivas.
                </p>
              </div>
            </div>

            <div className="grid min-w-[290px] grid-cols-2 gap-3">
              <div className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.06] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-violet-300">
                  Janela de reincidência
                </p>

                <p className="mt-1 text-2xl font-black">
                  60 dias
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  Padrões encontrados
                </p>

                <p className="mt-1 text-2xl font-black">
                  {reincidencias.length}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <CardResumo
            titulo="Padrões reincidentes"
            valor={reincidencias.length}
            descricao="Falhas repetidas detectadas"
            icon={<Repeat2 size={22} />}
            destaque="violet"
          />

          <CardResumo
            titulo="OS relacionadas"
            valor={totalOcorrenciasReincidentes}
            descricao="Ocorrências dentro dos padrões"
            icon={<TrendingUp size={22} />}
            destaque="cyan"
          />

          <CardResumo
            titulo="Alta reincidência"
            valor={reincidenciasAltas}
            descricao="Padrões que merecem investigação"
            icon={<Activity size={22} />}
            destaque="rose"
          />

          <CardResumo
            titulo="Sem relatório"
            valor={semRelatorio.length}
            descricao="OS concluídas sem documentação"
            icon={<ClipboardX size={22} />}
            destaque="amber"
          />

          <CardResumo
            titulo="Preventivas atrasadas"
            valor={
              execucoesPreventivasAtrasadas.length
            }
            descricao="Execuções fora da programação"
            icon={<CalendarClock size={22} />}
            destaque="rose"
          />
        </section>

        <PainelReincidenciasInteligentes
          reincidencias={reincidenciasPainel}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2 text-amber-300">
                  <ClipboardX size={19} />

                  <p className="text-xs font-black uppercase tracking-[0.16em]">
                    Documentação pendente
                  </p>
                </div>

                <h2 className="mt-1 text-xl font-black">
                  OS concluídas sem relatório
                </h2>
              </div>

              <p className="text-2xl font-black text-amber-300">
                {semRelatorio.length}
              </p>
            </div>

            {semRelatorio.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Todas as OS concluídas possuem relatório.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {semRelatorio
                  .slice(0, 8)
                  .map((os) => (
                    <div
                      key={os.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black text-cyan-300">
                          OS #{os.numero}
                        </p>

                        <p className="mt-1 truncate font-black">
                          {os.titulo}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {os.setor.nome}
                          {" • "}
                          {os.maquina?.nome ??
                            "Sem máquina"}
                          {" • "}
                          Concluída em{" "}
                          {formatarData(
                            os.dataConclusao ??
                              os.updatedAt
                          )}
                        </p>
                      </div>

                      <Link
                        href={`/admin/relatorios/${os.id}`}
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 text-xs font-black text-amber-300 transition hover:bg-amber-300 hover:text-slate-950"
                      >
                        Preencher relatório
                      </Link>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2 text-rose-300">
                  <CalendarClock size={19} />

                  <p className="text-xs font-black uppercase tracking-[0.16em]">
                    Plano preventivo
                  </p>
                </div>

                <h2 className="mt-1 text-xl font-black">
                  Preventivas atrasadas
                </h2>
              </div>

              <p className="text-2xl font-black text-rose-300">
                {
                  execucoesPreventivasAtrasadas.length
                }
              </p>
            </div>

            {execucoesPreventivasAtrasadas.length ===
            0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Nenhuma execução preventiva está atrasada.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {execucoesPreventivasAtrasadas
                  .slice(0, 8)
                  .map((execucao) => {
                    const atrasoDias = diasDesde(
                      execucao.dataProgramada,
                      agora
                    );

                    return (
                      <div
                        key={execucao.id}
                        className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-black">
                              {execucao.plano.titulo}
                            </p>

                            <span
                              className={
                                atrasoDias >= 3
                                  ? "rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-rose-300"
                                  : "rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-300"
                              }
                            >
                              {atrasoDias}d atraso
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              execucao.plano.setor
                                .nome
                            }
                            {" • "}
                            {execucao.plano.maquina
                              ?.nome ?? "Sem máquina"}
                            {" • "}
                            Programada para{" "}
                            {formatarData(
                              execucao.dataProgramada
                            )}
                          </p>
                        </div>

                        <Link
                          href={`/admin/os/preventivas/execucoes/${execucao.id}`}
                          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 text-xs font-black text-rose-300 transition hover:bg-rose-300 hover:text-slate-950"
                        >
                          Abrir execução
                        </Link>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.04] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
              <BrainCircuit size={21} />
            </div>

            <div>
              <h2 className="font-black">
                Como a reincidência é reconhecida
              </h2>

              <p className="mt-2 max-w-5xl text-sm leading-relaxed text-slate-400">
                OS canceladas são ignoradas. Para considerar
                uma falha reincidente, a análise exige a mesma
                máquina, um padrão de defeito reconhecido e uma
                repetição relevante dentro de uma janela de até
                60 dias. Quando um componente é identificado,
                ele também entra na comparação. Duas ocorrências
                só são destacadas quando acontecem em até 14
                dias; com três ou mais ocorrências, o padrão já
                é considerado relevante.
              </p>

              <p className="mt-3 text-xs font-semibold text-slate-500">
                Atualizado em{" "}
                {formatarDataHora(agora)}.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
