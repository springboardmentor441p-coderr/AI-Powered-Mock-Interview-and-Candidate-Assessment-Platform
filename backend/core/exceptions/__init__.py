class ApplicationError(Exception):
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
    default_message = "An external service failed to respond correctly."
    code = "external_service_error"

class BusinessRuleViolation(ApplicationError):
    default_message = "This action violates a business rule."
    code = "business_rule_violation"
