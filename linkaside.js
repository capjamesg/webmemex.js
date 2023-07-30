class LinkAside extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                    padding: 0;
                    margin: 0;
                    line-height: 1.5;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                aside {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 300px;
                    background: #f7f7f7;
                    border-left: 1px solid #eee;
                    padding: 1rem;
                    overflow-y: scroll;
                }

                .card a {
                    display: block;
                    text-decoration: none;
                    color: #000;
                    margin-bottom: 1rem;
                }

                aside a img {
                    width: 100%;
                    height: auto;
                    margin-bottom: 0.5rem;
                    max-width: 100px;
                }

                aside a span {
                    display: block;
                    font-size: 0.8rem;
                    margin-bottom: 0.5rem;
                }

                #outgoing_links {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                h3 {
                    font-size: 1rem;
                }

                .card {
                    background: #fff;
                    margin-top: 1rem;
                    margin-bottom: 1rem;
                    border: 1px solid #eee;
                    padding: 1rem;
                }
            </style>
            <aside>
                <h2>Outgoing links</h2>
                <p>Powered by <a href="https://github.com/capjamesg/linkaside.js">linkaside.js</a></p>
                <ul id="outgoing_links"></ul>
            </aside>
        `;

    }

    connectedCallback() {
        console.log('connected');
        this.render();
    }

    getOutgoingLinks () {
        var links = document.querySelectorAll('a');
        var outgoingLinks = [];
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            if (link.host !== window.location.host) {
                outgoingLinks.push(link);
            }
        }
        return outgoingLinks;
    }

    getContexts (outgoingLinks) {
        var aside = this.shadowRoot.querySelector('#outgoing_links');
        
        var comma_delimited_urls = outgoingLinks.map(function (link) {
            return link.href;
        }).join(',');

        
        fetch(`https://jamesg.blog/lp/outgoing_links?urls=${comma_delimited_urls}`)
        .then(function (response) {
            console.log(response);
            return response.json();
        }).then(function (contexts) {
            console.log(contexts)
            for (var i = 0; i < contexts.length; i++) {
                var context = contexts[i];
                var link = outgoingLinks[i];
                var p = document.createElement('p');
                var description = context.description || null;
                var title = context.name || null;
                var photo = context.photo || null;
                var entry = `
                <li class="card">
                    <a href="${link.href}">
                        <img src="${photo}" alt="${title}" />
                        <h3>${title}</h3>
                        <span>${description}</span>
                    </a>
                </li>
                `;
                p.innerHTML = entry;
                aside.appendChild(p);
            }
        })
    }

    render() {
        var outgoingLinks = this.getOutgoingLinks();
        this.getContexts(outgoingLinks);
    }
}

customElements.define('link-aside', LinkAside);