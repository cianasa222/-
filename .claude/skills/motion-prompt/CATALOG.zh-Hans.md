# Motion Prompt 动效分类目录（中文）

共 240 条，来自 https://showheyohtaki.github.io/motion-prompt/ （MIT）。用法：对 Claude 说「用 #191」或「把开场换成 #035」，它会用 motion-prompt 技能取出该条的参数和代码再移植。

## 一、动态图形（动作、文字、转场）
### 动态图形（motion，#001–#024）
**入场与文字**
- #001 弹性入场（Pop-in）：元素弹跳着出现
- #002 交错动画（Stagger）：多个元素错开时间依次出现
- #003 放射爆发（Burst）：元素出现时向外迸出线条和圆点
- #004 线条描绘（Line draw）：线条像被画出来一样逐渐延伸
- #005 遮罩显现（Mask reveal）：文字从不可见的边界后移出
- #006 打字机效果（Typewriter）：文字像打字一样逐字出现
- #007 数字递增（Count-up）：数字快速增长到目标值
- #008 动态排版（Kinetic typography）：文字随含义和节奏移动、缩放与旋转

**运动细节**
- #009 缓动（Easing）：动作通过加减速变化而非匀速移动
- #010 过冲回弹（Overshoot）：越过目标后回到目标位置并停稳
- #011 挤压与拉伸（Squash & stretch）：通过压扁和拉长表现弹性
- #012 形状变形（Shape morph）：一种形状平滑变成另一种
- #013 液态动效（Liquid motion）：形状像液体一样流动和融合
- #014 运动拖尾（Motion trail）：运动物体身后留下逐渐淡去的轨迹
- #015 粒子效果（Particles）：大量小碎片喷出并散开
- #016 视差（Parallax）：远近图层以不同速度移动形成纵深

**转场与强调**
- #017 遮罩转场（Mask transition）：扩大的形状内部显现下一场景
- #018 图形转场（Shape transition）：图形覆盖画面后揭示下一场景
- #019 液态转场（Liquid transition）：液体流入画面并替换场景
- #020 穿越缩放（Zoom through）：放大并穿过物体进入下一场景
- #021 翻转（Flip）：像卡片翻面一样展示另一侧
- #022 扫光（Light sweep）：光带扫过物体表面
- #023 故障效果（Glitch）：画面像发生故障一样错位和分色
- #024 冲击震动（Impact shake）：物体落下时带动整个画面震动

### 动态图形（第 2 弹）（motion2，#121–#144）
**动效技巧**
- #121 预备动作（Anticipation）：运动前先向反方向稍稍蓄力
- #122 跟随动作（Follow-through）：主体停下后，局部仍延迟摆动
- #123 弹跳（Bounce）：落下后越弹越低直至停下
- #124 随机抖动（Wiggle）：小幅、随机地持续晃动
- #125 脉冲动画（Pulse）：像心跳一样有节奏地缩放
- #126 运动路径（Motion path）：沿设定的曲线移动
- #127 往返循环（Ping-pong loop）：正放后倒放，反复来回
- #128 定格动画风格（Stop-motion style）：抽帧后动作一顿一顿

**文字与图形**
- #129 文字乱码效果（Text scramble）：字符随机变换后定格为正确文字
- #130 波浪文字（Wave text）：文字像波浪一样依次上下起伏
- #131 路径文字（Text on a path）：文字沿线条或曲线流动
- #132 可变字体动画（Variable font animation）：文字粗细平滑变化
- #133 文字遮罩（Text mask）：镂空成文字形状，透出内部画面
- #134 中继器（Repeater）：复制图形并排列旋转
- #135 万花筒（Kaleidoscope）：像万花筒一样对称展开
- #136 线条抖动（Line boil）：手绘线条逐帧轻微抖动

**转场与强调**
- #137 推入转场（Push transition）：下一画面把当前画面推出
- #138 百叶窗转场（Blinds transition）：从细条缝隙中打开下一画面
- #139 立方体转场（Cube transition）：像立方体旋转一样切换画面
- #140 翻页转场（Page curl）：像纸张一样卷起，翻到下一页
- #141 像素化转场（Pixelate）：马赛克逐渐变粗后切换画面
- #142 玻璃碎裂（Shatter）：像玻璃一样碎裂，碎片飞散
- #143 爆炸图（Exploded view）：零件分离，展示内部结构
- #144 分屏（Split screen）：分割画面，同时展示多个场景

## 二、镜头运动与转场
### 镜头运动与转场（camera，#025–#048）
**镜头运动**
- #025 水平摇镜头（Pan）：机位固定，向左或右转动镜头
- #026 垂直摇镜头（Tilt）：机位固定，向上或下转动镜头
- #027 推镜头（Dolly in）：相机整体向主体靠近
- #028 变焦推近（Zoom in）：相机不动，通过镜头变焦放大
- #029 跟拍（Tracking shot）：相机随主体一起移动
- #030 环绕镜头（Orbit (Arc shot)）：相机绕主体移动
- #031 升镜头（Crane up）：相机整体向上升起
- #032 滑动变焦（Dolly zoom (Vertigo)）：主体大小不变，背景发生透视变化

**拍摄方式与时间效果**
- #033 焦点转移（Rack focus）：在近处与远处之间切换对焦
- #034 手持镜头（Handheld）：像手持相机一样轻微晃动
- #035 FPV 穿越机镜头（FPV drone shot）：以第一人称快速穿越场景
- #036 荷兰角（Dutch angle）：倾斜相机，使地平线呈对角线
- #037 慢动作（Slow motion）：放慢动作的播放速度
- #038 速度渐变（Speed ramp）：在同一镜头中改变播放速度
- #039 延时摄影（Time-lapse）：把数小时压缩成几秒
- #040 定格（Freeze frame）：让动作暂停片刻

**转场**
- #041 跳切（Jump cut）：构图不变，跳过一段时间
- #042 匹配剪辑（Match cut）：利用相似形状或动作衔接镜头
- #043 甩镜头转场（Whip pan）：快速横摇形成模糊并切入下一镜头
- #044 交叉溶解（Cross dissolve）：两个镜头逐渐叠化切换
- #045 划像转场（Wipe）：移动的边界逐步替换画面
- #046 突切（Smash cut）：突然切到反差强烈的场景
- #047 J 型剪辑（J-cut）：下一场景的声音先于画面进入
- #048 L 型剪辑（L-cut）：前一场景的声音延续到下一画面

### 镜头运动与转场（第 2 弹）（camera2，#169–#192）
**镜头运动**
- #169 垂直升降镜头（Pedestal）：相机整体垂直上下平移
- #170 横滚镜头（Barrel roll）：相机绕镜头光轴旋转一整圈
- #171 移动延时（Hyperlapse）：相机边移动边拍的延时摄影
- #172 长镜头（Long take）：不切换，一个镜头连续拍到底
- #173 斯坦尼康（Steadicam）：消除抖动，平稳流畅地移动
- #174 背后跟拍（Follow shot）：跟在主体身后移动
- #175 固定镜头（Locked-off shot）：相机固定不动，只有主体移动
- #176 穿越镜头（Fly-through）：穿过窗户或门进入下一个空间

**角度与构图**
- #177 低角度镜头（Low angle）：从低处向上拍
- #178 高角度镜头（High angle）：从高处向下拍
- #179 POV 镜头（POV shot）：以角色的视线观看
- #180 过肩镜头（Over-the-shoulder）：越过一人的肩膀拍另一人
- #181 鸟瞰镜头（Bird's-eye view）：从正上方垂直向下拍
- #182 深焦镜头（Deep focus）：从近处到远处全部清晰
- #183 定场镜头（Establishing shot）：开场交代地点的远景
- #184 大特写（Extreme close-up）：只放大眼睛或指尖等局部

**转场与剪辑**
- #185 插入镜头（Insert shot）：插入同一场景中的细节
- #186 变形剪切（Morph cut）：平滑衔接相同构图的两段画面
- #187 淡出到黑场（Fade to black）：画面逐渐变暗直至全黑
- #188 圈出（Iris out）：圆形窗口收拢，画面变黑
- #189 切出镜头（Cutaway）：切到其他对象后再切回
- #190 交叉剪辑（Cross-cutting）：交替呈现同时发生的两个场景
- #191 子弹时间（Bullet time）：时间静止，相机绕主体旋转
- #192 蒙太奇（Montage）：用一连串短镜头压缩时间

## 三、光线、镜头效果与画面风格
### 摄影效果、光线与风格（photo，#097–#120）
**布光与时段**
- #097 逆光（Backlighting）：光源位于主体后方
- #098 轮廓光（Rim light）：后侧光勾勒主体边缘
- #099 剪影（Silhouette）：主体成为明亮背景前的深色轮廓
- #100 分割光（Split lighting）：侧面光让脸一半明亮、一半阴暗
- #101 伦勃朗光（Rembrandt lighting）：侧上方光在背光脸颊留下亮三角
- #102 蝴蝶光（Butterfly lighting）：正面高位光在鼻下形成蝶形阴影
- #103 黄金时刻（Golden hour）：日出后或日落前的低角度暖光
- #104 蓝调时刻（Blue hour）：日落后或日出前的深蓝天空时段

**镜头与相机效果**
- #105 散景（Bokeh）：失焦光点化为柔和光斑
- #106 移轴效果（Tilt-shift）：通过选择性模糊让实景像微缩模型
- #107 长曝光（Long exposure）：延长快门时间，让移动光源留下轨迹
- #108 追随拍摄（Panning shot）：跟随运动主体，使背景产生拖影
- #109 镜头眩光（Lens flare）：强光在镜头内产生光环和光斑
- #110 鱼眼镜头（Fisheye lens）：超广角使中心鼓起、直线弯曲
- #111 色差（Chromatic aberration）：高反差边缘出现不同颜色的色边
- #112 暗角（Vignette）：画面四角变暗，视线集中到中央

**色调与后期风格**
- #113 高调（High-key）：整体明亮、接近白色且阴影很浅
- #114 低调（Low-key）：以暗色为主，只突出受光部分
- #115 黑白（Black and white）：去除颜色，仅保留明暗
- #116 双色调（Duotone）：用一种颜色映射暗部，另一种映射亮部
- #117 青橙色调（Teal and orange）：阴影偏青，肤色与高光偏橙
- #118 胶片颗粒（Film grain）：画面覆盖细微胶片质感颗粒
- #119 漏光（Light leak）：红橙色光像漏入胶片一样侵入画面
- #120 双重曝光（Double exposure）：两幅影像叠合在同一画面

## 四、网页与界面动效
### UI 组件（ui，#049–#072）
**浮层与展开**
- #049 模态对话框（Modal dialog）：打开浮窗并暂时阻止操作背景
- #050 抽屉面板（Drawer (Off-canvas)）：从屏幕侧边滑出的面板
- #051 底部面板（Bottom sheet）：从屏幕底部升起的面板
- #052 折叠面板（Accordion）：点击标题展开或收起内容
- #053 下拉选择框（Dropdown (select)）：点击字段展开选项列表
- #054 文字提示（Tooltip）：悬停时显示简短说明
- #055 气泡卡片（Popover）：点击后显示指向触发按钮的小面板
- #056 轻提示（Toast notification）：短消息出现后自动消失

**切换与输入**
- #057 标签页（Tabs）：点击标签切换内容面板
- #058 轮播图（Carousel）：横向滑动切换展示项
- #059 开关（Toggle switch）：切换设置的开启与关闭状态
- #060 分段控制器（Segmented control）：一排相连按钮用于切换视图
- #061 筛选标签（Filter chips）：点击小标签组合筛选条件
- #062 范围滑块（Range slider）：双滑块选择最小值与最大值
- #063 步进器（Stepper (+/−)）：通过加减按钮逐次修改数值
- #064 分页（Pagination）：通过页码切换列表页面

**导航与状态反馈**
- #065 汉堡菜单（Hamburger menu）：三横线图标点击后展开菜单
- #066 面包屑导航（Breadcrumbs）：显示页面层级位置的链接路径
- #067 巨型菜单（Mega menu）：主导航展开的宽幅分组链接面板
- #068 步骤指示器（Step indicator）：显示流程的当前步骤与进度
- #069 骨架屏（Skeleton screen）：加载时以灰色块预示内容布局
- #070 加载转圈（Spinner）：旋转圆环表示等待
- #071 徽标（Badge）：用小圆点或数字显示数量
- #072 空状态（Empty state）：列表没有内容时显示的界面

### 落地页与网页效果（lp，#073–#096）
**滚动效果**
- #073 视差滚动（Parallax scrolling）：滚动时背景层比内容移动得慢
- #074 滚动淡入（Fade-in on scroll）：元素进入视口时逐渐出现
- #075 吸顶页头（Sticky header）：滚动时页头停留在屏幕顶部
- #076 滚动固定（Pinning）：区块固定，滚动推动内部内容变化
- #077 横向滚动（Horizontal scroll）：纵向滚动驱动内容横移
- #078 滚动吸附（Scroll snap）：滚动结束时自动对齐区块
- #079 滚动进度条（Scroll progress bar）：顶部条显示阅读进度
- #080 荧光笔标记动画（Highlighter animation）：重点文字下方逐渐画出色带

**悬停与点击交互**
- #081 悬停抬升（Hover lift）：悬停时元素抬高并加深阴影
- #082 悬停图片放大（Image zoom on hover）：图片在固定边框内放大
- #083 光标跟随（Cursor follower）：图形略带延迟地跟随指针
- #084 磁吸按钮（Magnetic button）：按钮向附近光标偏移
- #085 涟漪效果（Ripple effect）：从点击位置扩散的圆形波纹
- #086 下划线动画（Underline animation）：悬停时链接下划线从左展开
- #087 前后对比滑块（Before/after slider）：拖动分隔线比较处理前后
- #088 离站挽留弹窗（Exit-intent popup）：访客准备离开时出现的弹窗

**加载、导航与循环动效**
- #089 预加载画面（Preloader）：页面加载期间显示的过渡界面
- #090 懒加载（Lazy loading）：图片接近视口时才开始加载
- #091 无限滚动（Infinite scroll）：滚动到底部时自动加载更多条目
- #092 页面转场（Page transition）：连接两个页面的过渡动画
- #093 平滑滚动（Smooth scroll）：页内链接平滑移动到目标位置
- #094 跑马灯（Marquee）：文字或标志组成连续滚动带
- #095 动态渐变（Animated gradient）：背景颜色持续移动和交融
- #096 悬浮动画（Floating animation）：元素轻柔地上下浮动

### 落地页与网页效果（第 2 弹）（lp2，#145–#168）
**滚动效果**
- #145 滚动时间轴（Timeline on scroll）：滚动时时间轴的线条随之延伸
- #146 滚动文字显现（Scroll text reveal）：随着阅读，文字逐字变深
- #147 堆叠卡片（Stacking cards）：滚动时卡片层层叠起
- #148 滚动切换背景色（Background color change on scroll）：按区块切换页面背景色
- #149 滚动隐藏页头（Hide-on-scroll header）：向下滚动时隐藏，向上滚动时出现
- #150 滚动监听（Scrollspy）：目录高亮当前阅读的章节
- #151 回到顶部按钮（Back-to-top button）：往下滚动后出现，点击回到顶部
- #152 滚动放大（Zoom on scroll）：图片随滚动放大至铺满屏幕

**鼠标与输入交互**
- #153 3D 倾斜（3D tilt on hover）：卡片随光标方向立体倾斜
- #154 聚光灯悬停（Spotlight hover）：只有光标周围变亮
- #155 悬停切换图片（Image swap on hover）：悬停时换成另一张照片
- #156 悬停文字翻滚（Text roll on hover）：文字向上翻转并替换
- #157 悬停图片预览（Hover image reveal）：悬停列表项时显示对应照片
- #158 浮动标签（Floating label）：开始输入时标签上移
- #159 实时校验（Inline validation）：输入时即时显示对错
- #160 加载按钮（Loading button）：点击后在按钮内显示加载中到完成

**亮点展示**
- #161 视图过渡（View transition (shared element)）：列表中的照片直接展开为详情页
- #162 灯箱（Lightbox）：点击图片后在变暗的背景上放大
- #163 图片热点（Hotspots）：点击图片上的圆点显示说明
- #164 倒计时（Countdown timer）：显示距截止时间的剩余时间并递减
- #165 动态形状分隔线（Animated shape divider）：持续摆动的波浪形区块分隔线
- #166 点赞动画（Like button animation）：点击后爱心迸发弹出
- #167 向下滚动提示（Scroll-down cue）：持续循环、引导向下滚动的动画
- #168 背景视频（Background video）：首屏背景中播放视频

## 五、图像生成画风
### 图像生成常用的画风名称（artstyle，#193–#216）
**绘画与版画**
- #193 水彩画（Watercolor）：颜色晕染、留出纸白的淡雅画
- #194 厚涂油画（Impasto oil painting）：颜料堆厚，笔触清晰可见
- #195 水墨画（Ink wash painting (sumi-e)）：只用墨色浓淡与晕染来画
- #196 浮世绘木版画（Ukiyo-e woodblock print）：轮廓线加平涂色块的木版画
- #197 点彩画（Pointillism）：用一个个小色点排列成画
- #198 彩色铅笔画（Colored pencil drawing）：细笔触层层叠加，可见纸纹
- #199 麻胶版画（Linocut print）：刻版印出的粗黑白线条
- #200 彩绘玻璃（Stained glass）：黑色铅条分隔的透光彩色玻璃

**平面设计风格**
- #201 波普艺术（Pop art）：原色色块、粗黑轮廓加少量网点
- #202 霓虹灯招牌（Neon sign）：在暗墙上用发光灯管勾出形状
- #203 装饰艺术（Art Deco）（Art Deco）：金与黑、放射直线与左右对称
- #204 新艺术运动（Art Nouveau）（Art Nouveau）：以花草曲线勾边的装饰风格
- #205 Risograph 孔版印刷（Risograph print）：两三种油墨略微错位叠印
- #206 层叠纸雕（Layered paper art）：彩纸剪开层层叠放，靠阴影做出纵深
- #207 扁平插画（Flat illustration）：只有平涂色块，没有线条和阴影
- #208 线稿（Line art）：只用单色线条，不上色

**数字、立体与材质**
- #209 像素画（Pixel art）：用方格像素画出的游戏风
- #210 体素艺术（Voxel art）：用小立方体堆成的3D
- #211 低多边形（Low poly）（Low poly）：用三角面拼成的3D
- #212 纸模型（Papercraft）：纸张折叠粘贴组成的立体模型
- #213 黏土动画风（Clay animation style）：用黏土捏成、留着指纹的立体造型
- #214 刺绣（Embroidery）：用彩线在布上绣出图案
- #215 合成器浪潮（Synthwave）（Synthwave）：80年代风的霓虹网格与条纹夕阳
- #216 蓝图（Blueprint）：蓝底白线的设计图

## 六、图解与图表
### 资料中常用的图解与图表名称（diagram，#217–#240）
**整理思路的图**
- #217 维恩图（Venn diagram）：用重叠的圆表示共同点
- #218 四象限矩阵（2×2）（2x2 matrix）：用纵横两条轴分成四块
- #219 逻辑树（Logic tree (issue tree)）：把一个问题按分支拆解
- #220 金字塔图（Pyramid diagram）：由下往上叠起的层级
- #221 思维导图（Mind map）：从中心向四周发散联想
- #222 流程图（Flowchart）：用菱形分支一步步走完流程
- #223 循环图（Cycle diagram）：箭头连成一圈，循环往复
- #224 鱼骨图（Fishbone diagram）：以鱼骨的形状列出原因

**展示数字的图表**
- #225 散点图（Scatter plot）：用点的分布看两个数字的关系
- #226 气泡图（Bubble chart）：用圆的大小表示第三个数字
- #227 热力图（Heatmap）：用颜色深浅填充表格的格子
- #228 雷达图（Radar chart）：用蛛网的形状比较多个项目
- #229 仪表图（Gauge chart）：用半圆表盘和指针显示达成率
- #230 组合图（柱形图＋折线图）（Combo chart (bar + line)）：柱形和折线叠在一张图里（左右两个刻度）
- #231 象形图（图标阵列）（Pictogram chart (icon array)）：用人或物的图标数量表示比例
- #232 百分比堆积条形图（100% stacked bar chart）：把条按比例分段，比较构成

**展示流程与全局的图**
- #233 甘特图（Gantt chart）：在日期刻度上用横条排出工作期间
- #234 时间轴（Timeline）：在一条线上按时间顺序排列事件
- #235 漏斗图（Funnel chart）：人数逐级减少的漏斗
- #236 客户旅程地图（Customer journey map）：并列各阶段的行为和心情起伏
- #237 矩形树图（Treemap）：用方块大小表示整体的构成
- #238 泳道图（Swimlane diagram）：按负责人分泳道排列步骤
- #239 V 形流程图（Chevron process）：横向排列箭头形状的步骤
- #240 同心圆图（Concentric circle diagram）：用嵌套的圆逐层缩小市场范围

