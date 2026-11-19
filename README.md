# Divergence RP loading screen

The page Garry's Mod shows while players join. Eight screens rotate (welcome,
the civilian, police and criminal paths, store robbery, bank heist, base raids,
PD raid), with a rotating tip and the join progress at the bottom.

## Going live

1. Repo Settings > Pages: deploy from the `main` branch, root folder. (Pages
   needs the repo to be public on a free GitHub plan.)
2. In the server's `server.cfg`:

   ```
   sv_loadingurl "https://gery770.github.io/DarkRPServerLoadingScreen/"
   ```

## Editing

- `index.html`: the screens. Each `<div class="slide">` is one; they rotate in
  order every 11 seconds.
- `main.js`: the tips (`TIPS`), timings, and the functions GMod calls with the
  join progress.
- `style.css`: the look.

GMod's default branch renders this in an old browser (Awesomium), so keep to
plain ES5 JavaScript and older CSS: no CSS variables, grid, flexbox, `calc` or
`vh`/`vw`. Sizes are in `em` and scale with the window.

The numbers on the path screens (points per job and rank) are copies of the
server's: change them here when they change there
(`darkrp_customthings/jobs.lua`, `progression/sh_ranks.lua`,
`policeranks/sh_policeranks.lua`).

## Previewing

Serve the folder (`python -m http.server`) and open it in a browser:

- `?demo` fakes a join, so the progress bar and server name move
- `?slide=3` holds one screen (1 to 8)
