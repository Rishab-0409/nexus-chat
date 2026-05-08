"""
AI Service — Chat Summarization & Smart Replies
Uses Anthropic Claude API
"""
import httpx
import os
import json

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
API_URL = "https://api.anthropic.com/v1/messages"

HEADERS = {
    "x-api-key": ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
}

async def summarize_chat(chat_text: str) -> str:
    if not ANTHROPIC_API_KEY:
        return _mock_summary(chat_text)
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(API_URL, headers=HEADERS, json={
                "model": "claude-opus-4-5",
                "max_tokens": 300,
                "system": "You are a helpful assistant that summarizes chat conversations concisely. Provide a 2-4 sentence summary highlighting key topics, decisions, and action items.",
                "messages": [{"role": "user", "content": f"Summarize this chat:\n\n{chat_text}"}]
            })
            data = resp.json()
            return data["content"][0]["text"]
    except Exception as e:
        return _mock_summary(chat_text)

async def ai_reply(context: str, prompt: str) -> str:
    if not ANTHROPIC_API_KEY:
        return _mock_reply(prompt)
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(API_URL, headers=HEADERS, json={
                "model": "claude-opus-4-5",
                "max_tokens": 200,
                "system": "You are a helpful AI assistant in a chat app. Reply naturally and concisely.",
                "messages": [{
                    "role": "user",
                    "content": f"Chat context:\n{context}\n\nUser asks: {prompt}"
                }]
            })
            data = resp.json()
            return data["content"][0]["text"]
    except:
        return _mock_reply(prompt)

def _mock_summary(text: str) -> str:
    lines = text.strip().split("\n")
    n = len(lines)
    return (f"This conversation has {n} messages covering various topics. "
            f"Participants discussed key matters and exchanged information. "
            f"Set ANTHROPIC_API_KEY environment variable for real AI summaries.")

def _mock_reply(prompt: str) -> str:
    return (f"I understand you're asking about: \"{prompt[:50]}...\". "
            f"Set ANTHROPIC_API_KEY for real AI-powered responses!")
