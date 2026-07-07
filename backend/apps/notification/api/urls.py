from django.urls import path

from apps.notification.api.views.notification_views import (
    NotificationListView, NotificationMarkAllReadView, NotificationMarkReadView,
)

app_name = "notification"

urlpatterns = [
    path("", NotificationListView.as_view(), name="list"),
    path("<uuid:notification_id>/read/", NotificationMarkReadView.as_view(), name="mark_read"),
    path("read-all/", NotificationMarkAllReadView.as_view(), name="mark_all_read"),
]
