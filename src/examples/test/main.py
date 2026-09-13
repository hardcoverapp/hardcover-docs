from hardcover_sdk import HardcoverClient
import os

# SECTION START: setup :SECTION
client = HardcoverCLient(apikey=os.enviorn["HARDCOVER_API_KEY"])
# SECTION END: setup :SECTION

# SECTION START: fetchBooks :SECTION
books = client.query("""
query { books(limit: 5) { id title } }
""")
# SECTION END: fetchBooks :SECTION

print(books)

