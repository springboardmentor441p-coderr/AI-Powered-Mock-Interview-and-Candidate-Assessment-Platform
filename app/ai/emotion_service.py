"""
Emotion detection service using OpenCV and MediaPipe.
"""
import os
from typing import Optional

import cv2
from flask import current_app

from app.extensions import db
from app.models import EmotionAnalysis
from app.utils.constants import (
    EMOTION_HAPPY,
    EMOTION_NERVOUS,
    EMOTION_NEUTRAL,
    EMOTION_SAD,
)

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    mp = None
    MEDIAPIPE_AVAILABLE = False


class EmotionDetectionService:
    """Detect emotions and engagement from video frames."""

    @staticmethod
    def analyze_video_frames(
        frame_data_list: list[dict],
    ) -> dict:
        """
        Analyze emotion metrics from webcam frame data.

        Args:
            frame_data_list: List of frame analysis dicts from client.

        Returns:
            Aggregated emotion analysis results.
        """
        if not frame_data_list:
            return EmotionDetectionService._default_results()

        total = len(frame_data_list)
        happy = sum(f.get("happy", 0) for f in frame_data_list) / total
        neutral = sum(f.get("neutral", 0) for f in frame_data_list) / total
        sad = sum(f.get("sad", 0) for f in frame_data_list) / total
        nervous = sum(f.get("nervous", 0) for f in frame_data_list) / total
        eye_contact = sum(f.get("eye_contact", 0) for f in frame_data_list) / total
        attention = sum(f.get("attention", 0) for f in frame_data_list) / total
        face_presence = sum(f.get("face_presence", 0) for f in frame_data_list) / total

        scores = {
            EMOTION_HAPPY: happy,
            EMOTION_NEUTRAL: neutral,
            EMOTION_SAD: sad,
            EMOTION_NERVOUS: nervous,
        }
        dominant = max(scores, key=scores.get)

        confidence = round(
            (happy * 0.3 + neutral * 0.2 + (100 - nervous) * 0.3 + eye_contact * 0.2),
            1,
        )

        return {
            "dominant_emotion": dominant,
            "happy_score": round(happy, 1),
            "neutral_score": round(neutral, 1),
            "sad_score": round(sad, 1),
            "nervous_score": round(nervous, 1),
            "eye_contact_score": round(eye_contact, 1),
            "confidence_score": round(min(100, confidence), 1),
            "attention_score": round(attention, 1),
            "face_presence_score": round(face_presence, 1),
            "frame_count": total,
        }

    @staticmethod
    def _default_results() -> dict:
        """Return neutral default results."""
        return {
            "dominant_emotion": EMOTION_NEUTRAL,
            "happy_score": 50.0,
            "neutral_score": 70.0,
            "sad_score": 10.0,
            "nervous_score": 30.0,
            "eye_contact_score": 60.0,
            "confidence_score": 65.0,
            "attention_score": 70.0,
            "face_presence_score": 80.0,
            "frame_count": 0,
        }

    @staticmethod
    def analyze_image_file(image_path: str) -> dict:
        """
        Analyze single image file with MediaPipe face mesh.

        Args:
            image_path: Path to image file.

        Returns:
            Frame analysis dictionary.
        """
        full_path = os.path.join(current_app.config["UPLOAD_FOLDER"], image_path)
        if not os.path.exists(full_path):
            return EmotionDetectionService._single_frame_default()

        try:
            image = cv2.imread(full_path)
            if image is None:
                return EmotionDetectionService._single_frame_default()

            if MEDIAPIPE_AVAILABLE:
                return EmotionDetectionService._analyze_with_mediapipe(image)

            return EmotionDetectionService._analyze_with_opencv(image)
        except Exception as exc:
            current_app.logger.warning(f"Emotion analysis fallback: {exc}")
            return EmotionDetectionService._single_frame_default()

    @staticmethod
    def _analyze_with_mediapipe(image) -> dict:
        """Analyze image using MediaPipe face mesh."""
        mp_face_mesh = mp.solutions.face_mesh
        with mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        ) as face_mesh:
            rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)

            if not results.multi_face_landmarks:
                return EmotionDetectionService._single_frame_default()

            landmarks = results.multi_face_landmarks[0].landmark
            return EmotionDetectionService._analyze_landmarks(landmarks)

    @staticmethod
    def _analyze_with_opencv(image) -> dict:
        """Analyze image using OpenCV Haar cascades."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)

        if len(faces) == 0:
            return {
                "happy": 30,
                "neutral": 50,
                "sad": 20,
                "nervous": 40,
                "eye_contact": 30,
                "attention": 40,
                "face_presence": 0,
            }

        x, y, w, h = faces[0]
        face_center_x = x + w / 2
        image_center_x = image.shape[1] / 2
        eye_contact = max(0, 100 - abs(face_center_x - image_center_x) / image.shape[1] * 200)
        brightness = float(gray[y : y + h, x : x + w].mean())

        happy = min(100, max(0, (brightness / 255) * 80 + 20))
        nervous = min(100, max(20, 70 - (brightness / 255) * 30))
        sad = max(0, 40 - happy * 0.3)
        neutral = max(0, 100 - happy - sad - nervous * 0.3)

        return {
            "happy": round(happy, 1),
            "neutral": round(neutral, 1),
            "sad": round(sad, 1),
            "nervous": round(nervous, 1),
            "eye_contact": round(eye_contact, 1),
            "attention": round(min(100, eye_contact * 0.8 + 20), 1),
            "face_presence": 100,
        }

    @staticmethod
    def _analyze_landmarks(landmarks) -> dict:
        """Derive emotion metrics from facial landmarks."""
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        nose_tip = landmarks[1]
        mouth_left = landmarks[61]
        mouth_right = landmarks[291]
        mouth_top = landmarks[13]
        mouth_bottom = landmarks[14]

        eye_openness = abs(left_eye.y - landmarks[159].y) + abs(
            right_eye.y - landmarks[386].y
        )
        mouth_width = abs(mouth_right.x - mouth_left.x)
        mouth_height = abs(mouth_bottom.y - mouth_top.y)
        smile_ratio = mouth_width / max(mouth_height, 0.001)

        eye_center_x = (left_eye.x + right_eye.x) / 2
        eye_contact = max(0, 100 - abs(eye_center_x - 0.5) * 200)

        happy = min(100, max(0, (smile_ratio - 2) * 40 + 50))
        nervous = min(100, max(0, (1 - eye_openness * 50) * 60 + 20))
        sad = min(100, max(0, 50 - happy * 0.5))
        neutral = max(0, 100 - happy - sad - nervous * 0.5)
        attention = min(100, eye_contact * 0.7 + 30)

        return {
            "happy": round(happy, 1),
            "neutral": round(neutral, 1),
            "sad": round(sad, 1),
            "nervous": round(nervous, 1),
            "eye_contact": round(eye_contact, 1),
            "attention": round(attention, 1),
            "face_presence": 100,
        }

    @staticmethod
    def _single_frame_default() -> dict:
        """Default single frame metrics."""
        return {
            "happy": 45,
            "neutral": 55,
            "sad": 15,
            "nervous": 35,
            "eye_contact": 55,
            "attention": 60,
            "face_presence": 50,
        }

    @staticmethod
    def save_analysis(answer_id: int, results: dict) -> EmotionAnalysis:
        """
        Persist emotion analysis to database.

        Args:
            answer_id: Answer record ID.
            results: Analysis results dictionary.

        Returns:
            EmotionAnalysis record.
        """
        existing = EmotionAnalysis.query.filter_by(answer_id=answer_id).first()
        if existing:
            analysis = existing
        else:
            analysis = EmotionAnalysis(answer_id=answer_id)
            db.session.add(analysis)

        analysis.dominant_emotion = results.get("dominant_emotion", EMOTION_NEUTRAL)
        analysis.happy_score = results.get("happy_score", 0)
        analysis.neutral_score = results.get("neutral_score", 0)
        analysis.sad_score = results.get("sad_score", 0)
        analysis.nervous_score = results.get("nervous_score", 0)
        analysis.eye_contact_score = results.get("eye_contact_score", 0)
        analysis.confidence_score = results.get("confidence_score", 0)
        analysis.attention_score = results.get("attention_score", 0)
        analysis.face_presence_score = results.get("face_presence_score", 0)
        analysis.frame_count = results.get("frame_count", 0)

        db.session.commit()
        return analysis
