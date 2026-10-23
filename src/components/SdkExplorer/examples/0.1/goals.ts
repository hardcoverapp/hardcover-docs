/**
 * Reading goals. The server calculates progress from your reading; apps
 * never set it. The SDK handles two chores for you:
 * - update() changes only what you pass (the API wants the whole goal), and
 * - goalProgress() compares progress in the goal's own unit (hour goals get
 *   progress in seconds from the API).
 */
import { GoalMetric, goalProgress, HardcoverClient, PrivacySetting, ReadingFormat } from "@hardcover/sdk";

export async function readingChallenge(hc: HardcoverClient) {
  const goal = await hc.goals.create({
    metric: GoalMetric.Book,
    goal: 50,
    description: "50 books in 2026",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    privacy: PrivacySetting.Follows,
  });

  // Ahead of schedule? Raise the target; everything else stays as it was.
  await hc.goals.update(goal.id, { goal: 60 });

  // An audiobook-hours goal.
  const listening = await hc.goals.create({
    metric: GoalMetric.Hour,
    goal: 100,
    description: "100 hours of audiobooks",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    conditions: { readingFormatId: ReadingFormat.Audiobook },
  });

  for (const g of await hc.goals.list()) {
    const { current, target, percent } = goalProgress(g);
    console.log(`${g.description}: ${current.toFixed(1)} / ${target} (${percent.toFixed(0)}%)`);
  }

  // Progress updates on its own as you read; ask for a recalculation if needed.
  await hc.goals.refreshProgress(listening.id);

  await hc.goals.archive(goal.id); // hidden from list() unless includeArchived
  await hc.goals.delete(listening.id);
}
