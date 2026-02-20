import { ACADEMIC_GREETINGS_CN } from '../constants';

// 移除 GoogleGenAI 依赖，完全使用本地预设数据，确保秒开且无加载错误。

export const generateAcademicFortune = async (): Promise<string> => {
  // 模拟一个简短的“查阅”延迟，增加仪式感
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * ACADEMIC_GREETINGS_CN.length);
      resolve(ACADEMIC_GREETINGS_CN[randomIndex]);
    }, 800); // 0.8秒延迟，比之前更快
  });
};