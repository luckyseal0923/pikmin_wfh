# 萬芳健康探索隊

萬芳醫院周邊走路探索 PWA prototype。

## 目前版本

- Google Maps 真實底圖
- 淺藍色地圖風格
- 小怪物任務點
- iPhone Safari/PWA 版面
- GPS 定位與持續追蹤
- 使用者小隊長 marker
- 移動路徑線
- GPS 距離估算步數
- 靠近任務點才可完成任務
- 任務完成紀錄存在瀏覽器本機
- 可選 Supabase 後端同步狀態

## Google Maps API key

目前部署版已內建一組前端 Google Maps JavaScript API key，方便 iPhone 直接開啟測試。這把 key 應限制在 GitHub Pages 網址與 Maps JavaScript API 使用。

## Supabase 後端

Supabase 設定方式：

[SUPABASE_SETUP.md](SUPABASE_SETUP.md)

尚未設定時，遊戲會使用瀏覽器本機保存；設定完成後會顯示「雲端同步」。

## 本機開啟

直接打開：

```text
index.html
```

本機桌機定位通常不準。iPhone 實測請部署到 HTTPS 網址。

## iPhone 測試

詳見：

[PWA_TESTING.md](PWA_TESTING.md)

## 部署

詳見：

[DEPLOYMENT.md](DEPLOYMENT.md)

## 手機原生 App

Flutter prototype 草稿放在：

```text
mobile_app/
```

目前 Windows 上尚未安裝 Flutter SDK，且 iOS build 需要 macOS + Xcode。
