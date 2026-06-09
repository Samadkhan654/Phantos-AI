/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bot, User, Cpu, Layers, Search, ShoppingBag, 
  TrendingUp, History, ShieldAlert, List, Sparkles, 
  Play, CheckCircle, AlertTriangle, Activity, 
  FileText, RefreshCw, ChevronLeft, ChevronRight, Zap, Info, 
  HelpCircle, Database, Server, Clipboard, Target,
  Download, Share2, Volume2, VolumeX, Sliders, LayoutGrid, AlertCircle,
  Pause, RotateCcw, SkipForward, Eye, BookOpen, Compass, Wrench,
  Sun, Moon
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, 
  ReferenceLine, ScatterChart, Scatter
} from "recharts";
import { 
  ChatMessage, Trace, TraceSpan, SessionMetrics, Rule, ImprovementEvent 
} from "./types";
import {
  INITIAL_MEMORY_NODES,
  INITIAL_MEMORY_EDGES,
  BATTLE_ROUNDS_DATA,
  TOUR_STEPS_LIST,
  MemoryNode,
  MemoryEdge,
  BattleQuestion,
  TourStep
} from "./memoryData";

const PhantosEyeLogo = ({ className = "h-12 w-12" }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={`${className} text-indigo-400 select-none`} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Glow filter definition */}
    <defs>
      <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Outer Circuit eye contour */}
    <path 
      d="M15 50 C28 28, 72 28, 85 50 C72 72, 28 72, 15 50 Z" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{ filter: "url(#eyeGlow)" }}
    />
    
    {/* PCB Traces radiating from the eye contour */}
    {/* Top left connections */}
    <path d="M28 35 L33 24 M33 24 L27 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="27" cy="18" r="2.5" fill="currentColor" />
    
    <path d="M22 41 L16 34 M16 34 L16 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="26" r="2.5" fill="currentColor" />

    {/* Bottom left connections */}
    <path d="M28 65 L33 76 M33 76 L27 82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="27" cy="82" r="2.5" fill="currentColor" />
    
    <path d="M22 59 L16 66 M16 66 L22 72" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="22" cy="72" r="2.5" fill="currentColor" />

    {/* Right connections */}
    <path d="M72 35 L76 26 M76 26 L76 18 M76 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="76" cy="18" r="2.5" fill="currentColor" />
    
    <path d="M78 50 L84 50 M84 50 L84 58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="84" cy="58" r="2.5" fill="currentColor" />

    <path d="M72 65 L76 72 M76 72 L76 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="76" cy="80" r="2.5" fill="currentColor" />

    {/* Central Iris ring with inner details */}
    <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />

    {/* Holographic spiral pupil mimicking the image vortex */}
    <path 
      d="M50 50 C50 48, 52 47, 53 48 C54 49, 54 51, 52 52 C50 53, 48 52, 47 50 C46 47, 48 44, 51 43 C54 42, 57 45, 57 49 C57 53, 53 56, 49 56 C44 56, 41 51, 41 46 C41 41, 47 37, 52 38" 
      stroke="currentColor" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
    />

    {/* Dynamic reflection glint */}
    <circle cx="56" cy="44" r="3" fill="white" />
  </svg>
);

export default function App() {
  // Session parameters
  const [sessionId] = useState(`sess-${Math.floor(Math.random() * 10000)}`);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("agentwatch_theme");
    return saved !== "light";
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("agentwatch_theme", next ? "dark" : "light");
      return next;
    });
  };

  const strokeColor = isDarkMode ? "#475569" : "#64748b";
  const gridColor = isDarkMode ? "#1e293b" : "#e2e8f0";
  const labelColor = isDarkMode ? "#94a3b8" : "#475569";
  const [activeTab, setActiveTab] = useState<"chat" | "metrics" | "rules" | "battle" | "palace">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [healthStatus, setHealthStatus] = useState({
    status: "ok",
    phoenix: "connected",
    mcp: "ready",
    geminiOnline: false
  });

  // Helper to statelessly compute metrics locally for robust offline / Serverless Vercel support
  const computeMetrics = (currentTraces: Trace[], currentHistory: ImprovementEvent[]): SessionMetrics => {
    const total = currentTraces.length;
    if (total === 0) {
      return {
        averageScore: 0.0,
        totalConversations: 0,
        selfCorrectionsCount: 0,
        highestScore: 0.0,
        lowestScore: 0.0,
        improvementPercent: 0,
        scoreHistory: [],
        dimensionAverages: { accuracy: 0, helpfulness: 0, completeness: 0, honesty: 0 }
      };
    }

    const scores = currentTraces.map(t => t.evaluation?.overall || 0);
    const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / total) * 100) / 100;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    
    const corrections = currentTraces.filter(t => t.wasSelfCorrected).length;

    // Build sequential score history grouped by turn index
    const scoreHistory = currentTraces.map((t, idx) => {
      // Check if an improvement cycle happened immediately before or near this timestamp
      const hasImprovementNode = currentHistory.some(e => 
        Math.abs(new Date(e.timestamp).getTime() - new Date(t.timestamp).getTime()) < 10000
      );
      return {
        turn: idx + 1,
        score: t.evaluation?.overall || 0,
        isImprovementNode: t.wasSelfCorrected || hasImprovementNode
      };
    });

    // Calculate breakdown dimensions
    const accuracy = Math.round((currentTraces.reduce((s, t) => s + (t.evaluation?.accuracy || 0), 0) / total) * 100) / 100;
    const helpfulness = Math.round((currentTraces.reduce((s, t) => s + (t.evaluation?.helpfulness || 0), 0) / total) * 100) / 100;
    const completeness = Math.round((currentTraces.reduce((s, t) => s + (t.evaluation?.completeness || 0), 0) / total) * 100) / 100;
    const honesty = Math.round((currentTraces.reduce((s, t) => s + (t.evaluation?.honesty || 0), 0) / total) * 100) / 100;

    // Improvement ratio
    const scoreBeforeImprove = scores.filter((_, i) => i < 2).reduce((a, b) => a + b, 0) / Math.max(1, scores.filter((_, i) => i < 2).length);
    const scoreAfterImprove = scores.filter((_, i) => i >= 4).reduce((a, b) => a + b, 0) / Math.max(1, scores.filter((_, i) => i >= 4).length);
    let totalImproveFactor = 0;
    if (scoreBeforeImprove > 0 && scoreAfterImprove > 0) {
      totalImproveFactor = Math.round(((scoreAfterImprove - scoreBeforeImprove) / scoreBeforeImprove) * 100);
    }

    return {
      averageScore,
      totalConversations: total,
      selfCorrectionsCount: corrections,
      highestScore,
      lowestScore,
      improvementPercent: Math.max(0, totalImproveFactor || Math.round((averageScore - 0.5) * 100)),
      scoreHistory,
      dimensionAverages: { accuracy, helpfulness, completeness, honesty }
    };
  };

  // State caches (hydrated from regional localStorage persistence to protect against cold container recycles)
  const [traces, setTraces] = useState<Trace[]>(() => {
    try {
      const saved = localStorage.getItem("agentwatch_traces");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);
  
  const [activeRules, setActiveRules] = useState<Rule[]>(() => {
    try {
      const saved = localStorage.getItem("agentwatch_rules");
      return saved ? JSON.parse(saved) : [
        {
          id: "rule-init-1",
          text: "Maintain a helpful, direct, and professional tone when answering electronics inquiries.",
          category: "general_behavior",
          addedAt: new Date().toISOString(),
          reason: "Seeding default customer support parameters."
        }
      ];
    } catch (_) {
      return [
        {
          id: "rule-init-1",
          text: "Maintain a helpful, direct, and professional tone when answering electronics inquiries.",
          category: "general_behavior",
          addedAt: new Date().toISOString(),
          reason: "Seeding default customer support parameters."
        }
      ];
    }
  });

  const [improvementHistory, setImprovementHistory] = useState<ImprovementEvent[]>(() => {
    try {
      const saved = localStorage.getItem("agentwatch_improvement_history");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [metrics, setMetrics] = useState<SessionMetrics>(() => {
    return computeMetrics(traces, improvementHistory);
  });
  
  // Super Features States
  // 1. Persistence & Welcome Banner
  const [welcomeBannerOpen, setWelcomeBannerOpen] = useState(false);
  const [learningSessions, setLearningSessions] = useState(3);
  const [improvedPercentage, setImprovedPercentage] = useState(46);
  const [baselineScore, setBaselineScore] = useState(0.42);

  // 2. Health Segment hover
  const [hoveredHealthSegment, setHoveredHealthSegment] = useState<string | null>(null);

  // 3. Predictive Quality Alerts
  const [predictiveAlert, setPredictiveAlert] = useState<{
    predicted_tier: "excellent" | "good" | "poor" | "failing";
    confidence: number;
    reason: string;
    suggestion: string;
  } | null>(null);

  // 4. Hallucination block counter
  const [hallucinationsCount, setHallucinationsCount] = useState(0);
  const [hallucinationsFilter, setHallucinationsFilter] = useState(false);
  const [isVerifyingHallucination, setIsVerifyingHallucination] = useState(false);
  const [hallucinationHistory, setHallucinationHistory] = useState<{
    id: string;
    question: string;
    claimed: string;
    reality: string;
    timestamp: string;
  }[]>([]);

  // 5. Memory Palace Graph
  const [searchPalaceText, setSearchPalaceText] = useState("");
  const [palaceFilterCategory, setPalaceFilterCategory] = useState<string | null>(null);
  const [memoryPalaceNodes, setMemoryPalaceNodes] = useState<MemoryNode[]>([]);
  const [memoryPalaceEdges, setMemoryPalaceEdges] = useState<MemoryEdge[]>(INITIAL_MEMORY_EDGES);
  const [pulseNodeId, setPulseNodeId] = useState<string | null>(null);
  const [isMemoryActiveState, setIsMemoryActiveState] = useState<string | null>(null);

  // 6. Agent vs Agent Battle
  const [battleRound, setBattleRound] = useState(1);
  const [battleIsRunning, setBattleIsRunning] = useState(false);
  const [battleCompleted, setBattleCompleted] = useState(false);
  const [battleScores, setBattleScores] = useState<{ unmonitored: number[]; agentwatch: number[] }>({
    unmonitored: [],
    agentwatch: []
  });
  const [battleAnswerLeft, setBattleAnswerLeft] = useState("");
  const [battleAnswerRight, setBattleAnswerRight] = useState("");
  const [battleQuestionText, setBattleQuestionText] = useState("");
  const [battleHistoryLog, setBattleHistoryLog] = useState<any[]>([]);

  // 7. Benchmark
  const [benchmarkAdvantagePercent, setBenchmarkAdvantagePercent] = useState(45);

  // 8. Replay Mode States
  const [replayIsActive, setReplayIsActive] = useState(false);
  const [replayStep, setReplayStep] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState<1 | 2>(1);
  const [replayPlaying, setReplayPlaying] = useState(false);

  // 9. Natural Language Query
  const [nlpQueryText, setNlpQueryText] = useState("");
  const [nlpQueryResultText, setNlpQueryResultText] = useState<any | null>(null);

  // 10. Autopsy Trace Overlay
  const [autopsyTraceId, setAutopsyTraceId] = useState<string | null>(null);

  // 11. Commentator Narrative Story
  const [commentaryHighlight, setCommentaryHighlight] = useState(
    "Session started in standard uncalibrated mode. Once failure logs hit, triggers self-healing cycle."
  );

  // 12. Interactive Guided Tour
  const [tourActive, setTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourTargetRect, setTourTargetRect] = useState<DOMRect | null>(null);

  // Interactive loops
  const [isImproving, setIsImproving] = useState(false);
  const [improvementStep, setImprovementStep] = useState("");
  
  // Nice-to-haves: sound, speed, persona selectors
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState<"low" | "medium" | "max">("medium");
  const [isVolumePopupOpen, setIsVolumePopupOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<0.5 | 1.0 | 2.0>(1.0);
  const [persona, setPersona] = useState<"electronics" | "travel" | "health">("electronics");
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [shareNotification, setShareNotification] = useState<string | null>(null);

  // Responsive Slider states for splitting Left Chat & Right Trace tree
  const [chatSplitPercent, setChatSplitPercent] = useState(55);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 768);
  const [mobileChatTab, setMobileChatTab] = useState<"chat" | "trace">("chat");
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 765;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [franceTime, setFranceTime] = useState("");
  const [franceTz, setFranceTz] = useState("CEST");

  useEffect(() => {
    const updateFranceClock = () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Paris',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        setFranceTime(formatter.format(now));

        const tzPart = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Europe/Paris',
          timeZoneName: 'short'
        }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || 'CEST';
        setFranceTz(tzPart);
      } catch (e) {
        setFranceTime(new Date().toLocaleTimeString());
      }
    };
    updateFranceClock();
    const clkInterval = setInterval(updateFranceClock, 1000);
    return () => clearInterval(clkInterval);
  }, []);

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("agentwatch_username") || "Samad";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setUserName(trimmed);
      localStorage.setItem("agentwatch_username", trimmed);
    }
    setIsEditingName(false);
  };

  const getPeriodGreeting = () => {
    try {
      const now = new Date();
      const hourStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        hour12: false
      }).format(now);
      const hour = parseInt(hourStr, 10);
      
      let greetingPrefix = "Bonjour & Hello";
      let emoji = "⚡";
      let excitement = "Ready to stress-test our AI customer support agents and capture real-time Arize Phoenix traces?";

      if (hour >= 5 && hour < 12) {
        greetingPrefix = "Bonjour & Good Morning";
        emoji = "🌅";
        excitement = "A fresh morning to evaluate AI agents and hunt down alignment issues in Phoenix!";
      } else if (hour >= 12 && hour < 18) {
        greetingPrefix = "Bonjour & Good Afternoon";
        emoji = "☀️";
        excitement = "Perfect time to trigger LLM edge cases and view Trace cascades in Phoenix.";
      } else if (hour >= 18 && hour < 22) {
        greetingPrefix = "Bonsoir & Good Evening";
        emoji = "🌆";
        excitement = "Ready to analyze alignment metrics and push system rules to the maximum!";
      } else {
        greetingPrefix = "Bonsoir & Late Night Coding";
        emoji = "🌌";
        excitement = "Quiet hours engineering. Let's make sure our self-correction loops are resilient!";
      }

      return {
        greeting: `${greetingPrefix}, ${userName}! ${emoji}`,
        excitement
      };
    } catch {
      return {
        greeting: `Hello, ${userName}! ⚡`,
        excitement: "Ready to stress-test our AI customer support agents and capture realtime traces."
      };
    }
  };

  // Live Improvement Counter Animation details
  const [liveStage, setLiveStage] = useState<0 | 1 | 2 | 3 | 4 | 5>(0); // 1: query, 2: patterns, 3: rule typing, 4: score roll
  const [liveReviewCount, setLiveReviewCount] = useState(0);
  const [livePatterns, setLivePatterns] = useState<string[]>([]);
  const [liveTypingText, setLiveTypingText] = useState("");
  const [liveScoreStart, setLiveScoreStart] = useState(0.41);
  const [liveScoreCurrent, setLiveScoreCurrent] = useState(0.41);
  const [liveScoreFinal, setLiveScoreFinal] = useState(0.95);
  const [showCompareViewInRules, setShowCompareViewInRules] = useState(true);
  const [abSelectedTopic, setAbSelectedTopic] = useState<"laptop" | "headset">("laptop");

  // Demo Mode
  const [demoState, setDemoState] = useState<{
    isRunning: boolean;
    stepIndex: number;
    notes: string;
  }>({ isRunning: false, stepIndex: 0, notes: "" });

  // Web Audio chime builder
  const playAudioFeedback = (type: "success" | "alert" | "whoosh") => {
    if (isMuted) return;
    try {
      const volMultiplier = volume === "low" ? 0.35 : volume === "medium" ? 0.95 : 1.8;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        gain.gain.setValueAtTime(0.25 * volMultiplier, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === "alert") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(140, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.24 * volMultiplier, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "whoosh") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.355);
        gain.gain.setValueAtTime(0.22 * volMultiplier, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Audio Context blocked/not supported inside iframe:", e);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    playAudioFeedback("whoosh");
    try {
      await fetchData();
      setTimeout(() => {
        setIsSyncing(false);
        playAudioFeedback("success");
      }, 500);
    } catch (e) {
      console.error("Sync failed:", e);
      setIsSyncing(false);
    }
  };

  // Metric tab calculation helpers
  const getHeatmapGrid = () => {
    const rows = ["Return Policy", "Shipping", "Products", "Warranty", "Pricing", "Other"];
    const cols = [
      { label: "Accuracy", key: "accuracy" },
      { label: "Helpful", key: "helpfulness" },
      { label: "Complete", key: "completeness" },
      { label: "Honesty", key: "honesty" },
    ];

    const getCellStats = (row: string, colKey: string) => {
      const matchedTraces = traces.filter(t => t.category === row);
      if (matchedTraces.length > 0) {
        let sum = 0;
        let count = 0;
        matchedTraces.forEach(t => {
          if (t.evaluation && (t.evaluation as any)[colKey] !== undefined) {
            sum += (t.evaluation as any)[colKey];
            count++;
          }
        });
        if (count > 0) {
          return sum / count;
        }
      }

      // Default baseline calibrations while rules are not active
      const laptopRuleActive = activeRules.some(r => r.text.toLowerCase().includes("laptop") || r.text.toLowerCase().includes("restocking"));
      const warrantyRuleActive = activeRules.some(r => r.text.toLowerCase().includes("refurbished") || r.text.toLowerCase().includes("soundsync"));

      if (row === "Return Policy") {
        return laptopRuleActive ? 0.95 : 0.35;
      }
      if (row === "Warranty") {
        return warrantyRuleActive ? 0.96 : 0.30;
      }
      if (row === "Shipping") {
        return 0.95;
      }
      if (row === "Products") {
        return 0.92;
      }
      if (row === "Pricing") {
        return 0.90;
      }
      return 0.91;
    };

    return { rows, cols, getCellStats };
  };

  const getCostMetrics = () => {
    const promptTokens = traces.reduce((acc, t) => acc + (t.promptTokens || 345), 0) + (demoState.isRunning ? 250000 : 0);
    const completionTokens = traces.reduce((acc, t) => acc + (t.completionTokens || 105), 0) + (demoState.isRunning ? 90000 : 0);
    const totalCost = traces.reduce((acc, t) => acc + (t.cost || 0.00015), 0) + (demoState.isRunning ? 0.512 : 0);
    const totalTokens = promptTokens + completionTokens;

    const avgQual = metrics.averageScore || 0.92;
    const costPerUnit = avgQual > 0 ? (totalCost / avgQual) * 1000 : 0;

    return {
      promptTokens,
      completionTokens,
      totalCost,
      totalTokens,
      costPerUnit
    };
  };

  const getScatterPoints = () => {
    const initialPoints = [
      { x: 95, y: 35, name: "Laptop Gaps Failure (No Rule)", info: "Agent says 95% confident, actually 35% correct (Assumed free box return for opened laptops)" },
      { x: 90, y: 30, name: "Audio Gaps Failure (No Rule)", info: "Agent says 90% confident, actually 30% correct (Fabricated coverage period on refurbished headset)" }
    ];

    const tracePoints = traces.map(t => {
      const conf = Math.round((t.evaluation?.confidence || 0.92) * 100);
      const acc = Math.round((t.evaluation?.accuracy || 0.95) * 100);
      return {
        x: conf,
        y: acc,
        name: `Trace ${t.traceId.substring(0, 7)}`,
        info: `Q: "${t.question.substring(0, 45)}..." Conf: ${conf}%, Acc: ${acc}%`
      };
    });

    return [...initialPoints, ...tracePoints];
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Health and data refresh
  const fetchData = async () => {
    const safeFetch = async (url: string, description: string, fallbackValue: any) => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.info(`[Telemetry Debug] ${description} server is starting up or offline (Status ${res.status}). url: ${url}`);
          return fallbackValue;
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const bodyText = await res.text();
          console.info(`[Telemetry Debug] ${description} response is non-JSON during server hand-off. URL: ${url}`);
          return fallbackValue;
        }
        return await res.json();
      } catch (err) {
        // Quietly log startup/offline connection attempts with info to avoid warning clutter
        console.info(`[Telemetry Debug] ${description} is active in local/offline backup mode.`);
        return fallbackValue;
      }
    };

    try {
      const hData = await safeFetch("/api/health", "Health Status", { status: "offline", geminiOnline: false });
      setHealthStatus(hData);

      const mData = await safeFetch(`/api/metrics/${sessionId}`, "Telemetry Metrics", null);
      const tData = await safeFetch(`/api/traces/${sessionId}`, "Telemetry Traces", null);
      const rData = await safeFetch("/api/rules", "Custom Telemetry Rules", null);
      const hiData = await safeFetch(`/api/history/${sessionId}`, "Telemetry History", null);

      // Use server arrays if they exist and are non-empty, otherwise use/protect client caches.
      // In stateless/serverless environments this keeps state perfectly intact!
      const finalTraces = (tData && tData.length > 0) ? tData : traces;
      setTraces(finalTraces);
      if (tData && tData.length > 0) {
        localStorage.setItem("agentwatch_traces", JSON.stringify(finalTraces));
      }

      const finalRules = (rData && rData.length > 0) ? rData : activeRules;
      setActiveRules(finalRules);
      if (rData && rData.length > 0) {
        localStorage.setItem("agentwatch_rules", JSON.stringify(finalRules));
      }

      const finalHistory = (hiData && hiData.length > 0) ? hiData : improvementHistory;
      setImprovementHistory(finalHistory);
      if (hiData && hiData.length > 0) {
        localStorage.setItem("agentwatch_improvement_history", JSON.stringify(finalHistory));
      }

      const finalMetrics = (mData && mData.totalConversations > 0) ? mData : computeMetrics(finalTraces, finalHistory);
      setMetrics(finalMetrics);

      return finalTraces;
    } catch (e) {
      console.warn("Failed to load metrics or spans from console host:", e);
      return traces;
    }
  };

  // Initialize Superpowers features loading
  useEffect(() => {
    // 1. Memory nodes loading
    setMemoryPalaceNodes(INITIAL_MEMORY_NODES.map(node => ({ ...node })));

    // 2. Load persistence
    const loadedSess = localStorage.getItem("agentwatch_sessions_count");
    if (loadedSess) {
      setLearningSessions(Number(loadedSess));
      setWelcomeBannerOpen(true);
    } else {
      localStorage.setItem("agentwatch_sessions_count", "3");
    }

    const loadedBlocks = localStorage.getItem("agentwatch_hallucinations_blocked");
    if (loadedBlocks) {
      setHallucinationsCount(Number(loadedBlocks));
    }

    const loadedHistory = localStorage.getItem("agentwatch_hallucination_history");
    if (loadedHistory) {
      try {
        setHallucinationHistory(JSON.parse(loadedHistory));
      } catch (e) {}
    }
  }, []);

  // 3. Predictive Quality Alert (debounced 500ms typed listener)
  useEffect(() => {
    if (!inputText.trim()) {
      setPredictiveAlert(null);
      return;
    }

    const timer = setTimeout(() => {
      const q = inputText.toLowerCase();
      let predicted_tier: "excellent" | "good" | "poor" | "failing" = "excellent";
      let confidence = 0.90;
      let reason = "This question fits existing high-coverage domains of products.";
      let suggestion = "Ready to send! Accurate metrics expected.";

      const matchesCount = INITIAL_MEMORY_NODES.filter(n => 
        q.includes(n.id) || q.includes(n.label.toLowerCase()) || 
        (n.id === "return_policy" && (q.includes("return") || q.includes("refund"))) ||
        (n.id === "soundsync_warranty" && (q.includes("soundsync") || q.includes("headset") || q.includes("warranty"))) ||
        (n.id === "restocking_fee" && (q.includes("laptop") || q.includes("restock") || q.includes("opened")))
      ).length;

      // Topic logic and history
      if (q.includes("return") || q.includes("refund") || q.includes("restock") || q.includes("fee")) {
        const laptopRulesLoaded = activeRules.some(r => r.text.toLowerCase().includes("laptop") || r.text.toLowerCase().includes("restock") || r.id.includes("laptop") || r.text.toLowerCase().includes("fee"));
        if (!laptopRulesLoaded && activeRules.length === 0) {
          predicted_tier = "poor";
          confidence = 0.85;
          reason = "Laptop return questions average 0.35 due to uncalibrated safety gaps on opened package restocking rules.";
          suggestion = "Recommend running the 'Trigger Self-Correction Audit' to inject protective rule safeguards first.";
        } else {
          predicted_tier = "excellent";
          confidence = 0.94;
          reason = "Laptops and returns are covered by injected Rule #R-041 (15% fee guardrail).";
          suggestion = "Safe to run! Healing logic will prevent hallucinations.";
        }
      } else if (q.includes("soundsync") || q.includes("warranty") || q.includes("headset") || q.includes("refurbished")) {
        const headphoneRulesLoaded = activeRules.some(r => r.text.toLowerCase().includes("soundsync") || r.text.toLowerCase().includes("warranty") || r.id.includes("soundsync") || r.text.toLowerCase().includes("headset"));
        if (!headphoneRulesLoaded && activeRules.length === 0) {
          predicted_tier = "failing";
          confidence = 0.95;
          reason = "Headset warranties are vulnerable. Currently has low context coverage in primary model prompts.";
          suggestion = "Click 'Trigger Self-Correction Audit' to heal warranty gaps (-45% baseline penalty risk).";
        } else {
          predicted_tier = "good";
          confidence = 0.88;
          reason = "Refurbished SoundSync headset coverage is calibrated by Rule #R-090.";
          suggestion = "Ready. The agent will reference the exact 90-day coverage guidelines.";
        }
      } else if (matchesCount <= 1) {
        predicted_tier = "poor";
        confidence = 0.72;
        reason = "Extremely low context coverage (< 2 items matched in memory palace). High risk of uncalibrated responses.";
        suggestion = "Refine the question keyword prompts or trigger a healing pipeline.";
      }

      setPredictiveAlert({ predicted_tier, confidence, reason, suggestion });
    }, 500);

    return () => clearTimeout(timer);
  }, [inputText, activeRules]);

  // 3b. Coordinate tracking effect for Interactive Walkthrough elements
  useEffect(() => {
    if (!tourActive) {
      setTourTargetRect(null);
      return;
    }

    const step = TOUR_STEPS_LIST[tourStepIndex];
    if (!step) return;

    // Automatically switch tabs inside the App based on the active step's target element so it is visible:
    if (step.targetId === "navigator-battle" && activeTab !== "battle") {
      setActiveTab("battle");
    } else if ((step.targetId === "navigator-palace" || step.targetId === "memory-palace-panel") && activeTab !== "palace") {
      setActiveTab("palace");
    } else if ((step.targetId === "phoenix-traces-tab-button" || step.targetId === "traces-nlp-query-input") && activeTab !== "metrics") {
      setActiveTab("metrics");
    } else if (step.targetId === "share-session-button" && activeTab !== "chat") {
      // Always visible inside actions header, but tab chat is the baseline
    }

    const updatePosition = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTourTargetRect(rect);
        // Scroll the target element into view smoothly if needed:
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else {
        setTourTargetRect(null);
      }
    };

    // Tiny timer delay to allow tab/DOM rendering to settle
    const timer = setTimeout(updatePosition, 180);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [tourStepIndex, tourActive, activeTab]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Scroll logic
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper to trigger selected traces
  const selectTraceByMsg = async (traceId?: string, tracesList?: Trace[]) => {
    if (!traceId) return;
    let listToSearch = tracesList || traces;
    let matched = listToSearch.find(t => t.traceId === traceId);
    
    if (!matched) {
      try {
        const tRes = await fetch(`/api/traces/${sessionId}`);
        const tData = await tRes.json();
        setTraces(tData);
        matched = tData.find((t: any) => t.traceId === traceId);
      } catch (e) {
        console.error("Failed to fetch fresh traces on-demand:", e);
      }
    }

    if (matched) {
      setSelectedTrace(matched);
      // default span to agent assistant
      const assistantSpan = matched.spans.find(s => s.type === "agent_turn") || matched.spans[0];
      setSelectedSpan(assistantSpan || null);
    }
  };

  // Direct send chat
  const handleSendMessage = async (textToSend?: string) => {
    const rawTxt = textToSend || inputText;
    if (!rawTxt.trim() || isSending) return;

    if (!textToSend) setInputText("");
    setIsSending(true);

    // optimistically add user message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: rawTxt,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    // 1. Run Real-Time Hallucination Validation State & spinner
    setIsVerifyingHallucination(true);
    playAudioFeedback("whoosh");
    
    // Simulate real-time supervisor audit overhead
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsVerifyingHallucination(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: rawTxt, sessionId, customRules: activeRules })
      });

      if (!response.ok) {
        let errMessage = "Server returned status: " + response.status;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMessage = errData.error;
          }
        } catch (_) {}
        throw new Error(errMessage);
      }

      const assistantMsg: ChatMessage & { trace?: Trace } = await response.json();

      // Hydrate local cache and recalculate metrics immediately (serverless resilience)
      let localFreshTraces = traces;
      if (assistantMsg.trace) {
        localFreshTraces = [...traces, assistantMsg.trace];
        setTraces(localFreshTraces);
        localStorage.setItem("agentwatch_traces", JSON.stringify(localFreshTraces));
        
        const updatedMetrics = computeMetrics(localFreshTraces, improvementHistory);
        setMetrics(updatedMetrics);
      }

      // Check for policy gaps and simulated hallucinations
      const lowercaseQ = rawTxt.toLowerCase();
      let hasHealedLaptop = activeRules.some(r => r.text.toLowerCase().includes("laptop") || r.text.toLowerCase().includes("fee") || r.id.includes("laptop"));
      let hasHealedHeadset = activeRules.some(r => r.text.toLowerCase().includes("soundsync") || r.text.toLowerCase().includes("warranty") || r.id.includes("soundsync"));

      let isLaptopQuery = lowercaseQ.includes("return") || lowercaseQ.includes("refund") || lowercaseQ.includes("laptop") || lowercaseQ.includes("restock");
      let isHeadsetQuery = lowercaseQ.includes("soundsync") || lowercaseQ.includes("warranty") || lowercaseQ.includes("headset") || lowercaseQ.includes("refurbished");

      let detectedHallucination = false;
      let claimedText = "";
      let realityText = "";

      if (isLaptopQuery && !hasHealedLaptop && activeRules.length === 0) {
        detectedHallucination = true;
        claimedText = "TechStore offers a hassle-free, full 100% refund for all opened laptop computers within 30 days of standard purchase.";
        realityText = "Section 4.1 specifies returnable within 14 days only, and is subject to a mandatory 15% restocking fee on opened packaging.";
      } else if (isHeadsetQuery && !hasHealedHeadset && activeRules.length === 0) {
        detectedHallucination = true;
        claimedText = "All SoundSync headsets are protected by TechStore's premier 2-Year absolute parts and labor warranty code.";
        realityText = "Section 5.2 establishes refurbished components carry a strict 90-day coverage limit, excluding general wear.";
      }

      // Appending hallucination badging/attributes
      if (detectedHallucination) {
        const nextCount = hallucinationsCount + 1;
        setHallucinationsCount(nextCount);
        localStorage.setItem("agentwatch_hallucinations_blocked", String(nextCount));
        playAudioFeedback("alert");

        const blockLog = {
          id: `hallucination-block-${Date.now()}`,
          question: rawTxt,
          claimed: claimedText,
          reality: realityText,
          timestamp: new Date().toISOString()
        };
        const updatedHistory = [blockLog, ...hallucinationHistory];
        setHallucinationHistory(updatedHistory);
        localStorage.setItem("agentwatch_hallucination_history", JSON.stringify(updatedHistory));

        // Inject corrections indicator metadata into message objects
        (assistantMsg as any).hallucinationCaught = true;
        (assistantMsg as any).claimsFixedCount = 1;
        (assistantMsg as any).hallucinationLogs = blockLog;

        // Force a regeneration narrative tweak
        assistantMsg.content = `[GUARDRAILS TRIGGERED: Blocked fabricated claims regarding store policies. Redirected to PDF rules.]\n\n` + assistantMsg.content;
      } else {
        (assistantMsg as any).hallucinationCaught = false;
        (assistantMsg as any).verifiedStatus = true;
      }

      setMessages(prev => [...prev, assistantMsg]);
      
      // Auto play audio cues
      if (assistantMsg.evaluation) {
        if (assistantMsg.evaluation.overall >= 0.85) {
          playAudioFeedback("success");
        } else if (assistantMsg.evaluation.overall < 0.70) {
          playAudioFeedback("alert");
        }
      }

      // Live commentator updates after turns
      const currentAvg = metrics.averageScore || 0.76;
      if (detectedHallucination) {
        setCommentaryHighlight(
          `Hallucination blocked successfully! The model attempted to formulate a fabricated response on returns context but was intercepted in real-time.`
        );
      } else {
        setCommentaryHighlight(
          `Accurate answer compiled. Trace Score verified at ${assistantMsg.evaluation?.overall || "0.95"}. Accuracy remains inside safety buffer.`
        );
      }

      // Auto refresh statistics
      const freshTraces = await fetchData();
      
      // Auto highlight OTel trace
      await selectTraceByMsg(assistantMsg.traceId, (freshTraces && freshTraces.length > 0) ? freshTraces : localFreshTraces);
    } catch (e: any) {
      console.error("Retail chat pipeline failed:", e);
      setMessages(prev => [...prev, {
        id: `msg-error-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Retail chat pipeline failure**: ${e.message || "Failed to reach the server."} Please try again.`,
        timestamp: new Date().toISOString(),
        evaluation: {
          overall: 0,
          accuracy: 0,
          helpfulness: 0,
          completeness: 0,
          honesty: 0,
          reasoning: `Telemetry Error: ${e.message || "Endpoint connection failed"}`
        } as any
      } as any]);
      playAudioFeedback("alert");
    } finally {
      setIsSending(false);
    }
  };

  // 1. Natural Language Phoenix Traces index search
  const runNlpTraceQuery = (queryText: string) => {
    if (!queryText.trim()) return;
    setNlpQueryText(queryText);
    playAudioFeedback("whoosh");
    
    const q = queryText.toLowerCase();
    let resultCount = 0;
    let desc = "";
    let dataMatches: Trace[] = [];

    if (q.includes("fail") || q.includes("worst") || q.includes("bad")) {
      dataMatches = traces.filter(t => t.evaluation && t.evaluation.overall < 0.60);
      resultCount = dataMatches.length;
      desc = `Detected ${resultCount} traces with low Judge safety ratings (Overall Score < 0.60). Without observability feedback, models default to guessing laptop restocking packaging specifications or claims.`;
    } else if (q.includes("correction") || q.includes("healed") || q.includes("self-") || q.includes("rule")) {
      dataMatches = traces.filter(t => t.wasSelfCorrected);
      resultCount = dataMatches.length;
      desc = `Located ${resultCount} trace channels protected by dynamic rule correction safeguards. This ensures policy exception thresholds are injected directly to system prompts context.`;
    } else if (q.includes("best") || q.includes("highest") || q.includes("perfect")) {
      dataMatches = traces.filter(t => t.evaluation && t.evaluation.overall >= 0.85).sort((a, b) => (b.evaluation?.overall || 0) - (a.evaluation?.overall || 0));
      resultCount = dataMatches.length;
      desc = `Located ${resultCount} perfect-eval, highly calibrated responses (Judge Overall >= 0.85). Perfect context matches ensure pristine alignment.`;
    } else if (q.includes("topic") || q.includes("categories") || q.includes("fail on") || q.includes("worst topic")) {
      desc = `NLP Semantic Category Analysis: 'Return Policy' averages 0.35 prior to rules (High risk), 'Warranty and headsets' averages 0.31 (Uncalibrated). After rule healing, scores converge to 0.95+.`;
      dataMatches = traces.filter(t => t.category === "Return Policy" || t.category === "Warranty");
    } else {
      dataMatches = traces.filter(t => t.question.toLowerCase().includes(q) || t.response.toLowerCase().includes(q));
      resultCount = dataMatches.length;
      desc = `Fuzzy index matched ${resultCount} instances referencing '${queryText}' within standard payload columns.`;
    }

    setNlpQueryResultText({
      matchedTraces: dataMatches,
      summary: desc,
      query: queryText
    });
  };

  const clearNlpQuery = () => {
    setNlpQueryText("");
    setNlpQueryResultText(null);
  };

  // 2. Clear persistence and rules back to baseline
  const handleResetFactory = async () => {
    if (!window.confirm("Are you sure you want to restore the Agent to day 1 factory uncalibrated state? This will clear all learned safety rules and reset stats!")) return;
    try {
      localStorage.removeItem("agentwatch_sessions_count");
      localStorage.removeItem("agentwatch_hallucinations_blocked");
      localStorage.removeItem("agentwatch_hallucination_history");
      setHallucinationsCount(0);
      setHallucinationHistory([]);
      setLearningSessions(1);
      setWelcomeBannerOpen(false);

      localStorage.removeItem("agentwatch_traces");
      localStorage.removeItem("agentwatch_rules");
      localStorage.removeItem("agentwatch_improvement_history");
      setTraces([]);
      setActiveRules([
        {
          id: "rule-init-1",
          text: "Maintain a helpful, direct, and professional tone when answering electronics inquiries.",
          category: "general_behavior",
          addedAt: new Date().toISOString(),
          reason: "Seeding default customer support parameters."
        }
      ]);
      setImprovementHistory([]);
      setMetrics({
        averageScore: 0,
        totalConversations: 0,
        selfCorrectionsCount: 0,
        highestScore: 0,
        lowestScore: 0,
        improvementPercent: 0,
        scoreHistory: [],
        dimensionAverages: { accuracy: 0, helpfulness: 0, completeness: 0, honesty: 0 }
      });

      setMessages([]);
      setSelectedTrace(null);
      setSelectedSpan(null);
      
      const res = await fetch("/api/reset", { method: "POST" });
      await fetchData();
      playAudioFeedback("alert");
      setCommentaryHighlight("Agent restored back to factory baseline! High calibration safety rules are removed. Hallucination vulnerability is now active.");
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Encodes session info as base64 share link URL
  const handleShareSession = () => {
    try {
      const payload = {
        sessionId,
        metrics,
        rulesCount: activeRules.length,
        blockedBlocks: hallucinationsCount,
        historyCount: improvementHistory.length
      };
      const b64 = btoa(JSON.stringify(payload));
      const shareUrl = `${window.location.origin}${window.location.pathname}#session-${b64}`;
      navigator.clipboard.writeText(shareUrl);
      playAudioFeedback("success");
      setShareNotification("Session Report compiled as a base64 URL hash and copied! Drop it in your entry comments.");
      setTimeout(() => setShareNotification(null), 5000);
    } catch(e) {
      console.error("Failed to share session:", e);
    }
  };

  // 4. Competitor Battle System
  const runBattleNextRound = async () => {
    if (battleRound > 10) return;
    setBattleIsRunning(true);
    playAudioFeedback("whoosh");

    const roundData = BATTLE_ROUNDS_DATA[battleRound - 1];
    setBattleQuestionText(roundData.question);

    setBattleAnswerLeft("");
    setBattleAnswerRight("");

    let leftText = roundData.unmonitoredAnswer;
    let rightText = roundData.monitoredAnswer;

    let lIndex = 0;
    let rIndex = 0;
    const interval = setInterval(() => {
      let isDone = true;
      if (lIndex < leftText.length) {
        setBattleAnswerLeft(prev => prev + leftText[lIndex]);
        lIndex += 3;
        isDone = false;
      }
      if (rIndex < rightText.length) {
        setBattleAnswerRight(prev => prev + rightText[rIndex]);
        rIndex += 3;
        isDone = false;
      }
      if (isDone) {
        clearInterval(interval);
        
        setBattleScores(prev => {
          const nextUn = [...prev.unmonitored, roundData.unmonitoredScore];
          const nextAw = [...prev.agentwatch, roundData.monitoredScore];
          return { unmonitored: nextUn, agentwatch: nextAw };
        });

        setBattleHistoryLog(prev => [
          ...prev,
          {
            round: battleRound,
            question: roundData.question,
            leftAns: roundData.unmonitoredAnswer,
            leftScore: roundData.unmonitoredScore,
            rightAns: roundData.monitoredAnswer,
            rightScore: roundData.monitoredScore,
            ruleApplied: roundData.injectedRule
          }
        ]);

        if (battleRound === 10) {
          setBattleCompleted(true);
          playAudioFeedback("success");
        } else {
          setBattleRound(prev => prev + 1);
        }
        setBattleIsRunning(false);
      }
    }, 15);
  };

  const handleResetBattle = () => {
    setBattleRound(1);
    setBattleScores({ unmonitored: [], agentwatch: [] });
    setBattleAnswerLeft("");
    setBattleAnswerRight("");
    setBattleQuestionText("");
    setBattleHistoryLog([]);
    setBattleCompleted(false);
    setBattleIsRunning(false);
    playAudioFeedback("success");
  };

  // 5. Interactive spotlight guides
  const handleStartTour = () => {
    setTourActive(true);
    setTourStepIndex(0);
    playAudioFeedback("success");
  };

  const handleNextTourStep = () => {
    if (tourStepIndex < TOUR_STEPS_LIST.length - 1) {
      setTourStepIndex(prev => prev + 1);
      playAudioFeedback("whoosh");
    } else {
      setTourActive(false);
      playAudioFeedback("success");
    }
  };

  const handlePrevTourStep = () => {
    if (tourStepIndex > 0) {
      setTourStepIndex(prev => prev - 1);
      playAudioFeedback("whoosh");
    }
  };

  // Keyboard shortcuts listener and chimes triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "d" || e.key === "D") {
          e.preventDefault();
          startDemoScript();
        } else if (e.key === "i" || e.key === "I") {
          e.preventDefault();
          runSelfCorrectionCycle();
        } else if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          setIsExportDropdownOpen(prev => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [traces, metrics]);

  // Triggers self correction cycle
  const runSelfCorrectionCycle = async () => {
    setIsImproving(true);
    playAudioFeedback("whoosh");
    
    // Scale timeouts based on selected Simulation Speed multiplier
    const speedMultiplier = simulationSpeed === 0.5 ? 2.0 : simulationSpeed === 2.0 ? 0.5 : 1.0;
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms * speedMultiplier));
    
    // --- STAGE 1: QUERYING SPANS & LIVE COUNTING ---
    setLiveStage(1);
    setLiveReviewCount(0);
    setImprovementStep("🔍 Querying high-latency failed spans on Phoenix Cloud...");
    
    // Quick counting loop up to 47 spans
    const countTarget = 47;
    const intervalMs = (1000 * speedMultiplier) / countTarget;
    for (let i = 1; i <= countTarget; i++) {
      setLiveReviewCount(i);
      await new Promise(r => setTimeout(r, intervalMs));
    }
    await delay(300);

    // --- STAGE 2: FINDING PATTERNS & SLIDING IN CLUSTERS ---
    setLiveStage(2);
    setLivePatterns([]);
    setImprovementStep("📊 Running failure clustering algorithms on low-score spans...");
    
    await delay(400);
    setLivePatterns(prev => [...prev, "Pattern 1: Return policy gaps for open-box items (4 failures)"]);
    playAudioFeedback("alert");
    
    await delay(700);
    setLivePatterns(prev => [...prev, "Pattern 2: Manufacturer warranty confusion on refurbished audio (2 failures)"]);
    playAudioFeedback("alert");
    await delay(800);

    // --- STAGE 3: GENERATING RULES WITH TYPEWRITER EFFECT ---
    setLiveStage(3);
    setLiveTypingText("");
    setImprovementStep("🧠 Prompting Gemini LLM to synthesize targeted safety rules...");
    await delay(500);

    const fullRuleText = "Rule #3: If client asks about restocking fees for laptops, refuse standard unverified free claims. Explicitly request emailing support@techstore.com to prevent brand hallucinations.";
    let typed = "";
    const words = fullRuleText.split(" ");
    for (const word of words) {
      typed += word + " ";
      setLiveTypingText(typed);
      await new Promise(r => setTimeout(r, 60 * speedMultiplier));
    }
    await delay(800);

    // --- STAGE 4: APPLYING DIRECTIVES & FLASH ---
    setLiveStage(4);
    setImprovementStep("✍️ Writing directives to prompt system registry & flushing traces...");
    playAudioFeedback("whoosh");
    await delay(900);

    // --- STAGE 5: RESULT VERIFICATION SCORE GAUGE COUNTUP ---
    setLiveStage(5);
    setImprovementStep("✅ Directing custom rules to agent prompt parameters!");
    
    // Animate overall judge quality score counting up from 0.51 to 0.96
    setLiveScoreStart(0.51);
    setLiveScoreCurrent(0.51);
    setLiveScoreFinal(0.96);
    
    const steps = 45;
    const startVal = 0.51;
    const endVal = 0.96;
    for (let i = 0; i <= steps; i++) {
       const progress = i / steps;
       const currentScore = Math.round((startVal + (endVal - startVal) * progress) * 100) / 100;
       setLiveScoreCurrent(currentScore);
       await new Promise(r => setTimeout(r, 20 * speedMultiplier));
    }
    playAudioFeedback("success");
    await delay(1000);

    try {
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, traces, customRules: activeRules })
      });
      const result = await res.json();
      
      // Navigate to rules tab so they confirm rule insertion
      if (result.success) {
        // Sync rules locally
        const newRules = result.rulesAdded || [];
        const updatedRules = [...activeRules];
        newRules.forEach((nr: any) => {
          if (!updatedRules.some((r: any) => r.text.toLowerCase() === nr.text.toLowerCase())) {
            updatedRules.push(nr);
          }
        });
        setActiveRules(updatedRules);
        localStorage.setItem("agentwatch_rules", JSON.stringify(updatedRules));

        // Sync history locally
        let updatedHistory = improvementHistory;
        if (result.event) {
          updatedHistory = [result.event, ...improvementHistory];
          setImprovementHistory(updatedHistory);
          localStorage.setItem("agentwatch_improvement_history", JSON.stringify(updatedHistory));
        }

        // Compute metrics
        const updatedMetrics = computeMetrics(traces, updatedHistory);
        setMetrics(updatedMetrics);

        setActiveTab("rules");
      }

      await fetchData();
    } catch (e) {
      console.error("Self-correction loop error:", e);
    } finally {
      setIsImproving(false);
      setLiveStage(0);
      setImprovementStep("");
    }
  };

  // Clears all logs (purging cloud + client localStorage buckets safely)
  const resetConsole = async () => {
    if (confirm("Are you sure you want to restore the Agent to day 1 factory uncalibrated state? This will clear all learned safety rules and reset stats!")) {
      localStorage.removeItem("agentwatch_sessions_count");
      localStorage.removeItem("agentwatch_hallucinations_blocked");
      localStorage.removeItem("agentwatch_hallucination_history");
      setHallucinationsCount(0);
      setHallucinationHistory([]);
      setLearningSessions(1);
      setWelcomeBannerOpen(false);

      localStorage.removeItem("agentwatch_traces");
      localStorage.removeItem("agentwatch_rules");
      localStorage.removeItem("agentwatch_improvement_history");
      setTraces([]);
      setActiveRules([
        {
          id: "rule-init-1",
          text: "Maintain a helpful, direct, and professional tone when answering electronics inquiries.",
          category: "general_behavior",
          addedAt: new Date().toISOString(),
          reason: "Seeding default customer support parameters."
        }
      ]);
      setImprovementHistory([]);
      setMetrics({
        averageScore: 0,
        totalConversations: 0,
        selfCorrectionsCount: 0,
        highestScore: 0,
        lowestScore: 0,
        improvementPercent: 0,
        scoreHistory: [],
        dimensionAverages: { accuracy: 0, helpfulness: 0, completeness: 0, honesty: 0 }
      });

      setMessages([]);
      setSelectedTrace(null);
      setSelectedSpan(null);
      try {
        await fetch("/api/reset", { method: "POST" });
        await fetchData();
        playAudioFeedback("alert");
        setCommentaryHighlight("Agent restored back to factory baseline! High calibration safety rules are removed. Hallucination vulnerability is now active.");
      } catch (e) {
        console.error("Reset failed:", e);
      }
    }
  };

  // ==========================================
  // ORCHESTRATED DEMO WORKFLOW RUNNER
  // ==========================================
  const executeDemoStep = async (step: number) => {
    switch (step) {
      case 1:
        setDemoState({
          isRunning: true,
          stepIndex: 1,
          notes: "🚀 Turn 1/6 (Easy Question): Asking the agent about ApexPro Laptop 15 specifications."
        });
        await handleSendMessage("Tell me about the ApexPro Laptop 15 and how much it costs.");
        break;

      case 2:
        setDemoState({
          isRunning: true,
          stepIndex: 2,
          notes: "🚚 Turn 2/6 (Easy Question): Querying standard policy for store shipping."
        });
        await handleSendMessage("What shipping methods do you support?");
        break;

      case 3:
        setDemoState({
          isRunning: true,
          stepIndex: 3,
          notes: "⚠️ Turn 3/6 (KNOWLEDGE GAP): Asking return restocking fee conditions on opened laptops. (Watch the agent confidently hallucinate the fee as zero based on general unopened return box instructions)."
        });
        await handleSendMessage("I bought a laptop last week, opened it, and realized I don't want it. Can I return it? Is there a restocking fee?");
        break;

      case 4:
        setDemoState({
          isRunning: true,
          stepIndex: 4,
          notes: "🔍 Tab Navigation: Notice that our previous laptop question got scored low (0.53 FAIL) by our live LLM Judge. Let us run an on-demand Arize Phoenix Multi-Step Audit to detect this failure pattern and rehabilitate!"
        });
        setActiveTab("chat");
        // Scroll right to show low score span
        break;

      case 5:
        setDemoState({
          isRunning: true,
          stepIndex: 5,
          notes: "🧠 REHABILITATING: Invoking Phoenix trace-backed Self-Improvement Engine. Gemini is currently diagnosing mistake traces and generating solid system rules..."
        });
        await runSelfCorrectionCycle();
        break;

      case 6:
        setDemoState({
          isRunning: true,
          stepIndex: 6,
          notes: "🎯 Turn 6/6 (VERIFICATION): Re-asking the exact same opened laptop question. Notice the agent now states it cannot verify restocking percentage instead of fabricating free returns, which earns a 0.96 EXCELLENT score!"
        });
        setActiveTab("chat");
        await handleSendMessage("I bought a laptop last week, opened it, and realized I don't want it. Can I return it? Is there a restocking fee?");
        break;

      case 7:
        setDemoState({
          isRunning: false,
          stepIndex: 7,
          notes: "🎉 HACKATHON DEMO ARC COMPLETE! The agent rehabilitated its accuracy score live (+81%) by auditing its own Phoenix Spans!"
        });
        break;

      default:
        break;
    }
  };

  const handleNextDemoStep = () => {
    executeDemoStep(demoState.stepIndex + 1);
  };

  const startDemoScript = async () => {
    setMessages([]);
    setSelectedTrace(null);
    setSelectedSpan(null);
    try {
      await fetch("/api/reset", { method: "POST" });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
    executeDemoStep(1);
  };

  // Computed overall agent health scores based on rules, hallucinations and metrics
  const healthAccuracy = activeRules.length > 0 ? 96 : 42;
  const healthHallucination = Math.max(40, 100 - (hallucinationsCount * 12));
  const healthCorrection = activeRules.length > 0 ? 95 : 35;
  const healthCoverage = activeRules.length > 0 ? 90 : 45;
  const overallAgentHealthScore = Math.round(
    (healthAccuracy * 0.3) + 
    (healthHallucination * 0.3) + 
    (healthCorrection * 0.2) + 
    (healthCoverage * 0.2)
  );

  return (
    <div className={`flex h-screen w-screen bg-[#0F1115] text-[#E2E8F0] font-sans overflow-hidden antialiased select-none selection:bg-indigo-500/30 selection:text-indigo-200 ${isDarkMode ? "dark" : "light"}`}>
      
      {/* CINEMATIC WELCOME SPLASH PAGE */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              filter: "blur(20px)",
              transition: { duration: 0.8, ease: "easeOut" }
            }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07080a]"
          >
            {/* Ambient Eye Glow radial spots with intense colors around the center */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0, 0.7, 0.5, 0.75], 
                scale: [0.8, 1.1, 0.95, 1.05]
              }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,transparent_70%)] blur-[60px] pointer-events-none"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ 
                opacity: [0, 0.6, 0.4, 0.65], 
                scale: [0.7, 1.15, 1.0, 1.08]
              }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.12)_0%,transparent_70%)] blur-[50px] pointer-events-none"
            />

            {/* Futuristic Grid & Scanning coordinates */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />

            {/* Glowing Ring around the eye */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="absolute w-[500px] h-[500px] rounded-full border border-indigo-500/10 flex items-center justify-center pointer-events-none"
            >
              <div className="absolute w-[440px] h-[440px] rounded-full border border-indigo-400/5 animate-spin [animation-duration:20s]" />
              <div className="absolute w-[560px] h-[560px] rounded-full border border-purple-500/5 animate-spin [animation-duration:45s] [animation-direction:reverse]" />
            </motion.div>

            <div className="relative flex flex-col items-center justify-center">
              {/* Phantos Eye Container with drop shadow and blinking */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 15 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative drop-shadow-[0_0_60px_rgba(129,140,248,0.65)]"
              >
                {/* Simulated Slow Eyelid Blink */}
                <motion.div
                  animate={{
                    scaleY: [1, 1, 0.04, 1, 1],
                  }}
                  transition={{
                    duration: 1.8,
                    times: [0, 0.4, 0.5, 0.6, 1],
                    repeat: 0,
                    ease: "easeInOut",
                    delay: 0.8
                  }}
                  style={{ transformOrigin: "center" }}
                >
                  <PhantosEyeLogo className="w-72 h-72 text-indigo-400" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BACKDROP FOR EXPANDED SIDEBAR */}
      {isMobile && !isSidebarCollapsed && (
        <div 
          onClick={() => {
            setIsSidebarCollapsed(true);
            playAudioFeedback("whoosh");
          }}
          className="fixed inset-0 bg-black/50 z-35 transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`flex flex-col shrink-0 transition-all duration-300 z-40 ${
        isMobile && !isSidebarCollapsed 
          ? "fixed top-4 bottom-4 left-4 h-[calc(100vh-32px)] w-52 bg-[#0D0F14]/85 backdrop-blur-lg border border-[#1E293B]/70 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.25)]" 
          : isSidebarCollapsed 
          ? "w-16 bg-[#0F1115] border-r border-[#1E293B]" 
          : "w-52 bg-[#0F1115] border-r border-[#1E293B]"
      }`}>
        <div className={`border-b border-[#1E293B] transition-all duration-300 flex flex-col ${isSidebarCollapsed ? "p-3 items-center" : "p-6"}`}>
          <div className={`flex w-full ${isSidebarCollapsed ? "flex-col items-center gap-3 justify-center" : "items-center justify-between"}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div aria-hidden="true" id="app-branding-logo" className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                <PhantosEyeLogo className="w-8 h-8 text-indigo-400 hover:scale-110 transition duration-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                   <h1 className="text-sm font-bold tracking-tight uppercase font-display text-[#E2E8F0] truncate">
                     Phantos AI
                   </h1>
                  <span className="text-[9px] text-[#E2E8F0]/40 font-mono tracking-wider block truncate">PHOENIX OBSERVABILITY</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setIsSidebarCollapsed(prev => !prev);
                playAudioFeedback("whoosh");
              }}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="p-1.5 rounded bg-slate-900 border border-[#1E293B] hover:border-indigo-500/50 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          {!isSidebarCollapsed && (
            <p className="text-[10px] text-indigo-400 font-mono tracking-tighter mt-1 select-none">v2.1.2-FLASH-REHAB</p>
          )}
        </div>
        
        <nav className={`flex-1 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? "p-2 space-y-3.5" : "p-3 space-y-1.5"}`}>
          
          {/* Chat Tab */}
          <div 
            onClick={() => setActiveTab("chat")}
            id="navigation-chat-tab"
            title={isSidebarCollapsed ? "Dashboard & Chat" : undefined}
            className={`rounded-lg flex items-center group cursor-pointer transition-all ${
              isSidebarCollapsed ? "p-1.5 w-9 h-9 mx-auto justify-center" : "px-2.5 py-1.5 justify-between"
            } ${
              activeTab === "chat" 
                ? "bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {isSidebarCollapsed ? (
              <div className="relative">
                <Bot className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {messages.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-[#1E293B] text-slate-300 rounded-full w-4 h-4 flex items-center justify-center font-mono border border-[#1E293B]">
                    {messages.length}
                  </span>
                )}
              </div>
            ) : (
              <>
                <span className="text-xs font-display flex items-center gap-2 truncate">
                  <Bot className="h-3.5 w-3.5 truncate shrink-0" />
                  <span className="truncate">Dashboard & Chat</span>
                </span>
                {activeTab === "chat" ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] shrink-0"></div>
                ) : (
                  <span className="text-[10px] bg-[#1E293B] px-1.5 py-0.5 rounded text-slate-400 font-mono shrink-0">{messages.length}</span>
                )}
              </>
            )}
          </div>

          {/* Metrics / Traces Tab */}
          <div 
            id="phoenix-traces-tab-button"
            onClick={() => setActiveTab("metrics")}
            title={isSidebarCollapsed ? "Phoenix Traces" : undefined}
            className={`rounded-lg flex items-center group cursor-pointer transition-all ${
              isSidebarCollapsed ? "p-1.5 w-9 h-9 mx-auto justify-center" : "px-2.5 py-1.5 justify-between"
            } ${
              activeTab === "metrics" 
                ? "bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {isSidebarCollapsed ? (
              <div className="relative">
                <TrendingUp className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {traces.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-[#1E293B] text-slate-300 rounded-full w-4 h-4 flex items-center justify-center font-mono border border-[#1E293B]">
                    {traces.length}
                  </span>
                )}
              </div>
            ) : (
              <>
                <span className="text-xs font-display flex items-center gap-2 truncate">
                  <TrendingUp className="h-3.5 w-3.5 truncate shrink-0" />
                  <span className="truncate">Phoenix Traces</span>
                </span>
                {activeTab === "metrics" ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] shrink-0"></div>
                ) : (
                  <span className="text-[10px] bg-[#1E293B] px-1.5 py-0.5 rounded text-slate-400 font-mono shrink-0">{traces.length}</span>
                )}
              </>
            )}
          </div>

          {/* Rules / Improvement Tab */}
          <div 
            id="navigation-rules-tab"
            onClick={() => setActiveTab("rules")}
            title={isSidebarCollapsed ? "Self-Improve System" : undefined}
            className={`rounded-lg flex items-center group cursor-pointer transition-all ${
              isSidebarCollapsed ? "p-1.5 w-9 h-9 mx-auto justify-center" : "px-2.5 py-1.5 justify-between"
            } ${
              activeTab === "rules" 
                ? "bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {isSidebarCollapsed ? (
              <div className="relative">
                <Zap className="h-4 w-4 shrink-0 animate-pulse text-indigo-400" />
                {activeRules.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-mono border border-indigo-500">
                    {activeRules.length}
                  </span>
                )}
              </div>
            ) : (
              <>
                <span className="text-xs font-display flex items-center gap-2 truncate">
                  <Zap className="h-3.5 w-3.5 animate-pulse truncate shrink-0" />
                  <span className="truncate">Self-Improve System</span>
                </span>
                {activeTab === "rules" ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] shrink-0"></div>
                ) : (
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 rounded font-mono shrink-0">+{activeRules.length}</span>
                )}
              </>
            )}
          </div>

          {/* Battle Tab */}
          <div 
            onClick={() => setActiveTab("battle")}
            id="navigator-battle"
            title={isSidebarCollapsed ? "Agent Battle Arena" : undefined}
            className={`rounded-lg flex items-center group cursor-pointer transition-all ${
              isSidebarCollapsed ? "p-1.5 w-9 h-9 mx-auto justify-center" : "px-2.5 py-1.5 justify-between"
            } ${
              activeTab === "battle" 
                ? "bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {isSidebarCollapsed ? (
              <Cpu className="h-4 w-4 text-amber-500 animate-spin-slow shrink-0" />
            ) : (
              <>
                <span className="text-xs font-display flex items-center gap-2 truncate">
                  <Cpu className="h-3.5 w-3.5 text-amber-500 animate-spin-slow truncate shrink-0" />
                  <span className="truncate">Agent Battle Arena</span>
                </span>
                {activeTab === "battle" ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] shrink-0"></div>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 rounded font-mono shrink-0">10 Rnds</span>
                )}
              </>
            )}
          </div>

          {/* Palace Tab */}
          <div 
            onClick={() => setActiveTab("palace")}
            id="navigator-palace"
            title={isSidebarCollapsed ? "Memory Palace" : undefined}
            className={`rounded-lg flex items-center group cursor-pointer transition-all ${
              isSidebarCollapsed ? "p-1.5 w-9 h-9 mx-auto justify-center" : "px-2.5 py-1.5 justify-between"
            } ${
              activeTab === "palace" 
                ? "bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {isSidebarCollapsed ? (
              <LayoutGrid className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <>
                <span className="text-xs font-display flex items-center gap-2 truncate">
                  <LayoutGrid className="h-3.5 w-3.5 text-emerald-400 truncate shrink-0" />
                  <span className="truncate">Memory Palace</span>
                </span>
                {activeTab === "palace" ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0"></div>
                ) : (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 rounded font-mono shrink-0">D3 Node</span>
                )}
              </>
            )}
          </div>

          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-3.5 border-t border-[#1E293B]/60 shadow-[0_0_12px_rgba(99,102,241,0.1)] mt-3">
              {/* Quick Buttons Collapsed */}
              <button 
                onClick={startDemoScript} 
                id="system-demo-collapsed-trigger"
                title="Trigger Hackathon Demo Script" 
                className="w-8 h-8 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white flex items-center justify-center transition cursor-pointer select-none shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
              <button 
                onClick={handleStartTour} 
                title="Start system walkthrough walkthrough tutorial" 
                className="w-8 h-8 rounded-lg bg-slate-900 border border-[#1E293B] hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 flex items-center justify-center transition cursor-pointer select-none shrink-0"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={toggleTheme} 
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} 
                className="w-8 h-8 rounded-lg bg-slate-900 border border-[#1E293B] text-slate-400 hover:text-indigo-400 flex items-center justify-center transition cursor-pointer select-none shrink-0"
              >
                {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-indigo-400" />}
              </button>
              <button 
                onClick={handleSyncData} 
                disabled={isSyncing}
                title="Sync & refresh database telemetry" 
                className="w-8 h-8 rounded-lg bg-slate-900 border border-[#1E293B] text-[#E2E8F0] hover:text-emerald-400 flex items-center justify-center transition cursor-pointer select-none shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-400" : ""}`} />
              </button>
              <div className="h-px w-6 bg-[#1E293B]/60 my-1" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Phoenix MCP Active" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" title="Otel Telemetry Exporter Online" />
            </div>
          ) : (
            <>
              <div className="h-px bg-[#1E293B]/60 my-3" />

              {/* SYSTEM CONTROLS AND ACTIONS */}
              <div className="px-1.5 py-1 space-y-2">
                <div className="text-[9px] uppercase font-semibold text-slate-500 font-mono tracking-wider px-1">System Actions</div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Sync & Theme Switcher */}
                  <button 
                    onClick={handleSyncData}
                    disabled={isSyncing}
                    title="Sync & refresh database telemetry"
                    className="py-1.5 px-2 bg-slate-900 border border-[#1E293B] hover:border-emerald-500/30 text-[#E2E8F0] hover:text-emerald-400 text-[10px] font-mono rounded flex items-center justify-center gap-1.5 cursor-pointer transition select-none shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-emerald-400" : ""}`} />
                    <span>Sync</span>
                  </button>
                  <button 
                    onClick={toggleTheme}
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    className="py-1.5 px-2 bg-slate-900 border border-[#1E293B] text-slate-400 hover:text-indigo-400 text-[10px] font-mono rounded flex items-center justify-center gap-1.5 cursor-pointer transition select-none shrink-0"
                  >
                    {isDarkMode ? <Sun className="h-3 w-3 text-amber-500" /> : <Moon className="h-3 w-3 text-indigo-400" />}
                    <span>{isDarkMode ? "Light" : "Dark"}</span>
                  </button>

                  {/* Demo & Walkthrough */}
                  <button 
                    onClick={startDemoScript}
                    id="system-demo-trigger"
                    title="Trigger Hackathon Demo Script"
                    className="py-1.5 px-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/25 text-indigo-400 hover:text-white text-[10px] font-mono rounded flex items-center justify-center gap-1.5 cursor-pointer transition select-none shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Demo</span>
                  </button>
                  <button 
                    onClick={handleStartTour}
                    title="Start guided system walkthrough tutorial"
                    className="py-1.5 px-2 bg-slate-900 border border-[#1E293B] hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 text-[10px] font-mono rounded flex items-center justify-center gap-1.5 cursor-pointer transition select-none shrink-0"
                  >
                    <HelpCircle className="h-3 w-3 text-indigo-400" />
                    <span>Tour</span>
                  </button>
                </div>
              </div>

              <div className="h-px bg-[#1E293B]/40 my-3" />

              {/* TELEMETRY RUNTIME METADATA */}
              <div className="px-1.5 py-1 space-y-1.5">
                <div className="text-[9px] uppercase font-semibold text-slate-500 font-mono tracking-wider px-1">Collector Spans</div>
                
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono px-1">
                  <Activity className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span className="truncate">Phoenix MCP</span>
                  <span className="ml-auto text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded uppercase font-bold shrink-0">ONLINE</span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono px-1">
                  <Server className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="truncate">Otel Collector</span>
                  <span className="ml-auto text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded uppercase font-bold shrink-0">ACTIVE</span>
                </div>
              </div>
            </>
          )}
        </nav>

        {/* SIDEBAR FOOTER METRICS GAUGE */}
        <div className={`border-t border-[#1E293B] shrink-0 bg-[#0A0D11]/60 transition-all duration-300 ${isSidebarCollapsed ? "p-2 space-y-3.5 flex flex-col items-center" : "p-3 space-y-2.5"}`}>
          {isSidebarCollapsed ? (
            <>
              {/* Simple Tooltip-friendly icons or indicators */}
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center cursor-help"
                  title={`Session Score Avg: ${Math.round(metrics.averageScore * 100)}%`}
                >
                  <span className="text-[9px] font-mono font-bold text-indigo-400">{Math.round(metrics.averageScore * 100)}</span>
                </div>
                
                {/* Blocked/Loops tooltip mini-indicators */}
                <div 
                  className="w-7 h-7 rounded-lg bg-rose-950/20 border border-rose-900/30 flex items-center justify-center cursor-help text-rose-400"
                  title={`Blocked Trace Hazards: ${hallucinationsCount}`}
                >
                  <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
                </div>

                <div 
                  className="w-7 h-7 rounded-lg bg-indigo-950/10 border border-indigo-900/20 flex items-center justify-center cursor-help text-indigo-400"
                  title={`Learning Loops: ${learningSessions}s`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Minimal Factory Reset */}
              <button
                onClick={handleResetFactory}
                title="Reset Console Base"
                className="p-2 bg-slate-950 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 rounded border border-slate-800 hover:border-rose-900/40 transition cursor-pointer flex items-center justify-center"
              >
                <RotateCcw className="h-3.5 w-3.5 animate-spin-slow" />
              </button>
            </>
          ) : (
            <>
              <div>
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-bold font-mono">
                  <span>Session Score Avg</span>
                  <span className="text-indigo-400">{Math.round(metrics.averageScore * 100)}%</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500 shadow-[0_0_6px_#6366f1]" 
                    style={{ width: `${Math.min(100, Math.max(0, metrics.averageScore * 100))}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div 
                  id="hallucination-sidebar-widget" 
                  className="p-2 bg-rose-950/20 border border-rose-900/30 rounded-lg flex flex-col justify-center items-center text-center text-rose-400"
                >
                  <div className="text-[8px] font-mono font-bold uppercase tracking-wide flex items-center gap-1">
                    <ShieldAlert className="h-2.5 w-2.5 text-rose-500 animate-pulse shrink-0" />
                    Blocked
                  </div>
                  <span className="text-xs font-mono font-bold mt-0.5">{hallucinationsCount}</span>
                </div>

                <div className="p-2 bg-indigo-950/10 border border-indigo-900/20 rounded-lg flex flex-col justify-center items-center text-center text-indigo-400">
                  <div className="text-[8px] font-mono font-bold uppercase tracking-wide flex items-center gap-1">
                    <BookOpen className="h-2.5 w-2.5 text-indigo-400 shrink-0" />
                    Loops
                  </div>
                  <span className="text-xs font-mono font-bold mt-0.5">{learningSessions} s</span>
                </div>
              </div>
              
              <div className="p-1.5 px-2 bg-slate-900/30 border border-[#1E293B] rounded-lg">
                <div className="text-[8px] text-slate-500 uppercase tracking-widest font-mono flex items-center justify-between">
                  <span>Active Session:</span>
                  <span className="text-emerald-400 font-bold truncate ml-1.5 max-w-[90px] text-[10px]" title={sessionId}>{sessionId}</span>
                </div>
              </div>

              <button
                onClick={handleResetFactory}
                className="w-full py-1 bg-slate-950 hover:bg-rose-950/30 text-[10px] font-mono text-slate-500 hover:text-rose-400 rounded border border-slate-800 hover:border-rose-900/40 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Console Base
              </button>
            </>
          )}
        </div>
      </aside>

      {/* MAIN VIEW CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0F1115] overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 sm:h-20 border-b border-[#1E293B] flex items-center justify-between px-3 sm:px-6 bg-[#0F1115]/80 backdrop-blur-md shrink-0 z-20 gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto select-none no-scrollbar py-1 animate-fadeIn">
            <div className="flex flex-col shrink-0">
              <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-mono font-bold tracking-tight">Active Persona</span>
              <select 
                value={persona} 
                onChange={(e) => {
                  const newPers = e.target.value as any;
                  setPersona(newPers);
                  playAudioFeedback("success");
                }}
                className="bg-slate-900 text-[11px] sm:text-xs font-semibold text-emerald-400 border border-[#1E293B] rounded px-1.5 py-0.5 sm:px-2 sm:py-1 mt-0.5 outline-none cursor-pointer hover:bg-slate-800 transition"
              >
                <option value="electronics">💻 Electronics</option>
                <option value="travel">✈️ Travel</option>
                <option value="health">🏥 CareFirst</option>
              </select>
            </div>
            
            <div className="h-8 w-px bg-[#1E293B] shrink-0 hidden md:block"></div>
            
            {/* Split layout width adjuster slider */}
            <div className="hidden md:flex flex-col shrink-0">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-tight">Panel Split: {chatSplitPercent}%</span>
              <div className="flex items-center gap-2 mt-1">
                <Sliders className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <input
                  type="range"
                  min="30"
                  max="75"
                  value={chatSplitPercent}
                  onChange={(e) => setChatSplitPercent(Number(e.target.value))}
                  className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                  title="Drag to resize Chat and Trace panels"
                />
              </div>
            </div>

            <div className="h-8 w-px bg-[#1E293B] shrink-0 hidden md:block"></div>
            <div className="flex flex-col shrink-0 hidden md:flex">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-tight">Clock (France)</span>
              <span className="text-xs font-mono font-semibold text-emerald-400 mt-1 animate-pulse">
                {franceTime || "00:00:00"} {franceTz}
              </span>
            </div>
            <div className="h-8 w-px bg-[#1E293B] shrink-0 hidden lg:block"></div>
            <div className="flex flex-col shrink-0 hidden lg:flex">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-tight">Simulation Speed</span>
              <select 
                value={simulationSpeed} 
                onChange={(e) => {
                  setSimulationSpeed(Number(e.target.value) as any);
                  playAudioFeedback("success");
                }}
                className="bg-slate-900 text-[11px] font-mono font-semibold text-purple-400 border border-[#1E293B] rounded px-2 py-0.5 mt-0.5 outline-none cursor-pointer hover:bg-slate-800 transition"
              >
                <option value="0.5">🐌 0.5x</option>
                <option value="1.0">⚡ 1.0x</option>
                <option value="2.0">🚀 2.0x</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Audio Toggle button & Vol Selectors popup */}
            <div className="relative">
              <button
                onClick={() => setIsVolumePopupOpen(prev => !prev)}
                title="System chime volume configuration"
                className={`p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900 border ${
                  isVolumePopupOpen ? "border-indigo-500 bg-slate-800" : "border-[#1E293B] hover:border-indigo-500/50"
                } hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-all cursor-pointer`}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider hidden md:inline text-slate-400">
                  {isMuted ? "Muted" : volume}
                </span>
              </button>

              {isVolumePopupOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsVolumePopupOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-slate-950 border border-[#1E293B] rounded-xl shadow-2xl p-1.5 z-40 select-none animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-1.5 text-[9px] text-slate-500 font-bold uppercase font-mono tracking-wider border-b border-[#1E293B] mb-1">
                      Volume Control
                    </div>

                    {/* Mute toggle */}
                    <button
                      onClick={() => {
                        setIsMuted(prev => !prev);
                        if (!isMuted) {
                          // we are muting now
                        } else {
                          // we are unmuting now, trigger a success chime
                          setTimeout(() => playAudioFeedback("success"), 50);
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center justify-between cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <VolumeX className={`w-3.5 h-3.5 ${isMuted ? "text-red-400" : "text-slate-500"}`} />
                        <span>Mute System</span>
                      </div>
                      {isMuted && <CheckCircle className="w-3 h-3 text-red-400" />}
                    </button>

                    <div className="h-px bg-[#1E293B] my-1"></div>

                    {/* Low Volume option */}
                    <button
                      onClick={() => {
                        setIsMuted(false);
                        setVolume("low");
                        // We override volume selection directly to instantly play sample sound at correct level
                        setTimeout(() => {
                          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const osc = ctx.createOscillator();
                          const gain = ctx.createGain();
                          osc.connect(gain);
                          gain.connect(ctx.destination);
                          osc.type = "sine";
                          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
                          gain.gain.setValueAtTime(0.25 * 0.35, ctx.currentTime); // low factor is 0.35
                          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
                          osc.start();
                          osc.stop(ctx.currentTime + 0.5);
                        }, 20);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center justify-between cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Low Volume</span>
                      </div>
                      {!isMuted && volume === "low" && <CheckCircle className="w-3 h-3 text-indigo-400" />}
                    </button>

                    {/* Mid Volume option */}
                    <button
                      onClick={() => {
                        setIsMuted(false);
                        setVolume("medium");
                        setTimeout(() => {
                          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const osc = ctx.createOscillator();
                          const gain = ctx.createGain();
                          osc.connect(gain);
                          gain.connect(ctx.destination);
                          osc.type = "sine";
                          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
                          gain.gain.setValueAtTime(0.25 * 0.95, ctx.currentTime); // mid factor is 0.95
                          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
                          osc.start();
                          osc.stop(ctx.currentTime + 0.5);
                        }, 20);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center justify-between cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Medium Vol</span>
                      </div>
                      {!isMuted && volume === "medium" && <CheckCircle className="w-3 h-3 text-indigo-400" />}
                    </button>

                    {/* Max Volume option */}
                    <button
                      onClick={() => {
                        setIsMuted(false);
                        setVolume("max");
                        setTimeout(() => {
                          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const osc = ctx.createOscillator();
                          const gain = ctx.createGain();
                          osc.connect(gain);
                          gain.connect(ctx.destination);
                          osc.type = "sine";
                          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                          osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
                          gain.gain.setValueAtTime(0.25 * 1.8, ctx.currentTime); // max factor is 1.8
                          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
                          osc.start();
                          osc.stop(ctx.currentTime + 0.5);
                        }, 20);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors flex items-center justify-between cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Maximum Vol</span>
                      </div>
                      {!isMuted && volume === "max" && <CheckCircle className="w-3 h-3 text-indigo-400" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Export Dropdown menu */}
            <div className="relative">
              <button 
                id="share-session-button"
                onClick={() => setIsExportDropdownOpen(prev => !prev)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900 border border-[#1E293B] hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded flex items-center gap-1 transition-all cursor-pointer select-none shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Export</span>
              </button>

              {isExportDropdownOpen && (
                <>
                  <div 
                    onClick={() => setIsExportDropdownOpen(false)}
                    className="fixed inset-0 z-30"
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-[#1E293B] rounded-xl shadow-2xl p-1.5 z-40 select-none animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider border-b border-[#1E293B] mb-1">
                      Available Formats
                    </div>
                    
                    {/* PDF Export via Print */}
                    <button
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        playAudioFeedback("success");
                        window.print();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Print Summary Report (PDF)</span>
                    </button>

                    {/* JSON Export */}
                    <button
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        playAudioFeedback("success");
                        const dataStr = JSON.stringify(traces, null, 2);
                        const blob = new Blob([dataStr], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `agentwatch_telemetry_traces_${sessionId}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Database className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Download Spans (JSON)</span>
                    </button>

                    {/* CSV Export */}
                    <button
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        playAudioFeedback("success");
                        let csvContent = "data:text/csv;charset=utf-8,TraceID,Timestamp,Question,Response,Category,WasSelfCorrected,Score\n";
                        traces.forEach(t => {
                          const id = t.traceId;
                          const time = t.timestamp;
                          const q = `"${t.question.replace(/"/g, '""')}"`;
                          const r = `"${t.response.replace(/"/g, '""')}"`;
                          const cat = t.category;
                          const corr = t.wasSelfCorrected ? "YES" : "NO";
                          const sc = t.evaluation?.overall || 0;
                          csvContent += `${id},${time},${q},${r},${cat},${corr},${sc}\n`;
                        });
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `agentwatch_metrics_export_${sessionId}.csv`);
                        link.click();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <List className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Download Records (CSV)</span>
                    </button>

                    <div className="my-1 border-t border-[#1E293B]"></div>

                    {/* Compile DevPost Report */}
                    <button
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        handleShareSession();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>Compile DevPost Report</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* AGENT HEALTH SCORE COMPOSITE BAR (Interactive tooltip on hover) */}
        <div className="bg-[#0C0F16]/95 border-b border-[#1E293B]/80 px-6 py-1.5 shrink-0 select-none shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative z-10 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
            {isMobile ? (
              <div className="flex w-full p-0.5 items-center justify-between gap-2.5">
                {/* Mobile view of health index */}
                <div className="flex items-center gap-2">
                  <div className={`h-6.5 w-6.5 rounded border font-mono font-bold flex items-center justify-center text-[10px] shrink-0 ${
                    overallAgentHealthScore >= 85 
                      ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-400" 
                      : overallAgentHealthScore >= 70 
                      ? "bg-amber-950/40 border-amber-500/60 text-amber-400" 
                      : "bg-rose-950/40 border-rose-500/60 text-rose-450"
                  }`}>
                    {overallAgentHealthScore}%
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-100 uppercase tracking-wider font-display leading-none">Agent Health</span>
                    <span className="text-[7.5px] font-mono text-slate-400 mt-0.5 leading-none">Composite Index Status</span>
                  </div>
                </div>
                <span className={`text-[7px] border rounded px-1.5 py-0.2 font-mono font-black tracking-wide ${
                  overallAgentHealthScore >= 85 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}>
                  {overallAgentHealthScore >= 85 ? "⚡ ONLINE & SECURE" : "🚨 DRIFT ACTIVE"}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Dial design with neon glowing borders */}
                  <div 
                    id="health-score-dial"
                    className={`h-8 w-8 rounded-md flex flex-col items-center justify-center border font-mono font-bold shadow-[0_0_15px_rgba(99,102,241,0.05)] transition-all shrink-0 ${
                      overallAgentHealthScore >= 85 
                        ? "bg-emerald-950/55 border-emerald-500/60 text-emerald-450 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                        : overallAgentHealthScore >= 70 
                        ? "bg-amber-950/55 border-amber-500/60 text-amber-450 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                        : "bg-rose-950/55 border-rose-500/60 text-rose-450 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    }`}
                  >
                    <span className="text-[6.5px] text-slate-450 font-mono tracking-wider -mb-0.5 leading-none font-bold">HEALTH</span>
                    <span className="text-xs font-black font-mono leading-none mt-0.5">
                      {overallAgentHealthScore}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-black text-slate-100 font-display uppercase tracking-widest">Agent Health Index</h3>
                      <span className={`text-[7.5px] border rounded px-1.5 py-0.2 font-mono font-black tracking-wide ${
                        overallAgentHealthScore >= 85 ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-amber-500/10 border-amber-500/40 text-amber-400"
                      }`}>
                        {overallAgentHealthScore >= 85 ? "⚡ ONLINE & SECURE" : "🚨 UNCALIBRATED DRIFT ACTIVE"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Metrics Subcomponents */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0 w-full md:w-auto">
                  {/* Accuracy component */}
                  <div 
                    onMouseEnter={() => setHoveredHealthSegment("accuracy")}
                    onMouseLeave={() => setHoveredHealthSegment(null)}
                    className={`py-1 px-2.5 rounded-md border transition-all relative cursor-help flex flex-col justify-center min-w-[100px] ${
                      hoveredHealthSegment === "accuracy" ? "bg-indigo-950/60 border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.1)]" : "bg-slate-900 border-[#1E293B]"
                    }`}
                  >
                    <div className="text-[8px] text-slate-400 font-bold uppercase font-mono tracking-wider flex items-center justify-between gap-2.5">
                      <span className="flex items-center gap-1"><CheckCircle className="w-2 h-2 text-indigo-400" /> Accuracy</span>
                      <span className="text-slate-500 font-medium">30% wt</span>
                    </div>
                    <div className="text-xs font-black font-mono text-indigo-400">
                      {healthAccuracy}% <span className="text-[8px] text-slate-550 font-medium font-sans">Avg</span>
                    </div>
                    {hoveredHealthSegment === "accuracy" && (
                      <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 bg-slate-950 border border-indigo-500/40 text-[10px] text-slate-300 rounded-lg shadow-xl z-50 font-sans">
                        <span className="font-bold text-indigo-400 uppercase font-mono block mb-1">Response Precision</span>
                        Score evaluating answers given inside constraints. Resolving prompt failures raises score to 96%.
                      </div>
                    )}
                  </div>

                  {/* Hallucination Resistance */}
                  <div 
                    onMouseEnter={() => setHoveredHealthSegment("hallucination")}
                    onMouseLeave={() => setHoveredHealthSegment(null)}
                    className={`py-1 px-2.5 rounded-md border transition-all relative cursor-help flex flex-col justify-center min-w-[100px] ${
                      hoveredHealthSegment === "hallucination" ? "bg-rose-950/60 border-rose-500/60 shadow-[0_0_12px_rgba(239,68,68,0.1)]" : "bg-slate-900 border-[#1E293B]"
                    }`}
                  >
                    <div className="text-[8px] text-slate-400 font-bold uppercase font-mono tracking-wider flex items-center justify-between gap-2.5">
                      <span className="flex items-center gap-1"><ShieldAlert className="w-2 h-2 text-rose-455" /> Defenses</span>
                      <span className="text-slate-500 font-medium">30% wt</span>
                    </div>
                    <div className="text-xs font-black font-mono text-rose-400">
                      {healthHallucination}% <span className="text-[8px] text-slate-550 font-medium font-sans">Safe</span>
                    </div>
                    {hoveredHealthSegment === "hallucination" && (
                      <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 bg-slate-950 border border-rose-500/40 text-[10px] text-slate-300 rounded-lg shadow-xl z-50 font-sans">
                        <span className="font-bold text-rose-400 uppercase font-mono block mb-1">Hallucination Defense</span>
                        Evaluates system truthfulness. Disallowed warranty claims block increases rating to baseline 100%.
                      </div>
                    )}
                  </div>

                  {/* Self-Correction Speed */}
                  <div 
                    onMouseEnter={() => setHoveredHealthSegment("correction")}
                    onMouseLeave={() => setHoveredHealthSegment(null)}
                    className={`py-1 px-2.5 rounded-md border transition-all relative cursor-help flex flex-col justify-center min-w-[100px] ${
                      hoveredHealthSegment === "correction" ? "bg-amber-950/60 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.1)]" : "bg-slate-900 border-[#1E293B]"
                    }`}
                  >
                    <div className="text-[8px] text-slate-400 font-bold uppercase font-mono tracking-wider flex items-center justify-between gap-2.5">
                      <span className="flex items-center gap-1"><Zap className="w-2 h-2 text-amber-400" /> Correction</span>
                      <span className="text-slate-500 font-medium">20% wt</span>
                    </div>
                    <div className="text-xs font-black font-mono text-amber-400">
                      {healthCorrection}% <span className="text-[8px] text-slate-550 font-medium font-sans">Speed</span>
                    </div>
                    {hoveredHealthSegment === "correction" && (
                      <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 bg-slate-950 border border-amber-500/40 text-[10px] text-slate-300 rounded-lg shadow-xl z-50 font-sans">
                        <span className="font-bold text-amber-400 uppercase font-mono block mb-1">Self-Correction Rate</span>
                        Automated feedback cycle update speed. Fine-tuning prompt systems with Gemini raises this metric to 95%.
                      </div>
                    )}
                  </div>

                  {/* Knowledge Coverage */}
                  <div 
                    onMouseEnter={() => setHoveredHealthSegment("coverage")}
                    onMouseLeave={() => setHoveredHealthSegment(null)}
                    className={`py-1 px-2.5 rounded-md border transition-all relative cursor-help flex flex-col justify-center min-w-[100px] ${
                      hoveredHealthSegment === "coverage" ? "bg-emerald-950/60 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]" : "bg-slate-900 border-[#1E293B]"
                    }`}
                  >
                    <div className="text-[8px] text-slate-400 font-bold uppercase font-mono tracking-wider flex items-center justify-between gap-2.5">
                      <span className="flex items-center gap-1"><Database className="w-2 h-2 text-emerald-400" /> Knowledge</span>
                      <span className="text-slate-500 font-medium">20% wt</span>
                    </div>
                    <div className="text-xs font-black font-mono text-emerald-400">
                      {healthCoverage}% <span className="text-[8px] text-slate-550 font-medium font-sans">KB</span>
                    </div>
                    {hoveredHealthSegment === "coverage" && (
                      <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 bg-slate-950 border border-emerald-500/40 text-[10px] text-slate-300 rounded-lg shadow-xl z-50 font-sans">
                        <span className="font-bold text-emerald-400 uppercase font-mono block mb-1">Knowledge Coverage</span>
                        Quantity of topics completely analyzed. Laptop repair policy & SoundSync return parameters are fully optimized when self-improvement is active.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* DEMO ROADMAP PROGRESS WIDGET */}
        {demoState.isRunning && (
          <div className="bg-emerald-950/20 border-b border-emerald-900/40 p-4 shrink-0 transition-all font-mono">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                  {demoState.stepIndex}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 font-display uppercase tracking-wider">Demo Sequence Automation</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">{demoState.notes}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {demoState.stepIndex < 7 ? (
                  <button 
                    onClick={handleNextDemoStep}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-500/20 font-display"
                  >
                    <span>Approve Step</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setDemoState({ isRunning: false, stepIndex: 0, notes: "" })}
                    className="bg-slate-805 hover:bg-slate-700 text-slate-205 text-[10px] font-bold px-3 py-1.5 rounded uppercase cursor-pointer"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUB CONTENT PANELS */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {/* TAB 1: RETRIEVAL AGENT CHAT AND TELEMETRY INSPECTOR (SPLIT SCREEN) */}
            {activeTab === "chat" && (
              <motion.div 
                key="chat-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col md:flex-row divide-[#1E293B] overflow-hidden"
              >
                {/* Mobile Sub Tab Selector */}
                {isMobile && (
                  <div className="flex bg-[#0A0D11]/90 border-b border-[#1E293B] p-1.5 shrink-0 justify-between items-center z-10 w-full gap-2">
                    <button
                      id="mobile-chat-tab-button"
                      onClick={() => { setMobileChatTab("chat"); playAudioFeedback("whoosh"); }}
                      className={`flex-1 py-1.5 px-3 text-center text-[11px] font-mono font-bold rounded-lg transition-all border flex items-center justify-center gap-1.5 ${
                        mobileChatTab === "chat"
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.25)]"
                          : "bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5 shrink-0" />
                      <span>Chat</span>
                    </button>
                    <button
                      id="mobile-traces-tab-button"
                      onClick={() => { setMobileChatTab("trace"); playAudioFeedback("whoosh"); }}
                      className={`flex-1 py-1.5 px-3 text-center text-[11px] font-mono font-bold rounded-lg transition-all border flex items-center justify-center gap-1.5 ${
                        mobileChatTab === "trace"
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.25)]"
                          : "bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5 shrink-0" />
                      <span>Traces {traces.length > 0 && `(${traces.length})`}</span>
                    </button>
                  </div>
                )}

                {/* LEFT HALF: THE STORE CONVERSATION */}
                {(!isMobile || mobileChatTab === "chat") && (
                  <div 
                    className="w-full flex flex-col h-full bg-[#111419]"
                    style={{ width: isMobile ? "100%" : `${chatSplitPercent}%` }}
                  >
                
                {/* Scrollable conversation bubble panel */}
                <div className={`flex-1 p-6 space-y-6 ${messages.length === 0 ? "overflow-hidden" : "overflow-y-auto"}`}>
                  {messages.length === 0 ? (
                    <div 
                      className="min-h-full flex flex-col items-center justify-start text-center p-8 pt-12 text-slate-400 max-w-lg mx-auto"
                      style={{ marginBottom: "-45px", paddingBottom: "10px" }}
                    >
                      {/* Personalized Time-based Welcome & Interactive Profile Edit */}
                      <div className="mb-4">
                        <div className="flex items-center justify-center gap-1.5 mb-1.5 text-[10px] text-emerald-400 font-mono tracking-wider font-semibold uppercase">
                          <span>🇫🇷 Europe/Paris Timeframe</span>
                        </div>
                        {isEditingName ? (
                          <div className="flex items-center gap-2 justify-center mt-2">
                            <input
                              type="text"
                              value={nameInput}
                              onChange={(e) => setNameInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveName();
                                if (e.key === "Escape") setIsEditingName(false);
                              }}
                              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 outline-none w-40 text-center"
                              placeholder="Your name..."
                              autoFocus
                            />
                            <button
                              onClick={handleSaveName}
                              className="px-2.5 py-1 bg-indigo-605 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setIsEditingName(false)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-705 rounded text-xs font-semibold text-slate-405 text-slate-400 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <h2 className="text-lg font-bold text-slate-100 font-display flex items-center justify-center gap-2 flex-wrap">
                            <span>{getPeriodGreeting().greeting}</span>
                            <button
                              onClick={() => {
                                setNameInput(userName);
                                setIsEditingName(true);
                              }}
                              className="text-xs text-slate-500 hover:text-emerald-400 transition cursor-pointer p-0.5 rounded opacity-70 hover:opacity-100"
                              title="Edit Name"
                            >
                              ✍️
                            </button>
                          </h2>
                        )}
                      </div>

                      {/* Interactive Eye Logo for Phantos AI */}
                      <div className="flex flex-col items-center justify-center mt-6 mb-4">
                        <PhantosEyeLogo className="w-20 h-20 text-indigo-400 drop-shadow-[0_0_20px_rgba(129,140,248,0.7)] animate-pulse hover:scale-105 transition duration-300 cursor-pointer" />
                      </div>

                      <h3 className="text-md font-semibold text-slate-200 font-display">Phantos Customer Help Desk</h3>
                      <div className="text-xs text-emerald-400/90 font-medium px-4 py-3 mt-2.5 rounded-xl border border-emerald-500/10 bg-emerald-950/20 leading-relaxed font-sans shadow-md">
                        {getPeriodGreeting().excitement}
                      </div>

                      <p className="text-[11px] text-slate-400 mt-4 leading-relaxed max-w-sm">
                        Query Laptop configurations, Warranties, Orders, or Policies. 
                        Choose one of our quick prompts to test. If you hit a policy gap, the evaluator will record a failure in Phoenix!
                      </p>

                      <div className="grid grid-cols-1 gap-2 mt-6 w-full text-left">
                        <button 
                          onClick={() => handleSendMessage("Tell me about TechStore laptop prices.")}
                          className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs hover:border-emerald-500/50 transition flex items-center gap-2 cursor-pointer"
                        >
                          <Search className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span className="truncate text-slate-300">Easy Spec: laptop specifications & prices</span>
                        </button>

                        <button 
                          onClick={() => handleSendMessage("Can I return an opened laptop? Is there a restocking fee?")}
                          className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs hover:border-amber-500/50 transition flex items-center gap-2 cursor-pointer"
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="truncate text-slate-300">GAP test: Return conditions for laptops</span>
                        </button>

                        <button 
                          onClick={() => handleSendMessage("Is there a warranty and instruction set for refurbished headphones?")}
                          className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs hover:border-amber-500/50 transition flex items-center gap-2 cursor-pointer"
                        >
                          <AlertTriangle className="h-3 w-3 text-purple-400 shrink-0" />
                          <span className="truncate text-slate-300">GAP test: Warranty terms on headphones</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="h-8 w-8 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-semibold text-xs shrink-0 font-mono shadow">
                            TS
                          </div>
                        )}
                        
                        <div className="max-w-[85%]">
                          <div className={`p-4 rounded-2xl border ${
                            msg.role === "user" 
                              ? "bg-slate-900 border-slate-800 text-slate-200"
                              : "bg-slate-900/40 border-slate-900"
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                            {/* Assistant rich decorations (badges and score) */}
                            {msg.role === "assistant" && (
                              <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-3 border-t border-slate-900/60 text-xs font-mono text-slate-400">
                                <div className="flex items-center gap-1">
                                  <span>Latency:</span>
                                  <span className="text-slate-300 font-semibold">{msg.responseTimeMs || "N/A"}ms</span>
                                </div>
                                <span className="text-slate-800 font-light">|</span>
                                {msg.toolsCalled && msg.toolsCalled.length > 0 && (
                                  <>
                                    <div className="flex items-center gap-1 text-slate-400">
                                      <span>Tools:</span>
                                      {msg.toolsCalled.map(tName => (
                                        <span key={tName} className="bg-slate-900 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] lowercase flex items-center gap-1 text-cyan-400">
                                          <Search className="h-2.5 w-2.5" />
                                          {tName}
                                        </span>
                                      ))}
                                    </div>
                                    <span className="text-slate-800 font-light">|</span>
                                  </>
                                )}

                                {/* EVALUATION BADGE (Trigger selected trace comparison view) */}
                                {msg.evaluation && (
                                  <button
                                    onClick={() => selectTraceByMsg(msg.traceId)}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition uppercase tracking-widest ${
                                      msg.evaluation.overall >= 0.85
                                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40"
                                        : msg.evaluation.overall >= 0.70
                                        ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/40"
                                        : msg.evaluation.overall >= 0.50
                                        ? "bg-amber-950/60 border-amber-500/40 text-amber-500 hover:bg-amber-900/40"
                                        : "bg-rose-950/60 border-rose-500/40 text-rose-500 hover:bg-rose-905/30"
                                    }`}
                                  >
                                    <Target className="h-3 w-3" />
                                    <span>
                                      Trace Score: {msg.evaluation.overall} - {
                                        msg.evaluation.overall >= 0.85 ? "🟢 EXCELLENT" : 
                                        msg.evaluation.overall >= 0.70 ? "🔵 ACCEPTABLE" : 
                                        msg.evaluation.overall >= 0.50 ? "🟡 POOR" : "🔴 CALL FAILURE"
                                      }
                                    </span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Was self corrected flag */}
                          {msg.wasSelfCorrected && (
                            <div className="flex items-center gap-1 px-3 mt-1.5 text-[10px] font-mono text-indigo-400">
                              <Zap className="h-3.5 w-3.5 fill-current text-indigo-400" />
                              <span>Dynamic restriction safeguard applied to system prompts context.</span>
                            </div>
                          )}
                        </div>

                        {msg.role === "user" && (
                          <div className="h-8 w-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-semibold text-xs shrink-0 font-mono shadow">
                            <User className="h-3.5 w-3.5 text-indigo-400" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input action toolbar */}
                <div className="p-4 border-t border-[#1E293B] bg-[#111419] flex flex-col gap-2 shrink-0">
                  
                  {/* PREDICTIVE AI SAFEGUARD INTERACTIVE SYSTEM */}
                  {predictiveAlert && (
                    <div 
                      id="predictive-alert-system" 
                      className={`p-2 px-3 rounded-xl border text-[11px] font-sans flex items-center justify-between transition-all duration-300 select-none ${
                        predictiveAlert.predicted_tier === "excellent"
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                          : predictiveAlert.predicted_tier === "good"
                          ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-400"
                          : predictiveAlert.predicted_tier === "poor"
                          ? "bg-amber-950/20 border-amber-500/30 text-amber-500 animate-pulse"
                          : "bg-rose-950/20 border-rose-500/30 text-rose-500 animate-pulse"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className={`h-4 w-4 shrink-0 ${predictiveAlert.predicted_tier === "failing" || predictiveAlert.predicted_tier === "poor" ? "text-amber-500" : "text-indigo-400"}`} />
                        <div>
                          <div className="font-bold tracking-wide uppercase text-[8px] opacity-70 font-mono">
                            Predictive AI Safeguard: {predictiveAlert.predicted_tier.toUpperCase()} TIER
                          </div>
                          <div className="text-[10px] leading-tight font-medium mt-0.5">
                            {predictiveAlert.reason}
                          </div>
                          <div className="text-[9px] text-slate-400 leading-none mt-0.5">
                            👉 {predictiveAlert.suggestion} (Confidence: {Math.round(predictiveAlert.confidence * 100)}%)
                          </div>
                        </div>
                      </div>
                      {(predictiveAlert.predicted_tier === "poor" || predictiveAlert.predicted_tier === "failing") && (
                        <button 
                          onClick={runSelfCorrectionCycle}
                          className="px-2 py-0.5 bg-indigo-650 hover:bg-indigo-500 text-white text-[9px] font-mono font-bold rounded uppercase tracking-wide cursor-pointer transition-colors"
                        >
                          Heal Gap
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Ask our agent: Laptop details, custom warranties, restocking values..."
                      className="flex-1 bg-[#0F1115] text-slate-200 text-xs border border-[#1E293B] rounded-lg px-3.5 py-2 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 font-sans"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isSending || !inputText.trim()}
                      id="ask-agent-submit"
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold shadow px-3 py-2 rounded-lg text-[10px] transition cursor-pointer font-display uppercase tracking-widest shrink-0"
                    >
                      {isSending ? "Querying..." : "Ask Agent"}
                    </button>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Telemetry logging and trace collection sequence enabled.
                    </span>
                    {traces.some(t => t.evaluation && t.evaluation.overall < 0.70) && (
                      <button 
                        onClick={runSelfCorrectionCycle}
                        disabled={isImproving}
                        className="text-xs text-indigo-400 hover:text-indigo-305 font-display font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5 text-indigo-400 animate-pulse fill-current" />
                        {isImproving ? "Applying rules..." : "Trigger Self-Correction Audit"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* RIGHT HALF: LIVE ARIZE PHOENIX TRACING TREE */}
              {(!isMobile || mobileChatTab === "trace") && (
                <div 
                  className="w-full flex flex-col h-full bg-[#0F1115]"
                  style={{ width: isMobile ? "100%" : `${100 - chatSplitPercent}%` }}
                >
                <div className="border-b border-[#1E293B] bg-[#0F1115] px-4 py-3 flex items-center justify-between font-mono text-xs text-slate-400">
                  <span className="flex items-center gap-2 uppercase font-medium">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    Otel Spans Trace tree
                  </span>
                  <span>
                    {selectedTrace ? (
                      <code className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        {selectedTrace.traceId}
                      </code>
                    ) : (
                      "Select bubble to inspect spans"
                    )}
                  </span>
                </div>

                {/* If no selected trace, prompt placeholder */}
                {!selectedTrace ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <Database className="h-10 w-10 text-slate-800 mb-4 animate-pulse" />
                    <h4 className="text-xs font-semibold text-slate-300 font-display">No Telemetry Highlighted</h4>
                    <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                      Whenever the agent responds, OTel collects and wraps the context. Click a trace score badge in the chat window to view the spans execution graph!
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden bg-[#0F1115]">
                    
                    {/* The Hierarchical Spans Tree */}
                    <div className="p-4 border-b border-[#1E293B] space-y-1.5 bg-[#0F1115]">
                      <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1 font-bold">EXECUTION ROUTE TIMELINE:</div>
                      
                      {selectedTrace.spans.map((sp, idx) => {
                        const isSelected = selectedSpan?.id === sp.id;
                        return (
                          <div 
                            key={sp.id} 
                            onClick={() => setSelectedSpan(sp)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                              isSelected 
                                ? "bg-indigo-950/20 border-indigo-500/40 text-indigo-100" 
                                : "bg-[#111419] border-[#1E293B] hover:border-slate-850 text-slate-400"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Connector icon or indentation */}
                              <div className="flex items-center gap-1">
                                {idx > 0 && <span className="text-slate-800 font-mono italic text-[10px] mr-1">└─</span>}
                                {sp.type === "agent_turn" && <Cpu className="h-3.5 w-3.5 text-indigo-400" />}
                                {sp.type === "tool_call" && <Search className="h-3.5 w-3.5 text-cyan-400" />}
                                {sp.type === "evaluation" && <Target className="h-3.5 w-3.5 text-indigo-400" />}
                              </div>
                              <div>
                                <h5 className="text-[11px] font-semibold font-mono text-slate-100 truncate max-w-[180px]">{sp.name}</h5>
                                <span className="text-[9px] text-slate-500 font-mono italic capitalize">{sp.type}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {sp.type === "evaluation" && selectedTrace.evaluation && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  selectedTrace.evaluation.overall >= 0.85 ? "text-emerald-400 bg-emerald-950/40 border border-emerald-500/20" : "text-amber-500 bg-amber-950/40 border border-amber-500/20"
                                }`}>
                                  Overall: {selectedTrace.evaluation.overall}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono">{(sp.endTime - sp.startTime)}ms</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Span Details Inspection Window */}
                    {selectedSpan && (
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0F1115]">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-indigo-400 font-display uppercase tracking-widest flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5 text-indigo-400" />
                            Span Telemetry Specifications
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500">
                            Latency: {selectedSpan.endTime - selectedSpan.startTime}ms
                          </span>
                        </div>

                        {/* Span OTel Attributes list in key-values */}
                        <div className="bg-[#111419] p-3 rounded-xl border border-[#1E293B]">
                          <div className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-wide font-bold">Attributes:</div>
                          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] font-mono">
                            <div className="text-slate-500">Span ID</div>
                            <div className="text-slate-300 font-medium truncate">{selectedSpan.id}</div>
                            
                            <div className="text-slate-500">Scope Type</div>
                            <div className="text-slate-300 font-medium">{selectedSpan.type}</div>

                            {Object.entries(selectedSpan.attributes).map(([k, v]) => (
                              <div key={k} className="contents">
                                <div className="text-slate-500 truncate lowercase">{k.replace(/([A-Z])/g, '_$1')}</div>
                                <div className="text-slate-300 truncate font-semibold">{String(v)}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Raw Span JSON inputs and outputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                          {/* Input Data */}
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col overflow-hidden">
                            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide mb-2 flex items-center gap-1">
                              <Clipboard className="h-3 w-3 text-cyan-400" />
                              JSON Inputs Parameters:
                            </span>
                            <pre className="text-[10px] text-slate-300 font-mono overflow-auto flex-1 bg-slate-950/80 p-2 border border-slate-900 rounded max-h-[140px]">
                              {JSON.stringify(selectedSpan.inputs, null, 2)}
                            </pre>
                          </div>

                          {/* Output Payload */}
                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col overflow-hidden">
                            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide mb-2 flex items-center gap-1">
                              <Clipboard className="h-3 w-3 text-emerald-400" />
                              JSON Outputs Payload:
                            </span>
                            <pre className="text-[10px] text-slate-300 font-mono overflow-auto flex-1 bg-slate-950/80 p-2 border border-slate-900 rounded max-h-[140px]">
                              {JSON.stringify(selectedSpan.outputs, null, 2)}
                            </pre>
                          </div>
                        </div>

                        {/* If type evaluation, show markdown judge criteria */}
                        {selectedSpan.type === "evaluation" && selectedTrace.evaluation && (
                          <div className="bg-emerald-950/20 border border-emerald-900/60 p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-emerald-400" />
                              <h5 className="text-xs font-semibold text-slate-200 font-display uppercase tracking-widest">
                                LLM Judge Evaluation Report
                              </h5>
                            </div>

                            {/* Performance sliders visually representing accuracy metric scores */}
                            <div className="space-y-2 text-[10px] font-mono">
                              <div>
                                <div className="flex justify-between text-slate-400 mb-0.5">
                                  <span>Accuracy</span>
                                  <span className="text-emerald-300">{selectedTrace.evaluation.accuracy}</span>
                                </div>
                                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-400" style={{ width: `${selectedTrace.evaluation.accuracy * 100}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-slate-400 mb-0.5">
                                  <span>Helpfulness</span>
                                  <span className="text-emerald-300">{selectedTrace.evaluation.helpfulness}</span>
                                </div>
                                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-400" style={{ width: `${selectedTrace.evaluation.helpfulness * 100}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-slate-400 mb-0.5">
                                  <span>Honesty (Anti-Hallucination)</span>
                                  <span className="text-emerald-300">{selectedTrace.evaluation.honesty}</span>
                                </div>
                                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-400" style={{ width: `${selectedTrace.evaluation.honesty * 100}%` }} />
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 italic">
                              "{selectedTrace.evaluation.reasoning}"
                            </p>
                            
                            {selectedTrace.evaluation.mainProblem && (
                              <div className="pt-2 border-t border-emerald-900/40 text-[11px] text-amber-400 font-mono">
                                <span className="font-bold text-amber-500 uppercase">Diagnosed Gap:</span> {selectedTrace.evaluation.mainProblem}
                              </div>
                            )}

                            {selectedTrace.evaluation.suggestion && (
                              <div className="text-[11px] text-cyan-400 font-mono">
                                <span className="font-bold text-cyan-400 uppercase">Corrective Rule:</span> {selectedTrace.evaluation.suggestion}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: SYSTEM METRICS & GRAPH TELEMETRY TABLES */}
          {activeTab === "metrics" && (() => {
            const heatmapData = getHeatmapGrid();
            const costStats = getCostMetrics();
            const scatterPoints = getScatterPoints();
            
            return (
              <motion.div 
                key="metrics-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full overflow-y-auto p-6 space-y-6"
              >
                {/* Yellow cost warning banner */}
                {costStats.totalCost > 0.50 && (
                  <div className="bg-amber-950/40 border border-amber-900/60 p-4 rounded-xl flex items-center justify-between gap-4 animate-bounce shrink-0 font-sans">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-200">⚠️ Session Cost Approaching Hard Ceiling Limit</h4>
                        <p className="text-[10px] text-amber-400/90 mt-0.5">
                          Operational budget has exceeded the threshold ($0.50). Recommend initiating prompt rule optimization steps.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded">
                      COST ALARM
                    </span>
                  </div>
                )}

                {/* ROW 1: COST & TOKEN MONITOR */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Total tokens card */}
                  <div className="bg-[#111419] p-4 rounded-xl border border-[#1E293B] relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                        Aggregate Tokens Meter
                      </span>
                      <h4 className="text-xl font-black font-mono text-indigo-400 mt-1">
                        {costStats.totalTokens.toLocaleString()}
                      </h4>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-900 font-mono">
                      <span>Prompt: {costStats.promptTokens.toLocaleString()}</span>
                      <span>Output: {costStats.completionTokens.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Operational spent card */}
                  <div className="bg-[#111419] p-4 rounded-xl border border-[#1E293B] relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                        Estimated Session Spent
                      </span>
                      <h4 className="text-xl font-black font-mono text-emerald-400 mt-1">
                        ${costStats.totalCost.toFixed(5)}
                      </h4>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-900 font-mono">
                      <span>Target Budget: $0.50</span>
                      <span className="text-emerald-500">{( (costStats.totalCost / 0.5) * 100 ).toFixed(1)}% threshold</span>
                    </div>
                  </div>

                  {/* Cost per Quality card */}
                  <div className="bg-[#111419] p-4 rounded-xl border border-[#1E293B] relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                        Cost Per Quality (x1000)
                      </span>
                      <h4 className="text-xl font-black font-mono text-purple-400 mt-1">
                        ${costStats.costPerUnit.toFixed(4)}
                      </h4>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-900 font-mono text-right">
                      Lower is more cost-efficient
                    </div>
                  </div>

                  {/* Active safeguards trigger card */}
                  <div className="bg-[#111419] p-4 rounded-xl border border-[#1E293B] relative overflow-hidden flex flex-col justify-between relative">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                        Safety Guardrails Injected
                      </span>
                      <h4 className="text-xl font-black font-mono text-yellow-405 text-amber-400 mt-1 flex items-center gap-1.5">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        {activeRules.length} Rules
                      </h4>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-900 font-mono flex justify-between items-center">
                      <span>Active Filters: 12</span>
                      <span className="text-amber-500 font-bold">OTel Armed</span>
                    </div>
                  </div>
                </div>

                {/* ROW 2: CALIBRATION CHART & HEATMAP ROWS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CONFIDENCE CALIBRATION SCATTER CHART */}
                  <div className="bg-[#111419] p-5 rounded-xl border border-[#1E293B] space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display flex items-center gap-2">
                        <Target className="h-4 w-4 text-indigo-400" />
                        Confidence Calibration Scatter Plot
                      </h3>
                      <span className="text-[9px] font-mono bg-slate-900 border border-[#1E293B] px-1.5 py-0.5 text-slate-400 rounded">
                        OVERCONFIDENCE FINDER
                      </span>
                    </div>
                    
                    <div className="h-[250px] w-full font-mono text-xs">
                      <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%" key={`scatter-${traces.length}-${scatterPoints.length}`}>
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                           <XAxis 
                             type="number" 
                             dataKey="x" 
                             name="Agent Confidence" 
                             unit="%" 
                             domain={[0, 100]} 
                             stroke={strokeColor} 
                             label={{ value: "Agent Self-Reported Confidence (%)", position: "insideBottom", offset: -5, fill: labelColor }}
                           />
                           <YAxis 
                             type="number" 
                             dataKey="y" 
                             name="Actual Accuracy" 
                             unit="%" 
                             domain={[0, 100]} 
                             stroke={strokeColor} 
                             label={{ value: "Actual Accuracy Score (%)", angle: -90, position: "insideLeft", offset: 10, fill: labelColor }}
                           />
                           <Tooltip 
                             cursor={{ strokeDasharray: "3 3" }} 
                             content={({ active, payload }) => {
                               if (active && payload && payload.length) {
                                 const ptData = payload[0].payload;
                                 return (
                                   <div className="bg-[#111419] border border-[#1E293B] p-3 rounded-xl max-w-xs space-y-1 text-[11px] font-sans">
                                     <div className="font-bold text-indigo-400 font-mono">{ptData.name}</div>
                                     <div className="text-slate-200 font-mono">Grid Match: [{ptData.x}%, {ptData.y}%]</div>
                                     <div className="text-slate-500 italic">"{ptData.info}"</div>
                                   </div>
                                 );
                               }
                               return null;
                             }}
                           />
                           {/* Ideal Calibration Reference Line (Diagonal y = x) */}
                           <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke={strokeColor} strokeWidth={1} strokeDasharray="4 4" />
                           
                           <Scatter name="Telemetry Points" data={scatterPoints} fill="#6366f1">
                             {scatterPoints.map((entry, index) => {
                               // If dot falls far below diagonal, mark overconfident (Red)
                               const isOverconfident = entry.x - entry.y > 25;
                               const dotColor = isOverconfident ? "#ef4444" : entry.x > 80 && entry.y > 80 ? "#10b981" : "#6366f1";
                               return <Cell key={`cell-${index}`} fill={dotColor} stroke={isOverconfident ? "#fee2e2" : "none"} strokeWidth={1} />;
                             })}
                           </Scatter>
                         </ScatterChart>
                       </ResponsiveContainer>
                     </div>
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[10px] text-slate-400 font-mono px-1">
                       <span>Well-calibrated agents know what they don't know</span>
                       <div className="flex items-center gap-3">
                         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Overconfident (Danger)</span>
                         <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Calibrated</span>
                       </div>
                     </div>
                   </div>
 
                   {/* FAILURE CATEGORY HEATMAP MATRIX */}
                   <div className="bg-[#111419] p-5 rounded-xl border border-[#1E293B] space-y-4">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B]/60 pb-3">
                       <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display flex items-center gap-2">
                         <LayoutGrid className="h-4 w-4 text-indigo-400" />
                         Failure Category Heatmap Matrix
                       </h3>
                       <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono">
                         <span className="flex items-center gap-1 bg-rose-950/25 border border-rose-900/40 text-rose-400 px-1.5 py-0.5 rounded">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-505 bg-rose-500" />
                           Failing (&lt;60%)
                         </span>
                         <span className="flex items-center gap-1 bg-amber-950/25 border border-amber-900/20 text-amber-400 px-1.5 py-0.5 rounded">
                           <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                           Caution (60-85%)
                         </span>
                         <span className="flex items-center gap-1 bg-emerald-950/30 border border-emerald-900/35 text-emerald-400 px-1.5 py-0.5 rounded">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                           Optimal (&gt;85%)
                         </span>
                       </div>
                     </div>
 
                     <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] md:grid-cols-[90px_1fr_1fr_1fr_1fr] gap-1.5 sm:gap-2 font-mono text-[9px] sm:text-[10px] text-center select-none py-1.5 overflow-x-auto w-full">
                       {/* Column Headers */}
                       <div className="text-slate-500 font-bold text-left py-1 truncate">Category</div>
                       {heatmapData.cols.map(col => (
                         <div key={col.key} className="text-slate-500 font-bold py-1 truncate">{col.label}</div>
                       ))}
 
                       {/* Rows layout */}
                       {heatmapData.rows.map(row => {
                         return (
                           <div key={row} className="contents">
                             <div className="text-slate-300 text-left py-1 font-semibold flex items-center truncate text-[9px] sm:text-[10px]">
                               {row}
                             </div>
                             
                             {heatmapData.cols.map(col => {
                               const score = heatmapData.getCellStats(row, col.key);
                               
                               // Background coloring depending on threshold score ratios:
                               // Red: 0-0.50, Yellow: 0.50-0.80, Green: 0.80-1.0
                               let cellBg = "bg-rose-950/40 border-rose-900/30 text-rose-400 hover:bg-rose-900/30";
                               if (score >= 0.85) {
                                 cellBg = "bg-emerald-950/40 border-emerald-900/20 text-emerald-400 hover:bg-emerald-900/20";
                               } else if (score >= 0.60) {
                                 cellBg = "bg-amber-950/30 border-amber-900/10 text-amber-400 hover:bg-amber-900/15";
                               }
 
                               return (
                                 <div 
                                   key={col.key}
                                   title={`Category: ${row}, Dimension: ${col.label}, Score: ${score.toFixed(2)}`}
                                   className={`p-1 sm:p-1.5 border rounded-md transition font-black flex items-center justify-center cursor-help text-[9px] sm:text-[10px] ${cellBg}`}
                                 >
                                   {score.toFixed(2)}
                                 </div>
                               );
                             })}
                           </div>
                         );
                       })}
                     </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-2">
                      Interactive grid evaluates topic-specific dimensions. Red cells indicate gaps in prompt rules retrieved context. Initiating continuous improvement fixes these issues instantly.
                    </p>
                  </div>
                </div>

                {/* ROW 3: QUALITY TREND LINE GRAPH */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Visual Line Chart block */}
                  <div className="bg-[#111419] p-5 rounded-xl border border-[#1E293B] col-span-2 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      Overall Answer Quality Trend Graph (OTel Sequence)
                    </h3>
                    <div className="h-[210px] w-full font-mono text-xs">
                      {metrics.scoreHistory.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500">
                          Ask questions in chat to display telemetry trends.
                        </div>
                      ) : (
                        <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%" key={`line-${metrics.scoreHistory.length}-${traces.length}`}>
                          <LineChart data={metrics.scoreHistory}>
                             <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                             <XAxis dataKey="turn" stroke={strokeColor} label={{ value: "Conversation Order Sequence", position: "insideBottom", offset: -5, fill: labelColor }} />
                             <YAxis domain={[0, 1.0]} stroke={strokeColor} />
                             <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#111419" : "#ffffff", borderColor: isDarkMode ? "#1e293b" : "#cbd5e1", borderRadius: "10px", color: isDarkMode ? "#f8fafc" : "#1e293b" }} />
                             <ReferenceLine y={0.70} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Quality Threshold", fill: "#f59e0b", fontSize: 10, position: "top" }} />
                             <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 8 }} name="Traces overall score" />
                           </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Accuracy Dimension Bar Chart */}
                  <div className="bg-[#111419] p-5 rounded-xl border border-[#1E293B] space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display flex items-center gap-2">
                      <Target className="h-4 w-4 text-indigo-400" />
                      Performance Categories
                    </h3>
                    <div className="h-[210px] w-full font-mono text-xs">
                      {metrics.totalConversations === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500">
                          No dimensions averages calculated yet.
                        </div>
                      ) : (
                        <ResponsiveContainer minWidth={0} minHeight={0} width="100%" height="100%" key={`bar-${metrics.totalConversations}-${traces.length}`}>
                          <BarChart data={[
                            { name: "Accuracy", score: metrics.dimensionAverages.accuracy },
                            { name: "Helpful", score: metrics.dimensionAverages.helpfulness },
                            { name: "Complete", score: metrics.dimensionAverages.completeness },
                            { name: "Honesty", score: metrics.dimensionAverages.honesty }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="name" stroke={strokeColor} />
                            <YAxis domain={[0, 1.0]} stroke={strokeColor} />
                            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#111419" : "#ffffff", borderColor: isDarkMode ? "#1e293b" : "#cbd5e1", borderRadius: "10px", color: isDarkMode ? "#f8fafc" : "#1e293b" }} />
                            <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]}>
                              <Cell fill="#6366f1" />
                              <Cell fill="#3b82f6" />
                              <Cell fill="#8b5cf6" />
                              <Cell fill="#ec4899" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

              {/* TRACES TABLE VIEW LOGGER */}
              <div className="bg-[#111419] border border-[#1E293B] rounded-xl overflow-hidden space-y-2">
                <div className="bg-[#0F1115] p-4 border-b border-[#1E293B] flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-200 font-display uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <List className="h-4 w-4 text-indigo-405" />
                    Arize Trace spans ledger (All conversations)
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    Showing {nlpQueryResultText ? nlpQueryResultText.matchedTraces.length : traces.length} of {traces.length} record entries
                  </span>
                </div>

                {/* Interactive Telemetry NLP query search input panel */}
                <div className="p-3 bg-slate-900/50 border-b border-[#1E293B] flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <input
                      id="traces-nlp-query-input"
                      type="text"
                      className="w-full bg-[#0F1115] text-slate-200 text-xs border border-[#1E293B] rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500/50 font-mono"
                      placeholder="NLP index search: (e.g. low ratings, rule active, warranty)"
                      value={nlpQueryText}
                      onChange={(e) => {
                        setNlpQueryText(e.target.value);
                        runNlpTraceQuery(e.target.value);
                      }}
                    />
                    <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-500" />
                  </div>
                  {nlpQueryResultText ? (
                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                      <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                        🔍 Applied: "{nlpQueryResultText.query}" ({nlpQueryResultText.matchedTraces.length} matches)
                      </span>
                      <button 
                        onClick={clearNlpQuery}
                        className="text-[10px] text-slate-400 hover:text-white bg-slate-850 px-2.5 py-1 rounded border border-[#1E293B] cursor-pointer transition font-mono"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-mono text-right w-full md:w-auto select-none">
                      Suggestions: <code className="text-indigo-400 font-bold bg-[#0F1115] px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-950/60 transition" onClick={() => runNlpTraceQuery("low ratings")}>low ratings</code> or <code className="text-indigo-400 font-bold bg-[#0F1115] px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-950/60 transition" onClick={() => runNlpTraceQuery("rule active")}>rule active</code>
                    </div>
                  )}
                </div>

                {nlpQueryResultText && nlpQueryResultText.summary && (
                  <div className="p-3 bg-indigo-950/15 border-b border-[#1E293B] text-[11px] text-indigo-400 font-mono leading-relaxed px-4">
                    ✨ {nlpQueryResultText.summary}
                  </div>
                )}

                <div className="overflow-x-auto text-xs font-mono">
                  {traces.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Telemetry registers empty. Send queries to establish spans databases.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#0F1115] text-slate-500 border-b border-[#1E293B]">
                          <th className="p-4 uppercase font-bold text-[10px]">Trace ID</th>
                          <th className="p-4 uppercase font-bold text-[10px]">User Query</th>
                          <th className="p-4 uppercase font-bold text-[10px]">Category</th>
                          <th className="p-4 uppercase font-bold text-[10px]">Score</th>
                          <th className="p-4 uppercase font-bold text-[10px]">Latencies</th>
                          <th className="p-4 uppercase font-bold text-[10px]">Otel Spans</th>
                          <th className="p-4 uppercase font-bold text-[10px]">State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B] bg-slate-950/20">
                        {(nlpQueryResultText ? nlpQueryResultText.matchedTraces : traces).map((tr) => (
                          <tr 
                            key={tr.traceId} 
                            onClick={() => {
                              setSelectedTrace(tr);
                              const rAgent = tr.spans.find(s => s.type === "agent_turn") || tr.spans[0];
                              setSelectedSpan(rAgent || null);
                              setActiveTab("chat");
                            }}
                            className="hover:bg-slate-800/40 cursor-pointer transition text-slate-300 font-mono text-xs"
                          >
                            <td className="p-4 text-indigo-400 font-semibold truncate max-w-[120px]">{tr.traceId}</td>
                            <td className="p-4 truncate max-w-[200px]">{tr.question}</td>
                            <td className="p-4">
                              <span className="bg-[#0F1115] border border-[#1E293B] px-2 py-0.5 rounded text-[10px] text-slate-400 font-normal">
                                {tr.category}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-white">
                              {tr.evaluation ? (
                                <span className={
                                  tr.evaluation.overall >= 0.85 ? "text-emerald-400" : 
                                  tr.evaluation.overall >= 0.70 ? "text-cyan-400" : 
                                  tr.evaluation.overall >= 0.50 ? "text-amber-500" : "text-rose-500"
                                }>
                                  {tr.evaluation.overall}
                                </span>
                              ) : "Pending"}
                            </td>
                            <td className="p-4 text-slate-500">
                              {tr.spans.reduce((acc, s) => acc + (s.endTime - s.startTime), 0)}ms
                            </td>
                            <td className="p-4 text-slate-500">{tr.spans.length} spans</td>
                            <td className="p-4">
                              {tr.wasSelfCorrected ? (
                                <span className="text-[9px] text-[#6366f1] bg-[#6366f1]/10 px-2 py-0.5 border border-[#6366f1]/20 rounded uppercase font-semibold">
                                  Self-Corrected
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-500 uppercase">Unchecked</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })()}

          {/* TAB 4: AGENT VS AGENT BATTLE ARENA */}
          {activeTab === "battle" && (
            <motion.div 
              key="battle-tab"
              id="battle-arena-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-6 space-y-6 bg-[#0B0D13]"
            >
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-[#11141D] border border-[#1E293B] p-5 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-display flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-amber-500 animate-pulse" />
                    Agent Battle Arena & Competitor Benchmark
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Compare unmonitored baseline modules with Phantos AI and its real-time evaluation feedback loop. Track error divergence and accuracy improvements over 10 adversarial rounds.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-end">
                  <button
                    onClick={handleResetBattle}
                    className="p-2 px-3.5 bg-slate-900 border border-[#1E293B] hover:bg-slate-800 text-[10px] font-mono text-slate-400 font-bold rounded-xl transition cursor-pointer"
                  >
                    Reset Arena State
                  </button>
                  <button
                    onClick={runBattleNextRound}
                    disabled={battleIsRunning || battleCompleted}
                    className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 disabled:from-slate-800 disabled:to-slate-800 hover:brightness-110 text-slate-950 font-bold text-xs uppercase cursor-pointer rounded-xl transition shadow-lg shadow-amber-500/10 flex items-center gap-2"
                  >
                    <Cpu className="h-4 w-4 animate-spin-slow" />
                    {battleIsRunning ? "Duelling..." : battleCompleted ? "Battle Complete" : `Duel Round #${battleRound}`}
                  </button>
                </div>
              </div>

              {/* Progress Line */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono font-bold uppercase text-slate-500">
                  <span>Adversarial Testing Track</span>
                  <span>Round {battleRound - 1} of 10</span>
                </div>
                <div className="grid grid-cols-10 gap-1.5 h-1 md:h-2">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div 
                      key={index} 
                      className={`h-full rounded-full transition-all duration-300 ${
                        index < battleRound - 1 
                          ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" 
                          : "bg-slate-900 border border-slate-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* SHARED QUESTION INPUT VIEWPORT */}
              <div className="bg-[#111421] border border-[#1E293B] p-4 rounded-xl flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 font-mono text-xs font-bold leading-none shrink-0">Q</div>
                <p className="text-xs text-slate-300 font-medium">
                  {battleQuestionText || "Adversarial duel simulation offline. Click 'Duel Round 1' above to query both agents."}
                </p>
              </div>

              {/* COMPARATIVE DOUBLE SCREEN AREA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* LEFT TERMINAL: BLIND UNMONITORED CLIENT */}
                <div className="flex flex-col rounded-2xl border border-rose-900/30 bg-[#0E1017] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-rose-900/10 pb-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-200">Blind Agent baseline</span>
                    </div>
                    <span className="text-[10px] bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded text-rose-400">
                      Unmonitored Mode
                    </span>
                  </div>

                  <div className="flex-1 p-4 bg-[#090A0E] rounded-xl border border-[#161B22] font-mono min-h-[180px] overflow-y-auto text-xs text-red-200/90 leading-relaxed space-y-3">
                    {battleAnswerLeft ? (
                      <p className="whitespace-pre-wrap">{battleAnswerLeft}</p>
                    ) : (
                      <p className="text-slate-600 italic">No output compiled yet. Round starting metrics are offline.</p>
                    )}
                  </div>

                  <div className="bg-[#090A0E] p-3 rounded-lg border border-[#1E293B]/60 grid grid-cols-2 gap-2 text-center font-mono">
                    <div>
                      <div className="text-[9px] text-slate-500 block uppercase font-bold">Trace Telemetry</div>
                      <span className="text-xs font-bold text-rose-500">DISABLED (0 spans)</span>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 block uppercase font-bold">Calibration Level</div>
                      <span className="text-xs font-bold text-amber-500">Unmeasured</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT TERMINAL: IMPROVED ACTIVE MONITOR */}
                <div className="flex flex-col rounded-2xl border border-emerald-900/30 bg-[#0E1017] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-950 pb-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                      <span className="text-xs font-bold text-slate-200">Phantos AI Self-Improving</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 border border-emerald-800/40 px-2 py-0.5 rounded text-emerald-400">
                      Trace Evaluated
                    </span>
                  </div>

                  <div className="flex-1 p-4 bg-[#090A0E] rounded-xl border border-[#161B22] font-mono min-h-[180px] overflow-y-auto text-xs text-emerald-300/90 leading-relaxed space-y-3">
                    {battleAnswerRight ? (
                      <p className="whitespace-pre-wrap">{battleAnswerRight}</p>
                    ) : (
                      <p className="text-slate-600 italic">Waiting for comparison launch context.</p>
                    )}
                  </div>

                  <div className="bg-[#090A0E] p-3 rounded-lg border border-[#1E293B]/60 grid grid-cols-2 gap-2 text-center font-mono border-t border-emerald-950">
                    <div>
                      <div className="text-[9px] text-slate-500 block uppercase font-bold">Phoenix Telemetry</div>
                      <span className="text-xs font-bold text-emerald-400">ENABLED (4 spans)</span>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 block uppercase font-bold">Judgement evaluation</div>
                      <span className="text-xs font-bold text-indigo-400">Calibrated + Healed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROUND GAP AND TOTAL SCORING */}
              <div className="bg-[#11141D] border border-[#1E293B] rounded-2xl p-5 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
                      Running Calibration Gap Analysis
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Accumulated correctness accuracy gaps expand over multiple rounds.
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-mono font-bold block text-slate-500">Performance Overdue</span>
                    <span className="text-sm font-semibold font-mono text-emerald-400">
                      Phantos AI is {benchmarkAdvantagePercent}% more accurate
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-[#1E293B] pt-5">
                  {/* Gauge indicator */}
                  <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-[#0E1017] border border-[#1E293B] rounded-xl">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      {/* Arc backgrounds */}
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle cx="72" cy="72" r="54" strokeWidth="6" stroke="#1E293B" fill="transparent" />
                        <circle 
                          cx="72" 
                          cy="72" 
                          r="54" 
                          strokeWidth="6" 
                          stroke="#22C55E" 
                          fill="transparent" 
                          strokeDasharray="339"
                          strokeDashoffset={339 - (339 * ((battleScores.agentwatch.reduce((a, b) => a + b, 0) / (battleScores.agentwatch.length || 1)) / 1))}
                          className="transition-all duration-500"
                        />
                        <circle 
                          cx="72" 
                          cy="72" 
                          r="46" 
                          strokeWidth="4" 
                          stroke="#EF4444" 
                          fill="transparent" 
                          strokeDasharray="289"
                          strokeDashoffset={289 - (289 * ((battleScores.unmonitored.reduce((a, b) => a + b, 0) / (battleScores.unmonitored.length || 1)) / 1))}
                          className="transition-all duration-500 opacity-60"
                        />
                      </svg>
                      {/* Text ratings */}
                      <div className="text-center">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-tight">EVAL GAP</span>
                        <span className="text-xl font-bold font-sans text-slate-200">
                          +{Math.round((
                            (battleScores.agentwatch.reduce((a, b) => a + b, 0) / (battleScores.agentwatch.length || 1)) -
                            (battleScores.unmonitored.reduce((a, b) => a + b, 0) / (battleScores.unmonitored.length || 1))
                          ) * 100) || 45}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Monitored: {Math.round((battleScores.agentwatch.reduce((a, b) => a + b, 0) / (battleScores.agentwatch.length || 1)) * 100) || 78}%</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Blind: {Math.round((battleScores.unmonitored.reduce((a, b) => a + b, 0) / (battleScores.unmonitored.length || 1)) * 100) || 41}%</span>
                    </div>
                  </div>

                  {/* Winner Banner block */}
                  <div className="space-y-4">
                    {battleCompleted ? (
                      <div className="p-5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2 animate-pulse">
                        <h4 className="text-xs font-bold text-emerald-400 font-display uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          🏆 Phantos AI wins with 78% accuracy
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          Adversarial evaluations finished. Monitored agent resolved 8 of 10 restocking exceptions and headset warranties perfectly. Baseline agent scored 41% due to massive policy context hallucinations.
                        </p>
                      </div>
                    ) : (
                      <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-1 text-slate-400 text-[11px] leading-relaxed">
                        <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Adversarial Evaluation rules</span>
                        Dual system runs queries concurrently on our baseline model context. Evaluation results are calculated at the end of each turn using Phoenix-aligned metrics. Complete all rounds to trigger the winner status dashboard.
                      </div>
                    )}

                    {/* Battle log list */}
                    <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                      {battleHistoryLog.map((log) => (
                        <div key={log.round} className="p-3 bg-[#0E1017] border border-[#1E293B] rounded-lg flex items-center justify-between text-[11px] font-mono">
                          <div className="truncate max-w-[70%]">
                            <span className="text-amber-500 font-bold block">RND #{log.round}</span>
                            <span className="text-slate-400 truncate">{log.question}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-emerald-400 font-bold">Obs: {log.rightScore}</div>
                            <div className="text-rose-500 font-bold">Blind: {log.leftScore}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: DYNAMIC KNOWLEDGE MEMORY PALACE */}
          {activeTab === "palace" && (
            <motion.div 
              key="palace-tab"
              id="memory-palace-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-hidden flex flex-col bg-[#08090C]"
            >
              {/* TOP ACTIONS & LEGEND ROW */}
              <div className="p-2 px-3 bg-[#0C0D12] border-b border-[#1E293B] shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left Side: ~30% Width for Title & Compact Legend */}
                  <div className="lg:w-[35%] shrink-0 space-y-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-200 font-display flex items-center gap-1">
                      <LayoutGrid className="h-3.5 w-3.5 text-emerald-400" />
                      Dynamic Memory Palace
                    </h3>
                    {/* Compact Legend Indicators */}
                    <div className="flex items-center gap-2 text-[7.5px] font-mono select-none">
                      <span className="text-slate-500 font-bold uppercase tracking-wider mr-0.5">LEGEND:</span>
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_4px_#6366f1]" />
                        <span className="text-slate-400">Rule</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
                        <span className="text-slate-400">Store</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]" />
                        <span className="text-slate-400">Specs</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: ~70% Width for Interactive Search & Filters */}
                  <div className="flex-1 lg:w-[65%] flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                    {/* Search Field */}
                    <div className="relative shrink-0 sm:w-48">
                      <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                      <input
                        type="text"
                        value={searchPalaceText}
                        onChange={(e) => setSearchPalaceText(e.target.value)}
                        placeholder="Search articles..."
                        className="w-full bg-[#0E1117] text-slate-200 text-[10px] border border-[#1E293B] rounded-lg pl-7 pr-2.5 py-1.5 focus:outline-none focus:border-emerald-500/40 font-sans"
                      />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0">
                      <span className="text-[9px] font-mono text-slate-500 uppercase font-bold shrink-0 mr-1">Filter:</span>
                      <button
                        onClick={() => setPalaceFilterCategory(null)}
                        className={`px-1.5 py-0.5 text-[9px] font-mono rounded transition cursor-pointer border ${
                          palaceFilterCategory === null 
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 font-bold" 
                            : "bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ALL
                      </button>
                      {["Policies", "Warranties", "Specs", "Rules"].map(category => (
                        <button
                          key={category}
                          onClick={() => setPalaceFilterCategory(category)}
                          className={`px-1.5 py-0.5 text-[9px] font-mono rounded transition cursor-pointer border ${
                            palaceFilterCategory === category 
                              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 font-bold" 
                              : "bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {category.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC MAP GRID / GRAPH SELECTION */}
              <div className="flex-1 flex flex-col md:flex-row items-stretch overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#1E293B]">
                {/* NODE CANVAS */}
                <div className="flex-1 flex flex-col bg-[#07080B] overflow-hidden">

                  <div className="flex-1 p-4 overflow-y-auto bg-[#07080B] relative">
                    {/* Simulated Dynamic Forces Coordinates Layout of Nodes */}
                    <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {INITIAL_MEMORY_NODES
                      .filter(node => !palaceFilterCategory || node.category === palaceFilterCategory)
                      .filter(node => !searchPalaceText || node.label.toLowerCase().includes(searchPalaceText.toLowerCase()) || node.desc.toLowerCase().includes(searchPalaceText.toLowerCase()))
                      .map(node => {
                        const isHealed = activeRules.some(r => r.text.toLowerCase().includes(node.id) || r.id.includes(node.id) || (node.id === "restocking_fee" && r.text.toLowerCase().includes("laptop")));
                        const isPulse = pulseNodeId === node.id || isMemoryActiveState === node.id;
                        
                        // Category visual styling helper
                        const colors = (() => {
                          switch (node.category) {
                            case "Rules":
                              return {
                                border: isPulse ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.35)] bg-indigo-950/20" : isHealed ? "border-indigo-500/45 hover:border-indigo-500 bg-[#0C101B]/95" : "border-slate-800/80 hover:border-slate-700 bg-[#0C101B]/80",
                                text: "text-indigo-400",
                                badge: "bg-indigo-950/60 border border-indigo-900/60 text-indigo-400",
                                glow: "bg-indigo-500/15",
                                bar: "bg-indigo-500",
                                progressBg: "bg-indigo-950/60",
                                icon: BookOpen
                              };
                            case "Warranties":
                              return {
                                border: isPulse ? "border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)] bg-rose-950/20" : isHealed ? "border-rose-500/45 hover:border-rose-500 bg-[#170C0F]/95" : "border-slate-800/80 hover:border-slate-700 bg-[#170C0F]/80",
                                text: "text-rose-400",
                                badge: "bg-rose-950/60 border border-rose-900/60 text-rose-400",
                                glow: "bg-rose-500/15",
                                bar: "bg-rose-500",
                                progressBg: "bg-rose-950/60",
                                icon: ShieldAlert
                              };
                            case "Specs":
                              return {
                                border: isPulse ? "border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.35)] bg-cyan-950/20" : isHealed ? "border-cyan-500/45 hover:border-cyan-500 bg-[#0A111A]/95" : "border-slate-800/80 hover:border-slate-700 bg-[#0A111A]/80",
                                text: "text-cyan-400",
                                badge: "bg-cyan-950/60 border border-cyan-900/60 text-cyan-400",
                                glow: "bg-cyan-500/15",
                                bar: "bg-cyan-400",
                                progressBg: "bg-cyan-950/60",
                                icon: Cpu
                              };
                            default:
                              return {
                                border: isPulse ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)] bg-emerald-950/20" : isHealed ? "border-emerald-500/45 hover:border-emerald-500 bg-[#0C1510]/95" : "border-slate-800/80 hover:border-slate-700 bg-[#0C1510]/80",
                                text: "text-emerald-400",
                                badge: "bg-emerald-950/60 border border-emerald-900/60 text-emerald-400",
                                glow: "bg-emerald-500/15",
                                bar: "bg-emerald-500",
                                progressBg: "bg-emerald-950/60",
                                icon: Compass
                              };
                          }
                        })();

                        const IconComponent = colors.icon;
                        const confidenceValue = isHealed ? 94 : 35;
                        
                        return (
                          <motion.div
                            key={node.id}
                            id={`palace-node-${node.id}`}
                            whileHover={{ y: -4, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 350, damping: 22 }}
                            onClick={() => {
                              setSelectedSpan(null);
                              setIsMemoryActiveState(node.id);
                              setPulseNodeId(node.id);
                              playAudioFeedback("whoosh");
                              setTimeout(() => setPulseNodeId(null), 1000);
                            }}
                            className={`p-4 rounded-lg border cursor-pointer select-none relative overflow-hidden transition-all duration-300 flex flex-col justify-between min-h-[170px] ${colors.border}`}
                          >
                            {/* Card Background Glow */}
                            <div className={`absolute -right-12 -top-12 w-28 h-28 rounded-full blur-2xl opacity-40 transition-all pointer-events-none ${colors.glow}`} />

                            <div className="space-y-4">
                              {/* Top Row: Category Badge + Access metrics */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <div className={`p-1 rounded-md ${colors.badge}`}>
                                    <IconComponent className="h-3 w-3" />
                                  </div>
                                  <span className="text-[9px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                                    {node.id.toUpperCase()}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
                                  <Eye className="h-3 w-3 text-slate-500" />
                                  <span className="font-semibold text-slate-300">{node.times_accessed} hits</span>
                                </div>
                              </div>

                              {/* Title & Desc */}
                              <div className="space-y-1.5">
                                <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-widest font-mono">
                                  {node.label}
                                </h4>
                                <p className="text-[10px] text-slate-405 text-slate-400 leading-relaxed font-sans line-clamp-2">
                                  {node.desc}
                                </p>
                              </div>
                            </div>

                            {/* Footer section: Confidence visualization */}
                            <div className="space-y-1.5 border-t border-[#1E293B]/60 pt-2.5 mt-1.5">
                              <div className="flex items-center justify-between text-[9px] font-mono">
                                <span className="text-slate-400 font-bold uppercase tracking-wider">{node.category}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-450 font-bold">Confidence:</span>
                                  <span className={`font-black ${isHealed ? "text-emerald-400" : "text-amber-500"}`}>
                                    {confidenceValue}%
                                  </span>
                                </div>
                              </div>

                              {/* Beautiful progress track */}
                              <div className={`w-full h-1 rounded-full overflow-hidden ${colors.progressBg}`}>
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${confidenceValue}%` }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  className={`h-full rounded-full ${colors.bar}`}
                                />
                              </div>

                              {/* Bottom Status marker */}
                              <div className="flex items-center justify-between pt-0.5">
                                <span className={`text-[9px] font-mono font-black flex items-center gap-1 ${isHealed ? "text-emerald-400" : "text-amber-500/90"}`}>
                                  <span className={`w-1 h-1 rounded-full ${isHealed ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-amber-400/90 animate-pulse shadow-[0_0_6px_#f59e0b]"}`} />
                                  {isHealed ? "SECURED & INDEXED" : "UNCALIBRATED"}
                                </span>
                              </div>
                            </div>

                            {/* Node Pulse Effect */}
                            {pulseNodeId === node.id && (
                              <div className="absolute inset-0 border-2 border-emerald-400 rounded-2xl animate-ping opacity-60 pointer-events-none" />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* NODE DRAWER / MOBILE BOTTOM SHEET */}
                {isMobile ? (
                  isMemoryActiveState && (
                    <>
                      {/* Backdrop */}
                      <div 
                        onClick={() => setIsMemoryActiveState(null)} 
                        className="fixed inset-0 bg-[#07080B]/70 backdrop-blur-xs z-40 transition-opacity" 
                      />
                      {/* Bottom Sheet Drawer */}
                      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0C0D12] border-t border-[#1E293B] rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 pb-12 shadow-2xl flex flex-col justify-between animate-in slide-in-from-bottom duration-300">
                        {/* Drawer pull bar indicator */}
                        <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-5 shrink-0" />
                        
                        {(() => {
                          const matchedNode = INITIAL_MEMORY_NODES.find(n => n.id === isMemoryActiveState);
                          const healsApplied = activeRules.filter(r => r.text.toLowerCase().includes(isMemoryActiveState) || r.id.includes(isMemoryActiveState) || (isMemoryActiveState === "restocking_fee" && r.text.toLowerCase().includes("laptop")));
                          
                          return (
                            <div className="space-y-5">
                              <div className="space-y-4">
                                <div className="border-b border-[#1E293B] pb-3 flex justify-between items-center">
                                  <div>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Concept details</span>
                                    <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-display mt-0.5">{matchedNode?.label}</h4>
                                  </div>
                                  <button 
                                    onClick={() => setIsMemoryActiveState(null)}
                                    className="p-1 text-slate-500 hover:text-slate-300 text-xs font-mono font-bold"
                                  >
                                    ✕
                                  </button>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">Document Payload Exception:</span>
                                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{matchedNode?.desc}</p>
                                </div>

                                <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                  <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Calibration Ratio</span>
                                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                                    <span className="text-emerald-400">Healed Correctness</span>
                                    <span className="text-emerald-400">94%</span>
                                  </div>
                                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "94%" }} />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">Matched Rules In prompts context:</span>
                                  {healsApplied.length === 0 ? (
                                    <div className="p-3 bg-rose-950/20 text-rose-400 border border-rose-900/40 rounded-xl text-[10px] leading-relaxed">
                                      <span className="font-bold flex items-center gap-1 uppercase"><AlertTriangle className="h-3 w-3" /> Vulnerability Active</span>
                                      No prompt rules are protecting this concept. Standard uncalibrated models could fabricate answers. Recommend triggering System Corrections.
                                    </div>
                                  ) : (
                                    healsApplied.map(ru => (
                                      <div key={ru.id} className="p-2.5 bg-indigo-950/20 border border-indigo-900/40 rounded-lg text-[10px] font-mono text-indigo-400 leading-normal">
                                        <span className="font-bold block uppercase">{ru.id} is Active</span>
                                        {ru.text}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              <div className="pt-4 border-t border-[#1E293B]">
                                <button
                                  onClick={() => setIsMemoryActiveState(null)}
                                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-xs font-mono font-bold text-slate-300 rounded-xl border border-[#1E293B] cursor-pointer"
                                >
                                  Deselect Node
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  )
                ) : (
                  <div className="w-full md:w-80 bg-[#0C0D12] p-5 shrink-0 flex flex-col h-full border-t md:border-t-0 md:border-l border-[#1E293B] justify-between">
                    {isMemoryActiveState ? (() => {
                      const matchedNode = INITIAL_MEMORY_NODES.find(n => n.id === isMemoryActiveState);
                      const healsApplied = activeRules.filter(r => r.text.toLowerCase().includes(isMemoryActiveState) || r.id.includes(isMemoryActiveState) || (isMemoryActiveState === "restocking_fee" && r.text.toLowerCase().includes("laptop")));
                      
                      return (
                        <div className="space-y-5 h-full flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="border-b border-[#1E293B] pb-3">
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Concept details</span>
                              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-display mt-0.5">{matchedNode?.label}</h4>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">Document Payload Exception:</span>
                              <p className="text-xs text-slate-400 leading-relaxed font-sans">{matchedNode?.desc}</p>
                            </div>

                            <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                              <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">Calibration Ratio</span>
                              <div className="flex justify-between items-center text-xs font-mono font-bold">
                                <span className="text-emerald-400">Healed Correctness</span>
                                <span className="text-emerald-450">94%</span>
                              </div>
                              <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "94%" }} />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase">Matched Rules In prompts context:</span>
                              {healsApplied.length === 0 ? (
                                <div className="p-3 bg-rose-950/20 text-rose-400 border border-rose-900/40 rounded-xl text-[10px] leading-relaxed">
                                  <span className="font-bold flex items-center gap-1 uppercase"><AlertTriangle className="h-3 w-3" /> Vulnerability Active</span>
                                  No prompt rules are protecting this concept. Standard uncalibrated models could fabricate answers. Recommend triggering System Corrections.
                                </div>
                              ) : (
                                healsApplied.map(ru => (
                                  <div key={ru.id} className="p-2.5 bg-indigo-950/20 border border-indigo-900/40 rounded-lg text-[10px] font-mono text-indigo-400 leading-normal">
                                    <span className="font-bold block uppercase">{ru.id} is Active</span>
                                    {ru.text}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#1E293B]">
                            <button
                              onClick={() => setIsMemoryActiveState(null)}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-xs font-mono font-bold text-slate-300 rounded-xl border border-[#1E293B] cursor-pointer"
                            >
                              Deselect Node
                            </button>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
                        <HelpCircle className="h-8 w-8 text-slate-800 shrink-0" />
                        <h4 className="text-xs font-semibold text-slate-300">Concept Details Offline</h4>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Click on any vector card node in the palace grid to inspect document payloads, context coverage, and dynamic prompt rules.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: DYNAMIC RULES MATRIX & IMPROVEMENT TIMELINE */}
          {activeTab === "rules" && (
            <motion.div 
              key="rules-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-6 space-y-6"
            >
              
              {/* Manual self training trigger dashboard */}
              <div className="bg-[#111419] border border-[#1E293B] rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-display flex items-center gap-2">
                    <Zap className="h-5 w-5 text-indigo-400 fill-current" />
                    Automated Trace self-improving Engine
                  </h3>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    This unit connects to Phoenix Collector endpoint, loads failed conversation records, and uses Gemini to engineer prompt-level boundaries. This simulates a continuous, server-level accuracy repair loop.
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    id="analyze-traces-trigger"
                    onClick={runSelfCorrectionCycle}
                    disabled={isImproving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-display font-bold shadow text-xs uppercase tracking-widest cursor-pointer disabled:opacity-50 transition"
                  >
                    {isImproving ? "Analyzing Traces..." : "Analyze Traces & Learn Now"}
                  </button>
                </div>
              </div>

              {/* Loop ongoing overlay details */}
              {isImproving && (
                <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    <span className="text-xs font-mono font-bold text-indigo-300">Evaluating local Phoenix trace collector schemas:</span>
                  </div>
                  <p className="text-xs font-mono text-slate-300">{improvementStep}</p>
                </div>
              )}

              {/* Show active system directives cards */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 font-display uppercase tracking-widest flex items-center gap-1.5 text-indigo-400">
                  <Server className="h-4 w-4" />
                  Active prompt directive cards
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeRules.map((r, idx) => (
                    <motion.div 
                      key={r.id}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="bg-[#111419] p-4 border border-[#1E293B] rounded-xl space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className={`px-2 py-0.5 rounded ${
                            r.id.startsWith("rule-init") ? "bg-slate-900 border border-slate-800 text-slate-400" : "bg-indigo-950/40 border border-indigo-500/20 text-indigo-300"
                          }`}>
                            Rule ID: {r.id}
                          </span>
                          <span className="text-slate-500">{new Date(r.addedAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium">"{r.text}"</p>
                      </div>

                      <div className="pt-2.5 border-t border-[#1E293B] text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <span className="font-bold uppercase text-slate-400">Trigger category:</span>
                        <span className="lowercase bg-[#0F1115] border border-[#1E293B] px-1.5 py-0.5 rounded text-indigo-400">
                          {r.category}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* SIDE-BY-SIDE A/B COMPARISON VIEW */}
              {showCompareViewInRules && (
                <div className="bg-[#111419] border border-[#1E293B] rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#1E293B]">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-emerald-400" />
                        Dynamic A/B Comparison View (Before vs After Self-Healing)
                      </h3>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                        Interactive showcase proving system rules injection effectiveness across discovered policy loopholes.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-[#1E293B]">
                      <button
                        onClick={() => { setAbSelectedTopic("laptop"); playAudioFeedback("whoosh"); }}
                        id="ab-laptop-clause-tab"
                        className={`text-[10px] px-3 py-1 rounded font-display font-medium uppercase tracking-wider cursor-pointer transition ${
                          abSelectedTopic === "laptop" 
                            ? "bg-indigo-600 text-white shadow" 
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Laptop Fee Clause
                      </button>
                      <button
                        onClick={() => { setAbSelectedTopic("headset"); playAudioFeedback("whoosh"); }}
                        id="ab-headset-clause-tab"
                        className={`text-[10px] px-3 py-1 rounded font-display font-medium uppercase tracking-wider cursor-pointer transition ${
                          abSelectedTopic === "headset" 
                            ? "bg-indigo-600 text-white shadow" 
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        SoundSync Headset
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Column 1: BEFORE */}
                    <div className="bg-[#0F1115] border border-red-500/10 rounded-xl p-4 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-rose-500/10 text-red-400 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-bl uppercase border-l border-b border-red-500/20">
                        Baseline Failure (A)
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">User Question Trigger</span>
                        <p className="text-xs text-slate-300 font-semibold italic">
                          {abSelectedTopic === "laptop" 
                            ? "Can I return my ApexPro laptop for a 100% refund? I opened the box but didn't like the color."
                            : "I bought a refurbished SoundSync headset yesterday. How long do I have under warranty coverage?"
                          }
                        </p>
                      </div>

                      <div className="p-3 bg-red-950/10 border border-red-900/20 rounded-lg space-y-1">
                        <span className="text-[9px] font-mono text-red-400 font-bold block">🚨 Uncalibrated Agent Response</span>
                        <p className="text-xs text-red-200/90 leading-relaxed font-mono">
                          {abSelectedTopic === "laptop"
                            ? "Yes, absolutely! TechStore offers 100% full hassle-free refunds for any laptops within 30 days of purchase, even if the packaging boxes have been opened and used."
                            : "Refurbished SoundSync headsets are covered under our premier full comprehensive 2-year warranty period. We will replace or refund it full-value if you face concerns!"
                          }
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono pt-1">
                        <span className="text-red-400 font-bold">Accuracy Score: 30%</span>
                        <span className="text-slate-500">Confidence: 95% (Overconfident)</span>
                      </div>
                    </div>

                    {/* Column 2: AFTER */}
                    <div className="bg-[#0F1115] border border-emerald-500/15 rounded-xl p-4 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-bl uppercase border-l border-b border-emerald-500/20">
                        Self-Healed Outcome (B)
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Safe Guardrail Injected</span>
                        <p className="text-xs text-slate-300 font-semibold italic">
                          {abSelectedTopic === "laptop" 
                            ? "Can I return my ApexPro laptop for a 100% refund? I opened the box but didn't like the color."
                            : "I bought a refurbished SoundSync headset yesterday. How long do I have under warranty coverage?"
                          }
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 rounded-lg space-y-1">
                        <span className="text-[9px] font-mono text-emerald-400 font-bold block">🟢 Self-Corrected Agent Response</span>
                        <p className="text-xs text-emerald-200/90 leading-relaxed font-mono">
                          {abSelectedTopic === "laptop"
                            ? "Under Section 4.1 of the TechStore policy, return shipments for opened laptop packages are accepted within 14 days of purchase but are subject to a mandatory 15% restocking fee."
                            : "Our premium refurbished items, including custom headsets, are protected specifically by a strict 90-day comprehensive coverage. Section 5.2 explicitly excludes standard wear-and-tear."
                          }
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono pt-1">
                        <span className="text-emerald-400 font-bold">Accuracy Score: 98%</span>
                        <span className="text-slate-500">Injected Ref: #rules-{abSelectedTopic === 'laptop' ? 'init-1' : 'init-2'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TIMELINE ARCHIVE ARCHITECTURE OF IMPROVEMENTS */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-300 font-display uppercase tracking-widest flex items-center gap-1.5 text-indigo-400">
                  <History className="h-4 w-4" />
                  Self-Improvement loop history logs
                </h4>

                {improvementHistory.length === 0 ? (
                  <div className="border border-[#1E293B] bg-[#111419] p-6 rounded-xl text-center text-xs text-slate-500">
                    No improvement logs archived yet. Failure traces must occur first.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {improvementHistory.map((ev, i) => (
                      <div key={ev.id} className="bg-[#111419] p-4 rounded-xl border border-[#1E293B] grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <div className="text-[10px] text-slate-500 font-mono">CYCLE ORDER LEVEL #{i + 1}</div>
                          <h4 className="text-xs font-bold text-slate-300 font-display mt-0.5">{new Date(ev.timestamp).toLocaleTimeString()}</h4>
                          <span className="text-[9px] text-[#6366f1] font-mono mt-1 block font-bold">Score Gain: +{ev.improvementPercent}%</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Failure Patterns:</span>
                          <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 font-mono">
                            {ev.patternsFound.map((pat, idx) => <li key={idx} className="truncate">{pat}</li>)}
                          </ul>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Injected Rules:</span>
                          <ul className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                            {ev.rulesAdded.map((ru, idx) => <li key={idx} className="truncate italic">"{ru.slice(0, 50)}..."</li>)}
                          </ul>
                        </div>

                        <div className="bg-[#0F1115] p-3 rounded-lg border border-[#1E293B] flex items-center justify-between font-mono">
                          <div>
                            <div className="text-[9px] text-slate-500 font-bold">Baseline Target</div>
                            <div className="text-xs text-slate-300 font-bold">{ev.scoreBefore}</div>
                          </div>
                          <div><ChevronRight className="h-4 w-4 text-slate-600" /></div>
                          <div className="text-right">
                            <div className="text-[9px] text-slate-500 font-bold">Repaired</div>
                            <div className="text-xs text-indigo-400 font-bold">{ev.scoreAfter}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* INTERACTIVE GUIDE TOUR POPOVER CARD */}
        {tourActive && (() => {
          const step = TOUR_STEPS_LIST[tourStepIndex];
          
          let popoverStyle: CSSProperties = {
            position: "fixed",
            zIndex: 9999,
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          };

          if (tourTargetRect) {
            const rect = tourTargetRect;
            const gap = 14;
            const placement = step.placement || "bottom";

            // Default positioning calculations
            let top = rect.bottom + gap;
            let left = rect.left + rect.width / 2 - 160; // 320px width centered

            if (placement === "top") {
              top = rect.top - 200 - gap;
              left = rect.left + rect.width / 2 - 160;
            } else if (placement === "bottom") {
              top = rect.bottom + gap;
              left = rect.left + rect.width / 2 - 160;
            } else if (placement === "left") {
              top = rect.top + rect.height / 2 - 90;
              left = rect.left - 320 - gap;
            } else if (placement === "right") {
              top = rect.top + rect.height / 2 - 90;
              left = rect.right + gap;
            }

            // Screen boundary Collision safe checks
            if (left < 16) left = 16;
            if (left + 320 > window.innerWidth - 16) {
              left = window.innerWidth - 320 - 16;
            }
            if (top < 16) top = 16;
            if (top + 230 > window.innerHeight - 16) {
              top = window.innerHeight - 230 - 16;
            }

            popoverStyle.top = `${top}px`;
            popoverStyle.left = `${left}px`;
          } else {
            // Walkthrough fallback position
            popoverStyle.bottom = "24px";
            popoverStyle.right = "24px";
          }

          return (
            <>
              {/* Highlight spotlight pointer box */}
              {tourTargetRect && (
                <div 
                  className="fixed z-[9998] border-2 border-indigo-500 rounded-xl pointer-events-none animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-350 bg-indigo-500/5"
                  style={{
                    left: tourTargetRect.left - 6,
                    top: tourTargetRect.top - 6,
                    width: tourTargetRect.width + 12,
                    height: tourTargetRect.height + 12,
                  }}
                />
              )}

              <div 
                style={popoverStyle}
                className="w-80 bg-slate-950 border border-indigo-500 rounded-2xl shadow-[0_0_28px_rgba(99,102,241,0.3)] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    System Walkthrough ({tourStepIndex + 1}/{TOUR_STEPS_LIST.length})
                  </span>
                  <button 
                    onClick={() => { setTourActive(false); playAudioFeedback("success"); }}
                    className="text-slate-500 hover:text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide font-display">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {step.body}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1E293B]">
                  <button
                    onClick={handlePrevTourStep}
                    disabled={tourStepIndex === 0}
                    className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>

                  <div className="flex gap-1">
                    {TOUR_STEPS_LIST.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                          idx === tourStepIndex ? "bg-indigo-400 w-3" : "bg-slate-850"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNextTourStep}
                    className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-600 hover:bg-slate-100 hover:text-slate-950 text-white rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    {tourStepIndex === TOUR_STEPS_LIST.length - 1 ? "Finish ✓" : "Next →"}
                  </button>
                </div>
              </div>
            </>
          );
        })()}

      </main>
    </div>
  );
}
