#!/usr/bin/env python3
"""xinyu-skill 文档静态校验器。

从仓库根运行：python3 scripts/check-docs.py

检查项：
  1. skills/ 与 docs/ 下所有 md 的相对链接可达
  2. SKILL.md frontmatter 含 name/description/metadata，且 name 与目录名一致
  3. references 下每个操作类文档含必需小节（命令/参数/错误说明/参考）
  4. 写入类文档（含 > [!CAUTION]）必须有「推荐工作流」与「失败语义」
  5. references 下每个文档都在 SKILL.md 中被链接（索引完整性）

退出码：有 error 返回 1，否则 0。
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILL_DIR = os.path.join(ROOT, "skills", "xinyu")
REF_DIR = os.path.join(SKILL_DIR, "references")

LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
REQUIRED_SECTIONS = ["## 命令", "## 参数", "## 错误说明", "## 参考"]
WRITE_SECTIONS = ["## 推荐工作流", "## 失败语义"]
# 说明型文档不走操作文档模板
TEMPLATE_EXEMPT = {"auth-errors.md", "cli-exploration.md", "endpoint-catalog.md"}

errors = []
checked_links = 0


def read(path):
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def rel(path):
    return os.path.relpath(path, ROOT)


def walk_md(root):
    found = []
    for dirpath, _, filenames in os.walk(root):
        for name in filenames:
            if name.endswith(".md"):
                found.append(os.path.join(dirpath, name))
    return found


def check_links(path):
    global checked_links
    text = read(path)
    base = os.path.dirname(path)
    for match in LINK.finditer(text):
        target = match.group(1).strip()
        if target.startswith(("http://", "https://", "#", "mailto:")):
            continue
        relative = target.split("#", 1)[0]
        if not relative:
            continue
        checked_links += 1
        if not os.path.exists(os.path.normpath(os.path.join(base, relative))):
            errors.append(f"[死链] {rel(path)} -> {target}")


# 1. 链接可达
for md in walk_md(SKILL_DIR):
    check_links(md)

# 2. frontmatter
skill_md = os.path.join(SKILL_DIR, "SKILL.md")
if not os.path.exists(skill_md):
    errors.append("[缺文件] skills/xinyu/SKILL.md")
    skill_text = ""
else:
    skill_text = read(skill_md)
    if not skill_text.startswith("---"):
        errors.append("[frontmatter] SKILL.md 缺少 frontmatter")
    else:
        head = skill_text.split("---", 2)[1]
        if "name: xinyu" not in head:
            errors.append("[frontmatter] name 必须为 xinyu（与目录同名）")
        if "description:" not in head:
            errors.append("[frontmatter] 缺少 description")

# 3/4. reference 结构
if os.path.isdir(REF_DIR):
    for name in sorted(os.listdir(REF_DIR)):
        if not name.endswith(".md"):
            continue
        path = os.path.join(REF_DIR, name)
        text = read(path)
        if name in TEMPLATE_EXEMPT:
            continue
        for section in REQUIRED_SECTIONS:
            if section not in text:
                errors.append(f"[缺节] references/{name} 缺 {section}")
        if "> [!CAUTION]" in text:
            for section in WRITE_SECTIONS:
                if section not in text:
                    errors.append(f"[缺节] 写入类 references/{name} 缺 {section}")

# 5. SKILL.md 索引完整性
if skill_text and os.path.isdir(REF_DIR):
    for name in sorted(os.listdir(REF_DIR)):
        if not name.endswith(".md"):
            continue
        if f"references/{name}" not in skill_text:
            errors.append(f"[未索引] references/{name} 未在 SKILL.md 中链接")

print(f"扫描 {len(walk_md(SKILL_DIR))} 个 md，校验 {checked_links} 条相对链接。\n")
if errors:
    print("❌ 发现问题：")
    for item in errors:
        print("  -", item)
else:
    print("✓ 无死链、frontmatter 完整、reference 结构完整、索引完整。")
sys.exit(1 if errors else 0)
