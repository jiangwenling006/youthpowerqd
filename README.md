# 2026—2027 青砺公益 · 青岛工作站 概览

纯静态单页站点：35 位成员、城市分布动画、成员卡片与自我介绍弹窗、故事入口。
数据整理自《2026-2027 青砺公益 · 青岛工作站 人员信息表》与成员自我介绍文档。

## 本地预览

双击 `index.html` 即可，无需服务器、无需联网。

## 部署

- **Netlify Drop**：把整个文件夹（或打包好的 zip）拖到 <https://app.netlify.com/drop>，立刻得到公开链接。
- **GitHub Pages**：新建 Public 仓库 → 上传本目录全部文件（`index.html` 与 `assets/` 要在仓库根目录）→ Settings → Pages → main / root → 保存。
- 目录里的 `.nojekyll` 是给 GitHub Pages 用的，别删。

## 目录

```
├─ index.html      页面结构
├─ styles.css      样式（米白 + 朱红，数字用衬线体）
├─ app.js          交互：城市统计动画、部门/类型筛选、搜索、详情弹窗
├─ data.js         成员数据（唯一需要改的文件）
├─ .nojekyll       GitHub Pages 跳过 Jekyll
└─ assets/
   ├─ photos/      22 位成员照片（已压缩到 1000px 长边）
   └─ brand/       品牌标识：mark.png / logo-qingdao.png / logo-youth.png
```

## 新增 / 待补成员

`data.js` 里 `window.SITE_DATA.members` 是一位成员一个对象，照下面结构追加即可：

```js
{
  "no": 36,
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
- `photo` 为空字符串 `""` → 卡片显示「待补」占位；`intro` 为 `[]` → 按钮变「敬请期待」
- 照片放 `assets/photos/`，文件名用拼音，避免中文与空格
- 城市统计、部门人数、筛选计数都会自动更新，不需要改 `app.js` / `index.html`

## 说明

- 站点不含手机号、邮箱、微信号、生日等隐私字段；`data.js` 公开可下载也读不到这些信息。
- 字体全部使用系统字体（苹方 / 微软雅黑 / 宋体），不依赖外部 CDN，离线可用。
- 支持 `?open=2`（成员编号）或 `?open=姓名` 直接打开某人详情，方便单独发链接。
- 已适配 1440 / 1024 / 600 / 390 宽度；开启「减少动态效果」时不做动画，直接显示终值。
