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

  const preventivasConcluidas =
    preventivas.filter(
      (item) =>
        item.status ===
        "CONCLUIDA"
    ).length;

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

  const [
    { jsPDF },
    { default: autoTable },
  ] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc =
    new jsPDF({
      orientation:
        "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });

  const largura =
    doc.internal.pageSize.getWidth();

  const altura =
    doc.internal.pageSize.getHeight();

  const margem = 12;

  const C = {
    fundo: [
      248,
      250,
      252,
    ] as [
      number,
      number,
      number
    ],

    navy: [
      5,
      8,
      22,
    ] as [
      number,
      number,
      number
    ],

    painel: [
      15,
      23,
      42,
    ] as [
      number,
      number,
      number
    ],

    texto: [
      30,
      41,
      59,
    ] as [
      number,
      number,
      number
    ],

    fraco: [
      100,
      116,
      139,
    ] as [
      number,
      number,
      number
    ],

    linha: [
      226,
      232,
      240,
    ] as [
      number,
      number,
      number
    ],

    cyan: [
      6,
      182,
      212,
    ] as [
      number,
      number,
      number
    ],

    verde: [
      16,
      185,
      129,
    ] as [
      number,
      number,
      number
    ],

    laranja: [
      249,
      115,
      22,
    ] as [
      number,
      number,
      number
    ],

    vermelho: [
      239,
      68,
      68,
    ] as [
      number,
      number,
      number
    ],

    violeta: [
      139,
      92,
      246,
    ] as [
      number,
      number,
      number
    ],

    branco: [
      255,
      255,
      255,
    ] as [
      number,
      number,
      number
    ],
  };

  const logoPath =
    path.join(
      process.cwd(),
      "public",
      "logo.sequoia.png"
    );

  let logoBase64:
    | string
    | null = null;

  if (
    fs.existsSync(
      logoPath
    )
  ) {
    logoBase64 =
      `data:image/png;base64,${fs
        .readFileSync(
          logoPath
        )
        .toString(
          "base64"
        )}`;
  }

  function fundo() {
    doc.setFillColor(
      ...C.fundo
    );

    doc.rect(
      0,
      0,
      largura,
      altura,
      "F"
    );
  }

  function cabecalho(
    titulo: string,
    subtitulo: string
  ) {
    fundo();

    doc.setFillColor(
      ...C.navy
    );

    doc.rect(
      0,
      0,
      largura,
      26,
      "F"
    );

    if (logoBase64) {
      try {
        doc.addImage(
          logoBase64,
          "PNG",
          margem,
          4,
          27,
          17,
          undefined,
          "FAST"
        );
      } catch {
        // PDF continua mesmo se a imagem falhar.
      }
    }

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(14);

    doc.setTextColor(
      ...C.branco
    );

    doc.text(
      titulo,
      logoBase64
        ? margem + 34
        : margem,
      10
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      148,
      163,
      184
    );

    doc.text(
      subtitulo,
      logoBase64
        ? margem + 34
        : margem,
      16
    );

    doc.text(
      `Gerado em ${new Intl.DateTimeFormat(
        "pt-BR",
        {
          dateStyle:
            "short",
          timeStyle:
            "short",
          timeZone:
            "America/Sao_Paulo",
        }
      ).format(
        new Date()
      )}`,
      largura -
        margem,
      11,
      {
        align:
          "right",
      }
    );
  }

  function rodape() {
    doc.setDrawColor(
      ...C.linha
    );

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

    doc.setTextColor(
      ...C.fraco
    );

    doc.text(
      "Sistema de OS - Sequoia | Indicadores calculados a partir dos registros do sistema.",
      margem,
      altura - 4.5
    );

    doc.text(
      `Página ${doc.getNumberOfPages()}`,
      largura -
        margem,
      altura - 4.5,
      {
        align:
          "right",
      }
    );
  }

  function kpi(
    x: number,
    y: number,
    larguraCard: number,
    titulo: string,
    valor: string,
    descricao: string,
    cor: [
      number,
      number,
      number
    ]
  ) {
    doc.setFillColor(
      255,
      255,
      255
    );

    doc.setDrawColor(
      ...C.linha
    );

    doc.roundedRect(
      x,
      y,
      larguraCard,
      25,
      2.5,
      2.5,
      "FD"
    );

    doc.setFillColor(
      ...cor
    );

    doc.roundedRect(
      x,
      y,
      3,
      25,
      1.5,
      1.5,
      "F"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7);

    doc.setTextColor(
      ...C.fraco
    );

    doc.text(
      titulo.toUpperCase(),
      x + 7,
      y + 7
    );

    doc.setFontSize(15);

    doc.setTextColor(
      ...C.texto
    );

    doc.text(
      valor,
      x + 7,
      y + 16
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(6.2);

    doc.setTextColor(
      ...C.fraco
    );

    doc.text(
      descricao,
      x + 7,
      y + 21
    );
  }

  // =========================================================
  // PÁGINA 1 - RESUMO EXECUTIVO
  // =========================================================
  cabecalho(
    "Desempenho Individual de Manutenção",
    "Resumo executivo do colaborador"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(21);

  doc.setTextColor(
    ...C.texto
  );

  doc.text(
    colaborador.nome,
    margem,
    40
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  doc.setTextColor(
    ...C.fraco
  );

  const perfil =
    [
      colaborador.funcao
        ?.nome ||
        "Função não definida",

      colaborador.setor
        ?.nome ||
        "Setor não definido",

      colaborador.email,
    ].join("  |  ");

  doc.text(
    perfil,
    margem,
    47
  );

  const cardWidth =
    (largura -
      margem * 2 -
      15) /
    4;

  kpi(
    margem,
    57,
    cardWidth,
    "Eficiência",
    `${eficiencia}%`,
    "Concluídas / OS válidas",
    C.cyan
  );

  kpi(
    margem +
      cardWidth +
      5,
    57,
    cardWidth,
    "No prazo",
    prazo === null
      ? "—"
      : `${prazo}%`,
    "Conclusões com prazo",
    C.verde
  );

  kpi(
    margem +
      (cardWidth +
        5) *
        2,
    57,
    cardWidth,
    "MTTR relatório",
    formatarDuracaoMinutos(
      mttr
    ),
    `${duracoes.length} relatório(s) medido(s)`,
    C.violeta
  );

  kpi(
    margem +
      (cardWidth +
        5) *
        3,
    57,
    cardWidth,
    "Backlog",
    String(
      abertas.length
    ),
    `${atrasadas.length} atrasada(s)`,
    C.laranja
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(11);

  doc.setTextColor(
    ...C.texto
  );

  doc.text(
    "Visão operacional",
    margem,
    96
  );

  autoTable(
    doc,
    {
      startY: 101,

      margin: {
        left: margem,
        right: margem,
      },

      tableWidth:
        largura -
        margem * 2,

      head: [
        [
          "Indicador",
          "Resultado",
          "Leitura",
        ],
      ],

      body: [
        [
          "OS vinculadas",
          String(
            ordens.length
          ),
          "Histórico total de ordens atribuídas ao colaborador.",
        ],
        [
          "OS concluídas",
          String(
            concluidas.length
          ),
          "Ordens finalizadas no sistema.",
        ],
        [
          "Backlog atual",
          String(
            abertas.length
          ),
          "Não iniciadas + em andamento.",
        ],
        [
          "OS atrasadas",
          String(
            atrasadas.length
          ),
          "Abertas com data prevista já vencida.",
        ],
        [
          "Preventivas atribuídas",
          String(
            preventivas.length
          ),
          `${preventivasAbertas} em agenda e ${preventivasConcluidas} concluída(s).`,
        ],
        [
          "Base do MTTR",
          String(
            duracoes.length
          ),
          "Tempo médio calculado pelos horários registrados no relatório técnico; fallback para registros antigos.",
        ],
      ],

      theme: "grid",

      styles: {
        font:
          "helvetica",
        fontSize: 7,
        cellPadding: 2.5,
        textColor:
          C.texto,
        lineColor:
          C.linha,
        lineWidth:
          0.2,
        valign:
          "middle",
      },

      headStyles: {
        fillColor:
          C.painel,
        textColor:
          C.branco,
        fontStyle:
          "bold",
      },

      alternateRowStyles:
        {
          fillColor: [
            248,
            250,
            252,
          ],
        },

      columnStyles: {
        0: {
          cellWidth:
            48,
          fontStyle:
            "bold",
        },

        1: {
          cellWidth:
            28,
          halign:
            "center",
          fontStyle:
            "bold",
        },
      },
    }
  );

  rodape();

  // =========================================================
  // PÁGINA 2 - OS
  // =========================================================
  doc.addPage(
    "a4",
    "landscape"
  );

  cabecalho(
    "Ordens de Serviço",
    `Detalhamento - ${colaborador.nome}`
  );

  autoTable(
    doc,
    {
      startY: 34,

      margin: {
        top: 34,
        left: margem,
        right: margem,
        bottom: 15,
      },

      head: [
        [
          "Nº",
          "Status",
          "Prioridade",
          "Setor",
          "Máquina",
          "Criada",
          "Prevista",
          "Concluída",
          "Tempo relatório",
        ],
      ],

      body:
        ordens.length > 0
          ? ordens.map(
              (os) => [
                String(
                  os.numero
                ),

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
              ]
            )
          : [
              [
                "—",
                "—",
                "—",
                "—",
                "—",
                "—",
                "—",
                "—",
                "Sem OS",
              ],
            ],

      theme: "grid",

      showHead:
        "everyPage",

      styles: {
        font:
          "helvetica",
        fontSize: 6.3,
        cellPadding: 2.1,
        textColor:
          C.texto,
        lineColor:
          C.linha,
        lineWidth:
          0.15,
        valign:
          "middle",
      },

      headStyles: {
        fillColor:
          C.painel,
        textColor:
          C.branco,
        fontStyle:
          "bold",
      },

      alternateRowStyles:
        {
          fillColor: [
            248,
            250,
            252,
          ],
        },

      columnStyles: {
        0: {
          halign:
            "center",
          cellWidth: 16,
        },

        1: {
          cellWidth: 29,
        },

        2: {
          cellWidth: 23,
        },

        3: {
          cellWidth: 35,
        },

        4: {
          cellWidth: 45,
        },

        5: {
          cellWidth: 24,
          halign:
            "center",
        },

        6: {
          cellWidth: 24,
          halign:
            "center",
        },

        7: {
          cellWidth: 24,
          halign:
            "center",
        },

        8: {
          cellWidth: 29,
          halign:
            "center",
          fontStyle:
            "bold",
        },
      },

      willDrawPage: () => {
        cabecalho(
          "Ordens de Serviço",
          `Detalhamento - ${colaborador.nome}`
        );
      },

      didDrawPage: () => {
        rodape();
      },
    }
  );

  // =========================================================
  // PÁGINA 3 - PREVENTIVAS
  // =========================================================
  doc.addPage(
    "a4",
    "landscape"
  );

  cabecalho(
    "Manutenção Preventiva",
    `Execuções atribuídas - ${colaborador.nome}`
  );

  autoTable(
    doc,
    {
      startY: 34,

      margin: {
        top: 34,
        left: margem,
        right: margem,
        bottom: 15,
      },

      head: [
        [
          "Data",
          "Preventiva",
          "Status",
          "Setor",
          "Máquina",
          "Previsto",
          "Real",
        ],
      ],

      body:
        preventivas.length >
        0
          ? preventivas.map(
              (
                item
              ) => [
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
              ]
            )
          : [
              [
                "—",
                "Nenhuma preventiva atribuída",
                "—",
                "—",
                "—",
                "—",
                "—",
              ],
            ],

      theme: "grid",

      showHead:
        "everyPage",

      styles: {
        font:
          "helvetica",
        fontSize: 6.8,
        cellPadding: 2.3,
        textColor:
          C.texto,
        lineColor:
          C.linha,
        lineWidth:
          0.15,
        valign:
          "middle",
      },

      headStyles: {
        fillColor:
          C.painel,
        textColor:
          C.branco,
        fontStyle:
          "bold",
      },

      alternateRowStyles:
        {
          fillColor: [
            248,
            250,
            252,
          ],
        },

      willDrawPage: () => {
        cabecalho(
          "Manutenção Preventiva",
          `Execuções atribuídas - ${colaborador.nome}`
        );
      },

      didDrawPage: () => {
        rodape();
      },
    }
  );

  // =========================================================
  // PÁGINA 4 - RELATÓRIOS TÉCNICOS
  // =========================================================
  const ordensComRelatorio =
    concluidas.filter(
      (os) =>
        Boolean(
          os.registroFinal?.trim()
        )
    );

  if (
    ordensComRelatorio.length >
    0
  ) {
    doc.addPage(
      "a4",
      "landscape"
    );

    cabecalho(
      "Relatórios Técnicos",
      `Rastreabilidade das OS concluídas - ${colaborador.nome}`
    );

    autoTable(
      doc,
      {
        startY: 34,

        margin: {
          top: 34,
          left: margem,
          right: margem,
          bottom: 15,
        },

        head: [
          [
            "OS",
            "Máquina",
            "Conclusão",
            "Tempo relatório",
            "Relatório técnico",
          ],
        ],

        body:
          ordensComRelatorio.map(
            (os) => [
              `#${os.numero} - ${os.titulo}`,

              os.maquina
                ?.nome ||
                "—",

              formatarData(
                os.dataConclusao
              ),

              formatarDuracaoMinutos(
                obterDuracaoKpiMinutos(
                  os
                )
              ),

              os.registroFinal ||
                "—",
            ]
          ),

        theme: "grid",

        showHead:
          "everyPage",

        styles: {
          font:
            "helvetica",
          fontSize: 6.2,
          cellPadding: 2.2,
          textColor:
            C.texto,
          lineColor:
            C.linha,
          lineWidth:
            0.15,
          valign:
            "top",
          overflow:
            "linebreak",
        },

        headStyles: {
          fillColor:
            C.painel,
          textColor:
            C.branco,
          fontStyle:
            "bold",
        },

        alternateRowStyles:
          {
            fillColor: [
              248,
              250,
              252,
            ],
          },

        columnStyles: {
          0: {
            cellWidth: 50,
            fontStyle:
              "bold",
          },

          1: {
            cellWidth: 43,
          },

          2: {
            cellWidth: 25,
            halign:
              "center",
          },

          3: {
            cellWidth: 28,
            halign:
              "center",
            fontStyle:
              "bold",
          },

          4: {
            cellWidth: 125,
          },
        },

        willDrawPage: () => {
          cabecalho(
            "Relatórios Técnicos",
            `Rastreabilidade das OS concluídas - ${colaborador.nome}`
          );
        },

        didDrawPage: () => {
          rodape();
        },
      }
    );
  }

  const pdf =
    Buffer.from(
      doc.output(
        "arraybuffer"
      )
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
    pdf,
    {
      headers: {
        "Content-Type":
          "application/pdf",

        "Content-Disposition":
          `inline; filename="kpi-${nomeSeguro}.pdf"`,

        "Cache-Control":
          "no-store",
      },
    }
  );
}
