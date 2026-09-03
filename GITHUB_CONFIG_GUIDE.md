# GitHub 配置目录说明

`.github/` 本质上只是 Git 仓库里的一个普通目录。

它的特殊之处在于：GitHub 平台会识别 `.github/` 下面一些约定好的文件和目录，并根据这些配置启用对应功能，例如 GitHub Actions、Issue 模板、Pull Request 模板、CODEOWNERS、Dependabot 和安全策略页面。

也就是说：

```text
.git/     是 Git 自己使用的内部目录
.github/ 是仓库提供给 GitHub 平台读取的配置目录
```

两者完全不是一回事。

| 目录 | 使用者 | 作用 |
| --- | --- | --- |
| `.git/` | Git | 保存提交、分支、对象、索引、仓库元数据 |
| `.github/` | GitHub | 保存 GitHub 平台功能的约定配置 |

可以这样理解：

```text
.git     = Git 仓库自己的数据区
.github  = 这个仓库给 GitHub 平台看的配置区
```

## 什么时候生效

只是在本地创建 `.github/` 目录时，GitHub 不会知道，也不会发生任何事情。

完整流程是：

```text
本地仓库
  ↓
创建 .github/
  ↓
添加 GitHub 配置文件
  ↓
git add
git commit
git push
  ↓
配置被推送到 GitHub 远程仓库
  ↓
GitHub 平台读取这些约定路径
  ↓
启用 Actions、Issue 模板、PR 模板等功能
```

关键点：

```text
创建 .github/ 本身不会触发 GitHub 功能
提交到本地 Git 历史也不会触发 GitHub 功能
推送到 GitHub 远程仓库后，GitHub 才能读取这些配置
```

## 目录规范

当前项目使用的 `.github/` 目录结构如下：

```text
.github/
├── workflows/
│   ├── ci.yml
│   └── pages.yml
│
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   └── feature_request.md
│
├── PULL_REQUEST_TEMPLATE.md
│
├── CODEOWNERS
│
├── dependabot.yml
│
└── SECURITY.md
```

GitHub 不是扫描 `.github/` 下所有文件，然后随便识别。

它识别的是固定路径和固定文件名。路径写错了，文件可能仍然存在于仓库里，但 GitHub 不会把它当成功能配置。

常见约定如下：

| 路径 | 功能 |
| --- | --- |
| `.github/workflows/*.yml` | GitHub Actions 工作流 |
| `.github/workflows/*.yaml` | GitHub Actions 工作流 |
| `.github/ISSUE_TEMPLATE/*.md` | Issue 模板 |
| `.github/PULL_REQUEST_TEMPLATE.md` | Pull Request 默认模板 |
| `.github/CODEOWNERS` | 代码负责人和自动 Review 请求 |
| `.github/dependabot.yml` | Dependabot 自动依赖更新 |
| `.github/SECURITY.md` | 安全策略和漏洞报告说明 |

例如，下面这些会被 GitHub Actions 识别：

```text
.github/workflows/ci.yml
.github/workflows/test.yaml
.github/workflows/deploy.yml
```

但下面这些不会被当作 Actions workflow：

```text
.github/ci.yml
.github/actions/ci.yml
.github/workflow/ci.yml
```

核心结论：

```text
.github/ 里的功能依赖 GitHub 约定
文件名和目录路径都很重要
不是把 YAML 文件随便放进去就会生效
```

## `.github/workflows/ci.yml`

这个文件定义 GitHub Actions 工作流。

当前配置：

```yaml
name: CI

on:
  push:
    branches:
      - main
      - master
  pull_request:
  workflow_dispatch:

jobs:
  repository-check:
    name: Repository check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Show repository files
        run: find . -maxdepth 2 -type f | sort

      - name: Check required files
        run: |
          test -f README.md
          test -f LICENSE
          test -f .github/CODEOWNERS
          test -f .github/SECURITY.md
```

解释：

| 配置 | 作用 |
| --- | --- |
| `name: CI` | 工作流显示名称，在 GitHub Actions 页面看到 |
| `on:` | 定义什么时候触发 |
| `push` | push 到指定分支时触发 |
| `branches` | 限制 push 触发的分支 |
| `pull_request` | 创建或更新 PR 时触发 |
| `workflow_dispatch` | 允许在 GitHub 网页上手动运行 |
| `jobs` | 定义一组要执行的任务 |
| `repository-check` | job 的内部 ID |
| `runs-on: ubuntu-latest` | 使用 GitHub 提供的 Ubuntu 虚拟机运行 |
| `steps` | job 里的具体执行步骤 |
| `uses: actions/checkout@v4` | 使用官方 Action 拉取仓库代码 |
| `run` | 执行 shell 命令 |
| `run: \|` | 执行多行 shell 脚本 |

这个 CI 目前做三件事：

```text
1. 拉取仓库代码
2. 打印仓库文件列表
3. 检查 README.md、LICENSE、CODEOWNERS、SECURITY.md 是否存在
```

如果这些文件不存在，`test -f` 会失败，整个 CI 也会失败。

这不是复杂项目的最终 CI，而是一个适合学习和体验 GitHub Actions 的入门版本。

## `.github/workflows/pages.yml`

这个文件定义 GitHub Pages 自动部署流程。

当前项目是纯静态网站，入口文件是：

```text
index.html
```

样式文件是：

```text
styles.css
```

因此不需要 npm、Vite、Next.js 或其他构建工具，GitHub Pages 可以直接部署仓库里的静态文件。

示例配置：

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    name: Deploy static site
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "."

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

解释：

| 配置 | 作用 |
| --- | --- |
| `permissions.contents: read` | 允许 workflow 读取仓库内容 |
| `permissions.pages: write` | 允许 workflow 发布 GitHub Pages |
| `permissions.id-token: write` | 允许 GitHub Pages 部署使用 OIDC 身份令牌 |
| `concurrency` | 避免多个 Pages 部署互相覆盖 |
| `actions/configure-pages@v5` | 初始化 Pages 部署环境 |
| `actions/upload-pages-artifact@v3` | 把静态网站文件打包成 Pages artifact |
| `actions/deploy-pages@v4` | 把 artifact 发布到 GitHub Pages |

使用这个 workflow 前，需要在 GitHub 仓库设置中选择：

```text
Settings
  ↓
Pages
  ↓
Build and deployment
  ↓
Source: GitHub Actions
```

之后 push 到 `main` 或 `master` 时，就会自动部署。

## `.github/ISSUE_TEMPLATE/bug_report.md`

这个文件是 Bug 报告模板。

当前配置：

```markdown
---
name: Bug report
about: Report something that is not working as expected
title: "[Bug]: "
labels: bug
assignees: ""
---

## What happened?


## Steps to reproduce

1.
2.
3.

## Expected behavior


## Screenshots or logs


## Environment

- Browser:
- Device:
- OS:
```

作用：

当用户在 GitHub 上新建 Issue 时，可以选择这个 Bug report 模板。

顶部的 `---` 区域叫 front matter，用来告诉 GitHub 这个模板的元信息：

| 字段 | 作用 |
| --- | --- |
| `name` | 模板名称 |
| `about` | 模板说明 |
| `title` | 自动填充的 Issue 标题前缀 |
| `labels` | 自动添加的标签 |
| `assignees` | 自动分配负责人 |

下面的 Markdown 内容会自动填入 Issue 输入框，引导用户提供复现步骤、预期行为、截图、环境信息等。

## `.github/ISSUE_TEMPLATE/feature_request.md`

这个文件是功能建议模板。

当前配置：

```markdown
---
name: Feature request
about: Suggest an idea or improvement
title: "[Feature]: "
labels: enhancement
assignees: ""
---

## What would you like to add or improve?


## Why is this useful?


## Possible solution


## Additional context
```

作用：

当用户想提新功能或改进建议时，可以选择这个模板。

它会引导用户说明：

```text
想加什么
为什么有用
有没有可能的解决方案
还有没有补充背景
```

Issue 模板的价值不是让内容变复杂，而是让反馈更容易被理解和处理。

## `.github/PULL_REQUEST_TEMPLATE.md`

这个文件是 Pull Request 默认模板。

当前配置：

```markdown
## Summary


## Changes

- 

## Checklist

- [ ] I have tested the change locally, if applicable.
- [ ] I have updated documentation, if applicable.
- [ ] This pull request is ready for review.
```

作用：

当有人创建 Pull Request 时，GitHub 会自动把这段内容填入 PR 描述框。

它可以提醒提交者说明：

```text
这次 PR 做了什么
具体改了哪些内容
是否测试过
是否更新了文档
是否已经准备好 review
```

对于个人项目，它可以帮助自己保持提交说明清晰。

对于多人项目，它可以减少 reviewer 猜测上下文的成本。

## `.github/CODEOWNERS`

这个文件定义“谁负责哪些文件”。

当前配置：

```text
# Default code owner for the whole repository.
# Replace @your-github-username with your real GitHub username.
* @your-github-username
```

作用：

当有人修改某些文件并创建 PR 时，GitHub 可以根据 `CODEOWNERS` 自动请求对应负责人 Review。

示例：

```text
* @alice
.github/ @bob
README.md @carol
```

解释：

| 规则 | 含义 |
| --- | --- |
| `* @alice` | 默认所有文件由 `@alice` 负责 |
| `.github/ @bob` | `.github/` 目录由 `@bob` 负责 |
| `README.md @carol` | `README.md` 由 `@carol` 负责 |

当前仓库是个人项目时，可以把占位符替换成自己的 GitHub 用户名：

```text
* @your-real-github-username
```

注意：

`CODEOWNERS` 要真正自动请求 Review，通常还需要仓库在 GitHub 上启用对应的分支保护规则。

## `.github/dependabot.yml`

这个文件配置 Dependabot。

Dependabot 是 GitHub 的依赖更新机器人。它会定期检查项目里的依赖是否有新版本，必要时自动创建 Pull Request。

当前配置：

```yaml
version: 2

updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

解释：

| 配置 | 作用 |
| --- | --- |
| `version: 2` | 使用 Dependabot 配置文件版本 2 |
| `updates` | 配置要检查哪些依赖 |
| `package-ecosystem: "github-actions"` | 检查 GitHub Actions 里使用的 Action 版本 |
| `directory: "/"` | 从仓库根目录开始查找 |
| `schedule.interval: "weekly"` | 每周检查一次 |

在当前项目里，Dependabot 会检查这类内容：

```yaml
uses: actions/checkout@v4
```

如果以后 `actions/checkout` 有新版本，Dependabot 可能会自动开一个 PR，建议升级。

如果项目以后加入 Node.js，可以增加 npm 检查：

```yaml
version: 2

updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

## `.github/SECURITY.md`

这个文件定义项目的安全策略。

当前配置：

```markdown
# Security Policy

## Supported Versions

This is a personal project. The latest version on the default branch is supported.

## Reporting a Vulnerability

If you discover a security issue, please do not open a public issue.

Instead, contact the repository owner privately and include:

- A short description of the issue
- Steps to reproduce it
- Any relevant screenshots, logs, or links

Thank you for helping keep this project safe.
```

作用：

GitHub 会在仓库的 Security 相关页面展示这个文件。

它主要说明：

```text
哪些版本还被支持
发现安全漏洞时应该如何报告
不要把敏感漏洞直接发到公开 Issue
```

对于个人项目，这个文件可以很简单。

对于正式项目，通常会写得更具体，例如安全邮箱、响应时间、支持版本表格等。

## 常用提交命令

配置完成后，可以这样提交：

```bash
git add .github GITHUB_CONFIG_GUIDE.md
git commit -m "add github configuration guide"
git push
```

推送后可以在 GitHub 上体验这些功能：

| 功能 | 在 GitHub 哪里看 |
| --- | --- |
| GitHub Actions | 仓库顶部的 Actions 标签 |
| Issue 模板 | New issue 页面 |
| PR 模板 | New pull request 页面 |
| CODEOWNERS | PR review request 或仓库文件中查看 |
| Dependabot | Insights、Security、Pull requests |
| SECURITY.md | Security 标签或仓库安全策略页面 |

## 最重要的记忆点

```text
.github/ 是 GitHub 平台配置目录，不是 Git 内部目录
GitHub 只识别约定好的路径和文件名
.github/workflows/*.yml 才是 GitHub Actions workflow
每个 workflow 文件都是一套独立的自动化流程
配置必须 push 到 GitHub 后才会被平台读取
```
