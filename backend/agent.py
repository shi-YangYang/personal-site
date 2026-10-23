from __future__ import annotations

import json
import logging
import re
import urllib.error
import urllib.request
from dataclasses import dataclass

from .config import AGENT_LLM_API_KEY, AGENT_LLM_BASE_URL, AGENT_MODEL
from .content import list_posts, read_personal

log = logging.getLogger("personal-site.agent")

ASCII_WORD = re.compile(r"[a-z0-9][a-z0-9+#.\-]*", re.IGNORECASE)
CJK_CHAR = re.compile(r"[\u4e00-\u9fff]")


@dataclass
class Document:
    title: str
    href: str
    kind: str
    text: str


def _tokens(text: str) -> set[str]:
    lowered = text.lower()
    words = set(ASCII_WORD.findall(lowered))
    chars = CJK_CHAR.findall(lowered)
    bigrams = {chars[i] + chars[i + 1] for i in range(len(chars) - 1)}
    return words | set(chars) | bigrams


def _documents(locale: str) -> list[Document]:
    data = read_personal(locale)
    docs: list[Document] = []

    zh = locale != "en"
    about_text = " ".join(
        str(data.get(key, ""))
        for key in ("name", "role", "tagline", "bio", "location")
    ).strip()
    if about_text:
        docs.append(Document("关于" if zh else "About", "#about", "about", about_text))

    for project in data.get("projects") or []:
        if not isinstance(project, dict):
            continue
        text = " ".join(
            [
                str(project.get("title", "")),
                str(project.get("description", "")),
                str(project.get("longDescription", "")),
                " ".join(str(tag) for tag in project.get("tags") or []),
                " ".join(str(item) for item in project.get("highlights") or []),
            ]
        ).strip()
        if text:
            docs.append(
                Document(
                    str(project.get("title") or "项目"),
                    f"/{locale}/projects/{project.get('slug', '')}",
                    "project",
                    text,
                )
            )

    for item in data.get("experience") or []:
        if not isinstance(item, dict):
            continue
        text = " ".join(
            [
                str(item.get("company", "")),
                str(item.get("role", "")),
                str(item.get("period", "")),
                str(item.get("description", "")),
                " ".join(str(tag) for tag in item.get("tags") or []),
            ]
        ).strip()
        if text:
            docs.append(
                Document(
                    f"{item.get('company', '')} · {item.get('role', '')}".strip(" ·"),
                    "#experience",
                    "experience",
                    text,
                )
            )

    skill_text = " ".join(
        f"{group.get('label', '')} " + " ".join(str(i.get("name", "")) for i in group.get("items") or [])
        for group in data.get("skills") or []
        if isinstance(group, dict)
    ).strip()
    if skill_text:
        docs.append(Document("技术栈" if zh else "Skills", "#skills", "skills", skill_text))

    for post in list_posts(locale):
        text = " ".join(
            [
                str(post.get("title", "")),
                str(post.get("description", "")),
                str(post.get("body", "")),
                " ".join(str(tag) for tag in post.get("tags") or []),
            ]
        ).strip()
        if text:
            docs.append(Document(str(post["title"]), str(post["href"]), "post", text))

    email = str(data.get("email", "")).strip()
    if email:
        docs.append(Document("联系" if zh else "Contact", "#contact", "contact", f"邮箱 email {email}"))
    return docs


def _rank(question: str, docs: list[Document]) -> list[Document]:
    query_tokens = _tokens(question)
    if not query_tokens:
        return []
    scored: list[tuple[float, Document]] = []
    for doc in docs:
        doc_tokens = _tokens(f"{doc.title} {doc.text}")
        if not doc_tokens:
            continue
        overlap = len(query_tokens & doc_tokens)
        if overlap == 0:
            continue
        title_overlap = len(query_tokens & _tokens(doc.title))
        score = overlap / (len(query_tokens) ** 0.5) + title_overlap * 1.5
        scored.append((score, doc))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [doc for _, doc in scored[:4]]


def _snippet(text: str, limit: int = 220) -> str:
    clean = re.sub(r"\s+", " ", text).strip()
    return clean if len(clean) <= limit else clean[: limit - 1].rstrip() + "…"


def _intent(question: str) -> str:
    q = question.lower()
    if re.search(r"联系|邮箱|邮件|contact|email|reach", q):
        return "contact"
    if re.search(r"经历|工作|经验|experience|career|role", q):
        return "experience"
    if re.search(r"技能|技术|栈|能力|stack|skill", q):
        return "skills"
    if re.search(r"项目|作品|做过什么|project|work|built", q):
        return "project"
    if re.search(r"关于|你是谁|about|who are you", q):
        return "about"
    if re.search(r"笔记|文章|博客|写作|note|blog|writing", q):
        return "post"
    return "general"


def _local_answer(question: str, docs: list[Document], locale: str) -> str:
    zh = locale != "en"
    if not docs:
        return (
            "我在站内没有找到足够相关的内容。可以换个问法，或者直接问项目、经历、技术栈或联系方式。"
            if zh
            else "I couldn't find enough relevant material on the site. Try asking about projects, experience, skills, or contact details."
        )

    if len(docs) == 1 and docs[0].kind == "contact":
        email = re.search(r"[\w.+-]+@[\w.-]+", docs[0].text)
        if email:
            return (
                f"可以直接发邮件到 {email.group(0)}。"
                if zh
                else f"Email me at {email.group(0)}."
            )

    if all(doc.kind == "project" for doc in docs):
        lines = [f"「{doc.title}」：{_snippet(doc.text, 180)}" for doc in docs[:3]]
        return ("我做过的系统：\n\n" if zh else "Systems I've built:\n\n") + "\n\n".join(lines)

    if all(doc.kind == "experience" for doc in docs):
        lines = [f"{doc.title}：{_snippet(doc.text, 180)}" for doc in docs[:3]]
        return ("我的经历：\n\n" if zh else "My experience:\n\n") + "\n\n".join(lines)

    if all(doc.kind == "post" for doc in docs):
        lines = [f"「{doc.title}」：{_snippet(doc.text, 180)}" for doc in docs[:3]]
        return ("最近写的：\n\n" if zh else "Recent writing:\n\n") + "\n\n".join(lines)

    parts = [f"{doc.title}：{_snippet(doc.text)}" for doc in docs[:2]]
    if zh:
        return "我在站内找到了这些相关内容：\n\n" + "\n\n".join(parts)
    return "Here is what I found on the site:\n\n" + "\n\n".join(parts)


def _llm_answer(question: str, docs: list[Document], locale: str) -> str | None:
    if not (AGENT_LLM_BASE_URL and AGENT_LLM_API_KEY):
        return None

    context = "\n\n".join(
        f"[{index + 1}] {doc.title} ({doc.href})\n{doc.text}"
        for index, doc in enumerate(docs)
    )
    language = "简体中文" if locale != "en" else "English"
    system = (
        "You are the assistant embedded in a personal website. "
        "Answer in " + language + ". Use only the provided site context. "
        "If the context is insufficient, say so plainly. "
        "Cite sources as [1], [2] matching the context numbering. "
        "Be concise and specific; never invent metrics, employers, or projects."
    )
    payload = {
        "model": AGENT_MODEL,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": f"Question: {question}\n\nSite context:\n{context or '(empty)'}",
            },
        ],
    }
    request = urllib.request.Request(
        f"{AGENT_LLM_BASE_URL}/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {AGENT_LLM_API_KEY}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = json.loads(response.read().decode("utf-8"))
        content = data["choices"][0]["message"]["content"]
        return content.strip() if isinstance(content, str) and content.strip() else None
    except (urllib.error.URLError, KeyError, IndexError, ValueError, TimeoutError) as error:
        log.warning("LLM request failed, falling back to local retrieval: %s", error)
        return None


def ask(question: str, locale: str) -> dict:
    docs = _documents(locale)
    intent = _intent(question)
    if intent != "general":
        filtered = [doc for doc in docs if doc.kind == intent]
        if filtered:
            docs = filtered
        else:
            docs = _rank(question, docs)
    else:
        docs = _rank(question, docs)
    answer = _llm_answer(question, docs, locale)
    mode = "llm" if answer else "local"
    if not answer:
        answer = _local_answer(question, docs, locale)
    citations = [
        {"label": doc.title, "href": doc.href, "kind": doc.kind}
        for doc in docs[:3]
    ]
    suggestions = (
        ["你做过什么项目？", "你的技术栈是什么？", "怎么联系你？"]
        if locale != "en"
        else ["What have you built?", "What is your stack?", "How do I reach you?"]
    )
    return {
        "answer": answer,
        "citations": citations,
        "suggestions": suggestions,
        "mode": mode,
    }
