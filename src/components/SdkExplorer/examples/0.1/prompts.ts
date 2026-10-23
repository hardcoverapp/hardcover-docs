/**
 * Prompts: community questions ("What's your favorite cozy fantasy?") that
 * readers answer with books. Reading needs `read:prompts`; asking, answering
 * and following need `write:prompts`.
 *
 * The server owns the rules: prompts are always public, a question is unique
 * and at most 140 characters, and once a prompt has more than 5 answers only
 * its description can change.
 */
import { HardcoverClient } from "@hardcover/sdk";

export async function browsePrompts(hc: HardcoverClient) {
  // Most answered first; `sort: "newest"` and `featured: true` narrow it.
  const { items: popular } = await hc.prompts.list({ limit: 5 });

  for (const prompt of popular) {
    console.log(prompt.question, `${prompt.answersCount} answers`);
  }

  // A prompt's books, most picked first: the ranking the site shows.
  const prompt = await hc.prompts.getBySlug("whats-your-favorite-cozy-fantasy");
  if (!prompt) return;

  const { items: books } = await hc.prompts.books(prompt.id, { limit: 10 });
  for (const { book, answersCount } of books) {
    console.log(book.title, `picked by ${answersCount}`);
  }
}

export async function promptsForABook(hc: HardcoverClient, bookId: number) {
  // Every prompt this book was given as an answer to, where it was picked most first.
  const { items } = await hc.prompts.forBook(bookId, { limit: 5 });

  for (const { prompt, answersCount } of items) {
    console.log(prompt.question, answersCount);
  }
}

export async function answerAPrompt(hc: HardcoverClient, promptId: number, bookId: number) {
  // Answering with the same book again returns the same answer, so this is safe to repeat.
  // The server writes the journal entry.
  const { answer, answersCount } = await hc.prompts.answer(promptId, bookId, {
    description: "The found family got me.",
  });
  console.log(`${answersCount} readers have picked this book now`);

  await hc.prompts.updateAnswer(answer.id, { description: "Still thinking about it." });
  await hc.prompts.follow(promptId);

  // Changed your mind?
  await hc.prompts.deleteAnswer(answer.id);
  await hc.prompts.unfollow(promptId);
}

export async function askAPrompt(hc: HardcoverClient) {
  const prompt = await hc.prompts.create({
    question: "What's a book that changed how you see your hometown?",
    description: "Fiction or nonfiction, any setting.",
  });

  // Two requests: the API's update takes the whole prompt, so the SDK merges for you.
  await hc.prompts.update(prompt.id, { description: "Fiction or nonfiction. Tell us where!" });

  const { items: mine } = await hc.prompts.mine();
  console.log(mine.map((p) => p.question));

  await hc.prompts.delete(prompt.id);
}
