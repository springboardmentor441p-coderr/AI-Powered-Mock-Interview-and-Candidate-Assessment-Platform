import logging
from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions as drf_exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_default_handler
from core.exceptions import (
    ApplicationError, ConflictError, ExternalServiceError, NotFoundError, PermissionDeniedError, ValidationError,
)

logger = logging.getLogger("smarthire")

_DOMAIN_STATUS_MAP = {
    NotFoundError: status.HTTP_404_NOT_FOUND,
    ValidationError: status.HTTP_400_BAD_REQUEST,
    PermissionDeniedError: status.HTTP_403_FORBIDDEN,
    ConflictError: status.HTTP_409_CONFLICT,
    ExternalServiceError: status.HTTP_502_BAD_GATEWAY,
}

def _error_response(code, message, http_status, details=None):
    return Response({"success": False, "error": {"code": code, "message": message, "details": details or {}}}, status=http_status)

def custom_exception_handler(exc, context):
    if isinstance(exc, ApplicationError):
        http_status = status.HTTP_500_INTERNAL_SERVER_ERROR
        for exc_type, mapped in _DOMAIN_STATUS_MAP.items():
            if isinstance(exc, exc_type):
                http_status = mapped
                break
        if http_status >= 500:
            logger.exception("Unhandled application error", exc_info=exc)
        return _error_response(exc.code, exc.message, http_status, exc.details)

    response = drf_default_handler(exc, context)
    if response is not None:
        if isinstance(exc, drf_exceptions.ValidationError):
            return _error_response("validation_error", "Invalid input data.", response.status_code, response.data)
        if isinstance(exc, drf_exceptions.AuthenticationFailed):
            return _error_response("authentication_failed", str(exc), response.status_code)
        if isinstance(exc, drf_exceptions.NotAuthenticated):
            return _error_response("not_authenticated", str(exc), response.status_code)
        if isinstance(exc, drf_exceptions.PermissionDenied):
            return _error_response("permission_denied", str(exc), response.status_code)
        if isinstance(exc, drf_exceptions.Throttled):
            return _error_response("throttled", f"Try again in {exc.wait} seconds.", response.status_code)
        return _error_response("error", str(getattr(exc, "detail", exc)), response.status_code)

    if isinstance(exc, Http404):
        return _error_response("not_found", "Resource not found.", status.HTTP_404_NOT_FOUND)
    if isinstance(exc, PermissionDenied):
        return _error_response("permission_denied", str(exc), status.HTTP_403_FORBIDDEN)

    logger.exception("Unhandled exception", exc_info=exc)
    return _error_response("internal_server_error", "An unexpected error occurred.", status.HTTP_500_INTERNAL_SERVER_ERROR)
