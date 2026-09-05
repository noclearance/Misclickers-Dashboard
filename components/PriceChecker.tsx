import React, { useState, useEffect } from 'react';
import { Search, Info, TrendingUp, AlertCircle, Sparkles, Coins, HelpCircle } from 'lucide-react';
import { searchGePrice } from '../services/api';
import type { OsrsItem } from '../types';

export const PriceChecker: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchedItem, setSearchedItem] = useState<OsrsItem | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<string>('');

  // Premium game recommendations
  const recommendedItems = [
    { name: 'Twisted Bow', term: 'twisted bow' },
    { name: 'Dragon Claws', term: 'dragon claws' },
    { name: 'Armadyl Godsword', term: 'armadyl godsword' },
    { name: 'Bandos Chestplate', term: 'bandos chestplate' },
    { name: 'Elysian Spirit Shield', term: 'elysian spirit shield' }
  ];

  // Price Query Logic
  const queryPrice = async (term: string) => {
    if (!term.trim()) return;
    setSearching(true);
    setAlertMsg('');
    try {
      const result = await searchGePrice(term);
      if (result) {
        setSearchedItem(result);
      } else {
        setSearchedItem(null);
        setAlertMsg(`Item "${term}" not found. Try search suggestions below.`);
      }
    } catch (err) {
      console.error(err);
      setAlertMsg('Could not establish connection to the Grand Exchange database.');
    } finally {
      setSearching(false);
    }
  };

  // Initially load Twisted Bow
  useEffect(() => {
    queryPrice('twisted bow');
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    queryPrice(searchTerm);
  };

  // 1% OSRS Game Tax cap at 5M GP
  const getOsrsTax = (price: number) => {
    const calculated = Math.floor(price * 0.01);
    return Math.min(5_000_000, calculated);
  };

  const highPrice = searchedItem?.high || 0;
  const lowPrice = searchedItem?.low || 0;
  const margin = Math.max(0, highPrice - lowPrice);
  const geTax = getOsrsTax(highPrice);
  const netMargin = Math.max(0, margin - geTax);

  // Simulated 5-day price history
  const mockTrendPoints = searchedItem 
    ? [
        { day: 'Day 1', price: lowPrice - 3_500_000 },
        { day: 'Day 2', price: lowPrice - 1_200_000 },
        { day: 'Day 3', price: lowPrice + 1_800_000 },
        { day: 'Day 4', price: lowPrice - 400_000 },
        { day: 'Day 5', price: highPrice }
      ]
    : [];

  // Plotting calculations for SVG graph
  const svgWidth = 500;
  const svgHeight = 150;
  const paddingX = 35;
  const paddingY = 25;

  const minPrice = mockTrendPoints.length > 0 ? Math.min(...mockTrendPoints.map(p => p.price)) * 0.999 : 0;
  const maxPrice = mockTrendPoints.length > 0 ? Math.max(...mockTrendPoints.map(p => p.price)) * 1.001 : 1;
  const valRange = maxPrice - minPrice || 1;

  const plotCoordinates = mockTrendPoints.map((pt, index) => {
    const x = paddingX + (index * (svgWidth - paddingX * 2)) / (mockTrendPoints.length - 1);
    const y = svgHeight - paddingY - ((pt.price - minPrice) / valRange) * (svgHeight - paddingY * 2);
    return { x, y };
  });

  const pathD = plotCoordinates.reduce((path, pt, idx) => {
    return path + `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
  }, '');

  return (
    <div id="price-checker-view" className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      
      {/* GE Badge Header */}
      <section id="ge-badge" className="bg-osrs-panel border border-osrs-gold/15 p-5 rounded-2xl flex items-center justify-between shadow-glow-gold relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-osrs-gold/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 text-osrs-gold text-xs font-mono font-bold uppercase tracking-wider">
            <Coins className="w-4 h-4 text-osrs-gold animate-bounce" />
            <span>Grand Exchange Live Index</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-black text-gray-150 tracking-wide">GRAND EXCHANGE TRACKER</h3>
          <p className="text-xs text-gray-400 max-w-xl">
            Query standard OSRS items to calculate transaction tax caps and discover lucrative flipping margins.
          </p>
        </div>
        <div className="hidden sm:block text-right z-10 bg-osrs-dark/50 border border-osrs-gold/15 px-4 py-2 rounded-xl">
          <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest font-bold">Trading Tax Rule</span>
          <p className="text-xs text-osrs-gold font-mono font-extrabold mt-0.5">1% (Max 5,000,000 GP)</p>
        </div>
      </section>

      {/* Grid: Search Side Deck & Result Deck */}
      <div id="price-checker-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Search side (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-osrs-panel border border-osrs-gold/10 p-5 rounded-2xl space-y-5">
            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block font-bold">Item Database Search</label>
              <div className="relative">
                <input 
                  type="text"
                  id="ge-search-input"
                  placeholder="e.g. Twisted Bow..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-osrs-dark border border-osrs-gold/15 focus:border-osrs-gold/45 rounded-xl pl-10 pr-4 py-3 text-xs text-gray-200 outline-none transition-all placeholder-gray-550 font-mono font-medium"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              </div>

              <button 
                id="submit-ge-query"
                type="submit"
                disabled={searching}
                className="w-full bg-osrs-gold hover:bg-osrs-goldHover disabled:bg-gray-800 text-osrs-dark font-sans text-xs uppercase font-extrabold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {searching ? 'QUERIES IN PROGRESS...' : 'EXECUTE INDEX SEARCH'}
              </button>
            </form>

            {alertMsg && (
              <div className="bg-osrs-crimson/10 border border-osrs-crimson/25 rounded-xl p-3 flex gap-2.5 text-osrs-crimson text-xs font-mono leading-relaxed animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{alertMsg}</span>
              </div>
            )}

            {/* Quick selectors list */}
            <div className="space-y-3">
              <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider block font-bold">QUICK SHORTCUTS</span>
              <div className="flex flex-col gap-2">
                {recommendedItems.map((rec, i) => (
                  <button
                    id={`recommendation-${i}`}
                    key={rec.term}
                    onClick={() => { setSearchTerm(rec.name); queryPrice(rec.term); }}
                    className="w-full text-left bg-osrs-dark/60 hover:bg-osrs-gold/5 border border-osrs-gold/5 hover:border-osrs-gold/20 text-xs text-gray-450 hover:text-osrs-gold px-3 py-2.5 rounded-xl transition-all font-mono flex items-center justify-between"
                  >
                    <span>{rec.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">»</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Display (8 cols) */}
        <div className="lg:col-span-8">
          {searchedItem ? (
            <div className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl shadow-xl overflow-hidden divide-y divide-osrs-gold/10">
              
              {/* Top summary display */}
              <div className="p-6 bg-osrs-panelLight/30 flex items-center gap-4">
                <div className="w-16 h-16 bg-osrs-dark border border-osrs-gold/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-2xl font-serif font-black text-osrs-gold">{searchedItem.name[0]}</span>
                </div>
                <div>
                  <div className="text-[9px] font-mono uppercase text-gray-500 tracking-wider">Indexed Database Result</div>
                  <h4 className="text-lg font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-osrs-gold to-yellow-250 leading-tight">
                    {searchedItem.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">Grand Exchange Asset ID: #{searchedItem.id}</p>
                </div>
              </div>

              {/* High / Low Instas */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Instabuy / Instasell pricing decks */}
                <div className="space-y-4">
                  <div className="bg-osrs-dark border border-osrs-gold/5 p-4 rounded-xl relative overflow-hidden">
                    <span className="text-[10px] text-osrs-poison font-mono uppercase tracking-wider font-bold">Instabuy Price (High Offer)</span>
                    <strong className="text-base font-mono text-gray-100 tracking-tight block mt-1">
                      {highPrice.toLocaleString()} <span className="text-[10px] text-osrs-gold font-bold">GP</span>
                    </strong>
                    <span className="text-[9px] text-gray-500 block mt-0.5">Top registered buy offer on grand exchange</span>
                  </div>

                  <div className="bg-osrs-dark border border-osrs-gold/5 p-4 rounded-xl relative overflow-hidden">
                    <span className="text-[10px] text-osrs-crimson font-mono uppercase tracking-wider font-bold">Instasell Price (Low Offer)</span>
                    <strong className="text-base font-mono text-gray-100 tracking-tight block mt-1">
                      {lowPrice.toLocaleString()} <span className="text-[10px] text-osrs-gold font-bold">GP</span>
                    </strong>
                    <span className="text-[9px] text-gray-500 block mt-0.5">Top registered sell offer on grand exchange</span>
                  </div>
                </div>

                {/* Margins desk */}
                <div className="bg-osrs-gold/5 border border-osrs-gold/20 p-5 rounded-xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-osrs-gold text-xs font-mono font-bold uppercase tracking-wider">
                      <TrendingUp className="w-4 h-4 text-osrs-gold animate-bounce" />
                      <span>Flip Margin Analytics</span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono pt-2">
                      <div className="flex justify-between text-gray-400">
                        <span>Raw Margin:</span>
                        <span className="text-gray-200">+{margin.toLocaleString()} GP</span>
                      </div>
                      <div className="flex justify-between text-gray-400 border-b border-osrs-gold/5 pb-2">
                        <span>GE Sales Tax (1%):</span>
                        <span className="text-osrs-crimson">-{geTax.toLocaleString()} GP</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider block font-bold">Net Profit Potential (Tax Deducted)</span>
                    <strong className="text-lg font-mono text-osrs-poison tracking-tight block mt-0.5">
                      +{netMargin.toLocaleString()} GP
                    </strong>
                  </div>
                </div>

              </div>

              {/* Graphing history line index */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <TrendingUp className="w-3.5 h-3.5 text-osrs-gold" /> Price Index Trajectory
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">Simulated 24-Hour price resolutions</span>
                </div>

                {/* Area SVG graph */}
                <div className="relative bg-osrs-dark border border-gray-850 rounded-xl p-3 h-44 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                    
                    {/* Background grid lines */}
                    <line x1="0" y1="25" x2={svgWidth} y2="25" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                    <line x1="0" y1="75" x2={svgWidth} y2="75" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                    <line x1="0" y1="125" x2={svgWidth} y2="125" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />

                    {/* Gradient under curve */}
                    <path
                      d={`${pathD} L ${plotCoordinates[plotCoordinates.length - 1].x} ${svgHeight - paddingY} L ${plotCoordinates[0].x} ${svgHeight - paddingY} Z`}
                      fill="url(#trend-gradient)"
                      opacity="0.1"
                    />

                    {/* High-contrast curve line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Bullet pointer dots */}
                    {plotCoordinates.map((pt, idx) => (
                      <g key={idx} className="group/dot cursor-pointer">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill="#0f111a"
                          stroke="#eab308"
                          strokeWidth="2"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          fill="#eab308"
                          fontSize="9"
                          fontFamily="monospace"
                          className="opacity-0 group-hover/dot:opacity-100 transition-opacity font-bold"
                        >
                          {(mockTrendPoints[idx].price / 1_000_000).toFixed(1)}M
                        </text>
                      </g>
                    ))}

                    {/* SVG Gradient Def */}
                    <defs>
                      <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Days legend */}
                <div className="flex justify-between px-8 text-[9px] text-gray-500 font-mono">
                  {mockTrendPoints.map((pt) => (
                    <span key={pt.day} className="font-bold">{pt.day.toUpperCase()}</span>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-osrs-panel border border-osrs-gold/10 rounded-2xl h-96 flex flex-col items-center justify-center text-center p-6 gap-3">
              <Info className="w-8 h-8 text-osrs-gold/40" />
              <p className="text-gray-400 font-mono text-xs max-w-sm">
                No active Item chosen. Select standard shortcuts or execute database searches to query Grand Exchange data.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
