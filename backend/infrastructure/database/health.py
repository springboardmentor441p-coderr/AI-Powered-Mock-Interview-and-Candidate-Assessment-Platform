"""
Database connectivity health check.

Used by /health/ endpoints and Docker HEALTHCHECK commands to verify
that the database is reachable and the connection pool is alive.
"""
import logging

from django.db import connection, OperationalError

logger = logging.getLogger("smarthire")


def check_db_connection() -> bool:
    """
    Return True if the default database is reachable, False otherwise.
    Safe to call at any time; never raises.
    """
    try:
        connection.ensure_connection()
        return True
    except OperationalError as exc:
        logger.warning("Database health check failed: %s", exc)
        return False
