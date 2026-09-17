# Deploy

The site runs on the `srv1` VPS as a PM2 process named `portfolio`, serving
`~/portfolio` on `127.0.0.1:3005`. That box has **no nginx and no `/var/www`**,
and UFW allows port 22 only, so nothing is reachable from outside except
through the Cloudflare Tunnel. This is the same pattern KPI, EduLedger and
Hub Lab already use.

## Push an update

From this directory:

    tar -czf - index.html favicon.svg robots.txt sitemap.xml serve.js work assets \
      | ssh wesley@srv1 'tar -xzf - -C ~/portfolio'
    ssh wesley@srv1 'pm2 restart portfolio'

Only the files named above go up. `CLAUDE.md`, `deploy.md` and `.git` stay off
the server, and `serve.js` refuses to serve them even if they get there.

`rsync` is not installed in Git Bash on the dev machine, which is why this is
tar over ssh rather than the rsync one-liner.

## First-time setup, already done

    ssh wesley@srv1 'mkdir -p ~/portfolio'
    # transfer as above
    ssh wesley@srv1 'cd ~/portfolio && PORT=3005 pm2 start serve.js --name portfolio --time && pm2 save'

`pm2 save` plus the enabled `pm2-wesley` systemd unit means it comes back
after a reboot. Ports 3000, 3002 and 4000 on that box are taken by
fee-ledger-web, kpi-web and fee-ledger-api, hence 3005.

## The one step that cannot be scripted

DNS for `wesley.kenyaproductindex.co.ke` is still an **A record pointing at
`64.204.254.53`**, a shared host that returns 404 to everything. Until that
changes the site is only reachable on the server itself.

Pointing the A record at the VPS IP will **not** work: 80 and 443 are closed
inbound on that box. It has to become a tunnel route, added by hand:

1. one.dash.cloudflare.com, Networks, Tunnels, pick the tunnel serving this
   zone, Public Hostname, Add a published application route.
2. Subdomain `wesley`, domain `kenyaproductindex.co.ke`.
3. Service type **HTTP**, URL `http://localhost:3005`. The protocol prefix is
   required; a bare `localhost:3005` is rejected.
4. Delete the existing `wesley` A record first, or the dashboard will refuse
   with "DNS record already exists". Cloudflare creates the CNAME itself.

The tunnel is **dashboard-managed**, so `/etc/cloudflared/config.yml` on the
server is ignored. Editing it does nothing.

Cloudflare terminates TLS, so there is no certbot and no certificate to renew.

## Verify after the route exists

    curl -sI https://wesley.kenyaproductindex.co.ke/ | head -1
    curl -s https://wesley.kenyaproductindex.co.ke/robots.txt

Note that Bot Fight Mode on this zone returns 403 to some automated clients
while real browsers get 200, so a 403 from a script is not proof of a problem.

## serve.js

A dependency-free static server, about a hundred lines. It exists because the
VPS has no nginx. It reproduces the `try_files $uri $uri.html $uri/index.html`
behaviour, so `/work/eduledger` serves `work/eduledger.html` and matches the
extensionless canonical URLs in the pages. Both spellings resolve; the
canonical tag decides which one Google indexes.

It serves only `index.html`, `favicon.svg`, `robots.txt`, `sitemap.xml`,
`work/` and `assets/`. Anything else is a 404, including dot directories, so a
file added to the repo later is private until it is added to that list.
Assets get a 30 day immutable cache, HTML gets `no-cache`.

## Canonical host

Every canonical and `og:url` names
`https://wesley.kenyaproductindex.co.ke`. If the site moves to its own domain,
those strings plus `robots.txt` and `sitemap.xml` all change together, and the
old host should 301 to the new one rather than both serving.
