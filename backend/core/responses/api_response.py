from typing import Any

from rest_framework import status
from rest_framework.response import Response


class APIResponse:
    @staticmethod
    def success(
        data: Any = None,
        message: str = "",
        http_status: int = status.HTTP_200_OK,
    ) -> Response:
        payload: dict[str, Any] = {"success": True}
        if message:
            payload["message"] = message
        payload["data"] = data
        return Response(payload, status=http_status)

    @staticmethod
    def created(data: Any = None, message: str = "Resource created successfully.") -> Response:
        return APIResponse.success(data=data, message=message, http_status=status.HTTP_201_CREATED)

    @staticmethod
    def no_content() -> Response:
        return Response(status=status.HTTP_204_NO_CONTENT)

    @staticmethod
    def error(
        message: str = "An error occurred.",
        data: Any = None,
        http_status: int = status.HTTP_400_BAD_REQUEST,
    ) -> Response:
        payload: dict[str, Any] = {"success": False, "message": message}
        if data is not None:
            payload["data"] = data
        return Response(payload, status=http_status)
