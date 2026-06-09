# iPhone PWA 測試方式

目前網頁版已整理成 iPhone 可用的 PWA prototype。

## 已支援

- iPhone Safari 全螢幕版面
- Google Maps 真實底圖
- GPS 定位
- 持續追蹤
- 使用者小隊長 marker
- 移動路徑線
- GPS 距離估算步數
- 靠近任務點才可完成任務
- 加到主畫面用的 manifest / icon / service worker

## 重要限制

iPhone 不能直接打開 Windows 上的 `file:///C:/.../index.html`。

要在 iPhone 實測 GPS，建議用 HTTPS 網址開啟，因為定位與 PWA 安裝通常需要安全來源。

可行方式：

1. 部署到 GitHub Pages / Netlify / Vercel
2. 用 Cloudflare Tunnel / ngrok 產生 HTTPS 測試網址
3. 之後改成正式網域

## iPhone 操作

1. 用 Safari 開啟 HTTPS 網址
2. 貼上 Google Maps API key 並載入地圖
3. 允許定位權限
4. 按「持續追蹤」
5. 開始走路測試角色移動、步數估算、任務觸發
6. 要像 App 一樣使用：Safari 分享按鈕 -> 加入主畫面

## Google Maps API

網頁 PWA 需要啟用：

- Maps JavaScript API

正式公開測試時，建議限制 API key：

- Application restriction: HTTP referrers
- API restriction: Maps JavaScript API

範例 referrer：

```text
https://你的網域/*
```

## 注意

這版的步數是用 GPS 移動距離估算，不是 Apple HealthKit 真實步數。要讀 HealthKit，需要原生 iOS App，也就是之後用 Mac / Xcode / Flutter iOS build。
