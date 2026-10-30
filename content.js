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
    src: "audio/it-never-ended-in-autumn-b.mp3",
    title: "It Never Ended in Autumn",
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
    // 第一次点错后出现（quoteLines 每项一行；红色那行单独标）
    quoteEn: ["He took me to the wrong Marriott,", "then we sat in traffic forever.", "Short, clueless, zero stars.", "Never coming back. Hmph."],
    quoteLines: [
      "接我的时候打错了车，",
      "把“万豪”去成了“JW 万豪”。",
      "两家隔着十万八千里，",
      "一路堵车，我差点饿晕。",
      "看着旁边这个又矮又呆、",
      "晕头转向的人，",
      "差评负分！",
      "再也不来重庆了哼",
    ],
    quoteRed: "差评负分！",
    quote: "接我的时候打错了车，把“万豪”去成了“JW 万豪”。两家隔着十万八千里，一路堵车，我差点饿晕。看着旁边这个又矮又呆、晕头转向的人，差评负分！再也不来重庆了哼",
  },

  // 一起去过的城市（只写坐标，每个城市一次）
  // copy：地图上点开城市后，照片下面的一段文字（空着就不显示）
  // extra：这个城市额外的照片（不在胶卷里的），会一起拼进城市页
  places: [
    { id: "chongqing", name: "重庆", en: "Chongqing", country: "中国", lat: 29.563, lon: 106.551, copy: "重庆是我们回忆最密集的地方之一，藏着从初见到同居的所有第一次。在这里，我终于看清了游戏里那个让我心动的人真实的样子，也第一次尝到了和一个人把日子过成柴米油盐是什么滋味。就是从这座城市开始，我彻底坚定了要和你一直在一起的信念。", wall: "tape", photos: ["photos/cq-10.webp", "photos/cq-09.webp", "photos/cq-08.webp", "photos/cq-02.webp", "photos/cq-41.webp", "photos/cq-32.webp", "photos/cq-12.webp", "photos/cq-16.webp", "photos/cq-39.webp", "photos/cq-30.webp", "photos/cq-23.webp", "photos/cq-35.webp", "photos/cq-18.webp", "photos/cq-14.webp", "photos/cq-33.webp", "photos/cq-21.webp", "photos/cq-06.webp", "photos/cq-28.webp", "photos/cq-20.webp", "photos/cq-01.webp", "photos/cq-07.webp", "photos/cq-05.webp", "photos/cq-24.webp", "photos/cq-36.webp", "photos/cq-03.webp", "photos/cq-31.webp", "photos/cq-38.webp", "photos/cq-17.webp", "photos/cq-40.webp", "photos/cq-15.webp", "photos/cq-37.webp", "photos/cq-13.webp", "photos/cq-11.webp", "photos/cq-34.webp", "photos/cq-04.webp"] },
    { id: "beijing",   name: "北京", en: "Beijing",   country: "中国", lat: 39.904, lon: 116.407, copy: "这是我长大的家，也可能是我们以后要定居的地方。每次你陪我回家，学着京腔儿逗我笑，我都觉得你大概真是“天选北京人”；可一想到连我都嫌弃的北京，以后也要你跟着受罪，就忍不住心疼。其实定居在哪儿根本不重要，只要身边是你，去哪儿我都愿意。", wall: "tape", photos: ["photos/bj-13.webp", "photos/bj-03.webp", "photos/bj-05.webp", "photos/bj-12.webp", "photos/bj-04.webp", "photos/bj-10.webp", "photos/bj-02.webp", "photos/bj-15.webp", "photos/bj-14.webp", "photos/bj-17.webp", "photos/bj-07.webp", "photos/bj-18.webp", "photos/bj-06.webp", "photos/bj-09.webp", "photos/bj-19.webp", "photos/bj-20.webp", "photos/bj-16.webp", "photos/bj-11.webp"] },
    { id: "chengdu",   name: "成都", en: "Chengdu",   country: "中国", lat: 30.573, lon: 104.066, copy: "成都的记忆轻松又热闹，你陪我出差盯现场，还在我的活动上乖乖接受采访当托。也是在这里，我第一次把你介绍给朋友们。看着大家从一开始的不理解变成现在的全员支持，原因我比谁都明白，谢谢你无条件支持我的工作，更谢谢你用行动让所有人看到了我被爱着的证据。", photos: ["photos/cd-02.webp", "photos/cd-01.webp"] },
    { id: "dongguan",  name: "东莞", en: "Dongguan",  country: "中国", lat: 23.021, lon: 113.752, copy: "得知我要一个人去东莞出差，正在广西出差的你二话不说请假赶了过来。偏僻的厂区确实让人心里没底，可有你在身边陪了短短几天，我就有了最大的安全感。现在回想起来，异地恋时的我们真的好用力：哪怕都在各自忙碌，也要在有限的时间里争分夺秒，找尽一切机会见上一面。", photos: ["photos/dg-02.webp", "photos/dg-01.webp"] },
    { id: "dali",      name: "大理", en: "Dali",      country: "中国", lat: 25.606, lon: 100.267, copy: "第一次来大理，我因为新冠头疼腿疼到崩溃，是你不眠不休地守在床边照顾我。带着没看成风景的遗憾，我随口对你说：“等你求婚的时候，我们再来一次吧。”当时只是一句无心的约定，没想到我们真的走了这么远，你也真的带我回了这里。从狼狈的病床到浪漫的求婚，大理见证了你极致的耐心，也见证了我们最好的结局。", wall: "tape", extra: ["photos/m2.webp"], photos: ["photos/dl-34.webp", "photos/dl-21.webp", "photos/dl-19.webp", "photos/dl-25.webp", "photos/dl-22.webp", "photos/dl-32.webp", "photos/dl-04.webp", "photos/dl-23.webp", "photos/dl-08.webp", "photos/dl-30.webp", "photos/dl-33.webp", "photos/dl-28.webp", "photos/dl-11.webp", "photos/dl-06.webp", "photos/dl-26.webp", "photos/dl-27.webp", "photos/dl-10.webp", "photos/dl-18.webp", "photos/dl-01.webp", "photos/dl-15.webp", "photos/dl-02.webp", "photos/dl-07.webp", "photos/dl-20.webp", "photos/dl-35.webp", "photos/dl-24.webp", "photos/dl-03.webp", "photos/dl-16.webp", "photos/dl-31.webp", "photos/dl-09.webp", "photos/dl-17.webp", "photos/dl-29.webp"] },
    { id: "hangzhou",  name: "杭州", en: "Hangzhou",  country: "中国", lat: 30.274, lon: 120.155, home: "我们的家", copy: "谢谢你把“我去哪你就去哪”的承诺，落地成杭州日复一日的共同生活。在这里，我们卸下所有滤镜，在长久的同居里真正读懂了彼此的脾气与软肋——越是看清全貌，越是庆幸身边是你。", wall: "tape", photos: ["photos/hz-28.webp", "photos/hz-19.webp", "photos/hz-26.webp", "photos/hz-32.webp", "photos/hz-38.webp", "photos/hz-22.webp", "photos/hz-15.webp", "photos/hz-41.webp", "photos/hz-21.webp", "photos/hz-37.webp", "photos/hz-05.webp", "photos/hz-12.webp", "photos/hz-07.webp", "photos/hz-01.webp", "photos/hz-11.webp", "photos/hz-36.webp", "photos/hz-09.webp", "photos/hz-23.webp", "photos/hz-06.webp", "photos/hz-18.webp", "photos/hz-45.webp", "photos/hz-39.webp", "photos/hz-27.webp", "photos/hz-20.webp", "photos/hz-29.webp", "photos/hz-44.webp", "photos/hz-43.webp", "photos/hz-16.webp", "photos/hz-31.webp", "photos/hz-24.webp", "photos/hz-35.webp", "photos/hz-42.webp", "photos/hz-40.webp", "photos/hz-14.webp", "photos/hz-34.webp", "photos/hz-25.webp", "photos/hz-33.webp", "photos/hz-02.webp", "photos/hz-04.webp"] },
    { id: "shanghai",  name: "上海", en: "Shanghai",  country: "中国", lat: 31.230, lon: 121.474, copy: "上海的作用是：剪发、脱毛、赶演出、顺道转机。虽然是北上深杭里我唯一没生活过的城市，但来来往往多次后，我们两人对它的默契评价只有两个字——平平。", wall: "tape", photos: ["photos/sh-02.webp", "photos/sh-03.webp", "photos/sh-04.webp", "photos/sh-01.webp", "photos/sh-08.webp", "photos/sh-06.webp", "photos/sh-07.webp", "photos/sh-05.webp"] },
    { id: "fukuoka",   name: "福冈", en: "Fukuoka",   country: "日本", lat: 33.590, lon: 130.402, copy: "清明坐着皇家加勒比游轮靠岸福冈，把仅有的一天留给了系岛的白色鸟居与夫妻岩。换上校服扮高中生，你活脱脱像个被不良学姐诱拐的纯情学弟。哼，谁让我就是喜欢正太呢！", wall: "tape", photos: ["photos/fq-10.webp", "photos/fq-06.webp", "photos/fq-03.webp", "photos/fq-08.webp", "photos/fq-07.webp", "photos/fq-12.webp", "photos/fq-01.webp", "photos/fq-02.webp", "photos/fq-11.webp", "photos/fq-05.webp", "photos/fq-04.webp", "photos/fq-09.webp", "photos/fq-13.webp"] },
    { id: "wuning",    name: "九江", en: "Jiujiang", country: "中国", lat: 29.705, lon: 116.002, copy: "端午跑去武宁西海，可惜天公不作美，好几天都在下雨。尤其记得玩摩托艇的时候，你在前面被“冰雨在脸上胡乱地拍”，我在后面被浪吓得放声尖叫。实话实说，这地方其实没啥意思，大概率以后也不会再来了。但转念一想，只要是和你在一起旅游，哪怕顶着雨踩雷，也是开心的。", wall: "tape", photos: ["photos/wn-08.webp", "photos/wn-04.webp", "photos/wn-13.webp", "photos/wn-01.webp", "photos/wn-07.webp", "photos/wn-11.webp", "photos/wn-14.webp", "photos/wn-02.webp", "photos/wn-03.webp", "photos/wn-15.webp", "photos/wn-09.webp", "photos/wn-06.webp", "photos/wn-10.webp", "photos/wn-12.webp", "photos/wn-05.webp"] },
    { id: "krabi",     name: "甲米", en: "Krabi",     country: "泰国", lat: 8.086, lon: 98.906, copy: "第一次去泰国，选了甲米。出发前整天担心会不会被卖到KK园区噶腰子，结果到了之后直呼真香，好玩到恨不得再刷一次。美中不足的是去之前脚刚好受伤，没办法去健身，看着照片里圆润的自己直犯愁。本来还指望有人能监督我，结果这人倒好，天天抱着我说“一点都不胖”，硬生生把我给放任得越来越圆。虽然嘴上嫌弃，但能被这样毫无原则地偏爱着，好像胖一点也完全没关系啦😁", wall: "tape", photos: ["photos/kb-02.webp", "photos/kb-13.webp", "photos/kb-03.webp", "photos/kb-18.webp", "photos/kb-01.webp", "photos/kb-16.webp", "photos/kb-17.webp", "photos/kb-05.webp", "photos/kb-10.webp", "photos/kb-11.webp", "photos/kb-08.webp", "photos/kb-12.webp", "photos/kb-04.webp", "photos/kb-09.webp", "photos/kb-06.webp", "photos/kb-07.webp", "photos/kb-14.webp"] },
    { id: "jiaxing",   name: "嘉兴", en: "Jiaxing",   country: "中国", lat: 30.746, lon: 120.755, copy: "被抖音狠狠坑去打卡的濮院时尚古镇一点都不时尚！以后再也不信网上推荐了！不过周末消磨时间倒还凑合。在离开杭州前，我们的目标是把江浙沪能去的地方全部去遍🤗", wall: "tape", photos: ["photos/jx-02.webp", "photos/jx-08.webp", "photos/jx-16.webp", "photos/jx-15.webp", "photos/jx-10.webp", "photos/jx-13.webp", "photos/jx-04.webp", "photos/jx-03.webp", "photos/jx-07.webp", "photos/jx-11.webp", "photos/jx-06.webp", "photos/jx-12.webp", "photos/jx-09.webp", "photos/jx-05.webp"] },
    { id: "shenzhen",  name: "深圳", en: "Shenzhen",  country: "中国", lat: 22.543, lon: 114.058, copy: "对深圳的感情向来是爱恨交加。刚在一起就把你带去见深圳的朋友，结果全员好评。从被夸像陈坤到锦户亮，某些人啊，嘴上不说，心里指不定美成什么样了呢！", photos: ["photos/sz-02.webp", "photos/sz-04.webp", "photos/sz-05.webp", "photos/sz-01.webp", "photos/sz-03.webp"] },
    { id: "seoul",     name: "首尔", en: "Seoul",     country: "韩国", lat: 37.566, lon: 126.978, copy: "过年陪我去首尔做医美加买东西，我还在兴致勃勃地逛街，你已经彻底累瘫，被首尔狠狠伤到。再加上我打完丽珠兰后那张可怕的脸让你根本不敢直视，哼！(ﾉ｀⊿´)ﾉ下次再也不带你去小韩了<(｀^´)>", wall: "tape", photos: ["photos/se-06.webp", "photos/se-07.webp", "photos/se-01.webp", "photos/se-02.webp", "photos/se-03.webp", "photos/se-08.webp", "photos/se-09.webp", "photos/se-04.webp", "photos/se-05.webp"] },
    { id: "tokyo",     name: "东京", en: "Tokyo",     country: "日本", lat: 35.676, lon: 139.650, copy: "专程飞去东京取我们的钻戒和婚戒，顺道见了久违的然姐。她一眼就看穿你是我最喜欢的可爱型男生，两个重庆人还开启了加密通话模式。见到然姐家软萌的宝宝，心都要化了🥺希望未来的某一天，我们也能拥有属于自己的孩子(๑˘³˘๑)💗", wall: "tape", photos: ["photos/tk-08.webp", "photos/tk-14.webp", "photos/tk-20.webp", "photos/tk-12.webp", "photos/tk-07.webp", "photos/tk-06.webp", "photos/tk-02.webp", "photos/tk-01.webp", "photos/tk-15.webp", "photos/tk-21.webp", "photos/tk-04.webp", "photos/tk-17.webp", "photos/tk-10.webp", "photos/tk-11.webp", "photos/tk-09.webp", "photos/tk-03.webp", "photos/tk-18.webp", "photos/tk-19.webp", "photos/tk-13.webp", "photos/tk-05.webp"] },
    { id: "kk",        name: "亚庇", en: "Kota Kinabalu", country: "马来西亚", lat: 5.980, lon: 116.074, copy: "自从去过甲米就彻底爱上了海边，这次被同事种草，又迁就了某人不想出亚洲、有中国人才有安全感的执念，果断锁定了亚庇。虽然当地食物实在是一言难尽，但是一起去跳岛、去神山、去红树林，也算是把亚庇深度游了个遍，留下的都是美好回忆❤️", wall: "tape", photos: ["photos/kk-24.webp", "photos/kk-20.webp", "photos/kk-18.webp", "photos/kk-23.webp", "photos/kk-22.webp", "photos/kk-17.webp", "photos/kk-19.webp", "photos/kk-04.webp", "photos/kk-10.webp", "photos/kk-13.webp", "photos/kk-16.webp", "photos/kk-07.webp", "photos/kk-15.webp", "photos/kk-01.webp", "photos/kk-05.webp", "photos/kk-02.webp", "photos/kk-08.webp", "photos/kk-14.webp", "photos/kk-06.webp", "photos/kk-21.webp", "photos/kk-03.webp", "photos/kk-11.webp", "photos/kk-09.webp"] },
  ],

  // 旅行路线 —— 按真实顺序（红线、图钉编号、「上一站 / 下一站」都按这个顺序）
  // 同一个城市可以出现多次（比如大理去了两次）
  // photoNotes：多张照片时，每张照片角落的小字（和 photos 一一对应）
  // 真实拍立得的扫描件（自带白边）：用 scans: [...]，会原样显示，不再套相框
  // 竖长的大头贴：加 tall: true
  // 一站想放多张照片：把 photo 换成 photos: ["photos/a.webp", "photos/b.webp"]（点照片切换）
  stops: [
    { city: "chongqing", photos: ["photos/chongqing-fridge-flowers.webp"], photoNotes: ["2023.08"], memory: "接我的时候打错了车，把“万豪”去成了“JW 万豪”。两家隔着十万八千里，一路堵车，我差点饿晕。看着旁边这个又矮又呆、晕头转向的人，差评负分！再也不来重庆了哼。", note: "初见" },
    { city: "beijing",   photo: "photos/beijing.webp", tall: true, memory: "过年邀请你来我家。一起滑冰、逛胡同，去了很多很多地方。", note: "过年" },
    { city: "chengdu",   photo: null, memory: "待填写" },
    { city: "dongguan",  photo: "photos/dongguan.webp", memory: "陪我出差。" },
    { city: "dali",      photo: null, memory: "2023.05 · 第一次一起旅行。我发烧了一整趟，你守了我一整趟。「等求婚的时候再来一次吧。」", note: "2023.05" },
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

  // 地图城市页里原来跟着 2023 胶卷出现的照片（胶卷换图后单独留在这里；跟 2023 胶卷同一张的已撤掉：n1、chongqing-2nd、m0、dali-first-shadows 只在胶卷里）
  mapPhotos: [
    { city: "chongqing", photo: "photos/chongqing-fridge-flowers.webp", date: "2023.08" },
    { city: "chongqing", photo: "photos/n2.webp", date: "2023.10.30" },
  ],
  // 四个年份章节（每一卷胶卷），每个年份可以放任意多条
  // city（可选）：这张照片属于哪个城市（places 里的 id）——地图上点城市，会把这个城市的所有照片拼在一页
  // text：点开照片后底部的那一句话（所有故事文字都放在这里；空着就显示「占位文案」）
  // crop（可选）：照片在胶卷里的取景；pos = 取景中心，zoom = 放大，ratio = 画幅（只用两种："3/2" 横幅通栏，"4/5" 竖幅；highlight 的竖幅通栏，其余 64% 宽）。点开仍是完整照片
  // 没有日期、标题、文字的那张，会自动接在上一条后面，算同一件事
  // 胶卷排法 layout：strip = 竖胶片 · feature = 胶片 + 一张放大的重点照片（feature: true 的那张）
  //              contact = 横排印样 · peak = 照片拼贴（情绪高点）
  chapters: [
    { year: "2023", layout: "feature", title: "待填写", thumb: "photos/thumb-2023.webp", items: [   // thumb: only the FOUR ROLLS picker
      // 2023 这一卷只放这 7 张（只出现在这卷里，别处不用）；只有日期，点开显示日期和文案（dateOnly）
      { title: "", date: "2023.01.01", text: "隔着屏幕说了90天晚安，今天总算见到活的了。", photo: "photos/r23-0101.webp", dateOnly: true },
      { title: "", date: "2023.01.27", text: "重庆来的小土豆，差点被北京的零下冻成土豆冰棍。", photo: "photos/r23-0127.webp", dateOnly: true },
      { title: "", date: "2023.03.26", text: "第二次飞山城。别人的周末是睡懒觉，我的周末是赶飞机。", photo: "photos/r23-0326.webp", dateOnly: true },
      { title: "", date: "2023.05.02", text: "老北京导游认真营业，某位游客眼神全程拉丝。", photo: "photos/r23-0502.webp", dateOnly: true },
      { title: "", date: "2023.05.12", text: "第一次一起旅行，我在大理病成一摊，白天全躺过去了，还好晚上有人牵着。", photo: "photos/r23-0512.webp", dateOnly: true },
      { title: "", date: "2023.10.14", text: "开始同居啦，在欢乐谷给自己捡了一只卖萌的大灰狼。", photo: "photos/r23-1014.webp", dateOnly: true },
      { title: "", date: "2023.12.25", text: "不用等圣诞老人送礼物了，镜子里贴着我的这个就是。", photo: "photos/r23-1225.webp", dateOnly: true },
    ]},
    { year: "2024", layout: "feature", title: "待填写", thumb: "photos/r24-1102.webp", items: [   // thumb: the FOUR ROLLS intro keeps its approved 2024 thumbnail
      // 2024 这一卷只放 Helios 新发的照片（只出现在这卷里）；只有日期，点开显示日期和文案（dateOnly）
      { title: "", date: "2024.01.01", text: "和你在海洋馆看海。", photo: "photos/r24-0101.webp", dateOnly: true },
      { title: "", date: "2024.04.11", text: "生日在刚开业的 Need 排长队，但其实 All I need is you。", photo: "photos/r24-0411b.webp", dateOnly: true },
      { title: "", date: "2024.05.12", text: "江津喝茶打卡！店名叫“闲居晚秋”，结果店主竟然也叫“夏天”😲", photo: "photos/r24-garden.webp", dateOnly: true },
      { title: "", date: "2024.07.14", text: "去杭州工作前的倒计时，把在重庆最后的时光，安静地泡进茶和书里。", photo: "photos/r24-0714.webp", dateOnly: true },
      { title: "", date: "2024.08.10", text: "哪怕在音乐节被大雨浇头，只要身边是你，狼狈也变成了好笑的回忆。", photo: "photos/r24-0810.webp", dateOnly: true },
      { title: "", date: "2024.09.30", text: "十一，满觉陇。满山的桂花香，和看秋天的我们。", photo: "photos/r24-0930.webp", dateOnly: true },
      { title: "", date: "2024.11.02", text: "西湖音乐节打卡！眼神里写满了清澈的愚蠢。", photo: "photos/r24-1102.webp", dateOnly: true },
    ]},
    { year: "2025", layout: "feature", title: "待填写", thumb: "photos/r25-1003.webp", items: [   // thumb: the FOUR ROLLS intro keeps its approved krabi thumbnail
      { title: "", date: "2025.01.01", text: "又甜一年！继续贴贴。", photo: "photos/r25-0101.webp", dateOnly: true },
      { title: "", date: "2025.02.14", text: "生日遇上情人节，烛光、鲜花和酒，今天有双份的理由好好爱你。", photo: "photos/r25-0214.webp", dateOnly: true },
      { title: "", date: "2025.03.01", text: "好不容易从重庆飞来见我，结果约会秒变网吧加班。", photo: "photos/r25-0301.webp", dateOnly: true },
      { title: "", date: "2025.04.06", text: "在夫妇岩前合个影，悄悄许愿我们也长长久久。", photo: "photos/r25-0406.webp", dateOnly: true },
      { title: "", date: "2025.05.18", text: "拍撕拉片前的花絮——旧电视机里的我们。", photo: "photos/r25-0518.webp", dateOnly: true },
      { title: "", date: "2025.10.03", text: "飞到甲米开启躺平模式，在酒店和你虚度光阴。", photo: "photos/r25-1003.webp", dateOnly: true },
      { title: "", date: "2025.10.06", text: "甲米宏岛出海记：身后是翡翠色的海水，后背是让人安心的你。", photo: "photos/r25-1006.webp", dateOnly: true },
    ]},
    { year: "2026", layout: "feature", title: "待填写", thumb: "photos/r26-0622.webp", items: [
      { title: "", date: "2026.01.10", text: "富阳泡温泉散心局，闺蜜镜头里的我们。", photo: "photos/r26-0110.webp", dateOnly: true },
      { title: "", date: "2026.02.19", text: "两个戴着口罩的乖宝宝陪妈妈看《镖人》。", photo: "photos/r26-0219.webp", dateOnly: true },
      { title: "", date: "2026.04.18", text: "杭州的午后，坐在小店门口一起吃抹茶甜品的日常。感谢谢姐拍照！", photo: "photos/r26-0418.webp", dateOnly: true },
      { title: "", date: "2026.05.02", text: "专程飞去东京取钻戒，顺道探望远嫁日本的然姐。", photo: "photos/r26-0502.webp", dateOnly: true },
      { title: "", date: "2026.06.22", text: "婚戒是Helios，钻戒是Polaris，而你是我在无数不确定里最笃定的答案。", photo: "photos/r26-0622.webp", dateOnly: true },
      { title: "", date: "2026.09.29", text: "阳光、沙滩，和一个顶着炸毛发型傻fufu的呆瓜。", photo: "photos/r26-0929.webp", dateOnly: true },
      { title: "", date: "2026.09.29", text: "在亚庇看海看日落，把最浪漫的一个吻留在了丹绒亚路的桨板上。", photo: "photos/r26-0929b.webp", dateOnly: true },
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
      { date: "2024-10-30", print: "photos/ann-2024.webp", caption: ["2024.10.30", "两周年"] },
      { date: "2025-10-30", print: "photos/ann-2025.webp", caption: ["2025.10.30", "三周年"] },
      { date: "2026-10-30", print: null, caption: ["2026.10.30", "四周年"] },   // 这一天还没拍：一直是未显影的拍立得
    ],
  },

  // 最后的信封

  finale: {
    // 结尾的歌：密码一对上就换成这首（不管之前在放什么）。把音频放进 audio/ 并在 src 填文件名即可；src 为空则不换歌
    music: { src: "audio/polaris.mp3", title: "ポラリス", artist: "Aimer", volume: 0.7 },
    lockedTitle: "NEXT CHAPTER",
    code: "411223",            // 隐藏页密码（几位数字都可以，圆点个数会自动跟着变）
    seal: "4",                 // 火漆印上的字（1–2 个字符最好看）
    letterTitle: "给夏天的信",
    // 每一段放一个字符串，用逗号隔开（最后一句如果和 closing 相同，会用斜体单独显示）
    letter: [
      "夏夏：",
      "做这个网站的时候，我好像又把我们这四年重新过了一遍。",
      "从最初隔着北京和重庆，为了见上一面来回奔波，到后来终于住在一起，把那些曾经盼了很久的日子，过成了如今再平常不过的生活。",
      "翻着照片，还是会忍不住笑。第一次见面就找错酒店的笨蛋，来北京差点冻成冰棍的小土豆，陪我逛街逛到生无可恋的傻狗……真没想到，我居然会这么喜欢这个傻乎乎的人。",
      "四年里，我们从最初的心动，走进了真实而琐碎的生活，也渐渐看见了彼此更多的样子。",
      "你有自己的脾气、固执和不擅长的事，我也没有那么好相处。我们会有分歧，会不理解对方，也难免让彼此失望。",
      "但我慢慢明白，爱不是找到一个永远符合自己期待的人，而是放下那些理想化的想象，真正看见并珍惜眼前的你。",
      "我希望你在我面前可以放心地做自己，不必永远温柔、懂事，也不必总为了迁就我而委屈自己。你可以有自己的坚持、热爱和快乐，就像我也希望自己所有不那么可爱的样子，都能被你看见和理解。",
      "我们不必把彼此变成更符合自己想象的人。我希望你幸福，希望你一直是你自己。而我有一点小小的私心，希望你的幸福里，也一直有我。",
      "未来我们或许会搬去另一座城市，会为了生活琐事烦恼，也会慢慢变成和现在不同的人。但我依然期待和你一起经历这一切，去更多没去过的地方，也在家里心安理得地虚度无数个周末。",
      "四年前，我因为心动而走近你。",
      "四年后，我知道自己在选择谁。",
      "我选择的是我已经认识的、还有许多尚未认识的，完整的你。",
      "四周年快乐，我的小夏天。",
      "下一章，我们一起写。❤️",
      "I choose you in all my choices.",
    ],
    closingLetter: "I choose you in all my choices.",
    closingLetterZh: "在所有的选择里，我都选择你。",
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
    wedding: null,   // 婚礼拍立得已撤：不想在信前面放一张「待解锁」
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
    cover: { title: ["1461 DAYS", "WITH YOU"], author: "Summer & Helios", quote: "I would choose you in every version of my life.", by: "— Helios", imprint: "2022.10.30 – 2026.10.30 · Vol. 04" },
    closing: "I would choose you in every version of my life.",
    heartLine: "Four years down. A lifetime of little adventures to go.",
  },
};
