# On the Criteria to Be Used in Decomposing Systems into Modules

> **原文链接:** [ACM Digital Library (paywalled)](https://dl.acm.org/doi/10.1145/361598.361623) · [PDF (开放版本)](https://www.cs.umd.edu/class/spring2003/cmsc838p/Design/criteria.pdf)
>
> **作者:** David L. Parnas（卡内基梅隆大学,后任职于麦克马斯特大学）
>
> **发表:** Communications of the ACM, Vol. 15, No. 12, December 1972
>
> **主题:** **"信息隐藏" (Information Hiding) 的原始论文。** 过去 50 年每一次你决定"这个函数要不要暴露"、"两个模块的 contract 是什么"、"服务之间传什么"——都在用 Parnas 1972 年定下的框架。与其他只给"原则"的软件工程论文不同,Parnas 用**同一个程序的两种分解**做对比,实证证明了他的观点。

---

## 为什么这篇重要 / Why This Matters

在 Parnas 之前,软件设计有一条**被当作常识的规则**:

> "按程序执行的**时间顺序/流程**分解系统"——比如"先 parse 输入 → 然后 transform → 然后 output"。

这被视为自然的,也是当时教科书的标准做法。

Parnas 用一个 KWIC(key-word-in-context)索引程序做实验:

- **方法 1:** 按传统(流程)分解成 5 个模块
- **方法 2:** 按"**每个模块隐藏一个设计决策**"分解成 5 个模块

然后提出一组 test:**如果某个需求变了(输入格式、内存约束、字符集),哪种分解需要改动多少模块?**

结果:

| 变更类型 | 方法 1(流程分解)需要改的模块数 | 方法 2(信息隐藏)需要改的模块数 |
|---|---|---|
| 输入格式改变 | 多个 | **1** |
| 内存约束改变 | 多个 | **1** |
| 排序算法改变 | 多个 | **1** |
| 字符集改变 | 多个 | **1** |

**这是第一次有人用**经验证据**证明"按信息隐藏分解"优于"按流程分解"。** 这篇论文把模块化从**艺术**升级为**工程**。

1972 年之后 50 多年,**OOP 的封装、微服务的边界、REST API 的 contract、函数式语言的 module system、Rust 的 trait / impl、Haskell 的 typeclass**——本质都是 Parnas 这个框架的再次演绎。

---

## 1. 核心命题 / The Core Thesis

> **"Every module in the 'information hiding' decomposition hides a single design decision from the rest of the system."**
>
> **"信息隐藏分解中的每个模块都隐藏一个**设计决策**,不让系统的其他部分看到。"**

**拆解三个关键点:**

### 1.1 "设计决策"是模块的单位,不是"过程"

Parnas 改变了模块的**目的论定义**:

- ❌ 旧观点:模块 = 执行某个**过程**的代码块
- ✅ 新观点:模块 = 封装一个**可能变化的设计决策**的代码块

**每个模块的存在理由 = 它保护的决策**。如果这个决策不变,模块的**接口**不变。

### 1.2 模块的接口 ≠ 模块内部

Parnas 非常强调这个区分:

- **接口(Interface):** 其他模块**必须知道**的部分(函数签名、返回类型、语义 contract)
- **内部(Internal):** 其他模块**不能知道**的部分(数据结构选择、算法、中间状态)

**"不能知道"比"不必知道"强得多。** Parnas 说:**让模块之间物理上看不到彼此的内部**——这样才能强制信息隐藏。

2026 年的现代实现:
- Java/C# 的 `private` / `protected` / `public` 修饰符
- Rust 的 `pub` 和 `pub(crate)`
- TypeScript 的 `interface` 和内部 class
- Python 的 `__name_mangling` (虽然弱)
- 微服务架构的 "接口是 OpenAPI schema,内部实现隐藏在 container 内"

### 1.3 "可能变化"是模块划分的启发式

Parnas 的具体操作方法:

1. 列出系统中**最可能变化的决策**(数据格式、存储方式、算法、UI 风格、外部 API)
2. **每一个可能变化的决策 → 一个模块**
3. 这个模块的接口应该**对这个决策变化免疫**

**这个启发式 50 年没有过时。** 每次你做架构决策时都该问自己:**"我们 1 年后最可能改什么?那就应该是一个模块的内部。"**

---

## 2. KWIC 实验的细节 / The KWIC Experiment

Parnas 用一个具体的程序作为对照实验——**KWIC index**(key-word-in-context 索引):

### 2.1 问题描述

输入:一系列"行"(每行是若干 word)
输出:每一个 word 轮转作为第一个 word 的全部 rotation,按字母排序

例如输入 `"The quick brown fox"`:
- 输出所有 rotations:`"The quick brown fox" / "quick brown fox The" / "brown fox The quick" / "fox The quick brown"`
- 排序后输出

### 2.2 方法 1:按流程分解

```
Module 1: Input        — 读输入
Module 2: Circular Shift — 生成所有 rotations
Module 3: Alphabetize    — 排序
Module 4: Output         — 输出结果
Module 5: Master Control — 协调前 4 个
```

**这看起来"干净"、"对应流程"。** 但 Parnas 指出它的**致命缺陷**:每个模块都**共享相同的底层数据结构**(一个装字符的数组)。

结果:
- 若数据结构改(换 linked list、换 rope 数据结构),**所有模块都要改**
- 若输入格式改(加 header),**多个模块都要动**
- 若内存约束改(不能一次全放内存),**几乎全部重写**

### 2.3 方法 2:按信息隐藏分解

```
Module 1: Line Storage     — 隐藏"行怎么存"的决策
Module 2: Input            — 隐藏"如何从外部读入"的决策
Module 3: Circular Shifter — 隐藏"rotations 怎么表示"的决策
Module 4: Alphabetizer     — 隐藏"排序怎么做"的决策
Module 5: Output           — 隐藏"如何写出"的决策
Module 6: Master Control   — 协调
```

表面上看模块名差不多,但**每个模块有不同的接口**:

- Line Storage 不再暴露"字符数组"——只暴露 `getChar(line, word, char)`、`addLine()`
- Circular Shifter 不再暴露它**实际产生了所有 rotation**——可能它按需计算每一个,也可能全部 precompute。调用方无法区分。

**每个模块内部可以独立重写**——只要接口不变。

### 2.4 实际效果:同一变更下两种分解的成本

Parnas 列出 6 种可能的系统变更,统计每种分解需要改多少模块:

| 变更 | 方法 1 改动 | 方法 2 改动 |
|---|---|---|
| 行以字符流 vs 字符数组存 | 全部 5 个 | **1 个(Line Storage)** |
| 不一次性 rotate 全部,按需产生 | 多个 | **1 个(Circular Shifter)** |
| 排序算法改 | 1-2 个 | **1 个(Alphabetizer)** |
| 支持 Unicode | 全部 | **1 个(Line Storage)** |
| 不整体排序,先 partial | 多个 | **1 个(Alphabetizer)** |
| 输入加 header 信息 | 多个 | **1 个(Input)** |

**结论:信息隐藏分解的"变更局部性"比流程分解高一个数量级**。

---

## 3. 工程师视角的关键启示 / Key Takeaways

### 3.1 每次写新模块前,问"我在隐藏什么决策?"

这是 Parnas 流程最重要的一条应用:

**坏例子:** 写一个 `DataLoader` 模块 — 因为"数据加载是一个步骤"
**好例子:** 写一个 `DataLoader` 模块 — 因为它**隐藏"数据从哪里来、什么格式、缓存多少"的决策**。未来换数据源(本地 → S3 → Kafka)只改这里。

**如果你写完一个模块说不出"我在隐藏什么决策",它可能不是一个好模块。**

### 3.2 接口的稳定性 > 内部的清晰

Parnas 强调:**模块的接口是一个 promise**。改接口的成本是**全部调用方**;改内部的成本是**自己**。

这解释了为什么:
- 公共 API 应该**尽量小**(暴露得越多、未来改动成本越大)
- `private` / `internal` 比 `public` 更自由
- 版本控制语义(semver)里**major version** 对应接口破坏

### 3.3 不要暴露"实现的痕迹"

Parnas 警告:**模块接口不应该泄漏内部数据结构**。

- ❌ `getUserList()` 返回一个 `ArrayList<User>` — 泄漏了"内部用 ArrayList"
- ✅ `iterateUsers()` 返回 `Iterator<User>` — 调用方不知道底层是 Array / List / DB cursor

**2026 实例:** 这直接决定了 "REST vs GraphQL vs gRPC" 的选择—— GraphQL 的 schema 暴露了太多内部字段,切换存储会破坏客户端;REST 资源抽象得好,内部实现更可替换。

### 3.4 "变化"是核心启发式,不是技术细节

Parnas 的核心操作:**先预测哪些决策会变化,再按变化点画模块边界**。

**对于任何新项目:** 一开始花 30 分钟列出"未来 1 年最可能变化的 10 件事"——**这 10 件事每一件都值得一个独立模块**。

**AI 工程中的应用(2026 年):**

- 模型 provider(OpenAI → Anthropic → 自建)—— 应该是一个模块
- Prompt template —— 应该被一个 Prompt Manager 模块隐藏
- Retrieval backend (向量 DB → BM25 → hybrid)—— 一个 Retriever 模块
- Safety filter (规则 → LLM-as-judge)—— 一个独立 layer
- Logging / tracing sink(stdout → OpenTelemetry → CloudWatch)—— 一个模块

每一项都在现实中被替换过。如果你没有信息隐藏,**每次替换都是全局改动**。

### 3.5 Parnas 的批评依然在被忽视

50 年后,2026 年仍有大量代码库是**按流程分解的**:

- "我们的架构是 input → processing → output,每层一个目录" ← 这是 Parnas 批评的 Method 1
- "这个服务按步骤 1/2/3 分 package" ← 同上

**Parnas 正确的。** 这些分解在变更到来时会痛。

### 3.6 信息隐藏 ≠ 访问控制关键字

**最后的关键区分:** 把所有字段设成 `private`,不代表你做了信息隐藏。

信息隐藏是**语义**的——**调用方通过你的接口能推断出多少内部信息?**

`getArrayOfUsers()` 是 public 的(access control 到位),但它**还是泄漏了内部**——"数组"这个决策被暴露了。

**Parnas 问的是:调用方通过接口,能做哪些关于内部的推断?**

---

## 4. 和本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| [AgentFactory](../self-improving-agents/agent-factory.md) | 每个子 agent 都是 Parnas 意义上的"信息隐藏模块"——接口是 docstring,内部是 Python 实现,可独立重写 |
| [Anthropic Building Effective Agents](../agent-patterns/anthropic-building-effective-agents.md) | 5 个 pattern 本质是"哪些决策该被模块隐藏"的答案(routing 模块隐藏路由决策、evaluator 模块隐藏打分决策...) |
| [Hickey — Simple Made Easy](simple-made-easy.md) | Hickey 的 "complect vs compose" 是 Parnas 思想的现代续写——"简单 = 每个组件只关心一件事" |
| [Brooks — No Silver Bullet](no-silver-bullet.md) | Brooks 说软件有不可消除的本质复杂性,Parnas 说**复杂性可以被模块边界隔离**——两者互补 |
| [Hoare — Emperor's Old Clothes](hoare-emperors-old-clothes.md) | Hoare 设计 ALGOL 时就用 Parnas 思想分离 value 和 reference,后来 null 的发明违反了信息隐藏,成了亿万美元错误 |
| [Software 2.0](software-2-0.md) | Karpathy 的 1.0/2.0 分层 = Parnas 级的模块分解——传统代码 vs 神经网络权重各隐藏不同的决策 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **1972 年写,2026 年仍是每天在用的思维工具** — 比 React 老 41 年,依然管用
- **不是抽象理论,是可操作方法论** — KWIC 对比实验让论点可验证
- **影响了所有现代编程语言的模块系统** — OOP、Rust trait、Haskell typeclass、Go interface 都是 Parnas 思想的衍生
- **在 AI 工程里**越来越**重要** — 2026 年 agent 系统比传统软件**更需要**信息隐藏(模型 provider 每月换、retrieval backend 每周迭代、prompt 每天改)
- **作者持续输出** — Parnas 后续还写了《Software Aging》等经典,是软件工程的持续贡献者

---

## References / 参考

- **论文:**
  - [On the Criteria to Be Used in Decomposing Systems into Modules (ACM CACM, 1972)](https://dl.acm.org/doi/10.1145/361598.361623)
  - [PDF 开放版(UMD 托管)](https://www.cs.umd.edu/class/spring2003/cmsc838p/Design/criteria.pdf)
- **作者:** David L. Parnas
  - [Parnas 个人档案(McMaster University)](https://www.mcmaster.ca/)
  - 他 1985 年的《Why software is unreliable》也值得读
- **后续相关论文:**
  - Parnas, "A Technique for Software Module Specification with Examples" (1972)
  - Parnas, "Designing Software for Ease of Extension and Contraction" (1979)
  - [Liskov, "Programming with Abstract Data Types" (1974)](https://dl.acm.org/doi/10.1145/942572.807045) — 继承 Parnas 思想,推出抽象数据类型概念(后来的 LSP)
- **本仓库相关:**
  - [Brooks — No Silver Bullet](no-silver-bullet.md)
  - [Hoare — Emperor's Old Clothes](hoare-emperors-old-clothes.md)
  - [Hickey — Simple Made Easy](simple-made-easy.md)
  - [Software 2.0](software-2-0.md)
  - [AgentFactory](../self-improving-agents/agent-factory.md) · [Anthropic Building Effective Agents](../agent-patterns/anthropic-building-effective-agents.md)
