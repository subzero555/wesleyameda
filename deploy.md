# Deploy

The site runs on the `srv1` VPS as a PM2 process named `portfolio`, serving
`~/portfolio` on `127.0.0.1:3005`. That box has **no nginx and no `/var/www`**,
and UFW allows port 22 only, so nothing is reachable from outside except
through the Cloudflare Tunnel. Same pattern as KPI, EduLedger and Hub Lab.

## Push an update

Commit first, then from this directory:

    git archive --format=tar HEAD | gzip \
      | ssh wesley@178.162.240.211 'tar -xzf - -C ~/portfolio && pm2 restart portfolio'

`git archive` ships exactly the tracked files. The 241 MB of original
photographs listed in `.gitignore` never touch the server, and using the git
tree rather than a hand written file list means a new page cannot be forgotten
at deploy time, which is how the sitemap drifted once already.

`CLAUDE.md` and `deploy.md` do land on the server because they are tracked, but
`serve.js` refuses to serve them. `rsync` is not installed in Git Bash on the
dev machine, which is why this is tar over ssh.

## First-time setup, already done

    ssh wesley@178.162.240.211 'mkdir -p ~/portfolio'
    # transfer as above
    ssh wesley@178.162.240.211 'cd ~/portfolio && PORT=3005 pm2 start serve.js --name portfolio --time && pm2 save'

`pm2 save` plus the enabled `pm2-wesley` systemd unit means it survives a
reboot. Ports 3000, 3002 and 4000 on that box belong to fee-ledger-web,
kpi-web and fee-ledger-api, hence 3005.

## The one step that cannot be scripted

DNS for `wesley.kenyaproductindex.co.ke` is still an **A record pointing at
`64.204.254.53`**, a shared host that returns 404 to everything.

**Do not repoint that A record at the VPS IP.** Ports 80 and 443 are closed
inbound on that box; the tunnel dials outward. Proxied, Cloudflare cannot reach
the origin and returns 521 or 522. DNS-only, the browser hits a closed port.
Either way the site stays down.

It has to become a tunnel route instead:

1. one.dash.cloudflare.com, Networks, Tunnels, pick the tunnel serving this
   zone, Public Hostname, Add a published application route.
2. Subdomain `wesley`, domain `kenyaproductindex.co.ke`.
3. Service type **HTTP**, URL `http://localhost:3005`. The protocol prefix is
   required; a bare `localhost:3005` is rejected.
4. Delete the existing `wesley` A record first, or the dashboard refuses with
   "DNS record already exists". Cloudflare creates the CNAME itself.

The tunnel is **dashboard-managed**, so `/etc/cloudflared/config.yml` on the
server is ignored. Editing it does nothing.

Cloudflare terminates TLS, so there is no certbot and no certificate to renew.

## Verify once the route exists

    curl -sI https://wesley.kenyaproductindex.co.ke/ | head -1
    curl -s https://wesley.kenyaproductindex.co.ke/robots.txt

Bot Fight Mode on this zone returns 403 to some automated clients while real
browsers get 200, so a 403 from a script is not proof of a problem.

## serve.js

A dependency-free static server, roughly a hundred lines, because the VPS has
no nginx. It reproduces `try_files $uri $uri.html $uri/index.html`, so
`/work/eduledger` serves `work/eduledger.html` and matches the extensionless
canonical URLs. Both spellings resolve; the canonical tag decides which one
gets indexed.

It serves only an allowlist: `index.html`, `hobbies.html`, `design.html`,
`marketing.html`, `hub.html`, `access.html`, `gallery.html`, `favicon.svg`,
`robots.txt`, `sitemap.xml`, `work/` and `assets/`. Everything else is a 404,
dot directories included, so a file added to the repo later stays private until
it is named there. **A new top-level page must be added to that list**, or it
will 404 in production while working locally.

Assets get a 30 day immutable cache, HTML gets `no-cache`.

## Canonical host

Every canonical and `og:url` names
`https://wesley.kenyaproductindex.co.ke`. If the site moves to its own domain,
those strings plus `robots.txt` and `sitemap.xml` change together, and the old
host should 301 to the new one rather than both serving.
