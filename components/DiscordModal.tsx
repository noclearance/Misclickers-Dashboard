import React, { useState } from 'react';
import { Shield, Check, Lock, User, ExternalLink, X, RefreshCw, AlertTriangle, Disc } from 'lucide-react';
import type { DiscordSessionUser } from '../types';

interface DiscordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: (user: DiscordSessionUser) => void;
}

export const DiscordModal: React.FC<DiscordModalProps> = ({ isOpen, onClose, onAuthorize }) => {
  const [username, setUsername] = useState<string>('');
  const [discordUserId, setDiscordUserId] = useState<string>('');
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState<number>(0);
  const [authStage, setAuthStage] = useState<'prompt' | 'authenticating' | 'success'>('prompt');
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);

  // Preset Discord avatars
  const avatarPresets = [
    'https://cdn.discordapp.com/embed/avatars/0.png',
    'https://cdn.discordapp.com/embed/avatars/1.png',
    'https://cdn.discordapp.com/embed/avatars/2.png',
    'https://cdn.discordapp.com/embed/avatars/3.png',
    'https://cdn.discordapp.com/embed/avatars/4.png',
    'https://cdn.discordapp.com/embed/avatars/5.png',
  ];

  if (!isOpen) return null;

  const handleStartAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setAuthStage('authenticating');
    setProgressPct(5);
    setProgressMsg('Initiating handshakes with discordapp.com...');

    const stages = [
      { pct: 25, msg: 'Resolving discord token exchanges...' },
      { pct: 50, msg: 'Querying guild user membership rosters...' },
      { pct: 75, msg: 'Linking Discord ID with active RuneLite databases...' },
      { pct: 100, msg: 'Generating local session authorizations...' }
    ];

    stages.forEach((step, index) => {
      setTimeout(() => {
        setProgressPct(step.pct);
        setProgressMsg(step.msg);

        if (step.pct === 100) {
          setTimeout(() => {
            setAuthStage('success');
            setTimeout(() => {
              onAuthorize({
                id: discordUserId.trim() || null,
                username: username.trim(),
                avatarUrl: avatarPresets[selectedAvatarIdx]
              });
              // Reset modal
              setAuthStage('prompt');
              setUsername('');
              setDiscordUserId('');
              onClose();
            }, 1200);
          }, 600);
        }
      }, (index + 1) * 600);
    });
  };

  return (
    <div id="discord-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      
      {/* Discord branding panel */}
      <div 
        id="discord-modal-body" 
        className="bg-[#313338] text-[#dbdee1] rounded-lg max-w-md w-full overflow-hidden shadow-2xl relative border border-gray-700/30"
      >
        
        {/* Top brand header */}
        <div className="bg-[#1e1f22] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-6 h-6 text-[#5865F2] animate-spin-slow" />
            <span className="font-sans font-black tracking-wide text-white uppercase text-sm">
              Discord OAuth Port
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors bg-[#2b2d31] p-1.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth prompt stage */}
        {authStage === 'prompt' && (
          <form onSubmit={handleStartAuth} className="p-6 space-y-6">
            
            {/* Permission checklist */}
            <div className="space-y-3 bg-[#2b2d31] p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#23a55a] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">MISCLICKERZ BOT</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                    Requests permission to sync your Discord identity with the RuneLite in-game client statistics.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-700/60 my-2 pt-2 space-y-1.5 text-[11px] text-gray-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#23a55a]" />
                  <span>Access your username and avatar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#23a55a]" />
                  <span>Know your active OSRS in-game world</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#23a55a]" />
                  <span>Transmit misclick logs into the Hall of Shame</span>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Discord Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. zezima_osrs"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-transparent focus:border-[#5865F2] rounded px-4 py-2.5 text-sm text-white outline-none transition-all placeholder-gray-500 font-sans"
                  />
                  <User className="w-4 h-4 text-gray-500 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Discord User ID (Snowflake)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 123456789012345678"
                  value={discordUserId}
                  onChange={(e) => setDiscordUserId(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-transparent focus:border-[#5865F2] rounded px-4 py-2.5 text-sm text-white outline-none transition-all placeholder-gray-500 font-mono"
                />
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Optional for basic access. Required for staff tools because staff mode is verified from this ID against <code>VITE_STAFF_DISCORD_IDS</code>.
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Choose Avatar Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {avatarPresets.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedAvatarIdx(idx)}
                      className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                        selectedAvatarIdx === idx 
                          ? 'border-[#5865F2] scale-110 shadow-lg' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full" />
                      {selectedAvatarIdx === idx && (
                        <div className="absolute inset-0 bg-[#5865F2]/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white font-bold" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Security disclaimer */}
            <div className="flex gap-2 text-[10px] text-gray-400 leading-relaxed bg-[#2b2d31]/40 p-2.5 rounded">
              <Lock className="w-4 h-4 text-[#5865F2] shrink-0 mt-0.5" />
              <span>
                Your login is mock-verified locally. We do not transmit passwords or personal data. 
                RuneLite in-game syncing is simulated in real time.
              </span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded text-xs font-semibold text-gray-300 hover:bg-gray-700/50 transition-all font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#5865F2] hover:bg-[#4752C4] active:scale-95 px-5 py-2 rounded text-xs font-semibold text-white font-sans transition-all flex items-center gap-1.5 shadow"
              >
                <span>Authorize</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </form>
        )}

        {/* Authenticating loader stage */}
        {authStage === 'authenticating' && (
          <div className="p-12 flex flex-col items-center justify-center text-center gap-5">
            <RefreshCw className="w-10 h-10 text-[#5865F2] animate-spin" />
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Connecting Discord Identity
              </h4>
              <p className="text-xs text-gray-400 font-mono italic max-w-xs leading-relaxed">
                {progressMsg}
              </p>
            </div>

            {/* Simulated progress bar */}
            <div className="w-full bg-[#1e1f22] h-1.5 rounded-full overflow-hidden max-w-xs border border-gray-800">
              <div 
                className="h-full bg-gradient-to-r from-[#5865F2] to-indigo-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-mono text-gray-500">{progressPct}% Complete</span>
          </div>
        )}

        {/* Success completion stage */}
        {authStage === 'success' && (
          <div className="p-12 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
            <div className="w-12 h-12 bg-[#23a55a]/10 text-[#23a55a] rounded-full border border-[#23a55a]/30 flex items-center justify-center animate-bounce shadow">
              <Check className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white font-sans">Verification Successful!</h4>
              <p className="text-xs text-[#23a55a] font-mono">Sync state: ACTIVE</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
