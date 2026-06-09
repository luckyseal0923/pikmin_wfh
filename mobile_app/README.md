# 萬芳健康探索隊 Flutter Prototype

這是手機 App 版 prototype，目標是先做到：

- Google Maps 地圖
- GPS 定位
- 使用者角色在地圖上移動
- 萬芳醫院周邊任務點
- 靠近任務點觸發
- 用 GPS 移動距離估算步數
- 完成任務並保留紀錄

## 目前環境狀態

這台電腦目前沒有安裝 Flutter SDK，所以我先建立可搬到 Flutter 環境執行的專案檔。

## 建立正式 Flutter 專案

安裝 Flutter SDK 後，在這個資料夾執行：

```powershell
cd C:\Users\ASUS\Documents\萬芳皮克敏\mobile_app
.\setup_flutter_project.ps1
```

或手動執行：

```powershell
cd C:\Users\ASUS\Documents\萬芳皮克敏\mobile_app
flutter create . --platforms android,ios
flutter pub get
```

如果 `flutter create .` 問你是否覆蓋 `lib/main.dart` 或 `pubspec.yaml`，請選不要覆蓋，或先備份這兩個檔案。

## Google Maps API key

Android：

把 `android/app/src/main/res/values/strings.xml` 裡的：

```xml
YOUR_GOOGLE_MAPS_API_KEY
```

換成你的 Google Maps API key。

需要啟用：

- Maps SDK for Android

如果要做地點搜尋或路線，之後再加：

- Places API
- Routes API

## Android 權限

已準備：

- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`

第一版不做背景定位，先避免隱私與耗電問題。

## 執行

```powershell
flutter run
```

建議用 Android 手機實測，GPS 才會比桌機瀏覽器準。
