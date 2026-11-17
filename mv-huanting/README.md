# 幻听 MV（代码渲染）

30.6 秒、1280×720、60 帧。3D 夜晚回忆之河 + 2D 播放器界面，像素块翻转转场。

## 文件
- `mv.html`：总控页面（3D 歌词、2D 层、方块翻转转场、闪光、淡出）
- `world.js`：3D 场景（three.js）：歌河、回忆方块、两个小人、脚印、粒子、镜头
- `desk.js`：2D 场景：播放器界面、像素小人、粉色脚印、歌单、像素流
- `timeline.js`：节拍、逐字歌词时间、歌词配色
- `render.js`：用 Playwright 逐帧截图（可断点续渲）
- `analysis.json` / `lyrics_timing.json`：歌曲节拍与歌词时间分析结果

## 渲染
```
npm i
ln -s node_modules/three three
node render.js mv.html frames range 0 30.6 60
ffmpeg -framerate 60 -i frames/f_%05d.png -i song.mp3 -t 30.6 \
  -c:v libx264 -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart mv.mp4
```
需要 Node 20+、Playwright（Chromium）、ffmpeg 7+。`song.mp3` 为歌曲音频（未放入仓库）。
