<p align="center"><img src="src-tauri/icons/128x128.png" width="96" alt="" /></p>

<h1 align="center">Ellipse</h1>

<p align="center">Le Notch qui manquait à Windows : vos fichiers, vos téléchargements et votre téléphone en haut de l'écran.</p>

<p align="center"><b>Bêta publique</b> : tout fonctionne, mais des bugs restent possibles. <a href="https://github.com/blasteur1916/ellipse-notch/issues">Signaler un problème</a>.</p>

<p align="center">
  <a href="https://github.com/blasteur1916/ellipse-notch/releases/latest/download/Ellipse-Setup-x64.exe"><b>Télécharger pour Windows</b></a> ·
  <a href="https://blasteur1916.github.io/ellipse-notch/">Site</a> ·
  <a href="https://blasteur1916.github.io/ellipse-notch/guides/">Guides</a>
</p>

## Fonctionnalités

- **Le Notch** : une pilule collée en haut de l'écran, qui s'ouvre au survol et laisse passer les clics autour d'elle.
- **Le Stash** : vos fichiers du moment et vos derniers téléchargements, avec leur aperçu, à glisser dans n'importe quelle appli.
- **Secouer pour ranger** : secouez la souris pendant un glisser, une orbe apparaît sous le curseur ; lâchez, le fichier rejoint le Stash.
- **Téléchargements éphémères** : minuteur de 5 à 60 minutes ou « après glisser », vers la Corbeille.
- **Téléphone ↔ PC** : appairage par QR code, page web dans le navigateur du téléphone, transferts directs sur le Wi-Fi, sans appli ni compte.

## Développement

```bash
npm install
npm run tauri dev       # l'app (Tauri v2 + React)
cd site && npm install && npm run dev   # le site
```

- `src/`, `src-tauri/` : l'app Windows (React, Rust).
- `site/` : le site (React, prérendu statique FR/EN, guides), publié sur GitHub Pages.

Une release se publie en poussant un tag `vX.Y.Z` égal à la version de `src-tauri/tauri.conf.json` : GitHub Actions compile l'installateur et le joint à la release.

## Licence

[GPL-3.0](LICENSE).
