import { getList, post } from "@/api/client";
import type { Paginated } from "@/api/client";
import type { Notification } from "@/types/api";

export const notificationsApi = {
  async list(unreadOnly = false): Promise<Paginated<Notification>> {
    return getList<Notification>("/notifications/", { params: unreadOnly ? { unread_only: "true" } : undefined });
  },
  async markRead(notificationId: string): Promise<Notification | null> {
    return post<Notification | null>(`/notifications/${notificationId}/read/`);
  },
  async markAllRead(): Promise<{ updated: number }> {
    return post<{ updated: number }>("/notifications/read-all/");
  },
};
