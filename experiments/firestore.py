import concurrent.futures
import json
from dataclasses import asdict

import firebase_admin
import indieweb_utils
from firebase_admin import credentials, firestore

# suppress InsecureRequestWarning
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Use a service account
cred = credentials.Certificate("keys.json")

app = firebase_admin.initialize_app(cred)

db = firestore.client()

# stream open ids.txt in batches
from itertools import islice
with open("cc-main-2022-23-sep-nov-jan-domain-vertices.txt") as f:
    # read first 10,000 lines
    ids = list(islice(f, 5000000))

    ids = [id.split("\t") for id in ids]
    ids = {int(k[0].strip()): k[1].strip() for k in ids}

    # reverse url order from tld.domain to domain.tld
    ids = {k: "https://" + ".".join(v.split(".")[::-1]) for k, v in ids.items()}

print("ids ingested")

with open("cc-main-2022-23-sep-nov-jan-domain-edges.txt") as f:
    # read first 10,000 lines
    id_data = list(islice(f, 10))
    
    # id data is from_id to_id
    id_data = [id.split("\t") for id in id_data]
    urls = [ids[int(k[0].strip())] for k in id_data]

urls_with_previews = {}

# dedupe urls
urls = list(set(urls))

with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
    futures = [executor.submit(indieweb_utils.get_reply_context, url) for url in urls]

    for url, future in zip(urls, futures):
        try:
            print(url)
            result = future.result()
            result = asdict(result)

            urls_with_previews[url] = result
        except Exception as e:
            continue

for record in id_data:
    from_id, to_id = record

    from_url = ids.get(int(from_id))
    to_url = ids.get(int(to_id))

    if from_url is None or to_url is None:
        print(from_id, to_id)
        print("from_url or to_url is None")
        continue

    # write
    doc_ref = db.collection(u"urls").document(from_url)
    doc_ref.set(
        {
            "source": from_url,
            "metadata": json.dumps(urls_with_previews[to_url]),
        }
    )
