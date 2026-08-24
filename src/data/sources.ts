import type { ContentSource } from '../types'

// 来源表只保存能够直接打开的资料；卡片中的“来源”和“传播”仍由编辑内容分别陈述
export const contentSources: ContentSource[] = [
  { id: 'cambridge-spoken', title: 'Spoken English', publisher: 'Cambridge Dictionary', url: 'https://dictionary.cambridge.org/grammar/british-grammar/spoken-english', scope: '口语分块、省略、礼貌、语气和常见会话结构', accessedAt: '2026-08-23' },
  { id: 'cambridge-discourse', title: 'Discourse markers (so, right, okay)', publisher: 'Cambridge Dictionary', url: 'https://dictionary.cambridge.org/grammar/british-grammar/discourse-markers', scope: '开启、衔接、回应、换题、软化和结束对话', accessedAt: '2026-08-23' },
  { id: 'cambridge-chunks', title: 'Chunks', publisher: 'Cambridge Dictionary', url: 'https://dictionary.cambridge.org/grammar/british-grammar/chunks', scope: '口语中反复出现的固定语块和模糊表达', accessedAt: '2026-08-23' },
  { id: 'cambridge-functions', title: 'Functions', publisher: 'Cambridge Dictionary', url: 'https://dictionary.cambridge.org/grammar/british-grammar/functions', scope: '问候、告别、请求、邀请、建议、电话和警示等交际功能', accessedAt: '2026-08-23' },
  { id: 'cambridge-offers', title: 'Offers', publisher: 'Cambridge Dictionary', url: 'https://dictionary.cambridge.org/grammar/british-grammar/offers', scope: '主动帮助、提供物品以及接受和拒绝帮助', accessedAt: '2026-08-23' },
  { id: 'british-speaking', title: 'Practise English speaking skills', publisher: 'British Council LearnEnglish', url: 'https://learnenglish.britishcouncil.org/free-resources/speaking', scope: 'A1 至 B2 日常沟通场景和功能语言课程地图', accessedAt: '2026-08-23' },
  { id: 'british-favour', title: 'Asking a favour', publisher: 'British Council LearnEnglish', url: 'https://learnenglish.britishcouncil.org/free-resources/speaking/b1/asking-favour', scope: '请求帮助、回应请求和礼貌拒绝', accessedAt: '2026-08-23' },
  { id: 'british-news', title: 'Responding to news', publisher: 'British Council LearnEnglish', url: 'https://learnenglish.britishcouncil.org/free-resources/speaking/b1/responding-news', scope: '回应好消息、坏消息、祝贺和提供支持', accessedAt: '2026-08-23' },
  { id: 'mw-slang-method', title: 'Slang and the Dictionary', publisher: 'Merriam-Webster', url: 'https://www.merriam-webster.com/wordplay/slang-and-the-dictionary', scope: '俚语收录与实际用例判断方法', accessedAt: '2026-08-23' },
  { id: 'mw-slang-index', title: 'Merriam-Webster Slang', publisher: 'Merriam-Webster', url: 'https://www.merriam-webster.com/slang', scope: '当代俚语词条与使用状态', accessedAt: '2026-08-23' },
  { id: 'mw-internet', title: 'OMG: The Internet and the Dictionary', publisher: 'Merriam-Webster', url: 'https://www.merriam-webster.com/wordplay/omg-the-internet', scope: '网络语言的用例证据与词典记录', accessedAt: '2026-08-23' },
  { id: 'mw-gaming', title: 'Popular Gaming Terms Explained', publisher: 'Merriam-Webster', url: 'https://www.merriam-webster.com/wordplay/popular-gaming-terms-explained', scope: '常见游戏用语', accessedAt: '2026-08-23' },
  { id: 'mw-nerf', title: 'Nerf', publisher: 'Merriam-Webster', url: 'https://www.merriam-webster.com/slang/nerf', scope: 'nerf 的游戏词源与传播', accessedAt: '2026-08-23' },
  { id: 'riot-pact', title: 'Riot Games Community Pact', publisher: 'Riot Games', url: 'https://www.riotgames.com/en/community-pact', scope: 'AFK、inting、griefing、smurfing 等玩家行为术语', accessedAt: '2026-08-23' },
  { id: 'oxford-current', title: 'Oxford Word of the Year', publisher: 'Oxford Languages', url: 'https://corp.oup.com/word-of-the-year/', scope: 'rage bait、aura farming 等近期传播记录', accessedAt: '2026-08-23' },
  { id: 'oxford-brain-rot', title: 'Brain Rot Named Oxford Word of the Year 2024', publisher: 'Oxford University Press', url: 'https://corp.oup.com/news/brain-rot-named-oxford-word-of-the-year-2024/', scope: 'brain rot 的早期记录与当代传播', accessedAt: '2026-08-23' },
  { id: 'dictionary-current', title: 'Slang Trends That Explain 2024', publisher: 'Dictionary.com', url: 'https://www.dictionary.com/articles/slang-trends-that-explain-2024', scope: 'skibidi、gyatt、let them cook 等近期用法', accessedAt: '2026-08-23' },
  { id: 'language-jones-aave', title: 'What Is AAVE?', publisher: 'Language Jones', url: 'https://www.languagejones.com/blog-1/2014/6/8/what-is-aave', scope: '非裔美国英语是完整语言变体及其研究边界', accessedAt: '2026-08-23' },
  { id: 'mw-tea', title: 'Tea: A Historical Slang Term', publisher: 'Merriam-Webster', url: 'https://www.merriam-webster.com/wordplay/tea-slang-meaning-origin', scope: 'tea 的黑人变装与酷儿文化记录', accessedAt: '2026-08-23' },
  { id: 'mw-woke', title: 'The Meaning of Woke', publisher: 'Merriam-Webster', url: 'https://www.merriam-webster.com/wordplay/woke-meaning-origin', scope: 'woke 在黑人英语中的历史记录与后续语义变化', accessedAt: '2026-08-23' },
  { id: 'type-shit-kym', title: 'Type Shit / Type Shi', publisher: 'Know Your Meme', url: 'https://knowyourmeme.com/memes/type-shit-shi-slang', scope: 'type shit 的早期网络记录与 2020 年代传播', accessedAt: '2026-08-23' },
  { id: 'type-shit-wiktionary', title: 'type shit', publisher: 'Wiktionary', url: 'https://en.wiktionary.org/wiki/type_shit', scope: '粗俗等级、主要使用社群与常见功能', accessedAt: '2026-08-23' },
]

export const contentSourceById = new Map(contentSources.map((source) => [source.id, source]))
