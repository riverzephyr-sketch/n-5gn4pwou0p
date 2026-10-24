/* =========================================================
 *  1461 DAYS WITH YOU — 内容文件（只需要改这里）
 *  - 文字：直接改引号里的内容
 *  - 照片：把图片放进 photos/ 文件夹，然后把 photo: null
 *          改成 photo: "photos/文件名.jpg"
 *  - 写着「待填写」的地方：页面上默认直接隐藏（照片位显示为素色空相框）
 *    想预览哪些还没填，把下面的 showTodo 改成 true
 *  - 改完文字如果出现了新的汉字，运行一次 tools/subset_fonts.py 重新裁剪字体
 *    （不运行也能正常显示，只是新字会用手机自带的宋体）
 * ========================================================= */
window.CONTENT = {
  showTodo: false,            // true = 显示「待填写」标记，方便自己检查
  // 在一起的时间（北京时间）
  startDate: "2022-10-30T00:00:00+08:00",
  him: "夏天",

  hero: {
    title: "1461 DAYS WITH YOU",
    subtitle: "You’ve been my favorite place since 2022.",
    print: "photos/sunset-sit.webp",   // 吊牌后面那张照片
    vol: "Vol. 04",
    canister: ["35MM · 4 YEARS", "1461"], // 胶卷盒上的字
  },

  // 标题排版：中文 + 英文（每个数组一项 = 一行）
  titles: {
    jianghu:  { cn: ["从江湖", "到人间"], en: ["to the world"] },
    hero:     { cn: ["一千四百", "六十一天"], en: ["Days", "with you"] },
    hotel:    { cn: ["万豪", "事件"], en: ["The Marriott", "incident"] },
    chapters: { cn: ["四卷", "胶片"], en: ["Four", "rolls"] },
    map:      { cn: ["我们走过的", "地方"], en: ["The places", "we became us"] },
    finale:   { cn: ["下一章"], en: ["Next", "chapter"] },
    secret:   { cn: ["下一章"], en: ["Next", "chapter"] },
    polaris:  { cn: ["北极星"], en: [] },   // 只留中文
  },

  // 序章：江湖（网游 CP 奔现）
  jianghu: {
    game: "天涯明月刀手游",
    guild: "晚来天欲雪",
    him: "保护我方姐姐",
    me: "方",
    quiet: "我也喜欢",            // 朋友圈里的第一句话
    quietSong: "Aimer · Ref:rain", // 那条朋友圈分享的歌
    himWechat: "Follow",          // 他的微信名（分享歌的人）
    meWechat: "Helios",           // 我的微信名（留言的人）
    from: "北京", to: "重庆",
    // 江湖页四周散落的 Aimer 歌名（小字；Polaris 用酒红色）
    aimerTitles: ["StarRingChild", "Brave Shine", "六等星の夜", "茜さす", "カタオモイ", "Polaris", "残響散歌"],
    // 游戏里的情侣时装：photos/wardrobe/m01–m27.webp（4:5），由原图裁好
    // wardrobe: { dir: "photos/wardrobe", count: 27 },   // 时装定格动画：已撤下（文件留在 photos/wardrobe/，页面不再加载）
  },

  // 背景音乐（我写给你的歌）
  music: {
    src: "audio/our-song.mp3",
    title: "Oxygen Boy",
    prompt: "放一首我写给你的歌",
    volume: 0.7,              // 最大音量 0–1（会慢慢淡入）
  },

  // 重庆初见的万豪乌龙（点错的那张会扣分）
  hotel: {
    label: "重庆 · 初见",
    scoreLabel: "印象分",
    startScore: 100,
    right: { name: "万豪", en: "Marriott" },
    wrong: { name: "JW 万豪", en: "JW Marriott" },
    stamp: "扣分",
    // 第一次点错后出现（按逗号自动分行）
    quoteEn: ["Short, dazed, and he left me starving.", "Never coming back to Chongqing. Hmph."],
    quote: "当时我在想，这个人又矮又呆，还晕头转向的让我饿着，差评负分！再也不来重庆了哼",
  },

  // 一起去过的城市（只写坐标，每个城市一次）
  // copy：地图上点开城市后，照片下面的一段文字（空着就不显示）
  // extra：这个城市额外的照片（不在胶卷里的），会一起拼进城市页
  places: [
    { id: "chongqing", name: "重庆", en: "Chongqing", country: "中国", lat: 29.563, lon: 106.551, copy: "" },
    { id: "beijing",   name: "北京", en: "Beijing",   country: "中国", lat: 39.904, lon: 116.407, copy: "" },
    { id: "chengdu",   name: "成都", en: "Chengdu",   country: "中国", lat: 30.573, lon: 104.066, copy: "" },
    { id: "dongguan",  name: "东莞", en: "Dongguan",  country: "中国", lat: 23.021, lon: 113.752, copy: "" },
    { id: "dali",      name: "大理", en: "Dali",      country: "中国", lat: 25.606, lon: 100.267, copy: "", extra: ["photos/m2.webp"] },
    { id: "hangzhou",  name: "杭州", en: "Hangzhou",  country: "中国", lat: 30.274, lon: 120.155, home: "我们的家", copy: "" },
    { id: "shanghai",  name: "上海", en: "Shanghai",  country: "中国", lat: 31.230, lon: 121.474, copy: "" },
    { id: "fukuoka",   name: "福冈", en: "Fukuoka",   country: "日本", lat: 33.590, lon: 130.402, copy: "" },
    { id: "wuning",    name: "武宁西海", en: "Wuning · Xihai", country: "中国", lat: 29.18, lon: 115.30, copy: "" },
    { id: "krabi",     name: "甲米", en: "Krabi",     country: "泰国", lat: 8.086, lon: 98.906, copy: "" },
    { id: "jiaxing",   name: "嘉兴", en: "Jiaxing",   country: "中国", lat: 30.746, lon: 120.755, copy: "" },
    { id: "shenzhen",  name: "深圳", en: "Shenzhen",  country: "中国", lat: 22.543, lon: 114.058, copy: "" },
    { id: "seoul",     name: "首尔", en: "Seoul",     country: "韩国", lat: 37.566, lon: 126.978, copy: "" },
    { id: "tokyo",     name: "东京", en: "Tokyo",     country: "日本", lat: 35.676, lon: 139.650, copy: "" },
    { id: "kk",        name: "亚庇", en: "Kota Kinabalu", country: "马来西亚", lat: 5.980, lon: 116.074, copy: "", extra: ["photos/sunset-sit.webp"] },
  ],

  // 旅行路线 —— 按真实顺序（红线、图钉编号、「上一站 / 下一站」都按这个顺序）
  // 同一个城市可以出现多次（比如大理去了两次）
  // photoNotes：多张照片时，每张照片角落的小字（和 photos 一一对应）
  // 真实拍立得的扫描件（自带白边）：用 scans: [...]，会原样显示，不再套相框
  // 竖长的大头贴：加 tall: true
  // 一站想放多张照片：把 photo 换成 photos: ["photos/a.webp", "photos/b.webp"]（点照片切换）
  stops: [
    { city: "chongqing", photos: ["photos/n1.webp", "photos/chongqing-2nd.webp", "photos/chongqing-fridge-flowers.webp"], photoNotes: ["2022 · 重庆", "第二次来重庆 · 2023", "2023.08"], memory: "当时我在想，这个人又矮又呆，还晕头转向的让我饿着，差评负分！再也不来重庆了哼", note: "初见" },
    { city: "beijing",   photo: "photos/beijing.webp", tall: true, memory: "过年邀请你来我家。一起滑冰、逛胡同，去了很多很多地方。", note: "过年" },
    { city: "chengdu",   photo: null, memory: "待填写" },
    { city: "dongguan",  photo: "photos/dongguan.webp", memory: "陪我出差。" },
    { city: "dali",      photo: "photos/dali-first-shadows.webp", memory: "2023.05 · 第一次一起旅行。我发烧了一整趟，你守了我一整趟。「等求婚的时候再来一次吧。」", note: "2023.05" },
    { city: "hangzhou",  photo: null, scansDate: "2025.05.20", memory: "2024 年我先来了杭州，2025 年五一你也搬了过来。异地结束的第一个 520。", note: "我们的家" },
    { city: "shanghai",  photo: null, memory: "待填写" },
    { city: "fukuoka",   photo: "photos/fukuoka-torii.webp", memory: "待填写" },   // 白色鸟居、夫妇岩，海边（替换原 m13）
    { city: "wuning",    photo: null, memory: "待填写" },
    { city: "krabi",     photo: "photos/krabi.webp", memory: "待填写", note: "2025.10 · 十一" },
    { city: "jiaxing",   photo: null, memory: "待填写" },
    { city: "shenzhen",  photo: null, memory: "待填写" },
    { city: "seoul",     photo: null, memory: "待填写" },
    { city: "tokyo",     photo: "photos/tokyo.webp", memory: "来东京，是为了带回 Helios 和 Polaris。", note: "2026.05 · 五一" },
    { city: "dali",      photo: "photos/dali-proposal.webp", memory: "第二次来大理，你向我求婚了。你把一句病中的约定，变成了三年后的答案。大理终于不再是遗憾。", note: "2026.06.22", highlight: true, seal: "6.22", song: "Aimer《Polaris》" },
    { city: "kk",        photos: ["photos/kota-kinabalu.webp", "photos/sunset-kiss.webp"], memory: "待填写", note: "2026.10 · 十一" },
  ],
  // 地图上额外的一条虚线：从第 5 站连到第 15 站
  promise: { from: 5, to: 15, label: "约定" },

  // 四个年份章节（每一卷胶卷），每个年份可以放任意多条
  // city（可选）：这张照片属于哪个城市（places 里的 id）——地图上点城市，会把这个城市的所有照片拼在一页
  // text：点开照片后底部的那一句话（所有故事文字都放在这里；空着就显示「占位文案」）
  // crop（可选）：照片在胶卷里的取景；pos = 取景中心，zoom = 放大，ratio = 画幅（只用两种："3/2" 横幅通栏，"4/5" 竖幅；highlight 的竖幅通栏，其余 64% 宽）。点开仍是完整照片
  // 没有日期、标题、文字的那张，会自动接在上一条后面，算同一件事
  // 胶卷排法 layout：strip = 竖胶片 · feature = 胶片 + 一张放大的重点照片（feature: true 的那张）
  //              contact = 横排印样 · peak = 照片拼贴（情绪高点）
  chapters: [
    { year: "2023", layout: "feature", title: "待填写", items: [
      { title: "第二次来重庆", date: "2023", text: "待填写", photo: "photos/chongqing-2nd.webp", city: "chongqing" },
      { title: "北京", date: "2023.05.01", text: "", photo: "photos/m0.webp", city: "beijing" },   // 胡同
      { title: "大理 · 第一次一起旅行", date: "2023.05", text: "我发烧了一整趟，你守了我一整趟。「等求婚的时候再来一次吧。」", photo: "photos/dali-first-shadows.webp", city: "dali" },
      { title: "第一次异地结束", date: "2023.08", text: "我辞职去了重庆。你为了迎接我，布置了一冰箱的花。", photo: "photos/chongqing-fridge-flowers.webp", highlight: true, feature: true, city: "chongqing" },
      { title: "一周年 · 重庆", date: "2023.10.30", text: "", photo: "photos/n2.webp", city: "chongqing" },
      { title: "圣诞", date: "2023", text: "", photo: "photos/n3.webp" },
      { title: "待填写", date: "待填写", text: "待填写", photo: null },
    ]},
    { year: "2024", layout: "feature", title: "待填写", thumb: "photos/n0-hardware.webp", items: [   // thumb: the FOUR ROLLS intro keeps its approved 2024 thumbnail
      { title: "新年 · 重庆", date: "2024.01.01", text: "", photo: "photos/m3.webp", city: "chongqing" },   // 水母灯
      { title: "重庆", date: "2024.03", text: "女子五金背后的男人", photo: "photos/n0-hardware.webp", highlight: true, feature: true, city: "chongqing" },
      { title: "生日 · 重庆", date: "2024.04.11", text: "", photo: "photos/m4.webp", city: "chongqing" },
      { title: "重庆同居", date: "2024", text: "", photo: "photos/n4.webp", city: "chongqing" },
      { title: "重庆", date: "2024.07", text: "我马上就要去杭州上班了", photo: "photos/m5.webp", city: "chongqing" },   // 2024.07.14
      { title: "杭州", date: "2024.08", text: "", photo: "photos/m6.webp", city: "hangzhou" },   // 镜子自拍
      { title: "杭州", date: "2024.09", text: "", photo: "photos/m7.webp", city: "hangzhou" },   // 车后座自拍
      { title: "十一", date: "2024.10", text: "我把我们的合影当成了云音乐的播放器", photo: "photos/m8.webp", crop: { ratio: "3/5", fit: "contain" } },   // 国庆 · 云音乐截图（状态栏已裁掉）
      { title: "西湖音乐节 · 杭州", date: "2024.11", text: "", photo: "photos/m9.webp", city: "hangzhou" },   // 夜里自拍
    ]},
    { year: "2025", layout: "peak", title: "待填写", thumb: "photos/krabi.webp", items: [   // thumb: the FOUR ROLLS intro keeps its approved krabi thumbnail
      { title: "新年 · 杭州", date: "2025.01.01", text: "", photo: "photos/m10.webp", city: "hangzhou" },   // 贴脸自拍
      { title: "待填写", date: "待填写", text: "待填写", photo: "photos/m11.webp", city: "hangzhou" },   // 西湖边长椅，红叶下（同一天新年，共用上一条）
      { title: "情人节 · 杭州", date: "2025.02.14", text: "情人节赶上了他的生日", photo: "photos/m12.webp", crop: { pos: "50% 10%" }, city: "hangzhou" },   // 烛光、粉玫瑰，镜子自拍
      { title: "网吧 · 杭州", date: "2025.03", text: "方大同去世那天他陪我在网吧加班", photo: "photos/m14.webp", city: "hangzhou" },   // 网吧，他戴着耳机
      { title: "清明 · 福冈", date: "2025.04", text: "", photo: "photos/fukuoka-ship.webp", city: "fukuoka" },   // 2025.04.05 船上合照，海面
      { title: "甲米", date: "2025.10 · 十一", text: "待填写", photo: "photos/krabi.webp", crop: { pos: "50% 24%", zoom: 1, ratio: "3/2" }, city: "krabi" },
    ]},
    { year: "2026", layout: "peak", title: "待填写", thumb: "photos/tokyo.webp", items: [
      { title: "东京", date: "2026.05 · 五一", text: "来东京，是为了带回 Helios 和 Polaris。", photo: "photos/tokyo.webp", crop: { pos: "50% 30%", zoom: 1, ratio: "4/5" }, city: "tokyo" },
      { title: "大理 · 求婚", date: "2026.06.22", text: "第二次来大理，你向我求婚了。", photo: "photos/dali-proposal.webp", highlight: true, crop: { pos: "50% 50%", zoom: 1, ratio: "4/5" }, city: "dali" },
      { title: "亚庇", date: "2026.10 · 十一", text: "待填写", photo: "photos/kota-kinabalu.webp", crop: { pos: "50% 62%", zoom: 1, ratio: "3/2" }, city: "kk" },
      { title: "待填写", date: "待填写", text: "待填写", photo: "photos/sunset-kiss.webp", crop: { pos: "50% 64%", zoom: 1, ratio: "4/5" }, city: "kk" },
    ]},
  ],

  // 日历页：29 / 30 / 31，圈出 30 号；下面是倒数卡片（10.30 当天显示 1461）
  calendar: {
    date: "2026-10-30T00:00:00+08:00",
    script: "save the date",
    since: "2022.10.30",
    print: "photos/n2.webp", printCaption: ["2023.10.30", "一周年 · 重庆"],
    // 纪念日翻页：每年 10.30 一页，按顺序自动翻（约 2.8 秒一页），最后停在 2026。没有照片的一页显示「还没显影」的拍立得
    pages: [
      { date: "2023-10-30", print: "photos/n2.webp", caption: ["2023.10.30", "一周年 · 重庆"] },
      { date: "2024-10-30", print: null, caption: ["2024.10.30", "两周年"] },   // TODO: 2024.10.30 的照片（发来后填 photos/xxx.webp）
      { date: "2025-10-30", print: null, caption: ["2025.10.30", "三周年"] },   // TODO: 2025.10.30 的照片
      { date: "2026-10-30", print: null, caption: ["2026.10.30", "四周年"] },   // 这一天还没拍：一直是未显影的拍立得
    ],
  },

  // 最后的信封

  finale: {
    // 结尾的歌：密码一对上就换成这首（不管之前在放什么）。把音频放进 audio/ 并在 src 填文件名即可；src 为空则不换歌
    music: { src: "", title: "ポラリス", artist: "Aimer", volume: 0.7 },
    lockedTitle: "NEXT CHAPTER",
    code: "411223",            // 隐藏页密码（几位数字都可以，圆点个数会自动跟着变）
    seal: "4",                 // 火漆印上的字（1–2 个字符最好看）
    letterTitle: "给夏天的信",
    // 每一段放一个字符串，用逗号隔开（最后一句如果和 closing 相同，会用斜体单独显示）
    letter: [
      "给夏天：",
      "四年前，「保护我方姐姐」从晚来天欲雪的江湖里走出来，在重庆等我，然后打车去错了酒店。",
      "那天我饿着肚子想：这个人又矮又呆，还晕头转向的，差评负分，再也不来重庆了，哼。",
      "可是故事其实更早就开始了。你在朋友圈分享 Aimer，我留言说「我也喜欢」。谁也没想到，一句「我也喜欢」能走这么远：北京的胡同和冰场，第一次去大理时那间只剩药和体温计的民宿，还有后来那么多城市。我们隔着两地，隔着很多不确定，你却从来没有后退过。",
      "今年你带我回到大理，把那句病中的约定变成了答案。Helios 和 Polaris，一个是我，一个是我想成为的那颗星。",
      "1461 天，你早就把扣掉的分数一点一点挣回来了，还多出很多很多。",
      "谢谢你在我最狼狈的时候，也一样笃定地选择我。下一章，我们一起写。",
      "I would choose you in every version of my life.",
    ],
    signature: "Helios",
    photo: "photos/dali-proposal.webp",   // 隐藏页上的拍立得
    photoCaption: "",   // 隐藏页上不放地点 / 日期（求婚照现在在 Polaris 唱片上）
    // 隐藏页上的「两半」：两张真实拍立得原样摆放
    // 这两张只放在隐藏页（胶卷和地图里都不再出现）
    pair: { scans: ["photos/hangzhou-ears.webp", "photos/hangzhou-eyes.webp"], caption: "" },
    // 《Polaris》歌词摘录（日文 + 中文）
    lyricTitle: "Aimer《Polaris》",
    lyrics: [
      ["そうやって生きていく 今は二人で", "你我如今已是两人携手"],
      ["行く先は知らない", "哪怕前路依旧未知"],
      ["いつだって 傍にいて", "无论何时 我都会在你身边"],
      ["こらえきれず泣きだしたって", "哪怕忍不住哭出来也没关系"],
      ["闇の中を かすかに照らすよ", "我也会在黑暗中 微微地照亮你"],
      ["そうやって生きてきた 君のためだけの", "为了这样一路走来的你"],
      ["ポラリスになりたい", "我愿成为只属于你的 北极星"],
    ],
    // 隐藏页的剪影：从亚庇日落那张背影照（photos/sunset-sit.webp）里抠出来的轮廓，里面填满我们的照片
    // （photos/silhouette.webp，加了新照片后运行 python3 tools/make_silhouette.py 重新生成）
    silhouette: "photos/silhouette-film.webp",   // 胶片条版本（/workspace/anniversary/tools/make_silhouette_film.py 生成）
    silhouetteCaption: "",   // 剪影下不放文字
    // 隐藏页最后一张「未显影」的拍立得：婚礼（日期定了再填，例如 "2027.05.20"）
    // Aimer《Polaris》：一张像 View-Master 转盘的纸质唱片，盘边 12 格照片，慢慢转（结尾这里允许和前面重复；不放游戏截图）
    record: ["photos/n1.webp", "photos/dali-first-shadows.webp", "photos/chongqing-fridge-flowers.webp", "photos/n2.webp", "photos/n0-hardware.webp", "photos/m9.webp",
      "photos/m12.webp", "photos/fukuoka-torii.webp", "photos/krabi.webp", "photos/tokyo.webp", "photos/dali-proposal.webp", "photos/sunset-kiss.webp"],
    // 唱片上方的一段文字（原文照录；每一行拆成几段，只用来决定手机上在哪里换行，拼起来就是原文）
    reelNotes: [
      [["「blanc」収録"]],
      [["ポラリス"]],
      null,
      [["みんなが旅人。"]],
      [["戻ることはできない道、"], ["前へ進めば傷つくこともある。"]],
      [["こころの奥に不安も孤独も、"], ["必ずある、"], ["一人ぼっちの旅。"]],
      [["そんな道だからこそ"], ["誰かが誰かのポラリスに"], ["なれたらいいのにって。"]],
      [["書いた曲。"]],
      null,
      [["大家都是行者。"]],
      [["无法回头，"], ["而继续前进的话有时又会受伤。"]],
      [["独自一人的旅途，"], ["内心深处必然有不安，"], ["有孤独。"]],
      [["正因为是这样的一条路，"], ["如果谁能够成为谁的"], ["北极星的话就好了。"]],
      [["因而写下了这首歌。"]],
      null,
      [["(转自 twitter@Aimer&staff)"]],
    ],
    // 剪影的「封面」：上面的大标题、下面的一句话和小字（占位，可改）
    cover: { title: ["1461 DAYS", "WITH YOU"], author: "Follow & Helios", quote: "I would choose you in every version of my life.", by: "— Helios", imprint: "2022.10.30 – 2026.10.30 · Vol. 04" },
    closing: "I would choose you in every version of my life.",
    heartLine: "Four years down. A lifetime of little adventures to go.",
  },
};
