type DadosMensais = {
  label: string;
  ano: string;
  quantidade: number;
  concluidas: number;
  abertas: number;
};

type DadosPrioridade = {
  label: string;
  valor: number;
  cor: string;
};

type DadosSemana = {
  label: string;
  valor: number;
};

type Props = {
  status: {
    naoIniciadas: number;
    emAndamento: number;
    concluidas: number;
    canceladas: number;
  };
  taxaResolucao: number;
  dadosMensais: DadosMensais[];
  dadosPrioridade: DadosPrioridade[];
  dadosSemana: DadosSemana[];
};

const CORES_STATUS = [
  {
    label: "Não iniciadas",
    chave: "naoIniciadas" as const,
    cor: "#facc15",
  },
  {
    label: "Em andamento",
    chave: "emAndamento" as const,
    cor: "#22d3ee",
  },
  {
    label: "Concluídas",
    chave: "concluidas" as const,
    cor: "#34d399",
  },
  {
    label: "Canceladas",
    chave: "canceladas" as const,
    cor: "#f87171",
  },
];

export default function GraficosMaquina({
  status,
  taxaResolucao,
  dadosMensais,
  dadosPrioridade,
  dadosSemana,
}: Props) {
  const totalStatus = Object.values(status).reduce(
    (soma, valor) => soma + valor,
    0
  );

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <GraficoStatus
        status={status}
        total={totalStatus}
        taxaResolucao={taxaResolucao}
      />

      <GraficoLinha dados={dadosMensais} />

      <GraficoPrioridade dados={dadosPrioridade} />

      <GraficoSemana dados={dadosSemana} />
    </section>
  );
}

function GraficoStatus({
  status,
  total,
  taxaResolucao,
}: {
  status: Props["status"];
  total: number;
  taxaResolucao: number;
}) {
  const raio = 78;
  const circunferencia = 2 * Math.PI * raio;

  let acumulado = 0;

  const segmentos = CORES_STATUS.map((item) => {
    const valor = status[item.chave];
    const tamanho =
      total > 0 ? (valor / total) * circunferencia : 0;

    const segmento = {
      ...item,
      valor,
      tamanho,
      offset: -acumulado,
    };

    acumulado += tamanho;

    return segmento;
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-black">Distribuição por status</h2>
        <p className="text-sm text-slate-400">
          Visão percentual da situação atual das OS.
        </p>
      </div>

      <div className="grid items-center gap-6 md:grid-cols-[230px_1fr]">
        <div className="relative mx-auto h-[220px] w-[220px]">
          <svg
            viewBox="0 0 220 220"
            className="h-full w-full -rotate-90"
            role="img"
            aria-label="Gráfico de distribuição por status"
          >
            <circle
              cx="110"
              cy="110"
              r={raio}
              fill="none"
              stroke="#1e293b"
              strokeWidth="26"
            />

            {segmentos.map((segmento) => (
              <circle
                key={segmento.label}
                cx="110"
                cy="110"
                r={raio}
                fill="none"
                stroke={segmento.cor}
                strokeWidth="26"
                strokeLinecap="butt"
                strokeDasharray={`${segmento.tamanho} ${
                  circunferencia - segmento.tamanho
                }`}
                strokeDashoffset={segmento.offset}
              >
                <title>
                  {segmento.label}: {segmento.valor}
                </title>
              </circle>
            ))}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-white">
              {taxaResolucao}%
            </span>
            <span className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-300">
              resolução
            </span>
            <span className="mt-1 text-xs font-semibold text-slate-500">
              {total} OS no total
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
          {segmentos.map((segmento) => {
            const percentual =
              total > 0
                ? Math.round((segmento.valor / total) * 100)
                : 0;

            return (
              <div
                key={segmento.label}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#050816] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: segmento.cor }}
                  />

                  <span className="text-sm font-bold text-slate-300">
                    {segmento.label}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-white">
                    {segmento.valor}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    {percentual}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GraficoLinha({ dados }: { dados: DadosMensais[] }) {
  const largura = 760;
  const altura = 280;
  const margemEsquerda = 42;
  const margemDireita = 18;
  const margemTopo = 24;
  const margemBaixo = 48;

  const larguraUtil = largura - margemEsquerda - margemDireita;
  const alturaUtil = altura - margemTopo - margemBaixo;

  const maior = Math.max(
    ...dados.map((item) => item.quantidade),
    1
  );

  const pontos = dados.map((item, index) => {
    const x =
      margemEsquerda +
      (index / Math.max(1, dados.length - 1)) * larguraUtil;

    const y =
      margemTopo +
      alturaUtil -
      (item.quantidade / maior) * alturaUtil;

    return {
      ...item,
      x,
      y,
    };
  });

  const linha = pontos
    .map(
      (ponto, index) =>
        `${index === 0 ? "M" : "L"} ${ponto.x} ${ponto.y}`
    )
    .join(" ");

  const area =
    pontos.length > 0
      ? `${linha} L ${pontos[pontos.length - 1].x} ${
          margemTopo + alturaUtil
        } L ${pontos[0].x} ${margemTopo + alturaUtil} Z`
      : "";

  return (
    <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-black">Evolução das OS</h2>
        <p className="text-sm text-slate-400">
          Chamados registrados nos últimos 12 meses.
        </p>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-[#050816]">
        <svg
          viewBox={`0 0 ${largura} ${altura}`}
          className="min-w-[760px]"
          role="img"
          aria-label="Gráfico de evolução mensal das ordens de serviço"
        >
          <defs>
            <linearGradient
              id="areaMaquina"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((indice) => {
            const y =
              margemTopo + (indice / 4) * alturaUtil;

            const valor = Math.round(maior - (indice / 4) * maior);

            return (
              <g key={indice}>
                <line
                  x1={margemEsquerda}
                  x2={largura - margemDireita}
                  y1={y}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                />

                <text
                  x={margemEsquerda - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  {valor}
                </text>
              </g>
            );
          })}

          {area && <path d={area} fill="url(#areaMaquina)" />}

          {linha && (
            <path
              d={linha}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {pontos.map((ponto) => (
            <g key={`${ponto.label}-${ponto.ano}`}>
              <circle
                cx={ponto.x}
                cy={ponto.y}
                r="6"
                fill="#050816"
                stroke="#22d3ee"
                strokeWidth="4"
              >
                <title>
                  {ponto.label}/{ponto.ano}: {ponto.quantidade} OS
                </title>
              </circle>

              <text
                x={ponto.x}
                y={ponto.y - 13}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#ffffff"
              >
                {ponto.quantidade}
              </text>

              <text
                x={ponto.x}
                y={altura - 25}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#94a3b8"
              >
                {ponto.label}
              </text>

              <text
                x={ponto.x}
                y={altura - 11}
                textAnchor="middle"
                fontSize="9"
                fill="#475569"
              >
                {ponto.ano}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          Total de OS criadas
        </span>

        <span>
          Passe o mouse sobre os pontos para visualizar o valor.
        </span>
      </div>
    </div>
  );
}

function GraficoPrioridade({
  dados,
}: {
  dados: DadosPrioridade[];
}) {
  const maior = Math.max(...dados.map((item) => item.valor), 1);
  const total = dados.reduce((soma, item) => soma + item.valor, 0);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-black">Chamados por prioridade</h2>
        <p className="text-sm text-slate-400">
          Distribuição do nível de criticidade das ocorrências.
        </p>
      </div>

      <div className="space-y-5">
        {dados.map((item) => {
          const largura =
            item.valor > 0
              ? Math.max(5, (item.valor / maior) * 100)
              : 0;

          const percentual =
            total > 0 ? Math.round((item.valor / total) * 100) : 0;

          return (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.cor }}
                  />

                  <span className="text-sm font-bold text-slate-300">
                    {item.label}
                  </span>
                </div>

                <span className="text-sm font-black text-white">
                  {item.valor} ({percentual}%)
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${largura}%`,
                    backgroundColor: item.cor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GraficoSemana({ dados }: { dados: DadosSemana[] }) {
  const maior = Math.max(...dados.map((item) => item.valor), 1);
  const total = dados.reduce((soma, item) => soma + item.valor, 0);

  const diaMaisCritico = dados.reduce(
    (maiorDia, atual) =>
      atual.valor > maiorDia.valor ? atual : maiorDia,
    dados[0] ?? { label: "-", valor: 0 }
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-black">Ocorrências por dia</h2>
        <p className="text-sm text-slate-400">
          Dias da semana com maior volume de chamados.
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dados.map((item) => {
          const intensidade =
            item.valor > 0
              ? 0.2 + (item.valor / maior) * 0.8
              : 0.08;

          return (
            <div key={item.label} className="min-w-0 text-center">
              <div
                className="flex h-24 flex-col items-center justify-center rounded-2xl border border-cyan-400/10"
                style={{
                  backgroundColor: `rgba(34, 211, 238, ${intensidade})`,
                }}
                title={`${item.label}: ${item.valor} OS`}
              >
                <span className="text-xl font-black text-white">
                  {item.valor}
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-950/80">
                  OS
                </span>
              </div>

              <p className="mt-2 truncate text-xs font-bold text-slate-400">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Dia mais crítico
          </p>
          <p className="mt-2 text-xl font-black text-cyan-300">
            {diaMaisCritico.label}
          </p>
          <p className="text-xs font-semibold text-slate-400">
            {diaMaisCritico.valor} ocorrência(s)
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#050816] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Total analisado
          </p>
          <p className="mt-2 text-xl font-black text-white">{total}</p>
          <p className="text-xs font-semibold text-slate-400">
            ocorrência(s) no período
          </p>
        </div>
      </div>
    </div>
  );
}
