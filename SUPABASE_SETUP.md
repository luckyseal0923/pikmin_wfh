# Supabase 設定

這個 prototype 會用 Supabase 儲存：

- 已完成任務：`completed_quest_ids`
- GPS 估算距離：`walked_meters`

如果 Supabase 尚未設定，遊戲會自動退回瀏覽器本機 `localStorage`，不會壞掉。

## 1. 建立 Supabase project

到 Supabase 建立新 project：

```text
https://supabase.com/
```

## 2. 啟用 Anonymous sign-ins

到：

```text
Authentication -> Sign In / Providers -> Anonymous
```

啟用 anonymous sign-ins。

這樣每台手機第一次打開時會自動建立一個匿名使用者，不需要登入表單。

## 3. 建立資料表與 RLS

到：

```text
SQL Editor
```

貼上並執行：

```text
supabase/schema.sql
```

這份 schema 會建立 `player_states`，並用 Row Level Security 限制每個匿名使用者只能讀寫自己的狀態。

## 4. 填入公開 anon key

到：

```text
Project Settings -> API
```

複製：

- Project URL
- anon public key / publishable key

填入：

```js
// supabase-config.js
window.WANFANG_SUPABASE = {
  enabled: true,
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_ANON_OR_PUBLISHABLE_KEY"
};
```

注意：不要把 `service_role` key 放進前端。

## 5. 推送部署

修改 `supabase-config.js` 後：

```powershell
git add supabase-config.js supabase/schema.sql SUPABASE_SETUP.md
git commit -m "Configure Supabase backend state sync"
git push
```

GitHub Pages 部署完成後，畫面左上角狀態會從「本機保存」變成「雲端同步」。
