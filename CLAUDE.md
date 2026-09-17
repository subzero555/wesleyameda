# wesleyameda.com

Personal portfolio. Static multi-page site, deployed to a VPS behind nginx.
Design reference: dennissnellenberg.com (structure and motion language, not a copy).

## Structure

    index.html              home
    work/<slug>.html        one long-form case study per project
    assets/                 images and video
    deploy.md               scp, nginx, certbot

## Hard rules

- Never read anything under `assets/`. Binary media, it will blow the context
  window. `.claudeignore` covers it. Do not work around it.
- Never inline media as base64 data URIs. An earlier version of this site did
  that and reached 4.9 MB in a single unopenable file.
- Each page is self-contained: its own `<style>` block and `<script>` block.
  No build step, no bundler, no framework.
- Only link to a case study page that actually exists. A row with no page yet
  is a `div.row`, not an `a.row`.

## Design tokens

    --paper  #EFEDE8   base
    --ink    #16171A   text and dark sections
    --blue   #3049E8   the only accent, used for links, hover and figures
    --ash    #84837E   secondary text
    --line   rgba(22,23,26,.16)

One typeface: Archivo, variable, width axis 85 to 125. Display text runs at
weight 600, width 96, tracking -0.045em. Do not add a second family.

## Deliberately avoided

These read as generated and are not used anywhere. Do not reintroduce them.

- ALL-CAPS tracked eyebrow labels above headings
- Numbered section markers (01 / 02 / 03) where the content is not a sequence
- A monospace face for small data labels
- Arrows appended to link text
- Meta strings joined with middle dots
- Emoji
- Em-dashes, in any copy
- Fade-and-slide entrances on every element. Reveals are used sparingly, and
  the page load is one orchestrated sequence rather than scattered effects.

## Motion

Lenis for smooth scroll, loaded from cdnjs. Everything else is plain CSS
transitions and IntersectionObserver. `prefers-reduced-motion` must keep
working: it removes the preloader, disables Lenis, and shows all content.

## Content rules

- No mention of formal education, degrees, or being self-taught.
- Bitroot is the software company. Njia is the production and training studio.
- Internal SCDH matters stay off the site: payroll, server IPs, staffing,
  anything about the hub's future.
