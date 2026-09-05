import React, { useState, useEffect } from 'react';
import { 
  Grid, Eye, CheckSquare, Award, HelpCircle, X, ShieldAlert, 
  Sparkles, Filter, CheckCircle2, UserCheck, Flame, Skull, 
  Bot, RefreshCw, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import { 
  getBingoTiles, 
  getClanMembers, 
  completeBingoTile, 
  resetBingoTile, 
  subscribeToBotEvents 
} from '../services/api';
import { BingoBoardSkeleton } from './skeletons/BingoProgressSkeleton';
import type { BingoTile, ClanMember } from '../types';

export const BingoBoard: React.FC = () => {
  const [boardTiles, setBoardTiles] = useState<BingoTile[]>([]);
  const [clanMembers, setClanMembers] = useState<ClanMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedTile, setSelectedTile] = useState<BingoTile | null>(null);
  const [completingMember, setCompletingMember] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Fetch live board and member data from Venny bot backend API
  const loadBingoData = async () => {
    try {
      const [tiles, members] = await Promise.all([
        getBingoTiles(),
        getClanMembers()
      ]);
      setBoardTiles(tiles);
      setClanMembers(members);
    } catch (err) {
      console.error("[BingoBoard] Error fetching live bingo board from backend:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBingoData();

    // Subscribe to live SSE events from Venny Discord Bot
    const unsubscribe = subscribeToBotEvents((event) => {
      if (event.type === 'bingo_update' || event.type === 'bingo_tile') {
        const updatedTile = event.data?.tile || event.data;
        if (updatedTile && updatedTile.id) {
          setBoardTiles(prev => prev.map(t => t.id === updatedTile.id ? { ...t, ...updatedTile } : t));
          if (updatedTile.completedBy) {
            setNotifications(prev => [
              `Venny Bot Synced: Tile #${updatedTile.id} completed by ${updatedTile.completedBy}!`, 
              ...prev.slice(0, 2)
            ]);
          } else {
            setNotifications(prev => [
              `Venny Bot Synced: Tile #${updatedTile.id} status updated.`,
              ...prev.slice(0, 2)
            ]);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Action: Complete tile via Venny backend API
  const handleMarkComplete = async (tileId: number) => {
    if (!completingMember) return;
    try {
      const res = await completeBingoTile(tileId, completingMember, proofUrl.trim() || undefined);

      if (res?.tile) {
        setBoardTiles(prev => prev.map(t => t.id === tileId ? res.tile : t));
        setSelectedTile(res.tile);
      } else {
        setBoardTiles(prev => prev.map(t => t.id === tileId ? { ...t, completedBy: completingMember, completedAt: 'Just now', proofUrl: proofUrl.trim() || undefined } : t));
      }
      
      setNotifications(prev => [`Bingo Tile #${tileId} verified for ${completingMember}!`, ...prev.slice(0, 2)]);
      setProofUrl('');
    } catch (e) {
      console.warn('Failed to submit tile completion to server:', e);
      setBoardTiles(prev => prev.map(t => t.id === tileId ? { ...t, completedBy: completingMember, completedAt: 'Just now' } : t));
    }
  };

  // Action: Reset tile state via backend API
  const handleResetTile = async (tileId: number) => {
    try {
      const res = await resetBingoTile(tileId);
      if (res?.tile) {
        setBoardTiles(prev => prev.map(t => t.id === tileId ? res.tile : t));
        setSelectedTile(res.tile);
      } else {
        setBoardTiles(prev => prev.map(t => t.id === tileId ? { ...t, completedBy: undefined, completedAt: undefined, proofUrl: undefined } : t));
        setSelectedTile(prev => prev && prev.id === tileId ? { ...prev, completedBy: undefined, completedAt: undefined, proofUrl: undefined } : prev);
      }
      setNotifications(prev => [`Reset Bingo Tile #${tileId} completion state.`, ...prev.slice(0, 2)]);
    } catch (e) {
      console.warn('Failed to reset tile on server:', e);
      setBoardTiles(prev => prev.map(t => t.id === tileId ? { ...t, completedBy: undefined, completedAt: undefined, proofUrl: undefined } : t));
      setSelectedTile(prev => prev && prev.id === tileId ? { ...prev, completedBy: undefined, completedAt: undefined, proofUrl: undefined } : prev);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadBingoData();
  };

  if (loading) {
    return <BingoBoardSkeleton />;
  }

  // Calculated variables
  const completedCount = boardTiles.filter(t => t.completedBy).length;
  const progressPercent = boardTiles.length > 0 ? Math.round((completedCount / boardTiles.length) * 100) : 0;

  // Apply filters
  const visibleTiles = boardTiles.map(tile => {
    const isCompleted = !!tile.completedBy;
    const hide = (filterMode === 'completed' && !isCompleted) || (filterMode === 'uncompleted' && isCompleted);
    return { ...tile, hide };
  });

  return (
    <div id="bingo-view" className="space-y-8 max-w-6xl mx-auto animate-fade-in cq-bingo-container">
      
      {/* Toast Alert Hub */}
      {notifications.length > 0 && (
        <div id="bingo-toasts" className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full">
          {notifications.map((note, index) => (
            <div
              key={index}
              className="bg-osrs-panelLight/95 border border-osrs-gold/20 text-osrs-gold text-xs py-3 px-4 rounded-xl flex items-center justify-between shadow-2xl backdrop-blur-md animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-osrs-gold shrink-0" />
                <span>{note}</span>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))} 
                className="text-gray-400 hover:text-osrs-gold font-bold ml-2.5 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Title Summary Panel */}
      <section id="bingo-summary" className="bg-osrs-panel border border-osrs-gold/15 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-glow-gold relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-osrs-gold/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-osrs-gold text-xs font-mono font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 text-osrs-gold animate-pulse" />
              <span>Misclickerss Summer Campaign</span>
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full">
              <Bot className="w-3 h-3 text-indigo-400" />
              <span>Venny Bot Synced</span>
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-black text-gray-150 tracking-wide">CLAN BINGO BOARD</h3>
          <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
            Tiles update in real time when clan members submit drop proofs via Discord bot commands (<code className="text-indigo-300 font-mono text-[11px]">/bingo</code>) or manual sign-off by leadership.
          </p>
        </div>

        {/* Progress bar */}
        <div id="bingo-progress" className="w-full md:w-72 bg-osrs-dark border border-osrs-gold/10 p-4 rounded-xl space-y-2.5 z-10 shrink-0">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-gray-400">Total Completed:</span>
            <span className="text-osrs-gold font-extrabold">{completedCount} / {boardTiles.length} Tiles</span>
          </div>
          <div className="w-full bg-osrs-panel h-2.5 rounded-full overflow-hidden border border-gray-850">
            <div 
              className="h-full bg-gradient-to-r from-osrs-gold to-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.35)] transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
            <span>{completedCount === 0 ? 'Fresh Board' : `${completedCount} Claimed`}</span>
            <span className="text-osrs-gold font-bold">{progressPercent}% Done</span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-osrs-gold flex items-center gap-1 transition-colors"
              title="Refresh Bingo Board"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </section>

      {/* Grid Filter Buttons */}
      <div id="bingo-controls" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-osrs-panel p-1 rounded-xl border border-osrs-gold/10">
          {(['all', 'completed', 'uncompleted'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all ${
                filterMode === mode
                  ? 'bg-osrs-panelLight border border-osrs-gold/20 text-osrs-gold shadow-glow-gold'
                  : 'text-gray-550 hover:text-gray-300 border-transparent'
              }`}
            >
              {mode === 'all' ? 'All Grid Tiles' : mode === 'completed' ? `Completed (${completedCount})` : `Outstanding (${boardTiles.length - completedCount})`}
            </button>
          ))}
        </div>

        <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
          <span>Discord Webhook: <code className="text-indigo-300">/api/bot/webhook [bingo_tile]</code></span>
        </div>
      </div>

      {/* 5x5 Bingo Grid Canvas */}
      <section id="bingo-grid" className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {visibleTiles.map((tile) => {
          const isCompleted = !!tile.completedBy;

          return (
            <button
              id={`bingo-tile-button-${tile.id}`}
              onClick={() => setSelectedTile(tile)}
              key={tile.id}
              className={`relative min-h-32 flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-200 group outline-none overflow-hidden ${
                tile.hide 
                  ? 'opacity-20 pointer-events-none scale-95' 
                  : 'hover:-translate-y-1 hover:scale-[1.01]'
              } ${
                isCompleted
                  ? 'bg-osrs-poison/10 border-osrs-poison/40 shadow-glow-poison hover:bg-osrs-poison/15'
                  : 'bg-osrs-panel border-osrs-gold/10 hover:border-osrs-gold/30 hover:bg-osrs-panelLight/45'
              }`}
            >
              {/* Completed background stamp logo */}
              {isCompleted && (
                <CheckCircle2 className="w-16 h-16 text-osrs-poison/10 absolute -bottom-2 -right-2 pointer-events-none" />
              )}

              {/* Top Tile Info Row */}
              <div className="flex justify-between items-center w-full z-10">
                <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${
                  isCompleted 
                    ? 'bg-osrs-poison/15 text-osrs-poison border-osrs-poison/25' 
                    : 'bg-osrs-gold/10 text-osrs-gold border-osrs-gold/20'
                }`}>
                  TILE {String(tile.id).padStart(2, '0')}
                </span>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-[9px] font-mono text-osrs-poison font-bold bg-osrs-poison/20 px-1.5 py-0.5 rounded border border-osrs-poison/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-osrs-poison animate-ping"></span>
                    CLAIMED
                  </span>
                )}
              </div>

              {/* Task Title */}
              <span className={`text-xs font-semibold leading-relaxed font-sans z-10 my-2 ${
                isCompleted ? 'text-gray-300 line-through' : 'text-gray-150'
              }`}>
                {tile.task}
              </span>

              {/* Done by banner */}
              <div className="w-full text-right truncate z-10 mt-auto">
                {isCompleted ? (
                  <span className="text-[10px] font-mono text-osrs-poison font-bold tracking-wide flex items-center justify-end gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>{tile.completedBy}</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-gray-500 group-hover:text-osrs-gold transition-colors">
                    Click to inspect / verify
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </section>

      {/* Detailed Modal Backdrop */}
      {selectedTile && (
        <div id="tile-modal-backdrop" className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            id="tile-modal-body" 
            className="bg-osrs-panel border border-osrs-gold/25 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative animate-fade-in"
          >
            {/* Modal header details */}
            <div className="p-6 border-b border-osrs-gold/15 bg-osrs-dark/40 relative">
              <button 
                id="close-tile-modal"
                onClick={() => { setSelectedTile(null); setCompletingMember(''); setProofUrl(''); }} 
                className="absolute right-4 top-4 text-gray-500 hover:text-osrs-gold transition-colors bg-osrs-panel border border-gray-800 p-2 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-[9px] font-mono uppercase text-osrs-gold tracking-widest mb-1 font-bold">
                Misclickerss Bingo Coordinator
              </div>
              <h4 className="text-lg font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-osrs-gold to-yellow-200">
                BINGO REQUIREMENT #{selectedTile.id}
              </h4>
            </div>

            {/* Modal Contents */}
            <div className="p-6 space-y-6">
              
              {/* Detailed specification display */}
              <div className="bg-osrs-dark border border-gray-850 p-4 rounded-xl space-y-2">
                <span className="text-[9px] text-gray-500 font-mono font-bold tracking-wider uppercase block">Objective</span>
                <p className="text-gray-200 text-xs font-semibold leading-relaxed font-sans">{selectedTile.task}</p>
              </div>

              {/* Verification engine */}
              {selectedTile.completedBy ? (
                <div className="space-y-4">
                  <div className="bg-osrs-poison/10 border border-osrs-poison/20 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-osrs-poison/10 rounded-xl border border-osrs-poison/25 text-osrs-poison shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] font-mono uppercase text-osrs-poison font-bold">Accomplished By</div>
                      <div className="text-sm font-bold text-gray-100">{selectedTile.completedBy}</div>
                      <div className="text-[9px] text-gray-500 font-mono italic">
                        {selectedTile.completedAt || 'Verified by clan leadership'}
                      </div>
                      {selectedTile.proofUrl && (
                        <a 
                          href={selectedTile.proofUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-1 text-[10px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1 underline truncate"
                        >
                          <LinkIcon className="w-2.5 h-2.5" />
                          <span>View Drop Proof</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    id="reset-tile-submission"
                    onClick={() => handleResetTile(selectedTile.id)}
                    className="w-full bg-osrs-crimson/10 hover:bg-osrs-crimson/20 border border-osrs-crimson/20 hover:border-osrs-crimson/30 text-osrs-crimson font-mono text-xs py-2.5 rounded-xl transition-all font-bold"
                  >
                    Reset Tile Completion State
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block font-bold">Assign Raider</label>
                    <select
                      id="assign-member-select"
                      value={completingMember}
                      onChange={(e) => setCompletingMember(e.target.value)}
                      className="w-full bg-osrs-dark border border-osrs-gold/15 focus:border-osrs-gold/45 rounded-xl px-4 py-2.5 text-xs text-gray-200 outline-none transition-all font-sans"
                    >
                      <option value="">-- Choose Clan Member --</option>
                      {clanMembers.map((member) => (
                        <option key={member.id} value={member.username}>
                          {member.username} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block font-bold">Proof URL / Screenshot (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://discord.com/channels/... or image link"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      className="w-full bg-osrs-dark border border-osrs-gold/15 focus:border-osrs-gold/45 rounded-xl px-4 py-2.5 text-xs text-gray-200 outline-none transition-all font-sans placeholder-gray-600"
                    />
                  </div>

                  <button
                    id="submit-tile-completion"
                    disabled={!completingMember}
                    onClick={() => handleMarkComplete(selectedTile.id)}
                    className="w-full bg-osrs-gold hover:bg-osrs-goldHover disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed font-sans text-xs uppercase font-extrabold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-osrs-dark"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Verify Achievement & Claim Tile
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
