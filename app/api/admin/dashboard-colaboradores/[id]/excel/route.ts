import fs from "fs";
import path from "path";

import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import {
  fimDoDia,
  formatarData,
  formatarDuracaoMinutos,
  obterDuracaoKpiMinutos,
  prioridadeOsLabel,
  statusOsLabel,
  statusPreventivaLabel,
} from "@/src/lib/kpiColaborador";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

const CORES = {
  navy: "050816",
  painel: "0F172A",
  painel2: "111827",
  cyan: "06B6D4",
  cyanClaro: "CFFAFE",
  verde: "10B981",
  verdeClaro: "D1FAE5",
  laranja: "F97316",
  laranjaClaro: "FFEDD5",
  vermelho: "EF4444",
  vermelhoClaro: "FEE2E2",
  violeta: "8B5CF6",
  violetaClaro: "EDE9FE",
  branco: "FFFFFF",
  slate50: "F8FAFC",
  slate100: "F1F5F9",
  slate200: "E2E8F0",
  slate400: "94A3B8",
  slate500: "64748B",
  slate700: "334155",
  slate900: "0F172A",
};

function borda(
  cor = CORES.slate200
) {
  return {
    top: {
      style:
        "thin" as const,
      color: {
        argb: cor,
      },
    },
    left: {
      style:
        "thin" as const,
      color: {
        argb: cor,
      },
    },
    bottom: {
      style:
        "thin" as const,
      color: {
        argb: cor,
      },
    },
    right: {
      style:
        "thin" as const,
      color: {
        argb: cor,
      },
    },
  };
}

export async function GET(
  _req: Request,
  {
    params,
  }: RouteProps
) {
  const { id } =
    await params;

  const colaborador =
    await prisma.user.findFirst({
      where: {
        id,
        ativo: true,

        ordensResponsavel: {
          some: {},
        },
      },

      include: {
        setor: true,
        funcao: true,

        ordensResponsavel: {
          include: {
            os: {
              include: {
                setor: true,
                maquina: true,
              },
            },
          },
        },

        execucoesPreventivasResponsavel:
          {
            include: {
              execucao: {
                include: {
                  plano: {
                    include: {
                      setor: true,
                      maquina: true,
                    },
                  },
                },
              },
            },
          },
      },
    });

  if (!colaborador) {
    return NextResponse.json(
      {
        error:
          "Colaborador não encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  const ordens =
    colaborador.ordensResponsavel.map(
      (item) => item.os
    );

  const preventivas =
    colaborador.execucoesPreventivasResponsavel.map(
      (item) => item.execucao
    );

  const agora = new Date();

  const validas =
    ordens.filter(
      (os) =>
        os.status !==
        "CANCELADA"
    );

  const concluidas =
    ordens.filter(
      (os) =>
        os.status ===
        "CONCLUIDA"
    );

  const abertas =
    ordens.filter(
      (os) =>
        os.status ===
          "NAO_INICIADA" ||
        os.status ===
          "EM_ANDAMENTO"
    );

  const atrasadas =
    ordens.filter(
      (os) =>
        os.status !==
          "CONCLUIDA" &&
        os.status !==
          "CANCELADA" &&
        os.dataPrevista &&
        fimDoDia(
          os.dataPrevista
        ) <
          agora
    );

  const eficiencia =
    validas.length > 0
      ? Math.round(
          (concluidas.length /
            validas.length) *
            100
        )
      : 0;

  const concluidasComPrazo =
    concluidas.filter(
      (os) =>
        os.dataPrevista &&
        os.dataConclusao
    );

  const concluidasNoPrazo =
    concluidasComPrazo.filter(
      (os) =>
        os.dataPrevista &&
        os.dataConclusao &&
        new Date(
          os.dataConclusao
        ) <=
          fimDoDia(
            os.dataPrevista
          )
    );

  const prazo =
    concluidasComPrazo.length >
    0
      ? Math.round(
          (concluidasNoPrazo.length /
            concluidasComPrazo.length) *
            100
        )
      : null;

  const duracoes =
    concluidas
      .map((os) =>
        obterDuracaoKpiMinutos(
          os
        )
      )
      .filter(
        (
          valor
        ): valor is number =>
          typeof valor ===
            "number" &&
          valor > 0
      );

  const mttr =
    duracoes.length > 0
      ? Math.round(
          duracoes.reduce(
            (
              soma,
              valor
            ) =>
              soma +
              valor,
            0
          ) /
            duracoes.length
        )
      : 0;

  const preventivasAbertas =
    preventivas.filter(
      (item) =>
        item.status ===
          "PROGRAMADA" ||
        item.status ===
          "PENDENTE" ||
        item.status ===
          "EM_EXECUCAO"
    ).length;

  const preventivasConcluidas =
    preventivas.filter(
      (item) =>
        item.status ===
        "CONCLUIDA"
    ).length;

  const ExcelJS =
    await import("exceljs");

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Sistema de OS - Sequoia";

  workbook.lastModifiedBy =
    "Sistema de OS - Sequoia";

  workbook.company =
    "Sequoia";

  workbook.title =
    `KPI de Manutenção - ${colaborador.nome}`;

  workbook.subject =
    "Indicadores individuais de manutenção";

  workbook.description =
    "Relatório executivo de desempenho individual, ordens de serviço e preventivas.";

  workbook.created =
    new Date();

  workbook.modified =
    new Date();

  workbook.calcProperties.fullCalcOnLoad =
    true;

  const logoPath =
    path.join(
      process.cwd(),
      "public",
      "logo.sequoia.png"
    );

  let imagemId:
    | number
    | undefined;

  if (
    fs.existsSync(
      logoPath
    )
  ) {
    imagemId =
      workbook.addImage({
        filename:
          logoPath,
        extension:
          "png",
      });
  }

  // =========================================================
  // RESUMO EXECUTIVO
  // =========================================================
  const resumo =
    workbook.addWorksheet(
      "Resumo Executivo",
      {
        views: [
          {
            showGridLines:
              false,
          },
        ],
        properties: {
          defaultRowHeight:
            20,
        },
      }
    );

  resumo.columns = [
    {
      width: 22,
    },
    {
      width: 20,
    },
    {
      width: 22,
    },
    {
      width: 20,
    },
    {
      width: 22,
    },
    {
      width: 20,
    },
    {
      width: 22,
    },
    {
      width: 20,
    },
  ];

  resumo.mergeCells(
    "A1:H4"
  );

  const titulo =
    resumo.getCell(
      "A1"
    );

  titulo.value =
    "KPI INDIVIDUAL DE MANUTENÇÃO";

  titulo.font = {
    name: "Arial",
    size: 22,
    bold: true,
    color: {
      argb:
        CORES.branco,
    },
  };

  titulo.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb:
        CORES.navy,
    },
  };

  titulo.alignment = {
    vertical:
      "middle",
    horizontal:
      "center",
  };

  if (
    imagemId !==
    undefined
  ) {
    resumo.addImage(
      imagemId,
      {
        tl: {
          col: 0.15,
          row: 0.25,
        },
        ext: {
          width: 110,
          height: 58,
        },
      }
    );
  }

  resumo.mergeCells(
    "A6:H6"
  );

  const nome =
    resumo.getCell(
      "A6"
    );

  nome.value =
    colaborador.nome;

  nome.font = {
    name: "Arial",
    size: 18,
    bold: true,
    color: {
      argb:
        CORES.slate900,
    },
  };

  nome.alignment = {
    horizontal:
      "left",
    vertical:
      "middle",
  };

  resumo.mergeCells(
    "A7:H7"
  );

  resumo.getCell(
    "A7"
  ).value =
    `${colaborador.funcao?.nome ?? "Função não definida"} | ${colaborador.setor?.nome ?? "Setor não definido"} | ${colaborador.email}`;

  resumo.getCell(
    "A7"
  ).font = {
    name: "Arial",
    size: 10,
    color: {
      argb:
        CORES.slate500,
    },
  };

  resumo.getCell(
    "A7"
  ).alignment = {
    vertical:
      "middle",
  };

  const cards = [
    {
      range: "A9:B12",
      titulo:
        "EFICIÊNCIA",
      valor:
        `${eficiencia}%`,
      ajuda:
        "Concluídas / OS válidas",
      cor:
        CORES.cyanClaro,
      destaque:
        CORES.cyan,
    },
    {
      range: "C9:D12",
      titulo:
        "NO PRAZO",
      valor:
        prazo === null
          ? "—"
          : `${prazo}%`,
      ajuda:
        "Conclusões com prazo",
      cor:
        CORES.verdeClaro,
      destaque:
        CORES.verde,
    },
    {
      range: "E9:F12",
      titulo:
        "MTTR RELATÓRIO",
      valor:
        formatarDuracaoMinutos(
          mttr
        ),
      ajuda:
        `${duracoes.length} relatório(s) medido(s)`,
      cor:
        CORES.violetaClaro,
      destaque:
        CORES.violeta,
    },
    {
      range: "G9:H12",
      titulo:
        "BACKLOG",
      valor:
        String(
          abertas.length
        ),
      ajuda:
        `${atrasadas.length} atrasada(s)`,
      cor:
        CORES.laranjaClaro,
      destaque:
        CORES.laranja,
    },
  ];

  cards.forEach(
    (card) => {
      resumo.mergeCells(
        card.range
      );

      const cell =
        resumo.getCell(
          card.range.split(
            ":"
          )[0]
        );

      cell.value =
        `${card.titulo}\n${card.valor}\n${card.ajuda}`;

      cell.font = {
        name: "Arial",
        size: 11,
        bold: true,
        color: {
          argb:
            CORES.slate900,
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb:
            card.cor,
        },
      };

      cell.alignment = {
        vertical:
          "middle",
        horizontal:
          "left",
        wrapText: true,
        indent: 1,
      };

      cell.border =
        borda(
          card.destaque
        );
    }
  );

  resumo.mergeCells(
    "A15:H15"
  );

  resumo.getCell(
    "A15"
  ).value =
    "VISÃO OPERACIONAL";

  resumo.getCell(
    "A15"
  ).font = {
    name: "Arial",
    size: 11,
    bold: true,
    color: {
      argb:
        CORES.branco,
    },
  };

  resumo.getCell(
    "A15"
  ).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb:
        CORES.painel,
    },
  };

  resumo.getCell(
    "A15"
  ).alignment = {
    vertical:
      "middle",
  };

  const indicadores =
    [
      [
        "OS vinculadas",
        ordens.length,
        "Histórico total de ordens atribuídas.",
      ],
      [
        "OS concluídas",
        concluidas.length,
        "Ordens finalizadas no sistema.",
      ],
      [
        "Backlog atual",
        abertas.length,
        "Não iniciadas + em andamento.",
      ],
      [
        "OS atrasadas",
        atrasadas.length,
        "Abertas com data prevista vencida.",
      ],
      [
        "Preventivas atribuídas",
        preventivas.length,
        `${preventivasAbertas} em agenda / ${preventivasConcluidas} concluída(s).`,
      ],
      [
        "Base do MTTR",
        duracoes.length,
        "Horários do relatório técnico; fallback para legado.",
      ],
    ];


  const inicioTabela = 16;

  resumo.getCell(
    `A${inicioTabela}`
  ).value =
    "Indicador";

  resumo.mergeCells(
    `A${inicioTabela}:B${inicioTabela}`
  );

  resumo.getCell(
    `C${inicioTabela}`
  ).value =
    "Resultado";

  resumo.mergeCells(
    `C${inicioTabela}:D${inicioTabela}`
  );

  resumo.getCell(
    `E${inicioTabela}`
  ).value =
    "Leitura";

  resumo.mergeCells(
    `E${inicioTabela}:H${inicioTabela}`
  );

  [
    `A${inicioTabela}`,
    `C${inicioTabela}`,
    `E${inicioTabela}`,
  ].forEach(
    (referencia) => {
      const cell =
        resumo.getCell(
          referencia
        );

      cell.font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: {
          argb:
            CORES.branco,
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb:
            CORES.navy,
        },
      };

      cell.alignment = {
        vertical:
          "middle",
        horizontal:
          "left",
      };

      cell.border =
        borda();
    }
  );

  indicadores.forEach(
    (
      linha,
      index
    ) => {
      const row =
        inicioTabela +
        1 +
        index;

      resumo.mergeCells(
        `A${row}:B${row}`
      );

      resumo.mergeCells(
        `C${row}:D${row}`
      );

      resumo.mergeCells(
        `E${row}:H${row}`
      );

      resumo.getCell(
        `A${row}`
      ).value =
        linha[0];

      resumo.getCell(
        `C${row}`
      ).value =
        linha[1];

      resumo.getCell(
        `E${row}`
      ).value =
        linha[2];

      [
        `A${row}`,
        `C${row}`,
        `E${row}`,
      ].forEach(
        (
          referencia
        ) => {
          const cell =
            resumo.getCell(
              referencia
            );

          cell.font = {
            name:
              "Arial",
            size: 10,
            bold:
              referencia.startsWith(
                "A"
              ) ||
              referencia.startsWith(
                "C"
              ),
            color: {
              argb:
                CORES.slate700,
            },
          };

          cell.fill = {
            type:
              "pattern",
            pattern:
              "solid",
            fgColor: {
              argb:
                index %
                  2 ===
                0
                  ? CORES.branco
                  : CORES.slate50,
            },
          };

          cell.alignment = {
            vertical:
              "middle",
            horizontal:
              referencia.startsWith(
                "C"
              )
                ? "center"
                : "left",
            wrapText:
              true,
          };

          cell.border =
            borda();
        }
      );

      resumo.getRow(
        row
      ).height = 26;
    }
  );

  resumo.pageSetup = {
    orientation:
      "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    paperSize: 9,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.4,
      bottom: 0.4,
      header: 0.2,
      footer: 0.2,
    },
  };

  // =========================================================
  // ORDENS DE SERVIÇO
  // =========================================================
  const osSheet =
    workbook.addWorksheet(
      "Ordens de Serviço",
      {
        views: [
          {
            state:
              "frozen",
            ySplit: 4,
          },
        ],
      }
    );

  osSheet.mergeCells(
    "A1:L2"
  );

  osSheet.getCell(
    "A1"
  ).value =
    `ORDENS DE SERVIÇO - ${colaborador.nome}`;

  osSheet.getCell(
    "A1"
  ).font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: {
      argb:
        CORES.branco,
    },
  };

  osSheet.getCell(
    "A1"
  ).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb:
        CORES.navy,
    },
  };

  osSheet.getCell(
    "A1"
  ).alignment = {
    vertical:
      "middle",
    horizontal:
      "left",
  };

  if (
    imagemId !==
    undefined
  ) {
    osSheet.addImage(
      imagemId,
      {
        tl: {
          col: 10.5,
          row: 0.15,
        },
        ext: {
          width: 95,
          height: 48,
        },
      }
    );
  }

  const cabecalhoOS = [
    "Nº",
    "Título",
    "Status",
    "Prioridade",
    "Setor",
    "Máquina",
    "Criada em",
    "Data prevista",
    "Concluída em",
    "Tempo relatório",
    "Defeito / descrição",
    "Registro final",
  ];

  const headerOsRow =
    osSheet.getRow(4);

  headerOsRow.values =
    cabecalhoOS;

  headerOsRow.height =
    28;

  headerOsRow.eachCell(
    (cell) => {
      cell.font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: {
          argb:
            CORES.branco,
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb:
            CORES.painel,
        },
      };

      cell.alignment = {
        vertical:
          "middle",
        horizontal:
          "center",
        wrapText: true,
      };

      cell.border =
        borda(
          CORES.slate700
        );
    }
  );

  const linhasOs =
    ordens.map(
      (os) => [
        os.numero,
        os.titulo,
        statusOsLabel(
          os.status
        ),
        prioridadeOsLabel(
          os.prioridade
        ),
        os.setor
          ?.nome ||
          "—",
        os.maquina
          ?.nome ||
          "—",
        formatarData(
          os.createdAt
        ),
        formatarData(
          os.dataPrevista
        ),
        formatarData(
          os.dataConclusao
        ),
        os.status ===
        "CONCLUIDA"
          ? formatarDuracaoMinutos(
              obterDuracaoKpiMinutos(
                os
              )
            )
          : "—",
        os.descricao ||
          "—",
        os.registroFinal ||
          "—",
      ]
    );

  linhasOs.forEach(
    (
      valores,
      index
    ) => {
      const row =
        osSheet.addRow(
          valores
        );

      row.height = 36;

      row.eachCell(
        (
          cell,
          col
        ) => {
          cell.font = {
            name:
              "Arial",
            size: 9,
            color: {
              argb:
                CORES.slate700,
            },
          };

          cell.fill = {
            type:
              "pattern",
            pattern:
              "solid",
            fgColor: {
              argb:
                index %
                  2 ===
                0
                  ? CORES.branco
                  : CORES.slate50,
            },
          };

          cell.alignment = {
            vertical:
              "middle",
            horizontal:
              [
                1,
                3,
                4,
                7,
                8,
                9,
                10,
              ].includes(
                col
              )
                ? "center"
                : "left",
            wrapText:
              true,
          };

          cell.border =
            borda();
        }
      );

      const statusCell =
        row.getCell(3);

      const status =
        String(
          statusCell.value ??
            ""
        );

      if (
        status ===
        "Concluída"
      ) {
        statusCell.fill = {
          type:
            "pattern",
          pattern:
            "solid",
          fgColor: {
            argb:
              CORES.verdeClaro,
          },
        };

        statusCell.font = {
          name: "Arial",
          size: 9,
          bold: true,
          color: {
            argb:
              "047857",
          },
        };
      } else if (
        status ===
        "Em andamento"
      ) {
        statusCell.fill = {
          type:
            "pattern",
          pattern:
            "solid",
          fgColor: {
            argb:
              CORES.cyanClaro,
          },
        };
      } else if (
        status ===
        "Cancelada"
      ) {
        statusCell.fill = {
          type:
            "pattern",
          pattern:
            "solid",
          fgColor: {
            argb:
              CORES.vermelhoClaro,
          },
        };
      }
    }
  );

  osSheet.autoFilter = {
    from: "A4",
    to: "L4",
  };

  osSheet.columns = [
    {
      width: 9,
    },
    {
      width: 28,
    },
    {
      width: 18,
    },
    {
      width: 14,
    },
    {
      width: 22,
    },
    {
      width: 26,
    },
    {
      width: 14,
    },
    {
      width: 14,
    },
    {
      width: 14,
    },
    {
      width: 17,
    },
    {
      width: 40,
    },
    {
      width: 52,
    },
  ];

  osSheet.pageSetup = {
    orientation:
      "landscape",
    fitToPage: true,
    fitToWidth: 1,
    paperSize: 9,
  };

  // =========================================================
  // PREVENTIVAS
  // =========================================================
  const preventivaSheet =
    workbook.addWorksheet(
      "Preventivas",
      {
        views: [
          {
            state:
              "frozen",
            ySplit: 4,
          },
        ],
      }
    );

  preventivaSheet.mergeCells(
    "A1:H2"
  );

  preventivaSheet.getCell(
    "A1"
  ).value =
    `PREVENTIVAS - ${colaborador.nome}`;

  preventivaSheet.getCell(
    "A1"
  ).font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: {
      argb:
        CORES.branco,
    },
  };

  preventivaSheet.getCell(
    "A1"
  ).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb:
        CORES.navy,
    },
  };

  preventivaSheet.getCell(
    "A1"
  ).alignment = {
    vertical:
      "middle",
  };

  const headerPrev =
    preventivaSheet.getRow(
      4
    );

  headerPrev.values = [
    "Data programada",
    "Preventiva",
    "Status",
    "Setor",
    "Máquina",
    "Duração prevista",
    "Duração real",
    "Conclusão",
  ];

  headerPrev.height = 28;

  headerPrev.eachCell(
    (cell) => {
      cell.font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: {
          argb:
            CORES.branco,
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb:
            CORES.painel,
        },
      };

      cell.alignment = {
        vertical:
          "middle",
        horizontal:
          "center",
        wrapText: true,
      };

      cell.border =
        borda(
          CORES.slate700
        );
    }
  );

  preventivas.forEach(
    (
      item,
      index
    ) => {
      const row =
        preventivaSheet.addRow(
          [
            formatarData(
              item.dataProgramada
            ),
            item.plano
              .titulo,
            statusPreventivaLabel(
              item.status
            ),
            item.plano
              .setor.nome,
            item.plano
              .maquina
              ?.nome ||
              "—",
            formatarDuracaoMinutos(
              item.duracaoEstimadaMinutos
            ),
            formatarDuracaoMinutos(
              item.duracaoRealMinutos
            ),
            formatarData(
              item.dataConclusao
            ),
          ]
        );

      row.height = 28;

      row.eachCell(
        (cell) => {
          cell.font = {
            name:
              "Arial",
            size: 9,
            color: {
              argb:
                CORES.slate700,
            },
          };

          cell.fill = {
            type:
              "pattern",
            pattern:
              "solid",
            fgColor: {
              argb:
                index %
                  2 ===
                0
                  ? CORES.branco
                  : CORES.slate50,
            },
          };

          cell.alignment = {
            vertical:
              "middle",
            horizontal:
              "center",
            wrapText:
              true,
          };

          cell.border =
            borda();
        }
      );
    }
  );

  preventivaSheet.autoFilter =
    {
      from: "A4",
      to: "H4",
    };

  preventivaSheet.columns = [
    {
      width: 18,
    },
    {
      width: 34,
    },
    {
      width: 18,
    },
    {
      width: 22,
    },
    {
      width: 28,
    },
    {
      width: 20,
    },
    {
      width: 18,
    },
    {
      width: 18,
    },
  ];

  preventivaSheet.pageSetup =
    {
      orientation:
        "landscape",
      fitToPage: true,
      fitToWidth: 1,
      paperSize: 9,
    };

  const buffer =
    await workbook.xlsx.writeBuffer();

  const arquivo =
    Buffer.from(
      buffer
    );

  const nomeSeguro =
    colaborador.nome
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .toLowerCase();

  return new NextResponse(
    arquivo,
    {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "Content-Disposition":
          `attachment; filename="kpi-${nomeSeguro}.xlsx"`,

        "Cache-Control":
          "no-store",
      },
    }
  );
}
