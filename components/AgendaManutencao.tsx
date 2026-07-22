"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  Filter,
  PlayCircle,
  RotateCcw,
  User,
  Wrench,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

export type AgendaEvento = {
  id: string;
  origem: "OS" | "PREVENTIVA";

  tipo:
    | "OS_CRIADA"
    | "MAQUINA_PARADA"
    | "SERVICO_INICIADO"
    | "DATA_PREVISTA"
    | "OS_CONCLUIDA"
    | "PREVENTIVA";

  data: string;
  diaTodo: boolean;
  titulo: string;
  subtitulo: string;
  descricao: string;
  resultado?: string | null;
  setor: string;
  maquina: string;
  responsaveis: string[];
  prioridade: string;
  status: string;
  href: string;
  osId?: string;
  numeroOS?: number;
};

type Setor = {
  id: string;
  nome: string;
};

type Maquina = {
  id: string;
  nome: string;
  setorId: string;
};

type Colaborador = {
  id: string;
  nome: string;
};

type AgendaManutencaoProps = {
  mes: string;
  eventos: AgendaEvento[];
  setores: Setor[];
  maquinas: Maquina[];
  colaboradores: Colaborador[];

  filtros: {
    setor: string;
    maquina: string;
    colaborador: string;
    tipo: string;
  };
};

type CelulaCalendario = {
  chave: string;
  mesChave: string;
  numero: number;
  pertenceAoMes: boolean;
};

const DIAS_SEMANA = [
  "D",
  "S",
  "T",
  "Q",
  "Q",
  "S",
  "S",
];

const ESTILOS_EVENTO: Record<
  AgendaEvento["tipo"],
  {
    ponto: string;
    fundo: string;
    borda: string;
    texto: string;
    label: string;
  }
> = {
  OS_CRIADA: {
    ponto: "bg-blue-400",
    fundo: "bg-blue-500/10",
    borda: "border-blue-400/25",
    texto: "text-blue-300",
    label: "OS criada",
  },

  MAQUINA_PARADA: {
    ponto: "bg-red-400",
    fundo: "bg-red-500/10",
    borda: "border-red-400/25",
    texto: "text-red-300",
    label: "Máquina parada",
  },

  SERVICO_INICIADO: {
    ponto: "bg-violet-400",
    fundo: "bg-violet-500/10",
    borda: "border-violet-400/25",
    texto: "text-violet-300",
    label: "Serviço iniciado",
  },

  DATA_PREVISTA: {
    ponto: "bg-amber-400",
    fundo: "bg-amber-500/10",
    borda: "border-amber-400/25",
    texto: "text-amber-300",
    label: "Data prevista",
  },

  OS_CONCLUIDA: {
    ponto: "bg-emerald-400",
    fundo: "bg-emerald-500/10",
    borda: "border-emerald-400/25",
    texto: "text-emerald-300",
    label: "OS concluída",
  },

  PREVENTIVA: {
    ponto: "bg-cyan-400",
    fundo: "bg-cyan-500/10",
    borda: "border-cyan-400/25",
    texto: "text-cyan-300",
    label: "Preventiva",
  },
};

function pad(valor: number) {
  return String(valor).padStart(2, "0");
}

function criarChaveData(
  ano: number,
  mes: number,
  dia: number
) {
  return `${ano}-${pad(mes)}-${pad(dia)}`;
}

function chaveDataLocal(data: Date) {
  return criarChaveData(
    data.getFullYear(),
    data.getMonth() + 1,
    data.getDate()
  );
}

function chaveDataEvento(data: string) {
  const partes = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date(data));

  const ano = partes.find(
    (parte) => parte.type === "year"
  )?.value;

  const mes = partes.find(
    (parte) => parte.type === "month"
  )?.value;

  const dia = partes.find(
    (parte) => parte.type === "day"
  )?.value;

  return `${ano}-${mes}-${dia}`;
}

function obterHoje() {
  return chaveDataEvento(
    new Date().toISOString()
  );
}

function formatarHorario(
  data: string,
  diaTodo: boolean
) {
  if (diaTodo) {
    return "Dia todo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).format(new Date(data));
}

function formatarDataCompleta(chave: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(
    new Date(`${chave}T12:00:00-03:00`)
  );
}

function formatarDataCompacta(chave: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(
    new Date(`${chave}T12:00:00-03:00`)
  );
}

function formatarMes(mes: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(
    new Date(`${mes}-01T12:00:00-03:00`)
  );
}

function alterarMes(
  mesAtual: string,
  quantidade: number
) {
  const [ano, mes] = mesAtual
    .split("-")
    .map(Number);

  const data = new Date(
    ano,
    mes - 1 + quantidade,
    1
  );

  return `${data.getFullYear()}-${pad(
    data.getMonth() + 1
  )}`;
}

function prioridadeLabel(prioridade: string) {
  const mapa: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return mapa[prioridade] ?? prioridade;
}

function statusLabel(status: string) {
  const mapa: Record<string, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
    PENDENTE: "Pendente",
    FEITA: "Feita",
    NAO_FEITA: "Não feita",
  };

  return mapa[status] ?? status;
}

export default function AgendaManutencao({
  mes,
  eventos,
  setores,
  maquinas,
  colaboradores,
  filtros,
}: AgendaManutencaoProps) {
  const router = useRouter();
  const hoje = obterHoje();

  const primeiroDiaComEvento =
    eventos.length > 0
      ? chaveDataEvento(eventos[0].data)
      : `${mes}-01`;

  const diaInicial =
    hoje.startsWith(`${mes}-`)
      ? hoje
      : primeiroDiaComEvento;

  const [
    diaSelecionado,
    setDiaSelecionado,
  ] = useState(diaInicial);

  const [
    setorSelecionado,
    setSetorSelecionado,
  ] = useState(filtros.setor);

  const [
    maquinaSelecionada,
    setMaquinaSelecionada,
  ] = useState(filtros.maquina);

  useEffect(() => {
    setDiaSelecionado(diaInicial);
  }, [diaInicial]);

  useEffect(() => {
    setSetorSelecionado(filtros.setor);
    setMaquinaSelecionada(filtros.maquina);
  }, [filtros.setor, filtros.maquina]);

  const eventosPorDia = useMemo(() => {
    const mapa = new Map<
      string,
      AgendaEvento[]
    >();

    for (const evento of eventos) {
      const chave = chaveDataEvento(
        evento.data
      );

      const eventosAtuais =
        mapa.get(chave) ?? [];

      eventosAtuais.push(evento);
      mapa.set(chave, eventosAtuais);
    }

    for (const eventosDia of mapa.values()) {
      eventosDia.sort(
        (eventoA, eventoB) => {
          if (
            eventoA.diaTodo &&
            !eventoB.diaTodo
          ) {
            return -1;
          }

          if (
            !eventoA.diaTodo &&
            eventoB.diaTodo
          ) {
            return 1;
          }

          return (
            new Date(
              eventoA.data
            ).getTime() -
            new Date(
              eventoB.data
            ).getTime()
          );
        }
      );
    }

    return mapa;
  }, [eventos]);

  const eventosDiaSelecionado =
    eventosPorDia.get(diaSelecionado) ?? [];

  const maquinasDisponiveis =
    useMemo(() => {
      if (!setorSelecionado) {
        return maquinas;
      }

      return maquinas.filter(
        (maquina) =>
          maquina.setorId ===
          setorSelecionado
      );
    }, [maquinas, setorSelecionado]);

  const celulasCalendario =
    useMemo<CelulaCalendario[]>(() => {
      const [ano, numeroMes] = mes
        .split("-")
        .map(Number);

      const primeiroDiaMes = new Date(
        ano,
        numeroMes - 1,
        1
      );

      const deslocamento =
        primeiroDiaMes.getDay();

      const inicioCalendario = new Date(
        ano,
        numeroMes - 1,
        1 - deslocamento
      );

      return Array.from(
        {
          length: 42,
        },
        (_, indice) => {
          const data = new Date(
            inicioCalendario
          );

          data.setDate(
            inicioCalendario.getDate() +
              indice
          );

          return {
            chave: chaveDataLocal(data),

            mesChave: `${data.getFullYear()}-${pad(
              data.getMonth() + 1
            )}`,

            numero: data.getDate(),

            pertenceAoMes:
              data.getMonth() ===
                numeroMes - 1 &&
              data.getFullYear() === ano,
          };
        }
      );
    }, [mes]);

  const totalEventosOS = eventos.filter(
    (evento) => evento.origem === "OS"
  ).length;

  const totalPreventivas = eventos.filter(
    (evento) =>
      evento.origem === "PREVENTIVA"
  ).length;

  const totalDiasComEventos =
    eventosPorDia.size;

  function montarLinkMes(
    novoMes: string
  ) {
    const parametros =
      new URLSearchParams();

    parametros.set("mes", novoMes);

    if (filtros.setor) {
      parametros.set(
        "setor",
        filtros.setor
      );
    }

    if (filtros.maquina) {
      parametros.set(
        "maquina",
        filtros.maquina
      );
    }

    if (filtros.colaborador) {
      parametros.set(
        "colaborador",
        filtros.colaborador
      );
    }

    if (filtros.tipo) {
      parametros.set(
        "tipo",
        filtros.tipo
      );
    }

    return `/admin/os/agenda?${parametros.toString()}`;
  }

  function alterarSetor(
    novoSetorId: string
  ) {
    setSetorSelecionado(novoSetorId);
    setMaquinaSelecionada("");
  }

  function selecionarDia(
    celula: CelulaCalendario
  ) {
    if (!celula.pertenceAoMes) {
      router.push(
        montarLinkMes(celula.mesChave)
      );

      return;
    }

    setDiaSelecionado(celula.chave);
  }

  return (
    <>
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 sm:p-6">
        <form
          action="/admin/os/agenda"
          method="GET"
          className="space-y-5"
        >
          <input
            type="hidden"
            name="mes"
            value={mes}
          />

          <div className="flex items-center gap-2">
            <Filter
              size={18}
              className="text-cyan-300"
            />

            <h2 className="font-black">
              Filtros da agenda
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-400">
                Setor
              </label>

              <select
                name="setor"
                value={setorSelecionado}
                onChange={(event) =>
                  alterarSetor(
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              >
                <option value="">
                  Todos os setores
                </option>

                {setores.map((setor) => (
                  <option
                    key={setor.id}
                    value={setor.id}
                  >
                    {setor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-400">
                Máquina
              </label>

              <select
                name="maquina"
                value={maquinaSelecionada}
                onChange={(event) =>
                  setMaquinaSelecionada(
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              >
                <option value="">
                  Todas as máquinas
                </option>

                {maquinasDisponiveis.map(
                  (maquina) => (
                    <option
                      key={maquina.id}
                      value={maquina.id}
                    >
                      {maquina.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-400">
                Responsável
              </label>

              <select
                name="colaborador"
                defaultValue={
                  filtros.colaborador
                }
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              >
                <option value="">
                  Todos os responsáveis
                </option>

                {colaboradores.map(
                  (colaborador) => (
                    <option
                      key={colaborador.id}
                      value={colaborador.id}
                    >
                      {colaborador.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-400">
                Tipo
              </label>

              <select
                name="tipo"
                defaultValue={filtros.tipo}
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-400"
              >
                <option value="">
                  Todos
                </option>

                <option value="OS">
                  Ordens de serviço
                </option>

                <option value="PREVENTIVA">
                  Preventivas
                </option>
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                <Filter size={16} />
                Filtrar
              </button>

              <Link
                href={`/admin/os/agenda?mes=${mes}`}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-white transition hover:bg-white/10"
                title="Limpar filtros"
              >
                <RotateCcw size={17} />
              </Link>
            </div>
          </div>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          label="Eventos no mês"
          valor={eventos.length}
          icon={<CalendarDays size={19} />}
        />

        <ResumoCard
          label="Eventos de OS"
          valor={totalEventosOS}
          icon={<Wrench size={19} />}
        />

        <ResumoCard
          label="Preventivas"
          valor={totalPreventivas}
          icon={<CheckCircle2 size={19} />}
        />

        <ResumoCard
          label="Dias com atividade"
          valor={totalDiasComEventos}
          icon={<Clock3 size={19} />}
        />
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
        <div className="min-w-0 xl:sticky xl:top-6 xl:h-fit">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/40">
            <div className="border-b border-white/10 bg-gradient-to-r from-white/[0.05] to-transparent px-5 py-5">
              <p className="capitalize text-lg font-semibold text-white">
                {formatarDataCompacta(
                  diaSelecionado
                )}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Clique em um dia para visualizar
                as atividades.
              </p>
            </div>

            <div className="p-5">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="capitalize text-lg font-black text-white">
                  {formatarMes(mes)}
                </h2>

                <div className="flex items-center gap-2">
                  <Link
                    href={montarLinkMes(
                      alterarMes(mes, -1)
                    )}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    title="Mês anterior"
                  >
                    <ArrowLeft size={17} />
                  </Link>

                  <Link
                    href={montarLinkMes(
                      alterarMes(mes, 1)
                    )}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    title="Próximo mês"
                  >
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-3">
                {DIAS_SEMANA.map(
                  (dia, index) => (
                    <div
                      key={`${dia}-${index}`}
                      className="flex h-8 items-center justify-center text-xs font-black uppercase text-slate-400"
                    >
                      {dia}
                    </div>
                  )
                )}

                {celulasCalendario.map(
                  (celula) => {
                    const eventosDoDia =
                      eventosPorDia.get(
                        celula.chave
                      ) ?? [];

                    const selecionado =
                      celula.chave ===
                      diaSelecionado;

                    const eHoje =
                      celula.chave === hoje;

                    const tiposDoDia =
                      Array.from(
                        new Set(
                          eventosDoDia.map(
                            (evento) =>
                              evento.tipo
                          )
                        )
                      ).slice(0, 3);

                    return (
                      <button
                        key={celula.chave}
                        type="button"
                        onClick={() =>
                          selecionarDia(celula)
                        }
                        title={
                          eventosDoDia.length > 0
                            ? `${eventosDoDia.length} atividade(s)`
                            : "Sem atividades"
                        }
                        className="group flex min-h-[52px] flex-col items-center justify-start"
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${
                            selecionado
                              ? "bg-slate-200 text-slate-950 shadow-lg shadow-white/10"
                              : eHoje
                                ? "border border-cyan-300 bg-cyan-400/10 text-cyan-200"
                                : celula.pertenceAoMes
                                  ? "text-slate-200 group-hover:bg-white/10"
                                  : "text-slate-600 group-hover:bg-white/5"
                          }`}
                        >
                          {celula.numero}
                        </span>

                        <span className="mt-1 flex h-2 items-center justify-center gap-1">
                          {tiposDoDia.map(
                            (tipo) => (
                              <span
                                key={tipo}
                                className={`h-1.5 w-1.5 rounded-full ${
                                  ESTILOS_EVENTO[
                                    tipo
                                  ].ponto
                                }`}
                              />
                            )
                          )}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
                  Identificação dos eventos
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Legenda
                    cor="bg-blue-400"
                    texto="OS criada"
                  />

                  <Legenda
                    cor="bg-red-400"
                    texto="Máquina parada"
                  />

                  <Legenda
                    cor="bg-violet-400"
                    texto="Serviço iniciado"
                  />

                  <Legenda
                    cor="bg-amber-400"
                    texto="Data prevista"
                  />

                  <Legenda
                    cor="bg-emerald-400"
                    texto="OS concluída"
                  />

                  <Legenda
                    cor="bg-cyan-400"
                    texto="Preventiva"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-cyan-300">
                Linha do tempo do dia
              </p>

              <h2 className="mt-1 capitalize text-xl font-black text-white md:text-2xl">
                {formatarDataCompleta(
                  diaSelecionado
                )}
              </h2>
            </div>

            <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-slate-300">
              {eventosDiaSelecionado.length}{" "}
              atividade(s)
            </span>
          </div>

          {eventosDiaSelecionado.length ===
          0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <CalendarDays
                  size={36}
                  className="text-slate-600"
                />
              </div>

              <p className="mt-5 text-lg font-black text-slate-300">
                Nenhuma atividade neste dia
              </p>

              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Selecione no calendário um dia
                que tenha pontos coloridos para
                visualizar os acontecimentos.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              {eventosDiaSelecionado.map(
                (evento, indice) => (
                  <EventoTimeline
                    key={evento.id}
                    evento={evento}
                    ultimo={
                      indice ===
                      eventosDiaSelecionado.length -
                        1
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ResumoCard({
  label,
  valor,
  icon,
}: {
  label: string;
  valor: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#080d1f] p-5 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-400">
          {label}
        </p>

        <span className="text-cyan-300">
          {icon}
        </span>
      </div>

      <p className="mt-3 text-3xl font-black text-white">
        {valor}
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
    <div className="flex items-center gap-2 text-slate-400">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${cor}`}
      />

      <span>{texto}</span>
    </div>
  );
}

function EventoTimeline({
  evento,
  ultimo,
}: {
  evento: AgendaEvento;
  ultimo: boolean;
}) {
  const estilo =
    ESTILOS_EVENTO[evento.tipo];

  const responsaveisTexto =
    evento.responsaveis.length > 0
      ? evento.responsaveis.join(", ")
      : "Não atribuído";

  return (
    <div className="relative flex gap-3">
      <div className="w-12 shrink-0 pt-1 text-right sm:w-16">
        <span className="text-xs font-black text-white">
          {formatarHorario(
            evento.data,
            evento.diaTodo
          )}
        </span>

        <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-slate-600">
          {evento.origem}
        </span>
      </div>

      <div className="relative flex shrink-0 flex-col items-center">
        <span
          className={`relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full border-[3px] border-[#080d1f] ${estilo.ponto}`}
        />

        {!ultimo && (
          <span className="absolute bottom-0 top-4 w-px bg-white/15" />
        )}
      </div>

      <div
        className={`mb-3 min-w-0 flex-1 rounded-xl border px-3 py-3 ${estilo.fundo} ${estilo.borda}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p
              className={`text-[10px] font-black uppercase tracking-wider ${estilo.texto}`}
            >
              {estilo.label}
            </p>

            <h3 className="mt-1 break-words text-sm font-black text-white sm:text-base">
              {evento.titulo}
            </h3>

            <p className="mt-1 line-clamp-1 break-words text-xs font-semibold text-slate-400">
              {evento.subtitulo}
            </p>
          </div>

          <Link
            href={evento.href}
            className="inline-flex h-8 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white transition hover:bg-white/10 sm:w-fit"
          >
            <Eye size={13} />
            Abrir
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <InformacaoEvento
            icon={<Building2 size={12} />}
            label="Setor"
            valor={evento.setor}
          />

          <InformacaoEvento
            icon={<Wrench size={12} />}
            label="Máquina"
            valor={evento.maquina}
          />

          <InformacaoEvento
            icon={<User size={12} />}
            label="Responsáveis"
            valor={responsaveisTexto}
          />

          <InformacaoEvento
            icon={
              evento.tipo ===
              "MAQUINA_PARADA" ? (
                <CircleAlert size={12} />
              ) : evento.tipo ===
                "SERVICO_INICIADO" ? (
                <PlayCircle size={12} />
              ) : (
                <CheckCircle2 size={12} />
              )
            }
            label="Status"
            valor={statusLabel(
              evento.status
            )}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-300">
            {prioridadeLabel(
              evento.prioridade
            )}
          </span>

          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-300">
            {evento.origem === "OS"
              ? "Corretiva"
              : "Preventiva"}
          </span>
        </div>

        <details className="group mt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-white/10 bg-[#050816]/60 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/5">
            <span>
              Ver detalhes da atividade
            </span>

            <span className="text-sm transition-transform group-open:rotate-180">
              ▼
            </span>
          </summary>

          <div className="mt-2 rounded-lg border border-white/10 bg-[#050816]/70 p-3">
            <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-300 sm:text-sm">
              {evento.descricao}
            </p>

            {evento.resultado &&
              evento.resultado !==
                  evento.descricao && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    Serviço realizado
                  </p>

                  <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-300 sm:text-sm">
                    {evento.resultado}
                  </p>
                </div>
              )}
          </div>
        </details>
      </div>
    </div>
  );
}

function InformacaoEvento({
  icon,
  label,
  valor,
}: {
  icon: React.ReactNode;
  label: string;
  valor: string;
}) {
  return (
    <div
      title={`${label}: ${valor}`}
      className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-white/10 bg-[#050816]/70 px-2.5 py-1.5"
    >
      <span className="shrink-0 text-slate-500">
        {icon}
      </span>

      <span className="shrink-0 text-[9px] font-black uppercase tracking-wide text-slate-500">
        {label}:
      </span>

      <span className="max-w-[220px] truncate text-[10px] font-bold text-slate-200">
        {valor}
      </span>
    </div>
  );
}