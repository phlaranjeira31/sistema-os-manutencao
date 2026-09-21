"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Layers3,
  Repeat2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type OrdemInteligenciaGeral = {
  id: string;
  numero: number;
  titulo: string;
  status: string;
  prioridade: string;
  createdAt: string;
  dataConclusao: string | null;
  dataPrevista: string | null;
  setorNome: string;
  maquinaNome: string | null;
  temRelatorio: boolean;
  responsaveisCount: number;
};

export type PreventivaInteligenciaGeral = {
  id: string;
  titulo: string;
  status: string;
  dataProgramada: string;
  dataConclusao: string | null;
  setorNome: string;
  maquinaNome: string | null;
};

type Props = {
  ordens: OrdemInteligenciaGeral[];
  preventivas: PreventivaInteligenciaGeral[];
  reincidenciasTotal: number;
  reincidenciasAltas: number;
  agoraISO: string;
};

type Insight = {
  titulo: string;
  descricao: string;
  tipo: "positivo" | "atencao" | "critico" | "neutro";
  prioridade: number;
};

const DIA_MS = 86_400_000;

const tooltipStyle = {
  backgroundColor: "#080d1f",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "14px",
  color: "#ffffff",
  boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
};

function inicioDoDia(data: Date) {
  const nova = new Date(data);
  nova.setHours(0, 0, 0, 0);
  return nova;
}

function fimDoDia(data: Date) {
  const nova = new Date(data);
  nova.setHours(23, 59, 59, 999);
  return nova;
}

function percentual(parte: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 100);
}

function formatarDiaCurto(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(data);
}

function diasEntre(inicio: Date, fim: Date) {
  return Math.max(
    0,
    Math.floor(
      (fim.getTime() - inicio.getTime()) / DIA_MS
    )
  );
}

function estiloInsight(tipo: Insight["tipo"]) {
  if (tipo === "critico") {
    return {
      borda: "border-rose-400/25",
      fundo: "bg-rose-400/[0.07]",
      titulo: "text-rose-300",
      icone: <AlertTriangle size={18} />,
    };
  }

  if (tipo === "atencao") {
    return {
      borda: "border-amber-400/25",
      fundo: "bg-amber-400/[0.07]",
      titulo: "text-amber-300",
      icone: <Activity size={18} />,
    };
  }

  if (tipo === "positivo") {
    return {
      borda: "border-emerald-400/25",
      fundo: "bg-emerald-400/[0.07]",
      titulo: "text-emerald-300",
      icone: <CheckCircle2 size={18} />,
    };
  }

  return {
    borda: "border-cyan-400/20",
    fundo: "bg-cyan-400/[0.06]",
    titulo: "text-cyan-300",
    icone: <Sparkles size={18} />,
  };
}

function CardIndicador({
  titulo,
  valor,
  descricao,
  icon,
  destaque = "cyan",
}: {
  titulo: string;
  valor: string | number;
  descricao: string;
  icon: React.ReactNode;
  destaque?: "cyan" | "violet" | "amber" | "rose" | "emerald";
}) {
  const estilos = {
    cyan: {
      borda: "border-cyan-400/20",
      fundo: "bg-cyan-400/10",
      texto: "text-cyan-300",
    },
    violet: {
      borda: "border-violet-400/20",
      fundo: "bg-violet-400/10",
      texto: "text-violet-300",
    },
    amber: {
      borda: "border-amber-400/20",
      fundo: "bg-amber-400/10",
      texto: "text-amber-300",
    },
    rose: {
      borda: "border-rose-400/20",
      fundo: "bg-rose-400/10",
      texto: "text-rose-300",
    },
    emerald: {
      borda: "border-emerald-400/20",
      fundo: "bg-emerald-400/10",
      texto: "text-emerald-300",
    },
  }[destaque];

  return (
    <div
      className={`rounded-3xl border ${estilos.borda} bg-white/[0.04] p-5 shadow-xl shadow-black/20`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            {titulo}
          </p>

          <p className="mt-3 text-3xl font-black text-white sm:text-4xl">
            {valor}
          </p>

          <p className="mt-1 text-sm leading-relaxed text-slate-400">
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

export default function PainelInteligenciaGeral({
  ordens,
  preventivas,
  reincidenciasTotal,
  reincidenciasAltas,
  agoraISO,
}: Props) {
  const [periodo, setPeriodo] = useState(30);

  const agora = useMemo(
    () => new Date(agoraISO),
    [agoraISO]
  );

  const inicioPeriodo = useMemo(() => {
    const data = inicioDoDia(agora);
    data.setDate(data.getDate() - (periodo - 1));
    return data;
  }, [agora, periodo]);

  const abertas = useMemo(
    () =>
      ordens.filter(
        (os) =>
          os.status === "NAO_INICIADA" ||
          os.status === "EM_ANDAMENTO"
      ),
    [ordens]
  );

  const criadasPeriodo = useMemo(
    () =>
      ordens.filter(
        (os) =>
          new Date(os.createdAt).getTime() >=
          inicioPeriodo.getTime()
      ),
    [inicioPeriodo, ordens]
  );

  const concluidasPeriodo = useMemo(
    () =>
      ordens.filter(
        (os) =>
          os.status === "CONCLUIDA" &&
          os.dataConclusao &&
          new Date(os.dataConclusao).getTime() >=
            inicioPeriodo.getTime()
      ),
    [inicioPeriodo, ordens]
  );

  const abertasAntigas = useMemo(
    () =>
      abertas.filter(
        (os) =>
          diasEntre(
            new Date(os.createdAt),
            agora
          ) >= 7
      ),
    [abertas, agora]
  );

  const altasUrgentesAbertas = useMemo(
    () =>
      abertas.filter(
        (os) =>
          os.prioridade === "ALTA" ||
          os.prioridade === "URGENTE"
      ),
    [abertas]
  );

  const semResponsavel = useMemo(
    () =>
      abertas.filter(
        (os) => os.responsaveisCount === 0
      ),
    [abertas]
  );

  const concluidasComRelatorio = useMemo(
    () =>
      concluidasPeriodo.filter(
        (os) => os.temRelatorio
      ),
    [concluidasPeriodo]
  );

  const coberturaRelatorios = percentual(
    concluidasComRelatorio.length,
    concluidasPeriodo.length
  );

  const preventivasNoPeriodo = useMemo(
    () =>
      preventivas.filter((preventiva) => {
        const data = new Date(
          preventiva.dataProgramada
        );

        return (
          data.getTime() >= inicioPeriodo.getTime() &&
          data.getTime() <= agora.getTime()
        );
      }),
    [agora, inicioPeriodo, preventivas]
  );

  const preventivasConcluidas = useMemo(
    () =>
      preventivasNoPeriodo.filter(
        (preventiva) =>
          preventiva.status === "CONCLUIDA" &&
          preventiva.dataConclusao
      ),
    [preventivasNoPeriodo]
  );

  const preventivasNoPrazo = useMemo(
    () =>
      preventivasConcluidas.filter(
        (preventiva) => {
          if (!preventiva.dataConclusao) {
            return false;
          }

          const limite = fimDoDia(
            new Date(preventiva.dataProgramada)
          );

          return (
            new Date(
              preventiva.dataConclusao
            ).getTime() <= limite.getTime()
          );
        }
      ),
    [preventivasConcluidas]
  );

  const preventivasAtrasadasAtual = useMemo(
    () =>
      preventivas.filter((preventiva) => {
        const ativa =
          preventiva.status === "PROGRAMADA" ||
          preventiva.status === "PENDENTE" ||
          preventiva.status === "EM_EXECUCAO";

        return (
          ativa &&
          new Date(
            preventiva.dataProgramada
          ).getTime() <
            inicioDoDia(agora).getTime()
        );
      }),
    [agora, preventivas]
  );

  const aderenciaPreventiva = percentual(
    preventivasNoPrazo.length,
    preventivasConcluidas.length
  );

  const saldoPeriodo =
    concluidasPeriodo.length - criadasPeriodo.length;

  const taxaResposta = percentual(
    concluidasPeriodo.length,
    criadasPeriodo.length
  );

  const serieTemporal = useMemo(() => {
    const mapa = new Map<
      string,
      {
        data: string;
        criadas: number;
        concluidas: number;
      }
    >();

    for (let i = 0; i < periodo; i += 1) {
      const data = new Date(inicioPeriodo);
      data.setDate(inicioPeriodo.getDate() + i);

      const chave = data.toISOString().slice(0, 10);

      mapa.set(chave, {
        data: formatarDiaCurto(data),
        criadas: 0,
        concluidas: 0,
      });
    }

    for (const os of criadasPeriodo) {
      const chave = new Date(os.createdAt)
        .toISOString()
        .slice(0, 10);

      const item = mapa.get(chave);

      if (item) {
        item.criadas += 1;
      }
    }

    for (const os of concluidasPeriodo) {
      if (!os.dataConclusao) continue;

      const chave = new Date(os.dataConclusao)
        .toISOString()
        .slice(0, 10);

      const item = mapa.get(chave);

      if (item) {
        item.concluidas += 1;
      }
    }

    return [...mapa.values()];
  }, [
    concluidasPeriodo,
    criadasPeriodo,
    inicioPeriodo,
    periodo,
  ]);

  const backlogPorIdade = useMemo(() => {
    const faixas = [
      { faixa: "0–2 dias", valor: 0 },
      { faixa: "3–7 dias", valor: 0 },
      { faixa: "8–15 dias", valor: 0 },
      { faixa: "16–30 dias", valor: 0 },
      { faixa: "31+ dias", valor: 0 },
    ];

    for (const os of abertas) {
      const idade = diasEntre(
        new Date(os.createdAt),
        agora
      );

      if (idade <= 2) {
        faixas[0].valor += 1;
      } else if (idade <= 7) {
        faixas[1].valor += 1;
      } else if (idade <= 15) {
        faixas[2].valor += 1;
      } else if (idade <= 30) {
        faixas[3].valor += 1;
      } else {
        faixas[4].valor += 1;
      }
    }

    return faixas;
  }, [abertas, agora]);

  const insights = useMemo(() => {
    const resultado: Insight[] = [];

    if (saldoPeriodo >= 5) {
      resultado.push({
        titulo: "Fluxo reduzindo backlog",
        descricao: `No período, foram concluídas ${saldoPeriodo} OS a mais do que foram abertas. A saída está superando a entrada.`,
        tipo: "positivo",
        prioridade: 2,
      });
    } else if (saldoPeriodo <= -5) {
      resultado.push({
        titulo: "Entrada acima da capacidade de conclusão",
        descricao: `Foram abertas ${Math.abs(
          saldoPeriodo
        )} OS a mais do que concluídas no período. Se o ritmo continuar, o backlog tende a crescer.`,
        tipo: "atencao",
        prioridade: 7,
      });
    } else {
      resultado.push({
        titulo: "Fluxo operacional equilibrado",
        descricao: `A diferença entre OS abertas e concluídas no período está pequena (${saldoPeriodo}).`,
        tipo: "neutro",
        prioridade: 1,
      });
    }

    const percentualAntigas = percentual(
      abertasAntigas.length,
      abertas.length
    );

    if (abertasAntigas.length > 0) {
      resultado.push({
        titulo: "Envelhecimento do backlog",
        descricao: `${abertasAntigas.length} OS abertas têm 7 dias ou mais, representando ${percentualAntigas}% do backlog atual.`,
        tipo:
          percentualAntigas >= 35
            ? "critico"
            : "atencao",
        prioridade:
          percentualAntigas >= 35 ? 9 : 6,
      });
    }

    if (altasUrgentesAbertas.length > 0) {
      resultado.push({
        titulo: "Prioridades altas ainda abertas",
        descricao: `${altasUrgentesAbertas.length} OS de prioridade Alta/Urgente continuam abertas neste momento.`,
        tipo:
          altasUrgentesAbertas.length >= 8
            ? "critico"
            : "atencao",
        prioridade:
          altasUrgentesAbertas.length >= 8
            ? 10
            : 7,
      });
    }

    if (semResponsavel.length > 0) {
      resultado.push({
        titulo: "OS abertas sem responsável",
        descricao: `${semResponsavel.length} OS ainda não possuem colaborador atribuído.`,
        tipo: "atencao",
        prioridade: 6,
      });
    }

    if (concluidasPeriodo.length > 0) {
      resultado.push({
        titulo:
          coberturaRelatorios >= 90
            ? "Documentação em bom nível"
            : "Documentação precisa de atenção",
        descricao: `${coberturaRelatorios}% das OS concluídas no período possuem relatório final.`,
        tipo:
          coberturaRelatorios >= 90
            ? "positivo"
            : coberturaRelatorios < 70
              ? "critico"
              : "atencao",
        prioridade:
          coberturaRelatorios < 70
            ? 9
            : coberturaRelatorios < 90
              ? 5
              : 2,
      });
    }

    if (preventivasAtrasadasAtual.length > 0) {
      resultado.push({
        titulo: "Preventivas fora da programação",
        descricao: `${preventivasAtrasadasAtual.length} execução(ões) preventiva(s) estão programadas para datas já ultrapassadas.`,
        tipo:
          preventivasAtrasadasAtual.length >= 5
            ? "critico"
            : "atencao",
        prioridade:
          preventivasAtrasadasAtual.length >= 5
            ? 10
            : 7,
      });
    } else {
      resultado.push({
        titulo: "Preventivas sem atraso atual",
        descricao:
          "Nenhuma preventiva ativa está com data programada vencida neste momento.",
        tipo: "positivo",
        prioridade: 2,
      });
    }

    if (reincidenciasAltas > 0) {
      resultado.push({
        titulo: "Falhas com forte reincidência",
        descricao: `${reincidenciasAltas} padrão(ões) de falha estão classificados com alta reincidência.`,
        tipo: "atencao",
        prioridade: 8,
      });
    } else if (reincidenciasTotal > 0) {
      resultado.push({
        titulo: "Reincidências sob monitoramento",
        descricao: `${reincidenciasTotal} padrão(ões) de repetição foram reconhecidos, sem concentração crítica.`,
        tipo: "neutro",
        prioridade: 3,
      });
    }

    return resultado
      .sort((a, b) => b.prioridade - a.prioridade)
      .slice(0, 6);
  }, [
    abertas.length,
    abertasAntigas.length,
    altasUrgentesAbertas.length,
    concluidasPeriodo.length,
    coberturaRelatorios,
    preventivasAtrasadasAtual.length,
    reincidenciasAltas,
    reincidenciasTotal,
    saldoPeriodo,
    semResponsavel.length,
  ]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] shadow-2xl shadow-black/25">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles size={19} />

              <p className="text-xs font-black uppercase tracking-[0.18em]">
                Leitura automática da operação
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-black">
              O que os dados estão mostrando agora
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              A análise combina fluxo de OS, idade do backlog,
              prioridades, documentação, preventivas e
              reincidências. O período altera as métricas de
              tendência e qualidade.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[7, 30, 60, 90].map((dias) => (
              <button
                key={dias}
                type="button"
                onClick={() => setPeriodo(dias)}
                className={
                  periodo === dias
                    ? "h-10 rounded-xl border border-cyan-300 bg-cyan-400 px-4 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20"
                    : "h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-slate-300 transition hover:bg-white/10"
                }
              >
                {dias} dias
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3 2xl:grid-cols-6">
          <CardIndicador
            titulo="Backlog atual"
            valor={abertas.length}
            descricao="OS abertas neste momento"
            icon={<Layers3 size={21} />}
            destaque="cyan"
          />

          <CardIndicador
            titulo="Abertas no período"
            valor={criadasPeriodo.length}
            descricao={`Últimos ${periodo} dias`}
            icon={<TrendingUp size={21} />}
            destaque="violet"
          />

          <CardIndicador
            titulo="Concluídas no período"
            valor={concluidasPeriodo.length}
            descricao={`${taxaResposta}% em relação às entradas`}
            icon={<TrendingDown size={21} />}
            destaque="emerald"
          />

          <CardIndicador
            titulo="Backlog envelhecido"
            valor={abertasAntigas.length}
            descricao="Abertas há 7 dias ou mais"
            icon={<Clock3 size={21} />}
            destaque="amber"
          />

          <CardIndicador
            titulo="Cobertura de relatórios"
            valor={`${coberturaRelatorios}%`}
            descricao={`${concluidasComRelatorio.length}/${concluidasPeriodo.length} concluídas documentadas`}
            icon={<ClipboardCheck size={21} />}
            destaque={
              coberturaRelatorios >= 90
                ? "emerald"
                : "amber"
            }
          />

          <CardIndicador
            titulo="Preventiva no prazo"
            valor={`${aderenciaPreventiva}%`}
            descricao={`${preventivasNoPrazo.length}/${preventivasConcluidas.length} concluídas no prazo`}
            icon={<CalendarCheck2 size={21} />}
            destaque={
              aderenciaPreventiva >= 90
                ? "emerald"
                : "rose"
            }
          />
        </div>

        <div className="grid gap-3 border-t border-white/10 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
          {insights.map((insight) => {
            const estilo = estiloInsight(
              insight.tipo
            );

            return (
              <div
                key={`${insight.titulo}-${insight.descricao}`}
                className={`rounded-2xl border ${estilo.borda} ${estilo.fundo} p-4`}
              >
                <div
                  className={`flex items-center gap-2 ${estilo.titulo}`}
                >
                  {estilo.icone}

                  <p className="text-xs font-black uppercase tracking-[0.12em]">
                    {insight.titulo}
                  </p>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {insight.descricao}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-cyan-300">
              <TrendingUp size={18} />

              <p className="text-xs font-black uppercase tracking-[0.16em]">
                Fluxo de ordens
              </p>
            </div>

            <h3 className="mt-1 text-xl font-black">
              Entrada x conclusão
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Evolução diária nos últimos {periodo} dias.
            </p>
          </div>

          <div className="h-[390px] p-4 sm:p-6">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={serieTemporal}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="gradCriadas"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#a78bfa"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="#a78bfa"
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id="gradConcluidas"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#22d3ee"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="#22d3ee"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />

                <XAxis
                  dataKey="data"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={22}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{
                    stroke: "rgba(255,255,255,0.12)",
                  }}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    paddingTop: "14px",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="criadas"
                  name="OS abertas"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  fill="url(#gradCriadas)"
                  activeDot={{ r: 5 }}
                />

                <Area
                  type="monotone"
                  dataKey="concluidas"
                  name="OS concluídas"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  fill="url(#gradConcluidas)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Saldo do período
              </p>
              <p
                className={
                  saldoPeriodo >= 0
                    ? "mt-1 text-2xl font-black text-emerald-300"
                    : "mt-1 text-2xl font-black text-amber-300"
                }
              >
                {saldoPeriodo > 0 ? "+" : ""}
                {saldoPeriodo}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Alta/Urgente abertas
              </p>
              <p className="mt-1 text-2xl font-black text-rose-300">
                {altasUrgentesAbertas.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Sem responsável
              </p>
              <p className="mt-1 text-2xl font-black text-amber-300">
                {semResponsavel.length}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-amber-300">
              <Clock3 size={18} />

              <p className="text-xs font-black uppercase tracking-[0.16em]">
                Idade do backlog
              </p>
            </div>

            <h3 className="mt-1 text-xl font-black">
              Há quanto tempo as OS estão abertas
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Distribuição das {abertas.length} OS ainda abertas.
            </p>
          </div>

          <div className="h-[390px] p-4 sm:p-6">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={backlogPorIdade}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />

                <XAxis
                  dataKey="faixa"
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{
                    fill: "rgba(255,255,255,0.03)",
                  }}
                />

                <Bar
                  dataKey="valor"
                  name="OS abertas"
                  fill="#f59e0b"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={52}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-white/10 p-5">
            <p className="text-sm leading-relaxed text-slate-400">
              {abertasAntigas.length === 0
                ? "Nenhuma OS aberta ultrapassou 7 dias."
                : `${abertasAntigas.length} OS já ultrapassaram 7 dias em aberto.`}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-violet-300">
            <Repeat2 size={18} />
            <p className="text-xs font-black uppercase tracking-[0.14em]">
              Reincidência
            </p>
          </div>

          <p className="mt-4 text-3xl font-black">
            {reincidenciasTotal}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            padrões reconhecidos
          </p>

          <p className="mt-3 text-xs text-slate-500">
            {reincidenciasAltas} com classificação alta
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-emerald-300">
            <ClipboardCheck size={18} />
            <p className="text-xs font-black uppercase tracking-[0.14em]">
              Documentação
            </p>
          </div>

          <p className="mt-4 text-3xl font-black">
            {coberturaRelatorios}%
          </p>

          <p className="mt-1 text-sm text-slate-400">
            cobertura dos relatórios
          </p>

          <p className="mt-3 text-xs text-slate-500">
            considerando as conclusões do período
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-cyan-300">
            <CalendarCheck2 size={18} />
            <p className="text-xs font-black uppercase tracking-[0.14em]">
              Preventiva
            </p>
          </div>

          <p className="mt-4 text-3xl font-black">
            {aderenciaPreventiva}%
          </p>

          <p className="mt-1 text-sm text-slate-400">
            executadas no prazo
          </p>

          <p className="mt-3 text-xs text-slate-500">
            {preventivasAtrasadasAtual.length} atraso(s) ativo(s)
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-amber-300">
            <UsersRound size={18} />
            <p className="text-xs font-black uppercase tracking-[0.14em]">
              Atribuição
            </p>
          </div>

          <p className="mt-4 text-3xl font-black">
            {semResponsavel.length}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            OS abertas sem responsável
          </p>

          <p className="mt-3 text-xs text-slate-500">
            base atual da operação
          </p>
        </div>
      </section>
    </div>
  );
}
