# 2026—2027 青砺公益 · 青岛工作站 概览

纯静态单页站点：34 位成员、城市分布（家乡 / 就学城市两种口径，含山东省地图）、成员卡片与自我介绍弹窗、故事入口。
数据整理自《2026-2027 青砺公益 · 青岛工作站 人员信息表》与各位成员的自我介绍。

## 本地预览

双击 `index.html` 即可，无需服务器、无需联网。

也可以直接带参数打开：

- `index.html?mode=univ` —— 城市分布默认停在「就学城市」
- `index.html?open=2` 或 `?open=蒋汶伶` —— 直接打开某位成员的详情
- `index.html?panel=威海` —— 地图上直接展开某个城市的院校构成

## 部署（GitHub Pages）

这个文件夹已经是一个 git 仓库（分支 `main`，remote 指向 `jiangwenling006/youthpowerqd`）。
用 GitHub Desktop：**File → Add local repository** 选中本文件夹 → 点 **Push origin** → 到仓库 Settings → Pages 里选 `main` / `/ (root)` 保存。

也可以直接把本目录所有文件拖进 GitHub 网页的 **uploading an existing file**。

发布后地址：`https://jiangwenling006.github.io/youthpowerqd/`

> `.nojekyll` 是给 GitHub Pages 用的，别删。

## 目录

```
├─ index.html      页面结构
├─ styles.css      样式（米白 + 朱红，衬线数字）
├─ app.js          交互：城市统计、地图、筛选、搜索、详情弹窗
├─ data.js         成员数据（唯一需要改的文件）
├─ map-data.js     山东省 16 地市边界（已投影 / 抽稀的 SVG path）
├─ .nojekyll       GitHub Pages 跳过 Jekyll
└─ assets/
   ├─ photos/      25 位成员照片（长边压到 1000px）
   └─ brand/       标识：logo-mark.png（透明底）+ favicon 系列 + 两张横版 logo
```

## 新增 / 待补成员

`data.js` 里 `window.SITE_DATA.members` 一位成员一个对象：

```js
{
  "no": 35,
  "name": "张三",
  "type": "新成员",
  "dept": "项目部",
  "role": "部员",
  "city": "青岛",
  "province": "山东",
  "univCityN": "威海",
  "school": "哈尔滨工业大学（威海）",
  "major": "信息管理与信息系统",
  "degree": "专/本科生",
  "year": 2026,
  "photo": "assets/photos/zhangsan.jpg",
  "keywords": ["关键词一", "关键词二", "关键词三"],
  "intro": ["第一段自我介绍", "第二段自我介绍"]
}
```

- `dept` 只能是：`执行长团队` / `项目部` / `运营部` / `公共关系部（外联方向）` / `公共关系部（宣传方向）`
- `photo` 为空 → 卡片显示「待补」；`intro` 为空 → 按钮变「敬请期待」
- 照片放 `assets/photos/`，文件名用拼音（避免中文和空格）
- **所有统计都是运行时算的**：成员数、部门人数、家乡条形图、就学城市地图上的数字、院校分布，都会自动跟着变，不需要改代码

## 说明

- 站点不含手机号、邮箱、微信号、生日等隐私字段；`data.js` 公开可下载也读不到。
- 城市区块只展示「城市 / 院校 + 人数」的汇总，不显示谁在哪所学校；成员卡片里的院校信息来自本人自我介绍。
- 字体用系统字体（苹方 / 微软雅黑 / 宋体），不依赖外部 CDN，离线可用。
- 已适配 1440 / 1024 / 600 / 390 宽度；开启「减少动态效果」时直接显示终值，不做动画。
- 地图边界数据来自 geo.datav.aliyun.com 的山东省地市边界，已做等距投影与抽稀，仅作示意，不作测绘用途。
