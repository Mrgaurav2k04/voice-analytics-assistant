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
  const [resultMeta, setResultMeta] = useState(null);

  const handleUploadSuccess = (metadata) => {
    setDatasetMetadata(metadata);
    setError('');
    setChartData([]);
    setResultMeta(null);
    setQuery('');
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!datasetMetadata?.file_id || !query.trim()) return;
    
    setIsProcessing(true);
    setError('');
    console.log('[App] User query:', query);

    try {
      const response = await sendChat(query, datasetMetadata.file_id);
      
      const payload = response.chart_payload || {};
      
      // Map isolated arrays into a single unified array for Recharts
      const dataMap = new Map();
      
      const processArray = (arr, key) => {
        if (!Array.isArray(arr)) return;
        arr.forEach(item => {
          const time = item.timestamp;
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

      // Sort by timestamp if possible, assuming string ISO dates or numeric strings
      const mergedData = Array.from(dataMap.values()).sort((a, b) => {
        const aTime = isNaN(Number(a.date)) ? new Date(a.date).getTime() : Number(a.date);
        const bTime = isNaN(Number(b.date)) ? new Date(b.date).getTime() : Number(b.date);
        return aTime - bTime;
      });

      setChartData(mergedData);
      setResultMeta({
        model: payload.model,
        imputation_method: payload.imputation_method
      });
      setQuery('');
    } catch (err) {
      console.error('[App] Chat API failed:', err);
      setError(err.message || 'Failed to process chat query.');
    } finally {
      setIsProcessing(false);
    }
  };

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
            Upload your dataset and seamlessly explore your time-series data using natural language.
          </p>
        </header>
        
        {!datasetMetadata && (
          <div className="max-w-2xl mx-auto animate-float-slow">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {datasetMetadata && chartData.length === 0 && (
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
                    placeholder="e.g. Forecast Sales for the next 6 months..."
                    className="w-full bg-black/40 border border-spatial-glassBorder rounded-2xl py-4 pl-12 pr-4 text-white placeholder-spatial-textDim focus:outline-none focus:border-spatial-accent transition-colors"
                    disabled={isProcessing}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isProcessing || !query.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-spatial-accent to-spatial-purple text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Analyze'}
                </button>
              </form>
              {error && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
            </div>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                      {isProcessing ? 'Processing...' : 'Predict'}
                    </button>
                  </form>
                  {error && <p className="text-red-400 mt-4 text-xs text-center">{error}</p>}
                </div>
              </div>
              <div className="lg:col-span-3 flex flex-col gap-4">
                <div className="flex flex-wrap gap-4 text-sm font-['Outfit'] text-spatial-textDim px-4">
                  {resultMeta?.model && (
                    <div className="bg-white/5 border border-spatial-glassBorder rounded-full px-4 py-1.5 flex items-center gap-2">
                      <span className="text-spatial-accent">Model:</span>
                      <span className="text-white">{resultMeta.model}</span>
                    </div>
                  )}
                  {resultMeta?.imputation_method && resultMeta.imputation_method !== 'none' && (
                    <div className="bg-white/5 border border-spatial-glassBorder rounded-full px-4 py-1.5 flex items-center gap-2">
                      <span className="text-spatial-magenta">Imputation:</span>
                      <span className="text-white">{resultMeta.imputation_method}</span>
                    </div>
                  )}
                </div>
                <div className="bg-white/5 backdrop-blur-2xl border border-spatial-glassBorder p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] h-[500px] transition-all duration-500 hover:border-spatial-glassBorder/80">
                  <Chart data={chartData} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}