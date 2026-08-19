"use client";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Repeat2,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

type ExecucaoDashboard = {
  id: string;

  dataProgramada: string;

  status: string;

  duracaoEstimadaMinutos:
    | number
    | null;

  plano: {
    id: string;
    titulo: string;
    prioridade: string;
    frequencia: string;

    duracaoEstimadaMinutos:
      | number
      | null;

    setor: {
      nome: string;
    };

    maquina: {
      nome: string;
    } | null;
  };

  responsaveis: Array<{
    user: {
      nome: string;
    };
  }>;
};

type DashboardPreventivasProps = {
  mesAtual: string;

  hoje: string;

  metricas: {
    planosAtivos: number;
    proximas7Dias: number;
    atrasadas: number;
    concluidasMes: number;
    horasPrevistasMes: number;
  };

  execucoesMes: ExecucaoDashboard[];

  proximas7: ExecucaoDashboard[];
};

function formatarDuracao(
  minutos:
    | number
    | null
    | undefined
) {
  if (!minutos || minutos <= 0) {
    return "Não informada";
  }

  const horas =
    Math.floor(minutos / 60);

  const minutosRestantes =
    minutos % 60;

  if (
    horas > 0 &&
    minutosRestantes > 0
  ) {
    return `${horas}h ${minutosRestantes}min`;
  }

  if (horas > 0) {
    return `${horas}h`;
  }

  return `${minutosRestantes}min`;
}

function formatarData(
  data: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone: "UTC",
    }
  ).format(
    new Date(data)
  );
}

function formatarDataCompleta(
  data: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone: "UTC",
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(
      `${data}T00:00:00.000Z`
    )
  );
}

function prioridadeLabel(
  prioridade: string
) {
  const map: Record<
    string,
    string
  > = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return (
    map[prioridade] ??
    prioridade
  );
}

function statusInfo(
  status: string,
  dataProgramada: string,
  hoje: string
) {
  const data =
    dataProgramada.slice(0, 10);

  if (status === "CONCLUIDA") {
    return {
      texto: "Concluída",
      badge:
        "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
      dot: "bg-emerald-400",
    };
  }

  if (status === "EM_EXECUCAO") {
    return {
      texto: "Em execução",
      badge:
        "border-violet-400/30 bg-violet-500/15 text-violet-300",
      dot: "bg-violet-400",
    };
  }

  if (
    status === "NAO_REALIZADA"
  ) {
    return {
      texto: "Não realizada",
      badge:
        "border-red-400/30 bg-red-500/15 text-red-300",
      dot: "bg-red-400",
    };
  }

  if (status === "CANCELADA") {
    return {
      texto: "Cancelada",
      badge:
        "border-slate-400/30 bg-slate-500/15 text-slate-300",
      dot: "bg-slate-500",
    };
  }

  if (data < hoje) {
    return {
      texto: "Atrasada",
      badge:
        "border-red-400/40 bg-red-500/15 text-red-300",
      dot: "bg-red-400",
    };
  }

  if (
    data === hoje ||
    status === "PENDENTE"
  ) {
    return {
      texto: "Pendente",
      badge:
        "border-yellow-400/30 bg-yellow-500/15 text-yellow-300",
      dot: "bg-yellow-400",
    };
  }

  return {
    texto: "Programada",
    badge:
      "border-cyan-400/30 bg-cyan-500/15 text-cyan-300",
    dot: "bg-cyan-400",
  };
}

function criarISOData(
  ano: number,
  mes: number,
  dia: number
) {
  return `${ano}-${String(
    mes
  ).padStart(
    2,
    "0"
  )}-${String(dia).padStart(
    2,
    "0"
  )}`;
}

export default function DashboardPreventivas({
  mesAtual,
  hoje,
  metricas,
  execucoesMes,
  proximas7,
}: DashboardPreventivasProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const [ano, mes] =
    mesAtual
      .split("-")
      .map(Number);

  const primeiraExecucao =
    execucoesMes[0]
      ?.dataProgramada
      .slice(0, 10);

  const dataInicial =
    mesAtual ===
    hoje.slice(0, 7)
      ? hoje
      : primeiraExecucao ??
        `${mesAtual}-01`;

  const [
    dataSelecionada,
    setDataSelecionada,
  ] = useState(
    dataInicial
  );

  useEffect(() => {
    const novaData =
      mesAtual ===
      hoje.slice(0, 7)
        ? hoje
        : primeiraExecucao ??
          `${mesAtual}-01`;

    setDataSelecionada(
      novaData
    );
  }, [
    mesAtual,
    hoje,
    primeiraExecucao,
  ]);

  const tituloMes =
    useMemo(() => {
      const data =
        new Date(
          Date.UTC(
            ano,
            mes - 1,
            1
          )
        );

      const texto =
        new Intl.DateTimeFormat(
          "pt-BR",
          {
            timeZone: "UTC",
            month: "long",
            year: "numeric",
          }
        ).format(data);

      return (
        texto
          .charAt(0)
          .toUpperCase() +
        texto.slice(1)
      );
    }, [
      ano,
      mes,
    ]);

  const eventosPorDia =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          ExecucaoDashboard[]
        >();

      execucoesMes.forEach(
        (execucao) => {
          const chave =
            execucao.dataProgramada.slice(
              0,
              10
            );

          const existentes =
            mapa.get(chave) ??
            [];

          existentes.push(
            execucao
          );

          mapa.set(
            chave,
            existentes
          );
        }
      );

      return mapa;
    }, [execucoesMes]);

  const execucoesSelecionadas =
    eventosPorDia.get(
      dataSelecionada
    ) ?? [];

  const primeiroDiaSemana =
    new Date(
      Date.UTC(
        ano,
        mes - 1,
        1
      )
    ).getUTCDay();

  const deslocamento =
    (primeiroDiaSemana +
      6) %
    7;

  const quantidadeDias =
    new Date(
      Date.UTC(
        ano,
        mes,
        0
      )
    ).getUTCDate();

  const celulas:
    Array<
      number | null
    > = [
    ...Array(
      deslocamento
    ).fill(null),

    ...Array.from(
      {
        length:
          quantidadeDias,
      },
      (_, index) =>
        index + 1
    ),
  ];

  while (
    celulas.length %
      7 !==
    0
  ) {
    celulas.push(null);
  }

  function mudarMes(
    diferenca: number
  ) {
    const novaData =
      new Date(
        Date.UTC(
          ano,
          mes -
            1 +
            diferenca,
          1
        )
      );

    const novoMes =
      `${novaData.getUTCFullYear()}-${String(
        novaData.getUTCMonth() +
          1
      ).padStart(
        2,
        "0"
      )}`;

    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    params.set(
      "mes",
      novoMes
    );

    router.push(
      `${pathname}?${params.toString()}`
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Indicador
          titulo="Planos ativos"
          valor={
            metricas.planosAtivos
          }
          descricao="Planos em operação"
          icone={
            <Repeat2
              size={21}
            />
          }
          classe="border-cyan-400/20 bg-cyan-500/[0.06] text-cyan-300"
        />

        <Indicador
          titulo="Próximos 7 dias"
          valor={
            metricas.proximas7Dias
          }
          descricao="Execuções previstas"
          icone={
            <CalendarDays
              size={21}
            />
          }
          classe="border-blue-400/20 bg-blue-500/[0.06] text-blue-300"
        />

        <Indicador
          titulo="Atrasadas"
          valor={
            metricas.atrasadas
          }
          descricao="Precisam de atenção"
          icone={
            <TriangleAlert
              size={21}
            />
          }
          classe={
            metricas.atrasadas >
            0
              ? "border-red-400/25 bg-red-500/[0.07] text-red-300"
              : "border-white/10 bg-white/[0.04] text-slate-300"
          }
        />

        <Indicador
          titulo="Concluídas no mês"
          valor={
            metricas.concluidasMes
          }
          descricao="Execuções finalizadas"
          icone={
            <CheckCircle2
              size={21}
            />
          }
          classe="border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-300"
        />

        <Indicador
          titulo="Horas previstas"
          valor={`${metricas.horasPrevistasMes}h`}
          descricao="Carga preventiva do mês"
          icone={
            <Clock3
              size={21}
            />
          }
          classe="border-violet-400/20 bg-violet-500/[0.06] text-violet-300"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.75fr)]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
                Calendário preventivo
              </p>

              <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                {tituloMes}
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  mudarMes(-1)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#050816] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                aria-label="Mês anterior"
              >
                <ChevronLeft
                  size={19}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  mudarMes(1)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#050816] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                aria-label="Próximo mês"
              >
                <ChevronRight
                  size={19}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-white/10 bg-[#050816]/70">
            {[
              "Seg",
              "Ter",
              "Qua",
              "Qui",
              "Sex",
              "Sáb",
              "Dom",
            ].map(
              (dia) => (
                <div
                  key={dia}
                  className="px-1 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-500 sm:text-xs"
                >
                  {dia}
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-7">
            {celulas.map(
              (
                dia,
                index
              ) => {
                if (!dia) {
                  return (
                    <div
                      key={`vazio-${index}`}
                      className="min-h-[74px] border-b border-r border-white/[0.06] bg-black/5 sm:min-h-[100px]"
                    />
                  );
                }

                const data =
                  criarISOData(
                    ano,
                    mes,
                    dia
                  );

                const eventos =
                  eventosPorDia.get(
                    data
                  ) ?? [];

                const selecionado =
                  data ===
                  dataSelecionada;

                const ehHoje =
                  data ===
                  hoje;

                return (
                  <button
                    key={
                      data
                    }
                    type="button"
                    onClick={() =>
                      setDataSelecionada(
                        data
                      )
                    }
                    className={`relative min-h-[74px] border-b border-r border-white/[0.06] p-2 text-left transition sm:min-h-[100px] sm:p-3 ${
                      selecionado
                        ? "bg-cyan-400/[0.09] ring-1 ring-inset ring-cyan-400/40"
                        : "bg-transparent hover:bg-white/[0.035]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`flex h-7 min-w-7 items-center justify-center rounded-lg text-xs font-black sm:text-sm ${
                          ehHoje
                            ? "bg-cyan-400 text-slate-950"
                            : selecionado
                              ? "text-cyan-300"
                              : "text-slate-300"
                        }`}
                      >
                        {dia}
                      </span>

                      {eventos.length >
                        0 && (
                        <span className="rounded-full border border-white/10 bg-[#050816] px-1.5 py-0.5 text-[9px] font-black text-slate-300 sm:text-[10px]">
                          {
                            eventos.length
                          }
                        </span>
                      )}
                    </div>

                    {eventos.length >
                      0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {eventos
                            .slice(
                              0,
                              4
                            )
                            .map(
                              (
                                evento
                              ) => {
                                const info =
                                  statusInfo(
                                    evento.status,
                                    evento.dataProgramada,
                                    hoje
                                  );

                                return (
                                  <span
                                    key={
                                      evento.id
                                    }
                                    className={`h-2 w-2 rounded-full ${info.dot}`}
                                  />
                                );
                              }
                            )}
                        </div>

                        <p className="hidden truncate text-[10px] font-bold text-slate-400 sm:block">
                          {
                            eventos[0]
                              .plano
                              .titulo
                          }
                        </p>
                      </div>
                    )}
                  </button>
                );
              }
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 px-4 py-3 text-[10px] font-bold text-slate-400 sm:px-5 sm:text-xs">
            <Legenda
              cor="bg-cyan-400"
              texto="Programada"
            />

            <Legenda
              cor="bg-yellow-400"
              texto="Pendente"
            />

            <Legenda
              cor="bg-violet-400"
              texto="Em execução"
            />

            <Legenda
              cor="bg-emerald-400"
              texto="Concluída"
            />

            <Legenda
              cor="bg-red-400"
              texto="Atrasada"
            />
          </div>
        </div>

        <div className="flex min-h-[480px] flex-col rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div className="border-b border-white/10 pb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
              Dia selecionado
            </p>

            <h3 className="mt-1 text-lg font-black capitalize text-white">
              {formatarDataCompleta(
                dataSelecionada
              )}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {
                execucoesSelecionadas.length
              }{" "}
              preventiva(s) programada(s)
            </p>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {execucoesSelecionadas.length ===
            0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#050816] p-5 text-center">
                <div>
                  <CalendarDays
                    size={30}
                    className="mx-auto text-slate-600"
                  />

                  <p className="mt-3 font-bold text-slate-300">
                    Nenhuma preventiva neste dia
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Selecione outro dia do calendário.
                  </p>
                </div>
              </div>
            ) : (
              execucoesSelecionadas.map(
                (
                  execucao
                ) => (
                  <ExecucaoCard
                    key={
                      execucao.id
                    }
                    execucao={
                      execucao
                    }
                    hoje={
                      hoje
                    }
                  />
                )
              )
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
              Agenda imediata
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              Próximos 7 dias
            </h2>
          </div>

          <Activity
            size={23}
            className="text-cyan-300"
          />
        </div>

        {proximas7.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#050816] p-6 text-center text-sm text-slate-400">
            Nenhuma preventiva programada para os próximos 7 dias.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {proximas7.map(
              (
                execucao
              ) => (
                <ExecucaoCard
                  key={
                    execucao.id
                  }
                  execucao={
                    execucao
                  }
                  hoje={
                    hoje
                  }
                  compacto
                />
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Indicador({
  titulo,
  valor,
  descricao,
  icone,
  classe,
}: {
  titulo: string;
  valor:
    | string
    | number;
  descricao: string;
  icone: React.ReactNode;
  classe: string;
}) {
  return (
    <div
      className={`rounded-3xl border p-4 ${classe}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider opacity-80">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {valor}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-current/20 bg-black/10">
          {icone}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {descricao}
      </p>
    </div>
  );
}

function Legenda({
  cor,
  texto,
}: {
  cor: string;
  texto: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${cor}`}
      />

      {texto}
    </span>
  );
}

function ExecucaoCard({
  execucao,
  hoje,
  compacto = false,
}: {
  execucao: ExecucaoDashboard;
  hoje: string;
  compacto?: boolean;
}) {
  const info =
    statusInfo(
      execucao.status,
      execucao.dataProgramada,
      hoje
    );

  const duracao =
    execucao.duracaoEstimadaMinutos ??
    execucao.plano
      .duracaoEstimadaMinutos;

  const responsaveis =
    execucao.responsaveis.length >
    0
      ? execucao.responsaveis
          .map(
            (item) =>
              item.user.nome
          )
          .join(", ")
      : "Não definido";

  return (
    <article className="rounded-2xl border border-white/10 bg-[#050816] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-cyan-300">
            {formatarData(
              execucao.dataProgramada
            )}
          </p>

          <h4 className="mt-1 line-clamp-2 font-black text-white">
            {
              execucao.plano
                .titulo
            }
          </h4>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${info.badge}`}
        >
          {info.texto}
        </span>
      </div>

      <div
        className={`mt-3 ${
          compacto
            ? "space-y-1.5"
            : "space-y-2"
        } text-xs text-slate-400`}
      >
        <p className="flex items-center gap-2">
          <Wrench
            size={13}
            className="shrink-0"
          />

          <span className="truncate">
            {execucao.plano
              .maquina
              ?.nome ??
              "Máquina não definida"}
          </span>
        </p>

        <p className="flex items-center gap-2">
          <Clock3
            size={13}
            className="shrink-0"
          />

          {formatarDuracao(
            duracao
          )}
        </p>

        {!compacto && (
          <p className="flex items-start gap-2">
            <Users
              size={13}
              className="mt-0.5 shrink-0"
            />

            <span>
              {responsaveis}
            </span>
          </p>
        )}
      </div>

            {!compacto && (
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px]">
          <span className="text-slate-500">
            {
              execucao.plano
                .setor.nome
            }
          </span>

          <span className="font-bold text-slate-300">
            {prioridadeLabel(
              execucao.plano
                .prioridade
            )}
          </span>
        </div>
      )}

      <Link
        href={`/admin/os/preventivas/execucoes/${execucao.id}`}
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-xs font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
      >
        Abrir execução
      </Link>

    </article>
  );
}