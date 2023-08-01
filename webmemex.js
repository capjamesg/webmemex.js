var memex_styles = `
<style>
    * {
        box-sizing: border-box;
        padding: 0;
        margin: 0;
        line-height: 1.5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .open {
        display: block;
    }
    aside {
        display: none;
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
        color: black;
        text-decoration: none;
        margin-bottom: 1rem;
    }

    #outgoing_links img {
        max-width: 200px;
        max-height: 200px;
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
        display: block;
    }

    .card:hover {
        background-color: lightgrey;
    }
</style>`;

function setLoadingState (shadowRoot) {
    var loading = document.createElement('p');
    // make loading., loading.., loading... etc.
    var loadingText = 'Loading';
    var loadingDots = 0;

    loading.id = 'loading';

    var timer = setInterval(function () {
        loading.innerHTML = `<span class="card">${loadingText}</span>`;
        loadingText += '.';
        loadingDots++;
        if (loadingDots > 3) {
            loadingText = 'Loading';
            loadingDots = 0;
        }
    }, 500);

    shadowRoot.querySelector('aside').appendChild(loading);

    return timer;
}

class WebIncomingLinks extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.apiUrl = this.getAttribute('data-api-url');

        if (!this.apiUrl) {
            throw new Error('You must specify an API URL');
        }

        this.shadowRoot.innerHTML = memex_styles;

        this.shadowRoot.innerHTML += `
            <aside id="incoming_links_container">
                <h2>Incoming links</h2>
                <ul id="incoming_links"></ul>
            </aside>
        `;

        // position to left
        this.shadowRoot.querySelector('#incoming_links_container').style.left = '0';
    }

    getIncomingLinks () {
        var apiUrl = this.apiUrl;
        var aside = this.shadowRoot.querySelector('#incoming_links');
        fetch(`${apiUrl}${window.location.href}`)
        .then(function (response) {
            return response.json();
        }).then(function (data) {
            var incomingLinks = data.children;
            for (var i = 0; i < incomingLinks.length; i++) {
                var link = incomingLinks[i];
                var p = document.createElement('p');
                var description = "";
                if (link.content) {
                    description = link.content.text || "";
                    description = description.split(' ').slice(0, 30).join(' ') + '...';
                }
                var title = link.author.name || "Untitled";
                var photo = link.author.photo || "";
                var entry = `
                <li class="card">
                    <a href="${link.url}">
                    ${photo && `
                        <img src="${photo}" alt="${title}" />
                    `}
                        <h3>${title}</h3>
                        <span>${description}</span>
                    </a>
                </li>
                `;
                p.innerHTML = entry;
                aside.appendChild(p);
            }
        });
    }

    toggle() {
        if (!this.links) {
            this.links = this.getIncomingLinks();
        }
        var aside = this.shadowRoot.querySelector('#incoming_links_container');
        if (aside.classList.contains('open')) {
            aside.classList.remove('open');
        } else {
            aside.classList.add('open');
        }
    }
}

class WebOutgoingLinks extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.apiUrl = this.getAttribute('data-api-url');

        if (!this.apiUrl) {
            throw new Error('You must specify an API URL');
        }
        
        this.links = false;

        this.shadowRoot.innerHTML = memex_styles;

        this.shadowRoot.innerHTML += `
            <aside id="outgoing_links_container">
                <div id="close"><a onclick="this.parentNode.parentNode.remove()">Close</a></div>
                <div id="inline" style="margin-bottom: 15px;">Show inline</div>
                <h2>Outgoing links</h2>
                <p>Powered by <a href="https://github.com/capjamesg/webmemex.js">webmemex.js</a></p>
                <ul id="outgoing_links"></ul>
                <div id="second_degree_links_container"></div>
            </aside>
        `;

        // add showInline() to #inline
        this.shadowRoot.querySelector('#inline').addEventListener('click', this.showInline);
    }

    showInline = () => {
        // get outgoing_links in shadow DOM
        var sidebar_links = this.shadowRoot.querySelector('#outgoing_links');
        var link_elements = document.querySelectorAll('a');

        for (var i = 0; i < sidebar_links.children.length; i++) {
            var link_container = sidebar_links.children[i];
            var link = sidebar_links.children[i].querySelector('a');

            var link_position = 0;

            var link_element = null;

            for (var j = 0; j < link_elements.length; j++) {
                var link_element = link_elements[j];
                if (link_element.href == link) {
                    break;
                }
            }

            if (link_element) {
                // get position on page
                var rect = link_element.getBoundingClientRect();
                // move box next to link
                var offset = rect.top + window.scrollY;
                link_position = offset;
            }

            // update sidebar style
            link_container.style.position = 'absolute';
            link_container.style.top = link_position + 'px';
            link_container.style.right = '0';
            link_container.style.width = '300px';
        }

        // sidebar needs to be static and follow user scroll
        // move outgoing links outside of aside
        var aside = this.shadowRoot.querySelector('aside');
        var outgoing_links = this.shadowRoot.querySelector('#outgoing_links');
        aside.parentNode.insertBefore(outgoing_links, aside);
        // delete aside
        aside.remove();
    }

    getOutgoingLinks () {
        var links = document.querySelectorAll('a');
        var outgoingLinks = [];
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            // only http(s) links
            if (link.host !== window.location.host && link.href.match(/^http/)) {
                outgoingLinks.push(link);
            }
        }
        // deduplicate
        outgoingLinks = outgoingLinks.filter(function (link, index, self) {
            // trim trailing slash
            var href = link.href.replace(/\/$/, '');
            return index === self.findIndex(function (l) {
                return l.href.replace(/\/$/, '') === href;
            });
        });

        return outgoingLinks;
    }

    getContexts (outgoingLinks) {
        var aside = this.shadowRoot.querySelector('#outgoing_links');
        
        var comma_delimited_urls = outgoingLinks.map(function (link) {
            return link.href;
        }).join(',');
        
        var second_degree_links_container = this.shadowRoot.querySelector('#second_degree_links_container');
        
        var timer = setLoadingState(this.shadowRoot);

        var loading = this.shadowRoot.querySelector('#loading');
        
        fetch(`${this.apiUrl}?urls=${comma_delimited_urls}`)
        .then(function (response) {
            return response.json();
        }).then(function (contexts) {
            clearInterval(timer);

            loading.remove();

            var second_degree_links = contexts.second_degree_links;
            var contexts = contexts.contexts;

            for (var i = 0; i < contexts.length; i++) {
                var context = contexts[i];
                var link = context.post_url;
                var description = context.description || "";
                var title = context.name || "Untitled";
                var photo = context.photo || "";

                var entry = `
                <li class="card">
                    <a href="${link}">
                    ${photo && `
                        <img src="${photo}" alt="${title}" />
                    `}
                        <h3>${title}</h3>
                        <span>${description}</span>
                    </a>
                </li>
                `;
                aside.innerHTML += entry;
            }

            if (second_degree_links.length == 0) {
                return true;
            }

            second_degree_links_container.innerHTML = `
                <h3>Second degree links</h3>
                <ul id="second_degree_links"></ul>
            `;

            for (var i = 0; i < second_degree_links.length; i++) {
                var link = second_degree_links[i];
                var p = document.createElement('p');
                var entry = `
                <li class="card">
                    <a href="${link.url}">${link.url}</a>
                    <p>(linked ${link.count} time${link.count > 1 ? 's' : ''})</p>
                `;
                p.innerHTML = entry;
                second_degree_links_container.querySelector('#second_degree_links').appendChild(p);
            }
        });

        return true;
    }

    toggle() {
        var outgoingLinks = this.getOutgoingLinks();
        if (!this.links) {
            this.links = this.getContexts(outgoingLinks);
        }
        if (this.shadowRoot.querySelector('aside').classList.contains('open')) {
            this.shadowRoot.querySelector('aside').classList.remove('open');
        } else {
            this.shadowRoot.querySelector('aside').classList.add('open');
        }
    }
}

customElements.define('incoming-links', WebIncomingLinks);
customElements.define('outgoing-links', WebOutgoingLinks);

// if ?memex=true is in the URL, show the incoming and outgoing links
if (document.location.search.match(/memex=true/)) {
    if (document.querySelector('outgoing-links')) {
        document.querySelector('outgoing-links').toggle();
    }
    if (document.querySelector('incoming-links')) {
        document.querySelector('incoming-links').toggle();
    }
}