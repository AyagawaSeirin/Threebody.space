/**
 * 《我的三体》四季资料。
 * 数字全部来自维基百科 / 豆瓣 / 哔哩哔哩 / 新浪的公开报道，
 * 这里不添加任何查不到出处的数（播放量、粉丝数、制作费用一概没有）。
 */

export interface Season {
  /** 开播年份，等宽大字显示——这是真数据，允许显眼 */
  year: string
  title: string
  /** 集数，含单位 */
  episodes: string
  /** 首播日期，ISO，用于 <time datetime> */
  premiere: string
  premiereText: string
  /** 完结日期，ISO */
  finale: string
  finaleText: string
  /** 改编范围 */
  adapts: string
  /** 站主视角的一句话，不吹不煽 */
  note: string
  /** 主题曲：曲名与演唱者，没有就不写 */
  theme?: { title: string; by: string }
  /** 评分，注明来源与查询日期 */
  ratings?: { site: string; score: string }[]
  /** 制作人员，只写公开署名的 */
  credits?: string
}

export const DIRECTOR = {
  alias: '神游八方',
  name: '李圳宜',
  intro:
    '2014 年，他在哔哩哔哩用《我的世界》录制《三体》同人动画。第一集除配音外只有他一个人，改编、执镜、世界架构都是自己做。',
}

export const SEASONS: Season[] = [
  {
    year: '2014',
    title: '我的三体',
    episodes: '11 集',
    premiere: '2014',
    premiereText: '2014 年',
    finale: '2015-10-06',
    finaleText: '2015 年 10 月 6 日',
    adapts: '改编《地球往事》',
    note: '前 8 集受《我的世界》引擎所限，画质粗糙；第 9 集起转 C4D 三维动画。',
  },
  {
    year: '2016',
    title: '我的三体之罗辑传',
    episodes: '11 话',
    premiere: '2016-06-09',
    premiereText: '2016 年 6 月 9 日',
    finale: '2018-03-05',
    finaleText: '2018 年 3 月 5 日',
    adapts: '改编《黑暗森林》罗辑线',
    note: '自第二季第三集之后获得原作改编授权。光影、人物表情与口型都是从这一季开始认真做的。',
    theme: { title: '黑暗森林', by: '云翼星辰' },
    ratings: [
      { site: '哔哩哔哩', score: '9.9' },
      { site: '豆瓣', score: '9.5' },
    ],
  },
  {
    year: '2020',
    title: '我的三体之章北海传',
    episodes: '9 集',
    premiere: '2020-01-21',
    premiereText: '2020 年 1 月 21 日',
    finale: '2020-03-10',
    finaleText: '2020 年 3 月 10 日',
    adapts: '改编《黑暗森林》章北海线',
    note: '末日之战第一次被影视化，是这个系列做出来的。',
    theme: { title: '夜航星', by: '不才' },
    credits: '导演李圳宜，编剧冯筱扬',
    ratings: [
      { site: '哔哩哔哩', score: '9.9' },
      { site: '豆瓣', score: '9.6' },
    ],
  },
  {
    year: '2024',
    title: '我的三体（第四季）',
    episodes: '9 集',
    premiere: '2024-07-14',
    premiereText: '2024 年 7 月 14 日',
    finale: '2024-09-01',
    finaleText: '2024 年 9 月 1 日',
    adapts: '改编《死神永生》前半，到威慑纪元结束',
    note: '不再按人物传记编排。到这一季只剩角色还是方块人，其余按正常三维建模的质感做，方块人身上的像素色块也少了，棱角柔化。',
  },
]

/** 评分的出处与查询日期，写在评分旁边，不让数字裸奔 */
export const RATING_SOURCE = {
  text: '评分取自哔哩哔哩番剧页与豆瓣条目',
  checkedOn: '2026 年 8 月 27 日',
}

/** B 站国创榜的公开事实 */
export const RANK_FACT =
  '哔哩哔哩国创区评分 9.9 的作品只有 5 部，这个系列占了两席。'

/** 情感落点。不回避，也不煽情。 */
export const DISBANDED = '2024 年底，制作团队解散。'

export interface ExternalLink {
  label: string
  href: string
  note?: string
}

export const OFFICIAL_LINKS: ExternalLink[] = [
  {
    label: '哔哩哔哩 · 我的三体',
    href: 'https://www.bilibili.com/bangumi/media/md28223557',
    note: '第一季',
  },
  {
    label: '哔哩哔哩 · 我的三体之罗辑传',
    href: 'https://www.bilibili.com/bangumi/media/md28223558',
    note: '第二季',
  },
  {
    label: '哔哩哔哩 · 我的三体之章北海传',
    href: 'https://www.bilibili.com/bangumi/media/md28223066',
    note: '第三季',
  },
  {
    label: '哔哩哔哩 · 我的三体 第四季',
    href: 'https://www.bilibili.com/bangumi/media/md21083515',
    note: '第四季',
  },
  {
    label: '豆瓣 · 我的三体之罗辑传',
    href: 'https://movie.douban.com/subject/30272798/',
  },
  {
    label: '豆瓣 · 我的三体之章北海传',
    href: 'https://movie.douban.com/subject/34892096/',
  },
]
