import logging
import time
import uuid

logger = logging.getLogger("smarthire")


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = str(uuid.uuid4())
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start) * 1000
        response["X-Request-ID"] = request.request_id
        logger.info("%s %s -> %s (%.2fms) [%s]", request.method, request.path,
                    response.status_code, duration_ms, request.request_id)
        return response


class ExceptionLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        logger.exception("Unhandled exception during %s %s [%s]",
                         request.method, request.path, getattr(request, "request_id", "n/a"), exc_info=exception)
        return None
