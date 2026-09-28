import os
import time
import httpx
import hashlib
from typing import Optional, Dict
import asyncio

# A simple in-memory cache to store { hash(text): video_url }
# In production, Redis would be better.
_AVATAR_CACHE: Dict[str, str] = {}
_IMAGE_URL_CACHE: Dict[str, str] = {} # { local_path: did_url }

DID_BASE_URL = "https://api.d-id.com/talks"
DID_IMAGES_URL = "https://api.d-id.com/images"
DEFAULT_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop" # Professional female portrait

async def generate_avatar_video(text: str, avatar_url: str = "") -> Optional[str]:
    """
    Generates a talking avatar video via D-ID for the given text.
    Uses caching based on the MD5 hash of the text to save credits and latency.
    """
    api_key = os.getenv("DID_API_KEY", "")
    if not api_key:
        print("[Avatar] No DID_API_KEY found. Falling back to local TTS/idle.")
        return None

    # Check cache
    text_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
    if text_hash in _AVATAR_CACHE:
        return _AVATAR_CACHE[text_hash]

    if not avatar_url:
        avatar_url = DEFAULT_AVATAR

    headers = {
        "Authorization": f"Basic {api_key}"
    }

    # Step 0: If avatar_url is a local path, upload it to D-ID first
    if not avatar_url.startswith("http"):
        if avatar_url in _IMAGE_URL_CACHE:
            avatar_url = _IMAGE_URL_CACHE[avatar_url]
        else:
            try:
                import os
                if os.path.exists(avatar_url):
                    with open(avatar_url, 'rb') as f:
                        files = {'image': (os.path.basename(avatar_url), f, 'image/png')}
                        async with httpx.AsyncClient() as client:
                            img_res = await client.post(DID_IMAGES_URL, headers=headers, files=files)
                            img_res.raise_for_status()
                            img_data = img_res.json()
                            if "url" in img_data:
                                _IMAGE_URL_CACHE[avatar_url] = img_data["url"]
                                avatar_url = img_data["url"]
                            else:
                                print("[Avatar] Image upload failed to return URL:", img_data)
                                avatar_url = DEFAULT_AVATAR
                else:
                    avatar_url = DEFAULT_AVATAR
            except Exception as e:
                print(f"[Avatar] Image upload error: {e}")
                avatar_url = DEFAULT_AVATAR

    headers["Content-Type"] = "application/json"

    # Step 1: Create a new Talk
    payload = {
        "source_url": avatar_url,
        "script": {
            "type": "text",
            "input": text,
            "provider": {
                "type": "microsoft",
                "voice_id": "en-US-JennyNeural" # Professional female voice
            }
        },
        "config": {
            "fluent": "false",
            "pad_audio": "0.0"
        }
    }

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(DID_BASE_URL, json=payload, headers=headers)
            res.raise_for_status()
            data = res.json()
            talk_id = data.get("id")
            if not talk_id:
                raise Exception(f"No talk ID returned from D-ID: {data}")
            
            # Step 2: Poll for completion
            # D-ID typically takes 3-10 seconds to generate a short clip.
            max_attempts = 15
            for _ in range(max_attempts):
                await asyncio.sleep(1.5)
                poll_res = await client.get(f"{DID_BASE_URL}/{talk_id}", headers=headers)
                poll_res.raise_for_status()
                poll_data = poll_res.json()
                status = poll_data.get("status")
                
                if status == "done":
                    result_url = poll_data.get("result_url")
                    if result_url:
                        _AVATAR_CACHE[text_hash] = result_url
                        return result_url
                    break
                elif status == "error":
                    print(f"[Avatar] D-ID error: {poll_data}")
                    break
                
        except Exception as e:
            print(f"[Avatar] Generation failed: {e}")
            return None

    return None
