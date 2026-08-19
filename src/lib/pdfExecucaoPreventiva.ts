import fs from "fs/promises";
import path from "path";

import {
  PDFDocument,
  PDFImage,
  PDFPage,
  PDFFont,
  rgb,
  StandardFonts,
} from "pdf-lib";

type TextoOpcional =
  | string
  | null
  | undefined;

type DataOpcional =
  | Date
  | string
  | null
  | undefined;

type ChecklistValor =
  | string
  | boolean
  | null
  | undefined;

type Pessoa = {
  nome: string;
  email?: string | null;
};

export type ExecucaoPreventivaPdfData = {
  id: string;

  status: string;

  dataProgramada: DataOpcional;

  dataInicio?: DataOpcional;

  dataConclusao?: DataOpcional;

  duracaoEstimadaMinutos?: number | null;

  duracaoRealMinutos?: number | null;

  descricaoExecucao?: TextoOpcional;

  pecasUtilizadas?: TextoOpcional;

  observacoes?: TextoOpcional;

  checkQuantidadePecas?: ChecklistValor;

  checkFerramentasRecolhidas?: ChecklistValor;

  checkMaterialRepostoRecolhido?: ChecklistValor;

  checkLimpezaRealizada?: ChecklistValor;

  checkLimpezaEfetiva?: ChecklistValor;

  concluidoPor?: Pessoa | null;

  plano: {
    id: string;

    titulo: string;

    descricao?: TextoOpcional;

    prioridade?: TextoOpcional;

    frequencia?: TextoOpcional;

    duracaoEstimadaMinutos?: number | null;

    empresa?: {
      nome?: string | null;
      sigla?: string | null;
    } | null;

    setor?: {
      nome?: string | null;
    } | null;

    maquina?: {
      nome?: string | null;
    } | null;

    criadoPor?: Pessoa | null;
  };

  responsaveis?: {
    user: Pessoa;
  }[];
};

/*
 * ============================================================
 * CONFIGURAÇÕES DO DOCUMENTO
 * ============================================================
 */

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

const MARGEM = 40;

/*
 * Área reservada para o rodapé.
 *
 * O conteúdo nunca poderá entrar abaixo daqui.
 */
const LIMITE_INFERIOR = 70;

const CORES = {
  navy: rgb(
    5 / 255,
    8 / 255,
    22 / 255
  ),

  cyan: rgb(
    34 / 255,
    211 / 255,
    238 / 255
  ),

  cyanSoft: rgb(
    231 / 255,
    248 / 255,
    251 / 255
  ),

  border: rgb(
    218 / 255,
    226 / 255,
    234 / 255
  ),

  text: rgb(
    15 / 255,
    23 / 255,
    42 / 255
  ),

  textSoft: rgb(
    71 / 255,
    85 / 255,
    105 / 255
  ),

  success: rgb(
    22 / 255,
    163 / 255,
    74 / 255
  ),

  warning: rgb(
    217 / 255,
    119 / 255,
    6 / 255
  ),

  danger: rgb(
    220 / 255,
    38 / 255,
    38 / 255
  ),

  white: rgb(
    1,
    1,
    1
  ),

  light: rgb(
    248 / 255,
    250 / 255,
    252 / 255
  ),
};

/*
 * ============================================================
 * FORMATAÇÕES
 * ============================================================
 */

function paraData(
  valor: DataOpcional
): Date | null {
  if (!valor) {
    return null;
  }

  if (
    valor instanceof Date
  ) {
    return valor;
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return null;
  }

  return data;
}

function formatarData(
  valor: DataOpcional
) {
  const data =
    paraData(valor);

  if (!data) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(data);
}

function formatarDataHora(
  valor: DataOpcional
) {
  const data =
    paraData(valor);

  if (!data) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",

      dateStyle:
        "short",

      timeStyle:
        "short",
    }
  ).format(data);
}

function formatarDuracao(
  minutos?: number | null
) {
  if (
    minutos === null ||
    minutos === undefined
  ) {
    return "-";
  }

  if (
    minutos <= 0
  ) {
    return "0 min";
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  const restante =
    minutos % 60;

  if (
    horas > 0 &&
    restante > 0
  ) {
    return `${horas}h ${restante}min`;
  }

  if (
    horas > 0
  ) {
    return `${horas}h`;
  }

  return `${restante}min`;
}

function normalizarTexto(
  texto?: TextoOpcional
) {
  if (!texto) {
    return "-";
  }

  const limpo =
    texto.trim();

  return limpo || "-";
}

function normalizarChecklist(
  valor: ChecklistValor
) {
  if (
    valor === true
  ) {
    return "Sim";
  }

  if (
    valor === false
  ) {
    return "Não";
  }

  if (
    valor === null ||
    valor === undefined
  ) {
    return "N.A.";
  }

  const texto =
    String(valor)
      .trim()
      .toUpperCase();

  if (
    texto === "SIM"
  ) {
    return "Sim";
  }

  if (
    texto === "NAO" ||
    texto === "NÃO"
  ) {
    return "Não";
  }

  if (
    texto === "NA" ||
    texto === "N/A"
  ) {
    return "N.A.";
  }

  return texto;
}

function formatarStatus(
  status?: string | null
) {
  const map: Record<
    string,
    string
  > = {
    PROGRAMADA:
      "Programada",

    PENDENTE:
      "Pendente",

    EM_EXECUCAO:
      "Em execução",

    CONCLUIDA:
      "Concluída",

    NAO_REALIZADA:
      "Não realizada",

    CANCELADA:
      "Cancelada",
  };

  if (!status) {
    return "-";
  }

  return (
    map[status] ??
    status
  );
}

function formatarPrioridade(
  prioridade?: string | null
) {
  const map: Record<
    string,
    string
  > = {
    BAIXA:
      "Baixa",

    MEDIA:
      "Média",

    ALTA:
      "Alta",

    URGENTE:
      "Urgente",
  };

  if (!prioridade) {
    return "-";
  }

  return (
    map[prioridade] ??
    prioridade
  );
}

function formatarFrequencia(
  frequencia?: string | null
) {
  const map: Record<
    string,
    string
  > = {
    SEMANAL:
      "Semanal",

    QUINZENAL:
      "Quinzenal",

    MENSAL:
      "Mensal",

    BIMESTRAL:
      "Bimestral",

    TRIMESTRAL:
      "Trimestral",

    SEMESTRAL:
      "Semestral",

    ANUAL:
      "Anual",

    PERSONALIZADA:
      "Personalizada",
  };

  if (!frequencia) {
    return "-";
  }

  return (
    map[frequencia] ??
    frequencia
  );
}

/*
 * ============================================================
 * QUEBRA DE TEXTO
 * ============================================================
 */

function quebrarLinhas(
  texto: string,
  larguraMaxima: number,
  font: PDFFont,
  tamanho: number
) {
  const paragrafos =
    texto.split(/\n/);

  const resultado:
    string[] = [];

  for (
    const paragrafo
    of paragrafos
  ) {
    const palavras =
      paragrafo
        .split(/\s+/)
        .filter(Boolean);

    if (
      palavras.length === 0
    ) {
      resultado.push("");
      continue;
    }

    let linhaAtual = "";

    for (
      const palavra
      of palavras
    ) {
      const teste =
        linhaAtual
          ? `${linhaAtual} ${palavra}`
          : palavra;

      const largura =
        font.widthOfTextAtSize(
          teste,
          tamanho
        );

      if (
        largura <=
        larguraMaxima
      ) {
        linhaAtual =
          teste;
      } else {
        if (
          linhaAtual
        ) {
          resultado.push(
            linhaAtual
          );
        }

        linhaAtual =
          palavra;
      }
    }

    if (
      linhaAtual
    ) {
      resultado.push(
        linhaAtual
      );
    }
  }

  return (
    resultado.length
      ? resultado
      : [""]
  );
}

/*
 * ============================================================
 * LOGO
 * ============================================================
 */

async function carregarLogo(
  pdfDoc: PDFDocument
): Promise<PDFImage | null> {
  const possibilidades = [
    path.join(
      process.cwd(),
      "public",
      "logo.sequoia.png"
    ),

    path.join(
      process.cwd(),
      "public",
      "logo-sequoia.png"
    ),

    path.join(
      process.cwd(),
      "public",
      "logo.png"
    ),
  ];

  for (
    const arquivo
    of possibilidades
  ) {
    try {
      const bytes =
        await fs.readFile(
          arquivo
        );

      return await pdfDoc.embedPng(
        bytes
      );
    } catch {
      // tenta próximo arquivo
    }
  }

  return null;
}

/*
 * ============================================================
 * GERADOR PRINCIPAL
 * ============================================================
 */

export async function gerarPdfExecucaoPreventiva(
  dados: ExecucaoPreventivaPdfData
) {
  const pdfDoc =
    await PDFDocument.create();

  const font =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const fontBold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

  const logo =
    await carregarLogo(
      pdfDoc
    );

  /*
 * Página atual.
 */
let page!: PDFPage;

/*
 * Posição vertical atual.
 */
let y = 0;

  /*
   * ==========================================================
   * CABEÇALHO
   * ==========================================================
   */

  function desenharCabecalho(
    pagina: PDFPage
  ) {
    pagina.drawRectangle({
      x: 0,

      y:
        A4_HEIGHT -
        104,

      width:
        A4_WIDTH,

      height:
        104,

      color:
        CORES.navy,
    });

    pagina.drawRectangle({
      x: 0,

      y:
        A4_HEIGHT -
        109,

      width:
        A4_WIDTH,

      height: 5,

      color:
        CORES.cyan,
    });

    if (logo) {
      pagina.drawImage(
        logo,
        {
          x:
            MARGEM,

          y:
            A4_HEIGHT -
            72,

          width:
            72,

          height:
            34,
        }
      );
    }

    pagina.drawText(
      "ORDEM DE EXECUÇÃO PREVENTIVA",
      {
        x:
          logo
            ? 130
            : MARGEM,

        y:
          A4_HEIGHT -
          48,

        size:
          17,

        font:
          fontBold,

        color:
          CORES.white,
      }
    );

    pagina.drawText(
      "SISTEMA DE MANUTENÇÃO • SEQUOIA",
      {
        x:
          logo
            ? 130
            : MARGEM,

        y:
          A4_HEIGHT -
          67,

        size:
          9,

        font:
          font,

        color:
          CORES.cyan,
      }
    );

    pagina.drawText(
      `Emitido em ${formatarDataHora(
        new Date()
      )}`,
      {
        x:
          A4_WIDTH -
          170,

        y:
          A4_HEIGHT -
          88,

        size:
          8.5,

        font:
          font,

        color:
          CORES.white,
      }
    );
  }

  /*
   * ==========================================================
   * CRIA NOVA PÁGINA
   * ==========================================================
   */

  function novaPagina() {
    page =
      pdfDoc.addPage([
        A4_WIDTH,
        A4_HEIGHT,
      ]);

    page.drawRectangle({
      x: 0,
      y: 0,
      width:
        A4_WIDTH,
      height:
        A4_HEIGHT,
      color:
        CORES.white,
    });

    desenharCabecalho(
      page
    );

    y =
      A4_HEIGHT -
      135;
  }

  /*
   * ==========================================================
   * VERIFICA SE CABE NA PÁGINA
   * ==========================================================
   */

  function garantirEspaco(
    altura: number
  ) {
    if (
      y -
        altura <
      LIMITE_INFERIOR
    ) {
      novaPagina();
    }
  }

  /*
   * ==========================================================
   * TÍTULO DE SEÇÃO
   * ==========================================================
   */

  function tituloSecao(
    titulo: string
  ) {
    garantirEspaco(
      40
    );

    page.drawRectangle({
      x:
        MARGEM,

      y:
        y - 24,

      width:
        A4_WIDTH -
        MARGEM * 2,

      height:
        24,

      color:
        CORES.cyanSoft,

      borderColor:
        CORES.border,

      borderWidth:
        0.7,
    });

    page.drawText(
      titulo.toUpperCase(),
      {
        x:
          MARGEM +
          10,

        y:
          y - 16,

        size:
          10.5,

        font:
          fontBold,

        color:
          CORES.navy,
      }
    );

    y -= 36;
  }

  /*
   * ==========================================================
   * CAIXA DE INFORMAÇÃO
   * ==========================================================
   */

  function caixaInfo(
    x: number,
    largura: number,
    titulo: string,
    valor: string,
    altura = 48
  ) {
    page.drawRectangle({
      x,

      y:
        y -
        altura,

      width:
        largura,

      height:
        altura,

      color:
        CORES.white,

      borderColor:
        CORES.border,

      borderWidth:
        0.8,
    });

    page.drawText(
      titulo.toUpperCase(),
      {
        x:
          x +
          10,

        y:
          y -
          16,

        size:
          8,

        font:
          fontBold,

        color:
          CORES.textSoft,
      }
    );

    const linhas =
      quebrarLinhas(
        valor,
        largura -
          20,
        font,
        10.5
      );

    let textoY =
      y - 33;

    for (
      const linha
      of linhas.slice(
        0,
        2
      )
    ) {
      page.drawText(
        linha,
        {
          x:
            x +
            10,

          y:
            textoY,

          size:
            10.5,

          font,

          color:
            CORES.text,
        }
      );

      textoY -=
        13;
    }
  }

  /*
   * ==========================================================
   * DUAS CAIXAS NA MESMA LINHA
   * ==========================================================
   */

  function linhaDupla(
    esquerda: {
      titulo: string;
      valor: string;
    },

    direita: {
      titulo: string;
      valor: string;
    }
  ) {
    garantirEspaco(
      58
    );

    const gap = 10;

    const largura =
      (
        A4_WIDTH -
        MARGEM * 2 -
        gap
      ) /
      2;

    caixaInfo(
      MARGEM,
      largura,
      esquerda.titulo,
      esquerda.valor
    );

    caixaInfo(
      MARGEM +
        largura +
        gap,

      largura,

      direita.titulo,

      direita.valor
    );

    y -= 58;
  }

  /*
   * ==========================================================
   * CAMPO GRANDE
   * ==========================================================
   */

  function campoGrande(
    titulo: string,
    texto: string,
    minimo = 58
  ) {
    const largura =
      A4_WIDTH -
      MARGEM * 2;

    const linhas =
      quebrarLinhas(
        texto,
        largura -
          20,
        font,
        10
      );

    const altura =
      Math.max(
        minimo,
        32 +
          linhas.length *
            13
      );

    garantirEspaco(
      altura +
        12
    );

    page.drawRectangle({
      x:
        MARGEM,

      y:
        y -
        altura,

      width:
        largura,

      height:
        altura,

      color:
        CORES.white,

      borderColor:
        CORES.border,

      borderWidth:
        0.8,
    });

    page.drawText(
      titulo.toUpperCase(),
      {
        x:
          MARGEM +
          10,

        y:
          y -
          16,

        size:
          8,

        font:
          fontBold,

        color:
          CORES.textSoft,
      }
    );

    let textoY =
      y - 34;

    for (
      const linha
      of linhas
    ) {
      page.drawText(
        linha,
        {
          x:
            MARGEM +
            10,

          y:
            textoY,

          size:
            10,

          font,

          color:
            CORES.text,
        }
      );

      textoY -=
        13;
    }

    y -=
      altura +
      10;
  }

  /*
   * ==========================================================
   * CHECKLIST
   * ==========================================================
   */

  function corResposta(
    resposta: string
  ) {
    if (
      resposta ===
      "Sim"
    ) {
      return CORES.success;
    }

    if (
      resposta ===
      "Não"
    ) {
      return CORES.danger;
    }

    return CORES.warning;
  }

  function linhaChecklist(
    pergunta: string,
    resposta: string
  ) {
    const largura =
      A4_WIDTH -
      MARGEM * 2;

    const chipWidth =
      52;

    const larguraPergunta =
      largura -
      chipWidth -
      36;

    const linhas =
      quebrarLinhas(
        pergunta,
        larguraPergunta,
        font,
        9.5
      );

    const altura =
      Math.max(
        34,
        18 +
          linhas.length *
            12
      );

    garantirEspaco(
      altura +
        5
    );

    page.drawRectangle({
      x:
        MARGEM,

      y:
        y -
        altura,

      width:
        largura,

      height:
        altura,

      color:
        CORES.white,

      borderColor:
        CORES.border,

      borderWidth:
        0.7,
    });

    let perguntaY =
      y - 20;

    for (
      const linha
      of linhas
    ) {
      page.drawText(
        linha,
        {
          x:
            MARGEM +
            10,

          y:
            perguntaY,

          size:
            9.5,

          font,

          color:
            CORES.text,
        }
      );

      perguntaY -=
        12;
    }

    const cor =
      corResposta(
        resposta
      );

    const chipX =
      A4_WIDTH -
      MARGEM -
      chipWidth -
      10;

    const chipY =
      y -
      altura / 2 -
      8;

    page.drawRectangle({
      x:
        chipX,

      y:
        chipY,

      width:
        chipWidth,

      height:
        18,

      color:
        cor,

      opacity:
        0.12,

      borderColor:
        cor,

      borderWidth:
        0.8,
    });

    const larguraTexto =
      fontBold.widthOfTextAtSize(
        resposta,
        8.5
      );

    page.drawText(
      resposta,
      {
        x:
          chipX +
          (
            chipWidth -
            larguraTexto
          ) /
            2,

        y:
          chipY +
          5,

        size:
          8.5,

        font:
          fontBold,

        color:
          cor,
      }
    );

    y -=
      altura +
      5;
  }

  /*
   * ==========================================================
   * COMEÇA DOCUMENTO
   * ==========================================================
   */

  novaPagina();

  /*
   * ==========================================================
   * DADOS PRINCIPAIS
   * ==========================================================
   */

  tituloSecao(
    "Dados da execução"
  );

  linhaDupla(
    {
      titulo:
        "Plano",

      valor:
        normalizarTexto(
          dados.plano.titulo
        ),
    },

    {
      titulo:
        "Status",

      valor:
        formatarStatus(
          dados.status
        ),
    }
  );

  linhaDupla(
    {
      titulo:
        "Data programada",

      valor:
        formatarData(
          dados.dataProgramada
        ),
    },

    {
      titulo:
        "Periodicidade",

      valor:
        formatarFrequencia(
          dados.plano.frequencia
        ),
    }
  );

  linhaDupla(
    {
      titulo:
        "Setor",

      valor:
        normalizarTexto(
          dados.plano
            .setor?.nome
        ),
    },

    {
      titulo:
        "Máquina",

      valor:
        normalizarTexto(
          dados.plano
            .maquina?.nome
        ),
    }
  );

  linhaDupla(
    {
      titulo:
        "Prioridade",

      valor:
        formatarPrioridade(
          dados.plano
            .prioridade
        ),
    },

    {
      titulo:
        "Concluído por",

      valor:
        normalizarTexto(
          dados.concluidoPor
            ?.nome
        ),
    }
  );

  linhaDupla(
    {
      titulo:
        "Início real",

      valor:
        formatarDataHora(
          dados.dataInicio
        ),
    },

    {
      titulo:
        "Término real",

      valor:
        formatarDataHora(
          dados.dataConclusao
        ),
    }
  );

  linhaDupla(
    {
      titulo:
        "Duração prevista",

      valor:
        formatarDuracao(
          dados.duracaoEstimadaMinutos ??
            dados.plano
              .duracaoEstimadaMinutos
        ),
    },

    {
      titulo:
        "Duração real",

      valor:
        formatarDuracao(
          dados.duracaoRealMinutos
        ),
    }
  );

  /*
   * ==========================================================
   * RESPONSÁVEIS
   * ==========================================================
   */

  const responsaveis =
    dados.responsaveis &&
    dados.responsaveis.length >
      0
      ? dados.responsaveis
          .map(
            (
              responsavel
            ) =>
              responsavel
                .user.nome
          )
          .join(", ")
      : "-";

  campoGrande(
    "Responsáveis",
    responsaveis,
    52
  );

  /*
   * ==========================================================
   * SERVIÇO EXECUTADO
   * ==========================================================
   */

  campoGrande(
    "Serviço executado",

    normalizarTexto(
      dados.descricaoExecucao
    ),

    70
  );

  campoGrande(
    "Peças utilizadas",

    normalizarTexto(
      dados.pecasUtilizadas
    ),

    58
  );

  campoGrande(
    "Observações",

    normalizarTexto(
      dados.observacoes
    ),

    58
  );

  /*
   * ==========================================================
   * CHECKLIST
   * ==========================================================
   *
   * Reserva espaço para evitar o título ficar sozinho
   * no fim da página.
   */

  garantirEspaco(
    225
  );

  tituloSecao(
    "Checklist de encerramento"
  );

  linhaChecklist(
    "Foi verificada a quantidade de peças utilizadas?",

    normalizarChecklist(
      dados.checkQuantidadePecas
    )
  );

  linhaChecklist(
    "Todas as ferramentas utilizadas foram recolhidas?",

    normalizarChecklist(
      dados.checkFerramentasRecolhidas
    )
  );

  linhaChecklist(
    "O material reposto (peças) foi devidamente recolhido?",

    normalizarChecklist(
      dados.checkMaterialRepostoRecolhido
    )
  );

  linhaChecklist(
    "Foi realizada a limpeza após a manutenção?",

    normalizarChecklist(
      dados.checkLimpezaRealizada
    )
  );

  linhaChecklist(
    "A limpeza foi efetiva?",

    normalizarChecklist(
      dados.checkLimpezaEfetiva
    )
  );

  /*
   * ==========================================================
   * ASSINATURAS
   * ==========================================================
   */

  garantirEspaco(
    90
  );

  y -= 20;

  const larguraAssinatura =
    (
      A4_WIDTH -
      MARGEM * 2 -
      30
    ) /
    2;

  page.drawLine({
    start: {
      x:
        MARGEM,

      y,
    },

    end: {
      x:
        MARGEM +
        larguraAssinatura,

      y,
    },

    thickness:
      0.8,

    color:
      CORES.textSoft,
  });

  page.drawLine({
    start: {
      x:
        MARGEM +
        larguraAssinatura +
        30,

      y,
    },

    end: {
      x:
        A4_WIDTH -
        MARGEM,

      y,
    },

    thickness:
      0.8,

    color:
      CORES.textSoft,
  });

  page.drawText(
    "Responsável pela execução",
    {
      x:
        MARGEM,

      y:
        y - 15,

      size:
        8.5,

      font,

      color:
        CORES.textSoft,
    }
  );

  page.drawText(
    "Conferência / aprovação",
    {
      x:
        MARGEM +
        larguraAssinatura +
        30,

      y:
        y - 15,

      size:
        8.5,

      font,

      color:
        CORES.textSoft,
    }
  );

  /*
   * ==========================================================
   * RODAPÉ
   * ==========================================================
   *
   * Só desenhamos depois que TODAS as páginas existem.
   */

  const paginas =
    pdfDoc.getPages();

  paginas.forEach(
    (
      pagina,
      index
    ) => {
      pagina.drawLine({
        start: {
          x:
            MARGEM,

          y:
            42,
        },

        end: {
          x:
            A4_WIDTH -
            MARGEM,

          y:
            42,
        },

        thickness:
          0.7,

        color:
          CORES.border,
      });

      pagina.drawText(
        "Documento gerado automaticamente pelo Sistema de Manutenção - Sequoia",
        {
          x:
            MARGEM,

          y:
            25,

          size:
            7.5,

          font,

          color:
            CORES.textSoft,
        }
      );

      const paginaTexto =
        `Página ${
          index + 1
        } de ${
          paginas.length
        }`;

      const larguraPagina =
        font.widthOfTextAtSize(
          paginaTexto,
          7.5
        );

      pagina.drawText(
        paginaTexto,
        {
          x:
            (
              A4_WIDTH -
              larguraPagina
            ) /
            2,

          y:
            25,

          size:
            7.5,

          font,

          color:
            CORES.textSoft,
        }
      );

      const idCurto =
        dados.id.length >
        16
          ? `...${dados.id.slice(
              -13
            )}`
          : dados.id;

      const idTexto =
        `Execução: ${idCurto}`;

      const larguraId =
        font.widthOfTextAtSize(
          idTexto,
          7.5
        );

      pagina.drawText(
        idTexto,
        {
          x:
            A4_WIDTH -
            MARGEM -
            larguraId,

          y:
            25,

          size:
            7.5,

          font,

          color:
            CORES.textSoft,
        }
      );
    }
  );

  /*
   * ==========================================================
   * SALVA
   * ==========================================================
   */

  const bytes =
    await pdfDoc.save();

  return Buffer.from(
    bytes
  );
}