import { HardcoverClient } from "@hardcover/sdk";

// SECTION START: setup :SECTION
const client = new HardcoverClient({ apiKey: process.env.HARDCOVER_API_KEY });
// SECTION END: setup :SECTION

// SECTION START: fetchBooks :SECTION
const books = await client.query(`
	query { books(limit: 5) { id title } }
`);
// SECTION END: fetchBooks :SECTION

console.log(books);
