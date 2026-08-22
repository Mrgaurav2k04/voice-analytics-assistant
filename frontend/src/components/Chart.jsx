import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, ScatterChart, Scatter, Cell } from 'recharts';

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

/**
 * Chart component that dynamically renders based on:
 * - payloadType: 'insight' | 'forecast'
 * - chartPayload: the raw chart_payload from the backend (contains x_column, y_column, visualization, etc.)
 * - userChartType: user-selected override ('auto', 'line', 'bar', 'area', 'pie', 'scatter')
 * - data: the processed chart data array
 */
export default function Chart({ data, payloadType = 'forecast', chartPayload = null, userChartType = 'auto' }) {
  if (!data || data.length === 0) return (
    <div className="text-spatial-textDim text-center mt-10 font-sans opacity-50">Awaiting data...</div>
  );

  // Determine chart type
  let finalChartType = userChartType;
  if (finalChartType === 'auto') {
    if (payloadType === 'forecast') {
      finalChartType = 'line';
    } else {
      finalChartType = chartPayload?.visualization || 'bar';
      if (finalChartType === 'auto') finalChartType = 'bar';
    }
  }

  const tooltipStyle = {
    contentStyle: { 
      backgroundColor: 'rgba(10, 10, 20, 0.8)', 
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)', 
      borderRadius: '16px', 
      color: '#fff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    },
    itemStyle: { color: '#fff', fontFamily: 'Outfit', fontWeight: 500 },
    labelStyle: { color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontFamily: 'Inter', fontSize: '12px' }
  };

  // ── FORECAST CHART ──
  if (payloadType === 'forecast') {
    const chartData = data.map(item => ({
      ...item,
      confidenceRange: item.forecast_lower != null && item.forecast_upper != null 
        ? [item.forecast_lower, item.forecast_upper] 
        : null
    }));

    const isIndexData = chartData.length > 0 && !isNaN(Number(chartData[0].date));

    return (
      <div className="h-full w-full p-2 relative">
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
              label={{ 
                value: isIndexData ? 'Observation' : 'Time', 
                position: 'insideBottomRight', 
                offset: -5,
                fill: 'rgba(255,255,255,0.5)',
                fontSize: 12
              }}
              tickFormatter={(val) => isIndexData ? `#${val}` : String(val).split(' ')[0]}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter' }}
              tickLine={false}
              axisLine={false}
              dx={-10}
              domain={['auto', 'auto']}
            />
            <Tooltip {...tooltipStyle} labelFormatter={(label) => isIndexData ? `Observation: ${label}` : `Time: ${label}`} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'Outfit', fontSize: '14px' }} iconType="circle" />
            <Area type="monotone" dataKey="confidenceRange" fill="#8b5cf6" stroke="none" fillOpacity={0.15} name="Confidence Bounds" connectNulls />
            <Line type="monotone" dataKey="historical" stroke="#06b6d4" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }} connectNulls name="Historical Data" />
            <Line type="monotone" dataKey="imputed" stroke="#ec4899" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 4, fill: '#ec4899', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }} connectNulls name="Imputed Gap" />
            <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} connectNulls name="AI Forecast" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // ── INSIGHT CHART ──
  // Dynamic axes from chart_payload
  const xKey = chartPayload?.x_column || Object.keys(data[0] || {})[0];
  const yKey = chartPayload?.y_column || Object.keys(data[0] || {})[1];

  const commonProps = {
    data,
    margin: { top: 20, right: 30, left: 10, bottom: 20 }
  };

  const xAxisProps = {
    dataKey: xKey,
    stroke: 'rgba(255,255,255,0.3)',
    tick: { fill: 'rgba(255,255,255,0.5)', fontSize: 12 },
    tickLine: false,
    axisLine: { stroke: 'rgba(255,255,255,0.1)' },
    dy: 10,
    label: { value: String(xKey), position: 'insideBottom', offset: -15, fill: 'rgba(255,255,255,0.5)', fontSize: 12 }
  };

  const yAxisProps = {
    stroke: 'rgba(255,255,255,0.3)',
    tick: { fill: 'rgba(255,255,255,0.5)', fontSize: 12 },
    tickLine: false,
    axisLine: false,
    dx: -10,
    label: { value: String(yKey), angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)', fontSize: 12 }
  };

  return (
    <div className="h-full w-full p-2 relative">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-spatial-purple/5 rounded-full blur-[80px] pointer-events-none"></div>
      <ResponsiveContainer width="100%" height="100%">
        {finalChartType === 'pie' ? (
          <PieChart>
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'Outfit', fontSize: '14px' }} iconType="circle" />
            <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={150} innerRadius={80} fill="#8b5cf6" paddingAngle={5} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        ) : finalChartType === 'scatter' ? (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} dataKey={yKey} />
            <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'Outfit', fontSize: '14px' }} iconType="circle" />
            <Scatter name={yKey} data={data} fill="#ec4899" />
          </ScatterChart>
        ) : finalChartType === 'area' ? (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'Outfit', fontSize: '14px' }} iconType="circle" />
            <Area type="monotone" dataKey={yKey} stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} strokeWidth={3} name={yKey} />
          </ComposedChart>
        ) : finalChartType === 'line' ? (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'Outfit', fontSize: '14px' }} iconType="circle" />
            <Line type="monotone" dataKey={yKey} stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} activeDot={{ r: 6 }} name={yKey} />
          </ComposedChart>
        ) : (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 10" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'Outfit', fontSize: '14px' }} iconType="circle" />
            <Bar dataKey={yKey} fill="#8b5cf6" radius={[4, 4, 0, 0]} name={yKey} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}