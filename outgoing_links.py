from flask import Flask, request, jsonify, render_template
import indieweb_utils
import concurrent.futures

app = Flask(__name__)


@app.route("/outgoing_links")
def outgoing_links():
    urls = request.args.get("urls")
    if urls is None:
        return jsonify({"error": "No URLs provided"}), 400

    urls = urls.split(",")

    contexts = []

    if len(urls) > 1:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = [
                executor.submit(indieweb_utils.get_reply_context, [url]) for url in urls
            ]
            for future in concurrent.futures.as_completed(futures):
                contexts.append(future.result())
    else:
        contexts.append(indieweb_utils.get_reply_context(urls[0]))

    return jsonify(contexts)


if __name__ == "__main__":
    app.run(debug=True)
