import concurrent.futures
import json
import os
from collections import Counter
from dataclasses import asdict
from itertools import groupby
from urllib.parse import urlparse
import sqlite3

import indieweb_utils
import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, request

conn = sqlite3.connect("/mnt/HC_Volume_35142740/links.db", check_same_thread=False)

app = Flask(__name__)

def get_2nd_degree_outgoing_links(html):
    soup = BeautifulSoup(html, "html.parser")

    outgoing_links = []

    for link in soup.find_all("a"):
        if link.get("href").startswith("http"):
            outgoing_links.append(link.get("href"))

    return outgoing_links


@app.route("/")
def index():
    return jsonify({})

@app.route("/outgoing_links")
def outgoing_links():
    urls = request.args.get("urls")
    if urls is None:
        return jsonify({"error": "No URLs provided"}), 400

    urls = urls.split(",")

    contexts = []

    # limit to 25 threads
    urls = urls[:25]

    second_degree_links = []

    if len(urls) > 1:
        with concurrent.futures.ThreadPoolExecutor(max_workers=25) as executor:
            futures = [
                executor.submit(indieweb_utils.get_reply_context, url) for url in urls
            ]
            for url, future in zip(urls, futures):
                try:
                    result = future.result()
                    second_degree_links.extend(
                        get_2nd_degree_outgoing_links(result.post_html)
                    )
                    # convert to dict
                    result = asdict(result)
                    result["post_url"] = url

                    contexts.append(result)
                except Exception as e:
                    raise e
                    pass
    else:
        try:
            result = indieweb_utils.get_reply_context(urls[0])
            second_degree_links.extend(get_2nd_degree_outgoing_links(result.post_html))
            result = asdict(result)
            result["post_url"] = urls[0]
            contexts.append(result)
        except Exception as e:
            raise e
            pass

    # do a count of outgoing links
    second_degree_links = Counter(second_degree_links)

    # order by most common
    second_degree_links = second_degree_links.most_common()

    # convert to dict
    second_degree_links = [
        {"url": url, "count": count} for url, count in second_degree_links
    ]

    # allow CORS
    # response = jsonify(
    #     {"contexts": contexts, "second_degree_links": second_degree_links}
    # )
    # response.headers.add("Access-Control-Allow-Origin", "*")
    # return response
    return jsonify(
        {"contexts": contexts, "second_degree_links": second_degree_links}
    )


if __name__ == "__main__":
    app.run(debug=True)
