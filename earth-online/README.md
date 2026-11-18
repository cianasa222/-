# 退出地球 Online — 竖屏短视频（720×1280 · 60fps · 17.7s）

配乐：用户提供的「当我退出地球online」片段（MP3 原流直接封装，不重新编码）。

## 结构
- `game.js` — 前半段 2D：暖色纸张上的游戏界面（角色卡 → 地图 → 任务 → 背包），CSS 相机甩镜 + 动态模糊，彩色景深光斑视差，手指点按，物品爆成像素。
- `sea.js` — 后半段 3D（three.js）：可反射的海面、手调粉彩天空（白天蓝→傍晚薰衣草/粉/橙）、沙滩、栈桥、灯塔、海鸥，景深 + 辉光 + 光束 + 调色。
- `earth.html` — 把两层叠在一起；逐字卡点字幕（关键词落在鼓点上）、"多年以后"、退出弹窗、"感谢游玩"。
- `common.js` — 节拍表（librosa）与像素小人；`mascot3d.js` — 软陶小人。

## 渲染
需要 `three@0.160` 和 `@fontsource/noto-serif-sc` 放在 `node_modules/`，以及 Playwright。

```
VW=720 VH=1280 node render.js earth.html frames range 0 17.71 60
ffmpeg -framerate 60 -i frames/f_%05d.png -i song.mp3 -map 0:v -map 1:a -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -c:a copy -shortest -movflags +faststart out.mp4
```
有核显的 Windows 电脑：加 `RENDER_BROWSER=msedge` 用 GPU 渲染。
