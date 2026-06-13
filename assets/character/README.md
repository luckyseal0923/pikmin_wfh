# 3D 護理角色素材

- `nurse-3d-concept.png`: 3D 角色外觀概念圖。
- `nurse-3d-turnaround.png`: 正面、側面、背面建模參考。
- `nurse-map-avatar.png`: 透明背景單人地圖角色。
- `nurse-walk-cycle.png`: 透明背景八格走路姿勢。
- `nurse-walk-cycle.webp`: 地圖實際使用的循環動畫。
- `nurse-walking.glb`: Meshy Walking 骨架動畫模型，地圖目前優先使用此檔。

目前 Google Maps 玩家標記優先使用 `nurse-walking.glb`；WebGL 或模型載入失敗時，回退到 `nurse-walk-cycle.webp`。
