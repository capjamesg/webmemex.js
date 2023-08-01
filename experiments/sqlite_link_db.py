import sqlite3

from itertools import islice

# create db with two tables: ids and edges
conn = sqlite3.connect("links.db")

c = conn.cursor()

# create ids table
# c.execute(
#     """
#     CREATE TABLE ids (
#         id INTEGER PRIMARY KEY,
#         url TEXT NOT NULL
#     )
#     """
# )

# # create edges table
# c.execute(
#     """
#     CREATE TABLE edges (
#         from_id INTEGER NOT NULL,
#         to_id INTEGER NOT NULL,
#         FOREIGN KEY (from_id) REFERENCES ids (id),
#         FOREIGN KEY (to_id) REFERENCES ids (id)
#     )
#     """
# )

# stream open ids.txt in batches
# with open("cc-main-2022-23-sep-nov-jan-domain-vertices.txt") as f:
#     while True:
#         next_10k_lines = list(islice(f, 10000))

#         if not next_10k_lines:
#             break

#         next_10k_lines = [id.split("\t")[:2] for id in next_10k_lines]

#         # insert into ids table
#         c.executemany(
#             """
#             INSERT INTO ids VALUES (?, ?)
#             """,
#             next_10k_lines,
#         )
#         print("inserted 10k lines")

#         conn.commit()

# stream open edges.txt in batches
with open("cc-main-2022-23-sep-nov-jan-domain-edges.txt") as f:
    while True:
        next_10k_lines = list(islice(f, 10000))

        if not next_10k_lines:
            break

        next_10k_lines = [id.split("\t")[:2] for id in next_10k_lines]

        # insert into edges table
        c.executemany(
            """
            INSERT INTO edges VALUES (?, ?)
            """,
            next_10k_lines,
        )
        print("inserted 10k lines")

        conn.commit()

print("ids ingested")