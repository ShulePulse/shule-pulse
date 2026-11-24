'use client';

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { GradeChartData } from '@/lib/pulse';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

export function GradeCharts({ subjects, lineData, termData }: GradeChartData) {
  if (lineData.length === 0) {
    return <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Hakuna alama bado.</p>;
  }
  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-3">
        <h2 className="mb-2 font-semibold">Maendeleo kwa kila somo (%)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={lineData} margin={{ top: 8, right: 12, bottom: 8, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {subjects.map((s, i) => (
                <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]} strokeWidth={2} connectNulls dot />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-3">
        <h2 className="mb-2 font-semibold">Wastani kwa muhula (%)</h2>
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <BarChart data={termData} margin={{ top: 8, right: 12, bottom: 8, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="term" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="average" name="Wastani" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
