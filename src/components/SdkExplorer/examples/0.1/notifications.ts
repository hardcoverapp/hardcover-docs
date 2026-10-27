/**
 * The in-app notification bell. Reading needs `read:notifications`; marking
 * read needs `write:notifications`.
 */
import { HardcoverClient } from "@hardcover/sdk";

export async function notificationBell(hc: HardcoverClient) {
  const unread = await hc.notifications.unreadCount();
  console.log(`${unread} unread`);

  const { items } = await hc.notifications.list({ limit: 20 });
  for (const delivery of items) {
    const { title, link, notifierUser } = delivery.notification ?? {};
    console.log(delivery.read ? " " : "•", title, notifierUser?.username ?? "", link ?? "");
  }

  // Mark the ones on screen read, or everything with markRead().
  await hc.notifications.markRead(items.filter((delivery) => !delivery.read).map((delivery) => delivery.id));
}
