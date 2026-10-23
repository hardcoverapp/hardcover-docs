/**
 * Ranked, followed and shared lists. Reading needs `read:lists`; changes need
 * `write:lists`.
 */
import { HardcoverClient, ListMemberStatus, PrivacySetting } from "@hardcover/sdk";

export async function rankAList(hc: HardcoverClient, bookIds: number[]) {
  const list = await hc.lists.create({ name: "My top five", privacy: PrivacySetting.Public, ranked: true });
  for (const bookId of bookIds) await hc.lists.addBook(list.id, bookId);

  // Every row on the list, in the new order (here: reversed). Anything missing
  // or extra throws before a change is made.
  const rows = (await hc.lists.get(list.id, { limit: bookIds.length }))!.listBooks;
  await hc.lists.reorder(list.id, rows.map((row) => row.id).reverse());
}

export async function followAList(hc: HardcoverClient, listId: number) {
  await hc.lists.follow(listId); // safe to repeat

  const { items } = await hc.lists.followed();
  console.log(items.map((followed) => followed.list.name));

  await hc.lists.unfollow(listId);
}

export async function editTogether(hc: HardcoverClient, listId: number, friendId: number) {
  // Owner only; the server decides who can be invited (no private lists,
  // only readers you follow on a followers-only list).
  await hc.lists.invite(listId, friendId);

  for (const member of await hc.lists.members(listId)) {
    console.log(member.user?.username, member.status === ListMemberStatus.Accepted ? "editing" : "invited");
  }

  // As the friend: answer the invite, or leave later.
  //   await hc.lists.respond(listId, ListMemberStatus.Accepted);
  //   await hc.lists.removeMember(listId, myId);

  // Your own invites and memberships, like an inbox.
  const memberships = await hc.lists.memberships();
  const pending = memberships.filter((m) => m.status === ListMemberStatus.Invited);
  console.log(`${pending.length} invites waiting`);
}
