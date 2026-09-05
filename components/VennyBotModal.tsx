import React, { useState, useEffect } from 'react';
import { 
  Bot, ShieldCheck, Terminal, Copy, Check, Sparkles, 
  Send, RefreshCw, X, ExternalLink, Zap, AlertCircle, PlayCircle, Radio
} from 'lucide-react';
import type { BotSyncStatus } from '../types';
import { getBotSyncStatus, sendTestBotWebhook, submitMisclickApi } from '../services/api';

interface VennyBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventTriggered?: (eventName: string) => void;
}

export const VennyBotModal: React.FC<VennyBotModalProps> = ({ isOpen, onClose, onEventTriggered }) => {
  const [botData, setBotData] = useState<BotSyncStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'python' | 'node' | 'test'>('endpoints');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Test form state
  const [testUsername, setTestUsername] = useState('Venny Bot');
  const [testEventType, setTestEventType] = useState<'misclick' | 'drop' | 'bingo' | 'reward_announced'>('reward_announced');
  const [testDropItem, setTestDropItem] = useState('Elysian sigil');
  const [testDropValue, setTestDropValue] = useState('840.5M GP');
  const [testCompTitle, setTestCompTitle] = useState('Fishing Sprint - Skill of The Week');
  const [testPrizePool, setTestPrizePool] = useState('12,000,000 Gold Coins + Guild Credits');

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    const data = await getBotSyncStatus();
    if (data) {
      setBotData(data);
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunTestEvent = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      if (testEventType === 'misclick') {
        const res = await submitMisclickApi(
          testUsername, 
          'Venny Bot /misclick trigger • Wilderness Teleport Failure'
        );
        setTestResult(`Success! Misclick recorded & ticker reset. (Total: ${res.totalMisclicks})`);
      } else if (testEventType === 'drop') {
        const res = await sendTestBotWebhook('drop', {
          itemName: testDropItem,
          value: testDropValue,
          source: 'Corporeal Beast • KC 1,420',
          rarity: 'legendary',
          itemUrl: 'https://oldschool.runescape.wiki/images/Elysian_sigil_detail.png?f9e20'
        }, testUsername);
        setTestResult(`Success! Loot drop posted to live activity feed.`);
      } else if (testEventType === 'bingo') {
        const res = await sendTestBotWebhook('bingo_tile', {
          tileId: 1,
          proofUrl: 'https://cdn.discordapp.com/attachments/proof.png'
        }, testUsername);
        setTestResult(`Success! Bingo tile #1 marked as completed.`);
      } else if (testEventType === 'reward_announced') {
        const res = await sendTestBotWebhook('reward_announced', {
          competitionTitle: testCompTitle,
          eventType: 'Skill of the Week',
          title: `🏆 ${testCompTitle} Official Reward Bounty`,
          prizePool: testPrizePool,
          firstPlace: { gp: '12,000,000 Gold Coins (12M GP)', points: 2500, roleReward: '👑 SOTW Champion', title: '1st Place' },
          secondPlace: { gp: 'Guild Credits Reward', points: 1200, roleReward: '🥈 Master Angler', title: '2nd Place' },
          thirdPlace: { gp: 'Guild Credits Reward', points: 600, roleReward: '🥉 Harpoon Hero', title: '3rd Place' },
          sponsor: 'Clan Vault & Leadership (Inwarth)',
          discordChannel: '#clan-announcements'
        }, 'Venny Discord Bot');
        setTestResult(`Success! Live reward announcement broadcast dispatched to dashboard.`);
      }
      
      onEventTriggered?.(testEventType);
      loadStatus();
    } catch (err: any) {
      setTestResult(`Error: ${err.message || 'Failed to dispatch test webhook'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-...';
  const webhookUrl = `${hostUrl}/api/bot/webhook`;
  const misclickUrl = `${hostUrl}/api/bot/misclick`;
  const dropUrl = `${hostUrl}/api/bot/drop`;

  return (
    <div id="venny-bot-modal-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        id="venny-bot-modal-container" 
        className="bg-[#1e1f22] text-[#dbdee1] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-osrs-border/60 relative flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#141517] px-6 py-4 border-b border-osrs-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg border border-indigo-400/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-osrs-gold tracking-wide">
                  Venny Bot Backend Bridge
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  REST API Active
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <span>Linked with</span>
                <a 
                  href="https://github.com/noclearance/venny" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  noclearance/venny <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors bg-[#2b2d31] p-2 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Sub-bar */}
        <div className="bg-[#18191c] px-6 py-3 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-400">Connected Clan: </span>
              <span className="text-white font-semibold">The Mislickerz [CC]</span>
            </div>
            <div className="hidden sm:block text-gray-600">•</div>
            <div>
              <span className="text-gray-400">Events Synced: </span>
              <span className="text-osrs-gold font-mono font-bold">{botData?.eventCount ?? 128}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-gray-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Port 3000 Ingress Ready</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 bg-[#141517] px-6">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'endpoints'
                ? 'border-osrs-gold text-osrs-gold bg-[#1e1f22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            REST Endpoints
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'python'
                ? 'border-indigo-400 text-indigo-300 bg-[#1e1f22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Python (discord.py)
          </button>
          <button
            onClick={() => setActiveTab('node')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'node'
                ? 'border-emerald-400 text-emerald-300 bg-[#1e1f22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Node.js (discord.js)
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'test'
                ? 'border-amber-400 text-amber-300 bg-[#1e1f22]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
            Live Webhook Tester
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Tab 1: Endpoints */}
          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-white">Bot Authentication Header</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Pass the shared secret in the header <code className="bg-black/40 px-1.5 py-0.5 rounded text-osrs-gold font-mono">X-Venny-Secret: venny_mislickerz_secret_key_2026</code> on all POST requests.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Bot Ingestion Routes</h4>
                
                {/* Endpoint 1 */}
                <div className="bg-[#2b2d31] p-3.5 rounded-xl border border-gray-700/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px]">POST</span>
                      <code className="text-xs text-white font-mono font-semibold">/api/bot/webhook</code>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(webhookUrl, 'wh')}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-[#1e1f22] px-2.5 py-1 rounded"
                    >
                      {copiedKey === 'wh' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'wh' ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Universal dispatcher for misclicks, boss drops, bingo tile claims, and raffle updates.
                  </p>
                </div>

                {/* Endpoint 2 */}
                <div className="bg-[#2b2d31] p-3.5 rounded-xl border border-gray-700/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px]">POST</span>
                      <code className="text-xs text-white font-mono font-semibold">/api/bot/misclick</code>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(misclickUrl, 'mc')}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-[#1e1f22] px-2.5 py-1 rounded"
                    >
                      {copiedKey === 'mc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'mc' ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Resets the live Misclick Ticker clock and increments the Hall of Shame counter.
                  </p>
                </div>

                {/* Endpoint 3 */}
                <div className="bg-[#2b2d31] p-3.5 rounded-xl border border-gray-700/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold text-[11px]">GET</span>
                      <code className="text-xs text-white font-mono font-semibold">/api/bot/events/stream</code>
                    </div>
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-mono">Server-Sent Events</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Live real-time stream. Web browsers subscribe to push instant notifications without page refresh.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Python Code */}
          {activeTab === 'python' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Venny Discord Bot Cog (Python)</span>
                <button 
                  onClick={() => copyToClipboard(pythonSnippet(webhookUrl), 'py')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-[#2b2d31] px-2.5 py-1 rounded"
                >
                  {copiedKey === 'py' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'py' ? 'Snippet Copied' : 'Copy Python'}</span>
                </button>
              </div>
              <pre className="bg-[#141517] p-4 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto border border-gray-800 leading-relaxed">
                {pythonSnippet(webhookUrl)}
              </pre>
            </div>
          )}

          {/* Tab 3: Node Code */}
          {activeTab === 'node' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Discord.js integration module</span>
                <button 
                  onClick={() => copyToClipboard(nodeSnippet(webhookUrl), 'node')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-[#2b2d31] px-2.5 py-1 rounded"
                >
                  {copiedKey === 'node' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'node' ? 'Snippet Copied' : 'Copy Node'}</span>
                </button>
              </div>
              <pre className="bg-[#141517] p-4 rounded-xl text-[11px] font-mono text-indigo-300 overflow-x-auto border border-gray-800 leading-relaxed">
                {nodeSnippet(webhookUrl)}
              </pre>
            </div>
          )}

          {/* Tab 4: Live Tester */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Simulate events coming from your Venny Discord bot to watch the website update in real time!</span>
              </div>

              <div className="space-y-3 bg-[#2b2d31] p-4 rounded-xl border border-gray-700/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Event Type
                    </label>
                    <select
                      value={testEventType}
                      onChange={(e: any) => setTestEventType(e.target.value)}
                      className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="reward_announced">📢 /announce_reward (BOTW / SOTW Bounty)</option>
                      <option value="misclick">/misclick (Reset Ticker)</option>
                      <option value="drop">Loot Drop (Activity Feed)</option>
                      <option value="bingo">Bingo Tile Claim</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Caller / Announcer
                    </label>
                    <input
                      type="text"
                      value={testUsername}
                      onChange={(e) => setTestUsername(e.target.value)}
                      className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>

                {testEventType === 'reward_announced' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-700/50">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Competition / Event Title
                      </label>
                      <input
                        type="text"
                        value={testCompTitle}
                        onChange={(e) => setTestCompTitle(e.target.value)}
                        className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Prize Pool (GP & Points)
                      </label>
                      <input
                        type="text"
                        value={testPrizePool}
                        onChange={(e) => setTestPrizePool(e.target.value)}
                        className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-osrs-gold focus:border-indigo-500 outline-none font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                {testEventType === 'drop' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-700/50">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={testDropItem}
                        onChange={(e) => setTestDropItem(e.target.value)}
                        className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Value (GP)
                      </label>
                      <input
                        type="text"
                        value={testDropValue}
                        onChange={(e) => setTestDropValue(e.target.value)}
                        className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRunTestEvent}
                  disabled={isTesting}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Event...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch Simulated Bot Event</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg text-xs font-mono border ${
                  testResult.startsWith('Success') 
                    ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40' 
                    : 'bg-rose-950/30 text-rose-400 border-rose-500/40'
                }`}>
                  {testResult}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#141517] px-6 py-3.5 border-t border-gray-800 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-mono">
            Mislickerz Bot Hub v2.4 • Sync Protocol 2026
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const pythonSnippet = (webhookUrl: string) => `# Venny Discord Bot Extension (cogs/web_sync.py)
import aiohttp
import discord
from discord.ext import commands

WEB_HUB_URL = "${webhookUrl}"
BOT_SECRET = "venny_mislickerz_secret_key_2026"

class WebSync(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    async def push_event(self, event_type: str, username: str, data: dict):
        headers = {
            "X-Venny-Secret": BOT_SECRET,
            "Content-Type": "application/json"
        }
        payload = {
            "event": event_type,
            "username": username,
            "data": data
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(WEB_HUB_URL, json=payload, headers=headers) as resp:
                    return await resp.json()
        except Exception as e:
            print(f"[Venny WebSync Error] {e}")

    @commands.command(name="misclick")
    async def misclick_cmd(self, ctx, *, reason: str = "Unspecified misclick"):
        """Logs a misclick and resets the live web ticker clock!"""
        await self.push_event("misclick", ctx.author.display_name, {"detail": reason})
        await ctx.send(f"⚠️ {ctx.author.mention} reset The Mislickerz ticker! Reason: {reason}")

    @commands.command(name="announce_reward")
    async def announce_reward_cmd(self, ctx, title: str, prize_pool: str = "75M GP"):
        """Announces official event rewards and broadcasts live embed to dashboard!"""
        reward_data = {
            "competitionTitle": title,
            "prizePool": prize_pool,
            "firstPlace": {"gp": "45M GP", "points": 2000, "roleReward": "👑 SOTW Champion"},
            "secondPlace": {"gp": "20M GP", "points": 1000},
            "thirdPlace": {"gp": "10M GP", "points": 500},
            "discordChannel": f"#{ctx.channel.name}",
            "sponsor": ctx.author.display_name
        }
        await self.push_event("reward_announced", "Venny Bot", reward_data)
        
        # Build authentic Discord embed response
        embed = discord.Embed(
            title=f"🏆 {title} Prize Pool Locked!",
            description=f"**Prize Pool:** {prize_pool}\\nSponsored by: {ctx.author.mention}",
            color=0xf59e0b
        )
        embed.add_field(name="🥇 1st Place", value="45M GP + 👑 Champion Role", inline=True)
        embed.add_field(name="🥈 2nd Place", value="20M GP", inline=True)
        embed.add_field(name="🥉 3rd Place", value="10M GP", inline=True)
        embed.set_footer(text="Synced live to Mislickerz Web Dashboard")
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(WebSync(bot))
`;

const nodeSnippet = (webhookUrl: string) => `// discord.js webhook broadcaster
const fetch = require('node-fetch');

const WEB_HUB_URL = '${webhookUrl}';
const BOT_SECRET = 'venny_mislickerz_secret_key_2026';

async function dispatchVennyEvent(eventType, username, data) {
  try {
    const res = await fetch(WEB_HUB_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Venny-Secret': BOT_SECRET
      },
      body: JSON.stringify({
        event: eventType,
        username,
        data
      })
    });
    return await res.json();
  } catch (err) {
    console.error('Venny web hub sync failed:', err);
  }
}

// Example: Announcing a SOTW/BOTW reward from a slash command
async function announceReward(interaction, competitionTitle, prizePool) {
  await dispatchVennyEvent('reward_announced', 'Venny Bot', {
    competitionTitle,
    prizePool,
    firstPlace: { gp: '50M GP', points: 2500, roleReward: 'Event Champion' },
    secondPlace: { gp: '25M GP', points: 1200 },
    thirdPlace: { gp: '10M GP', points: 500 },
    sponsor: interaction.user.username,
    discordChannel: \`#\${interaction.channel.name}\`
  });
}

module.exports = { dispatchVennyEvent, announceReward };
`;
