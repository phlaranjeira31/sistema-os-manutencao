"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type GraficoItem = {
  label: string;
  criadas: number;
  concluidas: number;
};

type TooltipPayload = {
  dataKey?: string;
  value?: number | string;
};

function FluxoTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const criadas =
    Number(
      payload.find(
        (item) =>
          item.dataKey ===
          "criadas"
      )?.value ?? 0
    );

  const concluidas =
    Number(
      payload.find(
        (item) =>
          item.dataKey ===
          "concluidas"
      )?.value ?? 0
    );

  return (
    <div className="min-w-[150px] rounded-xl border border-white/[0.10] bg-[#050b18]/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[11px] font-black uppercase tracking-[0.11em] text-slate-400">
        {label}
      </p>

      <div className="mt-2.5 space-y-2">
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-2 text-[11px] font-bold text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Criadas
          </span>

          <strong className="text-sm font-black text-white">
            {criadas}
          </strong>
        </div>

        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-2 text-[11px] font-bold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Concluídas (relatório)
          </span>

          <strong className="text-sm font-black text-white">
            {concluidas}
          </strong>
        </div>
      </div>
    </div>
  );
}

function MiniResumo({
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
      className={`flex min-w-0 flex-col justify-center rounded-xl border px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-3 ${tones[tone]}`}
    >
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.09em] opacity-70">
          {label}
        </p>

        <p className="mt-0.5 text-[9px] font-semibold text-slate-500">
          mês atual
        </p>
      </div>

      <p className="mt-1 text-base font-black tracking-[-0.04em] text-white sm:mt-0 sm:text-xl">
        {signed && value > 0
          ? "+"
          : ""}
        {value}
      </p>
    </div>
  );
}

export default function DashboardFluxoOS({
  data,
  criadasMes,
  concluidasMes,
  saldoMes,
}: {
  data: GraficoItem[];
  criadasMes: number;
  concluidasMes: number;
  saldoMes: number;
}) {
  const saldoPositivo =
    saldoMes >= 0;

  return (
    <div className="grid min-h-[310px] grid-rows-[240px_auto] gap-2 sm:min-h-[350px] sm:grid-rows-[280px_auto] lg:h-full lg:min-h-0 lg:grid-rows-[minmax(0,1fr)_46px]">
      <div className="relative min-h-[240px] overflow-hidden rounded-xl border border-white/[0.04] bg-[linear-gradient(180deg,rgba(34,211,238,.025),rgba(2,6,23,.08))] px-1 pt-1 sm:min-h-[280px] lg:min-h-0">
        <div className="pointer-events-none absolute left-3 top-2 z-10 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,.6)]" />
            Criadas
          </span>

          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.5)]" />
            Concluídas
          </span>
        </div>

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <ComposedChart
            data={data}
            margin={{
              top: 20,
              right: 8,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="fluxoCriadasFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#22d3ee"
                  stopOpacity={0.22}
                />

                <stop
                  offset="75%"
                  stopColor="#22d3ee"
                  stopOpacity={0.025}
                />

                <stop
                  offset="100%"
                  stopColor="#22d3ee"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="rgba(148,163,184,.09)"
              strokeDasharray="3 5"
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 10,
                fontWeight: 700,
              }}
              tickMargin={9}
            />

            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={36}
              tick={{
                fill: "#475569",
                fontSize: 9,
                fontWeight: 700,
              }}
              domain={[
                0,
                (dataMax: number) =>
                  Math.max(
                    4,
                    Math.ceil(
                      dataMax * 1.18
                    )
                  ),
              ]}
            />

            <Tooltip
              content={
                <FluxoTooltip />
              }
              cursor={{
                stroke:
                  "rgba(148,163,184,.18)",
                strokeWidth: 1,
                strokeDasharray:
                  "4 4",
              }}
            />

            <Area
              type="monotone"
              dataKey="criadas"
              stroke="#22d3ee"
              strokeWidth={3}
              fill="url(#fluxoCriadasFill)"
              dot={{
                r: 3.5,
                fill: "#07101f",
                stroke:
                  "#22d3ee",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill:
                  "#22d3ee",
                stroke:
                  "#cffafe",
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={700}
            />

            <Line
              type="monotone"
              dataKey="concluidas"
              stroke="#34d399"
              strokeWidth={3}
              strokeDasharray="8 5"
              dot={{
                r: 3.5,
                fill: "#07101f",
                stroke:
                  "#34d399",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill:
                  "#34d399",
                stroke:
                  "#d1fae5",
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={850}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <MiniResumo
          label="Criadas"
          value={criadasMes}
          tone="cyan"
        />

        <MiniResumo
          label="Concluídas"
          value={concluidasMes}
          tone="green"
        />

        <MiniResumo
          label="Saldo"
          value={saldoMes}
          tone={
            saldoPositivo
              ? "green"
              : "orange"
          }
          signed
        />
      </div>
    </div>
  );
}
