import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Chart({ data }) {
  if (!data || data.length === 0) return (
    <div className="text-gray-400 text-center mt-10">No chart data available yet.</div>
  );

  return (
    <div className="h-96 w-full mt-8 bg-gray-900 p-4 rounded-lg shadow-lg">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} 
            itemStyle={{ color: '#E5E7EB' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
          
          {/* Blue for Historical */}
          <Line type="monotone" dataKey="historical" stroke="#3B82F6" strokeWidth={3} connectNulls name="Historical" />
          
          {/* Yellow Dashed for Imputed Gaps */}
          <Line type="monotone" dataKey="imputed" stroke="#EAB308" strokeWidth={3} strokeDasharray="5 5" connectNulls name="Imputed" />
          
          {/* Green for Forecast */}
          <Line type="monotone" dataKey="forecast" stroke="#22C55E" strokeWidth={3} connectNulls name="Forecast" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}