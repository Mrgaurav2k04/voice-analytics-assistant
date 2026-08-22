import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Chart({ data }) {
  if (!data || data.length === 0) return (
    <div className="text-spatial-textDim text-center mt-10 font-sans opacity-50">Awaiting telemetry data...</div>
  );

  // Pre-process data for Recharts range area
  // Recharts Area can take an array [bottom, top] for its data value
  const chartData = data.map(item => ({
    ...item,
    confidenceRange: item.forecast_lower != null && item.forecast_upper != null 
      ? [item.forecast_lower, item.forecast_upper] 
      : null
  }));

  return (
    <div className="h-full w-full p-2 relative">
      {/* Background ambient glow for chart */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-spatial-accent/5 rounded-full blur-[80px] pointer-events-none"></div>
      
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" vertical={false} />
          
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.3)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            dy={10}
          />
          
          <YAxis 
            stroke="rgba(255,255,255,0.3)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter' }}
            tickLine={false}
            axisLine={false}
            dx={-10}
            domain={['auto', 'auto']}
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(10, 10, 20, 0.8)', 
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '16px', 
              color: '#fff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }} 
            itemStyle={{ color: '#fff', fontFamily: 'Outfit', fontWeight: 500 }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontFamily: 'Inter', fontSize: '12px' }}
          />
          
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontFamily: 'Outfit', fontSize: '14px' }}
            iconType="circle"
          />

          {/* Confidence Interval Area */}
          <Area 
            type="monotone" 
            dataKey="confidenceRange" 
            fill="#8b5cf6" 
            stroke="none" 
            fillOpacity={0.15} 
            name="Confidence Bounds"
            connectNulls
          />
          
          {/* Spatial Accent (Cyan) for Historical */}
          <Line 
            type="monotone" 
            dataKey="historical" 
            stroke="#06b6d4" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2, className: 'drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]' }}
            connectNulls 
            name="Historical Data" 
            style={{ filter: 'drop-shadow(0px 4px 8px rgba(6, 182, 212, 0.4))' }}
          />
          
          {/* Magenta Dashed for Imputed Gaps */}
          <Line 
            type="monotone" 
            dataKey="imputed" 
            stroke="#ec4899" 
            strokeWidth={3} 
            strokeDasharray="6 6" 
            dot={{ r: 4, fill: '#ec4899', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }}
            connectNulls 
            name="Imputed Gap" 
            style={{ filter: 'drop-shadow(0px 0px 8px rgba(236, 72, 153, 0.6))' }}
          />
          
          {/* Purple for Forecast */}
          <Line 
            type="monotone" 
            dataKey="forecast" 
            stroke="#8b5cf6" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2, className: 'drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]' }}
            connectNulls 
            name="AI Forecast" 
            style={{ filter: 'drop-shadow(0px 4px 8px rgba(139, 92, 246, 0.4))' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}