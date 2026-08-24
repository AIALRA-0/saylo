import type { ExpressionCard } from '../types'
import { everydayExpansionSeeds } from './everydayExpansionSeeds'

type DefaultedField = 'variants' | 'scenes' | 'relationship' | 'register' | 'risk' | 'production' | 'tone' | 'literalMeaning' | 'origin' | 'originConfidence' | 'spread' | 'category' | 'currency' | 'contrast' | 'evidenceSourceIds' | 'caution' | 'neutralAlternatives' | 'review' | 'keywords'
export type CardSeed = Omit<ExpressionCard, DefaultedField> & Partial<Pick<ExpressionCard, DefaultedField>>

const categoryForModule = (moduleId: string): ExpressionCard['category'] => {
  if (moduleId === 'abbrev') return '网络缩写'
  if (moduleId === 'gaming') return '游戏用语'
  if (moduleId === 'rough') return '粗俗表达'
  if (moduleId === 'culture') return '文化语境'
  if (['internet', 'current'].includes(moduleId)) return '网络俚语'
  return '日常表达'
}

const sourcesForModule = (moduleId: string) => {
  if (moduleId === 'open-close') return ['cambridge-functions', 'british-speaking']
  if (moduleId === 'clarification') return ['british-speaking', 'cambridge-spoken']
  if (moduleId === 'conversation') return ['cambridge-discourse', 'cambridge-chunks']
  if (moduleId === 'requests') return ['british-favour', 'cambridge-offers']
  if (moduleId === 'messaging') return ['cambridge-spoken', 'british-speaking']
  if (moduleId === 'support') return ['british-news', 'british-speaking']
  if (moduleId === 'softening') return ['cambridge-discourse', 'cambridge-spoken']
  if (moduleId === 'service') return ['cambridge-functions', 'cambridge-offers']
  if (moduleId === 'daily-state') return ['cambridge-spoken', 'british-speaking']
  if (moduleId === 'small-talk') return ['british-speaking', 'cambridge-spoken']
  if (moduleId === 'thanks-repair') return ['british-news', 'cambridge-functions']
  if (moduleId === 'suggestions') return ['cambridge-functions', 'british-speaking']
  if (moduleId === 'timing') return ['cambridge-discourse', 'british-favour']
  if (moduleId === 'gaming') return ['mw-gaming', 'riot-pact']
  if (moduleId === 'rough') return ['mw-slang-index']
  if (moduleId === 'culture') return ['language-jones-aave', 'mw-slang-index']
  if (['internet', 'current', 'abbrev'].includes(moduleId)) return ['mw-slang-index', 'mw-internet']
  return ['mw-slang-method']
}

// 核心库的字面层单独编辑，避免把“功能解释”重复当成“字面怎么来”
const literalOverrides: Record<string, string> = {
  'sounds-good': 'sounds 是“听起来”，good 是“不错”；整句先评价一个提议听起来不错，再引申为接受安排',
  'works-for-me': 'work for someone 字面是“对某人可行或起作用”，这里指时间、方案符合自己的条件',
  'my-bad': 'bad 在这里名词化为“错误”，my bad 直接把错误归到自己身上',
  'fair-enough': 'fair 是“合理或公平”，enough 是“足够”；合起来表示对方的理由已经合理到可以接受',
  'i-feel-you': '字面是“我感受到你”，实际把感受对象从事情转到对方处境，表示我懂你的感觉',
  'you-good': '由 Are you good? 省略 are 形成，字面询问“你还好吗或准备好了吗”',
  'no-worries': 'worries 是需要担心的事，no worries 字面表示“没有需要担心的事”',
  'im-down': 'down 在这个固定结构中表示愿意参与；不能按“我在下方”逐词翻译',
  'hit-me-up': 'hit 原本是“碰到”，hit someone up 固定为之后联系、发消息或提出请求',
  'pull-up': 'pull up 原本表示车辆停靠或人靠近，口语中扩展为到场、过来',
  'hang-out': 'hang 原本是悬挂，hang out 固定为没有正式目的地待在一起、消磨时间',
  'grab-a-bite': 'grab 是快速拿取，a bite 是一口食物；合起来表示随便快速吃点东西',
  'bail': 'bail 原有从困境中脱身的含义，口语动词扩展为临时退出、离开或取消',
  'flake': 'flake 原指薄片或容易脱落的东西，人物用法隐喻不可靠、容易临时消失',
  'rain-check': '原指因下雨取消比赛后可改日使用的票，后来扩展为这次不行、改天再约',
  'im-game': 'game 在旧用法中可表示愿意尝试、敢于参加，I’m game 就是“我愿意加入”',
  'lowkey': 'low-key 原指低调、克制；程度副词用法把它变成“有点、私下说、其实”',
  'highkey': '仿照 lowkey 形成的对比词，字面把程度调高，表示公开、明显或非常',
  'no-cap': 'cap 在该用法中指夸大或假话，no cap 字面表示“没有夸张、没有说假话”',
  'for-real': 'real 是真实，for real 固定为“真的、认真地”，升调时可追问真假',
  'wild': '原义是野生、失控；人物和事件评价中引申为离谱、难以置信',
  'valid': '原义是有效、站得住脚；短回应中表示某个观点或感受可以理解',
  'hard-pass': 'pass 是跳过或拒绝，hard 加强拒绝力度，合起来是“坚决跳过”',
  'say-less': '字面是“少说一点”，实际表示已经懂了，无需继续解释',
  'sus': 'suspicious 或 suspect 的截短，字面就是“可疑”',
  'mid': '原本是 middle 的截短，表示处在中间水平，评价中引申为普通、令人失望',
  'a-win': 'win 原本是胜利，a W 用字母代表 win，表示好结果或值得肯定的事',
  'cooked': '原义是被煮熟；人或局面用法隐喻已经耗尽、完蛋或无力挽回',
  'let-him-cook': '字面是“让他继续烹饪”，隐喻让某人把想法或表现完整做完再判断',
  'touch-grass': '字面是去户外摸草，讽刺某人离开网络、回到现实生活',
  'rent-free': '字面是某人免费住在你的房子里，隐喻一个念头免费占据你的脑海',
  'caught-4k': '4K 指高清画面，caught in 4K 隐喻证据清楚到无法否认',
  'vibe': 'vibration 的缩略，原指振动，后来表示环境或人带来的整体感觉',
  'ghosted': 'ghost 原指幽灵，动词用法把突然断联的人比作无声消失的幽灵',
  'shoot-your-shot': '字面是在篮球中投篮，隐喻抓住机会表达好感或提出请求',
  'down-bad': 'down 表示处境低落，bad 加强程度，合起来指非常窘迫、渴望或失态',
  'red-flag': '字面是危险警示旗，关系语境中表示需要警惕的行为信号',
  'green-flag': '仿照红旗形成的正面信号，绿色表示可以继续或值得放心',
  'main-character': '字面是故事主角，用来评价某人像把所有事情都围绕自己展开',
  'the-ick': 'ick 是厌恶声，名词化后表示对某人突然产生的强烈倒胃口感',
  'its-giving': '字面结构省略了 vibe 或 energy，表示某事“散发出某种感觉”',
  'ate': '原义是 eat 的过去式；表现评价中隐喻把任务彻底吃下、完成得非常好',
  'period': '原指句号；句末单独使用时把观点标记为已经结束、不再争论',
  'pressed': '原义是被压住，人物状态中引申为被某事压得焦躁、过度在意',
  'salty': '原义是咸；情绪评价中引申为因失败或冒犯而苦涩、不爽',
  'flex': '原义是弯曲并绷紧肌肉，后引申为展示力量、财富或成就',
  'bougie': '来自 bourgeois 的发音和拼写变化，用来评价讲究、昂贵或装腔',
  'extra': '原义是额外的，人物评价中表示反应或表现超出场景需要',
  'spill-tea': 'tea 在相关社群用法中指真相或内情，spill the tea 字面像把内情倒出来',
  'read-room': '字面是“阅读房间”，实际是观察现场气氛、关系和他人反应',
  'call-out': '字面是把问题喊出来，实际指公开指出某人的行为或说法',
  'clocked': 'clock 作动词可表示注意到、记录到，口语中扩展为准确识破细节',
  'shade': 'shade 原义是阴影，社交用法表示不直接点明的轻蔑或贬低',
  'receipts': '原义是购物收据，网络争议中隐喻可核查的聊天记录或证据',
  'messy': '原义是凌乱，人物和事件评价中引申为关系复杂、充满戏剧冲突',
  'dragged': 'drag 原义是拖拽，人物评价中隐喻被公开连续猛烈批评',
  'delulu': 'delusional 的戏谑截短和叠音写法，表示不现实或带自嘲的幻想',
  'yapping': 'yap 原指小狗尖叫，人物用法把冗长讲话比作不停叫',
  'locked-in': '字面是被锁定在某处，表现用法表示注意力锁定在目标上',
  'lore': '原义是一套传说或知识，网络用法把个人和群体往事当作世界观背景',
  'aura': '原义是环绕人的气息或氛围，网络用法把气场游戏化成可加减的分数',
  'crash-out': 'crash 是撞毁或突然崩溃，out 加强状态变化，表示失控到可能毁掉后果',
  'standing-business': 'stand on 表示坚持不退，business 指自己说过要做的事，合起来是兑现立场和承诺',
  'type-thing': 'type 是类型，thing 是模糊事物，合起来概括“这一类东西或安排”',
}

const contextualOrigin = (seed: CardSeed) => {
  if (/普通|广泛英语|美国口语|休闲口语/.test(seed.provenance)) {
    return `${seed.phrase} 由普通英语词汇在日常会话中逐渐固定，现有资料没有把它可靠归于单一创造者或特定社群`
  }
  return seed.provenance
}

// 默认值只覆盖低风险日常口语，来源敏感或容易冒犯的表达必须在卡片中显式改写风险字段
const define = (seed: CardSeed): ExpressionCard => ({
  variants: [],
  scenes: ['朋友闲聊'],
  relationship: '朋友、熟人或友好同事',
  register: '通用口语',
  risk: 'green',
  production: '主动使用',
  tone: '自然、轻松',
  literalMeaning: seed.literalMeaning ?? literalOverrides[seed.id] ?? `${seed.phrase} 的字面结构需要结合固定搭配理解，当前卡片功能是${seed.function}`,
  origin: seed.origin ?? contextualOrigin(seed),
  originConfidence: seed.originConfidence ?? (/普通|广泛英语|美国口语|休闲口语/.test(seed.provenance) ? '尚不明确' : '较可信'),
  spread: '当代美国英语中广泛使用',
  category: categoryForModule(seed.module),
  currency: ['internet', 'current', 'abbrev'].includes(seed.module) ? '当前流行' : '长期通用',
  contrast: seed.neutralAlternatives?.[0] ?? '根据关系和场景改用更明确的中性表达',
  evidenceSourceIds: sourcesForModule(seed.module),
  caution: '正式文件和严肃汇报中换用更明确的表达',
  neutralAlternatives: [],
  review: {
    prompt: seed.prompt,
    modelAnswer: seed.examples[0].line,
    acceptableAnswers: [seed.phrase, ...(seed.variants ?? [])],
    explanation: `${seed.phrase} 在这个场景中用来${seed.function}`,
  },
  keywords: [],
  ...seed,
})

// 内容库按照语用功能分组，每张卡都给出安全替代和能够直接模仿的完整句子
export const expressions: ExpressionCard[] = [
  define({
    id: 'sounds-good', phrase: 'Sounds good', meaning: '表示接受建议或安排', function: '接受安排', module: 'flow',
    provenance: '普通会话表达', neutralAlternatives: ['That works for me', 'I agree with that'],
    examples: [{ context: '朋友改约见时间', line: 'Seven instead of six? Sounds good.', translation: '六点改七点？可以' }],
    prompt: '朋友提议把晚餐改到七点，请自然接受', keywords: ['sounds good'],
  }),
  define({
    id: 'works-for-me', phrase: 'Works for me', meaning: '表示某个安排符合自己的时间或需求', function: '确认可行', module: 'flow',
    provenance: '普通会话表达', neutralAlternatives: ['That time is fine for me'],
    examples: [{ context: '同事确认会议时间', line: 'A quick call after lunch works for me.', translation: '午饭后快速通话，我可以' }],
    prompt: '同事问下午两点开会是否方便，请确认', keywords: ['works for me'],
  }),
  define({
    id: 'my-bad', phrase: 'My bad', meaning: '简短承认自己的小错误', function: '承担责任', module: 'flow',
    provenance: '美国口语表达，已经广泛传播', neutralAlternatives: ['That was my mistake', 'Sorry about that'],
    caution: '错误造成明显损失时，需要补充完整道歉和补救行动',
    examples: [{ context: '误拿朋友的饮料', line: 'Oh, that one was yours? My bad.', translation: '那杯是你的？我的错' }],
    prompt: '你发错了群聊链接，请简短承认', keywords: ['my bad'],
  }),
  define({
    id: 'fair-enough', phrase: 'Fair enough', meaning: '表示对方的理由可以理解，即使自己未必完全同意', function: '承认合理性', module: 'flow',
    provenance: '普通英语会话表达', neutralAlternatives: ['I can understand that'],
    examples: [{ context: '朋友解释为什么早走', line: 'You have an early flight? Fair enough.', translation: '你明早赶飞机？那可以理解' }],
    prompt: '朋友因为早班飞机拒绝续摊，请表示理解', keywords: ['fair enough'],
  }),
  define({
    id: 'i-feel-you', phrase: 'I feel you', meaning: '表示理解对方的感受或处境', function: '共情回应', module: 'flow',
    provenance: '非裔美国英语中有长期使用，当前已经进入广泛口语', neutralAlternatives: ['I know what you mean', 'I understand how that feels'],
    risk: 'yellow', production: '观察后使用',
    examples: [{ context: '朋友抱怨工作太累', line: 'I feel you. This week has been brutal.', translation: '我懂，这周真的太累了' }],
    prompt: '朋友说最近工作让人筋疲力尽，请先共情', keywords: ['i feel you', 'feel you'],
  }),
  define({
    id: 'you-good', phrase: 'You good?', meaning: '根据语气询问对方是否没事、是否准备好或是否需要帮助', function: '快速确认状态', module: 'flow',
    provenance: '美国口语中的省略式问句', neutralAlternatives: ['Are you okay?', 'Do you need anything?'],
    tone: '关心或轻度质疑，含义由语调决定',
    examples: [{ context: '朋友差点摔倒', line: 'Whoa—you good?', translation: '哇，你没事吧' }],
    prompt: '朋友被门槛绊了一下，请确认对方状态', keywords: ['you good'],
  }),
  define({
    id: 'no-worries', phrase: 'No worries', meaning: '表示对方无需担心或道歉', function: '缓和气氛', module: 'flow',
    provenance: '广泛英语口语表达', neutralAlternatives: ['It is okay', 'No problem'],
    examples: [{ context: '同事晚回消息', line: 'No worries—I figured you were busy.', translation: '没事，我猜你在忙' }],
    prompt: '同事为回复慢道歉，请友好回应', keywords: ['no worries'],
  }),
  define({
    id: 'im-down', phrase: "I'm down", variants: ['Down for that'], meaning: '表示愿意参加或尝试', function: '接受邀约', module: 'flow',
    provenance: '美国休闲口语', neutralAlternatives: ["I'd like to join", 'That sounds fun'], register: '熟人休闲',
    examples: [{ context: '朋友提议看电影', line: "A late movie? I'm down.", translation: '看午夜场？我参加' }],
    prompt: '朋友问你要不要去看午夜场，请接受', keywords: ["i'm down", 'im down', 'down for that'],
  }),

  define({
    id: 'hit-me-up', phrase: 'Hit me up', variants: ['HMU'], meaning: '请对方之后联系自己', function: '邀请联系', module: 'plans',
    provenance: '美国休闲口语，HMU 常见于文字消息', neutralAlternatives: ['Message me', 'Let me know'], register: '熟人休闲',
    examples: [{ context: '朋友还没确定时间', line: 'Hit me up when you know your schedule.', translation: '时间定了就联系我' }],
    prompt: '朋友还没确定周末时间，请对方确定后联系', keywords: ['hit me up', 'hmu'],
  }),
  define({
    id: 'pull-up', phrase: 'Pull up', meaning: '来到某个地点或加入活动', function: '随意邀约', module: 'plans',
    provenance: '非裔美国英语和嘻哈文化中长期可见，当前在年轻人口语中传播', neutralAlternatives: ['Come over', 'Join us'], risk: 'yellow', production: '观察后使用', register: '熟人休闲',
    caution: '只适合熟悉关系；某些语境可能带有对峙意味',
    examples: [{ context: '朋友家里有小型聚会', line: 'We’re at Maya’s place. Pull up if you’re free.', translation: '我们在 Maya 家，有空就过来' }],
    prompt: '你们在朋友家聚会，请随意邀请另一位熟人', keywords: ['pull up'],
  }),
  define({
    id: 'hang-out', phrase: 'Hang out', meaning: '轻松地一起消磨时间', function: '普通邀约', module: 'plans',
    provenance: '广泛英语口语表达', neutralAlternatives: ['Spend some time together'],
    examples: [{ context: '约朋友周末见面', line: 'Want to hang out this weekend?', translation: '这周末想一起玩吗' }],
    prompt: '请朋友周末轻松见面', keywords: ['hang out'],
  }),
  define({
    id: 'grab-a-bite', phrase: 'Grab a bite', meaning: '随便吃点东西', function: '轻松邀约', module: 'plans',
    provenance: '广泛英语口语表达', neutralAlternatives: ['Get something to eat'],
    examples: [{ context: '下班后有点饿', line: 'Want to grab a bite before we head home?', translation: '回家前要不要吃点东西' }],
    prompt: '下班后邀请同事吃点东西', keywords: ['grab a bite'],
  }),
  define({
    id: 'bail', phrase: 'Bail', variants: ['Bail on'], meaning: '临时退出活动或放弃计划', function: '描述取消', module: 'plans',
    provenance: '美国休闲口语', neutralAlternatives: ['Cancel', 'Leave early'], register: '熟人休闲', tone: '可能带一点不满',
    examples: [{ context: '自己状态不好', line: 'I hate to bail, but I need to rest tonight.', translation: '我不想临时取消，但今晚需要休息' }],
    prompt: '你身体不舒服，需要礼貌取消今晚计划', keywords: ['bail'],
  }),
  define({
    id: 'flake', phrase: 'Flake', variants: ['Flake on someone'], meaning: '答应后临时爽约，常暗示这种行为让人失望', function: '评价爽约', module: 'plans',
    provenance: '美国口语', neutralAlternatives: ['Cancel at the last minute'], register: '熟人休闲', risk: 'yellow', production: '观察后使用',
    caution: '直接称呼某人为 flake 容易显得指责',
    examples: [{ context: '朋友连续取消', line: 'He flaked again at the last minute.', translation: '他又在最后一刻爽约了' }],
    prompt: '描述某人连续两次在最后一刻取消', keywords: ['flake', 'flaked'],
  }),
  define({
    id: 'rain-check', phrase: 'Take a rain check', variants: ['Rain check?'], meaning: '这次无法参加，希望以后补上', function: '礼貌改约', module: 'plans',
    provenance: '美国英语中的固定表达', neutralAlternatives: ['Can we do it another time?'],
    examples: [{ context: '拒绝今晚吃饭', line: 'Can I take a rain check? I’m wiped out.', translation: '能改天吗？我累坏了' }],
    prompt: '你今晚太累，请提出改天再约', keywords: ['rain check'],
  }),
  define({
    id: 'im-game', phrase: "I'm game", meaning: '愿意参加某个活动或尝试某件事', function: '积极接受', module: 'plans',
    provenance: '广泛英语口语表达', neutralAlternatives: ["I'm interested", "I'd be happy to"],
    examples: [{ context: '朋友提议去远足', line: "An easy trail on Sunday? I'm game.", translation: '周日走一条轻松路线？我参加' }],
    prompt: '朋友提议周日远足，请积极接受', keywords: ["i'm game", 'im game'],
  }),

  define({
    id: 'lowkey', phrase: 'Low-key', variants: ['Lowkey'], meaning: '轻度、低调或有点不愿公开地表达态度', function: '降低表达强度', module: 'stance',
    provenance: 'low-key 原有低调含义，副词式用法在年轻人口语和网络中广泛传播', neutralAlternatives: ['Honestly, a little', 'Kind of'], register: '熟人休闲',
    examples: [{ context: '承认自己喜欢一首老歌', line: 'I low-key love this song.', translation: '我其实有点喜欢这首歌' }],
    prompt: '你有点喜欢大家正在吐槽的电影，请表达', keywords: ['low-key', 'lowkey'],
  }),
  define({
    id: 'highkey', phrase: 'High-key', variants: ['Highkey'], meaning: '公开而强烈地表达态度', function: '提高表达强度', module: 'stance',
    provenance: '由 low-key 对比形成的年轻人口语和网络用法', neutralAlternatives: ['Honestly, very much', 'Definitely'], register: '熟人休闲',
    examples: [{ context: '非常期待演唱会', line: 'I’m high-key excited for Friday.', translation: '我真的非常期待周五' }],
    prompt: '你非常期待朋友的生日聚会，请表达', keywords: ['high-key', 'highkey'],
  }),
  define({
    id: 'no-cap', phrase: 'No cap', meaning: '强调自己没有夸张或说谎', function: '强调真实', module: 'stance',
    provenance: '来自非裔美国英语和嘻哈文化，之后在网络和年轻人口语中广泛传播', neutralAlternatives: ['Seriously', "I'm not exaggerating"], risk: 'yellow', production: '观察后使用', register: '熟人休闲',
    caution: '避免为了模仿某个族群而改变口音或密集堆叠来源相同的表达',
    examples: [{ context: '强烈推荐一家店', line: 'That was the best ramen I’ve had—no cap.', translation: '那是我吃过最好的拉面，真没夸张' }],
    prompt: '非常真诚地推荐一家拉面店', keywords: ['no cap'],
  }),
  define({
    id: 'for-real', phrase: 'For real', variants: ['For real?'], meaning: '表示认真同意，或询问消息是否真实', function: '强调或确认', module: 'stance',
    provenance: '美国口语中广泛使用，在非裔美国英语中也很常见', neutralAlternatives: ['Seriously', 'Is that true?'],
    examples: [{ context: '确认朋友真的辞职了', line: 'Wait, you quit? For real?', translation: '等等，你辞职了？真的？' }],
    prompt: '朋友说自己中了大奖，请惊讶确认', keywords: ['for real'],
  }),
  define({
    id: 'wild', phrase: 'That’s wild', meaning: '对惊人、荒唐或难以置信的事情作出反应', function: '惊讶回应', module: 'stance',
    provenance: '广泛美国口语', neutralAlternatives: ["That's unbelievable", "That's surprising"],
    examples: [{ context: '听到离奇通勤经历', line: 'Three canceled trains? That’s wild.', translation: '三班车都取消了？太离谱了' }],
    prompt: '朋友说航班连续取消三次，请回应', keywords: ["that's wild", 'thats wild', 'wild'],
  }),
  define({
    id: 'valid', phrase: 'Valid', variants: ["That's valid"], meaning: '认可某个感受、选择或观点有道理', function: '表示认可', module: 'stance',
    provenance: '普通词汇在网络和年轻人口语中形成简短回应', neutralAlternatives: ["That's reasonable", 'I understand that'], register: '熟人休闲',
    examples: [{ context: '朋友不想参加拥挤活动', line: 'Crowds stress you out? That’s valid.', translation: '人多会让你焦虑？完全可以理解' }],
    prompt: '朋友因为怕拥挤拒绝音乐节，请表示理解', keywords: ['valid'],
  }),
  define({
    id: 'hard-pass', phrase: 'Hard pass', meaning: '明确而带口语色彩地拒绝', function: '强烈拒绝', module: 'stance',
    provenance: '美国口语和网络表达', neutralAlternatives: ['Absolutely not for me', 'I’ll pass'], register: '熟人休闲', tone: '明确、略带幽默',
    caution: '针对他人认真提议时可能显得生硬',
    examples: [{ context: '朋友提议坐过山车', line: 'That giant drop? Hard pass.', translation: '那个超高俯冲？坚决不坐' }],
    prompt: '朋友提议尝试你很害怕的过山车，请拒绝', keywords: ['hard pass'],
  }),
  define({
    id: 'say-less', phrase: 'Say less', meaning: '表示已经理解并愿意行动，无需继续解释', function: '快速接受', module: 'stance',
    provenance: '在非裔美国英语中长期可见，随后在网络和年轻人口语中扩散', neutralAlternatives: ['Got it', "I'm in"], risk: 'yellow', production: '观察后使用', register: '熟人休闲',
    examples: [{ context: '朋友说有免费演出票', line: 'Free tickets? Say less. I’m on my way.', translation: '免费票？懂了，我马上来' }],
    prompt: '朋友说手里有两张免费票，请立刻接受', keywords: ['say less'],
  }),

  define({
    id: 'sus', phrase: 'Sus', meaning: '可疑、不太可信，来自 suspicious 的缩略', function: '表达怀疑', module: 'internet',
    provenance: '早期已见于口语，游戏和网络文化进一步普及', neutralAlternatives: ['Suspicious', "That doesn't add up"], register: '网络语境',
    examples: [{ context: '收到奇怪链接', line: 'That link looks sus. Don’t open it.', translation: '那个链接很可疑，别打开' }],
    prompt: '朋友发来一个陌生的短链接，请表达怀疑', keywords: ['sus'],
  }),
  define({
    id: 'mid', phrase: 'Mid', meaning: '评价某样东西表现普通或令人失望', function: '负面评价', module: 'internet',
    provenance: '嘻哈和网络语境推动了当前用法', neutralAlternatives: ['Average', 'Underwhelming'], register: '网络语境', risk: 'yellow', production: '观察后使用', tone: '轻蔑或调侃',
    caution: '直接评价他人的作品或外貌容易伤人',
    examples: [{ context: '朋友问一部电影如何', line: 'Honestly, the movie was kind of mid.', translation: '说实话，那部电影挺一般' }],
    prompt: '朋友问热门电影如何，你觉得很普通', keywords: ['mid'],
  }),
  define({
    id: 'a-win', phrase: 'A W', variants: ['Big W', 'Huge W', 'Take the W'], meaning: '胜利、好结果或值得肯定的事情，W 代表 win', function: '庆祝结果', module: 'internet',
    provenance: '体育、游戏和网络文化中的缩写用法', neutralAlternatives: ['A win', 'Great result'], register: '网络语境',
    examples: [{ context: '朋友拿到实习', line: 'You got the offer? That’s a huge W.', translation: '你拿到录取了？大胜利' }],
    prompt: '朋友拿到理想实习，请庆祝', keywords: ['a w', 'big w', 'huge w', 'take the w'],
  }),
  define({
    id: 'cooked', phrase: 'Cooked', meaning: '陷入困境、精疲力尽或基本没救了', function: '夸张描述困境', module: 'internet',
    provenance: '烹饪隐喻在网络和年轻人口语中广泛传播', neutralAlternatives: ["I'm in trouble", "I'm exhausted"], register: '网络语境',
    examples: [{ context: '考试完全没准备', line: 'The exam is tomorrow and I haven’t started. I’m cooked.', translation: '明天考试我还没开始，我完了' }],
    prompt: '明天考试，你完全没复习，请夸张描述', keywords: ["i'm cooked", 'im cooked', 'cooked'],
  }),
  define({
    id: 'let-him-cook', phrase: 'Let them cook', variants: ['Let him cook', 'Let her cook'], meaning: '让某人继续发挥，先看看结果', function: '鼓励等待', module: 'internet',
    provenance: '烹饪和表现类比通过体育、音乐与网络迷因传播', neutralAlternatives: ['Give them a chance', 'Let them finish'], register: '网络语境',
    examples: [{ context: '朋友质疑一个大胆想法', line: 'It sounds strange, but let her cook.', translation: '听起来奇怪，但先让她发挥' }],
    prompt: '朋友质疑另一个人的创意，请劝他先等等', keywords: ['let him cook', 'let her cook', 'let them cook'],
  }),
  define({
    id: 'touch-grass', phrase: 'Touch grass', meaning: '让沉迷网络或脱离现实的人暂时离线', function: '调侃提醒', module: 'internet',
    provenance: '网络文化表达', neutralAlternatives: ['Take a break from the internet', 'Get some fresh air'], register: '网络语境', risk: 'yellow', production: '观察后使用', tone: '嘲讽',
    caution: '对陌生人或情绪低落的人使用容易形成攻击',
    examples: [{ context: '好友连续争论一整夜', line: 'You’ve been arguing for six hours. Please touch grass.', translation: '你争了六小时，去线下透透气吧' }],
    prompt: '熟人连续刷评论六小时，请用玩笑口吻劝停', keywords: ['touch grass'],
  }),
  define({
    id: 'rent-free', phrase: 'Living rent-free', meaning: '某人或某事一直占据脑海', function: '描述反复惦记', module: 'internet',
    provenance: '网络迷因表达', neutralAlternatives: ["I can't stop thinking about it"], register: '网络语境',
    examples: [{ context: '一段台词挥之不去', line: 'That line has been living rent-free in my head all week.', translation: '那句台词在我脑子里待了一整周' }],
    prompt: '描述一首歌在脑中循环一周', keywords: ['rent-free', 'rent free'],
  }),
  define({
    id: 'caught-4k', phrase: 'Caught in 4K', meaning: '有清晰证据证明某人当场被抓包', function: '指出证据', module: 'internet',
    provenance: '高清视频术语形成的网络迷因', neutralAlternatives: ['Caught with clear evidence'], register: '网络语境', risk: 'yellow', production: '观察后使用',
    caution: '涉及真实隐私或羞辱时停止传播影像',
    examples: [{ context: '朋友说没偷吃蛋糕但照片很清楚', line: 'You said it wasn’t you, but you got caught in 4K.', translation: '你说不是你，可照片拍得清清楚楚' }],
    prompt: '朋友否认偷吃蛋糕，但合照里证据明显', keywords: ['caught in 4k'],
  }),

  define({
    id: 'vibe', phrase: 'Vibe', variants: ['Good vibes', 'Vibe with'], meaning: '某人、地点或情境带来的整体感觉，也可表示与某人合得来', function: '描述氛围', module: 'social',
    provenance: '由 vibration 的口语缩略发展，音乐和青年文化推动传播', neutralAlternatives: ['Atmosphere', 'Get along with'],
    examples: [{ context: '评价一家咖啡店', line: 'I like the vibe here—it’s relaxed without being too quiet.', translation: '我喜欢这里的氛围，放松又不会太安静' }],
    prompt: '描述一家让你放松的咖啡店', keywords: ['vibe', 'vibes'],
  }),
  define({
    id: 'ghosted', phrase: 'Ghosted', variants: ['Ghost someone'], meaning: '在没有解释的情况下突然停止回复和联系', function: '描述失联', module: 'social',
    provenance: '数字约会和社交媒体语境推动普及', neutralAlternatives: ['Stopped replying without explanation'], register: '熟人休闲',
    examples: [{ context: '约会后对方突然失联', line: 'We went out twice, and then they ghosted me.', translation: '我们约会了两次，然后对方突然消失了' }],
    prompt: '描述约会对象突然停止回复', keywords: ['ghosted', 'ghosting', 'ghost'],
  }),
  define({
    id: 'shoot-your-shot', phrase: 'Shoot your shot', meaning: '主动尝试争取机会，常用于约会或职业机会', function: '鼓励行动', module: 'social',
    provenance: '篮球隐喻通过非裔美国英语、音乐和网络文化传播', neutralAlternatives: ['Go for it', 'Take the chance'], risk: 'yellow', production: '观察后使用', register: '熟人休闲',
    examples: [{ context: '鼓励朋友发出邀请', line: 'You like them—shoot your shot.', translation: '你喜欢对方，就试着主动一次' }],
    prompt: '朋友想邀请喜欢的人喝咖啡，请鼓励', keywords: ['shoot your shot'],
  }),
  define({
    id: 'down-bad', phrase: 'Down bad', meaning: '因为迷恋、欲望或困境而表现得很失控', function: '调侃失控状态', module: 'social',
    provenance: '嘻哈和网络文化推动当前用法', neutralAlternatives: ['Desperate', 'Really struggling'], register: '网络语境', risk: 'yellow', production: '观察后使用', tone: '调侃或贬低',
    caution: '只对能够接受玩笑的熟人使用，避免评价真实心理危机',
    examples: [{ context: '朋友为偶像排队十小时', line: 'Ten hours for a selfie? You’re down bad.', translation: '为了合照排十小时？你真上头了' }],
    prompt: '熟人为了一张合照排队十小时，请轻度调侃', keywords: ['down bad'],
  }),
  define({
    id: 'red-flag', phrase: 'Red flag', meaning: '提示潜在问题或危险的迹象', function: '指出警讯', module: 'social',
    provenance: '警示旗帜隐喻在约会和网络讨论中普及', neutralAlternatives: ['Warning sign', 'Cause for concern'],
    examples: [{ context: '讨论控制欲行为', line: 'Checking your phone without asking is a red flag.', translation: '未经同意检查手机是个危险信号' }],
    prompt: '朋友说约会对象会偷看手机，请指出问题', keywords: ['red flag'],
  }),
  define({
    id: 'green-flag', phrase: 'Green flag', meaning: '提示健康关系或良好品质的积极迹象', function: '认可积极信号', module: 'social',
    provenance: '由 red flag 对比形成的网络和约会表达', neutralAlternatives: ['A positive sign'],
    examples: [{ context: '评价对方尊重界限', line: 'They asked before inviting anyone else—that’s a green flag.', translation: '对方先问过你再邀请别人，这是个积极信号' }],
    prompt: '约会对象尊重朋友的界限，请认可', keywords: ['green flag'],
  }),
  define({
    id: 'main-character', phrase: 'Main character energy', meaning: '像故事主角一样自信、有存在感，有时也讽刺过度自我中心', function: '描述气场', module: 'social',
    provenance: '社交媒体和流行文化表达', neutralAlternatives: ['Confident presence', 'Self-centered attitude'], register: '网络语境', tone: '称赞或讽刺，取决于上下文',
    examples: [{ context: '朋友自信走进活动现场', line: 'That entrance was pure main character energy.', translation: '那个入场气场完全像主角' }],
    prompt: '朋友自信地走进派对，请夸张称赞', keywords: ['main character energy', 'main character'],
  }),
  define({
    id: 'the-ick', phrase: 'The ick', meaning: '对某人突然产生难以解释的反感', function: '描述好感消失', module: 'social',
    provenance: '真人秀、约会讨论和社交媒体推动传播', neutralAlternatives: ['A sudden turnoff'], register: '熟人休闲',
    examples: [{ context: '描述小动作让好感消失', line: 'The way he talked to the server gave me the ick.', translation: '他对服务员说话的方式让我突然反感' }],
    prompt: '描述某人对服务员失礼让你失去好感', keywords: ['the ick', 'gave me the ick'],
  }),

  define({
    id: 'its-giving', phrase: "It’s giving…", variants: ["It's giving"], meaning: '把某个造型、行为或场景概括成一种鲜明感觉', function: '创造画面感', module: 'energy',
    provenance: '源自黑人酷儿与舞厅文化的表达模式，随后进入流行网络文化', neutralAlternatives: ['It has the feel of…', 'It reminds me of…'], register: '社群敏感', risk: 'yellow', production: '观察后使用',
    caution: '用自然语气描述具体感受，避免模仿族群口音或把来源当成表演',
    examples: [{ context: '评价复古西装', line: 'The suit, the glasses—it’s giving 1970s detective.', translation: '这西装和眼镜很有七十年代侦探的感觉' }],
    prompt: '朋友穿着复古西装，请用一个画面形容', keywords: ["it's giving", 'its giving', 'it’s giving'],
  }),
  define({
    id: 'ate', phrase: 'Ate', variants: ['Ate that', 'Ate and left no crumbs'], meaning: '某人的表现非常出色', function: '强烈称赞', module: 'energy',
    provenance: '黑人酷儿与舞厅文化中的称赞用法，经流行文化和网络扩散', neutralAlternatives: ['You nailed it', 'That was excellent'], register: '社群敏感', risk: 'yellow', production: '观察后使用',
    caution: '适合熟人称赞和流行文化讨论，避免夸张模仿来源社群',
    examples: [{ context: '朋友完成精彩表演', line: 'You ate that performance up.', translation: '你那场表演太精彩了' }],
    prompt: '朋友的舞台表演很精彩，请强烈称赞', keywords: ['ate', 'ate that', 'left no crumbs'],
  }),
  define({
    id: 'period', phrase: 'Period', variants: ['Periodt'], meaning: '强调一句话已经说定，不再接受争论', function: '强调结论', module: 'energy',
    provenance: '非裔美国英语和黑人酷儿文化推动了句末强调用法，之后广泛传播', neutralAlternatives: ['End of discussion', "That's final"], register: '社群敏感', risk: 'yellow', production: '观察后使用', tone: '强势、果断',
    caution: '正式讨论或意见复杂时容易压住对话',
    examples: [{ context: '鼓励朋友承认自己的价值', line: 'You deserve better. Period.', translation: '你值得更好的，就这样' }],
    prompt: '坚定告诉朋友，对方值得被尊重', keywords: ['period', 'periodt'],
  }),
  define({
    id: 'pressed', phrase: 'Pressed', meaning: '因为某件事明显恼火、焦虑或过度在意', function: '描述在意程度', module: 'energy',
    provenance: '在非裔美国英语和网络口语中常见', neutralAlternatives: ['Upset', 'Overly bothered'], register: '熟人休闲', risk: 'yellow', production: '观察后使用', tone: '可能带嘲讽',
    caution: '直接对情绪中的人说容易升级冲突',
    examples: [{ context: '旁观某人因小事生气', line: 'Why is he so pressed about one comment?', translation: '他为什么因为一条评论这么恼火' }],
    prompt: '描述某人因为一条普通评论非常生气', keywords: ['pressed'],
  }),
  define({
    id: 'salty', phrase: 'Salty', meaning: '因为失败、批评或小事而不爽', function: '描述不满', module: 'energy',
    provenance: '美国口语和网络文化中广泛使用', neutralAlternatives: ['Bitter', 'Annoyed'], register: '熟人休闲', risk: 'yellow', production: '观察后使用', tone: '调侃',
    examples: [{ context: '朋友输游戏后抱怨', line: 'You’re still salty about that game?', translation: '你还在为那局游戏不爽吗' }],
    prompt: '熟人输掉游戏后还在抱怨，请轻度调侃', keywords: ['salty'],
  }),
  define({
    id: 'flex', phrase: 'Flex', variants: ['Weird flex'], meaning: '展示值得骄傲的东西，也可讽刺不合时宜的炫耀', function: '描述展示', module: 'energy',
    provenance: '力量展示的含义经嘻哈和网络文化扩展', neutralAlternatives: ['Show off', 'Brag'], register: '熟人休闲',
    examples: [{ context: '朋友展示亲手做的家具', line: 'Okay, building that yourself is a serious flex.', translation: '自己做出这个，确实很厉害' }],
    prompt: '朋友亲手做了一张漂亮桌子，请称赞', keywords: ['flex', 'weird flex'],
  }),
  define({
    id: 'bougie', phrase: 'Bougie', variants: ['Boujee'], meaning: '形容昂贵、讲究或刻意追求高档感', function: '评价生活方式', module: 'energy',
    provenance: '来自 bourgeois 的变化形式，非裔美国英语和嘻哈文化推动 boujee 拼法流行', neutralAlternatives: ['Fancy', 'Upscale'], register: '熟人休闲', risk: 'yellow', production: '观察后使用', tone: '称赞或调侃',
    caution: '用于评价人的阶层和消费习惯时可能带贬义',
    examples: [{ context: '咖啡店装潢很精致', line: 'This place is a little bougie, but I like it.', translation: '这里有点精致奢华，不过我喜欢' }],
    prompt: '评价一家昂贵但漂亮的咖啡店', keywords: ['bougie', 'boujee'],
  }),
  define({
    id: 'extra', phrase: 'Extra', meaning: '行为或风格比情境需要的更夸张', function: '评价夸张程度', module: 'energy',
    provenance: '普通词汇在非裔美国英语、酷儿文化和流行网络语境中发展出人物评价用法', neutralAlternatives: ['Over-the-top', 'Dramatic'], register: '熟人休闲', risk: 'yellow', production: '观察后使用',
    examples: [{ context: '朋友为普通晚餐穿礼服', line: 'A full suit for pizza night? You’re extra.', translation: '吃披萨穿整套西装？你也太隆重了' }],
    prompt: '熟人为普通聚餐穿得像参加颁奖礼，请调侃', keywords: ['extra'],
  }),

  define({
    id: 'spill-tea', phrase: 'Spill the tea', variants: ['What’s the tea?'], meaning: '分享八卦、内情或最新消息', function: '询问内情', module: 'group',
    provenance: 'tea 表示真相或内情的用法与黑人酷儿文化和舞厅文化关系密切，之后广泛传播', neutralAlternatives: ['Tell me what happened', "What's the latest?"], register: '社群敏感', risk: 'yellow', production: '观察后使用',
    caution: '涉及隐私、职场机密或未经证实的信息时停止追问和传播',
    examples: [{ context: '朋友说昨晚发生了大事', line: 'You can’t stop there—spill the tea.', translation: '你不能说到这里就停，快讲讲怎么回事' }],
    prompt: '亲近朋友说聚会上发生了大事，请轻松追问', keywords: ['spill the tea', "what's the tea", 'whats the tea'],
  }),
  define({
    id: 'read-room', phrase: 'Read the room', meaning: '观察现场情绪和关系，再调整说话方式', function: '提醒看场合', module: 'group',
    provenance: '广泛英语口语表达', neutralAlternatives: ['Pay attention to the mood'],
    examples: [{ context: '严肃会议里有人持续开玩笑', line: 'This is serious—read the room.', translation: '这是严肃的事，看看现在的气氛' }],
    prompt: '有人在严肃谈话中反复开玩笑，请提醒', keywords: ['read the room'],
  }),
  define({
    id: 'call-out', phrase: 'Call out', variants: ['Called out'], meaning: '公开指出有问题的行为或说法', function: '指出问题', module: 'group',
    provenance: '广泛英语口语，社交媒体扩大了公开纠正的用法', neutralAlternatives: ['Challenge the behavior', 'Point out the problem'],
    caution: '公开指出会提高冲突强度，能够私下解决时先考虑私下沟通',
    examples: [{ context: '朋友制止失礼评论', line: 'I’m glad she called out that comment.', translation: '我很高兴她指出了那条失礼评论' }],
    prompt: '称赞同事指出一条失礼评论', keywords: ['call out', 'called out'],
  }),
  define({
    id: 'clocked', phrase: 'Clocked', variants: ['Clock that'], meaning: '准确注意到、识破或指出某个细节', function: '识破细节', module: 'group',
    provenance: '黑人酷儿文化和舞厅语境中常见，之后进入流行网络用语', neutralAlternatives: ['Noticed', 'Saw through it'], register: '社群敏感', risk: 'yellow', production: '观察后使用',
    caution: 'clocked 也可能涉及识别他人敏感身份或外貌特征，应避开这种用法',
    examples: [{ context: '朋友发现故事中的矛盾', line: 'You clocked that detail before anyone else.', translation: '你比所有人都先注意到那个细节' }],
    prompt: '朋友最早发现视频剪辑中的矛盾，请称赞观察力', keywords: ['clocked', 'clock that'],
  }),
  define({
    id: 'shade', phrase: 'Throw shade', variants: ['Shade'], meaning: '用间接方式表达轻蔑、批评或嘲讽', function: '描述隐晦攻击', module: 'group',
    provenance: '与黑人酷儿文化和舞厅文化关系密切，纪录片与流行文化推动传播', neutralAlternatives: ['Make a subtle insult', 'Be indirectly critical'], register: '社群敏感', risk: 'yellow', production: '观察后使用',
    examples: [{ context: '评论中出现隐晦讽刺', line: 'That compliment came with a little shade.', translation: '那句称赞里带着一点讽刺' }],
    prompt: '描述一句表面称赞实际讽刺的评论', keywords: ['throw shade', 'shade'],
  }),
  define({
    id: 'receipts', phrase: 'Receipts', meaning: '能够证明说法的截图、消息或其他记录', function: '要求证据', module: 'group',
    provenance: '购物凭据的比喻用法经流行文化和网络传播', neutralAlternatives: ['Evidence', 'Records'], register: '网络语境',
    caution: '证据可能包含私人信息，分享前需要取得同意并遮盖敏感内容',
    examples: [{ context: '朋友声称有聊天证据', line: 'That’s a big claim. Do you have receipts?', translation: '这个说法很重，你有证据吗' }],
    prompt: '朋友提出很严重的指控，请先询问证据', keywords: ['receipts'],
  }),
  define({
    id: 'messy', phrase: 'Messy', meaning: '形容关系、行为或事件充满混乱和不必要的戏剧性', function: '评价混乱', module: 'group',
    provenance: '普通词汇在娱乐和网络讨论中形成扩展评价', neutralAlternatives: ['Complicated', 'Full of drama'],
    examples: [{ context: '群聊争吵不断升级', line: 'This group chat is getting messy.', translation: '这个群聊越来越乱了' }],
    prompt: '群聊里的小分歧变成多人争吵，请评价', keywords: ['messy'],
  }),
  define({
    id: 'dragged', phrase: 'Drag someone', variants: ['Get dragged', 'Got dragged'], meaning: '严厉批评、嘲讽或在网络上集体攻击某人', function: '描述强烈批评', module: 'group',
    provenance: '黑人酷儿文化中可见，后来在娱乐和网络语境中广泛传播', neutralAlternatives: ['Criticize harshly'], register: '网络语境', risk: 'yellow', production: '识别为主',
    caution: '这个词可能把网络围攻说成娱乐，讨论真实伤害时换用更准确的描述',
    examples: [{ context: '品牌发布失礼广告后被批评', line: 'The brand got dragged for that campaign.', translation: '那个品牌因为这次宣传受到猛烈批评' }],
    prompt: '描述一个品牌因为失礼广告遭遇广泛批评', keywords: ['dragged', 'drag someone'],
  }),

  define({
    id: 'delulu', phrase: 'Delulu', meaning: 'delusional 的玩笑缩略，形容不切实际却仍然相信', function: '自嘲幻想', module: 'current',
    provenance: '韩国流行音乐粉丝社群中的网络缩略，之后扩散到更广的社交媒体', neutralAlternatives: ['Unrealistic', 'Wishful thinking'], register: '网络语境', risk: 'yellow', production: '观察后使用', tone: '自嘲或轻度调侃',
    caution: '不要用于描述真实的精神健康症状',
    examples: [{ context: '幻想偶像会注意到自己', line: 'Maybe they’ll see my comment. Let me be delulu for a minute.', translation: '也许对方会看到我的评论，让我幻想一会儿' }],
    prompt: '用自嘲方式表达一个不太现实的小愿望', keywords: ['delulu'],
  }),
  define({
    id: 'yapping', phrase: 'Yapping', variants: ['Yap'], meaning: '说个不停，通常暗示内容太多或缺少重点', function: '调侃话多', module: 'current',
    provenance: '原本表示小狗叫，网络语境把它扩展成对冗长说话的调侃', neutralAlternatives: ['Talking nonstop', 'Rambling'], register: '网络语境', risk: 'yellow', production: '观察后使用', tone: '调侃或贬低',
    caution: '对正在认真分享的人使用会显得轻视',
    examples: [{ context: '自嘲语音消息太长', line: 'Sorry for yapping—I sent you a five-minute voice note.', translation: '抱歉说个不停，我发了五分钟语音' }],
    prompt: '你给朋友发了一段五分钟语音，请自嘲', keywords: ['yapping', 'yap'],
  }),
  define({
    id: 'locked-in', phrase: 'Locked in', meaning: '高度专注并认真投入目标', function: '描述专注', module: 'current',
    provenance: '体育、游戏和网络文化共同推动当前用法', neutralAlternatives: ['Fully focused', 'Committed'], register: '熟人休闲',
    examples: [{ context: '准备专心完成任务', line: 'My phone is off. I’m locked in for the next two hours.', translation: '手机关了，接下来两小时我要完全专注' }],
    prompt: '告诉朋友你接下来两小时要专心工作', keywords: ['locked in'],
  }),
  define({
    id: 'lore', phrase: 'Lore', meaning: '某个人、群体或事件背后的完整故事和背景', function: '询问背景', module: 'current',
    provenance: '原本常见于虚构世界设定，网络文化把它用于个人经历和群体往事', neutralAlternatives: ['Backstory', 'Background'], register: '网络语境',
    examples: [{ context: '新朋友提到一段往事', line: 'Wait, there’s office karaoke lore? I need the full story.', translation: '等等，办公室唱歌还有前情？我要听完整故事' }],
    prompt: '朋友提到一段你从没听过的办公室往事，请追问', keywords: ['lore'],
  }),
  define({
    id: 'aura', phrase: 'Aura', variants: ['Aura points'], meaning: '对某人气场、风格或表现的游戏化评价', function: '评价气场', module: 'current',
    provenance: '普通词汇与网络记分迷因结合形成当前用法', neutralAlternatives: ['Presence', 'Cool factor'], register: '网络语境',
    examples: [{ context: '朋友稳稳接住掉落物', line: 'Catching that without looking was major aura points.', translation: '头也不回就接住，气场分拉满' }],
    prompt: '朋友漂亮地化解一个尴尬场面，请轻松称赞', keywords: ['aura', 'aura points'],
  }),
  define({
    id: 'crash-out', phrase: 'Crash out', meaning: '因为愤怒或压力做出冲动、可能毁掉后果的行为', function: '描述失控', module: 'current',
    provenance: '在非裔美国英语和说唱语境中有长期用法，社交媒体推动了更广传播', neutralAlternatives: ['Lose control', 'Act recklessly'], register: '社群敏感', risk: 'red', production: '识别为主', tone: '严重或调侃，边界容易模糊',
    caution: '真实冲突和安全风险中使用准确描述，并优先处理人身安全',
    examples: [{ context: '劝朋友别因评论冲动行事', line: 'Don’t crash out over one comment. Log off for a minute.', translation: '别为一条评论做冲动的事，先离线一下' }],
    prompt: '朋友因为评论想做出冲动行为，请劝停', keywords: ['crash out'],
  }),
  define({
    id: 'standing-business', phrase: 'Standing on business', meaning: '坚持自己的承诺、原则或行动，也可能夸张表示说到做到', function: '强调兑现', module: 'current',
    provenance: '非裔美国英语和说唱文化中的表达经网络迷因扩大传播', neutralAlternatives: ['Following through', 'Keeping my word'], register: '社群敏感', risk: 'yellow', production: '观察后使用',
    caution: '在冲突语境中可能带威胁意味，学习阶段优先识别',
    examples: [{ context: '朋友按计划完成训练', line: 'You said you’d train every morning, and you did. Standing on business.', translation: '你说每天早上训练，而且做到了，确实说到做到' }],
    prompt: '朋友坚持完成自己许下的训练计划，请称赞', keywords: ['standing on business', 'stand on business'],
  }),
  define({
    id: 'type-thing', phrase: 'Type thing', variants: ['Type of thing'], meaning: '模糊概括某种感觉、类型或情境', function: '口语化概括', module: 'current',
    provenance: '年轻人口语与网络文本中的省略表达，相关变体很多', neutralAlternatives: ['That kind of thing', 'That sort of vibe'], register: '熟人休闲', risk: 'yellow', production: '观察后使用',
    caution: '高频使用会让意思含糊，学习者先在熟悉关系中少量尝试',
    examples: [{ context: '描述轻松的周末计划', line: 'Coffee, a bookstore, maybe a walk—that type of thing.', translation: '喝咖啡、逛书店、也许散步，大概这种安排' }],
    prompt: '概括一个喝咖啡、逛书店的轻松周末', keywords: ['type thing', 'type of thing'],
  }),
]

// 扩展库优先补齐学习者每天会遇到的成块表达、缩写、游戏和强语气内容
const expandedSeeds: CardSeed[] = [
  {
    id: 'all-set', phrase: 'All set', meaning: '表示已经准备好、已经处理完，或礼貌表示不再需要更多东西', function: '确认完成', module: 'everyday',
    provenance: 'set 表示“准备妥当”的旧用法形成固定短语，具体含义由服务、工作或出发场景决定', literalMeaning: '全部已经摆好或准备妥当', spread: '长期存在于北美日常服务和工作口语', currency: '长期通用',
    neutralAlternatives: ["I'm ready", "I don't need anything else"], contrast: 'I’m ready 只表示准备好；all set 还可以表示事情完成或不需要更多服务',
    examples: [{ context: '店员询问是否还需要帮助', line: "I'm all set, thanks.", translation: '我这边都好了，谢谢' }], prompt: '店员问你是否还需要别的东西，请礼貌表示不需要', keywords: ['all set'],
  },
  {
    id: 'good-to-go', phrase: 'Good to go', meaning: '表示人、设备或计划已经可以开始', function: '确认就绪', module: 'everyday',
    provenance: 'good 与 to go 组合成的口语固定表达，核心是“状态足以开始”', literalMeaning: '状态良好，可以出发', spread: '长期用于工作、旅行、设备检查和日常会话', currency: '长期通用', neutralAlternatives: ['Ready to start'],
    examples: [{ context: '出发前检查设备', line: 'The camera is charged, so we’re good to go.', translation: '相机充好电了，我们可以出发' }], prompt: '朋友问设备是否已经准备好，请确认可以开始', keywords: ['good to go'],
  },
  {
    id: 'no-rush', phrase: 'No rush', meaning: '告诉对方不必赶时间', function: '降低时间压力', module: 'everyday',
    provenance: 'rush 表示匆忙，否定式 no rush 固定为缓和催促的短回应', literalMeaning: '不需要匆忙', spread: '长期用于消息、服务和友好工作沟通', currency: '长期通用', neutralAlternatives: ['Take your time'], contrast: 'No rush 表示期限宽松；take your time 更直接鼓励对方慢慢处理',
    examples: [{ context: '同事说晚些回复', line: 'No rush—tomorrow is fine.', translation: '不急，明天也可以' }], prompt: '同事说今天晚些时候才能回复，请减轻时间压力', keywords: ['no rush'],
  },
  {
    id: 'take-your-time', phrase: 'Take your time', meaning: '让对方按照需要的时间完成，不必仓促', function: '允许慢慢来', module: 'everyday',
    provenance: 'take time 表示花费时间，祈使式长期用于给予耐心和空间', literalMeaning: '使用你需要的时间', spread: '英语日常会话中长期通用', currency: '长期通用', neutralAlternatives: ["There's no hurry"],
    examples: [{ context: '朋友正在找文件', line: 'Take your time. I’m not going anywhere.', translation: '慢慢找，我不急着走' }], prompt: '朋友找东西时向你道歉，请让对方慢慢来', keywords: ['take your time'],
  },
  {
    id: 'up-to-you', phrase: 'Up to you', meaning: '把选择权交给对方', function: '交出决定权', module: 'everyday',
    provenance: 'be up to someone 长期表示某件事由某人决定或负责', literalMeaning: '这件事落在你这里决定', spread: '长期用于日常安排和低风险选择', currency: '长期通用', neutralAlternatives: ["It's your choice"], caution: '重要决策中补充自己的偏好和限制，避免让对方独自承担责任',
    examples: [{ context: '朋友问吃哪家餐厅', line: 'Thai or pizza? It’s up to you.', translation: '泰餐还是披萨？你决定' }], prompt: '朋友让你在两家餐厅中决定，但你都可以，请交出选择权', keywords: ['up to you'],
  },
  {
    id: 'all-ears', phrase: "I'm all ears", meaning: '表示自己正在专心听，并邀请对方继续说', function: '邀请对方讲述', module: 'everyday',
    provenance: '把“全身都是耳朵”用作夸张隐喻的固定习语，强调注意力都放在倾听上', literalMeaning: '我仿佛全身都是耳朵', spread: '英语会话中长期使用，带轻松友好语气', currency: '长期通用', neutralAlternatives: ["I'm listening"],
    examples: [{ context: '朋友说有个新想法', line: 'You have a plan? I’m all ears.', translation: '你有计划？我洗耳恭听' }], prompt: '朋友说有一个新想法，请邀请对方详细讲', keywords: ["i'm all ears", 'im all ears', 'all ears'],
  },
  {
    id: 'makes-sense', phrase: 'That makes sense', meaning: '表示理解对方的解释或推理', function: '确认理解', module: 'everyday',
    provenance: 'make sense 表示“具有可理解的逻辑”，长期形成高频会话回应', literalMeaning: '那件事形成了可理解的逻辑', spread: '长期用于日常、学习和工作会话', currency: '长期通用', neutralAlternatives: ['I understand'], contrast: 'I understand 只确认听懂；that makes sense 还认可解释内部合理',
    examples: [{ context: '同事解释为何改期', line: 'You need the final numbers first? That makes sense.', translation: '你得先拿到最终数字？这很合理' }], prompt: '同事解释改期原因，请确认你理解', keywords: ['that makes sense', 'makes sense'],
  },
  {
    id: 'go-for-it', phrase: 'Go for it', meaning: '鼓励对方尝试、开始或抓住机会', function: '鼓励行动', module: 'everyday',
    provenance: 'go for 表示追求或尝试，祈使式形成简短鼓励', literalMeaning: '朝那个目标去做', spread: '长期用于朋友、同事和轻量建议', currency: '长期通用', neutralAlternatives: ['Give it a try'],
    examples: [{ context: '朋友犹豫是否投稿', line: 'You like the idea, so go for it.', translation: '你喜欢这个想法，那就试试' }], prompt: '朋友犹豫要不要投稿，请鼓励尝试', keywords: ['go for it'],
  },
  {
    id: 'ill-pass', phrase: "I'll pass", meaning: '礼貌但明确地拒绝提议或邀请', function: '简短婉拒', module: 'everyday',
    provenance: 'pass 从“略过、不参与”发展为固定拒绝回应', literalMeaning: '我会略过这一次', spread: '长期用于非正式选择和邀请', currency: '长期通用', neutralAlternatives: ['No, thank you'], caution: '重要邀请或关系敏感场景中补充简短理由或感谢',
    examples: [{ context: '朋友递来你不想吃的甜点', line: "It looks good, but I’ll pass.", translation: '看起来不错，不过我就不吃了' }], prompt: '朋友邀请你尝试不想吃的东西，请简短拒绝', keywords: ["i'll pass", 'ill pass'],
  },
  {
    id: 'my-treat', phrase: 'My treat', meaning: '表示这次由自己付钱', function: '主动请客', module: 'everyday',
    provenance: 'treat 表示请别人享用食物或娱乐，my treat 固定表示费用由自己承担', literalMeaning: '这是我请你的享受', spread: '长期用于餐饮和小额社交消费', currency: '长期通用', neutralAlternatives: ["I'll pay this time"],
    examples: [{ context: '庆祝朋友通过面试', line: 'You got the job—lunch is my treat.', translation: '你拿到工作了，午饭我请' }], prompt: '朋友通过面试，请提出这顿饭由你付', keywords: ['my treat'],
  },
  {
    id: 'give-me-a-sec', phrase: 'Give me a sec', variants: ['Give me a second'], meaning: '请求对方短暂等待', function: '争取短暂时间', module: 'everyday',
    provenance: 'second 缩短为 sec 的口语形式，与 give me 构成高频请求', literalMeaning: '给我一秒钟', spread: '长期用于熟人和轻量工作沟通', currency: '长期通用', neutralAlternatives: ['One moment, please'], register: '熟人休闲',
    examples: [{ context: '同事等你打开文件', line: 'Give me a sec—I’m pulling it up now.', translation: '等我一下，我正在打开' }], prompt: '同事等你打开文件，请让对方稍等', keywords: ['give me a sec', 'give me a second'],
  },
  {
    id: 'ill-check', phrase: "I'll check", meaning: '承诺先核实信息，再给出可靠答复', function: '承诺核实', module: 'everyday',
    provenance: 'check 表示核对，will 缩略式用于承担下一步行动', literalMeaning: '我会去核对', spread: '长期用于日常和工作会话', currency: '长期通用', neutralAlternatives: ["I'll confirm and get back to you"], caution: '需要明确截止时间时补充何时回复',
    examples: [{ context: '朋友问活动是否改期', line: 'I’m not sure. I’ll check and text you.', translation: '我不确定，我查一下再发消息给你' }], prompt: '你不确定活动时间，请承诺核实后回复', keywords: ["i'll check", 'ill check'],
  },
  {
    id: 'imo', phrase: 'IMO', variants: ['In my opinion'], meaning: '在文字中标明接下来是个人看法', function: '标记个人意见', module: 'abbrev',
    provenance: 'in my opinion 的首字母缩写，早期网络论坛和消息文本使其高频化', literalMeaning: 'in my opinion 的首字母', spread: '常见于评论、群聊和论坛，口头通常读完整短语', register: '网络语境', neutralAlternatives: ['In my opinion'], caution: '正式写作中写出完整短语', keywords: ['imo', 'in my opinion'],
    examples: [{ context: '群聊评价电影', line: 'IMO, the first movie was better.', translation: '我个人觉得第一部更好' }], prompt: '在群聊中简短标明这是你的个人看法',
  },
  {
    id: 'ngl', phrase: 'NGL', variants: ['Not gonna lie'], meaning: '引出坦率、意外或带一点反差的看法', function: '引出坦率评价', module: 'abbrev',
    provenance: 'not gonna lie 的首字母缩写，经短信、社交媒体和评论区传播', literalMeaning: 'not gonna lie 的首字母', spread: '当前在年轻人消息和评论中高频，口语也会说完整短语', register: '网络语境', neutralAlternatives: ['Honestly'], contrast: 'Honestly 较中性；NGL 更像随口承认一个真实反应', keywords: ['ngl', 'not gonna lie'],
    examples: [{ context: '朋友发来一张新发型照片', line: 'NGL, that cut really suits you.', translation: '说真的，这个发型很适合你' }], prompt: '在消息中坦率称赞朋友的新发型',
  },
  {
    id: 'tbh', phrase: 'TBH', variants: ['To be honest'], meaning: '标明接下来是较直接的真实看法', function: '引出真实意见', module: 'abbrev',
    provenance: 'to be honest 的首字母缩写，经即时消息和社交媒体普及', literalMeaning: 'to be honest 的首字母', spread: '长期存在于网络文本，当前仍常见', register: '网络语境', neutralAlternatives: ['Honestly'], caution: '后面接负面评价时仍需照顾关系，缩写不会自动让话变礼貌', keywords: ['tbh', 'to be honest'],
    examples: [{ context: '朋友问你是否喜欢那家餐厅', line: 'TBH, it was a little overpriced.', translation: '说实话，我觉得有点贵' }], prompt: '在群聊中坦率评价一家价格偏高的餐厅',
  },
  {
    id: 'idk', phrase: 'IDK', variants: ["I don't know"], meaning: '在文字中简短表示不知道或不确定', function: '表示不确定', module: 'abbrev',
    provenance: "I don't know 的首字母缩写，随短信和网络聊天普及", literalMeaning: "I don't know 的首字母", spread: '长期常见于非正式文字消息', register: '网络语境', neutralAlternatives: ["I'm not sure"], caution: '单独回复可能显得敷衍，可补充你会怎样确认', keywords: ['idk', "i don't know"],
    examples: [{ context: '朋友问演出几点结束', line: 'IDK yet—I’ll check the schedule.', translation: '我还不知道，我查一下日程' }], prompt: '在消息中表示不确定，并说明会去核实',
  },
  {
    id: 'ikr', phrase: 'IKR', variants: ['I know, right?'], meaning: '表示强烈认同对方刚说的感受或评价', function: '热烈认同', module: 'abbrev',
    provenance: 'I know, right? 的首字母缩写，由短信和社交媒体传播', literalMeaning: 'I know, right? 的首字母', spread: '常见于熟人消息和评论回复', register: '网络语境', neutralAlternatives: ['Exactly'], caution: '适合共享评价，不适合对方正在陈述严肃事实的场景', keywords: ['ikr', 'i know right'],
    examples: [{ context: '朋友说天气突然很冷', line: 'IKR? It changed overnight.', translation: '就是啊，一夜之间就变了' }], prompt: '在群聊中强烈认同朋友对天气的评价',
  },
  {
    id: 'fr', phrase: 'FR', variants: ['For real', 'fr fr'], meaning: '表示真的、确实，也可用来确认对方是否认真', function: '强调真实或认同', module: 'abbrev',
    provenance: 'for real 的文字缩写，相关完整表达在美国口语中更早存在，社交媒体推动缩写传播', literalMeaning: 'for real 的首字母', spread: '当前在年轻人消息、评论和游戏聊天中常见', register: '网络语境', risk: 'yellow', production: '观察后使用', neutralAlternatives: ['Seriously', 'Exactly'], contrast: 'For real? 是确认真假；FR 作为回应常表示“确实”', keywords: ['fr', 'fr fr', 'for real'],
    examples: [{ context: '朋友说那场演出太短', line: 'FR, it ended way too early.', translation: '确实，结束得太早了' }], prompt: '在消息中认同朋友说演出太短',
  },
  {
    id: 'rn', phrase: 'RN', variants: ['Right now'], meaning: '在文字中表示此刻、现在', function: '标记当前时间', module: 'abbrev',
    provenance: 'right now 的首字母缩写，经短信和社交媒体传播', literalMeaning: 'right now 的首字母', spread: '常见于非正式消息，口头说完整短语', register: '网络语境', neutralAlternatives: ['Right now'], keywords: ['rn', 'right now'],
    examples: [{ context: '朋友问你在做什么', line: 'I’m in a meeting rn. I’ll call later.', translation: '我现在在开会，晚点打给你' }], prompt: '在消息中说明你此刻正在开会',
  },
  {
    id: 'btw', phrase: 'BTW', variants: ['By the way'], meaning: '顺带加入一个相关度较低的新信息', function: '转换到附带话题', module: 'abbrev',
    provenance: 'by the way 的首字母缩写，早期电子通信和网络聊天使其普及', literalMeaning: 'by the way 的首字母', spread: '长期常见于消息、邮件和评论', register: '网络语境', neutralAlternatives: ['By the way'], keywords: ['btw', 'by the way'],
    examples: [{ context: '确认见面后补充停车信息', line: 'BTW, parking is free after six.', translation: '顺便说一下，六点后停车免费' }], prompt: '确认计划后顺带提醒停车信息',
  },
  {
    id: 'fyi', phrase: 'FYI', variants: ['For your information'], meaning: '把对方可能需要知道的信息提前告诉对方', function: '提供提醒信息', module: 'abbrev',
    provenance: 'for your information 的首字母缩写，先在书面和办公通信中使用，后来进入消息文本', literalMeaning: 'for your information 的首字母', spread: '常见于工作消息、邮件和群聊', register: '网络语境', neutralAlternatives: ['Just so you know'], caution: '单独放在纠错前可能显得冷硬，可加 just 或简短背景', keywords: ['fyi', 'for your information'],
    examples: [{ context: '提醒同事会议室变化', line: 'FYI, we’re in Room 4 now.', translation: '提醒一下，我们现在在四号会议室' }], prompt: '在工作消息中提醒同事会议室变了',
  },
  {
    id: 'afaik', phrase: 'AFAIK', variants: ['As far as I know'], meaning: '说明信息只在自己目前了解的范围内成立', function: '限定信息把握', module: 'abbrev',
    provenance: 'as far as I know 的首字母缩写，由网络论坛和技术交流传播', literalMeaning: 'as far as I know 的首字母', spread: '在论坛、技术群聊和消息中持续使用', register: '网络语境', neutralAlternatives: ['As far as I know'], contrast: 'AFAIK 明确限制知识范围；probably 只表达概率', keywords: ['afaik', 'as far as i know'],
    examples: [{ context: '群聊询问活动是否照常', line: 'AFAIK, it’s still happening.', translation: '据我所知，活动仍会照常进行' }], prompt: '在群聊中说明据你所知活动仍然照常',
  },
  {
    id: 'tldr', phrase: 'TL;DR', variants: ['TLDR', 'Too long; didn’t read'], meaning: '给长内容加简短摘要，也可表示自己没有读完', function: '提供摘要', module: 'abbrev',
    provenance: 'too long; didn’t read 的网络缩写，先用于论坛回复，之后也成为作者自带摘要的标签', literalMeaning: '太长了，没有读', spread: '常见于论坛、长帖和文档摘要，口语中较少直接念', register: '网络语境', risk: 'yellow', production: '观察后使用', neutralAlternatives: ['In short'], caution: '对别人内容只回 TL;DR 可能显得不尊重；主动给摘要更稳妥', keywords: ['tl dr', 'tldr', 'too long didnt read'],
    examples: [{ context: '长消息末尾给摘要', line: 'TL;DR: the trip is on, but we’re leaving Friday.', translation: '简而言之：旅行照常，但周五出发' }], prompt: '给一段长计划补一个简短摘要标签',
  },
  {
    id: 'irl', phrase: 'IRL', variants: ['In real life'], meaning: '区分线下现实生活与网络、游戏或虚构环境', function: '区分线上线下', module: 'abbrev',
    provenance: 'in real life 的首字母缩写，由早期网络社群和游戏交流广泛传播', literalMeaning: 'in real life 的首字母', spread: '长期常见于网络、游戏和社交媒体', register: '网络语境', neutralAlternatives: ['In person'], contrast: 'In person 强调面对面；IRL 强调相对于线上或虚拟世界', keywords: ['irl', 'in real life'],
    examples: [{ context: '谈论线上认识的朋友', line: 'We’ve played together for years but never met IRL.', translation: '我们一起玩了很多年，但从没在线下见过' }], prompt: '说明你和网友还没有在线下见过',
  },
]

const gamingSeeds: CardSeed[] = [
  {
    id: 'afk', phrase: 'AFK', variants: ['Away from keyboard'], meaning: '表示玩家暂时离开设备，无法参与', function: '说明暂时离开', module: 'gaming',
    provenance: 'away from keyboard 的首字母缩写，早期在线聊天和多人游戏使其固定', literalMeaning: '离开键盘', spread: '长期通用于多人游戏、直播和在线聊天', register: '网络语境', evidenceSourceIds: ['riot-pact', 'mw-gaming'], neutralAlternatives: ['I need to step away'],
    examples: [{ context: '开局前需要短暂离开', line: 'AFK for two minutes—don’t queue yet.', translation: '离开两分钟，先别排队' }], prompt: '告诉队友你要离开两分钟', keywords: ['afk', 'away from keyboard'],
  },
  {
    id: 'gg', phrase: 'GG', variants: ['Good game', 'GGWP'], meaning: '在对局结束时表示打得不错，也可能被反讽使用', function: '结束对局', module: 'gaming',
    provenance: 'good game 的首字母缩写，竞技游戏礼仪使其成为结束语；well played 形成 GGWP 变体', literalMeaning: 'good game 的首字母', spread: '长期通用于竞技游戏和直播评论', register: '网络语境', neutralAlternatives: ['Good game'], caution: '比赛尚未结束时发送可能被理解为嘲讽或提前认输',
    examples: [{ context: '一场势均力敌的对局结束', line: 'GG, that was close.', translation: '打得不错，刚才很接近' }], prompt: '一场势均力敌的对局结束，请友好收尾', keywords: ['gg', 'ggwp', 'good game'],
  },
  {
    id: 'glhf', phrase: 'GLHF', variants: ['Good luck, have fun'], meaning: '开局前祝双方好运并享受比赛', function: '开局致意', module: 'gaming',
    provenance: 'good luck, have fun 的首字母缩写，由竞技游戏开局礼仪传播', literalMeaning: 'good luck, have fun 的首字母', spread: '常见于竞技游戏开局聊天', register: '网络语境', neutralAlternatives: ['Have a good game'],
    examples: [{ context: '对局即将开始', line: 'GLHF, everyone.', translation: '祝大家好运，玩得开心' }], prompt: '在一场友好对局开始前向双方致意', keywords: ['glhf', 'good luck have fun'],
  },
  {
    id: 'buff', phrase: 'Buff', meaning: '开发者增强角色、物品或技能，也可指增强效果本身', function: '描述游戏增强', module: 'gaming',
    provenance: 'buff 原有“使更强壮”的含义，角色扮演与多人游戏把它固定为数值或能力增强术语', literalMeaning: '使对象更强壮', spread: '长期通用于补丁说明、玩家讨论和直播', register: '网络语境', neutralAlternatives: ['Make stronger'], contrast: 'Buff 是增强；nerf 是削弱',
    examples: [{ context: '讨论更新后的角色', line: 'That damage buff made her viable again.', translation: '那次伤害增强让她又能上场了' }], prompt: '说明一次伤害增强让角色重新可用', keywords: ['buff', 'buffed'],
  },
  {
    id: 'nerf', phrase: 'Nerf', meaning: '开发者削弱角色、物品或技能的强度', function: '描述游戏削弱', module: 'gaming',
    provenance: '1990 年代《Ultima Online》玩家把武器削弱比作柔软的 Nerf 玩具武器，随后固定为游戏平衡术语', literalMeaning: '让武器像 Nerf 泡沫玩具一样软弱', originConfidence: '有文献记录', spread: '从大型多人在线游戏扩展到各类游戏，也偶尔用于非游戏比喻', register: '网络语境', evidenceSourceIds: ['mw-nerf'], neutralAlternatives: ['Make weaker'], contrast: 'Nerf 是削弱；buff 是增强',
    examples: [{ context: '讨论新补丁', line: 'They nerfed the range, but the weapon is still strong.', translation: '射程被削了，但这把武器仍然很强' }], prompt: '说明新补丁削弱了武器射程', keywords: ['nerf', 'nerfed'],
  },
  {
    id: 'meta-gaming', phrase: 'Meta', meaning: '当前环境中普遍被认为最有效的策略、角色或配置', function: '讨论主流策略', module: 'gaming',
    provenance: '由 metagame 的缩略用法发展，指超出单次局面、围绕整体竞技环境形成的策略选择', literalMeaning: '关于游戏本身的更高一层游戏', spread: '长期用于竞技游戏、卡牌和电竞讨论', register: '网络语境', neutralAlternatives: ['The current dominant strategy'], caution: '“most effective tactics available” 是流行逆向解释，并非可靠词源',
    examples: [{ context: '讨论排位角色选择', line: 'She isn’t meta, but she works in this matchup.', translation: '她不算当前主流，但这个对局能用' }], prompt: '说明一个角色不是主流选择，但在当前对局有效', keywords: ['meta', 'metagame'],
  },
  {
    id: 'overpowered', phrase: 'OP', variants: ['Overpowered'], meaning: '表示角色或物品强得破坏平衡；在论坛中 OP 也可能表示原帖作者', function: '评价失衡', module: 'gaming',
    provenance: 'overpowered 的缩写在游戏讨论中固定；同一缩写在论坛还可表示 original poster', literalMeaning: '力量超过合理范围', spread: '长期用于游戏、直播和补丁讨论', register: '网络语境', neutralAlternatives: ['Too strong'], caution: '先用上下文判断 OP 是“过强”还是“原帖作者”',
    examples: [{ context: '讨论刚上线的武器', line: 'That weapon is OP at close range.', translation: '那把武器近距离强得失衡' }], prompt: '评价一把近距离过强的武器', keywords: ['op', 'overpowered'],
  },
  {
    id: 'grind-gaming', phrase: 'Grind', variants: ['Grinding'], meaning: '为经验、装备或排名重复投入大量时间', function: '描述重复投入', module: 'gaming',
    provenance: 'grind 原有“艰苦、单调地持续工作”的含义，角色扮演游戏把它用于重复任务和升级', literalMeaning: '像研磨一样反复费力', spread: '从游戏扩展到健身、学习和工作励志语境', register: '网络语境', neutralAlternatives: ['Repeatedly work for progress'],
    examples: [{ context: '解释周末游戏计划', line: 'I’m grinding ranked this weekend.', translation: '我周末要一直打排位上分' }], prompt: '说明你周末会投入时间打排位', keywords: ['grind', 'grinding'],
  },
  {
    id: 'main-gaming', phrase: 'Main', meaning: '自己最常使用或最擅长的角色、职业或位置', function: '说明主玩角色', module: 'gaming',
    provenance: 'main character 或主要选择的缩略名词与动词用法，在多人游戏社群中固定', literalMeaning: '主要使用的对象', spread: '长期常见于角色型多人游戏', register: '网络语境', neutralAlternatives: ['My most-played character'],
    examples: [{ context: '新队伍分配角色', line: 'I main support, but I can fill.', translation: '我主玩辅助，但也可以补位' }], prompt: '告诉新队友你主玩辅助，也可以补位', keywords: ['main', 'maining'],
  },
  {
    id: 'carry-gaming', phrase: 'Carry', meaning: '用突出表现带领队伍获胜，也可指承担主要输出职责的角色', function: '描述带队取胜', module: 'gaming',
    provenance: 'carry 的“带着、支撑”含义在团队竞技游戏中发展为承担主要胜负贡献', literalMeaning: '把队伍背到胜利', spread: '长期用于多人竞技和直播文化', register: '网络语境', neutralAlternatives: ['Lead the team to a win'], caution: '对队友说自己在 carry 可能像贬低他人贡献',
    examples: [{ context: '称赞队友关键表现', line: 'You carried that last fight.', translation: '刚才那波团战是你带赢的' }], prompt: '称赞队友在最后一波团战带队取胜', keywords: ['carry', 'carried'],
  },
  {
    id: 'clutch-gaming', phrase: 'Clutch', meaning: '在高压关键时刻成功完成决定结果的操作', function: '称赞关键发挥', module: 'gaming',
    provenance: '体育中表示关键时刻发挥可靠的用法进入电竞和游戏语境', literalMeaning: '在关键时刻牢牢抓住结果', spread: '广泛用于体育、游戏和日常高压成功场景', register: '熟人休闲', neutralAlternatives: ['Great under pressure'],
    examples: [{ context: '队友一打三获胜', line: 'That was clutch.', translation: '那波关键发挥太好了' }], prompt: '称赞队友在关键时刻赢下一打三', keywords: ['clutch'],
  },
  {
    id: 'diff-gaming', phrase: 'Diff', variants: ['Gap'], meaning: '把胜负归因于同一位置或角色之间的水平差距', function: '评价位置差距', module: 'gaming',
    provenance: 'difference 的缩略，竞技游戏计分和聊天文化使 role diff、gap 等结构普及', literalMeaning: 'difference 的缩写', spread: '当前常见于竞技游戏和直播评论', register: '网络语境', risk: 'yellow', production: '识别为主', neutralAlternatives: ['There was a skill gap'], caution: '直接对玩家说某位置 diff 常带甩锅和挑衅意味',
    examples: [{ context: '分析对手优势而非攻击队友', line: 'The biggest diff was objective control.', translation: '最大差距在地图资源控制' }], prompt: '复盘时把差距落在团队资源控制，而非攻击个人', keywords: ['diff', 'gap'],
  },
  {
    id: 'tilted', phrase: 'Tilted', variants: ['On tilt'], meaning: '因为挫败或愤怒而判断变差、越打越急', function: '描述情绪失衡', module: 'gaming',
    provenance: '扑克中的 tilt 指情绪导致决策失准，随后进入电竞和游戏语境', literalMeaning: '状态从平衡位置倾斜', spread: '长期用于扑克、竞技游戏和高压表现讨论', register: '网络语境', neutralAlternatives: ['Too frustrated to focus'],
    examples: [{ context: '输掉几局后建议休息', line: 'I’m tilted. Let’s take five before we queue again.', translation: '我心态崩了，下一局前休息五分钟' }], prompt: '告诉队友你心态受影响，并建议休息五分钟', keywords: ['tilted', 'on tilt'],
  },
  {
    id: 'rage-quit', phrase: 'Rage quit', meaning: '因为愤怒突然退出游戏或活动', function: '描述愤怒退出', module: 'gaming',
    provenance: 'rage 与 quit 的透明组合，在在线游戏中固定为行为名称', literalMeaning: '愤怒地退出', spread: '从游戏传播到对其他冲动退出行为的调侃描述', register: '网络语境', neutralAlternatives: ['Quit out of frustration'],
    examples: [{ context: '队友输掉一回合后退出', line: 'He rage quit after one bad round.', translation: '他一回合打差就气得退了' }], prompt: '描述一名玩家因为一回合失利而退出', keywords: ['rage quit', 'ragequit'],
  },
  {
    id: 'griefing', phrase: 'Griefing', meaning: '故意破坏队友体验或阻碍正常对局', function: '描述蓄意破坏', module: 'gaming',
    provenance: 'griefer 和 griefing 在多人在线游戏中形成，指以骚扰和破坏他人体验为目的的行为', literalMeaning: '故意给别人制造痛苦', originConfidence: '有文献记录', spread: '长期用于游戏平台规则、举报系统和玩家讨论', register: '网络语境', risk: 'yellow', production: '识别为主', evidenceSourceIds: ['riot-pact'], neutralAlternatives: ['Deliberately disrupting the game'], caution: '表现差和故意破坏有区别，缺少意图证据时避免直接指控',
    examples: [{ context: '判断是否需要举报', line: 'Blocking teammates on purpose is griefing.', translation: '故意挡队友属于破坏对局' }], prompt: '说明故意阻挡队友属于蓄意破坏', keywords: ['griefing', 'griefer'],
  },
  {
    id: 'inting', phrase: 'Inting', variants: ['Intentionally feeding'], meaning: '原指故意反复送给对方优势，口语中也常被夸张用于打得很差', function: '描述故意送优势', module: 'gaming',
    provenance: 'intentionally feeding 的缩略，源自多人在线战术竞技游戏的玩家与举报术语', literalMeaning: '故意送给对方击杀或资源', originConfidence: '有文献记录', spread: '常见于 MOBA、直播和竞技游戏评论', register: '网络语境', risk: 'yellow', production: '识别为主', evidenceSourceIds: ['riot-pact'], neutralAlternatives: ['Playing recklessly'], caution: '真实故意行为与普通失误有区别，随意指控会激化冲突',
    examples: [{ context: '区分失误和故意行为', line: 'One bad play isn’t inting.', translation: '一次失误不等于故意送' }], prompt: '提醒队友一次失误不等于故意送优势', keywords: ['inting', 'intentionally feeding'],
  },
  {
    id: 'smurfing', phrase: 'Smurfing', meaning: '高水平玩家使用低段位或新账号与较弱玩家匹配', function: '描述低段位小号', module: 'gaming',
    provenance: '多人竞技社群把高水平玩家的匿名低等级账号称为 smurf，随后形成 smurfing', literalMeaning: '使用“蓝精灵”式匿名小号隐藏真实水平', originConfidence: '较可信', spread: '常见于竞技游戏规则、匹配讨论和直播', register: '网络语境', risk: 'yellow', production: '识别为主', evidenceSourceIds: ['riot-pact'], neutralAlternatives: ['Using a low-ranked alternate account'],
    examples: [{ context: '讨论新手对局体验', line: 'Smurfing makes beginner matches frustrating.', translation: '高手开低段位小号会让新手局很受挫' }], prompt: '说明高手使用低段位小号会影响新手体验', keywords: ['smurfing', 'smurf'],
  },
  {
    id: 'run-it-back', phrase: 'Run it back', meaning: '再来一次、重赛一局，或回到刚才的方案再试', function: '提议再来一轮', module: 'gaming',
    provenance: '体育和音乐录制中“重新跑一遍”的说法进入游戏与网络口语', literalMeaning: '把刚才的过程再运行一遍', spread: '常见于体育、游戏、音乐和熟人会话', register: '熟人休闲', neutralAlternatives: ["Let's try again"],
    examples: [{ context: '一局惜败后继续', line: 'That was close. Let’s run it back.', translation: '刚才很接近，再来一局吧' }], prompt: '一局惜败后提议再来一局', keywords: ['run it back'],
  },
]

const cultureSeeds: CardSeed[] = [
  {
    id: 'deadass', phrase: 'Deadass', meaning: '非常认真地说，完全不是在开玩笑', function: '强调认真', module: 'culture',
    provenance: '与纽约市非裔美国英语联系紧密，dead 与 ass 组合成强烈程度副词；具体最早使用者无法确认', literalMeaning: '粗俗地强调“完全、真的”', originConfidence: '较可信', spread: '经纽约嘻哈、社交媒体和全国年轻人口语扩大传播', register: '社群敏感', risk: 'yellow', production: '观察后使用', evidenceSourceIds: ['language-jones-aave', 'mw-slang-index'], neutralAlternatives: ["I'm completely serious"], caution: '带粗俗强度，职场和陌生关系中换用中性表达',
    examples: [{ context: '朋友以为你在开玩笑', line: 'I’m deadass—I actually saw him there.', translation: '我说真的，我确实在那里看到他了' }], prompt: '熟人以为你在开玩笑，请强调你是认真的', keywords: ['deadass', 'dead ass'],
  },
  {
    id: 'bet-slang', phrase: 'Bet', meaning: '表示明白、同意、接受挑战或确认安排', function: '简短确认', module: 'culture',
    provenance: '由 you bet 等确认表达发展，在非裔美国英语和嘻哈语境中形成高频单词回应', literalMeaning: '原词指下注；口语中相当于“就这么定”', originConfidence: '较可信', spread: '经音乐、短信、游戏和社交媒体进入更广年轻人口语', register: '社群敏感', risk: 'yellow', production: '观察后使用', evidenceSourceIds: ['language-jones-aave', 'mw-slang-index'], neutralAlternatives: ['Got it', 'Sounds good'], contrast: 'Bet 比 sounds good 更短、更有圈层和年轻人口语色彩',
    examples: [{ context: '朋友说七点来接你', line: 'Seven works? Bet.', translation: '七点可以？就这么定' }], prompt: '熟悉的朋友确认七点来接你，请简短确认', keywords: ['bet'],
  },
  {
    id: 'finna', phrase: 'Finna', variants: ['Fixing to'], meaning: '表示马上要做或打算做某事', function: '表达近期意图', module: 'culture',
    provenance: '由 fixing to 的语音和语法变化形成，与美国南方英语和非裔美国英语密切相关；它是语言变体中的语法形式，不能只当作网络俚语', literalMeaning: '正准备要做', originConfidence: '较可信', spread: '长期存在于相关方言，经黑人音乐、影视和网络内容被更广人群认识', register: '社群敏感', risk: 'yellow', production: '识别为主', evidenceSourceIds: ['language-jones-aave'], neutralAlternatives: ["I'm about to", "I'm going to"], caution: '学习者优先理解；刻意堆叠其他族群标记容易像模仿人物形象',
    examples: [{ context: '朋友发消息问你是否出门', line: 'I’m finna leave now.', translation: '我正准备现在出门' }], prompt: '识别朋友说自己马上出门的表达', keywords: ['finna'],
  },
  {
    id: 'bruh', phrase: 'Bruh', variants: ['Bro'], meaning: '称呼熟人，也可单独表达无语、惊讶或不满', function: '称呼或反应', module: 'culture',
    provenance: 'brother 的变体在黑人口语和音乐中长期可见，bruh 的拼写把特定发音写入文本', literalMeaning: 'brother 的缩略称呼', originConfidence: '较可信', spread: '经嘻哈、Vine、迷因和游戏聊天扩展到广泛网络语境', register: '社群敏感', risk: 'yellow', production: '观察后使用', evidenceSourceIds: ['language-jones-aave', 'mw-slang-index'], neutralAlternatives: ['Seriously?', 'Come on'], caution: '称呼陌生人或上级可能显得过度熟络；单独 bruh 的情绪依赖上下文',
    examples: [{ context: '朋友又忘了带钥匙', line: 'Bruh, not the keys again.', translation: '不是吧，怎么又忘钥匙了' }], prompt: '熟人又忘带钥匙，请用轻度无语的反应', keywords: ['bruh', 'bro'],
  },
  {
    id: 'hella', phrase: 'Hella', meaning: '表示非常、很多', function: '加强程度', module: 'culture',
    provenance: '与北加州特别是旧金山湾区英语关系密切，可能由 hell of a 的缩减形式发展；精确最早来源仍有争议', literalMeaning: '把 hell of a 压缩成程度副词', originConfidence: '存在争议', spread: '从湾区地区用法经音乐、移民流动和网络内容传播到美国其他地区', register: '熟人休闲', risk: 'yellow', production: '观察后使用', evidenceSourceIds: ['mw-slang-index'], neutralAlternatives: ['Very', 'A lot of'],
    examples: [{ context: '评价一场拥挤的活动', line: 'That place was hella crowded.', translation: '那个地方特别挤' }], prompt: '熟人聊天中强调活动现场非常拥挤', keywords: ['hella'],
  },
  {
    id: 'trippin', phrase: "You're trippin'", variants: ['Tripping'], meaning: '认为对方反应过度、判断离谱或行为不合理', function: '质疑判断', module: 'culture',
    provenance: 'trip 的药物体验和失常含义在非裔美国英语中发展出更广的“想法离谱、反应过度”用法', literalMeaning: '像进入失常体验一样判断偏离', originConfidence: '较可信', spread: '经黑人音乐、影视和社交媒体进入更广休闲口语', register: '社群敏感', risk: 'yellow', production: '观察后使用', evidenceSourceIds: ['language-jones-aave', 'mw-slang-index'], neutralAlternatives: ["You're overreacting", "That doesn't make sense"], caution: '直接评价对方容易升级冲突，朋友玩笑场景更安全',
    examples: [{ context: '朋友说普通咖啡值五十美元', line: 'Fifty dollars for that? You’re trippin’.', translation: '那个要五十美元？你想得太离谱了' }], prompt: '熟人提出明显离谱的价格，请轻度质疑', keywords: ["you're trippin", 'youre trippin', 'tripping'],
  },
  {
    id: 'opp', phrase: 'Opp', variants: ['Opps'], meaning: '对手、敌对方或与自己阵营冲突的人', function: '指称敌对方', module: 'culture',
    provenance: 'opposition 或 opponent 的缩略，与街头和嘻哈语境联系紧密，常涉及真实群体冲突', literalMeaning: 'opposition 或 opponent 的缩写', originConfidence: '较可信', spread: '经芝加哥等地说唱、全国嘻哈和社交媒体传播，也出现泛化玩笑用法', register: '社群敏感', risk: 'red', production: '识别为主', evidenceSourceIds: ['language-jones-aave', 'mw-slang-index'], neutralAlternatives: ['Rival', 'Opponent'], caution: '可能指真实敌对关系和暴力背景，学习阶段以识别歌词和语境为主',
    examples: [{ context: '理解歌词中的阵营冲突', line: 'In this verse, “the opps” means a rival group.', translation: '这段歌词里的 opps 指敌对群体' }], prompt: '解释歌词中 opps 指什么，不把它当普通朋友玩笑', keywords: ['opp', 'opps'],
  },
  {
    id: 'unc', phrase: 'Unc', meaning: 'uncle 的缩略；当前网络也用来调侃某人显老或资历老', function: '称呼或调侃年长', module: 'culture',
    provenance: 'uncle 的亲属称呼缩略在黑人社群和美国南方口语中长期存在，网络迷因后来强化了“你老了”的调侃功能', literalMeaning: 'uncle 的缩写', originConfidence: '较可信', spread: '2020 年代经体育、直播和短视频扩展为年轻人调侃称呼', register: '社群敏感', risk: 'yellow', production: '识别为主', evidenceSourceIds: ['language-jones-aave', 'mw-slang-index'], neutralAlternatives: ['Veteran', 'Old-timer'], caution: '可能带年龄贬损，也可能是亲近敬称；必须结合关系和语气判断',
    examples: [{ context: '直播评论调侃主播不懂新迷因', line: 'Chat started calling him unc after he missed the reference.', translation: '他没听懂那个梗后，评论区开始叫他大叔' }], prompt: '解释评论区为什么用 unc 调侃一位主播', keywords: ['unc'],
  },
  {
    id: 'jit', phrase: 'Jit', meaning: '年轻人、小孩，有时也用作对年轻男性的称呼', function: '指称年轻人', module: 'culture',
    provenance: '与佛罗里达地区特别是黑人青年口语关系紧密，精确形成路径缺少统一记录', literalMeaning: '地区性地指年轻人或小孩', originConfidence: '尚不明确', spread: '经佛罗里达说唱、体育和社交媒体被更广网络受众认识', register: '社群敏感', risk: 'red', production: '识别为主', evidenceSourceIds: ['language-jones-aave', 'mw-slang-index'], neutralAlternatives: ['Kid', 'Young guy'], caution: '地区和社群标记很强，外部学习者优先识别',
    examples: [{ context: '理解佛罗里达说唱访谈', line: 'Here, “jit” refers to a younger guy.', translation: '这里的 jit 指一个更年轻的人' }], prompt: '解释佛罗里达语境中 jit 的常见指向', keywords: ['jit'],
  },
  {
    id: 'stay-woke', phrase: 'Stay woke', meaning: '保持对种族不公和社会风险的警觉；后来也被政治化和讽刺性使用', function: '提醒保持社会警觉', module: 'culture',
    provenance: 'woke 作为“对种族和社会不公保持警觉”的用法在非裔美国英语中有 20 世纪文献记录', literalMeaning: '保持清醒', originConfidence: '有文献记录', spread: '经黑人社会运动和 Black Lives Matter 广泛传播，随后在政治争论中出现泛化、贬义和讽刺用法', register: '社群敏感', risk: 'red', production: '识别为主', evidenceSourceIds: ['mw-woke', 'language-jones-aave'], neutralAlternatives: ['Stay aware of injustice'], caution: '当前政治语义高度分化，先识别说话者立场和历史语境',
    examples: [{ context: '阅读历史材料', line: 'In this context, “stay woke” means staying alert to racial injustice.', translation: '在这里，stay woke 指对种族不公保持警觉' }], prompt: '解释历史材料中 stay woke 的核心含义', keywords: ['stay woke', 'woke'],
  },
  {
    id: 'put-me-on', phrase: 'Put me on', meaning: '向我介绍某个人、音乐、知识或机会', function: '请求推荐或引荐', module: 'culture',
    provenance: 'put someone on to something 的缩略结构在非裔美国英语和音乐语境中长期可见', literalMeaning: '把我接到某个信息或机会之上', originConfidence: '较可信', spread: '经嘻哈、消息文本和社交媒体进入更广年轻人口语', register: '社群敏感', risk: 'yellow', production: '观察后使用', evidenceSourceIds: ['language-jones-aave', 'mw-slang-index'], neutralAlternatives: ['Recommend something to me', 'Introduce me'],
    examples: [{ context: '朋友分享一位你没听过的歌手', line: 'This is great—put me on to more of her music.', translation: '这个很好听，再给我推荐一些她的歌' }], prompt: '请朋友继续推荐同一位歌手的作品', keywords: ['put me on', 'pmo'],
  },
  {
    id: 'word-slang', phrase: 'Word', variants: ['Word?'], meaning: '表示理解、认同；升调时也可表示“真的？”', function: '确认或核实', module: 'culture',
    provenance: '与非裔美国英语和嘻哈文化联系紧密，可能由 my word、word is bond 等真实性和承诺表达缩短；单一来源无法确认', literalMeaning: '用“话语”代表真实、承诺或确认', originConfidence: '存在争议', spread: '经 1980—1990 年代嘻哈和电影传播，当前仍能听到但带明显风格色彩', register: '社群敏感', risk: 'yellow', production: '观察后使用', evidenceSourceIds: ['language-jones-aave', 'mw-slang-index'], neutralAlternatives: ['Got it', 'Really?'], caution: '语调决定是认同还是追问，使用前先听清上下文',
    examples: [{ context: '朋友确认已经订好票', line: 'You got the tickets? Word.', translation: '你拿到票了？好，知道了' }], prompt: '熟人说票已经订好，请简短确认', keywords: ['word'],
  },
]

const roughSeeds: CardSeed[] = [
  {
    id: 'type-shit', phrase: 'Type shit', variants: ['Type shi', 'X type shit'], meaning: '概括“这种东西、这种感觉”，也可作为简短回应表示认同或共享同一种氛围', function: '粗俗概括或认同', module: 'rough',
    provenance: 'X type shit 结构与非裔美国英语和嘻哈语境密切相关；现有网络记录能证明较早使用，但无法可靠确认单一创造者或城市', literalMeaning: 'X 这一类型的东西，其中 shit 是粗俗的泛指名词', originConfidence: '尚不明确', spread: '2010 年代已有网络和歌词记录，2020 年代经嘻哈、TikTok、X 和 Instagram 加速传播；type shi 是规避审核或弱化拼写的变体', register: '社群敏感', risk: 'red', production: '识别为主', category: '粗俗表达', currency: '当前流行', evidenceSourceIds: ['type-shit-kym', 'type-shit-wiktionary', 'language-jones-aave'], neutralAlternatives: ['That kind of thing', 'Exactly', 'That sort of vibe'], contrast: 'X type shit 用来概括一类事物；单独回应 type shit 常表示“就是这种感觉、我懂”', caution: '粗俗且带明显社群和音乐语境，学习者先识别；职场、陌生人和正式场景换用中性表达',
    examples: [{ context: '熟人描述理想周末', line: 'Coffee, music, no plans—my type shit.', translation: '咖啡、音乐、没有安排，这就是我喜欢的那种生活' }, { context: '熟人表达共同感受', line: '“I’m keeping it low-key tonight.” “Type shit.”', translation: '“我今晚想低调一点。”“懂，就是这种感觉”' }], prompt: '识别它是在概括一类氛围，还是在表示认同', keywords: ['type shit', 'type shi', 'my type shit'],
  },
  {
    id: 'fuck-with', phrase: 'Fuck with', meaning: '根据结构表示喜欢、支持、来往，或招惹、干扰', function: '表达喜欢或警告干扰', module: 'rough',
    provenance: 'fuck 的粗俗动词与 with 组合，在美国口语和黑人音乐中发展出多个相反方向的语义', literalMeaning: '粗俗地与某人或某物发生关系或干预', originConfidence: '较可信', spread: '经嘻哈、影视和网络内容广泛传播', register: '社群敏感', risk: 'red', production: '识别为主', neutralAlternatives: ['Like', 'Support', 'Mess with'], contrast: 'I fuck with it 表示喜欢；don’t fuck with me 表示别招惹我', caution: '语义随宾语和否定变化，且粗俗强烈；学习阶段优先识别',
    examples: [{ context: '熟人评价一首歌', line: 'I really fuck with this track.', translation: '我真的很喜欢这首歌' }], prompt: '识别肯定句中 fuck with 表示喜欢，而非攻击', keywords: ['fuck with', 'fucks with'],
  },
  {
    id: 'fuck-that', phrase: 'Fuck that', meaning: '强烈拒绝某个想法、情况或要求', function: '强烈拒绝', module: 'rough',
    provenance: 'fuck 用作粗俗强化词，与指示代词组合成直接否定', literalMeaning: '粗俗地把那件事推开', originConfidence: '较可信', spread: '长期见于美国粗俗口语、影视和音乐', register: '熟人休闲', risk: 'red', production: '识别为主', neutralAlternatives: ['Absolutely not', "I'm not doing that"], caution: '容易显得敌对，正式、服务和陌生关系中避免主动使用',
    examples: [{ context: '电影角色拒绝危险计划', line: 'Drive through that storm? Fuck that.', translation: '开车穿过暴风雨？绝对不干' }], prompt: '识别电影角色是在强烈拒绝危险计划', keywords: ['fuck that'],
  },
  {
    id: 'fucked-up', phrase: 'Fucked up', meaning: '严重糟糕、不公平、受损、醉得厉害，或心理受到冲击', function: '强烈评价糟糕状态', module: 'rough',
    provenance: 'fuck up 的结果状态形容词，长期发展出受损、失常和不公等多义用法', literalMeaning: '被彻底弄坏或搞乱', originConfidence: '较可信', spread: '广泛存在于粗俗日常口语、影视和音乐', register: '熟人休闲', risk: 'red', production: '识别为主', neutralAlternatives: ['Messed up', 'Seriously wrong'], caution: '必须靠上下文判断是在说事情不公、物品损坏、醉酒还是心理状态',
    examples: [{ context: '朋友描述明显不公平的做法', line: 'They blamed her for their mistake? That’s fucked up.', translation: '他们把自己的错误怪到她头上？这太过分了' }], prompt: '识别它在此处表示事情严重不公平', keywords: ['fucked up'],
  },
  {
    id: 'bullshit', phrase: 'Bullshit', variants: ['BS'], meaning: '认为某事是谎话、荒谬借口或不公平做法', function: '强烈否定真实性', module: 'rough',
    provenance: 'bull 与 shit 组成的粗俗名词，长期用于指无意义的话或欺骗性说法；BS 是弱化缩写', literalMeaning: '字面是牛粪，隐喻毫无价值或虚假内容', originConfidence: '有文献记录', spread: '长期存在于英语粗俗口语，BS 也进入工作和媒体的委婉写法', register: '熟人休闲', risk: 'red', production: '识别为主', neutralAlternatives: ["That's not true", "That's unfair"], caution: '直接对人说 bullshit 可能指责对方说谎，需要区分反对内容与攻击人格',
    examples: [{ context: '朋友转述明显虚假的借口', line: 'That excuse is bullshit.', translation: '那个借口完全是胡扯' }], prompt: '识别说话者在强烈否定一个借口的真实性', keywords: ['bullshit', 'bs'],
  },
  {
    id: 'badass', phrase: 'Badass', meaning: '称赞某人或事物强悍、厉害、有胆量；也可作名词', function: '强烈称赞', module: 'rough',
    provenance: 'bad 与 ass 组成的粗俗复合词，从负面“难对付的人”发展出正面“强悍厉害”评价', literalMeaning: '字面粗俗，但常用作正面强悍评价', originConfidence: '较可信', spread: '广泛见于美国休闲口语、影视、广告和网络', register: '熟人休闲', risk: 'yellow', production: '观察后使用', neutralAlternatives: ['Impressive', 'Fearless'],
    examples: [{ context: '朋友完成高难度攀岩', line: 'That climb was badass.', translation: '那次攀登太厉害了' }], prompt: '熟人完成高难度挑战，请强烈称赞', keywords: ['badass', 'bad ass'],
  },
  {
    id: 'shit-hits-fan', phrase: 'When the shit hits the fan', meaning: '当严重问题突然全面爆发，局面变得混乱', function: '描述危机爆发', module: 'rough',
    provenance: '把污物撞上风扇后四处飞散作为混乱隐喻，20 世纪英语中已有记录', literalMeaning: '污物撞上风扇后到处飞散', originConfidence: '有文献记录', spread: '长期用于粗俗口语、新闻评论和影视', register: '熟人休闲', risk: 'red', production: '识别为主', neutralAlternatives: ['When things go seriously wrong'],
    examples: [{ context: '团队准备应急方案', line: 'Who calls the client when the shit hits the fan?', translation: '局面失控时谁联系客户' }], prompt: '识别它指严重问题全面爆发', keywords: ['shit hits the fan'],
  },
  {
    id: 'aint-shit', phrase: "Ain't shit", meaning: '根据结构表示一文不值、没什么本事，或强调根本不算什么', function: '粗俗贬低或淡化', module: 'rough',
    provenance: 'ain’t 的否定结构与泛指名词 shit 组合，在非裔美国英语、南方口语和音乐中有多种语法读法', literalMeaning: '粗俗地说“什么都不是”', originConfidence: '较可信', spread: '经音乐和社交媒体被更广人群认识，但句法和指向仍高度依赖语境', register: '社群敏感', risk: 'red', production: '识别为主', evidenceSourceIds: ['language-jones-aave', 'mw-slang-index'], neutralAlternatives: ['Worthless', "It's nothing"], caution: '可能直接贬低人物，也可能表示事情不难；学习者先辨句法和对象',
    examples: [{ context: '理解人物攻击', line: 'In this argument, “he ain’t shit” is a harsh insult.', translation: '在这场争吵中，he ain’t shit 是很重的侮辱' }], prompt: '识别 he ain’t shit 在争吵中是严重贬低', keywords: ["ain't shit", 'aint shit'],
  },
  {
    id: 'damn', phrase: 'Damn', meaning: '表达惊讶、赞叹、失望或恼火，也可加强形容词', function: '强烈情绪反应', module: 'rough',
    provenance: '原本与宗教诅咒有关，长期弱化为常见感叹词和程度强化词', literalMeaning: '原本表示诅咒或判罪', originConfidence: '有文献记录', spread: '在美国口语、影视和音乐中广泛使用，粗俗程度通常低于 fuck 和 shit', register: '熟人休闲', risk: 'yellow', production: '观察后使用', neutralAlternatives: ['Wow', 'That is frustrating'], caution: '语调决定是赞叹还是不满；保守或正式关系中换用中性表达',
    examples: [{ context: '朋友展示漂亮照片', line: 'Damn, that shot is beautiful.', translation: '哇，那张照片真漂亮' }], prompt: '熟人展示漂亮照片，请用强烈但不攻击的赞叹', keywords: ['damn'],
  },
  {
    id: 'hell-no', phrase: 'Hell no', meaning: '非常明确而强烈地拒绝', function: '强烈拒绝', module: 'rough',
    provenance: 'hell 用作程度强化词，与 no 组合成固定强烈否定', literalMeaning: '带宗教禁忌色彩的“绝对不”', originConfidence: '有文献记录', spread: '长期见于美国休闲口语和影视', register: '熟人休闲', risk: 'yellow', production: '观察后使用', neutralAlternatives: ['Absolutely not'], caution: '直接、情绪强，服务和工作关系中换用更平静的拒绝',
    examples: [{ context: '朋友提议在暴雨中徒步', line: 'Hike in this storm? Hell no.', translation: '这种暴雨里徒步？绝对不行' }], prompt: '熟人提议做明显危险的事，请强烈拒绝', keywords: ['hell no'],
  },
  {
    id: 'pmo-angry', phrase: 'PMO', variants: ['Pisses me off'], meaning: '在消息中表示某事让自己很生气；同一缩写也可能表示 put me on', function: '表达恼火或请求推荐', module: 'rough',
    provenance: 'pisses me off 与 put me on 各自缩成相同的 PMO，平台文本把两种读法同时推高', literalMeaning: '两组短语共用的首字母', originConfidence: '较可信', spread: '2020 年代在 TikTok、X 和消息文本中明显增加', register: '网络语境', risk: 'red', production: '识别为主', currency: '当前流行', neutralAlternatives: ['That annoys me', 'Recommend it to me'], contrast: '“This pmo” 常指惹恼我；“pmo to some music” 常指给我推荐音乐', caution: '必须根据句法和宾语消除歧义，正式文字直接写完整意思',
    examples: [{ context: '消息中抱怨软件反复退出', line: 'This app crashing every hour pmo.', translation: '这个应用每小时都崩，真让我恼火' }], prompt: '识别此处 PMO 表示“让我生气”，并说明另一种常见读法', keywords: ['pmo', 'pisses me off', 'put me on'],
  },
  {
    id: 'fafo', phrase: 'Fuck around and find out', variants: ['FAFO'], meaning: '警告某人继续鲁莽挑衅会亲自承担后果', function: '警告后果', module: 'rough',
    provenance: 'fuck around 与 find out 形成押韵式因果警告，难以确认单一创造者；FAFO 是后来的首字母缩写', literalMeaning: '继续胡来，然后亲自发现后果', originConfidence: '尚不明确', spread: '经军事、政治标语、网络迷因和商品传播而广为人知', register: '熟人休闲', risk: 'red', production: '识别为主', neutralAlternatives: ['Actions have consequences'], caution: '经常带威胁意味，现实冲突中避免升级对抗',
    examples: [{ context: '分析网络标语', line: 'FAFO frames consequences as a warning, not friendly advice.', translation: 'FAFO 把后果说成警告，而非友好建议' }], prompt: '解释 FAFO 为什么可能被理解为威胁', keywords: ['fuck around and find out', 'fafo'],
  },
  {
    id: 'bitch-insult', phrase: 'Bitch', meaning: '严重依赖对象和关系的粗俗词，可构成性别侮辱，也可能在特定亲密或社群内部被重新用作称呼', function: '识别高风险称呼', module: 'rough',
    provenance: '原指母犬，长期发展为针对女性的贬损词；部分黑人女性、酷儿和流行文化语境存在重新占用用法', literalMeaning: '母犬，后来成为性别化侮辱', originConfidence: '有文献记录', spread: '广泛存在于英语侮辱、音乐和影视，重新占用并未消除外部使用风险', register: '社群敏感', risk: 'red', production: '识别为主', neutralAlternatives: ['Person', 'Friend'], caution: '学习者避免用它称呼别人；亲密群体内可接受不代表跨关系安全',
    examples: [{ context: '判断冲突性称呼', line: 'A stranger calling her that is an insult, not playful banter.', translation: '陌生人这样称呼她属于侮辱，不是玩笑' }], prompt: '区分陌生人攻击和社群内部重新占用的关系差异', keywords: ['bitch'],
  },
  {
    id: 'dick-move', phrase: 'Dick move', meaning: '评价某个行为自私、刻薄或缺乏考虑', function: '批评不厚道行为', module: 'rough',
    provenance: 'dick 的性器官粗俗义转为对人的侮辱，再与 move 组合评价具体行为', literalMeaning: '粗俗地说“混蛋式的做法”', originConfidence: '较可信', spread: '长期见于美国休闲口语、影视和网络', register: '熟人休闲', risk: 'red', production: '识别为主', neutralAlternatives: ['That was inconsiderate'], caution: '直接粗俗；批评工作行为时改说具体影响',
    examples: [{ context: '朋友放鸽子又不通知', line: 'Canceling without telling anyone was a dick move.', translation: '取消却不告诉任何人，这做法很不厚道' }], prompt: '识别说话者在批评一个具体行为，而非描述动作', keywords: ['dick move'],
  },
]

const currentSeeds: CardSeed[] = [
  {
    id: 'brain-rot', phrase: 'Brain rot', meaning: '认为低价值、重复的网络内容让注意力或思考变差，也可戏称自己沉迷某个主题', function: '评价内容沉迷', module: 'current',
    provenance: 'brain rot 在 19 世纪已有“智力衰退”比喻记录；当代用法把它重新用于过量消费低价值网络内容', literalMeaning: '大脑仿佛腐烂', originConfidence: '有文献记录', spread: '2020 年代随短视频、迷因和年轻人讨论快速增长，Oxford 将其选为 2024 年度词', currency: '当前流行', register: '网络语境', evidenceSourceIds: ['oxford-brain-rot'], neutralAlternatives: ['Mindless content', 'An online obsession'], contrast: 'Brain rot 可批评内容，也可自嘲自己反复想着某个作品',
    examples: [{ context: '自嘲反复刷同一类视频', line: 'My cooking-show brain rot is getting out of hand.', translation: '我对烹饪节目上头得有点失控了' }], prompt: '自嘲最近一直刷同一类视频', keywords: ['brain rot', 'brainrot'],
  },
  {
    id: 'rage-bait', phrase: 'Rage bait', meaning: '故意设计成让人愤怒，以换取评论、转发和曝光的内容', function: '识别愤怒诱饵', module: 'current',
    provenance: 'rage 与 bait 组合，沿用 clickbait 的“诱饵”隐喻，描述以愤怒为互动机制的网络内容', literalMeaning: '用愤怒做诱饵', originConfidence: '较可信', spread: '2020 年代随创作者经济和算法讨论显著增长，Oxford 将其选为 2025 年度词', currency: '当前流行', register: '网络语境', evidenceSourceIds: ['oxford-current'], neutralAlternatives: ['Content designed to provoke anger'],
    examples: [{ context: '朋友转发夸张争议视频', line: 'Don’t engage—it’s obvious rage bait.', translation: '别互动，这明显是故意激怒人的内容' }], prompt: '提醒朋友一条夸张视频可能在利用愤怒赚互动', keywords: ['rage bait', 'ragebait'],
  },
  {
    id: 'aura-farming', phrase: 'Aura farming', meaning: '刻意做出很酷、很有气场的动作，以积累他人对自己的风格评价', function: '评价刻意耍帅', module: 'current',
    provenance: 'aura 的网络“气场分”用法与 farming 的游戏重复积累隐喻组合', literalMeaning: '像游戏刷资源一样刷气场', originConfidence: '较可信', spread: '2024—2025 年经短视频、体育片段和迷因传播，进入 Oxford 2025 年度词候选讨论', currency: '当前流行', register: '网络语境', evidenceSourceIds: ['oxford-current'], neutralAlternatives: ['Trying to look effortlessly cool'], caution: '通常带调侃，可能暗示对方在表演而非自然表现',
    examples: [{ context: '朋友慢动作整理外套后走开', line: 'That slow exit was pure aura farming.', translation: '那个慢慢离场的动作完全是在刷气场' }], prompt: '调侃朋友刻意做了一个很酷的离场动作', keywords: ['aura farming', 'aura farm'],
  },
  {
    id: 'gyatt', phrase: 'Gyatt', variants: ['Gyat'], meaning: '强烈惊叹词，也常被用来物化评价某人的臀部', function: '识别身体评价', module: 'current',
    provenance: '通常被解释为 goddamn 的夸张发音拼写，与黑人网络和直播语境联系密切；精确创造者和首次使用仍不确定', literalMeaning: 'goddamn 的夸张感叹写法', originConfidence: '尚不明确', spread: '经 Twitch、短视频和青少年迷因在 2020 年代快速传播，语义逐渐收窄到身体评价', currency: '当前流行', register: '社群敏感', risk: 'red', production: '识别为主', evidenceSourceIds: ['dictionary-current', 'language-jones-aave'], neutralAlternatives: ['Wow'], caution: '对真实人物使用很容易构成物化或性骚扰，学习阶段以识别为主',
    examples: [{ context: '解释评论区用语风险', line: 'In that comment, “gyatt” is objectifying her body.', translation: '那条评论里的 gyatt 在物化她的身体' }], prompt: '解释为什么对真实人物评论 gyatt 可能不尊重', keywords: ['gyatt', 'gyat'],
  },
  {
    id: 'skibidi', phrase: 'Skibidi', meaning: '高度依赖迷因的无固定词，可表示酷、糟糕、荒诞，或只是引用《Skibidi Toilet》', function: '识别迷因引用', module: 'current',
    provenance: '拟声式 skibidi 更早出现在歌曲和舞蹈内容；《Skibidi Toilet》系列让它在新一代网络语境中获得高度泛化的迷因功能', literalMeaning: '没有稳定字面义的拟声式迷因词', originConfidence: '较可信', spread: '2023 年后经 YouTube 系列、短视频和儿童同伴语言快速传播', currency: '当前流行', register: '网络语境', risk: 'yellow', production: '识别为主', evidenceSourceIds: ['dictionary-current'], neutralAlternatives: ['Weird', 'Cool', 'A meme reference'], caution: '没有上下文就无法给出唯一翻译，先判断是否在引用迷因',
    examples: [{ context: '孩子用它评价视频', line: 'Here, “skibidi” is mostly a meme signal, not a precise adjective.', translation: '这里的 skibidi 主要是在发迷因信号，不是准确形容词' }], prompt: '说明 skibidi 为什么不能脱离上下文固定翻译', keywords: ['skibidi'],
  },
  {
    id: 'mog', phrase: 'Mog', variants: ['Mogging', 'Mogged'], meaning: '在外貌、身高或气场比较中压过别人', function: '描述比较碾压', module: 'current',
    provenance: '与男性外貌评分和健身网络社群联系密切，通常被解释为 AMOG 相关结构的缩短；精确形成路径仍有争议', literalMeaning: '在比较中让对方显得逊色', originConfidence: '存在争议', spread: '经 looksmaxxing、健身论坛、TikTok 和迷因在 2020 年代扩大传播', currency: '圈层常见', register: '网络语境', risk: 'red', production: '识别为主', evidenceSourceIds: ['mw-slang-index'], neutralAlternatives: ['Outshine', 'Look more imposing'], caution: '常把人压缩成外貌等级并强化不健康比较，学习阶段以识别为主',
    examples: [{ context: '解释外貌比较评论', line: 'They’re using “mog” to rank people by appearance.', translation: '他们用 mog 按外貌给人排等级' }], prompt: '解释评论区中的 mog 为什么带外貌等级比较', keywords: ['mog', 'mogging', 'mogged'],
  },
  {
    id: 'looksmaxxing', phrase: 'Looksmaxxing', meaning: '为了最大化外貌吸引力而系统改变造型、健身、护肤，极端语境还会涉及手术和等级化观念', function: '描述外貌优化体系', module: 'current',
    provenance: 'looks 与 maximizing 组合，源自男性自我改善和 incel 相关网络论坛', literalMeaning: '把外貌最大化', originConfidence: '较可信', spread: '2020 年代经 TikTok 和主流媒体扩散，温和自我护理与极端等级意识同时存在', currency: '圈层常见', register: '网络语境', risk: 'red', production: '识别为主', evidenceSourceIds: ['mw-slang-index'], neutralAlternatives: ['Improving personal style and grooming'], caution: '需要区分普通护理建议与鼓励身体焦虑、厌女或极端手术的社群内容',
    examples: [{ context: '分析一条自我改善视频', line: 'This starts as grooming advice but slides into looksmaxxing rankings.', translation: '这条内容起初是造型建议，后来滑向了外貌等级体系' }], prompt: '区分普通护理建议和带等级化观念的 looksmaxxing 内容', keywords: ['looksmaxxing', 'looksmax'],
  },
  {
    id: 'glazing', phrase: 'Glazing', meaning: '过度吹捧、讨好或毫无保留地称赞某人', function: '批评过度吹捧', module: 'current',
    provenance: '粗俗性比喻从网络和说唱语境发展为“过度奉承”，精确最早来源不确定', literalMeaning: '像给食物上釉一样把某人包上一层夸赞', originConfidence: '尚不明确', spread: '2020 年代经体育评论、直播和 TikTok 快速传播', currency: '当前流行', register: '网络语境', risk: 'yellow', production: '识别为主', evidenceSourceIds: ['mw-slang-index'], neutralAlternatives: ['Overpraising', 'Fawning over'], caution: '它会把真诚称赞也贬成讨好，使用时容易压制正常支持',
    examples: [{ context: '评论区不断夸大一名球员', line: 'The comments are glazing him after one good game.', translation: '才打好一场，评论区就在过度吹捧他' }], prompt: '说明评论区在一次好表现后过度吹捧', keywords: ['glazing', 'glaze'],
  },
  {
    id: 'sigma-slang', phrase: 'Sigma', variants: ['Sigma male'], meaning: '网络男性类型迷因中的“独立、不按等级行事的人”，也可变成无意义的夸赞或讽刺', function: '识别男性类型迷因', module: 'current',
    provenance: '在 alpha/beta 男性等级叙事之外添加 sigma 类型的网络概念，后来被短视频和儿童迷因重混', literalMeaning: '借用希腊字母为男性人格分类', originConfidence: '较可信', spread: '从男性自助和 manosphere 内容扩展到讽刺视频、短视频和儿童迷因', currency: '当前流行', register: '网络语境', risk: 'yellow', production: '识别为主', evidenceSourceIds: ['dictionary-current'], neutralAlternatives: ['Independent', 'A meme compliment'], caution: '需要区分认真接受男性等级理论和纯粹反讽引用',
    examples: [{ context: '短视频评论称某动作 sigma', line: 'Here, “sigma” is an ironic compliment, not a personality diagnosis.', translation: '这里的 sigma 是反讽式称赞，不是人格诊断' }], prompt: '解释短视频评论中的 sigma 可能只是反讽称赞', keywords: ['sigma', 'sigma male'],
  },
  {
    id: 'based', phrase: 'Based', meaning: '称赞某个观点大胆、真实或不受他人评价影响，也可能带政治圈层立场', function: '认可大胆立场', module: 'current',
    provenance: 'basehead 原有贬义背景；说唱歌手 Lil B 重新赋予 based 积极的自我真实含义，网络社群随后进一步政治化和迷因化', literalMeaning: '从旧有贬义称呼中重新占用的“忠于自己”评价', originConfidence: '较可信', spread: '经 Lil B、论坛、游戏和政治网络社群广泛传播', currency: '圈层常见', register: '网络语境', risk: 'yellow', production: '观察后使用', evidenceSourceIds: ['mw-slang-index'], neutralAlternatives: ['Bold', 'I agree'], caution: '单独 based 可能被解读为认同完整政治立场，先看讨论主题和社群',
    examples: [{ context: '朋友公开承认不喜欢热门作品', line: 'Calling it overrated in that group was kind of based.', translation: '在那个群里说它被高估了，确实挺敢说' }], prompt: '称赞朋友敢于表达不受欢迎的真实看法', keywords: ['based'],
  },
  {
    id: 'ratioed', phrase: 'Ratioed', variants: ['Ratio'], meaning: '一条回复获得的互动明显超过原帖，暗示公众反对或嘲讽原帖', function: '描述互动压倒原帖', module: 'current',
    provenance: '社交平台公开的回复、点赞和转发数字形成“比例”判断，Twitter 文化把 ratio 固定为动词和结果标签', literalMeaning: '互动比例对原帖不利', originConfidence: '较可信', spread: '从 Twitter/X 扩展到其他平台和更泛化的失败迷因', currency: '圈层常见', register: '网络语境', risk: 'yellow', production: '识别为主', evidenceSourceIds: ['mw-internet', 'mw-slang-index'], neutralAlternatives: ['The reply got much more support'], caution: '互动数不等于事实判断，避免把受欢迎程度当作证据',
    examples: [{ context: '一条回复比原帖获赞更多', line: 'The correction ratioed the original post.', translation: '那条纠正回复的互动压过了原帖' }], prompt: '说明纠正回复的互动量压过了原帖', keywords: ['ratio', 'ratioed'],
  },
  {
    id: 'npc-slang', phrase: 'NPC', variants: ['Non-player character'], meaning: '原指非玩家角色；网络上也用来贬低某人像没有独立思想的背景人物', function: '识别游戏借喻', module: 'current',
    provenance: '角色扮演游戏术语 non-player character 的缩写，被网络政治和迷因语境借来评价真人', literalMeaning: '不由玩家控制的游戏角色', originConfidence: '有文献记录', spread: '从桌面和电子游戏进入直播、政治讨论和短视频迷因', currency: '圈层常见', register: '网络语境', risk: 'red', production: '识别为主', evidenceSourceIds: ['mw-gaming', 'mw-slang-index'], neutralAlternatives: ['Background character', 'Unoriginal'], caution: '用它称呼真人会否定对方主体性，容易构成去人格化攻击',
    examples: [{ context: '分析网络侮辱', line: 'Calling real people NPCs dismisses them as mindless background characters.', translation: '把真人叫 NPC 会把他们贬成没有思想的背景角色' }], prompt: '解释为什么用 NPC 称呼真人带去人格化风险', keywords: ['npc', 'non player character'],
  },
  {
    id: 'chat-address', phrase: 'Chat', meaning: '直播者或创作者把观众整体当作一个群体来称呼，后来也被拿到线下开玩笑', function: '称呼观众群体', module: 'current',
    provenance: '直播聊天室界面中的 chat 从消息区域转指发送消息的观众群体', literalMeaning: '聊天室及其中的观众', originConfidence: '较可信', spread: '经 Twitch、YouTube 直播和短视频创作者口语广泛传播，也出现 “Chat, is this real?” 迷因句式', currency: '当前流行', register: '网络语境', evidenceSourceIds: ['mw-internet'], neutralAlternatives: ['Everyone', 'Audience'],
    examples: [{ context: '主播问观众意见', line: 'Chat, should we try that level again?', translation: '各位观众，我们要不要再试一次那关' }], prompt: '作为主播向全体观众询问是否再试一关', keywords: ['chat'],
  },
]

expressions.push(...expandedSeeds.map(define), ...everydayExpansionSeeds.map(define), ...gamingSeeds.map(define), ...cultureSeeds.map(define), ...roughSeeds.map(define), ...currentSeeds.map(define))

export const expressionById = new Map(expressions.map((expression) => [expression.id, expression]))

export const expressionsByModule = (moduleId: string) => expressions.filter((expression) => expression.module === moduleId)

export const searchExpressions = (query: string, risk: string, moduleId: string) => {
  const normalized = query.trim().toLowerCase()

  // 检索同时覆盖英文原形、中文含义、功能和标签，减少学习者必须记住准确拼写的负担
  return expressions.filter((expression) => {
    const matchesText = !normalized || [
      expression.phrase,
      ...expression.variants,
      expression.meaning,
      expression.function,
      expression.origin,
      expression.spread,
      expression.category,
      ...expression.scenes,
    ].join(' ').toLowerCase().includes(normalized)
    const matchesRisk = risk === 'all' || expression.risk === risk
    const matchesModule = moduleId === 'all' || expression.module === moduleId
    return matchesText && matchesRisk && matchesModule
  })
}
