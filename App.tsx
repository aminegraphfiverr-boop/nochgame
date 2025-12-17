
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { KickService } from './services/kickService';
import { ChatterStats, AppState, TimePeriod, PeriodStats } from './types';
import { BOT_NAMES } from './constants';
import StatCard from './components/StatCard';

const STORAGE_KEY = 'n0chh_v3_pink_pro_stats';

const App: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('alltime');
  const [appState, setAppState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaultState: AppState = {
      daily: {},
      weekly: {},
      monthly: {},
      alltime: {},
      emotes: {},
      totalMessages: 0,
      sessionStartTime: Date.now(),
      streamInfo: {
        title: 'Loading Stream Engine...',
        viewers: 0,
        isLive: false,
        startTime: null,
        avatarUrl: null
      }
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...defaultState, 
          ...parsed, 
          sessionStartTime: Date.now(),
          streamInfo: defaultState.streamInfo 
        };
      } catch (e) {
        return defaultState;
      }
    }
    return defaultState;
  });

  const [uptime, setUptime] = useState('00:00:00');
  const [showModal, setShowModal] = useState(false);
  const kickServiceRef = useRef<KickService | null>(null);

  // Auto-save to local "file" storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  const isEmoteOnly = (content: string) => {
    const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;
    const colonEmoteRegex = /:([a-zA-Z0-9_+-]{2,50}):/g;
    const kickEmoteRegex = /\[emote:\d+:[a-zA-Z0-9_]+\]/g;
    const stripped = content
      .replace(kickEmoteRegex, '')
      .replace(colonEmoteRegex, '')
      .replace(emojiRegex, '')
      .trim();
    return stripped === '';
  };

  const extractEmotes = (content: string) => {
    const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;
    const colonEmoteRegex = /:([a-zA-Z0-9_+-]{2,50}):/g;
    const kickEmoteRegex = /\[emote:\d+:[a-zA-Z0-9_]+\]/g;
    const found: string[] = [];
    let m;
    while((m = colonEmoteRegex.exec(content)) !== null) found.push(`:${m[1]}:`);
    while((m = kickEmoteRegex.exec(content)) !== null) found.push(m[0]);
    const emojiMatches = content.match(emojiRegex);
    if(emojiMatches) emojiMatches.forEach(e => found.push(e));
    return found;
  };

  const handleMessage = useCallback((msg: any) => {
    const username = msg.sender?.username;
    if (!username || BOT_NAMES.has(username.toLowerCase())) return;

    const content = msg.content || '';
    const isEmote = isEmoteOnly(content);
    const emotesInMsg = extractEmotes(content);

    setAppState(prev => {
      const updatePeriod = (periodData: PeriodStats) => {
        const user = periodData[username] || {
          username,
          totalMessages: 0,
          textMessages: 0,
          emoteMessages: 0,
          lastActive: Date.now()
        };
        return {
          ...periodData,
          [username]: {
            ...user,
            totalMessages: user.totalMessages + 1,
            textMessages: isEmote ? user.textMessages : user.textMessages + 1,
            emoteMessages: isEmote ? user.emoteMessages + 1 : user.emoteMessages,
            lastActive: Date.now()
          }
        };
      };

      const newEmoteCounts = { ...prev.emotes };
      emotesInMsg.forEach(e => {
        newEmoteCounts[e] = (newEmoteCounts[e] || 0) + 1;
      });

      return {
        ...prev,
        alltime: updatePeriod(prev.alltime),
        daily: updatePeriod(prev.daily),
        weekly: updatePeriod(prev.weekly),
        monthly: updatePeriod(prev.monthly),
        emotes: newEmoteCounts,
        totalMessages: prev.totalMessages + 1
      };
    });
  }, []);

  const initTracker = async () => {
    const service = new KickService('n0chh');
    kickServiceRef.current = service;
    const info = await service.fetchChannelInfo();
    
    if (info) {
      setAppState(prev => ({
        ...prev,
        streamInfo: {
          title: info.livestream?.session_title || 'Watching n0chh live!',
          viewers: info.livestream?.viewer_count || 0,
          isLive: !!info.livestream?.is_live,
          startTime: info.livestream?.created_at || null,
          avatarUrl: info.user?.profile_pic || 'https://i.pravatar.cc/150?u=n0chh'
        }
      }));

      if (info.chatroom?.id) {
        service.connectChat(info.chatroom.id, handleMessage);
      }
    }
  };

  useEffect(() => {
    initTracker();
    return () => kickServiceRef.current?.disconnect();
  }, [handleMessage]);

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - appState.sessionStartTime;
      const h = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
      const m = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [appState.sessionStartTime]);

  const currentLeaderboard = useMemo(() => {
    return Object.values(appState[activePeriod])
      .sort((a, b) => b.totalMessages - a.totalMessages)
      .slice(0, 10);
  }, [appState, activePeriod]);

  const topEmotes = useMemo(() => {
    return Object.entries(appState.emotes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12);
  }, [appState.emotes]);

  return (
    <div className="min-h-screen pb-32 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 space-y-10 mt-10">
        
        {/* Animated Banner */}
        <div className="relative h-64 md:h-80 rounded-[3rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(168,85,247,0.3)] group animate-slide-up">
          <img 
            src="https://i.ibb.co/qSJ3fQ7/Cartoon-Raffle-Logo-Roulette-Banner.jpg" 
            className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110"
            alt="n0chh Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
          <div className="absolute bottom-8 left-10 flex items-center gap-4">
             <div className="flex items-center gap-3 bg-purple-600 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl animate-pulse-glow">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                Persistent Storage Active
             </div>
             <div className="text-white font-black italic text-xl drop-shadow-lg">LIVE ANALYTICS ENGINE</div>
          </div>
        </div>

        {/* Streamer Hub */}
        <div className="glass-panel p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden animate-slide-up delay-100">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-pink-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-500/10 blur-[120px] rounded-full"></div>
          
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
            <img 
              src={appState.streamInfo.avatarUrl || 'https://i.pravatar.cc/150?u=n0chh'} 
              className="relative w-40 h-40 rounded-full border-[8px] border-slate-900 object-cover shadow-2xl group-hover:rotate-3 transition-transform duration-500"
            />
            {appState.streamInfo.isLive && (
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-6 py-1.5 rounded-full text-[12px] font-black uppercase shadow-[0_0_20px_rgba(236,72,153,0.6)]">LIVE</div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-6xl font-black tracking-tighter text-white animate-float">n0chh<span className="text-pink-500 italic">.</span></h1>
              <p className="text-slate-400 text-xl font-medium italic opacity-80">{appState.streamInfo.title}</p>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3 border-white/5 bg-slate-900/40">
                <i className="fas fa-eye text-purple-400"></i>
                <span className="font-black text-lg">{appState.streamInfo.viewers.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="gradient-bg hover:opacity-90 px-10 py-3 rounded-2xl font-black text-white shadow-[0_15px_30px_-10px_rgba(244,114,182,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
              >
                <i className="fas fa-crown"></i>
                Hall of Fame
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            {['kick', 'instagram', 'discord'].map((icon, i) => (
              <a 
                key={icon} 
                href={`#${icon}`}
                className={`w-14 h-14 glass-panel flex items-center justify-center rounded-2xl hover:bg-gradient-to-br hover:from-pink-500 hover:to-purple-600 transition-all border-white/5 hover:-translate-y-2 animate-slide-up`}
                style={{ animationDelay: `${0.4 + (i * 0.1)}s` }}
              >
                <i className={`fab fa-${icon === 'kick' ? 'kick' : icon} text-2xl`}></i>
              </a>
            ))}
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard label="Live Count" value={appState.totalMessages.toLocaleString()} icon="fa-comment-dots" delayClass="delay-100" />
          <StatCard label="Uptime" value={uptime} icon="fa-bolt" colorClass="text-purple-400" delayClass="delay-200" />
          <StatCard label="Total Reach" value={Object.keys(appState.alltime).length.toLocaleString()} icon="fa-users" colorClass="text-cyan-400" delayClass="delay-300" />
          <StatCard label="Activity Rate" value={`${Math.min(100, Math.floor(appState.totalMessages / 50))}%`} icon="fa-chart-line" colorClass="text-emerald-400" delayClass="delay-400" />
        </div>

        {/* Main Stats Engine */}
        <div className="grid lg:grid-cols-3 gap-10 pt-10">
          
          <div className="lg:col-span-2 space-y-8 animate-slide-up delay-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase gradient-text">Chatter Tiers</h2>
                <p className="text-slate-500 text-sm font-semibold tracking-wide">Historical data synced and secured in real-time.</p>
              </div>
              <div className="glass-panel p-2 rounded-2xl flex gap-1.5 border-white/5 bg-slate-900/50">
                {(['daily', 'weekly', 'monthly', 'alltime'] as TimePeriod[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activePeriod === p ? 'gradient-bg text-white shadow-xl scale-105' : 'text-slate-500 hover:text-pink-400 hover:bg-white/5'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[2.5rem] overflow-hidden shadow-2xl border-white/5 animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/60">
                    <tr>
                      <th className="px-10 py-6 text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Tier</th>
                      <th className="px-10 py-6 text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Profile</th>
                      <th className="px-10 py-6 text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] text-center">Score</th>
                      <th className="px-10 py-6 text-[11px] font-black uppercase text-slate-500 tracking-[0.2em]">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {currentLeaderboard.map((user, idx) => (
                      <tr key={user.username} className="hover:bg-purple-500/[0.03] transition-colors group">
                        <td className="px-10 py-7">
                          <span className={`text-2xl font-black italic ${idx === 0 ? 'text-pink-500' : idx === 1 ? 'text-purple-400' : idx === 2 ? 'text-cyan-400' : 'text-slate-700'}`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center font-black text-xs text-white uppercase shadow-lg">
                              {user.username.substring(0,2)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-100 group-hover:text-pink-400 transition-colors">{user.username}</span>
                              <span className="text-[10px] text-slate-600 font-bold uppercase">Active: {new Date(user.lastActive).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7 text-center">
                          <span className="bg-slate-800 border border-white/5 px-6 py-2 rounded-xl font-black text-purple-400 text-lg shadow-inner">
                            {user.totalMessages}
                          </span>
                        </td>
                        <td className="px-10 py-7">
                          <div className="w-40">
                            <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                              <span>Text</span>
                              <span>Emote</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                              <div style={{ width: `${(user.textMessages / user.totalMessages) * 100}%` }} className="bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                              <div style={{ width: `${(user.emoteMessages / user.totalMessages) * 100}%` }} className="bg-pink-500 shadow-[0_0_10px_rgba(244,114,182,0.5)]"></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentLeaderboard.length === 0 && (
                      <tr><td colSpan={4} className="p-32 text-center text-slate-600 font-black uppercase tracking-[0.3em] italic">Awaiting Chatter Activity...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-10 animate-slide-up delay-300">
            {/* Emotes Panel */}
            <div className="glass-panel p-10 rounded-[3rem] border-white/5 space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full"></div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-4">
                <i className="fas fa-fire-alt text-orange-500 animate-pulse"></i>
                Hottest Emotes
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {topEmotes.map(([name, count]) => (
                  <div key={name} className="bg-slate-800/50 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 border border-white/5 px-4 py-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer group hover:scale-105 active:scale-95">
                    <span className="text-xs font-black text-slate-300 group-hover:text-white truncate max-w-[80px]">{name}</span>
                    <span className="text-pink-400 font-black text-sm bg-slate-900/80 px-2 py-1 rounded-lg">{count}</span>
                  </div>
                ))}
                {topEmotes.length === 0 && <p className="col-span-2 text-center text-slate-600 font-bold uppercase text-[10px]">No Emotes Yet</p>}
              </div>
            </div>

            {/* Persistence & Raffle Card */}
            <div className="glass-panel p-10 rounded-[3rem] border-l-[12px] border-pink-500 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-950 space-y-6 animate-float">
              <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Raffle Protocol</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Our system monitors all <strong className="text-pink-400">Daily</strong> performance folders. The <span className="text-purple-400 font-black">Top 1</span> chatter every 24 hours gains exclusive entry into the weekly cash pool.
              </p>
              <div className="pt-6 space-y-4">
                <div className="flex items-center gap-3 text-emerald-400 text-xs font-black uppercase tracking-widest">
                  <i className="fas fa-check-circle"></i>
                  Data Auto-Synced to Browser
                </div>
                <button 
                  onClick={() => {
                     if(window.confirm("IRREVERSIBLE: Wipe all historical daily, weekly, and monthly data?")) {
                       localStorage.removeItem(STORAGE_KEY);
                       window.location.reload();
                     }
                  }}
                  className="w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-red-500 hover:bg-red-500/5 transition-all border border-slate-800 rounded-2xl hover:border-red-500/20"
                >
                  Terminate History
                </button>
              </div>
            </div>
          </div>

        </div>

        <footer className="py-32 text-center">
           <div className="inline-block px-8 py-4 glass-panel rounded-3xl">
             <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
               Engineered for <span className="text-pink-500">n0chh</span> • © {new Date().getFullYear()} Elite Analytics
             </p>
           </div>
        </footer>
      </div>

      {/* Hall of Fame Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="glass-panel w-full max-w-2xl rounded-[4rem] p-16 relative border-purple-500/30 shadow-[0_0_100px_rgba(168,85,247,0.2)] animate-slide-up">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-slate-500 hover:text-pink-500 transition-all hover:rotate-90">
              <i className="fas fa-times text-3xl"></i>
            </button>
            
            <div className="text-center space-y-4 mb-14">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-12">
                <i className="fas fa-trophy text-5xl text-white"></i>
              </div>
              <h2 className="text-5xl font-black italic tracking-tighter uppercase gradient-text">The All-Time Elites</h2>
              <p className="text-slate-500 text-[10px] tracking-[0.5em] font-black uppercase">Legends of the Chat</p>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4">
              {Object.values(appState.alltime)
                .sort((a,b) => b.totalMessages - a.totalMessages)
                .slice(0, 6)
                .map((user, idx) => (
                  <div key={user.username} className={`p-8 rounded-[2rem] flex items-center justify-between border-2 transition-all hover:scale-[1.02] ${idx === 0 ? 'bg-gradient-to-r from-pink-500 to-purple-600 border-transparent text-white shadow-2xl' : 'bg-slate-900/50 border-white/5 text-slate-200'}`}>
                    <div className="flex items-center gap-8">
                      <span className={`text-3xl font-black italic ${idx === 0 ? 'text-white' : 'text-slate-700'}`}>#{idx + 1}</span>
                      <span className="text-2xl font-black tracking-tighter">{user.username}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black">{user.totalMessages.toLocaleString()}</span>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${idx === 0 ? 'text-white/80' : 'text-slate-500'}`}>Score</p>
                    </div>
                  </div>
                ))}
              {Object.keys(appState.alltime).length === 0 && <p className="text-center py-20 text-slate-600 font-black tracking-widest uppercase italic">Awaiting History...</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
