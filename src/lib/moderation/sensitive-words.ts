import { createClient } from "@/lib/supabase/server";
import { MatchLevel, SensitiveWordRecord } from "./types";

// 内存级敏感词短期缓存（60秒更新一次，降低数据库并发压力）
let cachedWords: SensitiveWordRecord[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000;

export async function getActiveSensitiveWords(): Promise<SensitiveWordRecord[]> {
  const now = Date.now();
  if (cachedWords && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedWords;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sensitive_words")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("[SensitiveWords] 获取敏感词库失败:", error);
      return cachedWords || [];
    }

    cachedWords = (data as SensitiveWordRecord[]) || [];
    lastCacheTime = now;
    return cachedWords;
  } catch (err) {
    console.error("[SensitiveWords] 获取敏感词库异常:", err);
    return cachedWords || [];
  }
}

export function invalidateSensitiveWordsCache() {
  cachedWords = null;
  lastCacheTime = 0;
}

export interface SensitiveScanResult {
  hasBlock: boolean;
  hasPending: boolean;
  matchedBlockWords: string[];
  matchedPendingWords: string[];
  allMatchedWords: string[];
}

/**
 * 对输入文本进行敏感词扫描匹配
 */
export async function scanSensitiveWords(text: string): Promise<SensitiveScanResult> {
  if (!text || typeof text !== "string") {
    return {
      hasBlock: false,
      hasPending: false,
      matchedBlockWords: [],
      matchedPendingWords: [],
      allMatchedWords: [],
    };
  }

  const words = await getActiveSensitiveWords();
  const lowerText = text.toLowerCase();

  const matchedBlockWords: string[] = [];
  const matchedPendingWords: string[] = [];

  for (const item of words) {
    if (!item.word) continue;
    const target = item.word.toLowerCase().trim();
    if (!target) continue;

    if (lowerText.includes(target)) {
      if (item.match_level === "block") {
        matchedBlockWords.push(item.word);
      } else {
        matchedPendingWords.push(item.word);
      }
    }
  }

  const allMatchedWords = Array.from(
    new Set([...matchedBlockWords, ...matchedPendingWords])
  );

  return {
    hasBlock: matchedBlockWords.length > 0,
    hasPending: matchedPendingWords.length > 0,
    matchedBlockWords,
    matchedPendingWords,
    allMatchedWords,
  };
}
