import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  CalendarClock,
  ClipboardX,
  Sparkles,
} from "lucide-react";

import PainelInteligenciaGeral, {
  type OrdemInteligenciaGeral,
  type PreventivaInteligenciaGeral,
} from "@/components/PainelInteligenciaGeral";
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
    padroes: [/\bengrenagem\b/, /\bengrenagens\b/],
  },
  {
    id: "ROLAMENTO",
    label: "Rolamento",
    padroes: [/\brolamento\b/, /\brolamentos\b/],
  },
  {
    id: "MOTOR",
    label: "Motor",
    padroes: [/\bmotor\b/, /\bmotores\b/],
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
    padroes: [/\bcorreia\b/, /\bcorreias\b/],
  },
  {
    id: "CORRENTE",
    label: "Corrente",
    padroes: [/\bcorrente\b/, /\bcorrentes\b/],
  },
  {
    id: "POLIA",
    label: "Polia",
    padroes: [/\bpolia\b/, /\bpolias\b/],
  },
  {
    id: "BOMBA",
    label: "Bomba",
    padroes: [/\bbomba\b/, /\bbombas\b/],
  },
  {
    id: "VALVULA",
    label: "Válvula",
    padroes: [/\bvalvula\b/, /\bvalvulas\b/],
  },
  {
    id: "MANGUEIRA",
    label: "Mangueira",
    padroes: [/\bmangueira\b/, /\bmangueiras\b/],
  },
  {
    id: "CILINDRO",
    label: "Cilindro",
    padroes: [/\bcilindro\b/, /\bcilindros\b/],
  },
  {
    id: "PISTAO",
    label: "Pistão",
    padroes: [/\bpistao\b/, /\bpistoes\b/],
  },
  {
    id: "SENSOR",
    label: "Sensor",
    padroes: [/\bsensor\b/, /\bsensores\b/],
  },
  {
    id: "INVERSOR",
    label: "Inversor",
    padroes: [/\binversor\b/, /\binversores\b/],
  },
  {
    id: "EIXO",
    label: "Eixo",
    padroes: [/\beixo\b/, /\beixos\b/],
  },
  {
    id: "ACOPLAMENTO",
    label: "Acoplamento",
    padroes: [/\bacoplamento\b/, /\bacoplamentos\b/],
  },
  {
    id: "ESTEIRA",
    label: "Esteira",
    padroes: [/\besteira\b/, /\besteiras\b/],
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

export default async function InteligenciaManutencaoPage() {
  const agora = new Date();
  const inicioHoje = inicioDoDiaSaoPaulo(agora);

  const limitePreventivas = new Date(
    agora.getTime() - 90 * DIA_MS
  );

  const [ordensBrutas, preventivasBrutas] =
    await Promise.all([
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
          OR: [
            {
              dataProgramada: {
                gte: limitePreventivas,
              },
            },
            {
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
          ],
        },

        select: {
          id: true,
          dataProgramada: true,
          dataConclusao: true,
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
        },

        orderBy: {
          dataProgramada: "desc",
        },

        take: 500,
      }),
    ]);

  const ordens =
    ordensBrutas as OrdemInteligencia[];

  const reincidencias = montarReincidencias(
    ordens,
    agora
  );

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

  const ordensPainel: OrdemInteligenciaGeral[] =
    ordens.map((os) => ({
      id: os.id,
      numero: os.numero,
      titulo: os.titulo,
      status: os.status,
      prioridade: os.prioridade,
      createdAt: os.createdAt.toISOString(),
      dataConclusao:
        os.dataConclusao?.toISOString() ?? null,
      dataPrevista:
        os.dataPrevista?.toISOString() ?? null,
      setorNome: os.setor.nome,
      maquinaNome: os.maquina?.nome ?? null,
      temRelatorio: Boolean(
        os.registroFinal?.trim()
      ),
      responsaveisCount:
        os.responsaveis.length,
    }));

  const preventivasPainel: PreventivaInteligenciaGeral[] =
    preventivasBrutas.map((execucao) => ({
      id: execucao.id,
      titulo: execucao.plano.titulo,
      status: execucao.status,
      dataProgramada:
        execucao.dataProgramada.toISOString(),
      dataConclusao:
        execucao.dataConclusao?.toISOString() ??
        null,
      setorNome: execucao.plano.setor.nome,
      maquinaNome:
        execucao.plano.maquina?.nome ?? null,
    }));

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

  const preventivasAtrasadas =
    preventivasBrutas
      .filter(
        (execucao) =>
          execucao.dataProgramada.getTime() <
            inicioHoje.getTime() &&
          (
            execucao.status === "PROGRAMADA" ||
            execucao.status === "PENDENTE" ||
            execucao.status === "EM_EXECUCAO"
          )
      )
      .sort(
        (a, b) =>
          a.dataProgramada.getTime() -
          b.dataProgramada.getTime()
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
                    Inteligência do sistema
                  </p>

                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-300">
                    <Sparkles size={11} />
                    análise automática
                  </span>
                </div>

                <h1 className="mt-2 break-words text-3xl font-black tracking-tight sm:text-4xl">
                  Central de Inteligência da Manutenção
                </h1>

                <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  Uma leitura geral da operação: entrada e
                  conclusão de OS, envelhecimento do backlog,
                  prioridades, documentação, preventivas e
                  reincidências de falha.
                </p>
              </div>
            </div>

            <Link
              href="/admin"
              className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-5 text-sm font-black text-slate-950 shadow-lg transition hover:bg-cyan-50 sm:w-fit"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>
          </div>
        </header>

        <PainelInteligenciaGeral
          ordens={ordensPainel}
          preventivas={preventivasPainel}
          reincidenciasTotal={
            reincidencias.length
          }
          reincidenciasAltas={
            reincidenciasAltas
          }
          agoraISO={agora.toISOString()}
        />

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
                {preventivasAtrasadas.length}
              </p>
            </div>

            {preventivasAtrasadas.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Nenhuma execução preventiva está atrasada.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {preventivasAtrasadas
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
                            {execucao.plano.setor.nome}
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
                O que esta central considera
              </h2>

              <p className="mt-2 max-w-6xl text-sm leading-relaxed text-slate-400">
                OS canceladas não entram nas análises.
                A leitura geral considera fluxo de abertura e
                conclusão, idade das OS abertas, prioridades,
                atribuições, cobertura dos relatórios,
                cumprimento das preventivas e padrões de
                reincidência. A reincidência exige mesma
                máquina, padrão de falha compatível e repetição
                relevante dentro de até 60 dias.
              </p>

              <p className="mt-3 text-xs font-semibold text-slate-500">
                Atualizado em {formatarDataHora(agora)}.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
