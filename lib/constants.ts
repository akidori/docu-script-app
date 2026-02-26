/**
 * 30秒ルール（文字数）
 * 基準: 1分 = 350文字（標準ナレーション速度）
 */
export const CHARS_PER_MINUTE = 350;
export const CHARS_30_SEC = Math.floor(CHARS_PER_MINUTE / 2); // 175
export const CHARS_180_SEC = CHARS_PER_MINUTE * 3; // 1050

export const TIMING_LABELS = {
  "30秒": { sec: 30, chars: CHARS_30_SEC },
  "1分": { sec: 60, chars: CHARS_PER_MINUTE },
  "3分": { sec: 180, chars: CHARS_180_SEC },
} as const;
