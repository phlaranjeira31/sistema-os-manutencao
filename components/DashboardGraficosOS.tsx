"use client";

import type {
  ReactNode,
} from "react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  Filter,
  Gauge,
  PieChart as PieChartIcon,
  RotateCcw,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Setor = {
  id: string;
  nome: string;
};

type Colaborador = {
  id: string;
  nome: string;
};

type Maquina = {
  id: string;
  nome: string;
  setorId: string;
};

type OrdemServico = {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  createdAt: string;
  updatedAt: string;
  dataPrevista: string | null;
  dataConclusao: string | null;

  /*
   * Data/hora real do término informada no relatório técnico.
   * É a única data usada para conclusão em evolução e tempo médio.
   */
  dataConclusaoRelatorio: string | null;

  setor: Setor | null;
  maquina: Maquina | null;
  responsaveis: Colaborador[];
};

type Filtros = {
  dataInicio: string;
  dataFim: string;
  status: string;
  colaborador: string;
  setor: string;
  prioridade: string;
  maquina: string;
};

type Props = {
  ordens: OrdemServico[];
  setores: Setor[];
  colaboradores: Colaborador[];
  maquinas: Maquina[];
  filtrosIniciais: Filtros;
};

const STATUS_OPTIONS = [
  {
    value: "NAO_INICIADA",
    label: "Não iniciada",
  },
  {
    value: "EM_ANDAMENTO",
    label: "Em andamento",
  },
  {
    value: "CONCLUIDA",
    label: "Concluída",
  },
  {
    value: "CANCELADA",
    label: "Cancelada",
  },
];

const PRIORIDADE_OPTIONS = [
  {
    value: "BAIXA",
    label: "Baixa",
  },
  {
    value: "MEDIA",
    label: "Média",
  },
  {
    value: "ALTA",
    label: "Alta",
  },
  {
    value: "URGENTE",
    label: "Urgente",
  },
];

const CORES_STATUS: Record<
  string,
  string
> = {
  NAO_INICIADA: "#f59e0b",
  EM_ANDAMENTO: "#3b82f6",
  CONCLUIDA: "#10b981",
  CANCELADA: "#64748b",
};

const CORES_PRIORIDADE: Record<
  string,
  string
> = {
  BAIXA: "#22c55e",
  MEDIA: "#eab308",
  ALTA: "#f97316",
  URGENTE: "#ef4444",
};

const tooltipStyle = {
  backgroundColor:
    "rgba(5,11,24,.97)",
  border:
    "1px solid rgba(148,163,184,.16)",
  borderRadius: "14px",
  color: "#ffffff",
  boxShadow:
    "0 18px 45px rgba(0,0,0,0.35)",
};

function statusLabel(
  status: string
) {
  return (
    STATUS_OPTIONS.find(
      (item) =>
        item.value ===
        status
    )?.label ?? status
  );
}

function prioridadeLabel(
  prioridade: string
) {
  return (
    PRIORIDADE_OPTIONS.find(
      (item) =>
        item.value ===
        prioridade
    )?.label ??
    prioridade
  );
}

function formatarDataInput(
  value: string
) {
  if (!value) {
    return "Todas";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(
      `${value}T12:00:00-03:00`
    )
  );
}

function chaveMes(
  value: string
) {
  const partes =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
      }
    ).formatToParts(
      new Date(value)
    );

  const ano =
    partes.find(
      (parte) =>
        parte.type ===
        "year"
    )?.value ?? "";

  const mes =
    partes.find(
      (parte) =>
        parte.type ===
        "month"
    )?.value ?? "";

  return `${ano}-${mes}`;
}

function formatarMes(
  chave: string
) {
  const [ano, mes] =
    chave
      .split("-")
      .map(Number);

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }
  )
    .format(
      new Date(
        Date.UTC(
          ano,
          mes - 1,
          1
        )
      )
    )
    .replace(".", "");
}

function formatarDuracaoMedia(
  ms: number
) {
  if (
    !Number.isFinite(ms) ||
    ms <= 0
  ) {
    return "—";
  }

  const minutos =
    Math.round(
      ms / 60000
    );

  if (minutos < 60) {
    return `${minutos}min`;
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  const minutosRestantes =
    minutos % 60;

  if (horas < 24) {
    return minutosRestantes > 0
      ? `${horas}h ${minutosRestantes}min`
      : `${horas}h`;
  }

  const dias =
    Math.floor(
      horas / 24
    );

  const horasRestantes =
    horas % 24;

  return horasRestantes > 0
    ? `${dias}d ${horasRestantes}h`
    : `${dias}d`;
}

function percentual(
  numerador: number,
  denominador: number
) {
  if (
    denominador <= 0
  ) {
    return 0;
  }

  return Math.round(
    (numerador /
      denominador) *
      100
  );
}

function dentroPeriodo(
  value: string,
  inicio: Date | null,
  fim: Date | null
) {
  const data =
    new Date(value);

  if (
    inicio &&
    data < inicio
  ) {
    return false;
  }

  if (
    fim &&
    data > fim
  ) {
    return false;
  }

  return true;
}

export default function DashboardGraficosOS({
  ordens,
  setores,
  colaboradores,
  maquinas,
  filtrosIniciais,
}: Props) {
  const [
    gerandoPDF,
    setGerandoPDF,
  ] = useState(false);

  const [
    filtrosEdicao,
    setFiltrosEdicao,
  ] =
    useState<Filtros>(
      filtrosIniciais
    );

  const [
    filtrosAplicados,
    setFiltrosAplicados,
  ] =
    useState<Filtros>(
      filtrosIniciais
    );

  const maquinasDisponiveis =
    useMemo(() => {
      if (
        !filtrosEdicao.setor
      ) {
        return maquinas;
      }

      return maquinas.filter(
        (maquina) =>
          maquina.setorId ===
          filtrosEdicao.setor
      );
    }, [
      maquinas,
      filtrosEdicao.setor,
    ]);

  useEffect(() => {
    if (
      filtrosEdicao.maquina &&
      !maquinasDisponiveis.some(
        (maquina) =>
          maquina.id ===
          filtrosEdicao.maquina
      )
    ) {
      setFiltrosEdicao(
        (anterior) => ({
          ...anterior,
          maquina: "",
        })
      );
    }
  }, [
    filtrosEdicao.maquina,
    maquinasDisponiveis,
  ]);

  /*
   * O período do filtro permanece sendo o período de ABERTURA da OS.
   * As métricas de conclusão usam a data do relatório técnico.
   */
  const ordensFiltradas =
    useMemo(() => {
      const inicio =
        filtrosAplicados.dataInicio
          ? new Date(
              `${filtrosAplicados.dataInicio}T00:00:00-03:00`
            )
          : null;

      const fim =
        filtrosAplicados.dataFim
          ? new Date(
              `${filtrosAplicados.dataFim}T23:59:59-03:00`
            )
          : null;

      return ordens.filter(
        (os) => {
          if (
            !dentroPeriodo(
              os.createdAt,
              inicio,
              fim
            )
          ) {
            return false;
          }

          if (
            filtrosAplicados.status &&
            os.status !==
              filtrosAplicados.status
          ) {
            return false;
          }

          if (
            filtrosAplicados.prioridade &&
            os.prioridade !==
              filtrosAplicados.prioridade
          ) {
            return false;
          }

          if (
            filtrosAplicados.setor &&
            os.setor?.id !==
              filtrosAplicados.setor
          ) {
            return false;
          }

          if (
            filtrosAplicados.maquina &&
            os.maquina?.id !==
              filtrosAplicados.maquina
          ) {
            return false;
          }

          if (
            filtrosAplicados.colaborador &&
            !os.responsaveis.some(
              (responsavel) =>
                responsavel.id ===
                filtrosAplicados.colaborador
            )
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      ordens,
      filtrosAplicados,
    ]);

  const metricas =
    useMemo(() => {
      const total =
        ordensFiltradas.length;

      const concluidas =
        ordensFiltradas.filter(
          (os) =>
            os.status ===
            "CONCLUIDA"
        ).length;

      const pendentes =
        ordensFiltradas.filter(
          (os) =>
            os.status ===
              "NAO_INICIADA" ||
            os.status ===
              "EM_ANDAMENTO"
        ).length;

      const canceladas =
        ordensFiltradas.filter(
          (os) =>
            os.status ===
            "CANCELADA"
        ).length;

      /*
       * Canceladas nunca entram no denominador da taxa de conclusão.
       */
      const baseTaxa =
        Math.max(
          0,
          total -
            canceladas
        );

      const concluidasComRelatorio =
        ordensFiltradas.filter(
          (os) =>
            os.status ===
              "CONCLUIDA" &&
            Boolean(
              os.dataConclusaoRelatorio
            )
        );

      /*
       * Tempo médio TOTAL:
       * abertura da OS -> término real informado no relatório.
       *
       * Não usa dataConclusao nem updatedAt.
       */
      const temposTotais =
        concluidasComRelatorio
          .map((os) => {
            const inicio =
              new Date(
                os.createdAt
              ).getTime();

            const fim =
              new Date(
                os.dataConclusaoRelatorio!
              ).getTime();

            const tempo =
              fim -
              inicio;

            return tempo > 0
              ? tempo
              : null;
          })
          .filter(
            (
              value
            ): value is number =>
              value !== null
          );

      const tempoMedio =
        temposTotais.length >
        0
          ? temposTotais.reduce(
              (
                soma,
                tempo
              ) =>
                soma +
                tempo,
              0
            ) /
            temposTotais.length
          : 0;

      return {
        total,
        concluidas,
        pendentes,
        canceladas,
        baseTaxa,
        taxaConclusao:
          percentual(
            concluidas,
            baseTaxa
          ),
        concluidasComRelatorio:
          concluidasComRelatorio.length,
        coberturaRelatorio:
          percentual(
            concluidasComRelatorio.length,
            concluidas
          ),
        tempoMedio,
        amostraTempo:
          temposTotais.length,
      };
    }, [ordensFiltradas]);

  const dadosStatus =
    useMemo(
      () =>
        STATUS_OPTIONS.map(
          (status) => ({
            nome:
              status.label,
            valor:
              ordensFiltradas.filter(
                (os) =>
                  os.status ===
                  status.value
              ).length,
            cor:
              CORES_STATUS[
                status.value
              ],
          })
        ),
      [ordensFiltradas]
    );

  const dadosPrioridades =
    useMemo(
      () =>
        PRIORIDADE_OPTIONS.map(
          (
            prioridade
          ) => ({
            nome:
              prioridade.label,
            quantidade:
              ordensFiltradas.filter(
                (os) =>
                  os.prioridade ===
                  prioridade.value
              ).length,
            cor:
              CORES_PRIORIDADE[
                prioridade.value
              ],
          })
        ),
      [ordensFiltradas]
    );

  const dadosEvolucao =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          {
            chave: string;
            criadas: number;
            concluidas: number;
          }
        >();

      ordensFiltradas.forEach(
        (os) => {
          const chaveCriacao =
            chaveMes(
              os.createdAt
            );

          const criacao =
            mapa.get(
              chaveCriacao
            ) ?? {
              chave:
                chaveCriacao,
              criadas: 0,
              concluidas: 0,
            };

          criacao.criadas +=
            1;

          mapa.set(
            chaveCriacao,
            criacao
          );

          /*
           * Concluídas entram no mês da data REAL do relatório.
           * Sem data de relatório válida, não entram na série temporal.
           */
          if (
            os.status ===
              "CONCLUIDA" &&
            os.dataConclusaoRelatorio
          ) {
            const chaveConclusao =
              chaveMes(
                os.dataConclusaoRelatorio
              );

            const conclusao =
              mapa.get(
                chaveConclusao
              ) ?? {
                chave:
                  chaveConclusao,
                criadas: 0,
                concluidas: 0,
              };

            conclusao.concluidas +=
              1;

            mapa.set(
              chaveConclusao,
              conclusao
            );
          }
        }
      );

      const chaves =
        Array.from(
          mapa.keys()
        ).sort();

      if (
        chaves.length ===
        0
      ) {
        return [];
      }

      /*
       * Garante meses contínuos e limita aos 12 mais recentes.
       */
      const primeira =
        chaves[0];

      const ultima =
        chaves[
          chaves.length - 1
        ];

      const [
        primeiroAno,
        primeiroMes,
      ] =
        primeira
          .split("-")
          .map(Number);

      const [
        ultimoAno,
        ultimoMes,
      ] =
        ultima
          .split("-")
          .map(Number);

      const meses: string[] =
        [];

      const cursor =
        new Date(
          primeiroAno,
          primeiroMes - 1,
          1,
          12
        );

      const fim =
        new Date(
          ultimoAno,
          ultimoMes - 1,
          1,
          12
        );

      while (
        cursor <= fim
      ) {
        meses.push(
          `${cursor.getFullYear()}-${String(
            cursor.getMonth() +
              1
          ).padStart(
            2,
            "0"
          )}`
        );

        cursor.setMonth(
          cursor.getMonth() +
            1
        );
      }

      return meses
        .slice(-12)
        .map((chave) => {
          const item =
            mapa.get(
              chave
            );

          return {
            mes:
              formatarMes(
                chave
              ),
            criadas:
              item?.criadas ??
              0,
            concluidas:
              item?.concluidas ??
              0,
          };
        });
    }, [ordensFiltradas]);

  const resumoEvolucao =
    useMemo(() => {
      const criadas =
        dadosEvolucao.reduce(
          (total, item) =>
            total +
            item.criadas,
          0
        );

      const concluidas =
        dadosEvolucao.reduce(
          (total, item) =>
            total +
            item.concluidas,
          0
        );

      return {
        criadas,
        concluidas,
        saldo:
          concluidas -
          criadas,
      };
    }, [dadosEvolucao]);

  const dadosSetores =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          {
            setor: string;
            concluidas: number;
            pendentes: number;
            canceladas: number;
            total: number;
            baseValida: number;
          }
        >();

      ordensFiltradas.forEach(
        (os) => {
          const id =
            os.setor?.id ??
            "SEM_SETOR";

          const atual =
            mapa.get(id) ?? {
              setor:
                os.setor?.nome ??
                "Sem setor",
              concluidas: 0,
              pendentes: 0,
              canceladas: 0,
              total: 0,
              baseValida: 0,
            };

          atual.total += 1;

          if (
            os.status ===
            "CONCLUIDA"
          ) {
            atual.concluidas +=
              1;
            atual.baseValida +=
              1;
          } else if (
            os.status ===
            "CANCELADA"
          ) {
            atual.canceladas +=
              1;
          } else {
            atual.pendentes +=
              1;
            atual.baseValida +=
              1;
          }

          mapa.set(
            id,
            atual
          );
        }
      );

      return Array.from(
        mapa.values()
      )
        .map((item) => ({
          ...item,
          eficiencia:
            percentual(
              item.concluidas,
              item.baseValida
            ),
        }))
        .sort(
          (a, b) =>
            b.total -
            a.total
        )
        .slice(
          0,
          14
        );
    }, [ordensFiltradas]);

  const dadosColaboradores =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          {
            colaborador: string;
            atribuidas: number;
            concluidas: number;
            pendentes: number;
            canceladas: number;
            baseValida: number;
          }
        >();

      ordensFiltradas.forEach(
        (os) => {
          os.responsaveis.forEach(
            (
              responsavel
            ) => {
              const atual =
                mapa.get(
                  responsavel.id
                ) ?? {
                  colaborador:
                    responsavel.nome,
                  atribuidas: 0,
                  concluidas: 0,
                  pendentes: 0,
                  canceladas: 0,
                  baseValida: 0,
                };

              atual.atribuidas +=
                1;

              if (
                os.status ===
                "CONCLUIDA"
              ) {
                atual.concluidas +=
                  1;
                atual.baseValida +=
                  1;
              } else if (
                os.status ===
                "CANCELADA"
              ) {
                atual.canceladas +=
                  1;
              } else {
                atual.pendentes +=
                  1;
                atual.baseValida +=
                  1;
              }

              mapa.set(
                responsavel.id,
                atual
              );
            }
          );
        }
      );

      return Array.from(
        mapa.values()
      )
        .map((item) => ({
          ...item,
          eficiencia:
            percentual(
              item.concluidas,
              item.baseValida
            ),
        }))
        .sort(
          (a, b) =>
            b.atribuidas -
            a.atribuidas
        )
        .slice(
          0,
          12
        );
    }, [ordensFiltradas]);

  const dadosMaquinas =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          {
            maquina: string;
            ocorrencias: number;
            concluidas: number;
            canceladas: number;
            baseValida: number;
          }
        >();

      ordensFiltradas.forEach(
        (os) => {
          if (!os.maquina) {
            return;
          }

          const atual =
            mapa.get(
              os.maquina.id
            ) ?? {
              maquina:
                os.maquina.nome,
              ocorrencias: 0,
              concluidas: 0,
              canceladas: 0,
              baseValida: 0,
            };

          atual.ocorrencias +=
            1;

          if (
            os.status ===
            "CONCLUIDA"
          ) {
            atual.concluidas +=
              1;
            atual.baseValida +=
              1;
          } else if (
            os.status ===
            "CANCELADA"
          ) {
            atual.canceladas +=
              1;
          } else {
            atual.baseValida +=
              1;
          }

          mapa.set(
            os.maquina.id,
            atual
          );
        }
      );

      return Array.from(
        mapa.values()
      )
        .map((item) => ({
          ...item,
          eficiencia:
            percentual(
              item.concluidas,
              item.baseValida
            ),
        }))
        .sort(
          (a, b) =>
            b.ocorrencias -
            a.ocorrencias
        )
        .slice(
          0,
          10
        );
    }, [ordensFiltradas]);

  const resumoFiltros =
    useMemo(() => {
      const setor =
        setores.find(
          (item) =>
            item.id ===
            filtrosAplicados.setor
        )?.nome ?? "Todos";

      const colaborador =
        colaboradores.find(
          (item) =>
            item.id ===
            filtrosAplicados.colaborador
        )?.nome ?? "Todos";

      const maquina =
        maquinas.find(
          (item) =>
            item.id ===
            filtrosAplicados.maquina
        )?.nome ?? "Todas";

      return {
        periodo:
          `${formatarDataInput(
            filtrosAplicados.dataInicio
          )} até ${formatarDataInput(
            filtrosAplicados.dataFim
          )}`,
        setor,
        colaborador,
        maquina,
        status:
          filtrosAplicados.status
            ? statusLabel(
                filtrosAplicados.status
              )
            : "Todos",
        prioridade:
          filtrosAplicados.prioridade
            ? prioridadeLabel(
                filtrosAplicados.prioridade
              )
            : "Todas",
      };
    }, [
      colaboradores,
      filtrosAplicados,
      maquinas,
      setores,
    ]);

  function aplicarFiltros(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setFiltrosAplicados({
      ...filtrosEdicao,
    });
  }

  function limparFiltros() {
    const vazios: Filtros = {
      dataInicio: "",
      dataFim: "",
      status: "",
      colaborador: "",
      setor: "",
      prioridade: "",
      maquina: "",
    };

    setFiltrosEdicao(
      vazios
    );

    setFiltrosAplicados(
      vazios
    );
  }

  async function gerarPDF() {
    if (gerandoPDF) {
      return;
    }

    try {
      setGerandoPDF(true);

      const [
        { jsPDF },
        { default: autoTable },
      ] =
        await Promise.all([
          import("jspdf"),
          import(
            "jspdf-autotable"
          ),
        ]);

      const pdf =
        new jsPDF({
          orientation:
            "landscape",
          unit: "mm",
          format: "a4",
        });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margem = 12;
      const util =
        pageWidth -
        margem * 2;

      const navy: [
        number,
        number,
        number
      ] = [7, 18, 34];

      const cyan: [
        number,
        number,
        number
      ] = [6, 182, 212];

      const green: [
        number,
        number,
        number
      ] = [16, 150, 105];

      const blue: [
        number,
        number,
        number
      ] = [59, 130, 246];

      const orange: [
        number,
        number,
        number
      ] = [249, 115, 22];

      const violet: [
        number,
        number,
        number
      ] = [139, 92, 246];

      const red: [
        number,
        number,
        number
      ] = [239, 68, 68];

      const slate: [
        number,
        number,
        number
      ] = [71, 85, 105];

      const light: [
        number,
        number,
        number
      ] = [246, 248, 251];

      const border: [
        number,
        number,
        number
      ] = [220, 226, 234];

      const text: [
        number,
        number,
        number
      ] = [28, 39, 54];

      const loadLogo =
        async () => {
          try {
            const response =
              await fetch(
                "/logo.sequoia.png"
              );

            if (
              !response.ok
            ) {
              return null;
            }

            const blob =
              await response.blob();

            return await new Promise<
              string | null
            >((resolve) => {
              const reader =
                new FileReader();

              reader.onloadend =
                () => {
                  resolve(
                    typeof reader.result ===
                      "string"
                      ? reader.result
                      : null
                  );
                };

              reader.readAsDataURL(
                blob
              );
            });
          } catch {
            return null;
          }
        };

      const logo =
        await loadLogo();

      const header = (
        titulo: string,
        subtitulo: string,
        pagina: number
      ) => {
        pdf.setFillColor(
          ...navy
        );

        pdf.roundedRect(
          margem,
          10,
          util,
          27,
          4,
          4,
          "F"
        );

        if (logo) {
          pdf.addImage(
            logo,
            "PNG",
            margem + 5,
            13,
            20,
            20
          );
        }

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(16);

        pdf.setTextColor(
          255,
          255,
          255
        );

        pdf.text(
          titulo,
          margem + 31,
          20
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(8.5);

        pdf.setTextColor(
          190,
          208,
          224
        );

        pdf.text(
          subtitulo,
          margem + 31,
          27
        );

        pdf.setFontSize(7.5);

        pdf.text(
          `Página ${pagina}`,
          pageWidth -
            margem -
            5,
          27,
          {
            align: "right",
          }
        );
      };

      const footer =
        () => {
          pdf.setDrawColor(
            ...border
          );

          pdf.line(
            margem,
            pageHeight - 12,
            pageWidth -
              margem,
            pageHeight - 12
          );

          pdf.setFontSize(
            7
          );

          pdf.setTextColor(
            ...slate
          );

          pdf.text(
            "Sistema de OS • Sequoia • Indicadores técnicos",
            margem,
            pageHeight - 7
          );

          pdf.text(
            "Conclusões e tempo médio baseados no relatório técnico",
            pageWidth -
              margem,
            pageHeight - 7,
            {
              align: "right",
            }
          );
        };

      const metricCard =
        (
          x: number,
          y: number,
          width: number,
          label: string,
          value: string,
          helper: string,
          accent: [
            number,
            number,
            number
          ]
        ) => {
          pdf.setFillColor(
            ...light
          );

          pdf.setDrawColor(
            ...border
          );

          pdf.roundedRect(
            x,
            y,
            width,
            24,
            3,
            3,
            "FD"
          );

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.setFontSize(7);

          pdf.setTextColor(
            ...accent
          );

          pdf.text(
            label.toUpperCase(),
            x + 4,
            y + 6
          );

          pdf.setFontSize(15);

          pdf.setTextColor(
            ...text
          );

          pdf.text(
            value,
            x + 4,
            y + 14
          );

          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.setFontSize(6.5);

          pdf.setTextColor(
            ...slate
          );

          pdf.text(
            pdf.splitTextToSize(
              helper,
              width - 8
            ),
            x + 4,
            y + 20
          );
        };

      const drawLineChart =
        (
          x: number,
          y: number,
          width: number,
          height: number
        ) => {
          pdf.setFillColor(
            ...light
          );

          pdf.setDrawColor(
            ...border
          );

          pdf.roundedRect(
            x,
            y,
            width,
            height,
            3,
            3,
            "FD"
          );

          if (
            dadosEvolucao.length ===
            0
          ) {
            pdf.setTextColor(
              ...slate
            );

            pdf.setFontSize(
              8
            );

            pdf.text(
              "Sem dados de evolução.",
              x + 6,
              y + 12
            );

            return;
          }

          const padL = 8;
          const padR = 5;
          const padT = 8;
          const padB = 12;

          const graphW =
            width -
            padL -
            padR;

          const graphH =
            height -
            padT -
            padB;

          const max =
            Math.max(
              1,
              ...dadosEvolucao.flatMap(
                (item) => [
                  item.criadas,
                  item.concluidas,
                ]
              )
            );

          for (
            let i = 0;
            i <= 3;
            i += 1
          ) {
            const gy =
              y +
              padT +
              (graphH /
                3) *
                i;

            pdf.setDrawColor(
              225,
              230,
              236
            );

            pdf.line(
              x + padL,
              gy,
              x +
                padL +
                graphW,
              gy
            );
          }

          const points = (
            key:
              | "criadas"
              | "concluidas"
          ) =>
            dadosEvolucao.map(
              (
                item,
                index
              ) => ({
                x:
                  x +
                  padL +
                  (index /
                    Math.max(
                      1,
                      dadosEvolucao.length -
                        1
                    )) *
                    graphW,
                y:
                  y +
                  padT +
                  graphH -
                  (item[key] /
                    max) *
                    graphH,
              })
            );

          const drawSeries = (
            series: {
              x: number;
              y: number;
            }[],
            color: [
              number,
              number,
              number
            ]
          ) => {
            pdf.setDrawColor(
              ...color
            );

            pdf.setLineWidth(
              0.8
            );

            for (
              let i = 1;
              i <
              series.length;
              i += 1
            ) {
              pdf.line(
                series[
                  i - 1
                ].x,
                series[
                  i - 1
                ].y,
                series[i].x,
                series[i].y
              );
            }

            series.forEach(
              (point) => {
                pdf.setFillColor(
                  ...color
                );

                pdf.circle(
                  point.x,
                  point.y,
                  1.4,
                  "F"
                );
              }
            );
          };

          drawSeries(
            points("criadas"),
            cyan
          );

          drawSeries(
            points(
              "concluidas"
            ),
            green
          );

          pdf.setFontSize(
            6.5
          );

          pdf.setTextColor(
            ...slate
          );

          dadosEvolucao.forEach(
            (
              item,
              index
            ) => {
              if (
                dadosEvolucao.length >
                  8 &&
                index % 2 !==
                  0 &&
                index !==
                  dadosEvolucao.length -
                    1
              ) {
                return;
              }

              const px =
                x +
                padL +
                (index /
                  Math.max(
                    1,
                    dadosEvolucao.length -
                      1
                  )) *
                  graphW;

              pdf.text(
                item.mes,
                px,
                y +
                  height -
                  4,
                {
                  align:
                    "center",
                }
              );
            }
          );

          pdf.setFillColor(
            ...cyan
          );

          pdf.circle(
            x +
              width -
              52,
            y + 5,
            1.4,
            "F"
          );

          pdf.setTextColor(
            ...text
          );

          pdf.text(
            "Criadas",
            x +
              width -
              48,
            y + 6
          );

          pdf.setFillColor(
            ...green
          );

          pdf.circle(
            x +
              width -
              25,
            y + 5,
            1.4,
            "F"
          );

          pdf.text(
            "Concluídas",
            x +
              width -
              21,
            y + 6
          );
        };

      /*
       * PÁGINA 1 — RESUMO EXECUTIVO
       */
      header(
        "Indicadores de Ordens de Serviço",
        "Resumo executivo • canceladas fora das taxas • conclusão pela data real do relatório",
        1
      );

      const chipY = 42;

      const filtros = [
        [
          "Período",
          resumoFiltros.periodo,
        ],
        [
          "Setor",
          resumoFiltros.setor,
        ],
        [
          "Máquina",
          resumoFiltros.maquina,
        ],
        [
          "Colaborador",
          resumoFiltros.colaborador,
        ],
        [
          "Status",
          resumoFiltros.status,
        ],
        [
          "Prioridade",
          resumoFiltros.prioridade,
        ],
      ];

      const chipGap = 2.5;
      const chipW =
        (util -
          chipGap * 5) /
        6;

      filtros.forEach(
        (
          [label, value],
          index
        ) => {
          const x =
            margem +
            index *
              (chipW +
                chipGap);

          pdf.setFillColor(
            248,
            250,
            252
          );

          pdf.setDrawColor(
            ...border
          );

          pdf.roundedRect(
            x,
            chipY,
            chipW,
            14,
            2,
            2,
            "FD"
          );

          pdf.setFont(
            "helvetica",
            "bold"
          );

          pdf.setFontSize(
            5.8
          );

          pdf.setTextColor(
            ...slate
          );

          pdf.text(
            String(label).toUpperCase(),
            x + 3,
            chipY + 4.5
          );

          pdf.setFontSize(
            7.1
          );

          pdf.setTextColor(
            ...text
          );

          pdf.text(
            pdf.splitTextToSize(
              String(value),
              chipW - 6
            )[0],
            x + 3,
            chipY + 10.5
          );
        }
      );

      const cardGap = 3;
      const cardW =
        (util -
          cardGap * 2) /
        3;

      metricCard(
        margem,
        61,
        cardW,
        "Total de OS",
        String(
          metricas.total
        ),
        "Todas as ordens no filtro",
        cyan
      );

      metricCard(
        margem +
          cardW +
          cardGap,
        61,
        cardW,
        "Taxa de conclusão",
        `${metricas.taxaConclusao}%`,
        `${metricas.concluidas}/${metricas.baseTaxa} OS válidas • canceladas excluídas`,
        violet
      );

      metricCard(
        margem +
          (cardW +
            cardGap) *
            2,
        61,
        cardW,
        "Tempo médio total",
        formatarDuracaoMedia(
          metricas.tempoMedio
        ),
        `Abertura → término real do relatório • ${metricas.amostraTempo} OS`,
        orange
      );

      metricCard(
        margem,
        89,
        cardW,
        "Concluídas",
        String(
          metricas.concluidas
        ),
        "Serviços finalizados",
        green
      );

      metricCard(
        margem +
          cardW +
          cardGap,
        89,
        cardW,
        "Pendentes",
        String(
          metricas.pendentes
        ),
        "Não iniciadas + em andamento",
        blue
      );

      metricCard(
        margem +
          (cardW +
            cardGap) *
            2,
        89,
        cardW,
        "Cobertura técnica",
        `${metricas.coberturaRelatorio}%`,
        `${metricas.concluidasComRelatorio}/${metricas.concluidas} concluídas com data de relatório válida`,
        cyan
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(11);

      pdf.setTextColor(
        ...navy
      );

      pdf.text(
        "Evolução real das ordens",
        margem,
        124
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(7);

      pdf.setTextColor(
        ...slate
      );

      pdf.text(
        "Criadas pela abertura da OS • Concluídas pela data/hora de término do relatório técnico",
        margem,
        129
      );

      drawLineChart(
        margem,
        134,
        util,
        58
      );

      footer();

      /*
       * PÁGINA 2 — DISTRIBUIÇÃO E RANKINGS
       */
      pdf.addPage();

      header(
        "Distribuição Operacional",
        "Status, prioridades e rankings com canceladas excluídas dos cálculos de eficiência",
        2
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(10);

      pdf.setTextColor(
        ...navy
      );

      pdf.text(
        "Status",
        margem,
        47
      );

      autoTable(pdf, {
        startY: 51,
        margin: {
          left: margem,
          right:
            pageWidth -
            margem -
            70,
        },
        tableWidth: 70,
        head: [
          [
            "Status",
            "OS",
          ],
        ],
        body:
          dadosStatus.map(
            (item) => [
              item.nome,
              String(
                item.valor
              ),
            ]
          ),
        theme: "grid",
        styles: {
          fontSize: 7.2,
          cellPadding: 2,
          textColor: text,
          fillColor: light,
          lineColor: border,
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: navy,
          textColor: [
            255,
            255,
            255,
          ],
          fontStyle: "bold",
        },
      });

      pdf.text(
        "Prioridades",
        88,
        47
      );

      autoTable(pdf, {
        startY: 51,
        margin: {
          left: 88,
          right:
            pageWidth -
            88 -
            70,
        },
        tableWidth: 70,
        head: [
          [
            "Prioridade",
            "OS",
          ],
        ],
        body:
          dadosPrioridades.map(
            (item) => [
              item.nome,
              String(
                item.quantidade
              ),
            ]
          ),
        theme: "grid",
        styles: {
          fontSize: 7.2,
          cellPadding: 2,
          textColor: text,
          fillColor: light,
          lineColor: border,
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: orange,
          textColor: [
            255,
            255,
            255,
          ],
          fontStyle: "bold",
        },
      });

      pdf.text(
        "Setores",
        164,
        47
      );

      autoTable(pdf, {
        startY: 51,
        margin: {
          left: 164,
          right: margem,
        },
        tableWidth:
          pageWidth -
          164 -
          margem,
        head: [
          [
            "Setor",
            "Total",
            "Concl.",
            "Pend.",
            "Canc.",
            "Ef.",
          ],
        ],
        body:
          dadosSetores
            .slice(0, 10)
            .map(
              (item) => [
                item.setor,
                String(
                  item.total
                ),
                String(
                  item.concluidas
                ),
                String(
                  item.pendentes
                ),
                String(
                  item.canceladas
                ),
                `${item.eficiencia}%`,
              ]
            ),
        theme: "grid",
        styles: {
          fontSize: 6.2,
          cellPadding: 1.7,
          textColor: text,
          fillColor: light,
          lineColor: border,
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: cyan,
          textColor: navy,
          fontStyle: "bold",
        },
      });

      const y2 = 105;

      pdf.text(
        "Colaboradores",
        margem,
        y2
      );

      autoTable(pdf, {
        startY: y2 + 4,
        margin: {
          left: margem,
          right:
            pageWidth -
            margem -
            128,
        },
        tableWidth: 128,
        head: [
          [
            "Colaborador",
            "Atrib.",
            "Concl.",
            "Pend.",
            "Canc.",
            "Ef.",
          ],
        ],
        body:
          dadosColaboradores
            .slice(0, 10)
            .map(
              (item) => [
                item.colaborador,
                String(
                  item.atribuidas
                ),
                String(
                  item.concluidas
                ),
                String(
                  item.pendentes
                ),
                String(
                  item.canceladas
                ),
                `${item.eficiencia}%`,
              ]
            ),
        theme: "grid",
        styles: {
          fontSize: 6.4,
          cellPadding: 1.8,
          textColor: text,
          fillColor: light,
          lineColor: border,
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: violet,
          textColor: [
            255,
            255,
            255,
          ],
          fontStyle: "bold",
        },
      });

      pdf.text(
        "Máquinas com mais ocorrências",
        153,
        y2
      );

      autoTable(pdf, {
        startY: y2 + 4,
        margin: {
          left: 153,
          right: margem,
        },
        tableWidth:
          pageWidth -
          153 -
          margem,
        head: [
          [
            "Máquina",
            "OS",
            "Concl.",
            "Canc.",
            "Ef.",
          ],
        ],
        body:
          dadosMaquinas
            .slice(0, 10)
            .map(
              (item) => [
                item.maquina,
                String(
                  item.ocorrencias
                ),
                String(
                  item.concluidas
                ),
                String(
                  item.canceladas
                ),
                `${item.eficiencia}%`,
              ]
            ),
        theme: "grid",
        styles: {
          fontSize: 6.4,
          cellPadding: 1.8,
          textColor: text,
          fillColor: light,
          lineColor: border,
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: orange,
          textColor: [
            255,
            255,
            255,
          ],
          fontStyle: "bold",
        },
      });

      footer();

      /*
       * PÁGINA 3 — METODOLOGIA
       */
      pdf.addPage();

      header(
        "Metodologia dos Indicadores",
        "Regras adotadas para evitar distorções administrativas nos dados técnicos",
        3
      );

      const notas = [
        [
          "Conclusões no gráfico",
          "A conclusão entra no mês da Data/Hora de término preenchida no relatório técnico. dataConclusao e updatedAt não são usados como fallback.",
        ],
        [
          "Tempo médio total",
          "Média do intervalo entre createdAt da OS e a Data/Hora de término real do relatório. Só entram OS concluídas com data técnica válida.",
        ],
        [
          "Taxa de conclusão",
          "Concluídas ÷ (Total de OS - Canceladas). Canceladas não reduzem a eficiência.",
        ],
        [
          "Eficiência por setor, colaborador e máquina",
          "Concluídas ÷ (Concluídas + Pendentes). OS canceladas aparecem para rastreabilidade, mas não entram no denominador.",
        ],
        [
          "Filtro de período",
          "O período selecionado filtra pela data de abertura da OS. Dentro desse conjunto, as conclusões continuam posicionadas pela data real do relatório.",
        ],
        [
          "Cobertura técnica",
          "Percentual de OS concluídas que possuem Data/Hora de término reconhecida no relatório técnico.",
        ],
      ];

      autoTable(pdf, {
        startY: 48,
        margin: {
          left: margem,
          right: margem,
        },
        head: [
          [
            "Indicador",
            "Regra",
          ],
        ],
        body: notas,
        theme: "grid",
        styles: {
          fontSize: 8.5,
          cellPadding: 4,
          textColor: text,
          fillColor: light,
          lineColor: border,
          lineWidth: 0.12,
          valign: "top",
        },
        headStyles: {
          fillColor: navy,
          textColor: [
            255,
            255,
            255,
          ],
          fontStyle: "bold",
        },
        columnStyles: {
          0: {
            cellWidth: 55,
            fontStyle: "bold",
          },
        },
      });

      footer();

      const dataArquivo =
        new Date()
          .toLocaleDateString(
            "pt-BR"
          )
          .replaceAll(
            "/",
            "-"
          );

      pdf.save(
        `indicadores-os-${dataArquivo}.pdf`
      );
    } catch (error) {
      console.error(
        "Erro ao gerar PDF:",
        error
      );

      alert(
        "Não foi possível gerar o PDF dos indicadores."
      );
    } finally {
      setGerandoPDF(
        false
      );
    }
  }

  return (
    <div className="space-y-5">
      {/* =====================================================
          FILTROS
      ====================================================== */}
      <section className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-4 shadow-[0_12px_35px_rgba(0,0,0,.16)] sm:p-5">
        <form
          onSubmit={
            aplicarFiltros
          }
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
                <Filter
                  size={18}
                />
              </div>

              <div>
                <h2 className="text-base font-black text-white">
                  Filtros do dashboard
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  O período filtra pela abertura da OS; conclusões continuam usando a data real do relatório.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                gerarPDF
              }
              disabled={
                gerandoPDF
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 text-xs font-black text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-50"
            >
              <Download
                size={15}
              />
              {gerandoPDF
                ? "Gerando..."
                : "Exportar PDF"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CampoFiltro
              label="Data inicial"
              icon={
                <CalendarDays
                  size={15}
                />
              }
            >
              <input
                type="date"
                value={
                  filtrosEdicao.dataInicio
                }
                onChange={(
                  event
                ) =>
                  setFiltrosEdicao(
                    (
                      anterior
                    ) => ({
                      ...anterior,
                      dataInicio:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClass
                }
              />
            </CampoFiltro>

            <CampoFiltro
              label="Data final"
              icon={
                <CalendarDays
                  size={15}
                />
              }
            >
              <input
                type="date"
                value={
                  filtrosEdicao.dataFim
                }
                onChange={(
                  event
                ) =>
                  setFiltrosEdicao(
                    (
                      anterior
                    ) => ({
                      ...anterior,
                      dataFim:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClass
                }
              />
            </CampoFiltro>

            <CampoFiltro
              label="Status"
              icon={
                <Activity
                  size={15}
                />
              }
            >
              <select
                value={
                  filtrosEdicao.status
                }
                onChange={(
                  event
                ) =>
                  setFiltrosEdicao(
                    (
                      anterior
                    ) => ({
                      ...anterior,
                      status:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  Todos
                </option>

                {STATUS_OPTIONS.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {
                        item.label
                      }
                    </option>
                  )
                )}
              </select>
            </CampoFiltro>

            <CampoFiltro
              label="Prioridade"
              icon={
                <Gauge
                  size={15}
                />
              }
            >
              <select
                value={
                  filtrosEdicao.prioridade
                }
                onChange={(
                  event
                ) =>
                  setFiltrosEdicao(
                    (
                      anterior
                    ) => ({
                      ...anterior,
                      prioridade:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  Todas
                </option>

                {PRIORIDADE_OPTIONS.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {
                        item.label
                      }
                    </option>
                  )
                )}
              </select>
            </CampoFiltro>

            <CampoFiltro
              label="Setor"
              icon={
                <Building2
                  size={15}
                />
              }
            >
              <select
                value={
                  filtrosEdicao.setor
                }
                onChange={(
                  event
                ) =>
                  setFiltrosEdicao(
                    (
                      anterior
                    ) => ({
                      ...anterior,
                      setor:
                        event
                          .target
                          .value,
                      maquina: "",
                    })
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  Todos
                </option>

                {setores.map(
                  (setor) => (
                    <option
                      key={
                        setor.id
                      }
                      value={
                        setor.id
                      }
                    >
                      {
                        setor.nome
                      }
                    </option>
                  )
                )}
              </select>
            </CampoFiltro>

            <CampoFiltro
              label="Máquina"
              icon={
                <Wrench
                  size={15}
                />
              }
            >
              <select
                value={
                  filtrosEdicao.maquina
                }
                onChange={(
                  event
                ) =>
                  setFiltrosEdicao(
                    (
                      anterior
                    ) => ({
                      ...anterior,
                      maquina:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  Todas
                </option>

                {maquinasDisponiveis.map(
                  (maquina) => (
                    <option
                      key={
                        maquina.id
                      }
                      value={
                        maquina.id
                      }
                    >
                      {
                        maquina.nome
                      }
                    </option>
                  )
                )}
              </select>
            </CampoFiltro>

            <CampoFiltro
              label="Colaborador"
              icon={
                <Users
                  size={15}
                />
              }
            >
              <select
                value={
                  filtrosEdicao.colaborador
                }
                onChange={(
                  event
                ) =>
                  setFiltrosEdicao(
                    (
                      anterior
                    ) => ({
                      ...anterior,
                      colaborador:
                        event
                          .target
                          .value,
                    })
                  )
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  Todos
                </option>

                {colaboradores.map(
                  (
                    colaborador
                  ) => (
                    <option
                      key={
                        colaborador.id
                      }
                      value={
                        colaborador.id
                      }
                    >
                      {
                        colaborador.nome
                      }
                    </option>
                  )
                )}
              </select>
            </CampoFiltro>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                <Filter
                  size={16}
                />
                Aplicar
              </button>

              <button
                type="button"
                onClick={
                  limparFiltros
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-black text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <RotateCcw
                  size={16}
                />
                Limpar
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* =====================================================
          KPIs
      ====================================================== */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total de OS"
          value={
            metricas.total
          }
          helper="Ordens no filtro atual"
          icon={
            <BarChart3
              size={19}
            />
          }
          tone="cyan"
        />

        <KpiCard
          label="Concluídas"
          value={
            metricas.concluidas
          }
          helper="Serviços finalizados"
          icon={
            <CheckCircle2
              size={19}
            />
          }
          tone="green"
        />

        <KpiCard
          label="Pendentes"
          value={
            metricas.pendentes
          }
          helper="Não iniciadas + em andamento"
          icon={
            <Clock3
              size={19}
            />
          }
          tone="blue"
        />

        <KpiCard
          label="Taxa de conclusão"
          value={`${metricas.taxaConclusao}%`}
          helper={`${metricas.concluidas}/${metricas.baseTaxa} OS válidas • canceladas fora da conta`}
          icon={
            <Gauge
              size={19}
            />
          }
          tone="violet"
        />

        <KpiCard
          label="Tempo médio total"
          value={formatarDuracaoMedia(
            metricas.tempoMedio
          )}
          helper={`Abertura → término real do relatório • ${metricas.amostraTempo} OS`}
          icon={
            <TrendingUp
              size={19}
            />
          }
          tone="orange"
        />

        <KpiCard
          label="Cobertura técnica"
          value={`${metricas.coberturaRelatorio}%`}
          helper={`${metricas.concluidasComRelatorio}/${metricas.concluidas} concluídas com data de relatório válida`}
          icon={
            <FileCheck2
              size={19}
            />
          }
          tone="slate"
        />
      </section>

      {/* =====================================================
          EVOLUÇÃO — PRINCIPAL
      ====================================================== */}
      <CardGrafico
        title="Evolução real das ordens"
        subtitle="Criadas pela abertura da OS • concluídas pela data/hora de término informada no relatório técnico"
        icon={
          <TrendingUp
            size={20}
          />
        }
        right={
          <div className="hidden items-center gap-4 text-[10px] font-black uppercase tracking-[0.08em] sm:flex">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Criadas
            </span>

            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Concluídas
            </span>
          </div>
        }
      >
        <div className="mb-3 grid gap-2.5 sm:grid-cols-3">
          <ResumoEvolucao
            label="Criadas"
            value={
              resumoEvolucao.criadas
            }
            tone="cyan"
          />

          <ResumoEvolucao
            label="Concluídas"
            value={
              resumoEvolucao.concluidas
            }
            tone="green"
          />

          <ResumoEvolucao
            label="Saldo"
            value={
              resumoEvolucao.saldo
            }
            signed
            tone={
              resumoEvolucao.saldo >=
              0
                ? "green"
                : "orange"
            }
          />
        </div>

        <div className="h-[330px] sm:h-[390px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <ComposedChart
              data={
                dadosEvolucao
              }
              margin={{
                top: 12,
                right: 18,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="areaCriadasOS"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#22d3ee"
                    stopOpacity={
                      0.22
                    }
                  />

                  <stop
                    offset="100%"
                    stopColor="#22d3ee"
                    stopOpacity={
                      0
                    }
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={
                  false
                }
                stroke="rgba(148,163,184,.10)"
                strokeDasharray="4 6"
              />

              <XAxis
                dataKey="mes"
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                tickMargin={10}
                tick={{
                  fill:
                    "#94a3b8",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />

              <YAxis
                allowDecimals={
                  false
                }
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                width={42}
                tick={{
                  fill:
                    "#64748b",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />

              <Tooltip
                contentStyle={
                  tooltipStyle
                }
                formatter={(
                  value,
                  name
                ) => [
                  `${value} OS`,
                  name ===
                  "criadas"
                    ? "Criadas"
                    : "Concluídas pelo relatório",
                ]}
              />

              <Area
                type="monotone"
                dataKey="criadas"
                stroke="#22d3ee"
                strokeWidth={3.5}
                fill="url(#areaCriadasOS)"
                dot={{
                  r: 4,
                  fill:
                    "#07101f",
                  stroke:
                    "#22d3ee",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill:
                    "#22d3ee",
                  stroke:
                    "#cffafe",
                  strokeWidth: 2,
                }}
              />

              <Line
                type="monotone"
                dataKey="concluidas"
                stroke="#34d399"
                strokeWidth={3.5}
                strokeDasharray="8 5"
                dot={{
                  r: 4,
                  fill:
                    "#07101f",
                  stroke:
                    "#34d399",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill:
                    "#34d399",
                  stroke:
                    "#d1fae5",
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] px-3 py-2.5">
          <p className="text-xs leading-5 text-slate-500">
            Uma OS concluída administrativamente em novembro pode aparecer como concluída em outubro se o relatório técnico registrar término em outubro. Não há fallback para <strong className="text-slate-400">dataConclusao</strong> ou <strong className="text-slate-400">updatedAt</strong>.
          </p>
        </div>
      </CardGrafico>

      {/* =====================================================
          STATUS + PRIORIDADE
      ====================================================== */}
      <section className="grid gap-5 xl:grid-cols-2">
        <CardGrafico
          title="Distribuição por status"
          subtitle="Situação atual das ordens no filtro aplicado"
          icon={
            <PieChartIcon
              size={20}
            />
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div className="h-[310px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={
                      dadosStatus
                    }
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={78}
                    outerRadius={112}
                    paddingAngle={3}
                    stroke="#070c1b"
                    strokeWidth={2}
                  >
                    {dadosStatus.map(
                      (
                        entry
                      ) => (
                        <Cell
                          key={
                            entry.nome
                          }
                          fill={
                            entry.cor
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                    formatter={(
                      value
                    ) => [
                      `${value} OS`,
                      "Quantidade",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-2">
              {dadosStatus.map(
                (item) => (
                  <div
                    key={
                      item.nome
                    }
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#030817] px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            item.cor,
                        }}
                      />
                      {
                        item.nome
                      }
                    </span>

                    <strong className="text-sm font-black text-white">
                      {
                        item.valor
                      }
                    </strong>
                  </div>
                )
              )}
            </div>
          </div>
        </CardGrafico>

        <CardGrafico
          title="Distribuição por prioridade"
          subtitle="Volume de OS por criticidade"
          icon={
            <Gauge
              size={20}
            />
          }
        >
          <div className="h-[350px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={
                  dadosPrioridades
                }
                margin={{
                  top: 16,
                  right: 12,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  vertical={
                    false
                  }
                  stroke="rgba(148,163,184,.10)"
                  strokeDasharray="4 6"
                />

                <XAxis
                  dataKey="nome"
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                  tick={{
                    fill:
                      "#94a3b8",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />

                <YAxis
                  allowDecimals={
                    false
                  }
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                  width={42}
                  tick={{
                    fill:
                      "#64748b",
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={
                    tooltipStyle
                  }
                  formatter={(
                    value
                  ) => [
                    `${value} OS`,
                    "Quantidade",
                  ]}
                />

                <Bar
                  dataKey="quantidade"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                >
                  {dadosPrioridades.map(
                    (
                      entry
                    ) => (
                      <Cell
                        key={
                          entry.nome
                        }
                        fill={
                          entry.cor
                        }
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardGrafico>
      </section>

      {/* =====================================================
          SETORES
      ====================================================== */}
      <CardGrafico
        title="Desempenho por setor"
        subtitle="Concluídas, pendentes e canceladas • eficiência sem considerar canceladas"
        icon={
          <Building2
            size={20}
          />
        }
      >
        <div className="h-[430px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={
                dadosSetores
              }
              margin={{
                top: 10,
                right: 16,
                left: 0,
                bottom: 60,
              }}
            >
              <CartesianGrid
                vertical={
                  false
                }
                stroke="rgba(148,163,184,.10)"
                strokeDasharray="4 6"
              />

              <XAxis
                dataKey="setor"
                interval={0}
                angle={-28}
                textAnchor="end"
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                height={80}
                tick={{
                  fill:
                    "#94a3b8",
                  fontSize: 10,
                }}
              />

              <YAxis
                allowDecimals={
                  false
                }
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                width={42}
                tick={{
                  fill:
                    "#64748b",
                  fontSize: 10,
                }}
              />

              <Tooltip
                contentStyle={
                  tooltipStyle
                }
              />

              <Bar
                dataKey="concluidas"
                name="Concluídas"
                stackId="a"
                fill="#10b981"
              />

              <Bar
                dataKey="pendentes"
                name="Pendentes"
                stackId="a"
                fill="#3b82f6"
              />

              <Bar
                dataKey="canceladas"
                name="Canceladas"
                stackId="a"
                fill="#64748b"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {dadosSetores
            .slice(
              0,
              4
            )
            .map(
              (item) => (
                <MiniRanking
                  key={
                    item.setor
                  }
                  label={
                    item.setor
                  }
                  value={`${item.eficiencia}%`}
                  helper={`${item.concluidas}/${item.baseValida} OS válidas`}
                />
              )
            )}
        </div>
      </CardGrafico>

      {/* =====================================================
          COLABORADORES + MÁQUINAS
      ====================================================== */}
      <section className="grid gap-5 xl:grid-cols-2">
        <CardGrafico
          title="Desempenho por colaborador"
          subtitle="Atribuídas, concluídas e pendentes • canceladas não reduzem a eficiência"
          icon={
            <Users
              size={20}
            />
          }
        >
          {dadosColaboradores.length ===
          0 ? (
            <MensagemSemDados text="Nenhuma OS possui responsável nos filtros aplicados." />
          ) : (
            <div className="h-[430px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    dadosColaboradores
                  }
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 18,
                    left: 34,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    horizontal={
                      false
                    }
                    stroke="rgba(148,163,184,.10)"
                    strokeDasharray="4 6"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={
                      false
                    }
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fill:
                        "#64748b",
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    type="category"
                    dataKey="colaborador"
                    width={120}
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fill:
                        "#cbd5e1",
                      fontSize: 10,
                    }}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                  <Bar
                    dataKey="concluidas"
                    name="Concluídas"
                    fill="#10b981"
                    radius={[
                      0,
                      6,
                      6,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="pendentes"
                    name="Pendentes"
                    fill="#3b82f6"
                    radius={[
                      0,
                      6,
                      6,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardGrafico>

        <CardGrafico
          title="Máquinas com mais ocorrências"
          subtitle="Ranking dos equipamentos com maior volume de OS"
          icon={
            <Wrench
              size={20}
            />
          }
        >
          {dadosMaquinas.length ===
          0 ? (
            <MensagemSemDados text="Nenhuma máquina encontrada nos filtros aplicados." />
          ) : (
            <div className="h-[430px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    dadosMaquinas
                  }
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 18,
                    left: 44,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    horizontal={
                      false
                    }
                    stroke="rgba(148,163,184,.10)"
                    strokeDasharray="4 6"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={
                      false
                    }
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fill:
                        "#64748b",
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    type="category"
                    dataKey="maquina"
                    width={135}
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fill:
                        "#cbd5e1",
                      fontSize: 10,
                    }}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                  <Bar
                    dataKey="ocorrencias"
                    name="Ocorrências"
                    fill="#22d3ee"
                    radius={[
                      0,
                      7,
                      7,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardGrafico>
      </section>

      {/* =====================================================
          METODOLOGIA
      ====================================================== */}
      <section className="rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-5 shadow-[0_12px_35px_rgba(0,0,0,.16)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
            <FileCheck2
              size={18}
            />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cyan-300">
              Metodologia
            </p>

            <h2 className="mt-0.5 text-lg font-black text-white">
              Regras dos indicadores
            </h2>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Regra
            title="Conclusões"
            text="Usam exclusivamente Data/Hora de término do relatório técnico."
          />

          <Regra
            title="Taxa de conclusão"
            text="Concluídas ÷ (Total - Canceladas). Canceladas não entram na conta."
          />

          <Regra
            title="Tempo médio total"
            text="Da abertura da OS até o término real registrado no relatório."
          />

          <Regra
            title="Eficiência"
            text="Setores, colaboradores e máquinas também ignoram canceladas no denominador."
          />

          <Regra
            title="Cobertura técnica"
            text="Mostra quantas OS concluídas têm data real de relatório reconhecida."
          />

          <Regra
            title="Período"
            text="O filtro de período usa a abertura da OS; a conclusão permanece posicionada pela data real do relatório."
          />
        </div>
      </section>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/[0.08] bg-[#030817] px-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-400/40";

function CampoFiltro({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
        {icon}
        {label}
      </label>

      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  tone:
    | "cyan"
    | "green"
    | "blue"
    | "violet"
    | "orange"
    | "slate";
}) {
  const tones = {
    cyan:
      "border-cyan-400/15 bg-cyan-400/[0.035] text-cyan-300",
    green:
      "border-emerald-400/15 bg-emerald-400/[0.035] text-emerald-300",
    blue:
      "border-blue-400/15 bg-blue-400/[0.035] text-blue-300",
    violet:
      "border-violet-400/15 bg-violet-400/[0.035] text-violet-300",
    orange:
      "border-orange-400/15 bg-orange-400/[0.035] text-orange-300",
    slate:
      "border-white/[0.08] bg-white/[0.025] text-slate-300",
  };

  return (
    <div
      className={`rounded-[20px] border p-4 ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
            {value}
          </p>

          <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-600">
            {helper}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-black/10">
          {icon}
        </div>
      </div>
    </div>
  );
}

function CardGrafico({
  title,
  subtitle,
  icon,
  right,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-[24px] border border-white/[0.07] bg-[#070c1b] p-4 shadow-[0_12px_35px_rgba(0,0,0,.18)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
            {icon}
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-black tracking-[-0.02em] text-white">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>

        {right}
      </div>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}

function ResumoEvolucao({
  label,
  value,
  tone,
  signed = false,
}: {
  label: string;
  value: number;
  tone:
    | "cyan"
    | "green"
    | "orange";
  signed?: boolean;
}) {
  const tones = {
    cyan:
      "border-cyan-400/12 bg-cyan-400/[0.035] text-cyan-300",
    green:
      "border-emerald-400/12 bg-emerald-400/[0.035] text-emerald-300",
    orange:
      "border-orange-400/12 bg-orange-400/[0.035] text-orange-300",
  };

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${tones[tone]}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.08em] opacity-75">
        {label}
      </p>

      <p className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
        {signed &&
        value > 0
          ? "+"
          : ""}
        {value}
      </p>
    </div>
  );
}

function MiniRanking({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#030817] px-3 py-2.5">
      <p className="truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-emerald-300">
        {value}
      </p>

      <p className="mt-0.5 text-[10px] text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function MensagemSemDados({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#030817] p-6 text-center">
      <p className="text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
}

function Regra({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#030817] p-3.5">
      <p className="text-[10px] font-black uppercase tracking-[0.07em] text-cyan-300">
        {title}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}
