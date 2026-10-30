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

  const dataInicio =
    normalizarData(
      dataInicioTexto
    );

  const dataTermino =
    normalizarData(
      dataTerminoTexto
    );

  if (
    !dataInicio ||
    !dataTermino
  ) {
    return null;
  }

  const inicio =
    new Date(
      `${dataInicio}T${horaInicio.padStart(
        5,
        "0"
      )}:00-03:00`
    );

  const fim =
    new Date(
      `${dataTermino}T${horaTermino.padStart(
        5,
        "0"
      )}:00-03:00`
    );

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
