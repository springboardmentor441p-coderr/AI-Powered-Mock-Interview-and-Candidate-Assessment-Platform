"""
generate_assets.py - Generates fake video (.y4m) and audio (.wav) assets for Chromium fake media devices.
"""
import os
import math
import struct
import wave

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_DIR = os.path.join(SCRIPT_DIR, "video")
AUDIO_DIR = os.path.join(SCRIPT_DIR, "audio")

os.makedirs(VIDEO_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

WIDTH = 640
HEIGHT = 480
FPS = 30
FRAME_COUNT = 30  # 1 second loop

def make_yuv_frame(draw_faces: list[tuple[int, int, int]]):
    """
    draw_faces: list of (center_x, center_y, radius)
    """
    y_plane = bytearray(WIDTH * HEIGHT)
    u_plane = bytearray((WIDTH // 2) * (HEIGHT // 2))
    v_plane = bytearray((WIDTH // 2) * (HEIGHT // 2))

    # Background: soft indoor office color (Y=150, U=128, V=128)
    for i in range(len(y_plane)):
        y_plane[i] = 150
    for i in range(len(u_plane)):
        u_plane[i] = 128
        v_plane[i] = 128

    # Draw face circles/ovals with skin tone (Y=205, U=110, V=155)
    for cx, cy, radius in draw_faces:
        for y in range(HEIGHT):
            for x in range(WIDTH):
                # Elliptical face
                dx = (x - cx) / radius
                dy = (y - cy) / (radius * 1.3)
                dist_sq = dx * dx + dy * dy
                if dist_sq <= 1.0:
                    y_plane[y * WIDTH + x] = 205
                    u_x = x // 2
                    u_y = y // 2
                    u_idx = u_y * (WIDTH // 2) + u_x
                    u_plane[u_idx] = 110
                    v_plane[u_idx] = 155

                    # Eyes
                    eye_dy = y - (cy - int(radius * 0.2))
                    left_eye_dx = x - (cx - int(radius * 0.4))
                    right_eye_dx = x - (cx + int(radius * 0.4))
                    if (left_eye_dx**2 + eye_dy**2 < (radius * 0.15)**2) or (right_eye_dx**2 + eye_dy**2 < (radius * 0.15)**2):
                        y_plane[y * WIDTH + x] = 30 # Dark eyes
                        u_plane[u_idx] = 128
                        v_plane[u_idx] = 128

                    # Mouth
                    mouth_dy = y - (cy + int(radius * 0.5))
                    mouth_dx = x - cx
                    if (mouth_dx / (radius * 0.4))**2 + (mouth_dy / (radius * 0.15))**2 < 1.0:
                        y_plane[y * WIDTH + x] = 100 # Darker lips
                        v_plane[u_idx] = 165

    return bytes(y_plane) + bytes(u_plane) + bytes(v_plane)

def create_y4m(filepath: str, faces: list[tuple[int, int, int]]):
    header = f"YUV4MPEG2 W{WIDTH} H{HEIGHT} F{FPS}:1 Ip A1:1 C420\n".encode("ascii")
    frame_header = b"FRAME\n"
    frame_data = make_yuv_frame(faces)

    with open(filepath, "wb") as f:
        f.write(header)
        for _ in range(FRAME_COUNT):
            f.write(frame_header)
            f.write(frame_data)
    print(f"Created Y4M: {filepath} ({os.path.getsize(filepath)} bytes)")

def create_wav(filepath: str, duration_sec: float, base_freq: float = 0.0):
    sample_rate = 16000
    n_samples = int(duration_sec * sample_rate)
    with wave.open(filepath, "wb") as wav:
        wav.setnchannels(1)  # Mono
        wav.setsampwidth(2)  # 16-bit
        wav.setframerate(sample_rate)

        frames = bytearray()
        for i in range(n_samples):
            t = i / sample_rate
            if base_freq == 0.0:
                sample = 0
            else:
                envelope = math.sin(math.pi * (t / duration_sec))
                signal = (
                    0.6 * math.sin(2 * math.pi * base_freq * t) +
                    0.3 * math.sin(2 * math.pi * (base_freq * 2) * t) +
                    0.1 * math.sin(2 * math.pi * (base_freq * 3) * t)
                )
                sample = int(32767 * 0.7 * envelope * signal)
                sample = max(-32768, min(32767, sample))
            frames.extend(struct.pack("<h", sample))

        wav.writeframes(frames)
    print(f"Created WAV: {filepath} ({os.path.getsize(filepath)} bytes)")

def main():
    # 1. Candidate Present (1 centered face)
    create_y4m(os.path.join(VIDEO_DIR, "candidate-present.y4m"), [(320, 240, 90)])

    # 2. Empty Room (no faces)
    create_y4m(os.path.join(VIDEO_DIR, "empty-room.y4m"), [])

    # 3. Multiple People (2 faces)
    create_y4m(os.path.join(VIDEO_DIR, "multiple-people.y4m"), [(200, 240, 75), (440, 240, 75)])

    # Audio files
    create_wav(os.path.join(AUDIO_DIR, "answer-1.wav"), duration_sec=2.5, base_freq=220.0)
    create_wav(os.path.join(AUDIO_DIR, "answer-2.wav"), duration_sec=3.0, base_freq=261.6)
    create_wav(os.path.join(AUDIO_DIR, "answer-3.wav"), duration_sec=2.8, base_freq=293.7)
    create_wav(os.path.join(AUDIO_DIR, "answer-4.wav"), duration_sec=3.2, base_freq=329.6)
    create_wav(os.path.join(AUDIO_DIR, "silence.wav"), duration_sec=2.0, base_freq=0.0)

if __name__ == "__main__":
    main()
