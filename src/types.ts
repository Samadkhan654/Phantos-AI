/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TraceSpan {
  id: string;
  name: string;
  type: "agent_turn" | "tool_call" | "evaluation";
  startTime: number;
  endTime: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  attributes: {
    sessionId?: string;
    model?: string;
    latencyMs?: number;
    wasSelfCorrected?: boolean;
    qualityScore?: number;
    qualityTier?: string;
    error?: string;
    [key: string]: any;
  };
}

export interface EvaluationResult {
  accuracy: number;     // 0-1
  helpfulness: number;  // 0-1
  completeness: number; // 0-1
  honesty: number;      // 0-1
  overall: number;      // 0-1
  reasoning: string;
  mainProblem?: string;
  suggestion?: string;
  confidence?: number;  // 0-1
}

export interface Trace {
  traceId: string;
  timestamp: string;
  question: string;
  response: string;
  spans: TraceSpan[];
  evaluation?: EvaluationResult;
  category: string;
  wasSelfCorrected: boolean;
  correctionReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
}

export interface ImprovementEvent {
  id: string;
  timestamp: string;
  badTracesCount: number;
  patternsFound: string[];
  rulesAdded: string[];
  scoreBefore: number;
  scoreAfter: number;
  improvementPercent: number;
}

export interface Rule {
  id: string;
  text: string;
  category: string;
  addedAt: string;
  reason: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  traceId?: string;
  evaluation?: EvaluationResult;
  toolsCalled?: string[];
  responseTimeMs?: number;
  wasSelfCorrected?: boolean;
}

export interface SessionMetrics {
  averageScore: number;
  totalConversations: number;
  selfCorrectionsCount: number;
  highestScore: number;
  lowestScore: number;
  improvementPercent: number;
  scoreHistory: { turn: number; score: number; isImprovementNode?: boolean }[];
  dimensionAverages: {
    accuracy: number;
    helpfulness: number;
    completeness: number;
    honesty: number;
  };
}
