# Simple Made Easy

> **原文链接:** [Strange Loop 2011 演讲(InfoQ 完整视频)](https://www.infoq.com/presentations/Simple-Made-Easy/) · [演讲 slides PDF](https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/SimpleMadeEasy.md)
>
> **作者:** Rich Hickey(Clojure 设计者)
>
> **发表:** Strange Loop 2011 大会演讲(~60 分钟)
>
> **主题:** 过去 15 年被程序员引用最多的技术演讲之一。Hickey 把 **"simple"** 和 **"easy"** 这两个日常混用的词**精确区分**,并引入一个英语动词 **"complect"**(把本来分开的东西缠在一起)作为**复杂性的技术根源**。这个词汇系统——simple / easy / complect / decomplect——成了一代工程师做架构评审时的通用语言。

---

## 为什么这篇重要 / Why This Matters

2011 年前,程序员谈"简单"时用词混乱:

- "这个 API **简单**" — 意思是**熟悉**
- "这个框架**容易上手**" — 意思是**接近我的心智模型**
- "这个代码**简洁**" — 意思是**短**

所有这些"简单"都和**真正的软件复杂性**没有必然联系——**它们在说"对我来说舒服"**,不是"系统本身没有多余的纠缠"。

Hickey 用 60 分钟做了一件事:**把"简单"从主观感受,变成客观属性**。

1. **Simple(简单)= 客观属性:** 一个概念/组件不和其他东西**缠在一起**(not complected)
2. **Easy(容易)= 主观感受:** 对当前这个人,基于他的既有技能,触手可及

**这两个词不是同义词。** 一个东西可以 easy 但 complected(比如 Ruby on Rails 对熟悉它的人很 easy,但内部高度耦合);也可以 simple 但 hard(比如 Git 本身结构简单,但概念上很 hard 学)。

**"你要的是 simple,不是 easy"** —— 这句话在 2011 年之后成为程序员对抗工具诱惑的盾牌。

---

## 1. 核心词汇 / The Vocabulary

Hickey 的演讲**大半是在建立一组词汇**。一旦你掌握这套词汇,整个职业生涯的架构讨论都变容易。

### 1.1 Simple / Easy 的词源

Hickey 做词源学考察:

- **Simple** — 来自拉丁语 *simplex*,意思是 "one fold"(单层/单纤维)
  - 反义词:**complex** (多层缠绕)
  - **是关于结构的客观描述**
  
- **Easy** — 来自古法语 *aisie* ("在附近、不远")
  - 反义词:**hard**
  - **是关于距离的主观感受**(距离你的 current skill 有多远?)

**关键洞察:** 这两个词的反义词不一样——**不是同义词**。

### 1.2 "Complect" —— Hickey 复活的关键动词

**Complect** 是 Hickey 从古英语里挖出来的词:"to interleave, to braid together"(交织、编辫子)。

他用这个词定义**复杂性的来源**:

> **"Complexity comes from complecting things that don't have to be together."**
>
> **"复杂性来自于把不必绑在一起的东西编织在一起。"**

举例:

- **State + Identity complected** → 变量(你不能独立谈"this value"和"the changing reference")
- **Control flow + error handling complected** → try/catch(你不能独立讨论"发生了什么"和"该怎么跳出")
- **Object identity + state + behavior complected** → 可变对象(object mutation 把三件事 entangle 在一起)

**Decomplect** = 把它们拆开(Clojure 的核心哲学)。

### 1.3 Hickey 的判断准则

- 一个设计 / API / 工具的**客观复杂度**:取决于它 **complect 了多少东西**
- 它的**主观难度**:取决于**它与你当前技能的距离**
- **你应该优化 simple,不是 easy** —— 因为:
  - Simple 的东西**可以组合**(你未来可能组合出任何不熟悉的 pattern)
  - Easy 的东西**可能 complected**——看似熟悉,使用时会突然陷入耦合无法逃脱

---

## 2. 六组 Complected 的典型案例 / Six Common Complections

Hickey 列出程序员每天接触但没意识到的复杂源。**这一组是演讲最实用的部分**——给你一张"看复杂性的 check list":

### 2.1 State vs Value

| 概念 | 含义 |
|---|---|
| **Value** | 不可变、time-independent(数字 42、字符串 "hello") |
| **Identity** | 对一个"东西"的稳定指代(账户 #12345) |
| **State** | Identity 在某个时间点对应的 value |

**Complected**:可变变量 `x = 5` 把 value、identity、state 全缠在一起。
**Simple 替代品**:immutable data + 显式 reference(Clojure 的 atoms,Haskell 的 IORef,Rust 的 `Cell`)。

### 2.2 Objects

Hickey 对 OOP 的经典攻击:**对象把 state + identity + behavior complect 在一起,而这三者不必绑定**。

**Simple 替代**:分开——**纯函数处理 value + 独立的 identity / state 管理 + 函数组合代替方法调用**。

### 2.3 Variables

**Complected**:名字(identifier)+ 内存位置 + 当前值 —— 全在 `x` 这一个词里。

**Simple 替代**:let-bindings(Clojure `let` / Rust `let`) + 单次赋值。

### 2.4 Methods

**Complected**:方法绑定到**一个类**(function + class coupling)。
**Simple 替代**:多方法(multimethods)/ protocols,把 "dispatch rule" 从 class 中解放。

### 2.5 Syntax

**Complected**:操作符优先级 + 隐式转换 + 语法糖 + 类型推断 —— 全部混在一起。
**Simple 替代**:**Lisp 的 S-expression**——`(+ 1 2 3)`,没有优先级、没有糖、结构 = 语法。

(这是 Clojure 的设计基础,也是 Hickey 对 Lisp 的辩护)

### 2.6 Conditionals

**Complected**:if-else 把"这种情况"和"那种情况"的代码**物理缠在一起**。
**Simple 替代**:分派表、pattern matching、多方法——每个 case 独立。

---

## 3. 演讲里最被引用的 3 段 / The Most-Quoted Moments

### 3.1 "Complexity does not matter if we choose Simple"

> *"Simple or complex is objective. Easy or hard is relative."*
>
> *简单或复杂是**客观的**。容易或困难是**相对的**。*

这句话直接引入了"客观 vs 主观"的区分,是整个演讲的轴。

### 3.2 "You can't solve complexity by adding tools. You solve it by removing complections."

> *"Adding complexity management tools just adds more complexity. The solution is to stop complecting things in the first place."*
>
> *加复杂性管理工具只是加了更多复杂性。真正的解法是**一开始就别缠在一起**。*

**对 AI 时代的含义:** 你**不能**用更多的 agent、更多的 layer、更多的 tool 来管理一个复杂 agent 系统的复杂性。你要**在设计时就保持 decomplected**。

### 3.3 "Programmers know the benefits of everything and the tradeoffs of nothing."

> *"We, as programmers, know the benefits of everything and the tradeoffs of nothing. This is true of every technology—everything has a tradeoff. And our job is to know those tradeoffs."*
>
> *我们程序员**知道一切的好处,不知道任何一个的代价**。这是每种技术的真相——每件事都有 tradeoff。我们的工作是**知道这些 tradeoff**。*

这是对技术社区"技术选型=比功能列表"现象的批评。真正成熟的工程师**用 tradeoff 的词汇**而不是 feature 的词汇讨论技术。

---

## 4. 这个词汇在 2026 年的 AI 工程里 / Applying to AI Engineering

Hickey 2011 年没有预见 LLM / agent 系统,但他的词汇**出奇地适合**分析现代 AI 工程:

### 4.1 LangChain 典型地 complect

LangChain 把**多件事**缠在一起:

- Prompt template 管理
- Chain execution
- Memory
- Tool calling
- Retry logic
- Tracing

**结果:** 如果你想"只用 LangChain 的 prompt 管理,不用它的 chain",非常难——它们被 complect 了。

**Hickey 会说:** 应该有 6 个独立 library,每个做一件事,你自己 compose。

**2025 之后趋势:** 越来越多团队抛弃 LangChain,回到**直接调 API + 少数几个独立 library** —— 这就是 decomplecting 在发生。

### 4.2 Agent state + execution + memory 的常见 complection

很多 agent 框架把:
- Agent state(当前的 goal)
- Execution history(trajectory)
- Long-term memory(across sessions)

绑在同一个 `Agent` 对象里。**看似 easy(一个 object 搞定一切),但 complected**:

- 想换一个 memory backend → 动整个 Agent
- 想并行 agent 但共享 memory → 撞耦合
- 想记录 trajectory 不记录 state → 做不到

**Simple 替代:** 三个独立模块,各自有 interface,通过函数组合而非对象嵌套协作。Anthropic 的 [Building Effective Agents](../agent-patterns/anthropic-building-effective-agents.md) 提倡的 orchestrator-workers、evaluator-optimizer 就是 decomplecting 的典范。

### 4.3 Prompt + Model 的 complection

很多系统把 prompt template **硬编码**到 model call 代码里:

```python
def classify(text):
    return openai.chat(model="gpt-4", messages=[
        {"role": "system", "content": "You classify text into..."},
        {"role": "user", "content": text}
    ])
```

**Complected:** prompt 改一个字 = 代码 diff,A/B test 不同 prompt 困难,不同语言版本的 prompt 要改源码。

**Simple 替代:** Prompt 从代码抽离,**版本化、独立管理**。2026 年主流团队都做这个。

### 4.4 Agent 工具权限的 complection

Agent 的"有哪些工具"和"在什么情境下调用什么"常常 complected——一个巨型 tool 描述文件。

**Simple 替代:** tool registry 和 tool selection strategy 分开——可以不动工具定义换选择策略。

---

## 5. 工程师视角的关键启示 / Key Takeaways

### 5.1 审架构时先问:什么 complect 在一起了?

每次做代码 review / 架构 review,用 Hickey 的 lens 扫一遍:

- "这两个概念为什么在同一个 class/module/file 里?"
- "如果我想独立替换 A 或 B,需要动几处?"
- "改 A 的时候我能不需要读 B 吗?"

如果任何一个答案不理想——**它们被 complect 了**。

### 5.2 "容易上手"不等于"简单"

工具评估时,这两个维度要**分开打分**:

| 工具 | Easy(距离你 current skill) | Simple(内部是否 complected) |
|---|---|---|
| LangChain | 很 easy(文档多、抄 tutorial 5 分钟跑) | 不 simple(内部高度 complect) |
| 直接用 OpenAI SDK | 看似 easy 一点点 | 非常 simple(clear 分层) |
| Rust | hard(借用检查学习陡) | simple(编译器强制你 decomplect) |
| Ruby on Rails | 极度 easy(convention over config) | 不 simple(全栈魔法) |

**你要的是 simple 的东西——即使它 hard**。因为复杂性会反咬你,而学习曲线只咬一次。

### 5.3 "Programmers know benefits, not tradeoffs"

review 任何技术选型提案时,逼自己列:**每一个"优点",它的 tradeoff 是什么?**

如果提案者列不出 tradeoff——他/她没想清楚。**所有技术决策都是 tradeoff。**

### 5.4 不要用"加工具"解决"complected"问题

**经典反 pattern:** 一个系统复杂了 → 加一个 monitoring layer → 更复杂 → 加一个 config management → 更复杂 → 加一个 workflow engine → ...

Hickey 的断言:**这是在 complect 上再 complect,不是在解决**。

**正确做法:** 找到根源的 complection,在那里 decomplect。Monitor / config / workflow 这些都是补救措施,不是解法。

### 5.5 在 AI 工程里,prompt / model / memory / tool 应该是 4 个独立的 layer

**别把它们 complect 成一个 "AgentClass"**。每个独立版本化、独立测试、独立替换。这是 2026 年生产级 agent 系统的默认架构。

### 5.6 当你写不出"我在解决什么 complection"时,你可能没写软件,只是写代码

Hickey 的终极标准:**好的软件设计师看任何系统,都能指出它的 complection 在哪里、怎么 decomplect**。

如果你写了 3 个月代码,但说不出"我在 decomplect 什么"——你可能在做的是**feature accretion(功能堆砌)**,不是 engineering。

---

## 6. 和本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| [Parnas — Decomposing Modules](parnas-modules.md) | Parnas 的"信息隐藏"**是一种具体的 decomplection**——把"决策"和"使用"拆开。Hickey 把 Parnas 的洞察推广成一整套词汇 |
| [Brooks — No Silver Bullet](no-silver-bullet.md) | Brooks 说 essential complexity 不可消除——Hickey 给出**具体方法**:不要 complect,让 essence 独立显现 |
| [Hoare — Emperor's Old Clothes](hoare-emperors-old-clothes.md) | Hoare 的 "simple obviously" 就是 Hickey 的 "simple"——两代人对 simplicity 的精确主张 |
| [Anthropic Building Effective Agents](../agent-patterns/anthropic-building-effective-agents.md) | 5 个 pattern 本质是 agent 系统的 decomplecting 指南——每个 pattern 把一种 concern 独立出来 |
| [Anthropic Harness Design](../agent-patterns/harness-design-long-running-apps.md) | Generator / Evaluator / Planner 的三 agent 分工是 decomplecting 的典范——three decoupled roles, not one complected agent |
| [AgentFactory](../self-improving-agents/agent-factory.md) | 每个子 agent 是**一个独立的、不 complected 的单元**,可组合可复用 |
| [Software 2.0](software-2-0.md) | Software 1.0 / 2.0 分层**本身**是 decomplection——显式代码 vs 学习参数分开 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **给工程师提供了日常使用的词汇** — "simple / easy / complect / decomplect" 是 15 年后仍在用的 mental model
- **精确的批判火力** — 演讲以"看似无害的常见 pattern"为靶子,逐一分析。你听完不会再用一样的眼光看 object、state、method
- **作者本人是重量级设计师** — Hickey 不只讲理论,他设计了 **Clojure**(影响了 Rust 的设计、influential on Scala、启发多个后续语言) + **Datomic** + **core.async**
- **演讲本身是艺术品** — 60 分钟,结构清晰、节奏紧凑、没有废话——看演讲本身也是一门工程课
- **2026 年 AI 工程最需要** — agent 系统比传统软件**更容易 complect**(LangChain / Autogen / 各种框架都在这么做),Hickey 的词汇给你**诊断和反抗的工具**

---

## References / 参考

- **演讲资源:**
  - [InfoQ 完整视频(~60 min)](https://www.infoq.com/presentations/Simple-Made-Easy/)
  - [演讲 slides](https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/SimpleMadeEasy.md)
  - [YouTube 备份](https://www.youtube.com/watch?v=SxdOUGdseq4)
- **作者其他经典演讲(强烈推荐):**
  - [Hammock Driven Development (2010)](https://www.youtube.com/watch?v=f84n5oFoZBc) — 思考在编程中的角色
  - [The Value of Values (2012)](https://www.infoq.com/presentations/Value-Values/) — 值 vs 对象
  - [The Language of the System (2015)](https://www.youtube.com/watch?v=ROor6_NGIWU) — 系统之间的语言
- **作者主要产品:**
  - [Clojure (2007+)](https://clojure.org/) — Lisp on JVM,函数式、immutable、concurrency-first
  - [Datomic](https://www.datomic.com/) — 数据库,基于 immutable value 思想
- **相关书:**
  - [A Philosophy of Software Design (John Ousterhout, 2018)](https://web.stanford.edu/~ouster/cgi-bin/book.php) — 把 Hickey 思想扩展成系统性方法论
- **本仓库相关:**
  - [Parnas — Modules](parnas-modules.md) · [Brooks — No Silver Bullet](no-silver-bullet.md)
  - [Hoare — Emperor's Old Clothes](hoare-emperors-old-clothes.md)
  - [Anthropic Building Effective Agents](../agent-patterns/anthropic-building-effective-agents.md) · [AgentFactory](../self-improving-agents/agent-factory.md)
  - [Software 2.0](software-2-0.md)
