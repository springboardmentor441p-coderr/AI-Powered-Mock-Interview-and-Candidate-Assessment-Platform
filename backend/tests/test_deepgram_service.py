from app.services.deepgram_service import DeepgramService
from types import SimpleNamespace


def test_detects_pcm_wav_content_type():
    wav_header = b"RIFF" + (36).to_bytes(4, "little") + b"WAVEfmt "

    assert DeepgramService._detect_audio_content_type(wav_header) == "audio/wav"


def test_extracts_transcript_from_http_json_response():
    response = {
        "results": {
            "channels": [
                {
                    "alternatives": [
                        {"transcript": "I built the service with FastAPI."},
                    ],
                },
            ],
        },
    }

    assert DeepgramService._extract_transcript(response) == (
        "I built the service with FastAPI."
    )


def test_extracts_final_live_transcript():
    response = SimpleNamespace(
        type="Results",
        is_final=True,
        from_finalize=True,
        channel=SimpleNamespace(
            alternatives=[SimpleNamespace(transcript="I reduced API latency.")]
        ),
    )

    assert DeepgramService.extract_live_transcript(response) == (
        "I reduced API latency.",
        True,
        True,
    )
