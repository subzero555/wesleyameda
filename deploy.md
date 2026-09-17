# Deploy

    rsync -avz -e "ssh -p 1980" --delete \
      index.html favicon.svg robots.txt sitemap.xml work/ assets/ \
      user@SERVER:/var/www/wesley/

nginx:

    server {
        listen 80;
        server_name wesley.kenyaproductindex.co.ke;
        root /var/www/wesley;
        index index.html;

        # /work/eduledger resolves to /work/eduledger.html
        location / { try_files $uri $uri.html $uri/ =404; }

        location /assets/ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
        location = /index.html { add_header Cache-Control "no-cache"; }

        gzip on;
        gzip_types text/html text/css application/javascript image/svg+xml;
    }

    sudo nginx -t && sudo systemctl reload nginx
    sudo certbot --nginx -d wesley.kenyaproductindex.co.ke

## robots.txt

`robots.txt` and `sitemap.xml` are now in the repo and go up with the rsync
above. The server may still have an older `/robots.txt` sitting outside
`/var/www/wesley/`, or one served by a catch-all. Check what actually answers:

    curl -s https://wesley.kenyaproductindex.co.ke/robots.txt

If that returns a disallow rather than the repo copy, nginx is serving it from
somewhere else and Google cannot index the portfolio.

## Canonical host

Every canonical and `og:url` in the pages names
`https://wesley.kenyaproductindex.co.ke`. If the site moves to its own domain,
those strings, `robots.txt` and `sitemap.xml` all have to change together, and
the old host should 301 to the new one rather than serve both.

Pages are linked as `.html` but the canonical is extensionless, which matches
the `try_files` rule above. Both URLs resolve, and the canonical tag is what
decides which one gets indexed.
