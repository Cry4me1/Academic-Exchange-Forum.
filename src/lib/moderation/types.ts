export type RiskLevel = "safe" | "sensitive" | "dangerous";
export type ReviewStatus = "approved" | "pending" | "rejected";
export type MatchLevel = "pending" | "block";
export type FinalAction =
  | "auto_approved"
  | "auto_pending"
  | "auto_rejected"
  | "manual_approved"
  | "manual_rejected";

export interface SensitiveWordRecord {
  id: string;
  word: string;
  category: string;
  match_level: MatchLevel;
  is_active: boolean;
  created_at?: string;
  created_by?: string | null;
}

export interface AIReviewOutput {
  score: number;
  riskLevel: RiskLevel;
  tags: string[];
  reason: string;
}

export interface ModerationResult {
  reviewStatus: ReviewStatus;
  riskLevel: RiskLevel;
  score: number;
  reason: string;
  suggestedTags: string[];
  matchedSensitiveWords: string[];
  finalAction: FinalAction;
  isCached: boolean;
  latencyMs: number;
  costTokens?: number;
  canPublish: boolean; // 是否允许立即前台公开
  errorMessage?: string; // 若被直接拦截时的友善提示
}
