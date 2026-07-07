from apps.ai.providers.eye_tracking.interfaces import EyeContactResult, IEyeContactTrackingProvider
from core.exceptions import ExternalServiceError


class MediaPipeEyeContactProvider(IEyeContactTrackingProvider):
    """Adapter around MediaPipe FaceMesh for gaze/eye-contact estimation."""

    def analyze(self, video_file_path: str) -> EyeContactResult:
        try:
            import cv2
            from mediapipe.python.solutions import face_mesh as mp_face_mesh
        except ImportError as exc:
            raise ExternalServiceError("opencv-python / mediapipe are not installed.") from exc

        try:
            face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1)
            capture = cv2.VideoCapture(video_file_path)
            total_frames = 0
            forward_facing_frames = 0

            while True:
                ok, frame = capture.read()
                if not ok:
                    break
                total_frames += 1
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = face_mesh.process(rgb)
                if results.multi_face_landmarks: # type: ignore[attr-defined]
                    forward_facing_frames += 1
            capture.release()

            if total_frames == 0:
                raise ExternalServiceError("Video contains no readable frames.")

            eye_contact_percentage = round((forward_facing_frames / total_frames) * 100, 2)
            attention_score = eye_contact_percentage
            engagement_score = round((eye_contact_percentage + attention_score) / 2, 2)
            return EyeContactResult(
                eye_contact_percentage=eye_contact_percentage,
                attention_score=attention_score,
                engagement_score=engagement_score,
            )
        except ExternalServiceError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise ExternalServiceError("Eye-contact tracking failed.", details={"reason": str(exc)}) from exc
