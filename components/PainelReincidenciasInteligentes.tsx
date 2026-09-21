"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Filter,
  Layers3,
  Repeat2,
  RotateCcw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type OcorrenciaReincidencia = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  createdAt: string;
};

export type ReincidenciaPainel = {
  chave: string;
  maquinaId: string;
  maquinaNome: string;
  setorNome: string;
  conceitoId: string;
  conceitoLabel: string;
  componenteLabel: string | null;
  total: number;
  abertas: number;
  urgentes: number;
  janelaDias: number;
  nivel: "ALTA" | "MODERADA";
  ocorrencias: OcorrenciaReincidencia[];
};

type Props = {
  reincidencias: ReincidenciaPainel[];
};

const tooltipStyle = {
  backgroundColor: "#080d1f",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "14px",
  color: "#ffffff",
  boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
};

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
  };

  return labels[status] ?? status;
}

function prioridadeLabel(prioridade: string) {
  const labels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return labels[prioridade] ?? prioridade;
}

function resumirRotulo(valor: string) {
  if (valor.length <= 30) {
    return valor;
  }

  return `${valor.slice(0, 27)}...`;
}

export default function PainelReincidenciasInteligentes({
  reincidencias,
}: Props) {
  const [maquina, setMaquina] = useState("");
  const [falha, setFalha] = useState("");
  const [nivel, setNivel] = useState("");
  const [selecionadaChave, setSelecionadaChave] =
    useState(reincidencias[0]?.chave ?? "");

  const maquinas = useMemo(() => {
    const mapa = new Map<string, string>();

    for (const item of reincidencias) {
      mapa.set(item.maquinaId, item.maquinaNome);
    }

    return [...mapa.entries()]
      .map(([id, nome]) => ({
        id,
        nome,
      }))
      .sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
      );
  }, [reincidencias]);

  const falhas = useMemo(() => {
    const mapa = new Map<string, string>();

    for (const item of reincidencias) {
      mapa.set(item.conceitoId, item.conceitoLabel);
    }

    return [...mapa.entries()]
      .map(([id, nome]) => ({
        id,
        nome,
      }))
      .sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
      );
  }, [reincidencias]);

  const filtradas = useMemo(() => {
    return reincidencias.filter((item) => {
      if (maquina && item.maquinaId !== maquina) {
        return false;
      }

      if (falha && item.conceitoId !== falha) {
        return false;
      }

      if (nivel && item.nivel !== nivel) {
        return false;
      }

      return true;
    });
  }, [falha, maquina, nivel, reincidencias]);

  useEffect(() => {
    const aindaExiste = filtradas.some(
      (item) => item.chave === selecionadaChave
    );

    if (!aindaExiste) {
      setSelecionadaChave(
        filtradas[0]?.chave ?? ""
      );
    }
  }, [filtradas, selecionadaChave]);

  const selecionada =
    filtradas.find(
      (item) => item.chave === selecionadaChave
    ) ??
    filtradas[0] ??
    null;

  const dadosGrafico = useMemo(() => {
    return filtradas.slice(0, 12).map((item) => ({
      chave: item.chave,
      rotulo:
        `${item.maquinaNome} • ${item.conceitoLabel}`,
      maquina: item.maquinaNome,
      falha: item.conceitoLabel,
      abertas: item.abertas,
      concluidas: Math.max(
        0,
        item.total - item.abertas
      ),
      total: item.total,
      urgentes: item.urgentes,
    }));
  }, [filtradas]);

  const alturaGrafico = Math.max(
    360,
    Math.min(650, dadosGrafico.length * 54 + 110)
  );

  function limparFiltros() {
    setMaquina("");
    setFalha("");
    setNivel("");
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-violet-400/15 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] shadow-2xl shadow-black/30">
      <div className="border-b border-white/10 p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-violet-300">
              <Repeat2 size={20} />

              <p className="text-xs font-black uppercase tracking-[0.18em]">
                Reincidência inteligente
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Padrões de falha que estão se repetindo
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              O sistema cruza máquina, tipo de falha,
              componente e proximidade entre as ocorrências.
              Passe o mouse sobre o gráfico e use os filtros
              para investigar os padrões.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm font-black text-violet-200 xl:self-auto">
            <Layers3 size={17} />
            {filtradas.length} padrão(ões) exibido(s)
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_220px_auto]">
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
              <Filter size={14} />
              Máquina
            </label>

            <select
              value={maquina}
              onChange={(event) =>
                setMaquina(event.target.value)
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-bold text-white outline-none transition focus:border-violet-400"
            >
              <option value="">
                Todas as máquinas
              </option>

              {maquinas.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
              <Filter size={14} />
              Tipo de falha
            </label>

            <select
              value={falha}
              onChange={(event) =>
                setFalha(event.target.value)
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-bold text-white outline-none transition focus:border-violet-400"
            >
              <option value="">
                Todos os padrões
              </option>

              {falhas.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
              <Filter size={14} />
              Nível
            </label>

            <select
              value={nivel}
              onChange={(event) =>
                setNivel(event.target.value)
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-sm font-bold text-white outline-none transition focus:border-violet-400"
            >
              <option value="">
                Todos
              </option>
              <option value="ALTA">
                Alta reincidência
              </option>
              <option value="MODERADA">
                Moderada
              </option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10 xl:w-auto"
            >
              <RotateCcw size={16} />
              Limpar
            </button>
          </div>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <BarChart3
            size={42}
            className="mx-auto text-slate-600"
          />

          <h3 className="mt-4 text-lg font-black">
            Nenhuma reincidência com estes filtros
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Altere os filtros para visualizar outros padrões.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
            <div className="min-w-0 border-b border-white/10 p-5 sm:p-6 xl:border-b-0 xl:border-r">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-white">
                    Ocorrências por padrão
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Concluídas x ainda abertas
                  </p>
                </div>

                <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-400 sm:flex">
                  <BarChart3 size={15} />
                  Top {Math.min(12, dadosGrafico.length)}
                </div>
              </div>

              <div
                className="w-full"
                style={{
                  height: `${alturaGrafico}px`,
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={dadosGrafico}
                    layout="vertical"
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.07)"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{
                        fill: "#64748b",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="rotulo"
                      width={175}
                      tickFormatter={resumirRotulo}
                      tick={{
                        fill: "#cbd5e1",
                        fontSize: 11,
                        fontWeight: 700,
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

                    <Legend
                      wrapperStyle={{
                        fontSize: "12px",
                        paddingTop: "12px",
                      }}
                    />

                    <Bar
                      dataKey="concluidas"
                      name="Concluídas"
                      stackId="ocorrencias"
                      fill="#22d3ee"
                      radius={[7, 0, 0, 7]}
                      maxBarSize={28}
                    />

                    <Bar
                      dataKey="abertas"
                      name="Abertas"
                      stackId="ocorrencias"
                      fill="#a78bfa"
                      radius={[0, 7, 7, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="min-w-0 bg-black/10 p-5 sm:p-6">
              {selecionada && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                        Padrão selecionado
                      </p>

                      <h3 className="mt-2 break-words text-2xl font-black">
                        {selecionada.maquinaNome}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {selecionada.setorNome}
                      </p>
                    </div>

                    <span
                      className={
                        selecionada.nivel === "ALTA"
                          ? "rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-300"
                          : "rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-violet-300"
                      }
                    >
                      {selecionada.nivel}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-violet-400/15 bg-violet-400/[0.07] p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-violet-300">
                      Falha reconhecida
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {selecionada.conceitoLabel}
                    </p>

                    {selecionada.componenteLabel && (
                      <p className="mt-1 text-sm font-bold text-slate-400">
                        Componente:{" "}
                        {selecionada.componenteLabel}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Ocorrências
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {selecionada.total}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Ainda abertas
                      </p>
                      <p className="mt-1 text-2xl font-black text-violet-300">
                        {selecionada.abertas}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Alta/Urgente
                      </p>
                      <p className="mt-1 text-2xl font-black text-rose-300">
                        {selecionada.urgentes}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Janela
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {selecionada.janelaDias}d
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Ordens relacionadas
                    </p>

                    <div className="mt-3 space-y-2">
                      {selecionada.ocorrencias.map(
                        (os) => (
                          <Link
                            key={os.id}
                            href={`/admin/os/${os.id}`}
                            className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.06]"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-black text-cyan-300">
                                  OS #{os.numero}
                                </span>

                                <span className="text-[10px] font-bold text-slate-500">
                                  {formatarData(
                                    os.createdAt
                                  )}
                                </span>
                              </div>

                              <p className="mt-1 truncate text-sm font-black text-white">
                                {os.titulo}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-500">
                                {statusLabel(os.status)}
                                {" • "}
                                {prioridadeLabel(
                                  os.prioridade
                                )}
                              </p>
                            </div>

                            <ArrowUpRight
                              size={16}
                              className="shrink-0 text-slate-600 transition group-hover:text-cyan-300"
                            />
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 p-5 sm:p-6">
            <div className="mb-4">
              <p className="text-sm font-black">
                Padrões detectados
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Clique em um padrão para abrir a análise detalhada.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtradas.map((item) => {
                const ativo =
                  item.chave === selecionada?.chave;

                return (
                  <button
                    key={item.chave}
                    type="button"
                    onClick={() =>
                      setSelecionadaChave(item.chave)
                    }
                    className={
                      ativo
                        ? "rounded-2xl border border-violet-400/35 bg-violet-400/10 p-4 text-left shadow-lg shadow-violet-950/20 transition"
                        : "rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-violet-400/20 hover:bg-white/[0.05]"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black">
                          {item.maquinaNome}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {item.setorNome}
                        </p>
                      </div>

                      <span className="text-2xl font-black text-violet-300">
                        {item.total}x
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-black text-slate-300">
                      {item.conceitoLabel}
                    </p>

                    {item.componenteLabel && (
                      <p className="mt-1 text-xs text-slate-500">
                        {item.componenteLabel}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
