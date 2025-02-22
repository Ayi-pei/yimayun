// index.js
import fs from 'fs';
import path from 'path';

// 1. 定义 JSON 文件的路径
const qrFilePath = path.join(process.cwd(), 'qr_codes.json');

// 2. 读取 JSON 文件
function readQRCodeData() {
  const data = fs.readFileSync(qrFilePath, 'utf8');
  return JSON.parse(data);
}

// 3. 保存更新后的数据
function saveQRCodeData(data) {
  fs.writeFileSync(qrFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// 4. 根据短链接查找目标 URL
function getTargetUrlByShortCode(shortCode) {
  const data = readQRCodeData();
  return data[shortCode] ? data[shortCode].target_url : null;
}

// 5. 更新目标 URL
function updateTargetUrl(shortCode, newUrl) {
  const data = readQRCodeData();
  if (data[shortCode]) {
    data[shortCode].target_url = newUrl;
    data[shortCode].updated_at = new Date().toISOString();
    saveQRCodeData(data);
    console.log(`更新成功！短链接 [${shortCode}] 的目标 URL 已变更为：${newUrl}`);
  } else {
    console.log(`短链接 [${shortCode}] 不存在！`);
  }
}

// -------------- 测试用 --------------
// 假设我们要把 shortCode 为 "abc123" 的目标地址改成一个新链接
const shortCode = 'abc123';
const newUrl = 'https://newexample.com';

// 调用更新函数
updateTargetUrl(shortCode, newUrl);

// 调用查询函数，看是否更新成功
const targetUrl = getTargetUrlByShortCode(shortCode);
console.log(`当前短链接 [${shortCode}] 的目标 URL: ${targetUrl}`);
