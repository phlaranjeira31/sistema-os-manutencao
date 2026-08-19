"use client";

import {
  CalendarDays,
  CalendarRange,
  Clock3,
  Repeat2,
  Save,
  ShieldAlert,
  Users,
  Wrench,
} from "lucide-react";

import { useMemo, useState } from "react";

type Maquina = {
  id: string;
  nome: string;
};

type Setor = {
  id: string;
  nome: string;
  maquinas: Maquina[];
};

type Colaborador = {
  id: string;
  nome: string;
  email: string;
};

type FormularioPreventivaProps = {
  setores: Setor[];
  colaboradores: Colaborador[];
};

const frequencias = [
  {
    value: "SEMANAL",
    label: "Semanal",
  },
  {
    value: "QUINZENAL",
    label: "Quinzenal",
  },
  {
    value: "MENSAL",
    label: "Mensal",
  },
  {
    value: "BIMESTRAL",
    label: "Bimestral",
  },
  {
    value: "TRIMESTRAL",
    label: "Trimestral",
  },
  {
    value: "SEMESTRAL",
    label: "Semestral",
  },
  {
    value: "ANUAL",
    label: "Anual",
  },
  {
    value: "PERSONALIZADA",
    label: "Personalizada",
  },
];

function adicionarDias(data: Date, dias: number) {
  const nova = new Date(data);

  nova.setUTCDate(nova.getUTCDate() + dias);

  return nova;
}

function adicionarMeses(data: Date, quantidade: number) {
  const ano = data.getUTCFullYear();
  const mes = data.getUTCMonth();
  const dia = data.getUTCDate();

  const destino = new Date(
    Date.UTC(ano, mes + quantidade, 1)
  );

  const ultimoDia = new Date(
    Date.UTC(
      destino.getUTCFullYear(),
      destino.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  return new Date(
    Date.UTC(
      destino.getUTCFullYear(),
      destino.getUTCMonth(),
      Math.min(dia, ultimoDia)
    )
  );
}

function proximaData(
  atual: Date,
  frequencia: string,
  intervalo: number
) {
  switch (frequencia) {
    case "SEMANAL":
      return adicionarDias(atual, 7);

    case "QUINZENAL":
      return adicionarDias(atual, 15);

    case "MENSAL":
      return adicionarMeses(atual, 1);

    case "BIMESTRAL":
      return adicionarMeses(atual, 2);

    case "TRIMESTRAL":
      return adicionarMeses(atual, 3);

    case "SEMESTRAL":
      return adicionarMeses(atual, 6);

    case "ANUAL":
      return adicionarMeses(atual, 12);

    case "PERSONALIZADA":
      return adicionarDias(atual, intervalo || 1);

    default:
      return adicionarMeses(atual, 1);
  }
}

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(data);
}

export default function FormularioPreventiva({
  setores,
  colaboradores,
}: FormularioPreventivaProps) {
  const [setorId, setSetorId] = useState("");
  const [maquinaId, setMaquinaId] = useState("");

  const [frequencia, setFrequencia] =
    useState("MENSAL");

  const [dataInicio, setDataInicio] = useState("");

  const [
    intervaloPersonalizado,
    setIntervaloPersonalizado,
  ] = useState("30");

  const maquinasDisponiveis = useMemo(() => {
    return (
      setores.find((setor) => setor.id === setorId)
        ?.maquinas ?? []
    );
  }, [setorId, setores]);

  const previewDatas = useMemo(() => {
    if (!dataInicio) {
      return [];
    }

    const inicial = new Date(
      `${dataInicio}T00:00:00.000Z`
    );

    if (Number.isNaN(inicial.getTime())) {
      return [];
    }

    const intervalo =
      Number(intervaloPersonalizado) || 1;

    const datas: Date[] = [];

    let atual = new Date(inicial);

    for (let i = 0; i < 6; i++) {
      datas.push(new Date(atual));

      atual = proximaData(
        atual,
        frequencia,
        intervalo
      );
    }

    return datas;
  }, [
    dataInicio,
    frequencia,
    intervaloPersonalizado,
  ]);

  function alterarSetor(novoSetorId: string) {
    setSetorId(novoSetorId);
    setMaquinaId("");
  }

  return (
    <form
      action="/api/admin/os/preventivas/planos"
      method="POST"
      className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
            <Repeat2 size={21} />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">
              Plano preventivo
            </h2>

            <p className="text-sm text-slate-400">
              Cadastre uma vez e o sistema programa
              automaticamente as próximas execuções.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Título
          </label>

          <input
            type="text"
            name="titulo"
            required
            placeholder="Ex: Troca de rolamento"
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Setor
          </label>

          <select
            name="setorId"
            required
            value={setorId}
            onChange={(event) =>
              alterarSetor(event.target.value)
            }
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          >
            <option value="">
              Selecione o setor
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

        <div className="md:col-span-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
            <Wrench size={16} />

            Máquina

            <span className="font-normal text-slate-500">
              (opcional)
            </span>
          </label>

          <select
            name="maquinaId"
            value={maquinaId}
            onChange={(event) =>
              setMaquinaId(event.target.value)
            }
            disabled={
              !setorId ||
              maquinasDisponiveis.length === 0
            }
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-400"
          >
            <option value="">
              {!setorId
                ? "Selecione primeiro o setor"
                : maquinasDisponiveis.length === 0
                  ? "Nenhuma máquina cadastrada neste setor"
                  : "Nenhuma máquina selecionada"}
            </option>

            {maquinasDisponiveis.map((maquina) => (
              <option
                key={maquina.id}
                value={maquina.id}
              >
                {maquina.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Descrição
          </label>

          <textarea
            name="descricao"
            required
            rows={5}
            placeholder="Detalhes da manutenção preventiva..."
            className="w-full rounded-2xl border border-white/10 bg-[#050816] p-4 text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Prioridade
          </label>

          <select
            name="prioridade"
            defaultValue="MEDIA"
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          >
            <option value="BAIXA">
              Baixa
            </option>

            <option value="MEDIA">
              Média
            </option>

            <option value="ALTA">
              Alta
            </option>

            <option value="URGENTE">
              Urgente
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
            <Repeat2 size={16} />

            Periodicidade
          </label>

          <select
            name="frequencia"
            value={frequencia}
            onChange={(event) =>
              setFrequencia(event.target.value)
            }
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          >
            {frequencias.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <div className="mb-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <Clock3 size={16} />

              Duração estimada da preventiva
            </label>

            <p className="mt-1 text-xs text-slate-500">
              Informe quanto tempo, em média, essa manutenção deve levar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <input
                type="number"
                name="duracaoEstimadaHoras"
                required
                min="0"
                step="1"
                defaultValue="1"
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 pr-20 text-white outline-none focus:border-cyan-400"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                horas
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                name="duracaoEstimadaMinutosAdicionais"
                required
                min="0"
                max="59"
                step="1"
                defaultValue="0"
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 pr-24 text-white outline-none focus:border-cyan-400"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                minutos
              </span>
            </div>
          </div>
        </div>

        {frequencia === "PERSONALIZADA" && (
          <div className="md:col-span-2">
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
              <Clock3 size={16} />

              Repetir a cada quantos dias?
            </label>

            <input
              type="number"
              name="intervaloPersonalizadoDias"
              min="1"
              required
              value={intervaloPersonalizado}
              onChange={(event) =>
                setIntervaloPersonalizado(
                  event.target.value
                )
              }
              className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
            />
          </div>
        )}

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
            <CalendarDays size={16} />

            Primeira execução
          </label>

          <input
            type="date"
            name="dataInicio"
            required
            value={dataInicio}
            onChange={(event) =>
              setDataInicio(event.target.value)
            }
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
            <CalendarRange size={16} />

            Encerrar plano em

            <span className="font-normal text-slate-500">
              (opcional)
            </span>
          </label>

          <input
            type="date"
            name="dataFim"
            min={dataInicio || undefined}
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
            <ShieldAlert size={16} />

            Avisar antes
          </label>

          <select
            name="diasAntesAviso"
            defaultValue="1"
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#050816] px-4 text-white outline-none focus:border-cyan-400"
          >
            <option value="1">
              1 dia antes
            </option>

            <option value="2">
              2 dias antes
            </option>

            <option value="3">
              3 dias antes
            </option>

            <option value="7">
              7 dias antes
            </option>

            <option value="15">
              15 dias antes
            </option>

            <option value="30">
              30 dias antes
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Automação
          </label>

          <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.06] px-4">
            <input
              type="checkbox"
              name="gerarAutomaticamente"
              defaultChecked
              className="h-5 w-5 accent-cyan-400"
            />

            <span>
              <span className="block text-sm font-black text-white">
                Gerar próximas execuções automaticamente
              </span>

              <span className="text-xs text-slate-400">
                Mantém o calendário preventivo atualizado.
              </span>
            </span>
          </label>
        </div>

        {previewDatas.length > 0 && (
          <div className="md:col-span-2">
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/[0.05] p-5">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays
                  size={18}
                  className="text-cyan-300"
                />

                <div>
                  <p className="font-black text-white">
                    Prévia das próximas execuções
                  </p>

                  <p className="text-xs text-slate-400">
                    Primeiras 6 datas calculadas pelo sistema.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {previewDatas.map((data, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-[#050816] px-3 py-3 text-center"
                  >
                    <p className="text-[10px] font-black uppercase text-slate-500">
                      {index === 0
                        ? "Primeira"
                        : `${index + 1}ª`}
                    </p>

                    <p className="mt-1 text-sm font-black text-cyan-300">
                      {formatarData(data)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="md:col-span-2">
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <Users size={17} />

              Colaboradores responsáveis

              <span className="font-normal text-slate-500">
                (opcional)
              </span>
            </label>

            <p className="mt-1 text-xs text-slate-500">
              Os responsáveis serão vinculados ao plano e às execuções programadas.
            </p>
          </div>

          {colaboradores.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#050816] p-5 text-sm text-slate-400">
              Nenhum colaborador ativo disponível.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {colaboradores.map((colaborador) => (
                <label
                  key={colaborador.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#050816] p-4 transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
                >
                  <input
                    type="checkbox"
                    name="responsavelIds"
                    value={colaborador.id}
                    className="mt-1 h-4 w-4 shrink-0 accent-cyan-400"
                  />

                  <span className="min-w-0">
                    <span className="block break-words text-sm font-bold text-white">
                      {colaborador.nome}
                    </span>

                    <span className="mt-1 block break-all text-xs text-slate-500">
                      {colaborador.email}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-8 font-black text-slate-950 transition hover:scale-[1.02] hover:bg-cyan-300"
      >
        <Save size={18} />

        Criar plano preventivo
      </button>
    </form>
  );
}