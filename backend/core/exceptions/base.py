"""
Domain-level exceptions.

These are framework-agnostic exceptions raised by service/repository
layers. They are translated into proper HTTP responses by
`apps.core.exceptions.handlers.custom_exception_handler`, keeping
business logic decoupled from DRF/HTTP concerns (Dependency Inversion).
"""


class ApplicationError(Exception):
    """Base class for all predictable, business-logic level errors."""

    default_message = "An application error occurred."
    code = "application_error"

    def __init__(self, message: str | None = None, code: str | None = None, details=None):
        self.message = message or self.default_message
        self.code = code or self.code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(ApplicationError):
    default_message = "The requested resource was not found."
    code = "not_found"


class ValidationError(ApplicationError):
    default_message = "Invalid input data."
    code = "validation_error"


class PermissionDeniedError(ApplicationError):
    default_message = "You do not have permission to perform this action."
    code = "permission_denied"


class ConflictError(ApplicationError):
    default_message = "The request could not be completed due to a conflict."
    code = "conflict"


class ExternalServiceError(ApplicationError):
    """Raised when an upstream AI/3rd-party service fails or times out."""

    default_message = "An external service failed to respond correctly."
    code = "external_service_error"


class BusinessRuleViolation(ApplicationError):
    default_message = "This action violates a business rule."
    code = "business_rule_violation"
