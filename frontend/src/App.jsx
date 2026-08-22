import { useState } from 'react';
import FileUpload from './components/FileUpload';
import Chart from './components/Chart';
import { sendChat } from './services/api';
import { Search } from 'lucide-react';

export default function App() {
  const [datasetMetadata, setDatasetMetadata] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Stores the raw chart_payload from the backend
  const [chartPayload, setChartPayload] = useState(null);
  // Stores intent from the backend
  const [intentData, setIntentData] = useState(null);
  // User-selected chart type override
  const [chartType, setChartType] = useState('auto');

  const handleUploadSuccess = (uploadResponse) => {
    // uploadResponse = { file_id, filename, metadata: { rows, columns, ... } }
    setDatasetMetadata(uploadResponse);
    setError('');
    setChartData([]);
    setChartPayload(null);
    setIntentData(null);
    setQuery('');
    setChartType('auto');
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!datasetMetadata?.file_id || !query.trim()) return;
    
    setIsProcessing(true);
    setError('');

    try {
      const response = await sendChat(query, datasetMetadata.file_id);
      
      // Use chart_payload as the primary contract, fall back to insight_payload
      const payload = response.chart_payload || response.insight_payload || null;
      const intent = response.intent || {};
      
      setChartPayload(payload);
      setIntentData(intent);
      
      // Set initial chart type from the payload/intent visualization hint
      const vizHint = payload?.visualization || intent?.visualization || 'auto';
      setChartType(vizHint);
      
      if (!payload) {
        // No chart payload at all — show a text-only result
        setChartData([]);
      } else if (payload.type === 'single_value') {
        // Single value — no chart data needed, rendered as a KPI card
        setChartData([]);
      } else if (payload.type === 'insight') {
        // Insight — data is a flat array ready for Recharts
        setChartData(payload.data || []);
      } else {
        // Forecast — merge the separate arrays into a unified timeline
        const dataMap = new Map();
        
        const processArray = (arr, key) => {
          if (!Array.isArray(arr)) return;
          arr.forEach(item => {
            // The backend may use 'timestamp', 'date', 'Observation', or 'time'
            const time = item.timestamp ?? item.date ?? item.Observation ?? item.time;
            if (time === undefined || time === null) return;
            if (!dataMap.has(time)) {
              dataMap.set(time, { date: time });
            }
            dataMap.get(time)[key] = item.value;
          });
        };

        processArray(payload.historical, 'historical');
        processArray(payload.imputed, 'imputed');
        processArray(payload.forecast, 'forecast');
        processArray(payload.forecast_lower, 'forecast_lower');
        processArray(payload.forecast_upper, 'forecast_upper');

        const mergedData = Array.from(dataMap.values()).sort((a, b) => {
          const aTime = isNaN(Number(a.date)) ? new Date(a.date).getTime() : Number(a.date);
          const bTime = isNaN(Number(b.date)) ? new Date(b.date).getTime() : Number(b.date);
          return aTime - bTime;
        });

        setChartData(mergedData);
      }
      setQuery('');
    } catch (err) {
      console.error('[App] Chat API error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate a dynamic title from the intent
  const renderTitle = () => {
    if (!intentData) return null;
    const op = intentData.operation;
    if (op === 'insight') {
      const agg = intentData.aggregation ? intentData.aggregation.charAt(0).toUpperCase() + intentData.aggregation.slice(1) : '';
      const col = intentData.target_column || '';
      const gb = intentData.group_by ? ` by ${intentData.group_by}` : '';
      return `${agg} ${col}${gb}`.trim() || 'Dataset Insight';
    }
    if (op === 'forecast') {
      const col = intentData.target_column || 'Data';
      const hor = intentData.horizon ? ` — Next ${intentData.horizon}` : '';
      return `${col} Forecast${hor}`;
    }
    return 'Analytics Result';
  };

  // Determine what "type" the current result is for rendering logic
  const resultType = chartPayload?.type || intentData?.operation || null;
  const hasResult = chartPayload != null;

  return (
    <div className="min-h-screen text-spatial-text p-4 md:p-8 font-sans selection:bg-spatial-accent/30 selection:text-white relative overflow-hidden">
      
      {/* Background Animated Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-spatial-purple/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob z-0 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-spatial-accent/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 z-0 pointer-events-none"></div>
      <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-spatial-magenta/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000 z-0 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        <header className="mb-12 text-center pt-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-spatial-accent via-white to-spatial-purple mb-4 font-['Outfit'] drop-shadow-lg">
            Analytics Assistant
          </h1>
          <p className="text-spatial-textDim text-lg max-w-2xl mx-auto font-light">
            Upload your dataset and explore your data using natural language.
          </p>
        </header>
        
        {/* STATE 1: No dataset uploaded yet */}
        {!datasetMetadata && (
          <div className="max-w-2xl mx-auto animate-float-slow">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* STATE 2: Dataset uploaded, no results yet */}
        {datasetMetadata && !hasResult && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            <div className="transition-all duration-500 hover:scale-[1.02]">
              <FileUpload onUploadSuccess={handleUploadSuccess} metadata={datasetMetadata} />
            </div>
            <div className="flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-2xl rounded-3xl border border-spatial-glassBorder shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] h-full min-h-[400px]">
              
              <form onSubmit={handleTextSubmit} className="w-full flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-spatial-textDim" />
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask something about your data..."
                    className="w-full bg-black/40 border border-spatial-glassBorder rounded-2xl py-4 pl-12 pr-4 text-white placeholder-spatial-textDim focus:outline-none focus:border-spatial-accent transition-colors"
                    disabled={isProcessing}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isProcessing || !query.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-spatial-accent to-spatial-purple text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Analyzing your dataset...' : 'Analyze'}
                </button>
              </form>
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm w-full">
                  <span className="font-semibold">⚠ Unable to process your request.</span><br/>
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATE 3: Results are displayed */}
        {datasetMetadata && hasResult && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1 flex flex-col gap-8">
                <div className="flex-1 transition-all duration-500 hover:scale-[1.02]">
                  <FileUpload onUploadSuccess={handleUploadSuccess} metadata={datasetMetadata} />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-2xl rounded-3xl border border-spatial-glassBorder shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
                  <form onSubmit={handleTextSubmit} className="w-full flex flex-col gap-4">
                    <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask another question..."
                      className="w-full bg-black/40 border border-spatial-glassBorder rounded-xl py-3 px-4 text-white placeholder-spatial-textDim text-sm focus:outline-none focus:border-spatial-accent transition-colors"
                      disabled={isProcessing}
                    />
                    <button 
                      type="submit" 
                      disabled={isProcessing || !query.trim()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-spatial-accent to-spatial-purple text-white font-semibold text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50"
                    >
                      {isProcessing ? 'Analyzing...' : 'Analyze'}
                    </button>
                  </form>
                  {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-xs w-full">
                      <span className="font-semibold">⚠ Error:</span> {error}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Main Content */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                {/* Dynamic Title */}
                <h2 className="text-2xl font-bold text-white font-['Outfit'] px-2">{renderTitle()}</h2>
                
                {/* Metadata Tags */}
                <div className="flex flex-wrap gap-3 text-sm font-['Outfit'] text-spatial-textDim px-2 mb-2">
                  {intentData?.operation && (
                    <div className="bg-white/5 border border-spatial-glassBorder rounded-full px-4 py-1.5 flex items-center gap-2">
                      <span className="text-spatial-accent">Operation:</span>
                      <span className="text-white capitalize">{intentData.operation}</span>
                    </div>
                  )}
                  {intentData?.target_column && (
                    <div className="bg-white/5 border border-spatial-glassBorder rounded-full px-4 py-1.5 flex items-center gap-2">
                      <span className="text-spatial-purple">Column:</span>
                      <span className="text-white">{intentData.target_column}</span>
                    </div>
                  )}
                  {intentData?.aggregation && (
                    <div className="bg-white/5 border border-spatial-glassBorder rounded-full px-4 py-1.5 flex items-center gap-2">
                      <span className="text-spatial-magenta">Aggregation:</span>
                      <span className="text-white capitalize">{intentData.aggregation}</span>
                    </div>
                  )}
                  {intentData?.group_by && (
                    <div className="bg-white/5 border border-spatial-glassBorder rounded-full px-4 py-1.5 flex items-center gap-2">
                      <span className="text-spatial-accent">Grouped By:</span>
                      <span className="text-white">{intentData.group_by}</span>
                    </div>
                  )}
                  {chartPayload?.model && (
                    <div className="bg-white/5 border border-spatial-glassBorder rounded-full px-4 py-1.5 flex items-center gap-2">
                      <span className="text-spatial-accent">Model:</span>
                      <span className="text-white">{chartPayload.model}</span>
                    </div>
                  )}
                  {intentData?.horizon && (
                    <div className="bg-white/5 border border-spatial-glassBorder rounded-full px-4 py-1.5 flex items-center gap-2">
                      <span className="text-spatial-purple">Horizon:</span>
                      <span className="text-white">{intentData.horizon}</span>
                    </div>
                  )}
                  {chartPayload?.imputation_method && chartPayload.imputation_method !== 'none' && (
                    <div className="bg-white/5 border border-spatial-glassBorder rounded-full px-4 py-1.5 flex items-center gap-2">
                      <span className="text-spatial-magenta">Imputation:</span>
                      <span className="text-white">{chartPayload.imputation_method}</span>
                    </div>
                  )}
                  
                  {/* Chart Type Selector — not shown for single_value */}
                  {resultType !== 'single_value' && (
                    <div className="bg-white/5 border border-spatial-glassBorder rounded-full px-4 py-1.5 flex items-center gap-2 ml-auto">
                      <span className="text-spatial-textDim">Chart:</span>
                      <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        className="bg-transparent text-white focus:outline-none focus:text-spatial-accent font-medium cursor-pointer appearance-none pr-4"
                      >
                        <option value="auto" className="bg-spatial-bg">Auto</option>
                        <option value="line" className="bg-spatial-bg">Line</option>
                        <option value="bar" className="bg-spatial-bg">Bar</option>
                        <option value="area" className="bg-spatial-bg">Area</option>
                        <option value="pie" className="bg-spatial-bg">Pie</option>
                        <option value="scatter" className="bg-spatial-bg">Scatter</option>
                      </select>
                    </div>
                  )}
                </div>
                
                {/* Chart / KPI Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-spatial-glassBorder p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] h-[500px] transition-all duration-500 flex flex-col justify-center">
                  {resultType === 'single_value' ? (
                    <div className="text-center">
                      <p className="text-spatial-textDim text-xl mb-4 font-['Outfit'] tracking-wide uppercase">
                        {chartPayload.label || renderTitle()}
                      </p>
                      <p className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-spatial-accent to-spatial-purple drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                        {typeof chartPayload.value === 'number' ? chartPayload.value.toLocaleString() : chartPayload.value}
                      </p>
                    </div>
                  ) : (
                    <Chart 
                      data={chartData} 
                      payloadType={resultType === 'insight' ? 'insight' : 'forecast'} 
                      chartPayload={chartPayload} 
                      userChartType={chartType} 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}