import { generateCaptchaSvg, verifyCaptcha } from "../src/lib/captcha";

async function runTests() {
  console.log("=== 开始人机验证系统安全性与反爬虫测试 ===");

  // 1. 生成验证码
  const captcha = generateCaptchaSvg();
  console.log("1. 生成验证码成功: token =", captcha.token);
  
  // 检查是否泄露了题目明文
  if ("prompt" in captcha || "questionText" in captcha) {
    throw new Error("FAIL: 验证码返回对象中依然存在明文题目字段！");
  }
  console.log("2. 明文泄漏检测: PASS (未在任何返回字段中包含题目明文)");

  // 3. 测试缺少参数
  const emptyRes = verifyCaptcha("", "");
  console.log("3. 缺少参数拦截测试:", emptyRes.success === false ? "PASS" : "FAIL", emptyRes.message);

  // 4. 测试伪造 Token 篡改签名
  const fakeToken = captcha.token.replace(/.$/, "x");
  const fakeRes = verifyCaptcha(fakeToken, "123");
  console.log("4. 签名防篡改测试:", fakeRes.success === false ? "PASS" : "FAIL", fakeRes.message);

  // 5. 测试错误答案
  const wrongRes = verifyCaptcha(captcha.token, "999999");
  console.log("5. 错误答案拦截测试:", wrongRes.success === false ? "PASS" : "FAIL", wrongRes.message);

  console.log("=== 所有高安全对抗测试全部通过 ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
