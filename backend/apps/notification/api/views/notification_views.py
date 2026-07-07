from rest_framework import generics, permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from core.responses import APIResponse

from apps.notification.api.serializers.notification_serializer import NotificationSerializer
from apps.notification.models import Notification


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):  # type: ignore[override]
        request: Request = self.request  # type: ignore[assignment]
        qs = Notification.objects.filter(recipient=request.user)
        if request.query_params.get("unread_only") == "true":
            qs = qs.filter(is_read=False)
        return qs


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id, *args, **kwargs):
        notification = Notification.objects.filter(pk=notification_id, recipient=request.user).first()
        if notification and not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])
        return APIResponse.success(data=NotificationSerializer(notification).data if notification else None)


class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        updated = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return APIResponse.success(data={"updated": updated})
