import express from 'express';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const qrFilePath = path.join(process.cwd(), 'qr_codes.json');

// 读取 JSON 数据文件，如果文件不存在则返回空对象
function readQRCodeData() {
  try {
    const data = fs.readFileSync(qrFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// 将数据写入 JSON 文件
function saveQRCodeData(data) {
  fs.writeFileSync(qrFilePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 创建短链接，并生成对应的二维码 Data URL
 * 请求体示例: { "targetUrl": "https://example.com/your_target_page" }
 */
app.post('/create-short-url', (req, res) => {
  const { targetUrl } = req.body;
  if (!targetUrl) {
    return res.status(400).json({ error: '目标 不能为空' });
  }

  // 生成一个 6 位短码，并构造短链接
  const shortCode = nanoid(6);  //使用 nanoid 生成随机短码
  const shortUrl = `https://yimayun.com/${shortCode}`; // 假设部署在yimayun.com域名下

  // 记录保存：包括目标 URL、点击次数、创建和更新时间
  const data = readQRCodeData();
  data[shortCode] = {
    target_url: targetUrl,
    clicks: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  saveQRCodeData(data);

  // 使用 qrcode 库生成二维码 Data URL，配置可调整（例如错误校正、尺寸等）
  QRCode.toDataURL(shortUrl, { errorCorrectionLevel: 'H', width: 300, margin: 2 }, (err, qrCodeDataUrl) => {
    if (err) {
      console.error('生成二维码失败:', err);
      return res.status(500).json({ error: '生成二维码失败' });
    }
    res.json({
      shortUrl,
      qrCodeDataUrl
    });
  });
});

/**
 * 处理短链接跳转请求
 * 访问示例: https://newexample.com/yimayun 将跳转到目标地址
 */
app.get('/qrcode/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const data = readQRCodeData();
  const record = data[shortCode];
  if (record && record.target_url) {
    // 更新点击次数
    record.clicks = (record.clicks || 0) + 1;
    record.updated_at = new Date().toISOString();
    saveQRCodeData(data);
    res.redirect(302, record.target_url);
  } else {
    res.status(404).send('短链接不存在或已失效');
  }
});

/**
 * 更新目标 URL 接口
 * 请求体示例: { "shortCode": "yimayun", "newUrl": "https://newexample.com" }
 */
app.post('/update-url', (req, res) => {
  const { shortCode, newUrl } = req.body;
  if (!shortCode || !newUrl) {
    return res.status(400).json({ error: 'shortCode 和 newUrl 不能为空' });
  }
  const data = readQRCodeData();
  if (!data[shortCode]) {
    return res.status(404).json({ error: '短链接不存在' });
  }
  data[shortCode].target_url = newUrl;
  data[shortCode].updated_at = new Date().toISOString();
  saveQRCodeData(data);
  res.json({ success: true, message: `短链接 [${shortCode}] 的目标地址已更新为：${newUrl}` });
});

/**
 * 获取短链接统计信息接口
 * 访问示例: GET /stats/abc123
 */
app.get('/stats/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const data = readQRCodeData();
  if (!data[shortCode]) {
    return res.status(404).json({ error: '短链接不存在' });
  }
  res.json({
    shortCode,
    targetUrl: data[shortCode].target_url,
    clicks: data[shortCode].clicks,
    created_at: data[shortCode].created_at,
    updated_at: data[shortCode].updated_at
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动，监听端口：${PORT}`);
});
