const ZH_MARKERS = /[\u3400-\u9fff]/;

const ABSOLUTES = [
  [/\b(always|never|everyone|nobody|everything|nothing)\b/gi, "$1"],
  [/(总是|从来|永远|所有人|没人|什么都|一切都)/g, "$1"],
];

const LABELS = [
  [/\b(i am|i'm)\s+(useless|a failure|stupid|lazy|pathetic|broken|hopeless)\b/i, "identity"],
  [/(我(就是|是)?)(一个?)?(没用|失败|废物|懒|笨|脆弱|无可救药)(的)?(人|人)?/, "identity"],
  [/\b(they|people|everyone)\s+(hate|hates|dislike|dislikes|judge|judges|look|looks)\s*(down on\s+)?me\b/i, "mind-reading"],
  [/(他们|别人|大家)(一定|肯定)?(都)?(讨厌|看不起|觉得|嫌弃)我/, "mind-reading"],
  [/\b(i (will|am going to)|this will)\s+(fail|go wrong|be a disaster)\b/i, "prediction"],
  [/(我|这件事)(一定|肯定|绝对)?(会失败|完了|做不好)/, "prediction"],
];

const DICT = {
  zh: {
    acknowledgement: "这句话里有很重的压力。先不用把它变积极；这种难受值得被承认。",
    fact: "目前能确认的是：你正在经历一件让你难受、担心或失望的事。原句没有提供足够信息证明那些绝对结论。",
    interpretation: "这句话把此刻的感受，扩大成了对自己、别人或未来的完整结论。感受是真的，结论仍需要证据。",
    rewrite: "我现在很难受，也正在把最坏的解释当成事实。更准确地说：有一件事没有按我期待的方式发生，但这还不能定义我的全部，也不能证明接下来一定会失败。",
    next: "我可以先补充一个可观察到的事实，再决定我要相信什么。",
  },
  en: {
    acknowledgement: "There is a lot of pressure in that sentence. It does not need to become positive yet; the distress deserves to be acknowledged.",
    fact: "What we can confirm is that something has left you hurt, worried, or disappointed. The sentence does not give enough evidence for its absolute conclusions.",
    interpretation: "The thought turns a real feeling in this moment into a total conclusion about you, other people, or the future. The feeling is real; the conclusion still needs evidence.",
    rewrite: "I feel overwhelmed right now, and I may be treating the worst interpretation as fact. More accurately: something did not go the way I hoped, but that does not define all of me or prove what will happen next.",
    next: "I can add one observable fact before deciding what this moment means.",
  },
};

const PATTERNS = {
  identity: {
    zh: "原句把一次处境或一段状态，写成了固定身份。一次没做到，不等于‘我就是这样的人’。",
    en: "The sentence turns one situation or period into a fixed identity. Not doing something once is not the same as being that kind of person.",
  },
  "mind-reading": {
    zh: "原句在替别人下结论。你可能感到被拒绝，但还不知道对方真实的想法。",
    en: "The sentence decides what other people think. You may feel rejected, but their actual thoughts are not yet known.",
  },
  prediction: {
    zh: "原句把担心写成了预言。害怕失败说明这件事重要，不等于失败已经发生。",
    en: "The sentence turns fear into a forecast. Fear of failure can show that this matters; it does not mean failure has already happened.",
  },
  absolute: {
    zh: "原句使用了绝对词，把一个时刻扩展成了‘一直如此’。可以检查是否存在例外。",
    en: "The sentence uses absolute language and stretches one moment into ‘always.’ It may help to look for exceptions.",
  },
};

function detectLanguage(text) {
  return ZH_MARKERS.test(text) ? "zh" : "en";
}

function detectPattern(text) {
  for (const [regex, type] of LABELS) if (regex.test(text)) return type;
  for (const [regex] of ABSOLUTES) if (regex.test(text)) return "absolute";
  return "general";
}

function clean(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, 2000);
}

function rewriteSpecific(text, lang, type) {
  const quoted = text.length > 140 ? `${text.slice(0, 137)}…` : text;
  if (lang === "zh") {
    if (type === "identity") return `我现在因为一件没有做好的事而怀疑自己。原来的想法是“${quoted}”，但一次结果不能概括我的价值。`;
    if (type === "mind-reading") return `我感到自己可能不被喜欢，而我现在还不知道别人真正怎么想。我的不安是真实的，但“他们都这样想”仍是解释。`;
    if (type === "prediction") return `我很担心接下来会失败。失败是一种可能，不是已经发生的事实；我可以先看下一步真实会发生什么。`;
    if (type === "absolute") return `这件事现在让我觉得“${quoted}”。更准确地说，它在这个时刻很难受；我还需要看看是否真的没有例外。`;
  } else {
    if (type === "identity") return `I am judging myself because something did not go well. The thought was “${quoted},” but one result cannot summarize my worth.`;
    if (type === "mind-reading") return `I feel as if I may be disliked, and I do not yet know what other people actually think. My unease is real; “they all think that” is still an interpretation.`;
    if (type === "prediction") return `I am afraid I will fail. Failure is a possibility, not a fact that has already happened; I can look at what the next step actually shows.`;
    if (type === "absolute") return `Right now, this makes “${quoted}” feel true. More accurately, this moment is painful; I still need to check whether there are exceptions.`;
  }
  return DICT[lang].rewrite;
}

export function translateInnerTalk(rawText) {
  const text = clean(rawText);
  if (!text) throw new Error("EMPTY_INPUT");
  const sourceLanguage = detectLanguage(text);
  const pattern = detectPattern(text);
  const primary = DICT[sourceLanguage];
  const secondaryLanguage = sourceLanguage === "zh" ? "en" : "zh";
  const secondary = DICT[secondaryLanguage];
  const patternPrimary = PATTERNS[pattern]?.[sourceLanguage] ?? primary.interpretation;
  const patternSecondary = PATTERNS[pattern]?.[secondaryLanguage] ?? secondary.interpretation;

  return {
    sourceLanguage,
    pattern,
    primary: {
      acknowledgement: primary.acknowledgement,
      fact: primary.fact,
      interpretation: patternPrimary,
      rewrite: rewriteSpecific(text, sourceLanguage, pattern),
      next: primary.next,
    },
    secondary: {
      language: secondaryLanguage,
      acknowledgement: secondary.acknowledgement,
      fact: secondary.fact,
      interpretation: patternSecondary,
      rewrite: rewriteSpecific(text, secondaryLanguage, pattern),
      next: secondary.next,
    },
  };
}

export function containsCrisisLanguage(rawText) {
  const text = clean(rawText).toLowerCase();
  return /(不想活|想死|自杀|伤害自己|kill myself|suicide|end my life|hurt myself)/i.test(text);
}
