export const NOTIFICATIONS_OPEN_EVENT = "aethermind:open-notifications";

export type NotificationsOpenDetail = {
  readFilter?: "UNREAD";
};

export function openNotificationsDrawer(readFilter?: "UNREAD") {
  window.dispatchEvent(
    new CustomEvent<NotificationsOpenDetail>(NOTIFICATIONS_OPEN_EVENT, {
      detail: readFilter ? { readFilter } : {},
    }),
  );
}
