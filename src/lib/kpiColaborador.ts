export type OrdemParaDuracao = {
  registroFinal: string | null;
  duracaoExecucaoMinutos: number | null;
};

function normalizarData(
  valor: string
) {
  const texto = valor.trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      texto
    )
  ) {
    return texto;
  }

  const br =
    texto.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (!br) {
    return null;
  }

  return `${br[3]}-${br[2]}-${br[1]}`;
}

function extrairCampo(
  texto: string,
  rotulo: RegExp
) {
  const linha =
    texto.match(rotulo)?.[1];

  return linha?.trim() || null;
}


function criarDataHoraSaoPaulo(
  dataTexto: string,
  horaTexto?: string | null
) {
  const data =
    normalizarData(
      dataTexto
    );

  if (!data) {
    return null;
  }

  const hora =
    horaTexto?.trim() ||
    "12:00";

  const valor =
    new Date(
      `${data}T${hora.padStart(
        5,
        "0"
      )}:00-03:00`
    );

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return null;
  }

  return valor;
}

export function obterDataTerminoRelatorio(
  registroFinal:
    | string
    | null
    | undefined
) {
  const relatorio =
    registroFinal?.trim() ?? "";

  if (!relatorio) {
    return null;
  }

  const dataTerminoTexto =
    extrairCampo(
      relatorio,
      /Data\s+de\s+t[eé]rmino:\s*\n?\s*([^\n\r]+)/i
    );

  if (!dataTerminoTexto) {
    return null;
  }

  const horaTermino =
    extrairCampo(
      relatorio,
      /Hora\s+de\s+t[eé]rmino:\s*\n?\s*([0-2]?\d:[0-5]\d)/i
    );

  return criarDataHoraSaoPaulo(
    dataTerminoTexto,
    horaTermino
  );
}

export type OrdemParaDataConclusao = {
  registroFinal:
    | string
    | null;
  dataConclusao:
    | Date
    | string
    | null;
};

/**
 * Data oficial usada pelos KPIs de conclusão:
 * 1. Data/hora de término informada no relatório técnico;
 * 2. dataConclusao do banco como fallback.
 */
export function obterDataConclusaoKpi(
  os: OrdemParaDataConclusao
) {
  const peloRelatorio =
    obterDataTerminoRelatorio(
      os.registroFinal
    );

  if (peloRelatorio) {
    return peloRelatorio;
  }

  if (os.dataConclusao) {
    const fallback =
      new Date(
        os.dataConclusao
      );

    if (
      !Number.isNaN(
        fallback.getTime()
      )
    ) {
      return fallback;
    }
  }

  return null;
}

/**
 * Calcula a duração usando EXCLUSIVAMENTE os horários
 * informados no relatório técnico da OS.
 *
 * Exemplo esperado no registroFinal:
 *
 * Data de início:
 * 2026-10-30
 *
 * Hora de início:
 * 08:10
 *
 * Data de término:
 * 2026-10-30
 *
 * Hora de término:
 * 09:25
 */
export function obterDuracaoRelatorioMinutos(
  registroFinal:
    | string
    | null
    | undefined
) {
  const relatorio =
    registroFinal?.trim() ?? "";

  if (!relatorio) {
    return null;
  }

  const dataInicioTexto =
    extrairCampo(
      relatorio,
      /Data\s+de\s+in[ií]cio:\s*\n?\s*([^\n\r]+)/i
    );

  const horaInicio =
    extrairCampo(
      relatorio,
      /Hora\s+de\s+in[ií]cio:\s*\n?\s*([0-2]?\d:[0-5]\d)/i
    );

  const dataTerminoTexto =
    extrairCampo(
      relatorio,
      /Data\s+de\s+t[eé]rmino:\s*\n?\s*([^\n\r]+)/i
    );

  const horaTermino =
    extrairCampo(
      relatorio,
      /Hora\s+de\s+t[eé]rmino:\s*\n?\s*([0-2]?\d:[0-5]\d)/i
    );

  if (
    !dataInicioTexto ||
    !horaInicio ||
    !dataTerminoTexto ||
    !horaTermino
  ) {
    return null;
  }

  const inicio =
    criarDataHoraSaoPaulo(
      dataInicioTexto,
      horaInicio
    );

  const fim =
    criarDataHoraSaoPaulo(
      dataTerminoTexto,
      horaTermino
    );

  if (
    !inicio ||
    !fim
  ) {
    return null;
  }

  if (
    Number.isNaN(
      inicio.getTime()
    ) ||
    Number.isNaN(
      fim.getTime()
    ) ||
    fim.getTime() <=
      inicio.getTime()
  ) {
    return null;
  }

  return Math.round(
    (fim.getTime() -
      inicio.getTime()) /
      60000
  );
}

/**
 * Fonte principal: horários informados no relatório.
 * Fallback: duracaoExecucaoMinutos para registros antigos
 * que não possuam o bloco de horários no registroFinal.
 */
export function obterDuracaoKpiMinutos(
  os: OrdemParaDuracao
) {
  const peloRelatorio =
    obterDuracaoRelatorioMinutos(
      os.registroFinal
    );

  if (
    typeof peloRelatorio ===
      "number" &&
    peloRelatorio > 0
  ) {
    return peloRelatorio;
  }

  if (
    typeof os.duracaoExecucaoMinutos ===
      "number" &&
    os.duracaoExecucaoMinutos > 0
  ) {
    return os.duracaoExecucaoMinutos;
  }

  return null;
}

export function formatarDuracaoMinutos(
  minutos:
    | number
    | null
    | undefined
) {
  if (
    !minutos ||
    minutos <= 0
  ) {
    return "—";
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  const resto =
    minutos % 60;

  if (horas === 0) {
    return `${resto}min`;
  }

  if (resto === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${resto}min`;
}

export function fimDoDia(
  data: Date | string
) {
  const valor =
    new Date(data);

  valor.setHours(
    23,
    59,
    59,
    999
  );

  return valor;
}

export function formatarData(
  data:
    | Date
    | string
    | null
    | undefined
) {
  if (!data) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    new Date(data)
  );
}

export function statusOsLabel(
  status: string
) {
  const labels: Record<
    string,
    string
  > = {
    NAO_INICIADA:
      "Não iniciada",
    EM_ANDAMENTO:
      "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };

  return labels[status] ??
    status;
}

export function prioridadeOsLabel(
  prioridade: string
) {
  const labels: Record<
    string,
    string
  > = {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  return labels[
    prioridade
  ] ?? prioridade;
}

export function statusPreventivaLabel(
  status: string
) {
  const labels: Record<
    string,
    string
  > = {
    PROGRAMADA: "Programada",
    PENDENTE: "Pendente",
    EM_EXECUCAO:
      "Em execução",
    CONCLUIDA: "Concluída",
    NAO_REALIZADA:
      "Não realizada",
    CANCELADA: "Cancelada",
  };

  return labels[status] ??
    status;
}
