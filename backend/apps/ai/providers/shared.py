import hashlib
import random


def seeded_random(seed_source: str) -> random.Random:
    """Deterministic per-input randomness so repeated calls against the
    same recording return stable, reproducible results (useful for
    mock providers and tests)."""
    seed_source = seed_source or "default"
    seed = int(hashlib.sha256(seed_source.encode()).hexdigest(), 16) % (10**8)
    return random.Random(seed)
