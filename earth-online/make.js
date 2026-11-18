// 一键出片：node make.js            （本地电脑：先 npm install）
//   QUALITY=draft  → 720p、无运动模糊，最快预览
//   QUALITY=high   → 默认：2 倍超采样 + 每帧 4 个子帧运动模糊，输出 1080×1920 60fps
//   QUALITY=ultra  → 2 倍超采样 + 8 个子帧
// Windows 有核显时加速：set RENDER_BROWSER=msedge   （PowerShell： $env:RENDER_BROWSER="msedge"）
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path');
const Q = process.argv[2] || process.env.QUALITY || 'high';
const preset = { draft: { DPR: 1, SUB: 1, W: 720, H: 1280 }, high: { DPR: 2, SUB: 4, W: 1080, H: 1920 }, ultra: { DPR: 2, SUB: 8, W: 1080, H: 1920 } }[Q];
const ff = process.env.FFMPEG || (() => { try { return require('ffmpeg-static'); } catch { return 'ffmpeg'; } })();
const dir = path.join(__dirname, `frames_${Q}`), FPS = 60, DUR = +(process.env.DUR || 17.71);
const audio = ['song.mp3', 'song.wav'].map(f => path.join(__dirname, f)).find(f => fs.existsSync(f));
if (!audio) { console.error('把歌曲放到本文件夹，命名为 song.mp3'); process.exit(1); }
console.log(`质量 ${Q}：超采样 ${preset.DPR}x，运动模糊子帧 ${preset.SUB}，输出 ${preset.W}×${preset.H} ${FPS}fps`);
execFileSync(process.execPath, [path.join(__dirname, 'render.js'), 'earth.html', dir, 'range', '0', String(DUR), String(FPS)],
  { stdio: 'inherit', env: { ...process.env, VW: '720', VH: '1280', DPR: String(preset.DPR), SUB: String(preset.SUB), SHUTTER: '0.5' } });
const S = preset.SUB, vf = [S > 1 ? `tmix=frames=${S}:weights='${Array(S).fill(1).join(' ')}',select='eq(mod(n\\,${S})\\,${S - 1})'` : null,
  `setpts=N/${FPS}/TB`, `scale=${preset.W}:${preset.H}:flags=lanczos`, 'noise=c0s=2:c0f=t', 'format=yuv420p'].filter(Boolean).join(',');
const out = path.join(__dirname, `退出地球Online_${preset.W}x${preset.H}_60fps.mp4`);
const acodec = audio.endsWith('.mp3') ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-b:a', '320k'];   // MP3 原流直接封装，音质零损失
execFileSync(ff, ['-y', '-framerate', String(FPS * S), '-i', path.join(dir, 'f_%06d.png'), '-i', audio, '-map', '0:v', '-map', '1:a', '-vf', vf, '-r', String(FPS),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-profile:v', 'high', '-tune', 'animation', ...acodec, '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log('\n完成 →', out);
