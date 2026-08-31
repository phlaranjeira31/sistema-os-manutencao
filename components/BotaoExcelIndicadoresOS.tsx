"use client";

import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";

type OSIndicadorExcel = {
  numero: number;
  empresa?: string;
  setor: string;
  maquina?: string;
  titulo: string;
  descricao: string;
  prioridade?: string;
  status: string;
  geradaEm: string;
  concluidaEm: string;
  responsavel: string;
};

type FiltrosIndicadores = {
  dataInicio: string;
  dataFim: string;
  status: string;
  colaborador: string;
  setor: string;
  empresa?: string;
  maquina?: string;
  prioridade?: string;
};

type Estatistica = {
  total: number;
  concluidas: number;
  naoIniciadas: number;
  emAndamento: number;
  canceladas: number;
};

const CORES = {
  navy: "08101F",
  navy2: "0F172A",
  navy3: "172033",

  cyan: "06B6D4",
  cyanLight: "CFFAFE",

  white: "FFFFFF",
  black: "020617",

  slate50: "F8FAFC",
  slate100: "F1F5F9",
  slate200: "E2E8F0",
  slate300: "CBD5E1",
  slate400: "94A3B8",
  slate500: "64748B",
  slate700: "334155",

  green: "10B981",
  greenLight: "D1FAE5",

  blue: "3B82F6",
  blueLight: "DBEAFE",

  orange: "F59E0B",
  orangeLight: "FEF3C7",

  red: "EF4444",
  redLight: "FEE2E2",

  purple: "8B5CF6",
  purpleLight: "EDE9FE",
};

function corArgb(hex: string) {
  return `FF${hex.replace("#", "")}`;
}

const BORDA_PADRAO = {
  top: {
    style: "thin" as const,
    color: { argb: corArgb(CORES.slate200) },
  },
  left: {
    style: "thin" as const,
    color: { argb: corArgb(CORES.slate200) },
  },
  bottom: {
    style: "thin" as const,
    color: { argb: corArgb(CORES.slate200) },
  },
  right: {
    style: "thin" as const,
    color: { argb: corArgb(CORES.slate200) },
  },
};

function textoSeguro(valor?: string | null) {
  const texto = String(valor ?? "").trim();

  if (!texto || texto === "-") {
    return "-";
  }

  return texto;
}

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function separarResponsaveis(valor: string) {
  const texto = textoSeguro(valor);

  if (texto === "-") {
    return ["Sem responsável"];
  }

  return texto
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function ehServicoExterno(responsavel: string) {
  const nomes = separarResponsaveis(responsavel).map(normalizarTexto);

  return nomes.some(
    (nome) =>
      nome === "EMPREITEIRA" ||
      nome === "ZEZE SERRALHEIRO"
  );
}

function tipoServico(responsavel: string) {
  if (textoSeguro(responsavel) === "-") {
    return "Sem responsável";
  }

  return ehServicoExterno(responsavel)
    ? "Serviço externo"
    : "Equipe interna";
}

function percentual(parte: number, total: number) {
  if (total <= 0) return 0;

  return parte / total;
}

function barraProgresso(valor: number, tamanho = 18) {
  const percentualLimitado = Math.max(0, Math.min(1, valor));

  const preenchidos = Math.round(percentualLimitado * tamanho);

  return `${"█".repeat(preenchidos)}${"░".repeat(
    tamanho - preenchidos
  )}`;
}

function statusParaChave(status: string) {
  const texto = normalizarTexto(status);

  if (texto.includes("CONCLUID")) return "CONCLUIDA";
  if (texto.includes("ANDAMENTO")) return "EM_ANDAMENTO";
  if (texto.includes("NAO INICIAD")) return "NAO_INICIADA";
  if (texto.includes("CANCELAD")) return "CANCELADA";

  return texto;
}

function corStatus(status: string) {
  const chave = statusParaChave(status);

  if (chave === "CONCLUIDA") {
    return {
      fundo: CORES.greenLight,
      texto: CORES.green,
    };
  }

  if (chave === "EM_ANDAMENTO") {
    return {
      fundo: CORES.blueLight,
      texto: CORES.blue,
    };
  }

  if (chave === "NAO_INICIADA") {
    return {
      fundo: CORES.orangeLight,
      texto: CORES.orange,
    };
  }

  return {
    fundo: CORES.slate200,
    texto: CORES.slate700,
  };
}

function corPrioridade(prioridade: string) {
  const chave = normalizarTexto(prioridade);

  if (chave === "URGENTE") {
    return {
      fundo: CORES.redLight,
      texto: CORES.red,
    };
  }

  if (chave === "ALTA") {
    return {
      fundo: CORES.orangeLight,
      texto: CORES.orange,
    };
  }

  if (
    chave === "MEDIA" ||
    chave === "MÉDIA"
  ) {
    return {
      fundo: CORES.blueLight,
      texto: CORES.blue,
    };
  }

  if (chave === "BAIXA") {
    return {
      fundo: CORES.greenLight,
      texto: CORES.green,
    };
  }

  return {
    fundo: CORES.slate100,
    texto: CORES.slate500,
  };
}

function parseDataPtBR(valor: string) {
  if (!valor || valor === "-") return null;

  const somenteData = valor.split(",")[0].trim();

  const match = somenteData.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (!match) return null;

  const dia = Number(match[1]);
  const mes = Number(match[2]) - 1;
  const ano = Number(match[3]);

  const data = new Date(ano, mes, dia);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function dataHoraAtual() {
  return new Date().toLocaleString("pt-BR");
}

function criarEstatistica(): Estatistica {
  return {
    total: 0,
    concluidas: 0,
    naoIniciadas: 0,
    emAndamento: 0,
    canceladas: 0,
  };
}

function adicionarStatus(
  estatistica: Estatistica,
  status: string
) {
  estatistica.total += 1;

  const chave = statusParaChave(status);

  if (chave === "CONCLUIDA") {
    estatistica.concluidas += 1;
  } else if (chave === "NAO_INICIADA") {
    estatistica.naoIniciadas += 1;
  } else if (chave === "EM_ANDAMENTO") {
    estatistica.emAndamento += 1;
  } else if (chave === "CANCELADA") {
    estatistica.canceladas += 1;
  }
}

function criarMapaPorSetor(ordens: OSIndicadorExcel[]) {
  const mapa = new Map<string, Estatistica>();

  for (const os of ordens) {
    const nome = textoSeguro(os.setor);

    if (!mapa.has(nome)) {
      mapa.set(nome, criarEstatistica());
    }

    adicionarStatus(mapa.get(nome)!, os.status);
  }

  return Array.from(mapa.entries())
    .map(([nome, dados]) => ({
      nome,
      ...dados,
    }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.nome.localeCompare(b.nome, "pt-BR")
    );
}

function criarMapaPorMaquina(ordens: OSIndicadorExcel[]) {
  const mapa = new Map<string, Estatistica>();

  for (const os of ordens) {
    const nome = textoSeguro(os.maquina);

    if (nome === "-") continue;

    if (!mapa.has(nome)) {
      mapa.set(nome, criarEstatistica());
    }

    adicionarStatus(mapa.get(nome)!, os.status);
  }

  return Array.from(mapa.entries())
    .map(([nome, dados]) => ({
      nome,
      ...dados,
    }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.nome.localeCompare(b.nome, "pt-BR")
    );
}

function criarMapaPorColaborador(
  ordens: OSIndicadorExcel[]
) {
  const mapa = new Map<
    string,
    Estatistica & {
      tipo: string;
    }
  >();

  for (const os of ordens) {
    const responsaveis = separarResponsaveis(
      os.responsavel
    );

    for (const responsavel of responsaveis) {
      if (!mapa.has(responsavel)) {
        mapa.set(responsavel, {
          ...criarEstatistica(),
          tipo:
            responsavel === "Sem responsável"
              ? "Sem responsável"
              : ehServicoExterno(responsavel)
                ? "Serviço externo"
                : "Equipe interna",
        });
      }

      adicionarStatus(
        mapa.get(responsavel)!,
        os.status
      );
    }
  }

  return Array.from(mapa.entries())
    .map(([nome, dados]) => ({
      nome,
      ...dados,
    }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.nome.localeCompare(b.nome, "pt-BR")
    );
}

async function carregarLogoBase64() {
  try {
    const resposta = await fetch("/logo.sequoia.png");

    if (!resposta.ok) {
      return null;
    }

    const blob = await resposta.blob();

    return await new Promise<string | null>(
      (resolve) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          resolve(
            typeof reader.result === "string"
              ? reader.result
              : null
          );
        };

        reader.onerror = () => resolve(null);

        reader.readAsDataURL(blob);
      }
    );
  } catch {
    return null;
  }
}

function configurarPagina(
  worksheet: any,
  orientacao:
    | "portrait"
    | "landscape" = "landscape"
) {
  worksheet.pageSetup = {
    orientation: orientacao,
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.35,
      right: 0.35,
      top: 0.55,
      bottom: 0.55,
      header: 0.2,
      footer: 0.2,
    },
  };

  worksheet.headerFooter = {
    oddFooter:
      "&LSistema de OS - Sequoia&C&P de &N&RDesenvolvido por Pedro H. Laranjeira",
  };
}

function criarCabecalho(
  worksheet: any,
  titulo: string,
  subtitulo: string,
  ultimaColuna: string,
  imagemId?: number
) {
  worksheet.mergeCells(`C1:${ultimaColuna}2`);
  worksheet.mergeCells(`C3:${ultimaColuna}3`);

  for (let row = 1; row <= 3; row += 1) {
    worksheet.getRow(row).height =
      row === 3 ? 21 : 26;

    for (
      let col = 1;
      col <= worksheet.getColumn(ultimaColuna).number;
      col += 1
    ) {
      const cell = worksheet.getCell(row, col);

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: corArgb(CORES.navy),
        },
      };
    }
  }

  const tituloCell = worksheet.getCell("C1");

  tituloCell.value = titulo;
  tituloCell.font = {
    name: "Aptos Display",
    size: 22,
    bold: true,
    color: {
      argb: corArgb(CORES.white),
    },
  };

  tituloCell.alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  const subtituloCell = worksheet.getCell("C3");

  subtituloCell.value = subtitulo;
  subtituloCell.font = {
    name: "Aptos",
    size: 10,
    color: {
      argb: corArgb(CORES.slate300),
    },
  };

  subtituloCell.alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  if (imagemId !== undefined) {
    worksheet.addImage(imagemId, {
      tl: {
        col: 0.15,
        row: 0.3,
      },
      ext: {
        width: 125,
        height: 53,
      },
    });
  } else {
    worksheet.mergeCells("A1:B3");

    const marca = worksheet.getCell("A1");

    marca.value = "SEQ";
    marca.font = {
      bold: true,
      size: 22,
      color: {
        argb: corArgb(CORES.cyan),
      },
    };

    marca.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  }
}

function criarKpi(
  worksheet: any,
  tituloRange: string,
  valorRange: string,
  titulo: string,
  valor: string | number,
  cor: string
) {
  worksheet.mergeCells(tituloRange);
  worksheet.mergeCells(valorRange);

  const inicioTitulo =
    tituloRange.split(":")[0];

  const inicioValor =
    valorRange.split(":")[0];

  const tituloCell =
    worksheet.getCell(inicioTitulo);

  tituloCell.value = titulo;
  tituloCell.font = {
    bold: true,
    size: 10,
    color: {
      argb: corArgb(CORES.white),
    },
  };

  tituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: corArgb(cor),
    },
  };

  tituloCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  const valorCell =
    worksheet.getCell(inicioValor);

  valorCell.value = valor;
  valorCell.font = {
    bold: true,
    size: 24,
    color: {
      argb: corArgb(CORES.navy),
    },
  };

  valorCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: corArgb(CORES.white),
    },
  };

  valorCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  const rangeCompleto = worksheet.getRange
    ? worksheet.getRange(
        `${inicioTitulo}:${valorRange.split(":")[1]}`
      )
    : null;

  if (rangeCompleto) {
    rangeCompleto.eachCell((cell: any) => {
      cell.border = BORDA_PADRAO;
    });
  } else {
    const tituloRow =
      worksheet.getCell(inicioTitulo).row;

    const valorFinal =
      worksheet.getCell(
        valorRange.split(":")[1]
      );

    const valorRow = valorFinal.row;

    const colunaInicial =
      worksheet.getCell(inicioTitulo).col;

    const colunaFinal = valorFinal.col;

    for (
      let row = tituloRow;
      row <= valorRow;
      row += 1
    ) {
      for (
        let col = colunaInicial;
        col <= colunaFinal;
        col += 1
      ) {
        worksheet.getCell(row, col).border =
          BORDA_PADRAO;
      }
    }
  }
}

function estilizarTituloSecao(
  worksheet: any,
  range: string,
  titulo: string
) {
  worksheet.mergeCells(range);

  const cell = worksheet.getCell(
    range.split(":")[0]
  );

  cell.value = titulo;
  cell.font = {
    bold: true,
    size: 12,
    color: {
      argb: corArgb(CORES.white),
    },
  };

  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: corArgb(CORES.navy2),
    },
  };

  cell.alignment = {
    vertical: "middle",
    horizontal: "left",
  };
}

function estilizarCabecalhoTabela(
  worksheet: any,
  linha: number,
  inicio: number,
  fim: number
) {
  const row = worksheet.getRow(linha);

  row.height = 26;

  for (
    let col = inicio;
    col <= fim;
    col += 1
  ) {
    const cell = worksheet.getCell(linha, col);

    cell.font = {
      bold: true,
      color: {
        argb: corArgb(CORES.white),
      },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: corArgb(CORES.navy2),
      },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    cell.border = BORDA_PADRAO;
  }
}

function estilizarTabelaAnalise(
  worksheet: any,
  linhaInicial: number,
  linhaFinal: number,
  ultimaColuna: number
) {
  for (
    let row = linhaInicial;
    row <= linhaFinal;
    row += 1
  ) {
    worksheet.getRow(row).height = 22;

    for (
      let col = 1;
      col <= ultimaColuna;
      col += 1
    ) {
      const cell = worksheet.getCell(row, col);

      cell.border = BORDA_PADRAO;

      cell.alignment = {
        vertical: "middle",
        horizontal:
          col === 2 ? "left" : "center",
      };

      if (row % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: corArgb(CORES.slate50),
          },
        };
      }
    }
  }
}

export default function BotaoExcelIndicadoresOS({
  ordens,
  filtros,
}: {
  ordens: OSIndicadorExcel[];
  filtros: FiltrosIndicadores;
}) {
  const [gerando, setGerando] =
    useState(false);

  async function gerarExcel() {
    if (ordens.length === 0) {
      alert(
        "Nenhuma ordem de serviço encontrada para exportar."
      );
      return;
    }

    try {
      setGerando(true);

      const ExcelJS = await import("exceljs");

      const workbook = new ExcelJS.Workbook();

      workbook.creator =
        "Sistema de OS - Sequoia";

      workbook.lastModifiedBy =
        "Pedro H. Laranjeira";

      workbook.company = "Sequoia";

      workbook.title =
        "Indicadores de Ordens de Serviço";

      workbook.subject =
        "Relatório gerencial de manutenção";

      workbook.description =
        "Indicadores gerenciais de ordens de serviço gerados pelo Sistema de OS.";

      workbook.created = new Date();
      workbook.modified = new Date();

      workbook.calcProperties.fullCalcOnLoad =
        true;

      const logoBase64 =
        await carregarLogoBase64();

      let imagemId: number | undefined;

      if (logoBase64) {
        imagemId = workbook.addImage({
          base64: logoBase64,
          extension: "png",
        });
      }

      const totalOS = ordens.length;

      const totalConcluidas = ordens.filter(
        (os) =>
          statusParaChave(os.status) ===
          "CONCLUIDA"
      ).length;

      const totalNaoIniciadas =
        ordens.filter(
          (os) =>
            statusParaChave(os.status) ===
            "NAO_INICIADA"
        ).length;

      const totalEmAndamento =
        ordens.filter(
          (os) =>
            statusParaChave(os.status) ===
            "EM_ANDAMENTO"
        ).length;

      const totalCanceladas = ordens.filter(
        (os) =>
          statusParaChave(os.status) ===
          "CANCELADA"
      ).length;

      const totalPendentes =
        totalNaoIniciadas +
        totalEmAndamento;

      const totalExternas = ordens.filter(
        (os) =>
          ehServicoExterno(os.responsavel)
      ).length;

      const totalInternas = ordens.filter(
        (os) =>
          textoSeguro(os.responsavel) !==
            "-" &&
          !ehServicoExterno(os.responsavel)
      ).length;

      const taxaConclusao = percentual(
        totalConcluidas,
        totalOS
      );

      const setores =
        criarMapaPorSetor(ordens);

      const colaboradores =
        criarMapaPorColaborador(ordens);

      const maquinas =
        criarMapaPorMaquina(ordens);

      /*
      ============================================================
      DASHBOARD EXECUTIVO
      ============================================================
      */

      const dashboard =
        workbook.addWorksheet(
          "Dashboard Executivo",
          {
            properties: {
              tabColor: {
                argb: corArgb(CORES.cyan),
              },
            },
          }
        );

      dashboard.views = [
        {
          state: "normal",
          showGridLines: false,
        },
      ];

      dashboard.columns = [
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
      ];

      criarCabecalho(
        dashboard,
        "INDICADORES DE ORDENS DE SERVIÇO",
        "Dashboard executivo de manutenção • análise gerencial das OS",
        "L",
        imagemId
      );

      configurarPagina(
        dashboard,
        "landscape"
      );

      estilizarTituloSecao(
        dashboard,
        "A5:L5",
        "FILTROS APLICADOS AO RELATÓRIO"
      );

      const filtrosDashboard = [
        {
          label1: "Data inicial",
          valor1:
            filtros.dataInicio || "Todas",
          label2: "Data final",
          valor2:
            filtros.dataFim || "Todas",
          label3: "Empresa",
          valor3:
            filtros.empresa || "Todas",
        },
        {
          label1: "Status",
          valor1:
            filtros.status || "Todos",
          label2: "Setor",
          valor2:
            filtros.setor || "Todos",
          label3: "Máquina",
          valor3:
            filtros.maquina || "Todas",
        },
        {
          label1: "Colaborador",
          valor1:
            filtros.colaborador || "Todos",
          label2: "Prioridade",
          valor2:
            filtros.prioridade || "Todas",
          label3: "Gerado em",
          valor3: dataHoraAtual(),
        },
      ];

      filtrosDashboard.forEach(
        (linha, indice) => {
          const row = 6 + indice;

          const grupos = [
            {
              label: linha.label1,
              value: linha.valor1,
              inicioLabel: "A",
              fimLabel: "B",
              inicioValue: "C",
              fimValue: "D",
            },
            {
              label: linha.label2,
              value: linha.valor2,
              inicioLabel: "E",
              fimLabel: "F",
              inicioValue: "G",
              fimValue: "H",
            },
            {
              label: linha.label3,
              value: linha.valor3,
              inicioLabel: "I",
              fimLabel: "J",
              inicioValue: "K",
              fimValue: "L",
            },
          ];

          grupos.forEach((grupo) => {
            dashboard.mergeCells(
              `${grupo.inicioLabel}${row}:${grupo.fimLabel}${row}`
            );

            dashboard.mergeCells(
              `${grupo.inicioValue}${row}:${grupo.fimValue}${row}`
            );

            const labelCell =
              dashboard.getCell(
                `${grupo.inicioLabel}${row}`
              );

            const valueCell =
              dashboard.getCell(
                `${grupo.inicioValue}${row}`
              );

            labelCell.value = grupo.label;

            labelCell.font = {
              bold: true,
              color: {
                argb: corArgb(
                  CORES.slate700
                ),
              },
            };

            labelCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: corArgb(
                  CORES.slate100
                ),
              },
            };

            valueCell.value = grupo.value;

            valueCell.font = {
              bold: true,
              color: {
                argb: corArgb(CORES.navy),
              },
            };

            valueCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: corArgb(CORES.white),
              },
            };

            [
              labelCell,
              valueCell,
            ].forEach((cell) => {
              cell.border =
                BORDA_PADRAO;

              cell.alignment = {
                vertical: "middle",
                horizontal: "left",
              };
            });
          });

          dashboard.getRow(row).height = 24;
        }
      );

      criarKpi(
        dashboard,
        "A11:C11",
        "A12:C14",
        "TOTAL DE OS",
        totalOS,
        CORES.cyan
      );

      criarKpi(
        dashboard,
        "D11:F11",
        "D12:F14",
        "CONCLUÍDAS",
        totalConcluidas,
        CORES.green
      );

      criarKpi(
        dashboard,
        "G11:I11",
        "G12:I14",
        "PENDENTES",
        totalPendentes,
        CORES.orange
      );

      criarKpi(
        dashboard,
        "J11:L11",
        "J12:L14",
        "CANCELADAS",
        totalCanceladas,
        CORES.slate500
      );

      criarKpi(
        dashboard,
        "A17:D17",
        "A18:D20",
        "TAXA DE CONCLUSÃO",
        `${(
          taxaConclusao * 100
        ).toFixed(1)}%`,
        CORES.green
      );

      criarKpi(
        dashboard,
        "E17:H17",
        "E18:H20",
        "EQUIPE INTERNA",
        totalInternas,
        CORES.blue
      );

      criarKpi(
        dashboard,
        "I17:L17",
        "I18:L20",
        "SERVIÇOS EXTERNOS",
        totalExternas,
        CORES.purple
      );

      estilizarTituloSecao(
        dashboard,
        "A23:F23",
        "DISTRIBUIÇÃO POR STATUS"
      );

      dashboard.getRow(24).values = [
        "Status",
        "Quantidade",
        "%",
        "Representação",
      ];

      dashboard.mergeCells("D24:F24");

      ["A24", "B24", "C24", "D24"].forEach(
        (endereco) => {
          const cell =
            dashboard.getCell(endereco);

          cell.font = {
            bold: true,
            color: {
              argb: corArgb(CORES.white),
            },
          };

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: corArgb(CORES.navy2),
            },
          };

          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
          };

          cell.border = BORDA_PADRAO;
        }
      );

      const statusDashboard = [
        {
          nome: "Concluídas",
          valor: totalConcluidas,
          cor: CORES.green,
        },
        {
          nome: "Em andamento",
          valor: totalEmAndamento,
          cor: CORES.blue,
        },
        {
          nome: "Não iniciadas",
          valor: totalNaoIniciadas,
          cor: CORES.orange,
        },
        {
          nome: "Canceladas",
          valor: totalCanceladas,
          cor: CORES.slate500,
        },
      ];

      statusDashboard.forEach(
        (item, indice) => {
          const row = 25 + indice;

          const pct = percentual(
            item.valor,
            totalOS
          );

          dashboard.mergeCells(
            `D${row}:F${row}`
          );

          dashboard.getCell(
            `A${row}`
          ).value = item.nome;

          dashboard.getCell(
            `B${row}`
          ).value = item.valor;

          dashboard.getCell(
            `C${row}`
          ).value = pct;

          dashboard.getCell(
            `C${row}`
          ).numFmt = "0.0%";

          dashboard.getCell(
            `D${row}`
          ).value =
            `${barraProgresso(
              pct,
              15
            )} ${(pct * 100).toFixed(1)}%`;

          for (
            let col = 1;
            col <= 6;
            col += 1
          ) {
            const cell =
              dashboard.getCell(row, col);

            cell.border =
              BORDA_PADRAO;

            cell.alignment = {
              vertical: "middle",
              horizontal:
                col === 1 ? "left" : "center",
            };

            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: corArgb(
                  indice % 2 === 0
                    ? CORES.white
                    : CORES.slate50
                ),
              },
            };
          }

          dashboard.getCell(
            `A${row}`
          ).font = {
            bold: true,
            color: {
              argb: corArgb(item.cor),
            },
          };

          dashboard.getCell(
            `D${row}`
          ).font = {
            name: "Consolas",
            bold: true,
            color: {
              argb: corArgb(item.cor),
            },
          };

          dashboard.getRow(row).height = 23;
        }
      );

      estilizarTituloSecao(
        dashboard,
        "H23:L23",
        "TOP 5 SETORES POR VOLUME DE OS"
      );

      [
        "#",
        "Setor",
        "Total",
        "Concl.",
        "Eficiência",
      ].forEach((titulo, indice) => {
        const cell =
          dashboard.getCell(
            24,
            8 + indice
          );

        cell.value = titulo;

        cell.font = {
          bold: true,
          color: {
            argb: corArgb(CORES.white),
          },
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: corArgb(CORES.navy2),
          },
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        cell.border = BORDA_PADRAO;
      });

      setores
        .slice(0, 5)
        .forEach((setor, indice) => {
          const row = 25 + indice;

          const eficiencia = percentual(
            setor.concluidas,
            setor.total
          );

          const valores = [
            indice + 1,
            setor.nome,
            setor.total,
            setor.concluidas,
            eficiencia,
          ];

          valores.forEach(
            (valor, colIndex) => {
              const cell =
                dashboard.getCell(
                  row,
                  8 + colIndex
                );

              cell.value = valor;

              cell.border =
                BORDA_PADRAO;

              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                  argb: corArgb(
                    indice % 2 === 0
                      ? CORES.white
                      : CORES.slate50
                  ),
                },
              };

              cell.alignment = {
                vertical: "middle",
                horizontal:
                  colIndex === 1
                    ? "left"
                    : "center",
              };
            }
          );

          dashboard.getCell(
            row,
            12
          ).numFmt = "0.0%";

          dashboard.getCell(
            row,
            12
          ).font = {
            bold: true,
            color: {
              argb: corArgb(
                eficiencia >= 0.7
                  ? CORES.green
                  : eficiencia >= 0.4
                    ? CORES.orange
                    : CORES.red
              ),
            },
          };
        });

      estilizarTituloSecao(
        dashboard,
        "H32:L32",
        "TOP 5 RESPONSÁVEIS POR VOLUME"
      );

      [
        "#",
        "Responsável",
        "Tipo",
        "Total",
        "Eficiência",
      ].forEach((titulo, indice) => {
        const cell =
          dashboard.getCell(
            33,
            8 + indice
          );

        cell.value = titulo;

        cell.font = {
          bold: true,
          color: {
            argb: corArgb(CORES.white),
          },
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: corArgb(CORES.navy2),
          },
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };

        cell.border = BORDA_PADRAO;
      });

      colaboradores
        .filter(
          (item) =>
            item.nome !== "Sem responsável"
        )
        .slice(0, 5)
        .forEach(
          (colaborador, indice) => {
            const row = 34 + indice;

            const eficiencia = percentual(
              colaborador.concluidas,
              colaborador.total
            );

            const valores = [
              indice + 1,
              colaborador.nome,
              colaborador.tipo,
              colaborador.total,
              eficiencia,
            ];

            valores.forEach(
              (valor, colIndex) => {
                const cell =
                  dashboard.getCell(
                    row,
                    8 + colIndex
                  );

                cell.value = valor;
                cell.border =
                  BORDA_PADRAO;

                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: {
                    argb: corArgb(
                      indice % 2 === 0
                        ? CORES.white
                        : CORES.slate50
                    ),
                  },
                };

                cell.alignment = {
                  vertical: "middle",
                  horizontal:
                    colIndex === 1 ||
                    colIndex === 2
                      ? "left"
                      : "center",
                };
              }
            );

            dashboard.getCell(
              row,
              12
            ).numFmt = "0.0%";

            const tipoCell =
              dashboard.getCell(
                row,
                10
              );

            tipoCell.font = {
              bold: true,
              color: {
                argb: corArgb(
                  colaborador.tipo ===
                    "Serviço externo"
                    ? CORES.purple
                    : CORES.blue
                ),
              },
            };
          }
        );

      estilizarTituloSecao(
        dashboard,
        "A32:F32",
        "INTERNO X SERVIÇO EXTERNO"
      );

      const dadosTipoServico = [
        {
          nome: "Equipe interna",
          total: totalInternas,
          cor: CORES.blue,
        },
        {
          nome: "Serviço externo",
          total: totalExternas,
          cor: CORES.purple,
        },
        {
          nome: "Sem responsável",
          total: ordens.filter(
            (os) =>
              textoSeguro(
                os.responsavel
              ) === "-"
          ).length,
          cor: CORES.slate500,
        },
      ];

      dashboard.getCell("A33").value =
        "Classificação";

      dashboard.getCell("B33").value =
        "Quantidade";

      dashboard.getCell("C33").value = "%";

      dashboard.mergeCells("D33:F33");

      dashboard.getCell("D33").value =
        "Representação";

      ["A33", "B33", "C33", "D33"].forEach(
        (endereco) => {
          const cell =
            dashboard.getCell(endereco);

          cell.font = {
            bold: true,
            color: {
              argb: corArgb(CORES.white),
            },
          };

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: corArgb(CORES.navy2),
            },
          };

          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
          };

          cell.border = BORDA_PADRAO;
        }
      );

      dadosTipoServico.forEach(
        (item, indice) => {
          const row = 34 + indice;

          const pct = percentual(
            item.total,
            totalOS
          );

          dashboard.mergeCells(
            `D${row}:F${row}`
          );

          dashboard.getCell(
            `A${row}`
          ).value = item.nome;

          dashboard.getCell(
            `B${row}`
          ).value = item.total;

          dashboard.getCell(
            `C${row}`
          ).value = pct;

          dashboard.getCell(
            `C${row}`
          ).numFmt = "0.0%";

          dashboard.getCell(
            `D${row}`
          ).value =
            `${barraProgresso(
              pct,
              15
            )} ${(pct * 100).toFixed(1)}%`;

          for (
            let col = 1;
            col <= 6;
            col += 1
          ) {
            const cell =
              dashboard.getCell(row, col);

            cell.border =
              BORDA_PADRAO;

            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: corArgb(
                  indice % 2 === 0
                    ? CORES.white
                    : CORES.slate50
                ),
              },
            };

            cell.alignment = {
              vertical: "middle",
              horizontal:
                col === 1
                  ? "left"
                  : "center",
            };
          }

          dashboard.getCell(
            `A${row}`
          ).font = {
            bold: true,
            color: {
              argb: corArgb(item.cor),
            },
          };

          dashboard.getCell(
            `D${row}`
          ).font = {
            name: "Consolas",
            bold: true,
            color: {
              argb: corArgb(item.cor),
            },
          };
        }
      );

      dashboard.mergeCells("A41:L41");

      const rodapeDashboard =
        dashboard.getCell("A41");

      rodapeDashboard.value =
        "Relatório gerencial gerado automaticamente pelo Sistema de OS • Sequoia";

      rodapeDashboard.font = {
        italic: true,
        size: 9,
        color: {
          argb: corArgb(CORES.slate500),
        },
      };

      rodapeDashboard.alignment = {
        horizontal: "center",
      };

      /*
      ============================================================
      BASE DE ORDENS DE SERVIÇO
      ============================================================
      */

      const base =
        workbook.addWorksheet(
          "Ordens de Serviço",
          {
            properties: {
              tabColor: {
                argb: corArgb(CORES.green),
              },
            },
          }
        );

      criarCabecalho(
        base,
        "BASE DE ORDENS DE SERVIÇO",
        "Base completa das OS consideradas neste relatório",
        "L",
        imagemId
      );

      configurarPagina(
        base,
        "landscape"
      );

      base.mergeCells("A5:L5");

      const avisoBase =
        base.getCell("A5");

      avisoBase.value =
        `Total de registros exportados: ${totalOS} • Gerado em ${dataHoraAtual()}`;

      avisoBase.font = {
        bold: true,
        color: {
          argb: corArgb(CORES.navy),
        },
      };

      avisoBase.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: corArgb(CORES.cyanLight),
        },
      };

      avisoBase.alignment = {
        vertical: "middle",
        horizontal: "left",
      };

      base.getRow(5).height = 24;

      const dadosBase =
        ordens.map((os) => {
          const empresaLinha =
            textoSeguro(os.empresa) !== "-"
              ? textoSeguro(os.empresa)
              : filtros.empresa &&
                  filtros.empresa !== "Todas"
                ? filtros.empresa
                : "-";

          return [
            os.numero,
            empresaLinha,
            textoSeguro(os.setor),
            textoSeguro(os.maquina),
            textoSeguro(os.titulo),
            textoSeguro(os.descricao),
            textoSeguro(os.prioridade),
            textoSeguro(os.status),
            parseDataPtBR(os.geradaEm) ??
              os.geradaEm,
            parseDataPtBR(os.concluidaEm) ??
              os.concluidaEm,
            textoSeguro(os.responsavel),
            tipoServico(os.responsavel),
          ];
        });

      base.addTable({
        name: "TabelaOrdensServico",
        ref: "A7",
        headerRow: true,
        totalsRow: false,
        style: {
          theme: "TableStyleMedium2",
          showRowStripes: true,
          showFirstColumn: false,
          showLastColumn: false,
        },
        columns: [
          { name: "Nº da OS" },
          { name: "Empresa" },
          { name: "Setor" },
          {
            name: "Máquina/equipamento",
          },
          { name: "Título" },
          { name: "Descrição" },
          { name: "Prioridade" },
          { name: "Status" },
          { name: "Gerada em" },
          { name: "Concluída em" },
          { name: "Responsável" },
          { name: "Tipo de serviço" },
        ],
        rows: dadosBase,
      });

      base.views = [
        {
          state: "frozen",
          ySplit: 7,
          xSplit: 1,
          showGridLines: false,
        },
      ];

      base.getColumn(1).width = 12;
      base.getColumn(2).width = 22;
      base.getColumn(3).width = 25;
      base.getColumn(4).width = 28;
      base.getColumn(5).width = 38;
      base.getColumn(6).width = 65;
      base.getColumn(7).width = 16;
      base.getColumn(8).width = 18;
      base.getColumn(9).width = 16;
      base.getColumn(10).width = 16;
      base.getColumn(11).width = 34;
      base.getColumn(12).width = 20;

      base.getColumn(9).numFmt =
        "dd/mm/yyyy";

      base.getColumn(10).numFmt =
        "dd/mm/yyyy";

      estilizarCabecalhoTabela(
        base,
        7,
        1,
        12
      );

      for (
        let row = 8;
        row <= 7 + dadosBase.length;
        row += 1
      ) {
        base.getRow(row).height = 34;

        for (
          let col = 1;
          col <= 12;
          col += 1
        ) {
          const cell =
            base.getCell(row, col);

          cell.border = BORDA_PADRAO;

          cell.alignment = {
            vertical: "top",
            horizontal:
              col === 1 ||
              col === 7 ||
              col === 8 ||
              col === 9 ||
              col === 10 ||
              col === 12
                ? "center"
                : "left",
            wrapText: true,
          };
        }

        const statusCell =
          base.getCell(row, 8);

        const corDoStatus =
          corStatus(
            String(statusCell.value ?? "")
          );

        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: corArgb(
              corDoStatus.fundo
            ),
          },
        };

        statusCell.font = {
          bold: true,
          color: {
            argb: corArgb(
              corDoStatus.texto
            ),
          },
        };

        const prioridadeCell =
          base.getCell(row, 7);

        const corDaPrioridade =
          corPrioridade(
            String(
              prioridadeCell.value ?? ""
            )
          );

        prioridadeCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: corArgb(
              corDaPrioridade.fundo
            ),
          },
        };

        prioridadeCell.font = {
          bold: true,
          color: {
            argb: corArgb(
              corDaPrioridade.texto
            ),
          },
        };

        const tipoCell =
          base.getCell(row, 12);

        const externo =
          String(tipoCell.value) ===
          "Serviço externo";

        tipoCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: corArgb(
              externo
                ? CORES.purpleLight
                : String(tipoCell.value) ===
                    "Equipe interna"
                  ? CORES.blueLight
                  : CORES.slate100
            ),
          },
        };

        tipoCell.font = {
          bold: true,
          color: {
            argb: corArgb(
              externo
                ? CORES.purple
                : String(tipoCell.value) ===
                    "Equipe interna"
                  ? CORES.blue
                  : CORES.slate500
            ),
          },
        };
      }

      /*
      ============================================================
      ANÁLISE POR SETOR
      ============================================================
      */

      const setorSheet =
        workbook.addWorksheet(
          "Análise por Setor",
          {
            properties: {
              tabColor: {
                argb: corArgb(CORES.blue),
              },
            },
          }
        );

      criarCabecalho(
        setorSheet,
        "ANÁLISE POR SETOR",
        "Volume, backlog e eficiência das ordens de serviço por área",
        "I",
        imagemId
      );

      configurarPagina(
        setorSheet,
        "landscape"
      );

      const linhasSetores =
        setores.map((setor, indice) => {
          const eficiencia = percentual(
            setor.concluidas,
            setor.total
          );

          return [
            indice + 1,
            setor.nome,
            setor.total,
            setor.concluidas,
            setor.naoIniciadas,
            setor.emAndamento,
            setor.canceladas,
            eficiencia,
            `${barraProgresso(
              eficiencia,
              16
            )} ${(eficiencia * 100).toFixed(
              1
            )}%`,
          ];
        });

      setorSheet.addTable({
        name: "TabelaSetores",
        ref: "A6",
        headerRow: true,
        totalsRow: false,
        style: {
          theme: "TableStyleMedium2",
          showRowStripes: true,
        },
        columns: [
          { name: "Ranking" },
          { name: "Setor" },
          { name: "Total OS" },
          { name: "Concluídas" },
          { name: "Não iniciadas" },
          { name: "Em andamento" },
          { name: "Canceladas" },
          { name: "Eficiência" },
          { name: "Indicador" },
        ],
        rows: linhasSetores,
      });

      setorSheet.views = [
        {
          state: "frozen",
          ySplit: 6,
          xSplit: 2,
          showGridLines: false,
        },
      ];

      setorSheet.getColumn(1).width = 10;
      setorSheet.getColumn(2).width = 32;
      setorSheet.getColumn(3).width = 13;
      setorSheet.getColumn(4).width = 13;
      setorSheet.getColumn(5).width = 16;
      setorSheet.getColumn(6).width = 16;
      setorSheet.getColumn(7).width = 13;
      setorSheet.getColumn(8).width = 14;
      setorSheet.getColumn(9).width = 32;

      setorSheet.getColumn(8).numFmt =
        "0.0%";

      estilizarCabecalhoTabela(
        setorSheet,
        6,
        1,
        9
      );

      estilizarTabelaAnalise(
        setorSheet,
        7,
        6 + linhasSetores.length,
        9
      );

      for (
        let row = 7;
        row <= 6 + linhasSetores.length;
        row += 1
      ) {
        const eficiencia = Number(
          setorSheet.getCell(row, 8).value ??
            0
        );

        setorSheet.getCell(
          row,
          8
        ).font = {
          bold: true,
          color: {
            argb: corArgb(
              eficiencia >= 0.7
                ? CORES.green
                : eficiencia >= 0.4
                  ? CORES.orange
                  : CORES.red
            ),
          },
        };

        setorSheet.getCell(
          row,
          9
        ).font = {
          name: "Consolas",
          bold: true,
          color: {
            argb: corArgb(CORES.cyan),
          },
        };
      }

      /*
      ============================================================
      ANÁLISE POR COLABORADOR
      ============================================================
      */

      const colaboradorSheet =
        workbook.addWorksheet(
          "Análise Colaboradores",
          {
            properties: {
              tabColor: {
                argb: corArgb(
                  CORES.purple
                ),
              },
            },
          }
        );

      criarCabecalho(
        colaboradorSheet,
        "ANÁLISE POR RESPONSÁVEL",
        "Distribuição de OS, eficiência e identificação de serviços externos",
        "I",
        imagemId
      );

      configurarPagina(
        colaboradorSheet,
        "landscape"
      );

      const linhasColaboradores =
        colaboradores.map(
          (colaborador, indice) => {
            const pendentes =
              colaborador.naoIniciadas +
              colaborador.emAndamento;

            const eficiencia = percentual(
              colaborador.concluidas,
              colaborador.total
            );

            return [
              indice + 1,
              colaborador.nome,
              colaborador.tipo,
              colaborador.total,
              colaborador.concluidas,
              pendentes,
              colaborador.canceladas,
              eficiencia,
              `${barraProgresso(
                eficiencia,
                16
              )} ${(eficiencia * 100).toFixed(
                1
              )}%`,
            ];
          }
        );

      colaboradorSheet.addTable({
        name: "TabelaColaboradores",
        ref: "A6",
        headerRow: true,
        totalsRow: false,
        style: {
          theme: "TableStyleMedium4",
          showRowStripes: true,
        },
        columns: [
          { name: "Ranking" },
          { name: "Responsável" },
          { name: "Tipo" },
          { name: "Total atribuídas" },
          { name: "Concluídas" },
          { name: "Pendentes" },
          { name: "Canceladas" },
          { name: "Eficiência" },
          { name: "Indicador" },
        ],
        rows: linhasColaboradores,
      });

      colaboradorSheet.views = [
        {
          state: "frozen",
          ySplit: 6,
          xSplit: 2,
          showGridLines: false,
        },
      ];

      colaboradorSheet.getColumn(1).width =
        10;

      colaboradorSheet.getColumn(2).width =
        32;

      colaboradorSheet.getColumn(3).width =
        22;

      colaboradorSheet.getColumn(4).width =
        18;

      colaboradorSheet.getColumn(5).width =
        14;

      colaboradorSheet.getColumn(6).width =
        14;

      colaboradorSheet.getColumn(7).width =
        14;

      colaboradorSheet.getColumn(8).width =
        14;

      colaboradorSheet.getColumn(9).width =
        32;

      colaboradorSheet.getColumn(
        8
      ).numFmt = "0.0%";

      estilizarCabecalhoTabela(
        colaboradorSheet,
        6,
        1,
        9
      );

      estilizarTabelaAnalise(
        colaboradorSheet,
        7,
        6 + linhasColaboradores.length,
        9
      );

      for (
        let row = 7;
        row <=
        6 + linhasColaboradores.length;
        row += 1
      ) {
        const tipoCell =
          colaboradorSheet.getCell(row, 3);

        const tipo =
          String(tipoCell.value ?? "");

        tipoCell.font = {
          bold: true,
          color: {
            argb: corArgb(
              tipo === "Serviço externo"
                ? CORES.purple
                : tipo === "Equipe interna"
                  ? CORES.blue
                  : CORES.slate500
            ),
          },
        };

        tipoCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: corArgb(
              tipo === "Serviço externo"
                ? CORES.purpleLight
                : tipo === "Equipe interna"
                  ? CORES.blueLight
                  : CORES.slate100
            ),
          },
        };

        colaboradorSheet.getCell(
          row,
          9
        ).font = {
          name: "Consolas",
          bold: true,
          color: {
            argb: corArgb(CORES.cyan),
          },
        };
      }

      /*
      ============================================================
      ANÁLISE POR MÁQUINA
      ============================================================
      */

      if (maquinas.length > 0) {
        const maquinaSheet =
          workbook.addWorksheet(
            "Análise por Máquina",
            {
              properties: {
                tabColor: {
                  argb: corArgb(
                    CORES.orange
                  ),
                },
              },
            }
          );

        criarCabecalho(
          maquinaSheet,
          "ANÁLISE POR MÁQUINA / EQUIPAMENTO",
          "Equipamentos com maior incidência de ordens de serviço",
          "I",
          imagemId
        );

        configurarPagina(
          maquinaSheet,
          "landscape"
        );

        const linhasMaquinas =
          maquinas.map(
            (maquina, indice) => {
              const eficiencia =
                percentual(
                  maquina.concluidas,
                  maquina.total
                );

              return [
                indice + 1,
                maquina.nome,
                maquina.total,
                maquina.concluidas,
                maquina.naoIniciadas,
                maquina.emAndamento,
                maquina.canceladas,
                eficiencia,
                `${barraProgresso(
                  eficiencia,
                  16
                )} ${(eficiencia * 100).toFixed(
                  1
                )}%`,
              ];
            }
          );

        maquinaSheet.addTable({
          name: "TabelaMaquinas",
          ref: "A6",
          headerRow: true,
          totalsRow: false,
          style: {
            theme: "TableStyleMedium9",
            showRowStripes: true,
          },
          columns: [
            { name: "Ranking" },
            {
              name: "Máquina/equipamento",
            },
            { name: "Total OS" },
            { name: "Concluídas" },
            { name: "Não iniciadas" },
            { name: "Em andamento" },
            { name: "Canceladas" },
            { name: "Eficiência" },
            { name: "Indicador" },
          ],
          rows: linhasMaquinas,
        });

        maquinaSheet.views = [
          {
            state: "frozen",
            ySplit: 6,
            xSplit: 2,
            showGridLines: false,
          },
        ];

        maquinaSheet.getColumn(1).width =
          10;

        maquinaSheet.getColumn(2).width =
          38;

        maquinaSheet.getColumn(3).width =
          13;

        maquinaSheet.getColumn(4).width =
          13;

        maquinaSheet.getColumn(5).width =
          16;

        maquinaSheet.getColumn(6).width =
          16;

        maquinaSheet.getColumn(7).width =
          13;

        maquinaSheet.getColumn(8).width =
          14;

        maquinaSheet.getColumn(9).width =
          32;

        maquinaSheet.getColumn(
          8
        ).numFmt = "0.0%";

        estilizarCabecalhoTabela(
          maquinaSheet,
          6,
          1,
          9
        );

        estilizarTabelaAnalise(
          maquinaSheet,
          7,
          6 + linhasMaquinas.length,
          9
        );

        for (
          let row = 7;
          row <= 6 + linhasMaquinas.length;
          row += 1
        ) {
          maquinaSheet.getCell(
            row,
            9
          ).font = {
            name: "Consolas",
            bold: true,
            color: {
              argb: corArgb(
                CORES.orange
              ),
            },
          };
        }
      }

      /*
      ============================================================
      METADADOS / INFORMAÇÕES DO RELATÓRIO
      ============================================================
      */

      const info =
        workbook.addWorksheet(
          "Informações",
          {
            properties: {
              tabColor: {
                argb: corArgb(
                  CORES.slate500
                ),
              },
            },
          }
        );

      info.views = [
        {
          state: "normal",
          showGridLines: false,
        },
      ];

      criarCabecalho(
        info,
        "INFORMAÇÕES DO RELATÓRIO",
        "Dados de geração e critérios utilizados",
        "F",
        imagemId
      );

      configurarPagina(
        info,
        "portrait"
      );

      info.columns = [
        { width: 25 },
        { width: 55 },
        { width: 5 },
        { width: 25 },
        { width: 35 },
        { width: 15 },
      ];

      const informacoes = [
        [
          "Sistema",
          "Sistema de OS - Sequoia",
        ],
        [
          "Relatório",
          "Indicadores de Ordens de Serviço",
        ],
        [
          "Gerado em",
          dataHoraAtual(),
        ],
        [
          "Quantidade de OS",
          totalOS,
        ],
        [
          "Data inicial",
          filtros.dataInicio || "Todas",
        ],
        [
          "Data final",
          filtros.dataFim || "Todas",
        ],
        [
          "Empresa",
          filtros.empresa || "Todas",
        ],
        [
          "Setor",
          filtros.setor || "Todos",
        ],
        [
          "Máquina",
          filtros.maquina || "Todas",
        ],
        [
          "Status",
          filtros.status || "Todos",
        ],
        [
          "Colaborador",
          filtros.colaborador || "Todos",
        ],
        [
          "Prioridade",
          filtros.prioridade || "Todas",
        ],
        [
          "Serviço externo",
          "EMPREITEIRA e Zeze serralheiro",
        ],
        [
          "Desenvolvido por",
          "Pedro H. Laranjeira",
        ],
      ];

      estilizarTituloSecao(
        info,
        "A6:F6",
        "DADOS DE GERAÇÃO"
      );

      informacoes.forEach(
        ([label, value], indice) => {
          const row = 7 + indice;

          info.mergeCells(
            `A${row}:B${row}`
          );

          info.mergeCells(
            `C${row}:F${row}`
          );

          const labelCell =
            info.getCell(`A${row}`);

          const valueCell =
            info.getCell(`C${row}`);

          labelCell.value = label;
          valueCell.value = value;

          labelCell.font = {
            bold: true,
            color: {
              argb: corArgb(
                CORES.slate700
              ),
            },
          };

          labelCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: corArgb(
                CORES.slate100
              ),
            },
          };

          valueCell.font = {
            color: {
              argb: corArgb(CORES.navy),
            },
          };

          valueCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: corArgb(CORES.white),
            },
          };

          [
            labelCell,
            valueCell,
          ].forEach((cell) => {
            cell.border =
              BORDA_PADRAO;

            cell.alignment = {
              vertical: "middle",
              horizontal: "left",
              wrapText: true,
            };
          });

          info.getRow(row).height = 24;
        }
      );

      /*
      ============================================================
      DOWNLOAD
      ============================================================
      */

      const buffer =
        await workbook.xlsx.writeBuffer();

      const blob = new Blob(
        [buffer as BlobPart],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      const dataArquivo = new Date()
        .toISOString()
        .slice(0, 10);

      link.download =
        `indicadores-os-profissional-${dataArquivo}.xlsx`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Erro ao gerar Excel:",
        error
      );

      alert(
        "Não foi possível gerar o Excel. Verifique o console para mais detalhes."
      );
    } finally {
      setGerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={gerarExcel}
      disabled={gerando}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/20 px-4 text-sm font-black text-emerald-200 transition hover:bg-emerald-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {gerando ? (
        <>
          <Loader2
            size={18}
            className="animate-spin"
          />
          Gerando Excel...
        </>
      ) : (
        <>
          <FileSpreadsheet size={18} />
          Gerar Excel
        </>
      )}
    </button>
  );
}