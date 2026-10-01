"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  CalendarClock,
  CircleAlert,
  Eye,
  Factory,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  MAPA_FABRICA_ALTURA,
  MAPA_FABRICA_LARGURA,
  ZONAS_MAPA_FABRICA,
  type ZonaMapaFabrica,
} from "@/src/lib/mapaFabricaConfig";

type SetorMapa = {
  id: string;
  nome: string;
  empresaId: string | null;
  empresaNome: string | null;
  empresaSigla: string | null;
  maquinas: Array<{ id: string; nome: string }>;
};

type OrdemMapa = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  createdAt: string;
  dataPrevista: string | null;
  dataConclusao: string | null;
  dataParada: string | null;
  setorId: string;
  maquina: { id: string; nome: string } | null;
  responsaveis: Array<{ id: string; nome: string }>;
};

type PreventivaMapa = {
  id: string;
  status: string;
  dataProgramada: string;
  dataConclusao: string | null;
  plano: {
    id: string;
    titulo: string;
    prioridade: string;
    setorId: string;
    maquina: { id: string; nome: string } | null;
  };
};

type Props = {
  empresaLabel: string;
  agoraISO: string;
  setores: SetorMapa[];
  ordens: OrdemMapa[];
  preventivas: PreventivaMapa[];
};

type ModoMapa = "GERAL" | "OS" | "PREVENTIVAS";

type ResumoSetor = {
  setor: SetorMapa;
  abertas: number;
  naoIniciadas: number;
  emAndamento: number;
  concluidasPeriodo: number;
  urgentesAbertas: number;
  altasAbertas: number;
  atrasadas: number;
  maquinasParadas: number;
  preventivasAtrasadas: number;
  preventivasProximas: number;
  totalPeriodo: number;
  score: number;
};

type ZonaResolvida = ZonaMapaFabrica & {
  setor: SetorMapa | undefined;
  resumo: ResumoSetor | null;
};

const DIA_MS = 86_400_000;

const CORES_STATUS: Record<string, string> = {
  NAO_INICIADA: "#f59e0b",
  EM_ANDAMENTO: "#38bdf8",
  CONCLUIDA: "#10b981",
};

const CORES_PRIORIDADE: Record<string, string> = {
  BAIXA: "#64748b",
  MEDIA: "#facc15",
  ALTA: "#f97316",
  URGENTE: "#ef4444",
};

const tooltipStyle = {
  backgroundColor: "#080d1f",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "14px",
  color: "#ffffff",
  boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
};

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatarData(data: string | null) {
  if (!data) return "-";

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

function resolverSetorDaZona(zona: ZonaMapaFabrica, setores: SetorMapa[]) {
  const setorPrincipal = normalizar(zona.setorSistema);

  const exato = setores.find((setor) => normalizar(setor.nome) === setorPrincipal);

  if (exato) return exato;

  const referencias = [zona.setorSistema, zona.label, ...zona.aliases].map(normalizar);

  return setores.find((setor) => {
    const nome = normalizar(setor.nome);
    if (nome.length < 3) return false;

    return referencias.some(
      (referencia) =>
        referencia === nome ||
        (referencia.length >= 5 && nome.length >= 5 && (referencia.includes(nome) || nome.includes(referencia)))
    );
  });
}

function inicioDia(data: Date) {
  const nova = new Date(data);
  nova.setHours(0, 0, 0, 0);
  return nova;
}

function corDoScore(score: number) {
  if (score >= 75) {
    return { fill: "#ef4444", stroke: "#fecaca", glow: "rgba(239,68,68,0.45)", escuro: "#7f1d1d", label: "Crítica" };
  }
  if (score >= 50) {
    return { fill: "#f97316", stroke: "#fdba74", glow: "rgba(249,115,22,0.35)", escuro: "#7c2d12", label: "Alta" };
  }
  if (score >= 25) {
    return { fill: "#facc15", stroke: "#fde68a", glow: "rgba(250,204,21,0.30)", escuro: "#713f12", label: "Atenção" };
  }
  if (score > 0) {
    return { fill: "#22c55e", stroke: "#bbf7d0", glow: "rgba(34,197,94,0.28)", escuro: "#14532d", label: "Baixa" };
  }

  return { fill: "#22d3ee", stroke: "#a5f3fc", glow: "rgba(34,211,238,0.22)", escuro: "#164e63", label: "Sem ocorrência" };
}

function calcularScore(resumo: Omit<ResumoSetor, "setor" | "score">) {
  return Math.min(
    100,
    resumo.urgentesAbertas * 24 +
      resumo.altasAbertas * 12 +
      resumo.atrasadas * 9 +
      resumo.preventivasAtrasadas * 14 +
      resumo.abertas * 4 +
      resumo.maquinasParadas * 12
  );
}

function Kpi({
  titulo,
  valor,
  descricao,
  icon,
  destaque = "cyan",
}: {
  titulo: string;
  valor: number | string;
  descricao: string;
  icon: ReactNode;
  destaque?: "cyan" | "emerald" | "amber" | "rose" | "violet";
}) {
  const estilo = {
    cyan: "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300",
    emerald: "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300",
    amber: "border-amber-400/20 bg-amber-400/[0.06] text-amber-300",
    rose: "border-rose-400/20 bg-rose-400/[0.06] text-rose-300",
    violet: "border-violet-400/20 bg-violet-400/[0.06] text-violet-300",
  }[destaque];

  return (
    <div className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${estilo}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{titulo}</p>
          <p className="mt-2 text-3xl font-black text-white">{valor}</p>
          <p className="mt-1 text-xs text-slate-400">{descricao}</p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/20">{icon}</div>
      </div>
    </div>
  );
}

export default function MapaFabricaInterativo({
  empresaLabel,
  agoraISO,
  setores,
  ordens,
  preventivas,
}: Props) {
  const agora = useMemo(() => new Date(agoraISO), [agoraISO]);
  const mapaRef = useRef<HTMLDivElement>(null);

  const [periodo, setPeriodo] = useState(30);
  const [modo, setModo] = useState<ModoMapa>("GERAL");
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [setorSelecionadoId, setSetorSelecionadoId] = useState("");
  const [zonaSelecionadaId, setZonaSelecionadaId] = useState("");
  const [zonaHover, setZonaHover] = useState<string | null>(null);

  useEffect(() => {
    function atualizarFullscreen() {
      setFullscreen(document.fullscreenElement === mapaRef.current);
    }

    document.addEventListener("fullscreenchange", atualizarFullscreen);
    return () => document.removeEventListener("fullscreenchange", atualizarFullscreen);
  }, []);


  const limitePeriodo = useMemo(() => new Date(agora.getTime() - periodo * DIA_MS), [agora, periodo]);
  const hoje = useMemo(() => inicioDia(agora), [agora]);
  const emSeteDias = useMemo(() => new Date(hoje.getTime() + 7 * DIA_MS), [hoje]);

  const resumos = useMemo(() => {
    const mapa = new Map<string, ResumoSetor>();
    const ordensPorSetor = new Map<string, OrdemMapa[]>();
    const preventivasPorSetor = new Map<string, PreventivaMapa[]>();

    for (const os of ordens) {
      const lista = ordensPorSetor.get(os.setorId) ?? [];
      lista.push(os);
      ordensPorSetor.set(os.setorId, lista);
    }

    for (const preventiva of preventivas) {
      const setorId = preventiva.plano.setorId;
      const lista = preventivasPorSetor.get(setorId) ?? [];
      lista.push(preventiva);
      preventivasPorSetor.set(setorId, lista);
    }

    for (const setor of setores) {
      const ordensSetor = ordensPorSetor.get(setor.id) ?? [];
      const abertas = ordensSetor.filter((os) => os.status === "NAO_INICIADA" || os.status === "EM_ANDAMENTO");
      const naoIniciadas = abertas.filter((os) => os.status === "NAO_INICIADA").length;
      const emAndamento = abertas.filter((os) => os.status === "EM_ANDAMENTO").length;
      const urgentesAbertas = abertas.filter((os) => os.prioridade === "URGENTE").length;
      const altasAbertas = abertas.filter((os) => os.prioridade === "ALTA").length;
      const atrasadas = abertas.filter((os) => os.dataPrevista && new Date(os.dataPrevista).getTime() < hoje.getTime()).length;
      const maquinasParadas = abertas.filter((os) => Boolean(os.dataParada)).length;
      const concluidasPeriodo = ordensSetor.filter((os) => os.status === "CONCLUIDA" && os.dataConclusao && new Date(os.dataConclusao).getTime() >= limitePeriodo.getTime()).length;
      const totalPeriodo = ordensSetor.filter((os) => new Date(os.createdAt).getTime() >= limitePeriodo.getTime()).length;
      const preventivasSetor = preventivasPorSetor.get(setor.id) ?? [];
      const preventivasAtrasadas = preventivasSetor.filter((preventiva) => (["PROGRAMADA", "PENDENTE", "EM_EXECUCAO"].includes(preventiva.status)) && new Date(preventiva.dataProgramada).getTime() < hoje.getTime()).length;
      const preventivasProximas = preventivasSetor.filter((preventiva) => {
        const data = new Date(preventiva.dataProgramada).getTime();
        return (["PROGRAMADA", "PENDENTE"].includes(preventiva.status)) && data >= hoje.getTime() && data <= emSeteDias.getTime();
      }).length;

      const base = { abertas: abertas.length, naoIniciadas, emAndamento, concluidasPeriodo, urgentesAbertas, altasAbertas, atrasadas, maquinasParadas, preventivasAtrasadas, preventivasProximas, totalPeriodo };
      mapa.set(setor.id, { setor, ...base, score: calcularScore(base) });
    }

    return mapa;
  }, [emSeteDias, hoje, limitePeriodo, ordens, preventivas, setores]);

  const zonasResolvidas = useMemo<ZonaResolvida[]>(() => ZONAS_MAPA_FABRICA.map((zona) => {
    const setor = resolverSetorDaZona(zona, setores);
    return { ...zona, setor, resumo: setor ? resumos.get(setor.id) ?? null : null };
  }), [resumos, setores]);

  const zonaSelecionada = zonaSelecionadaId ? zonasResolvidas.find((zona) => zona.id === zonaSelecionadaId) ?? null : null;
  const resumoSelecionado = setorSelecionadoId ? resumos.get(setorSelecionadoId) ?? null : null;
  const setorSelecionado = resumoSelecionado?.setor ?? null;

  const zonasDoMesmoSetor = useMemo(() => setorSelecionado ? zonasResolvidas.filter((zona) => zona.setor?.id === setorSelecionado.id) : [], [setorSelecionado, zonasResolvidas]);
  const ordensSelecionadas = useMemo(() => setorSelecionado ? ordens.filter((os) => os.setorId === setorSelecionado.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [], [ordens, setorSelecionado]);
  const preventivasSelecionadas = useMemo(() => setorSelecionado ? preventivas.filter((preventiva) => preventiva.plano.setorId === setorSelecionado.id).sort((a, b) => new Date(a.dataProgramada).getTime() - new Date(b.dataProgramada).getTime()) : [], [preventivas, setorSelecionado]);

  const dadosStatus = useMemo(() => {
    if (!setorSelecionado) return [];
    const dados = [
      { name: "Não iniciada", key: "NAO_INICIADA", value: ordensSelecionadas.filter((os) => os.status === "NAO_INICIADA").length },
      { name: "Em andamento", key: "EM_ANDAMENTO", value: ordensSelecionadas.filter((os) => os.status === "EM_ANDAMENTO").length },
      { name: "Concluídas", key: "CONCLUIDA", value: ordensSelecionadas.filter((os) => os.status === "CONCLUIDA" && os.dataConclusao && new Date(os.dataConclusao).getTime() >= limitePeriodo.getTime()).length },
    ];
    return dados.filter((item) => item.value > 0);
  }, [limitePeriodo, ordensSelecionadas, setorSelecionado]);

  const dadosPrioridade = useMemo(() => {
    if (!setorSelecionado) return [];
    const abertas = ordensSelecionadas.filter((os) => os.status === "NAO_INICIADA" || os.status === "EM_ANDAMENTO");
    return ["BAIXA", "MEDIA", "ALTA", "URGENTE"].map((prioridade) => ({ prioridade: prioridadeLabel(prioridade), key: prioridade, total: abertas.filter((os) => os.prioridade === prioridade).length }));
  }, [ordensSelecionadas, setorSelecionado]);

  const totaisGerais = useMemo(() => {
    let abertas = 0;
    let urgentes = 0;
    let preventivasAtrasadas = 0;
    let setoresComAtividade = 0;
    for (const resumo of resumos.values()) {
      abertas += resumo.abertas;
      urgentes += resumo.urgentesAbertas;
      preventivasAtrasadas += resumo.preventivasAtrasadas;
      if (resumo.abertas > 0 || resumo.preventivasAtrasadas > 0 || resumo.preventivasProximas > 0) setoresComAtividade += 1;
    }
    return { abertas, urgentes, preventivasAtrasadas, setoresComAtividade };
  }, [resumos]);

  const rankingAtividade = useMemo(() => [...resumos.values()].sort((a, b) => (b.abertas + b.preventivasAtrasadas * 2) - (a.abertas + a.preventivasAtrasadas * 2)).slice(0, 5), [resumos]);

  function intensidadeDaZona(resumo: ResumoSetor | null) {
    if (!resumo) return { score: 0, valor: 0 };
    if (modo === "OS") {
      return { score: Math.min(100, resumo.urgentesAbertas * 30 + resumo.altasAbertas * 15 + resumo.atrasadas * 10 + resumo.abertas * 5), valor: resumo.abertas };
    }
    if (modo === "PREVENTIVAS") {
      return { score: Math.min(100, resumo.preventivasAtrasadas * 28 + resumo.preventivasProximas * 8), valor: resumo.preventivasAtrasadas + resumo.preventivasProximas };
    }
    return { score: resumo.score, valor: resumo.abertas + resumo.preventivasAtrasadas };
  }

  async function alternarFullscreen() {
    if (!mapaRef.current) return;
    if (document.fullscreenElement === mapaRef.current) {
      await document.exitFullscreen();
      return;
    }
    await mapaRef.current.requestFullscreen();
  }


  function selecionarZona(zona: ZonaResolvida) {
    if (!zona.setor) return;
    setZonaSelecionadaId(zona.id);
    setSetorSelecionadoId(zona.setor.id);
  }

  function selecionarSetorDireto(setorId: string) {
    setSetorSelecionadoId(setorId);
    const primeiraZona = zonasResolvidas.find((zona) => zona.setor?.id === setorId);
    setZonaSelecionadaId(primeiraZona?.id ?? "");
  }

  function limparSelecao() {
    setSetorSelecionadoId("");
    setZonaSelecionadaId("");
  }

  const zonaHoverInfo = zonaHover ? zonasResolvidas.find((zona) => zona.id === zonaHover) ?? null : null;
  const corSelecionada = resumoSelecionado ? corDoScore(intensidadeDaZona(resumoSelecionado).score) : corDoScore(0);

  return (
    <div className="space-y-5">

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi titulo="OS abertas" valor={totaisGerais.abertas} descricao="Não iniciadas + em andamento" icon={<Factory size={18} />} destaque="cyan" />
        <Kpi titulo="Urgentes abertas" valor={totaisGerais.urgentes} descricao="Prioridade máxima na planta" icon={<CircleAlert size={18} />} destaque="rose" />
        <Kpi titulo="Preventivas atrasadas" valor={totaisGerais.preventivasAtrasadas} descricao="Execuções com data vencida" icon={<CalendarClock size={18} />} destaque="amber" />
        <Kpi titulo="Setores com atividade" valor={totaisGerais.setoresComAtividade} descricao="OS ou preventivas em atenção" icon={<Box size={18} />} destaque="violet" />
      </section>

      <section ref={mapaRef} className={fullscreen ? "h-screen overflow-auto bg-[#020617] p-4" : "overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30"}>
        <div className="flex flex-col gap-4 border-b border-white/10 bg-[#050816]/95 p-4 backdrop-blur sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Planta operacional • {empresaLabel}</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-violet-300">leve e otimizado</span>
            </div>
            <h2 className="mt-1 text-xl font-black">Mapa interativo da fábrica</h2>
            <p className="mt-1 text-sm text-slate-500">Passe o mouse sobre um setor para visualizar o destaque e clique para abrir os dados.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-white/10 bg-black/20 p-1">
              {([ ["GERAL", "Geral"], ["OS", "OS"], ["PREVENTIVAS", "Preventivas"] ] as const).map(([valor, label]) => (
                <button key={valor} type="button" onClick={() => setModo(valor)} className={modo === valor ? "rounded-xl bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20" : "rounded-xl px-3 py-2 text-xs font-black text-slate-400 transition hover:text-white"}>{label}</button>
              ))}
            </div>

            <div className="flex rounded-2xl border border-white/10 bg-black/20 p-1">
              {[7, 30, 90].map((dias) => (
                <button key={dias} type="button" onClick={() => setPeriodo(dias)} className={periodo === dias ? "rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white" : "rounded-xl px-3 py-2 text-xs font-black text-slate-500 transition hover:text-white"}>{dias}d</button>
              ))}
            </div>


            <button type="button" onClick={() => setZoom((atual) => Math.max(1, Number((atual - 0.1).toFixed(2))))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10" aria-label="Diminuir zoom"><ZoomOut size={17} /></button>
            <button type="button" onClick={() => setZoom((atual) => Math.min(1.4, Number((atual + 0.1).toFixed(2))))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10" aria-label="Aumentar zoom"><ZoomIn size={17} /></button>
            <button type="button" onClick={() => { setZoom(1); limparSelecao(); }} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10" aria-label="Redefinir mapa"><RotateCcw size={17} /></button>
            <button type="button" onClick={alternarFullscreen} className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950" aria-label="Tela cheia">{fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
          </div>
        </div>

        <div className="grid min-h-0 xl:grid-cols-[minmax(0,1.5fr)_380px] 2xl:grid-cols-[minmax(0,1.6fr)_420px]">
          <div className="min-w-0 border-b border-white/10 xl:border-b-0 xl:border-r">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-400">
                <span className="mr-1 uppercase tracking-wider text-slate-500">Criticidade</span>
                {[["#22d3ee", "Sem ocorrência"],["#22c55e", "Baixa"],["#facc15", "Atenção"],["#f97316", "Alta"],["#ef4444", "Crítica"]].map(([cor,label]) => (<span key={label} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cor }} />{label}</span>))}
              </div>
              <div className="hidden text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:block">Passe o mouse sobre um setor</div>
            </div>

            <div className="relative overflow-auto bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.045),transparent_68%)] p-3 sm:p-5" style={{ contain: "layout paint style" }} >
              <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(34,211,238,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] [background-size:42px_42px]" />

              {zonaHoverInfo && (
                <div className="pointer-events-none absolute left-6 top-6 z-40 max-w-[320px] rounded-2xl border border-white/10 bg-[#050816]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: corDoScore(intensidadeDaZona(zonaHoverInfo.resumo).score).fill }} />
                    <p className="text-xs font-black uppercase tracking-wide text-cyan-300">{zonaHoverInfo.label}</p>
                  </div>
                  {zonaHoverInfo.setor && zonaHoverInfo.resumo ? (
                    <>
                      <p className="mt-2 text-xs font-bold text-slate-300">Setor do sistema: {zonaHoverInfo.setor.nome}</p>
                      <p className="mt-1 text-xs text-slate-500">{zonaHoverInfo.resumo.abertas} OS aberta(s) • {zonaHoverInfo.resumo.preventivasAtrasadas} preventiva(s) atrasada(s)</p>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">Não foi encontrado um setor correspondente no cadastro atual.</p>
                  )}
                </div>
              )}

              <div className="mx-auto transition-[width] duration-300" style={{ width: `${zoom * 100}%`, minWidth: zoom > 1 ? `${zoom * 100}%` : "100%" }}>
                <div className="relative mx-auto">
                  <div className="pointer-events-none absolute inset-[4%] rounded-[34px] bg-cyan-500/10 blur-3xl" style={{ transform: "translate3d(0,24px,-40px) scale(.98)" }} />
                  <div className="pointer-events-none absolute inset-0 rounded-[26px] border border-cyan-400/10 bg-[#020617]" style={{ transform: "translate3d(0,16px,-28px)", boxShadow: "0 30px 90px rgba(0,0,0,.42)" }} />

                  <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-white shadow-[0_26px_80px_rgba(0,0,0,0.42)]" style={{ aspectRatio: `${MAPA_FABRICA_LARGURA} / ${MAPA_FABRICA_ALTURA}`, transformStyle: "preserve-3d" }}>
                    <Image src="/mapa-fabrica-sequoia-3d.png" alt="Planta 3D da fábrica Sequoia" fill priority sizes="(max-width: 1280px) 100vw, 72vw" className="select-none object-fill" draggable={false} />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-cyan-950/5" style={{ transform: "translateZ(6px)" }} />

                    <svg viewBox={`0 0 ${MAPA_FABRICA_LARGURA} ${MAPA_FABRICA_ALTURA}`} className="absolute inset-0 h-full w-full overflow-visible" aria-label="Áreas clicáveis da fábrica" >
                      {zonasResolvidas.map((zona) => {
                        const intensidade = intensidadeDaZona(zona.resumo);
                        const cor = corDoScore(intensidade.score);
                        const hover = zonaHover === zona.id;

                        return (
                          <g
                            key={zona.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Abrir área ${zona.label}`}
                            onMouseEnter={() => setZonaHover(zona.id)}
                            onMouseLeave={() => setZonaHover(null)}
                            onClick={() => selecionarZona(zona)}
                            onKeyDown={(event) => {
                              if ((event.key === "Enter" || event.key === " ") && zona.setor) selecionarZona(zona);
                            }}
                            className={zona.setor ? "cursor-pointer outline-none" : "cursor-default outline-none"}
                          >
                            <polygon
                              points={zona.points}
                              fill={zona.setor ? cor.fill : "#94a3b8"}
                              fillOpacity={hover && zona.setor ? 0.17 : 0.001}
                              stroke="none"
                              style={{
                                filter:
                                  hover && zona.setor
                                    ? `drop-shadow(0 0 13px ${cor.glow})`
                                    : "none",
                                transition: "fill-opacity 140ms ease, filter 140ms ease",
                              }}
                            />

                            <title>{zona.setor ? `${zona.label} → ${zona.setor.nome}` : `${zona.label} — sem vínculo encontrado`}</title>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="min-w-0 bg-[linear-gradient(180deg,rgba(5,8,22,.96),rgba(2,6,23,.98))]">
            {resumoSelecionado && setorSelecionado ? (
              <div className="flex h-full flex-col">
                <div className="relative overflow-hidden border-b border-white/10 p-5">
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href="/admin" className="inline-flex h-8 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-300 transition hover:bg-white/10"><ArrowLeft size={13} /> voltar</Link>
                      </div>

                      <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Área selecionada</p>
                      <h3 className="mt-1 break-words text-2xl font-black">{zonaSelecionada?.label ?? setorSelecionado.nome}</h3>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">Setor do sistema: {setorSelecionado.nome}</span>
                        {zonasDoMesmoSetor.length > 1 && (<span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-violet-300">{zonasDoMesmoSetor.length} áreas vinculadas</span>)}
                      </div>
                    </div>

                    <button type="button" onClick={limparSelecao} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Fechar setor">✕</button>
                  </div>

                  <div className="mt-5 grid grid-cols-[92px_1fr] gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="relative flex h-[78px] w-[78px] items-center justify-center rounded-full" style={{ background: `conic-gradient(${corSelecionada.fill} ${Math.max(4, resumoSelecionado.score)}%, rgba(255,255,255,.07) 0)` }}>
                      <div className="flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full bg-[#050816]">
                        <span className="text-xl font-black">{resumoSelecionado.score}</span>
                        <span className="text-[8px] font-black uppercase tracking-wide text-slate-500">índice</span>
                      </div>
                    </div>
                    <div className="min-w-0 self-center">
                      <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: corSelecionada.fill }}>Criticidade {corSelecionada.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">Composição de OS abertas, prioridade, atrasos, máquina parada e preventiva vencida.</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">OS abertas</p><p className="mt-1 text-2xl font-black text-cyan-300">{resumoSelecionado.abertas}</p></div>
                    <div className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.05] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Alta/Urgente</p><p className="mt-1 text-2xl font-black text-rose-300">{resumoSelecionado.altasAbertas + resumoSelecionado.urgentesAbertas}</p></div>
                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Concluídas {periodo}d</p><p className="mt-1 text-2xl font-black text-emerald-300">{resumoSelecionado.concluidasPeriodo}</p></div>
                    <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Prev. atrasadas</p><p className="mt-1 text-2xl font-black text-amber-300">{resumoSelecionado.preventivasAtrasadas}</p></div>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Status das OS</p><div className="mt-3 h-[185px]">{dadosStatus.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dadosStatus} dataKey="value" nameKey="name" innerRadius={42} outerRadius={66} paddingAngle={3}>{dadosStatus.map((item) => <Cell key={item.key} fill={CORES_STATUS[item.key]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer>) : (<div className="flex h-full items-center justify-center text-xs text-slate-600">Sem OS no período.</div>)}</div></div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Prioridade aberta</p><div className="mt-3 h-[185px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={dadosPrioridade} margin={{ top: 10, right: 4, left: -28, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="prioridade" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="total" name="OS" radius={[6,6,0,0]} maxBarSize={32}>{dadosPrioridade.map((item) => <Cell key={item.key} fill={CORES_PRIORIDADE[item.key]} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Ordens recentes</p><p className="mt-1 text-sm text-slate-400">Últimas movimentações do setor</p></div><Link href={setorSelecionado.empresaId ? `/admin/os?empresaId=${encodeURIComponent(setorSelecionado.empresaId)}&setorId=${encodeURIComponent(setorSelecionado.id)}#planner-os` : "/admin/os"} className="text-xs font-black text-cyan-300 hover:text-cyan-200">Ver todas</Link></div>
                    <div className="space-y-2">{ordensSelecionadas.slice(0, 6).map((os) => (<Link key={os.id} href={`/admin/os/${os.id}`} className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.05]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wide text-cyan-300">OS #{os.numero}</p><p className="mt-1 truncate text-sm font-black">{os.titulo}</p><p className="mt-1 truncate text-[11px] text-slate-500">{os.maquina?.nome ?? "Sem máquina"} • {statusLabel(os.status)}</p></div><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CORES_PRIORIDADE[os.prioridade] ?? "#64748b" }} /></div></Link>))}
                    {ordensSelecionadas.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-xs text-slate-600">Nenhuma OS encontrada para este setor.</div>}</div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Preventivas</p>
                    <div className="mt-3 space-y-2">{preventivasSelecionadas.filter((preventiva) => preventiva.status !== "CANCELADA").slice(0, 5).map((preventiva) => {
                      const atrasada = (["PROGRAMADA", "PENDENTE", "EM_EXECUCAO"].includes(preventiva.status)) && new Date(preventiva.dataProgramada).getTime() < hoje.getTime();
                      return (
                        <Link key={preventiva.id} href={`/admin/os/preventivas/execucoes/${preventiva.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                          <div className="min-w-0"><p className="truncate text-sm font-black">{preventiva.plano.titulo}</p><p className="mt-1 text-[11px] text-slate-500">{formatarData(preventiva.dataProgramada)} • {preventiva.plano.maquina?.nome ?? "Sem máquina"}</p></div>
                          <span className={atrasada ? "rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-[9px] font-black uppercase text-rose-300" : "rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[9px] font-black uppercase text-cyan-300"}>{atrasada ? "Atrasada" : preventiva.status === "CONCLUIDA" ? "Concluída" : "Programada"}</span>
                        </Link>
                      );
                    })}
                    {preventivasSelecionadas.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-xs text-slate-600">Nenhuma preventiva encontrada para este setor.</div>}</div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <Link href="/admin/os/nova" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-xs font-black text-slate-950 transition hover:bg-cyan-300"><Plus size={15} /> Nova OS</Link>
                    <Link href="/admin/os/preventivas/lista" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white transition hover:bg-white/10"><CalendarClock size={15} /> Preventivas</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[590px] flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,.10)]"><Eye size={21} /></div>
                    <h3 className="mt-4 text-2xl font-black">Visão da planta</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">O mapa fica totalmente limpo quando está parado. O destaque aparece somente ao passar o mouse sobre uma área e desaparece ao sair.</p>
                  </div>
                  <Link href="/admin" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-black text-slate-300 transition hover:bg-white/10"><ArrowLeft size={14} /> Voltar</Link>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Abrir setor diretamente</label>
                  <select value={setorSelecionadoId} onChange={(event) => selecionarSetorDireto(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#020617] px-3 text-sm font-bold text-white outline-none focus:border-cyan-400">
                    <option value="">Selecione...</option>
                    {setores.map((setor) => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
                  </select>
                </div>

                <div className="mt-6"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Radar da planta</p><div className="mt-3 space-y-2">{rankingAtividade.map((resumo) => (<button key={resumo.setor.id} type="button" onClick={() => selecionarSetorDireto(resumo.setor.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.05]"><div className="min-w-0"><p className="truncate text-sm font-black">{resumo.setor.nome}</p><p className="mt-1 text-[11px] text-slate-500">{resumo.abertas} OS aberta(s) • {resumo.preventivasAtrasadas} prev. atrasada(s)</p></div><span className="h-3 w-3 shrink-0 rounded-full shadow-[0_0_12px_currentColor]" style={{ backgroundColor: corDoScore(resumo.score).fill, color: corDoScore(resumo.score).fill }} /></button>))}</div></div>

                <div className="mt-auto rounded-2xl border border-violet-400/15 bg-violet-400/[0.05] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-violet-300">Otimizações aplicadas</p>
                  <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-400">
                    <li>• mapa limpo, sem marcações permanentes</li>
                    <li>• áreas clicáveis recalibradas diretamente sobre a imagem atual</li>
                    <li>• destaque aparece somente no hover, sem bordas</li>
                    <li>• imagem 3D original preservada, sem inclinação artificial</li>
                  </ul>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
