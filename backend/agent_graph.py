from __future__ import annotations

import json
import logging
import uuid
from typing import Annotated, Any, TypedDict

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

from .agent import _documents, _intent, _local_answer, _rank
from .agent_config import is_llm_configured, read_agent_config
from .content import list_posts, read_personal

log = logging.getLogger("personal-site.agent-graph")

MAX_TOOL_ITERATIONS = 5
MAX_ANSWER_CHARS = 5000


# ---------- read-only tools ----------

def _doc_payload(docs: list[Any], limit: int = 4) -> str:
    return json.dumps(
        [
            {
                "title": doc.title,
                "href": doc.href,
                "kind": doc.kind,
                "text": doc.text[:1200],
            }
            for doc in docs[:limit]
        ],
        ensure_ascii=False,
    )


@tool
def search_site(query: str, locale: str = "zh") -> str:
    """Search the site's profile, projects, experience, skills, and posts. Use this first for most questions."""
    docs = _rank(query, _documents(locale))
    return _doc_payload(docs)


@tool
def get_profile(locale: str = "zh") -> str:
    """Return the site owner's name, role, tagline, bio, location, and email."""
    data = read_personal(locale)
    return json.dumps(
        {
            key: data.get(key, "")
            for key in ("name", "role", "tagline", "bio", "location", "email")
        },
        ensure_ascii=False,
    )


@tool
def get_experience(locale: str = "zh") -> str:
    """Return the site owner's work experience entries."""
    return json.dumps(read_personal(locale).get("experience", []), ensure_ascii=False)


@tool
def get_skills(locale: str = "zh") -> str:
    """Return the site owner's skill groups and items."""
    return json.dumps(read_personal(locale).get("skills", []), ensure_ascii=False)


@tool
def get_project(slug: str, locale: str = "zh") -> str:
    """Return one project by its slug."""
    projects = read_personal(locale).get("projects", [])
    for project in projects:
        if isinstance(project, dict) and project.get("slug") == slug:
            return json.dumps(project, ensure_ascii=False)
    return json.dumps({"error": "project not found"}, ensure_ascii=False)


@tool
def get_post(slug: str, locale: str = "zh") -> str:
    """Return one blog post by its slug."""
    for post in list_posts(locale):
        if post.get("slug") == slug:
            return json.dumps(
                {key: post.get(key, "") for key in ("slug", "title", "description", "date", "tags", "body")},
                ensure_ascii=False,
            )
    return json.dumps({"error": "post not found"}, ensure_ascii=False)


TOOLS = [
    search_site,
    get_profile,
    get_experience,
    get_skills,
    get_project,
    get_post,
]
TOOL_MAP = {item.name: item for item in TOOLS}


# ---------- model ----------

def get_llm() -> ChatOpenAI | None:
    config = read_agent_config()
    if not (config.get("base_url") and config.get("api_key")):
        return None
    return ChatOpenAI(
        model=config.get("model") or "gpt-4o-mini",
        api_key=config["api_key"],
        base_url=config["base_url"],
        temperature=0.2,
        max_tokens=700,
        timeout=25,
        max_retries=0,
    )


# ---------- graph state ----------

class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    locale: str
    question: str
    citations: list[dict[str, str]]
    iterations: int
    answer: str
    mode: str


def _fallback(state: AgentState) -> dict[str, Any]:
    locale = state.get("locale", "zh")
    question = state.get("question", "")
    all_docs = _documents(locale)
    intent = _intent(question)
    filtered = [doc for doc in all_docs if doc.kind == intent] if intent != "general" else []
    docs = filtered or _rank(question, all_docs)
    answer = _local_answer(question, docs, locale)
    citations = [
        {"label": doc.title, "href": doc.href, "kind": doc.kind}
        for doc in docs[:3]
    ]
    return {
        "messages": [AIMessage(content=answer)],
        "answer": answer,
        "citations": citations,
        "mode": "local",
    }


def _system_prompt(locale: str) -> str:
    data = read_personal(locale)
    language = "简体中文" if locale != "en" else "English"
    return (
        f"You are the site agent for {data.get('name', 'the site owner')}'s personal website. "
        f"Answer in {language}. "
        "Use the provided read-only tools for facts about projects, experience, skills, and posts. "
        "Do not invent facts, metrics, employers, or links. "
        "When you use site content, cite the source title and path from the tool result. "
        "Never claim to perform writes, deploys, or admin actions. "
        "If the tools do not contain the answer, say so and suggest what to ask. "
        "Keep answers concise."
    )


def _agent_node(state: AgentState) -> dict[str, Any]:
    llm = get_llm()
    if llm is None:
        return {}
    try:
        model = llm.bind_tools(TOOLS)
        # Keep the prompt bounded even if a browser session is reused.
        history = state["messages"][-8:]
        response = model.invoke(
            [SystemMessage(content=_system_prompt(state["locale"])), *history]
        )
        return {
            "messages": [response],
            "iterations": state.get("iterations", 0) + 1,
            "mode": "llm",
        }
    except Exception as error:  # keep the public endpoint useful if the provider fails
        log.warning("LLM call failed, using local fallback: %s", error)
        return _fallback(state)


def _tools_node(state: AgentState) -> dict[str, Any]:
    last = state["messages"][-1]
    tool_calls = getattr(last, "tool_calls", None) or []
    messages: list[BaseMessage] = []

    for call in tool_calls:
        name = str(call.get("name", ""))
        args = dict(call.get("args") or {})
        args.setdefault("locale", state["locale"])
        tool = TOOL_MAP.get(name)
        if tool is None:
            content = json.dumps({"error": f"unknown tool: {name}"})
        else:
            try:
                content = str(tool.invoke(args))[:4000]
            except Exception as error:
                log.warning("tool %s failed: %s", name, error)
                content = json.dumps({"error": "tool failed"})
        messages.append(
            ToolMessage(content=content, tool_call_id=str(call.get("id", "")))
        )

    return {
        "messages": messages,
        "iterations": state.get("iterations", 0) + 1,
    }


def _should_continue(state: AgentState) -> str:
    last = state["messages"][-1] if state["messages"] else None
    if (
        is_llm_configured()
        and isinstance(last, AIMessage)
        and last.tool_calls
        and state.get("iterations", 0) < MAX_TOOL_ITERATIONS
    ):
        return "tools"
    return "finalize"


def _finalize(state: AgentState) -> dict[str, Any]:
    last = state["messages"][-1] if state["messages"] else None
    # A tool-call message is not a final answer. If the model used up its
    # tool budget, use the deterministic site answer instead of exposing
    # an intermediate "let me check" message.
    if isinstance(last, AIMessage) and last.tool_calls:
        fallback = _fallback(state)
        return {**fallback, "messages": []}

    answer = state.get("answer", "")
    if not answer:
        content = getattr(last, "content", "")
        answer = content if isinstance(content, str) else str(content or "")

    if not answer.strip():
        fallback = _fallback(state)
        return {**fallback, "messages": []}

    locale = state.get("locale", "zh")
    docs = _rank(state.get("question", ""), _documents(locale))
    citations = state.get("citations") or [
        {"label": doc.title, "href": doc.href, "kind": doc.kind}
        for doc in docs[:3]
    ]
    return {
        "answer": answer.strip()[:MAX_ANSWER_CHARS],
        "citations": citations,
        "mode": state.get("mode", "local"),
    }


def _build_graph():
    builder = StateGraph(AgentState)
    builder.add_node("agent", _agent_node)
    builder.add_node("tools", _tools_node)
    builder.add_node("fallback", _fallback)
    builder.add_node("finalize", _finalize)
    builder.add_conditional_edges(
        START,
        lambda _state: "agent" if is_llm_configured() else "fallback",
        {"agent": "agent", "fallback": "fallback"},
    )
    builder.add_conditional_edges(
        "agent",
        _should_continue,
        {"tools": "tools", "finalize": "finalize"},
    )
    builder.add_edge("tools", "agent")
    builder.add_edge("fallback", END)
    builder.add_edge("finalize", END)
    return builder.compile(checkpointer=MemorySaver())


GRAPH = _build_graph()


def ask(question: str, locale: str, session_id: str | None = None) -> dict[str, Any]:
    thread_id = session_id or str(uuid.uuid4())
    initial: AgentState = {
        "messages": [HumanMessage(content=question)],
        "locale": locale,
        "question": question,
        "citations": [],
        "iterations": 0,
        "answer": "",
        "mode": "local",
    }
    result = GRAPH.invoke(
        initial,
        config={"configurable": {"thread_id": thread_id}},
    )
    citations = result.get("citations") or []
    return {
        "answer": result.get("answer", ""),
        "citations": citations,
        "suggestions": (
            ["你做过什么项目？", "你的技术栈是什么？", "怎么联系你？"]
            if locale != "en"
            else ["What have you built?", "What is your stack?", "How do I reach you?"]
        ),
        "mode": result.get("mode", "local"),
    }
