"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface CubChartPoint {
  mesLabel: string;
  cub: number;
  desonerado: number;
}

function formatMoney(reais: number): string {
  return reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Gráfico de linha, últimos 12 meses — CUB m² e CUB m² desonerado (Sinduscon-ES). */
export function CubChart({ data }: { data: CubChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE4" />
        <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: "#5B6875" }} />
        <YAxis
          tick={{ fontSize: 11, fill: "#5B6875" }}
          tickFormatter={(value: number) => formatMoney(value)}
          width={80}
        />
        <Tooltip formatter={(value: number) => formatMoney(value)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="cub"
          name="CUB m²"
          stroke="#F26A21"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="desonerado"
          name="CUB m² desonerado"
          stroke="#1F5FA8"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
