from hardcover-sdk import HardcoverClientt
import os

# SECTION START: setup :SECTION
client = HardcoverClient(apiKey=os.environ["HARDCOVER_API_KEY"]);
# SECTION END: setup :SECTION

# SECTION START: fetchBooks :SECTION
books = client.query(`
	query { books(limit: 5) { id title } }
`);
# SECTION END: fetchBooks :SECTION

print(books);
