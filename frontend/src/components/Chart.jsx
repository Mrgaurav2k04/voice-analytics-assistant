import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function Chart({ chartData }) {
  if (!chartData || chartData.length === 0) {
    return <div className="text-slate-500 text-center p-10">No chart data loaded yet. Upload a CSV and speak a command.</div>;
  }

  return (
    <div className="w-full h-96 bg-slate-900 border border-slate-800 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
          <Legend />
          <Line type="monotone" dataKey="historical" stroke="#38bdf8" strokeWidth={2} name="Actual" dot={false} />
          <Line type="monotone" dataKey="imputed" stroke="#facc15" strokeWidth={2} name="Imputed Gaps" dot={true} />
          <Line type="monotone" dataKey="forecast" stroke="#4ade80" strokeWidth={2} name="Forecast" strokeDasharray="5 5" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}