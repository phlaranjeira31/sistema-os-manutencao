"use client";

import {
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Download,
  FileText,
  Loader2,
  Printer,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  buscarProgramacaoPlanoPdfAction,
} from "./actionsPlanoPdf";

type TipoPeriodo =
  | "SEMANAL"
  | "MENSAL"
  | "PERSONALIZADO";

type MaquinaFiltro = {
  id: string;
  nome: string;
};

type SetorFiltro = {
  id: string;
  nome: string;
  maquinas: MaquinaFiltro[];
};

type ItemPlano = {
  id: string;
  origem: string;
  data: string;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  setor: {
    id: string;
    nome: string;
  };
  maquina: {
    id: string;
    nome: string;
  } | null;
  duracaoEstimadaMinutos:
    | number
    | null;
  responsaveis: string[];
};

type ResultadoPlano = {
  inicio: string;
  fim: string;
  geradoEm: string;
  itens: ItemPlano[];
};

function adicionarDias(
  data: string,
  dias: number
) {
  const [ano, mes, dia] =
    data.split("-").map(Number);

  const base = new Date(
    ano,
    mes - 1,
    dia,
    12,
    0,
    0
  );

  base.setDate(
    base.getDate() + dias
  );

  return [
    base.getFullYear(),
    String(
      base.getMonth() + 1
    ).padStart(2, "0"),
    String(
      base.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function obterSemana(data: string) {
  const [ano, mes, dia] =
    data.split("-").map(Number);

  const base = new Date(
    ano,
    mes - 1,
    dia,
    12,
    0,
    0
  );

  const diaSemana = base.getDay();

  const deslocamento =
    diaSemana === 0
      ? -6
      : 1 - diaSemana;

  const inicio = adicionarDias(
    data,
    deslocamento
  );

  return {
    inicio,
    fim: adicionarDias(
      inicio,
      6
    ),
  };
}

function periodoDoMes(mes: string) {
  const [ano, numeroMes] =
    mes.split("-").map(Number);

  const ultimoDia = new Date(
    ano,
    numeroMes,
    0
  ).getDate();

  return {
    inicio: `${ano}-${String(
      numeroMes
    ).padStart(2, "0")}-01`,

    fim: `${ano}-${String(
      numeroMes
    ).padStart(2, "0")}-${String(
      ultimoDia
    ).padStart(2, "0")}`,
  };
}

function dataBr(data: string) {
  const somenteData =
    data.slice(0, 10);

  const [ano, mes, dia] =
    somenteData.split("-");

  return `${dia}/${mes}/${ano}`;
}

function dataLonga(data: string) {
  const [ano, mes, dia] =
    data.slice(0, 10)
      .split("-")
      .map(Number);

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(
      ano,
      mes - 1,
      dia,
      12
    )
  );
}

function minutosTexto(
  minutos: number | null
) {
  if (
    minutos === null ||
    minutos <= 0
  ) {
    return "—";
  }

  const horas = Math.floor(
    minutos / 60
  );

  const resto = minutos % 60;

  if (horas === 0) {
    return `${resto}min`;
  }

  if (resto === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${resto}min`;
}

function nomeStatus(status: string) {
  switch (status) {
    case "PROGRAMADA":
      return "Programada";
    case "PENDENTE":
      return "Pendente";
    case "EM_EXECUCAO":
      return "Em execução";
    case "CONCLUIDA":
      return "Concluída";
    default:
      return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(
          /^./,
          (letra) =>
            letra.toUpperCase()
        );
  }
}

async function carregarLogo() {
  try {
    const resposta = await fetch(
      "/logo.sequoia.png"
    );

    if (!resposta.ok) {
      return null;
    }

    const blob =
      await resposta.blob();

    return await new Promise<string>(
      (resolve, reject) => {
        const leitor =
          new FileReader();

        leitor.onload = () =>
          resolve(
            String(leitor.result)
          );

        leitor.onerror = reject;

        leitor.readAsDataURL(blob);
      }
    );
  } catch {
    return null;
  }
}

export default function ExportarPlanoPreventivo({
  mesAtual,
  hoje,
  setores,
}: {
  mesAtual: string;
  hoje: string;
  setores: SetorFiltro[];
}) {
  const [aberto, setAberto] =
    useState(false);

  const [tipo, setTipo] =
    useState<TipoPeriodo>(
      "MENSAL"
    );

  const [mes, setMes] =
    useState(mesAtual);

  const [dataSemana, setDataSemana] =
    useState(hoje);

  const [inicioPersonalizado, setInicioPersonalizado] =
    useState(hoje);

  const [fimPersonalizado, setFimPersonalizado] =
    useState(hoje);

  const [setorId, setSetorId] =
    useState("");

  const [maquinaId, setMaquinaId] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [
    gerando,
    iniciarGeracao,
  ] = useTransition();

  const maquinas = useMemo(() => {
    if (!setorId) {
      return [];
    }

    return (
      setores.find(
        (setor) =>
          setor.id === setorId
      )?.maquinas ?? []
    );
  }, [setorId, setores]);

  function mudarSetor(
    valor: string
  ) {
    setSetorId(valor);
    setMaquinaId("");
  }

  function obterPeriodo() {
    if (tipo === "MENSAL") {
      return periodoDoMes(mes);
    }

    if (tipo === "SEMANAL") {
      return obterSemana(
        dataSemana
      );
    }

    return {
      inicio:
        inicioPersonalizado,
      fim:
        fimPersonalizado,
    };
  }

  function gerar() {
    setErro("");

    const periodo =
      obterPeriodo();

    if (
      !periodo.inicio ||
      !periodo.fim
    ) {
      setErro(
        "Selecione um período válido."
      );
      return;
    }

    if (
      periodo.fim <
      periodo.inicio
    ) {
      setErro(
        "A data final não pode ser anterior à inicial."
      );
      return;
    }

    iniciarGeracao(
      async () => {
        try {
          const resultado =
            (await buscarProgramacaoPlanoPdfAction(
              {
                inicio:
                  periodo.inicio,
                fim:
                  periodo.fim,
                setorId:
                  setorId || undefined,
                maquinaId:
                  maquinaId ||
                  undefined,
              }
            )) as ResultadoPlano;

          await gerarPdf(
            resultado,
            tipo,
            {
              setor:
                setores.find(
                  (setor) =>
                    setor.id ===
                    setorId
                )?.nome ??
                "Todos os setores",

              maquina:
                maquinas.find(
                  (maquina) =>
                    maquina.id ===
                    maquinaId
                )?.nome ??
                "Todas as máquinas",
            }
          );
        } catch (
          error
        ) {
          console.error(error);

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível gerar o PDF."
          );
        }
      }
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setAberto(true)
        }
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-5 text-sm font-black text-violet-200 transition hover:border-violet-300/50 hover:bg-violet-400 hover:text-slate-950"
      >
        <FileText size={17} />
        Plano PDF
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#080d1b] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#080d1b]/95 px-5 py-5 backdrop-blur-xl sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-200">
                  <Printer size={20} />
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-300">
                    Produção
                  </p>

                  <h2 className="text-lg font-black text-white">
                    Exportar plano preventivo
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAberto(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <label className="mb-3 block text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Tipo de plano
                </label>

                <div className="grid gap-2 sm:grid-cols-3">
                  <TipoButton
                    ativo={
                      tipo === "SEMANAL"
                    }
                    icon={
                      <CalendarDays
                        size={17}
                      />
                    }
                    texto="Semanal"
                    onClick={() =>
                      setTipo(
                        "SEMANAL"
                      )
                    }
                  />

                  <TipoButton
                    ativo={
                      tipo === "MENSAL"
                    }
                    icon={
                      <CalendarRange
                        size={17}
                      />
                    }
                    texto="Mensal"
                    onClick={() =>
                      setTipo(
                        "MENSAL"
                      )
                    }
                  />

                  <TipoButton
                    ativo={
                      tipo ===
                      "PERSONALIZADO"
                    }
                    icon={
                      <CalendarRange
                        size={17}
                      />
                    }
                    texto="Personalizado"
                    onClick={() =>
                      setTipo(
                        "PERSONALIZADO"
                      )
                    }
                  />
                </div>
              </div>

              {tipo ===
                "MENSAL" && (
                <Campo
                  label="Mês do plano"
                  type="month"
                  value={mes}
                  onChange={setMes}
                />
              )}

              {tipo ===
                "SEMANAL" && (
                <Campo
                  label="Semana de referência"
                  type="date"
                  value={
                    dataSemana
                  }
                  onChange={
                    setDataSemana
                  }
                  ajuda={
                    (() => {
                      const periodo =
                        obterSemana(
                          dataSemana
                        );

                      return `${dataBr(
                        periodo.inicio
                      )} a ${dataBr(
                        periodo.fim
                      )}`;
                    })()
                  }
                />
              )}

              {tipo ===
                "PERSONALIZADO" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo
                    label="Data inicial"
                    type="date"
                    value={
                      inicioPersonalizado
                    }
                    onChange={
                      setInicioPersonalizado
                    }
                  />

                  <Campo
                    label="Data final"
                    type="date"
                    value={
                      fimPersonalizado
                    }
                    onChange={
                      setFimPersonalizado
                    }
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <CampoSelect
                  label="Setor"
                  value={setorId}
                  onChange={
                    mudarSetor
                  }
                  options={[
                    {
                      value: "",
                      label:
                        "Todos os setores",
                    },
                    ...setores.map(
                      (setor) => ({
                        value:
                          setor.id,
                        label:
                          setor.nome,
                      })
                    ),
                  ]}
                />

                <CampoSelect
                  label="Máquina"
                  value={maquinaId}
                  onChange={
                    setMaquinaId
                  }
                  disabled={
                    !setorId
                  }
                  options={[
                    {
                      value: "",
                      label:
                        setorId
                          ? "Todas as máquinas"
                          : "Selecione um setor primeiro",
                    },
                    ...maquinas.map(
                      (maquina) => ({
                        value:
                          maquina.id,
                        label:
                          maquina.nome,
                      })
                    ),
                  ]}
                />
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4">
                <p className="text-sm font-black text-white">
                  O PDF incluirá
                </p>

                <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                  <span>
                    • Calendário do período
                  </span>
                  <span>
                    • Datas programadas
                  </span>
                  <span>
                    • Setor e máquina
                  </span>
                  <span>
                    • Duração prevista
                  </span>
                  <span>
                    • Responsáveis
                  </span>
                  <span>
                    • Ciência da Produção
                  </span>
                </div>
              </div>

              {erro && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm font-semibold text-red-200">
                  {erro}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setAberto(false)
                  }
                  className="h-12 rounded-xl border border-white/10 px-5 text-sm font-black text-slate-300 transition hover:bg-white/5"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={gerar}
                  disabled={gerando}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-400 px-5 text-sm font-black text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {gerando ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Download
                      size={17}
                    />
                  )}

                  {gerando
                    ? "Gerando..."
                    : "Gerar PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TipoButton({
  ativo,
  icon,
  texto,
  onClick,
}: {
  ativo: boolean;
  icon: React.ReactNode;
  texto: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-black transition",
        ativo
          ? "border-violet-400/40 bg-violet-400/15 text-violet-200"
          : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04] hover:text-white",
      ].join(" ")}
    >
      {icon}
      {texto}
    </button>
  );
}

function Campo({
  label,
  type,
  value,
  onChange,
  ajuda,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  ajuda?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-12 w-full rounded-xl border border-white/10 bg-[#050816] px-4 text-sm font-semibold text-white outline-none transition focus:border-violet-400/50"
      />

      {ajuda && (
        <span className="mt-2 block text-xs font-semibold text-violet-300">
          {ajuda}
        </span>
      )}
    </label>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: {
    value: string;
    label: string;
  }[];
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          disabled={disabled}
          className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#050816] px-4 pr-10 text-sm font-semibold text-white outline-none transition focus:border-violet-400/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {options.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {option.label}
              </option>
            )
          )}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
      </div>
    </label>
  );
}

async function gerarPdf(
  resultado: ResultadoPlano,
  tipo: TipoPeriodo,
  filtros: {
    setor: string;
    maquina: string;
  }
) {
  const { jsPDF } =
    await import("jspdf");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const logo =
    await carregarLogo();

  const largura =
    doc.internal.pageSize.getWidth();

  const altura =
    doc.internal.pageSize.getHeight();

  const margem = 14;

  const cores = {
    fundo: [248, 250, 252] as [
      number,
      number,
      number
    ],
    escuro: [15, 23, 42] as [
      number,
      number,
      number
    ],
    texto: [30, 41, 59] as [
      number,
      number,
      number
    ],
    mutado: [100, 116, 139] as [
      number,
      number,
      number
    ],
    linha: [226, 232, 240] as [
      number,
      number,
      number
    ],
    ciano: [8, 145, 178] as [
      number,
      number,
      number
    ],
    cianoClaro: [236, 254, 255] as [
      number,
      number,
      number
    ],
    verde: [5, 150, 105] as [
      number,
      number,
      number
    ],
    amarelo: [217, 119, 6] as [
      number,
      number,
      number
    ],
    vermelho: [220, 38, 38] as [
      number,
      number,
      number
    ],
  };

  const setCor = (
    cor: [
      number,
      number,
      number
    ]
  ) => {
    doc.setTextColor(
      cor[0],
      cor[1],
      cor[2]
    );
  };

  const setFill = (
    cor: [
      number,
      number,
      number
    ]
  ) => {
    doc.setFillColor(
      cor[0],
      cor[1],
      cor[2]
    );
  };

  const setDraw = (
    cor: [
      number,
      number,
      number
    ]
  ) => {
    doc.setDrawColor(
      cor[0],
      cor[1],
      cor[2]
    );
  };

  function cabecalho(
    titulo: string,
    subtitulo?: string
  ) {
    setFill(cores.escuro);

    doc.rect(
      0,
      0,
      largura,
      24,
      "F"
    );

    if (logo) {
      try {
        doc.addImage(
          logo,
          "PNG",
          margem,
          5,
          24,
          14,
          undefined,
          "FAST"
        );
      } catch {
        // Se a imagem falhar,
        // o PDF continua normalmente.
      }
    }

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(13);

    doc.setTextColor(
      255,
      255,
      255
    );

    doc.text(
      "SEQUOIA ALIMENTOS",
      logo
        ? margem + 30
        : margem,
      10
    );

    doc.setFontSize(7);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setTextColor(
      148,
      163,
      184
    );

    doc.text(
      "Sistema Corporativo de Manutenção",
      logo
        ? margem + 30
        : margem,
      16
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(9);

    doc.setTextColor(
      255,
      255,
      255
    );

    doc.text(
      titulo,
      largura - margem,
      10,
      {
        align: "right",
      }
    );

    if (subtitulo) {
      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(7);

      doc.setTextColor(
        148,
        163,
        184
      );

      doc.text(
        subtitulo,
        largura - margem,
        16,
        {
          align: "right",
        }
      );
    }
  }

  function rodape() {
    const pagina =
      doc.getNumberOfPages();

    setDraw(cores.linha);

    doc.line(
      margem,
      altura - 9,
      largura - margem,
      altura - 9
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(6.5);

    setCor(cores.mutado);

    doc.text(
      "Documento gerado pelo Sistema OS. Alterações posteriores devem ser consultadas diretamente no sistema.",
      margem,
      altura - 4.5
    );

    doc.text(
      `Página ${pagina}`,
      largura - margem,
      altura - 4.5,
      {
        align: "right",
      }
    );
  }

  const totalMinutos =
    resultado.itens.reduce(
      (total, item) =>
        total +
        (item.duracaoEstimadaMinutos ??
          0),
      0
    );

  const maquinasUnicas =
    new Set(
      resultado.itens
        .map(
          (item) =>
            item.maquina?.id
        )
        .filter(Boolean)
    ).size;

  const setoresUnicos =
    new Set(
      resultado.itens.map(
        (item) =>
          item.setor.id
      )
    ).size;

  cabecalho(
    "PLANO PREVENTIVO DE MANUTENÇÃO",
    `${dataBr(
      resultado.inicio
    )} a ${dataBr(
      resultado.fim
    )}`
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(20);

  setCor(cores.escuro);

  doc.text(
    tipo === "MENSAL"
      ? "Plano mensal"
      : tipo === "SEMANAL"
        ? "Plano semanal"
        : "Plano do período",
    margem,
    36
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  setCor(cores.mutado);

  doc.text(
    `Período: ${dataLonga(
      resultado.inicio
    )} a ${dataLonga(
      resultado.fim
    )}`,
    margem,
    43
  );

  doc.text(
    `Filtro: ${filtros.setor} • ${filtros.maquina}`,
    margem,
    48
  );

  const cards = [
    {
      titulo: "Preventivas",
      valor: String(
        resultado.itens.length
      ),
    },
    {
      titulo: "Horas previstas",
      valor:
        totalMinutos > 0
          ? minutosTexto(
              totalMinutos
            )
          : "—",
    },
    {
      titulo: "Máquinas",
      valor: String(
        maquinasUnicas
      ),
    },
    {
      titulo: "Setores",
      valor: String(
        setoresUnicos
      ),
    },
  ];

  const larguraCard = 52;
  const gapCard = 4;

  cards.forEach(
    (card, indice) => {
      const x =
        margem +
        indice *
          (larguraCard +
            gapCard);

      setFill(
        cores.cianoClaro
      );

      setDraw(cores.linha);

      doc.roundedRect(
        x,
        54,
        larguraCard,
        18,
        2,
        2,
        "FD"
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(11);

      setCor(cores.escuro);

      doc.text(
        card.valor,
        x + 4,
        62
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(6.5);

      setCor(cores.mutado);

      doc.text(
        card.titulo,
        x + 4,
        68
      );
    }
  );

  if (tipo === "SEMANAL") {
    desenharSemana(
      doc,
      resultado,
      78,
      margem,
      largura - margem * 2,
      93,
      cores
    );
  } else {
    desenharCalendarioMes(
      doc,
      resultado,
      resultado.inicio.slice(
        0,
        7
      ),
      78,
      margem,
      largura - margem * 2,
      93,
      cores
    );
  }

  rodape();

  // Se o período personalizado
  // atravessar mais de um mês,
  // cria calendários adicionais.
  if (
    tipo ===
    "PERSONALIZADO"
  ) {
    const meses =
      listarMeses(
        resultado.inicio,
        resultado.fim
      );

    meses
      .slice(1)
      .forEach((mesRef) => {
        doc.addPage(
          "a4",
          "landscape"
        );

        cabecalho(
          "CALENDÁRIO PREVENTIVO",
          mesRef
        );

        desenharCalendarioMes(
          doc,
          resultado,
          mesRef,
          35,
          margem,
          largura -
            margem * 2,
          135,
          cores
        );

        rodape();
      });
  }

  // PROGRAMAÇÃO DETALHADA
  doc.addPage(
    "a4",
    "landscape"
  );

  cabecalho(
    "PROGRAMAÇÃO DETALHADA",
    `${dataBr(
      resultado.inicio
    )} a ${dataBr(
      resultado.fim
    )}`
  );

  let y = 34;

  const colunas = [
    {
      titulo: "DATA",
      x: margem,
      largura: 24,
    },
    {
      titulo: "SETOR",
      x: margem + 24,
      largura: 31,
    },
    {
      titulo: "MÁQUINA",
      x: margem + 55,
      largura: 43,
    },
    {
      titulo: "PREVENTIVA",
      x: margem + 98,
      largura: 58,
    },
    {
      titulo: "DURAÇÃO",
      x: margem + 156,
      largura: 24,
    },
    {
      titulo: "RESPONSÁVEIS",
      x: margem + 180,
      largura: 54,
    },
    {
      titulo: "STATUS",
      x: margem + 234,
      largura: 31,
    },
  ];

  function cabecalhoTabela() {
    setFill(cores.escuro);

    doc.roundedRect(
      margem,
      y,
      largura -
        margem * 2,
      9,
      1.5,
      1.5,
      "F"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(6.5);

    doc.setTextColor(
      255,
      255,
      255
    );

    colunas.forEach(
      (coluna) => {
        doc.text(
          coluna.titulo,
          coluna.x + 2,
          y + 5.8
        );
      }
    );

    y += 11;
  }

  cabecalhoTabela();

  if (
    resultado.itens.length === 0
  ) {
    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    setCor(cores.mutado);

    doc.text(
      "Nenhuma preventiva programada para o período selecionado.",
      margem,
      y + 12
    );

    y += 25;
  } else {
    resultado.itens.forEach(
      (item, indice) => {
        const responsaveis =
          item.responsaveis.length
            ? item.responsaveis.join(
                ", "
              )
            : "—";

        const valores = [
          dataBr(item.data),
          item.setor.nome,
          item.maquina?.nome ??
            "Sem máquina",
          item.titulo,
          minutosTexto(
            item.duracaoEstimadaMinutos
          ),
          responsaveis,
          nomeStatus(
            item.status
          ),
        ];

        const linhas =
          valores.map(
            (valor, i) =>
              doc.splitTextToSize(
                valor,
                colunas[i]
                  .largura - 4
              )
          );

        const maiorLinhas =
          Math.max(
            1,
            ...linhas.map(
              (itemLinhas) =>
                itemLinhas.length
            )
          );

        const alturaLinha =
          Math.max(
            10,
            maiorLinhas * 4 + 4
          );

        if (
          y +
            alturaLinha >
          altura - 17
        ) {
          rodape();

          doc.addPage(
            "a4",
            "landscape"
          );

          cabecalho(
            "PROGRAMAÇÃO DETALHADA",
            "Continuação"
          );

          y = 34;

          cabecalhoTabela();
        }

        if (
          indice % 2 === 0
        ) {
          setFill(
            cores.fundo
          );

          doc.rect(
            margem,
            y,
            largura -
              margem * 2,
            alturaLinha,
            "F"
          );
        }

        setDraw(cores.linha);

        doc.line(
          margem,
          y + alturaLinha,
          largura - margem,
          y + alturaLinha
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(6.5);

        setCor(cores.texto);

        linhas.forEach(
          (
            itemLinhas,
            i
          ) => {
            doc.text(
              itemLinhas,
              colunas[i].x +
                2,
              y + 5
            );
          }
        );

        y += alturaLinha;
      }
    );
  }

  rodape();

  // CIÊNCIA DA PRODUÇÃO
  doc.addPage(
    "a4",
    "landscape"
  );

  cabecalho(
    "CIÊNCIA DA PRODUÇÃO",
    `${dataBr(
      resultado.inicio
    )} a ${dataBr(
      resultado.fim
    )}`
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(18);

  setCor(cores.escuro);

  doc.text(
    "Ciência e alinhamento da programação",
    margem,
    40
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(9);

  setCor(cores.texto);

  const textoCiencia =
    "As atividades descritas neste plano representam a programação registrada no Sistema de Manutenção da Sequoia no momento da emissão. Caso exista conflito com a programação de Produção, necessidade operacional ou indisponibilidade do equipamento, a solicitação de reagendamento deverá ser comunicada à Manutenção para atualização no sistema.";

  const linhasCiencia =
    doc.splitTextToSize(
      textoCiencia,
      largura -
        margem * 2
    );

  doc.text(
    linhasCiencia,
    margem,
    51
  );

  const yObs = 78;

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(9);

  doc.text(
    "Observações da Produção",
    margem,
    yObs
  );

  setDraw(cores.linha);

  [88, 102, 116, 130].forEach(
    (linhaY) => {
      doc.line(
        margem,
        linhaY,
        largura - margem,
        linhaY
      );
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  setCor(cores.texto);

  doc.text(
    "Responsável Produção:",
    margem,
    151
  );

  doc.line(
    margem + 31,
    151,
    margem + 115,
    151
  );

  doc.text(
    "Data:",
    margem + 130,
    151
  );

  doc.line(
    margem + 141,
    151,
    margem + 184,
    151
  );

  doc.text(
    "Assinatura:",
    margem,
    168
  );

  doc.line(
    margem + 20,
    168,
    margem + 115,
    168
  );

  doc.setFontSize(7);

  setCor(cores.mutado);

  doc.text(
    `Emitido em ${new Intl.DateTimeFormat(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short",
        timeZone:
          "America/Sao_Paulo",
      }
    ).format(
      new Date(
        resultado.geradoEm
      )
    )}`,
    margem,
    186
  );

  rodape();

  const nomeTipo =
    tipo === "MENSAL"
      ? "mensal"
      : tipo === "SEMANAL"
        ? "semanal"
        : "periodo";

  doc.save(
    `plano-preventivo-${nomeTipo}-${resultado.inicio}-${resultado.fim}.pdf`
  );
}

function listarMeses(
  inicio: string,
  fim: string
) {
  const [anoI, mesI] =
    inicio
      .split("-")
      .map(Number);

  const [anoF, mesF] =
    fim
      .split("-")
      .map(Number);

  const meses: string[] =
    [];

  let ano = anoI;
  let mes = mesI;

  while (
    ano < anoF ||
    (ano === anoF &&
      mes <= mesF)
  ) {
    meses.push(
      `${ano}-${String(
        mes
      ).padStart(2, "0")}`
    );

    mes += 1;

    if (mes === 13) {
      mes = 1;
      ano += 1;
    }
  }

  return meses;
}

function desenharCalendarioMes(
  doc: any,
  resultado: ResultadoPlano,
  mesRef: string,
  yInicial: number,
  xInicial: number,
  largura: number,
  altura: number,
  cores: Record<
    string,
    [number, number, number]
  >
) {
  const [ano, mes] =
    mesRef
      .split("-")
      .map(Number);

  const primeiroDia =
    new Date(
      ano,
      mes - 1,
      1,
      12
    );

  const ultimoDia =
    new Date(
      ano,
      mes,
      0,
      12
    ).getDate();

  const nomesMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(11);

  doc.setTextColor(
    ...cores.escuro
  );

  doc.text(
    `${nomesMeses[
      mes - 1
    ]} de ${ano}`,
    xInicial,
    yInicial
  );

  const yGrade =
    yInicial + 5;

  const larguraCelula =
    largura / 7;

  const alturaCab = 8;

  const linhas = 6;

  const alturaCelula =
    (altura -
      alturaCab) /
    linhas;

  const dias = [
    "SEG",
    "TER",
    "QUA",
    "QUI",
    "SEX",
    "SÁB",
    "DOM",
  ];

  doc.setFillColor(
    ...cores.escuro
  );

  doc.rect(
    xInicial,
    yGrade,
    largura,
    alturaCab,
    "F"
  );

  doc.setFontSize(6.5);

  doc.setTextColor(
    255,
    255,
    255
  );

  dias.forEach(
    (dia, indice) => {
      doc.text(
        dia,
        xInicial +
          indice *
            larguraCelula +
          larguraCelula / 2,
        yGrade + 5,
        {
          align: "center",
        }
      );
    }
  );

  const jsDia =
    primeiroDia.getDay();

  const deslocamento =
    jsDia === 0
      ? 6
      : jsDia - 1;

  const porData =
    new Map<
      string,
      ItemPlano[]
    >();

  resultado.itens.forEach(
    (item) => {
      const chave =
        item.data.slice(
          0,
          10
        );

      const lista =
        porData.get(chave) ??
        [];

      lista.push(item);

      porData.set(
        chave,
        lista
      );
    }
  );

  for (
    let linha = 0;
    linha < linhas;
    linha++
  ) {
    for (
      let coluna = 0;
      coluna < 7;
      coluna++
    ) {
      const indice =
        linha * 7 + coluna;

      const numeroDia =
        indice -
        deslocamento +
        1;

      const x =
        xInicial +
        coluna *
          larguraCelula;

      const y =
        yGrade +
        alturaCab +
        linha *
          alturaCelula;

      doc.setFillColor(
        255,
        255,
        255
      );

      doc.setDrawColor(
        ...cores.linha
      );

      doc.rect(
        x,
        y,
        larguraCelula,
        alturaCelula,
        "FD"
      );

      if (
        numeroDia < 1 ||
        numeroDia >
          ultimoDia
      ) {
        continue;
      }

      const chave =
        `${ano}-${String(
          mes
        ).padStart(
          2,
          "0"
        )}-${String(
          numeroDia
        ).padStart(
          2,
          "0"
        )}`;

      const eventos =
        porData.get(chave) ??
        [];

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(7);

      doc.setTextColor(
        ...cores.escuro
      );

      doc.text(
        String(numeroDia),
        x + 2,
        y + 4
      );

      eventos
        .slice(0, 2)
        .forEach(
          (
            evento,
            indiceEvento
          ) => {
            const yy =
              y +
              8 +
              indiceEvento *
                4.5;

            doc.setFillColor(
              ...cores.ciano
            );

            doc.circle(
              x + 2.2,
              yy - 1.2,
              0.8,
              "F"
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(
              5.4
            );

            doc.setTextColor(
              ...cores.texto
            );

            const nome =
              evento.maquina
                ?.nome ??
              evento.titulo;

            const texto =
              doc.splitTextToSize(
                nome,
                larguraCelula -
                  7
              )[0];

            doc.text(
              texto,
              x + 4.5,
              yy
            );
          }
        );

      if (
        eventos.length > 2
      ) {
        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(5);

        doc.setTextColor(
          ...cores.ciano
        );

        doc.text(
          `+${eventos.length - 2} atividade(s)`,
          x + 2,
          y +
            alturaCelula -
            2
        );
      }
    }
  }
}

function desenharSemana(
  doc: any,
  resultado: ResultadoPlano,
  yInicial: number,
  xInicial: number,
  largura: number,
  altura: number,
  cores: Record<
    string,
    [number, number, number]
  >
) {
  const larguraColuna =
    largura / 7;

  const diasSemana = [
    "SEGUNDA",
    "TERÇA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SÁBADO",
    "DOMINGO",
  ];

  const porData =
    new Map<
      string,
      ItemPlano[]
    >();

  resultado.itens.forEach(
    (item) => {
      const chave =
        item.data.slice(
          0,
          10
        );

      const lista =
        porData.get(chave) ??
        [];

      lista.push(item);

      porData.set(
        chave,
        lista
      );
    }
  );

  for (
    let indice = 0;
    indice < 7;
    indice++
  ) {
    const data =
      adicionarDias(
        resultado.inicio,
        indice
      );

    const x =
      xInicial +
      indice *
        larguraColuna;

    doc.setFillColor(
      indice % 2 === 0
        ? 248
        : 255,
      indice % 2 === 0
        ? 250
        : 255,
      indice % 2 === 0
        ? 252
        : 255
    );

    doc.setDrawColor(
      ...cores.linha
    );

    doc.roundedRect(
      x,
      yInicial,
      larguraColuna - 1.5,
      altura,
      1.5,
      1.5,
      "FD"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(6.2);

    doc.setTextColor(
      ...cores.ciano
    );

    doc.text(
      diasSemana[indice],
      x + 3,
      yInicial + 7
    );

    doc.setFontSize(9);

    doc.setTextColor(
      ...cores.escuro
    );

    doc.text(
      dataBr(data).slice(
        0,
        5
      ),
      x + 3,
      yInicial + 14
    );

    const eventos =
      porData.get(data) ??
      [];

    let y =
      yInicial + 22;

    eventos
      .slice(0, 5)
      .forEach(
        (evento) => {
          doc.setFillColor(
            ...cores.cianoClaro
          );

          doc.roundedRect(
            x + 2.5,
            y,
            larguraColuna -
              6.5,
            11,
            1,
            1,
            "F"
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(5.5);

          doc.setTextColor(
            ...cores.escuro
          );

          const titulo =
            doc.splitTextToSize(
              evento.maquina
                ?.nome ??
                evento.titulo,
              larguraColuna -
                11
            )[0];

          doc.text(
            titulo,
            x + 5,
            y + 4
          );

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(4.8);

          doc.setTextColor(
            ...cores.mutado
          );

          const setor =
            doc.splitTextToSize(
              evento.setor.nome,
              larguraColuna -
                11
            )[0];

          doc.text(
            setor,
            x + 5,
            y + 8
          );

          y += 13;
        }
      );

    if (
      eventos.length > 5
    ) {
      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(5);

      doc.setTextColor(
        ...cores.ciano
      );

      doc.text(
        `+${eventos.length - 5} atividade(s)`,
        x + 3,
        yInicial +
          altura -
          4
      );
    }
  }
}
