/**
 * Readers and what they share: profiles, follows, feeds, friends on a book,
 * likes and blocks. Profiles need `read:users`; connections and feeds need
 * `read:social`; changes need `write:social`.
 */
import { BlockType, HardcoverClient, LikeableType } from "@hardcover/sdk";

export async function aReadersProfile(hc: HardcoverClient) {
  // Usernames are case-insensitive, and a leading @ is fine.
  const reader = await hc.users.getByUsername("@adam");
  if (!reader) return;
  console.log(reader.username, reader.flair, reader.admin ? "Team" : "");

  const { items: followers } = await hc.users.followers(reader.id, { limit: 5 });
  console.log(`${reader.followersCount} followers, e.g.`, followers.map((f) => f.user.username));

  const { items: activity } = await hc.activities.forUser(reader.id, { limit: 10 });
  console.log(activity.map((a) => `${a.event} ${a.book?.title ?? ""}`));
}

export async function friendsWhoReadIt(hc: HardcoverClient, bookId: number) {
  // The library entries of people you follow: status, rating, review.
  for (const entry of await hc.books.friends(bookId)) {
    console.log(entry.user?.username, entry.statusId, entry.rating, entry.reviewMarkdown ? "reviewed" : "");
  }
}

export async function yourFeed(hc: HardcoverClient) {
  const { items } = await hc.activities.following({ limit: 20 });

  for (const activity of items) console.log(activity.user.username, activity.event);

  // Like one the reader tapped. A review is liked as its library entry (LikeableType.Review).
  const tapped = items[0];
  if (tapped) {
    const likes = await hc.likes.like(LikeableType.Activity, tapped.id);
    console.log(`${likes} likes`);
  }
}

export async function connections(hc: HardcoverClient, userId: number) {
  await hc.users.follow(userId);
  await hc.users.unfollow(userId);

  // Someone follows you and you'd rather they didn't.
  await hc.users.removeFollower(userId);

  // A full block also ends follows both ways; invites-only stops club and buddy-read invites.
  await hc.users.block(userId, { type: BlockType.Invites });
  console.log((await hc.users.blocked()).map((b) => `${b.blockedUser?.username} (${b.type})`));
  await hc.users.unblock(userId);
}
