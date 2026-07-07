"""
Database infrastructure helpers.

Django's ORM handles all schema and query concerns; this module
provides lightweight utilities on top of it (health checks, raw
connection helpers) that services or management commands can import
without coupling to the rest of the infrastructure layer.
"""
from .health import check_db_connection

__all__ = ["check_db_connection"]
