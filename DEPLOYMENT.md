# 部署到 iPhone 可測試的 HTTPS 網址

這個 prototype 是靜態 PWA，可以部署到 GitHub Pages、Netlify 或 Vercel。iPhone Safari 建議使用 HTTPS 網址測試定位與加入主畫面。

## 推薦方式：GitHub Pages

1. 建立一個 GitHub repository，例如 `wanfang-health-explorer`。
2. 在本機專案資料夾加入 remote：

```powershell
cd C:\Users\ASUS\Documents\萬芳皮克敏
git init
git add .
git commit -m "Create Wanfang health explorer PWA prototype"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/wanfang-health-explorer.git
git push -u origin main
```

3. 到 GitHub repository：

```text
Settings -> Pages -> Build and deployment
Source: GitHub Actions
```

4. 等 Actions 跑完，GitHub 會給你一個 HTTPS 網址，通常像：

```text
https://YOUR_ACCOUNT.github.io/wanfang-health-explorer/
```

5. 用 iPhone Safari 打開該網址測試。

## 另一個簡單方式：Netlify

1. 登入 Netlify。
2. 選擇 Add new site。
3. 可直接拖曳整個資料夾，或連接 GitHub repository。
4. Build command 留空。
5. Publish directory 使用：

```text
.
```

Netlify 會產生 HTTPS 網址，可直接用 iPhone Safari 開啟。

## Google Maps API key 限制

部署後，請到 Google Cloud Console 限制 API key：

```text
Application restrictions: HTTP referrers
API restrictions: Maps JavaScript API
```

如果網址是 GitHub Pages：

```text
https://YOUR_ACCOUNT.github.io/wanfang-health-explorer/*
```

如果網址是 Netlify：

```text
https://YOUR_SITE.netlify.app/*
```

## iPhone 測試

1. 用 Safari 開 HTTPS 網址。
2. 貼上 Google Maps API key。
3. 按「載入」。
4. 允許定位。
5. 按「持續追蹤」。
6. 開始走路，觀察角色、路徑線、步數估算、任務距離。
7. 分享 -> 加入主畫面。

## 目前技術限制

- 步數是用 GPS 移動距離估算，不是 HealthKit 真實步數。
- iOS Safari 不適合長時間背景追蹤，請保持畫面開啟測試。
- 真正接 Apple HealthKit 需要原生 iOS App，也就是 Mac + Xcode + Flutter/iOS 環境。
