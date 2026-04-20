# The Emperor's Old Clothes

> **原文链接:** [ACM CACM 1981 PDF](https://dl.acm.org/doi/10.1145/358549.358561) · [Full text mirror](https://www.cs.fsu.edu/~engelen/courses/COP4610/hoare.pdf)
>
> **作者:** C.A.R. (Tony) Hoare
>
> **发表:** 1980 ACM Turing Award Lecture(1981 年在 CACM 发表书面版)
>
> **主题:** 历史上最坦诚、最具教育意义的 Turing 奖获奖讲座之一。Hoare 回顾他设计 ALGOL 60、Quicksort、CSP 的经历——包括他**发明 null reference 这件"亿万美元错误"**,并提出了影响后世几代语言设计的品质标准:**"任何新设计必须证明它的简洁性,否则就是借口。"**

---

## 为什么这篇重要 / Why This Matters

一般 Turing 奖讲座是"讲讲我做过哪些伟大的事"。Hoare 1980 年的获奖讲座**反其道而行**——**用一整篇讲自己的失败和教训**。

他自嘲式地承认:

1. **他"发明" null reference(1965 年 ALGOL W)** —— "我把它称为我的亿万美元错误(billion-dollar mistake)"
2. **他参与的 ALGOL 68 变得过于复杂** —— "这个语言被它自己的复杂性压垮了"
3. **他开发的大型操作系统项目失败** —— "皇帝的新衣" 隐喻就来自于此

然后他提出后世语言设计的核心品质标准。这些标准后来被 **Rust、Swift、Kotlin、TypeScript、Go** 等现代语言奉为设计的北极星:**每一个这些语言引入 `Option<T>` / `Maybe` / `?` 语法,都是对 Hoare 1980 演讲的回应**。

---

## 1. 核心主题:设计的"皇帝新衣"现象 / The Emperor's New Clothes

Hoare 借用安徒生童话:"皇帝穿着'只有聪明人能看到'的新衣,其实是裸体,但所有人都不敢说"——隐喻**软件行业中**:

> *"Many of us have experienced the following. A project goes forward, and everyone praises its progress. The manager says it's on schedule. The tech leads say the design is elegant. The engineers say the code is clean. Nobody says 'the emperor is naked'. Only much later, when the project collapses, everyone admits the problems were visible all along."*

> *我们很多人都经历过这种情况。一个项目推进,所有人都在赞美进度。经理说按计划,技术负责人说设计优雅,工程师说代码干净。没有人说"皇帝是裸着的"。直到项目崩塌,大家才承认问题一直都在,只是没人说。*

他指出自己参与的一个 1960 年代的**大型操作系统项目**完全就是这个故事:

- 项目被承诺是"革命性的"
- 几百个工程师投入
- 没人敢说核心架构有问题
- 项目最终被取消,几百万美元损失

**Hoare 的教训:** 这不是因为参与者愚蠢——**所有人都能看到问题**。问题是文化:**说真话被视为不合群,沉默被视为专业**。

---

## 2. 亿万美元错误:Null Reference / The Billion-Dollar Mistake

这是演讲里最被引用、最广为人知的一段:

### 2.1 原文

> *"I call it my billion-dollar mistake. It was the invention of the null reference in 1965. At that time, I was designing the first comprehensive type system for references in an object oriented language (ALGOL W). My goal was to ensure that all use of references should be absolutely safe, with checking performed automatically by the compiler. But I couldn't resist the temptation to put in a null reference, simply because it was so easy to implement. **This has led to innumerable errors, vulnerabilities, and system crashes, which have probably caused a billion dollars of pain and damage in the last forty years.**"*

### 2.2 翻译

> *我称它为我的"亿万美元错误"。那是 1965 年,我正在为一个面向对象语言(ALGOL W)设计第一套完整的引用类型系统。目标是让所有引用使用**绝对安全**,编译器自动检查。但我**没能抵挡把 null 加进去的诱惑**——只是因为它实现起来太简单了。**这导致了数不清的错误、漏洞、系统崩溃,过去 40 年大概造成了 10 亿美元的痛苦和损失。***

### 2.3 为什么是错误

Hoare 解释 null 的核心问题:

- 它让**每个引用类型都隐含两种状态**——"有值"和"是 null"
- 但编译器**没有强制检查**调用方处理这两种情况
- 每一次 `x.foo()` 调用都**可能**crash,而语言不告诉你

**他 1965 年做的选择非常便利**(实现简单、和汇编友好)——但**把一个复杂性永久地烙进了计算**。每个后来的语言都要面对这个问题。

### 2.4 现代语言如何回应 Hoare

2026 年的主流语言**全部在修正 Hoare 这个错误**:

| 语言 | 修正方式 |
|---|---|
| **Rust** | 没有 null。用 `Option<T>` enum,编译器强制你 `match` 或 `?` |
| **Swift** | Optional Types `T?` + `if let` + force-unwrap `!` 需显式 |
| **Kotlin** | `T?` 可空类型 vs `T` 非空,编译器分辨 |
| **TypeScript** | `strictNullChecks` 模式,`T \| null` 必须明确 |
| **Scala** | `Option[T]` 作为标准 |
| **Haskell** | `Maybe a` 从诞生就是 |
| **Go** | 接口的 nil 有部分 null 问题 —— 但 pointer 必须显式标记 |
| **C# 8+** | Nullable reference types (`T?`) 选项 |
| **Java** | `Optional<T>`(2014)—— 迟到但在修 |

**只有 C 和老 Java 仍在受伤**。每周全球所有软件里 NullPointerException / segfault 的损失,都是在还 Hoare 1965 那个"便利"的债。

---

## 3. 对设计者的训诫 / Principles for Designers

Hoare 在演讲后半部分提出一组设计标准,这些话后来被无数语言设计者当作指南:

### 3.1 简洁性是对设计者的要求,不是结果

> *"There are two ways of constructing a software design: One way is to make it so simple that there are obviously no deficiencies, and the other way is to make it so complicated that there are no obvious deficiencies. **The first method is far more difficult.**"*

> *构建软件设计有两种方式:一种是把它做得**简单到显然没有缺陷**,另一种是做得**复杂到没有显然的缺陷**。**第一种方式难得多。***

**这是 Hoare 最被引用的话之一。** 过去 40 年每一个"简单比复杂难"的声称都在引用他。

**翻译到工程实践:** 如果你的设计"复杂到别人看不出问题",那是一种**失败**,不是深度。

### 3.2 拒绝特性堆砌

Hoare 严厉批评 ALGOL 68 的失败:

- 委员会为了让所有成员都满意,**每个人想加的特性都加了**
- 结果语言变成一个**没有审美一致性**的怪物
- 最终被 ALGOL 60 / Pascal / C 打败——它们都**做了取舍**

**教训:** **伟大的语言是减法的结果,不是加法**。Pascal、C、Go、Lua 这些成功的语言都极度克制。

### 3.3 标准应该基于经验,不是委员会投票

Hoare 质疑"委员会设计"——每一次有争议,多数投票通过。结果是**一个没有内在一致性**的系统。

**他主张:** 先做**实现+实测**,再写标准。

**这影响了后续:**
- Unix 文化(先做工具、再讨论)
- Rust 的 RFC 过程(每一条都有 working implementation)
- WebAssembly 的渐进规范

---

## 4. Hoare 的其他贡献(被这篇提及) / Other Contributions

这篇讲座**顺带**回顾了 Hoare 的其他几项工作——每一项都足够拿 Turing 奖:

### 4.1 Quicksort(1959)

当时 20 多岁的 Hoare 发明的排序算法——至今**几乎每个标准库的默认排序**(或其变种 Timsort / Introsort)都基于它。

Hoare 自嘲:**"这是我唯一真正原创且持续使用的贡献"**。

### 4.2 Hoare Logic(1969)

为程序正确性提供**形式化证明体系**:

$$
\{P\} \; C \; \{Q\}
$$

P 是前置条件、C 是代码、Q 是后置条件。这是**程序验证(program verification)**的数学基础——今天 Rust borrow checker、TLA+、F\*、Coq 等工具都是 Hoare Logic 的后代。

### 4.3 CSP — Communicating Sequential Processes(1978)

一种并发编程理论,直接影响了:
- **Go 的 channels 和 goroutines**
- Erlang 的 actor model 的部分思想
- Rust 的 sync primitives

**"Don't communicate by sharing memory; share memory by communicating"** 这句 Go 语言著名格言直接来自 CSP。

---

## 5. 工程师视角的关键启示 / Key Takeaways

### 5.1 "简单到没有缺陷" > "复杂到没有明显缺陷"

每次你做设计 review 时,问自己:**我的方案是哪一种?**

**信号:** 如果你无法用一张纸把整个架构讲给新同事听清楚,那是"复杂到没有明显缺陷"。

**实操:** 设计完写**一段 summary**(不超过 5 句话)。如果写不出来,设计本身就有问题。

### 5.2 Null / 隐式状态 / 魔法值 是同类毒

Hoare 的 null 教训**推广到**所有"隐式状态":

- **空字符串 vs null vs undefined** —— JavaScript 的三态地狱
- **magic numbers** —— `-1` 表示"没找到"、`0` 表示"默认"
- **exception as control flow** —— 把错误处理藏进 exception stack

**2026 年的工程原则:** **一切"可能缺失"的值都应该用明确的类型标记**。用 `Result<T, E>`、`Option<T>`、`Either<L, R>`,不要用 null / exception / sentinel。

### 5.3 在 review 中敢说"皇帝裸着"

Hoare 的"皇帝新衣"比喻在 2026 年仍然精确:

- "这个 agent 架构其实有 bug,只是演示的时候绕过了" → 敢说
- "这段代码我不理解为什么需要 3 层间接" → 敢问
- "这个 benchmark 数字看起来可疑" → 敢质疑

**这不是消极或不合作——是专业**。Hoare 说的是:**项目崩塌的原因从来不是"没人发现问题",是"没人敢说"**。

### 5.4 便利性的诱惑要抵抗

Hoare 说:**"因为实现简单"从来不是决策的理由**。Null 的实现简单,但代价是 40 年。

**每次面对"这个能简化我一天工作但给未来埋坑"的选择,记住 null**。

**AI 工程中的对应物:**
- "先不做 eval,直接上线" → 坑
- "先不版本化 prompt,快"→ 坑
- "agent 直接访问生产数据库,不走 API"→ 坑

**表面便利的决策,往往最贵**。

### 5.5 减法比加法难,也比加法重要

Hickey、Sutton、Parnas、Hoare 的共同观点:**伟大的设计是减法**。

**每次 review 设计时问:什么可以删?** 不是"还能加什么",而是"还能删什么"。

---

## 6. 和本仓库其他文章的关联 / Relation to Other Papers

| 文章 | 关系 |
|---|---|
| [Parnas — Decomposing Modules](parnas-modules.md) | Parnas 的信息隐藏 + Hoare 的类型安全 = 模块化的两条腿。Null 违反了"模块该返回什么"的 contract |
| [Hickey — Simple Made Easy](simple-made-easy.md) | Hickey "simple" 的完整论证,精确延续 Hoare "make it so simple"  |
| [Brooks — No Silver Bullet](no-silver-bullet.md) | Brooks 的 "essential complexity" 的源头之一就是 Hoare 这里讲的"真实的复杂性是不可消除的,但 accidental 的可以消除" |
| [First Principles in Engineering](first-principles-engineering.md) | Hoare 拒绝 null 时的推理本应是"从引用类型的 safety 第一性原则出发"—— 他没有,酿成错误 |
| [Bitter Lesson](bitter-lesson.md) | Hoare 对 ALGOL 68 的批评 = Sutton 对"内建人类知识"的批评的语言层翻版 |

---

## 为什么是 Tier-S / Why This Is Tier-S

- **历史上最坦诚的 Turing 奖讲座**——完整提供教训,不只是胜利
- **Null 教训影响了后 40 年所有主要语言的设计**
- **"Simple obviously vs no obvious defects" 这句话本身**是一个工程文化的基准
- **Hoare 本人是多领域奠基人**——Quicksort / Hoare Logic / CSP / ALGOL 60 贡献者
- **2026 年仍然精确**——AI 工程里每次选 `null` 返回值、每次沉默的架构决策,都是这个 1980 年讲座的再演绎

---

## References / 参考

- **原讲座书面版:**
  - [The Emperor's Old Clothes (ACM CACM, Feb 1981)](https://dl.acm.org/doi/10.1145/358549.358561)
  - [PDF 全文(FSU mirror)](https://www.cs.fsu.edu/~engelen/courses/COP4610/hoare.pdf)
- **Hoare 其他关键工作:**
  - [Communicating Sequential Processes (1978)](https://dl.acm.org/doi/10.1145/359576.359585)
  - [An Axiomatic Basis for Computer Programming (1969, Hoare Logic)](https://dl.acm.org/doi/10.1145/363235.363259)
  - Quicksort (1961, "Algorithm 64: Quicksort")
- **Null 错误后续分析:**
  - [Hoare 2009 年的公开讲话 "Null References: The Billion Dollar Mistake"](https://www.infoq.com/presentations/Null-References-The-Billion-Dollar-Mistake-Tony-Hoare/)
- **被本论文影响的现代语言:**
  - [Rust — Option<T>](https://doc.rust-lang.org/std/option/) · [Swift — Optionals](https://developer.apple.com/swift/) · [Kotlin — Null Safety](https://kotlinlang.org/docs/null-safety.html)
- **本仓库相关:**
  - [Parnas — Decomposing Modules](parnas-modules.md)
  - [Brooks — No Silver Bullet](no-silver-bullet.md)
  - [Hickey — Simple Made Easy](simple-made-easy.md)
  - [First Principles in Engineering](first-principles-engineering.md) · [Bitter Lesson](bitter-lesson.md)
