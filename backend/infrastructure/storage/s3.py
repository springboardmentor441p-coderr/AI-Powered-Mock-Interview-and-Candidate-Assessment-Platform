"""
S3-compatible storage adapter.

When `DEFAULT_FILE_STORAGE=storages.backends.s3boto3.S3Boto3Storage`
is set in production settings, Django's `default_storage` already
routes to S3. This module exists as an explicit named adapter for
any code that needs S3-specific operations (pre-signed URLs, lifecycle
rules, etc.) without coupling to boto3 everywhere.

Install: pip install django-storages[s3] boto3
"""
import logging

from django.conf import settings

logger = logging.getLogger("smarthire")


class S3Storage:
    def __init__(self):
        try:
            import boto3
            self._client = boto3.client(
                "s3",
                aws_access_key_id=getattr(settings, "AWS_ACCESS_KEY_ID", ""),
                aws_secret_access_key=getattr(settings, "AWS_SECRET_ACCESS_KEY", ""),
                region_name=getattr(settings, "AWS_S3_REGION_NAME", "us-east-1"),
            )
            self._bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", "")
        except ImportError:
            logger.warning("boto3 not installed; S3Storage will raise on use.")
            self._client = None
            self._bucket = ""

    def generate_presigned_url(self, key: str, expiry: int = 3600) -> str:
        if not self._client:
            raise RuntimeError("boto3 is not installed.")
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=expiry,
        )

    def delete(self, key: str) -> None:
        if not self._client:
            raise RuntimeError("boto3 is not installed.")
        self._client.delete_object(Bucket=self._bucket, Key=key)
