"""
Standalone Groq diagnostics for Verixa.

Run from the backend directory:
    .\\venv\\Scripts\\python.exe scripts\\diagnose_groq.py

Requires GROQ_API_KEY in backend/.env or the shell environment.
"""

from __future__ import annotations

import argparse
import json
import os
import time

import httpx
from dotenv import load_dotenv


def post_chat(
    *,
    base_url: str,
    api_key: str,
    model: str,
    messages: list[dict[str, str]],
    timeout_seconds: float,
    json_mode: bool = False,
) -> dict:
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0,
        "max_tokens": 1024,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    started = time.perf_counter()
    with httpx.Client(timeout=httpx.Timeout(timeout_seconds, connect=10.0)) as client:
        response = client.post(
            base_url.rstrip("/") + "/chat/completions",
            json=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )
        elapsed = time.perf_counter() - started
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError:
            print(f"  response_body={response.text[:1000]}")
            raise
        data = response.json()

    content = data["choices"][0]["message"]["content"]
    print(f"  status=ok elapsed={elapsed:.2f}s content_chars={len(content)}")
    print(f"  preview={content[:160]!r}")
    return data


def main() -> int:
    load_dotenv()

    parser = argparse.ArgumentParser(description="Diagnose Groq chat completions.")
    parser.add_argument("--base-url", default=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"))
    parser.add_argument("--model", default=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"))
    parser.add_argument("--timeout", type=float, default=float(os.getenv("GROQ_TIMEOUT_SECONDS", "60")))
    args = parser.parse_args()

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("status=failed error=GROQ_API_KEY is missing")
        return 1

    try:
        print("1. Checking simple chat")
        post_chat(
            base_url=args.base_url,
            api_key=api_key,
            model=args.model,
            timeout_seconds=args.timeout,
            messages=[{"role": "user", "content": "Reply with exactly: pong"}],
        )

        print("2. Checking JSON mode")
        data = post_chat(
            base_url=args.base_url,
            api_key=api_key,
            model=args.model,
            timeout_seconds=args.timeout,
            json_mode=True,
            messages=[{"role": "user", "content": 'Return only JSON: {"status":"ok"}'}],
        )
        parsed = json.loads(data["choices"][0]["message"]["content"])
        print(f"  parsed_json={parsed}")

        print("3. Checking resume-sized prompt")
        resume_text = "\n".join(
            f"Project {idx}: Python FastAPI React PostgreSQL Docker CI/CD APIs."
            for idx in range(80)
        )
        post_chat(
            base_url=args.base_url,
            api_key=api_key,
            model=args.model,
            timeout_seconds=args.timeout,
            json_mode=True,
            messages=[
                {"role": "system", "content": "Return only JSON."},
                {
                    "role": "user",
                    "content": (
                        "Return a JSON object with keys name, skills, projects "
                        f"from this resume text:\n{resume_text}"
                    ),
                },
            ],
        )

    except Exception as exc:  # noqa: BLE001 - diagnostic script
        print(f"status=failed error={type(exc).__name__}: {exc}")
        return 1

    print("All Groq diagnostics passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
