import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Check, Lock, X, Disc, AlertTriangle, ExternalLink } from 'lucide-react';

interface DiscordModalProps {
  isOpen: boolean;
  onClose: () => void;
  authError?: string | null;
}

const ERROR_COPY: Record<string, string> = {
  denied: 'Discord authorization was denied. You can try again when ready.',
  not_in_guild: "You're not in the Misclickerz Discord.",
  verify_failed: "We couldn't verify your membership — try again or ping staff.",
  missing_env: "Discord login isn't fully set up yet. Please try again later or ping staff.",
  redirect_mismatch: "Discord login isn't configured for this site yet. Please ping staff.",
  state: 'Login session expired. Please try Login with Discord again.',
  token: 'Discord login failed. Please try again in a moment.',
  unknown: 'Login failed for an unknown reason. Please try again.',
};

export const DiscordModal: React.FC<DiscordModalProps> = ({ isOpen, onClose, authError }) => {
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!isOpen) setStarting(false);
  }, [isOpen]);

  const errorMessage = useMemo(() => {
    if (!authError) return null;
    return ERROR_COPY[authError] || ERROR_COPY.unknown;
  }, [authError]);

  if (!isOpen) return null;

  const handleLogin = () => {
    setStarting(true);
    // Full navigation so Discord redirect + session cookie round-trip works
    window.location.href = '/auth/discord';
  };

  return (
    <div id="discord-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        id="discord-modal-body"
        className="bg-[#313338] text-[#dbdee1] rounded-lg max-w-md w-full overflow-hidden shadow-2xl relative border border-gray-700/30"
      >
        <div className="bg-[#1e1f22] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-6 h-6 text-[#5865F2]" />
            <span className="font-sans font-black tracking-wide text-white uppercase text-sm">
              Login with Discord
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors bg-[#2b2d31] p-1.5 rounded"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {errorMessage && (
            <div className="flex gap-2.5 text-[11px] text-rose-200 leading-relaxed bg-rose-950/50 border border-rose-500/30 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-3 bg-[#2b2d31] p-4 rounded-lg border border-gray-700/50">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#23a55a] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">MISCLICKERZ HUB</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                  Sign in with Discord to unlock member features. No manual username — we confirm you're in the Misclickerz Discord.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-700/60 my-2 pt-2 space-y-1.5 text-[11px] text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#23a55a]" />
                <span>Discord login only — nothing to type</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#23a55a]" />
                <span>Confirms you're in the Misclickerz Discord</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#23a55a]" />
                <span>Keeps you signed in securely on this device</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 text-[10px] text-gray-400 leading-relaxed bg-[#2b2d31]/40 p-2.5 rounded">
            <Lock className="w-4 h-4 text-[#5865F2] shrink-0 mt-0.5" />
            <span>
              Login is handled on the server. After Discord approves, we check your Misclickerz Discord membership and roles.
            </span>
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-semibold text-gray-300 hover:bg-gray-700/50 transition-all font-sans"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLogin}
              disabled={starting}
              className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-60 active:scale-95 px-5 py-2 rounded text-xs font-semibold text-white font-sans transition-all flex items-center gap-1.5 shadow"
            >
              <Disc className="w-3.5 h-3.5" />
              <span>{starting ? 'Redirecting…' : 'Login with Discord'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
