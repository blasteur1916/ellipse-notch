// Writes the legal pages into public/ (run it after editing their text):
//   node scripts/legal-pages.mjs
// Links are relative, so the pages work under any folder (GitHub Pages: /ellipse-notch/).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const REPO = "https://github.com/blasteur1916/ellipse-notch";
const UPDATED = { fr: "23 novembre 2026", en: "23 November 2026" };

const PAGES = [
  {
    path: "mentions-legales/",
    lang: "fr",
    other: "en/legal-notice/",
    title: "Mentions légales",
    description: "Éditeur, hébergeur et propriété intellectuelle du site et du logiciel Ellipse.",
    body: `
      <h2>Éditeur</h2>
      <p>Le site et le logiciel <strong>Ellipse</strong> sont édités par un particulier, à titre non professionnel et sans but commercial.</p>
      <p>Contact : <a href="${REPO}/issues">ouvrez une issue sur GitHub</a>.</p>

      <h2>Hébergement</h2>
      <p>Site, code source et téléchargements : GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis · <a href="https://github.com">github.com</a> (GitHub Pages et GitHub Releases).</p>

      <h2>Propriété intellectuelle</h2>
      <p>Le code d'Ellipse est un logiciel libre, publié sous <a href="${REPO}/blob/main/LICENSE">licence GPL-3.0</a> : vous pouvez l'utiliser, l'étudier, le modifier et le redistribuer dans les conditions de cette licence. Les textes et illustrations du site appartiennent à l'éditeur, sauf mention contraire.</p>
      <p>Les marques citées appartiennent à leurs propriétaires : Windows, Outlook et Teams (Microsoft), iPhone, AirDrop et Dynamic Island (Apple), Android, Gmail et Quick Share (Google), WhatsApp (Meta), Discord, entre autres. Ellipse n'est affilié à aucune de ces entreprises ni approuvé par elles.</p>

      <h2>Signaler un contenu</h2>
      <p>Pour signaler un contenu illicite ou une erreur sur le site, <a href="${REPO}/issues">ouvrez une issue sur GitHub</a>.</p>

      <h2>Données personnelles</h2>
      <p>Voir la page <a href="../confidentialite/">Confidentialité</a>.</p>`,
  },
  {
    path: "en/legal-notice/",
    lang: "en",
    other: "mentions-legales/",
    title: "Legal notice",
    description: "Publisher, host and intellectual property of the Ellipse website and software.",
    body: `
      <h2>Publisher</h2>
      <p>The <strong>Ellipse</strong> website and software are published by a private individual, on a non-professional and non-commercial basis.</p>
      <p>Contact: <a href="${REPO}/issues">open an issue on GitHub</a>.</p>

      <h2>Hosting</h2>
      <p>Website, source code and downloads: GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, United States · <a href="https://github.com">github.com</a> (GitHub Pages and GitHub Releases).</p>

      <h2>Intellectual property</h2>
      <p>Ellipse's code is free software, released under the <a href="${REPO}/blob/main/LICENSE">GPL-3.0 licence</a>: you may use, study, change and redistribute it under that licence's terms. The website's texts and illustrations belong to the publisher unless stated otherwise.</p>
      <p>The trademarks mentioned belong to their owners: Windows, Outlook and Teams (Microsoft), iPhone, AirDrop and Dynamic Island (Apple), Android, Gmail and Quick Share (Google), WhatsApp (Meta), Discord, among others. Ellipse is neither affiliated with nor endorsed by any of these companies.</p>

      <h2>Report content</h2>
      <p>To report unlawful content or a mistake on the website, <a href="${REPO}/issues">open an issue on GitHub</a>.</p>

      <h2>Personal data</h2>
      <p>See the <a href="../privacy/">Privacy</a> page.</p>`,
  },
  {
    path: "confidentialite/",
    lang: "fr",
    other: "en/privacy/",
    title: "Confidentialité",
    description: "Ce qu'Ellipse fait de vos fichiers et de vos données : tout reste sur votre PC et votre réseau local.",
    body: `
      <p>Ellipse fonctionne sur votre PC. Pas de compte, pas de publicité, pas de télémétrie : aucune statistique d'utilisation n'est envoyée, et Ellipse ne se connecte à aucun serveur sur Internet.</p>

      <h2>Ce qui reste sur votre PC</h2>
      <ul>
        <li><strong>Le Stash</strong> : le chemin, le nom et la taille des fichiers que vous y ajoutez, et leur minuteur, enregistrés dans <code>%APPDATA%\\app.ellipse.notch\\stash.json</code>. Les fichiers eux-mêmes ne sont ni copiés ni déplacés.</li>
        <li><strong>Le dossier Téléchargements</strong> : Ellipse surveille l'arrivée de nouveaux fichiers pour les afficher dans le Notch. Il ne lit pas leur contenu, sauf pour l'aperçu.</li>
        <li><strong>Les aperçus</strong> : générés par Windows (comme dans l'Explorateur), ou à partir des premières lignes d'un fichier texte, et gardés en mémoire.</li>
        <li><strong>La souris</strong> : pour détecter le geste « secouer », Ellipse suit la position de la souris pendant que vous maintenez le bouton gauche. Ces positions ne sont ni enregistrées ni envoyées.</li>
        <li><strong>Les réglages</strong> et la clé d'appairage du téléphone, dans <code>%APPDATA%\\app.ellipse.notch\\</code>.</li>
      </ul>

      <h2>Ce qui passe par votre réseau local</h2>
      <p>Pour échanger des fichiers avec votre téléphone, Ellipse ouvre un petit serveur sur votre réseau local (port 47821). Il ne répond qu'aux appareils qui présentent la clé contenue dans le QR code. Les fichiers vont directement du téléphone au PC et inversement, sans passer par Internet. Ils circulent en HTTP, non chiffré, sur votre réseau : utilisez cette fonction sur un Wi-Fi de confiance, pas sur un réseau public.</p>
      <p>Les fichiers reçus du téléphone sont enregistrés dans <code>Téléchargements\\Ellipse</code>.</p>

      <h2>Ce site</h2>
      <p>Le site n'utilise ni cookie ni outil de mesure d'audience. Votre choix de thème (clair ou sombre) est gardé dans votre navigateur. L'hébergeur, GitHub, voit l'adresse IP des visiteurs, comme pour toute page web (<a href="https://docs.github.com/fr/site-policy/privacy-policies/github-general-privacy-statement">politique de GitHub</a>).</p>

      <h2>Vos droits</h2>
      <p>Ellipse ne collectant aucune donnée vous concernant, il n'y a rien à consulter, rectifier ou effacer chez l'éditeur. Pour effacer les données locales, désinstallez Ellipse et supprimez le dossier <code>%APPDATA%\\app.ellipse.notch</code>. Pour toute question, <a href="${REPO}/issues">ouvrez une issue sur GitHub</a>.</p>`,
  },
  {
    path: "en/privacy/",
    lang: "en",
    other: "confidentialite/",
    title: "Privacy",
    description: "What Ellipse does with your files and data: everything stays on your PC and your local network.",
    body: `
      <p>Ellipse runs on your PC. No account, no advertising, no telemetry: no usage statistics are sent, and Ellipse doesn't connect to any server on the Internet.</p>

      <h2>What stays on your PC</h2>
      <ul>
        <li><strong>The Stash</strong>: the path, name and size of the files you add to it, and their timer, saved in <code>%APPDATA%\\app.ellipse.notch\\stash.json</code>. The files themselves are neither copied nor moved.</li>
        <li><strong>The Downloads folder</strong>: Ellipse watches for new files to show them in the Notch. It doesn't read their content, except for the preview.</li>
        <li><strong>Previews</strong>: made by Windows (as in File Explorer), or from a text file's first lines, and kept in memory.</li>
        <li><strong>The mouse</strong>: to detect the “shake” gesture, Ellipse follows the pointer's position while you hold the left button. These positions are neither saved nor sent.</li>
        <li><strong>Settings</strong> and the phone's pairing key, in <code>%APPDATA%\\app.ellipse.notch\\</code>.</li>
      </ul>

      <h2>What goes over your local network</h2>
      <p>To swap files with your phone, Ellipse opens a small server on your local network (port 47821). It only answers devices that present the key held in the QR code. Files go straight from the phone to the PC and back, without going through the Internet. They travel over HTTP, unencrypted, on your network: use this feature on a Wi-Fi you trust, not on a public network.</p>
      <p>Files received from the phone are saved in <code>Downloads\\Ellipse</code>.</p>

      <h2>This website</h2>
      <p>The website uses no cookies and no analytics. Your theme choice (light or dark) is kept in your browser. The host, GitHub, sees visitors' IP addresses, as for any web page (<a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub's policy</a>).</p>

      <h2>Your rights</h2>
      <p>As Ellipse collects no data about you, there is nothing to access, correct or erase on the publisher's side. To erase the local data, uninstall Ellipse and delete the <code>%APPDATA%\\app.ellipse.notch</code> folder. For any question, <a href="${REPO}/issues">open an issue on GitHub</a>.</p>`,
  },
  {
    path: "conditions-utilisation/",
    lang: "fr",
    other: "en/terms/",
    title: "Conditions d'utilisation",
    description: "Ce qu'implique l'utilisation d'Ellipse, logiciel libre et gratuit sous licence GPL-3.0.",
    body: `
      <p>Ellipse est gratuit et libre. Ces conditions résument ce que cela implique ; en cas de différence, la licence GPL-3.0 prévaut pour le logiciel.</p>

      <h2>1. Le logiciel</h2>
      <p>Ellipse est distribué sous <a href="${REPO}/blob/main/LICENSE">licence publique générale GNU, version 3 (GPL-3.0)</a>. Vous pouvez l'installer sur autant d'ordinateurs que vous voulez, l'utiliser à titre personnel ou professionnel, l'étudier, le modifier et le redistribuer. Une version modifiée redistribuée doit rester sous la même licence, avec son code source.</p>

      <h2>2. Sans garantie</h2>
      <p>Ellipse est fourni gratuitement, « en l'état », sans garantie d'aucune sorte, comme le prévoient les articles 15 et 16 de la GPL-3.0, dans la limite de ce que permet la loi applicable. L'éditeur fait de son mieux pour corriger les problèmes signalés, sans engagement de délai.</p>

      <h2>3. Suppression automatique</h2>
      <p>Quand vous activez un minuteur ou « après glisser » sur un téléchargement, Ellipse envoie ce fichier à la Corbeille de Windows au moment prévu. Les fichiers que vous déposez vous-même dans le Stash ne sont jamais supprimés du disque : seul leur raccourci est retiré. Vérifiez la Corbeille avant de la vider.</p>

      <h2>4. Transferts avec le téléphone</h2>
      <p>Les échanges avec le téléphone passent par votre réseau local, sans chiffrement. Vous restez responsable des fichiers que vous envoyez et du réseau sur lequel vous le faites.</p>

      <h2>5. Contact</h2>
      <p><a href="${REPO}/issues">Ouvrez une issue sur GitHub</a>.</p>`,
  },
  {
    path: "en/terms/",
    lang: "en",
    other: "conditions-utilisation/",
    title: "Terms of use",
    description: "What using Ellipse, free software under the GPL-3.0 licence, involves.",
    body: `
      <p>Ellipse is free, open-source software. These terms sum up what that means; where they differ, the GPL-3.0 licence prevails for the software.</p>

      <h2>1. The software</h2>
      <p>Ellipse is distributed under the <a href="${REPO}/blob/main/LICENSE">GNU General Public License, version 3 (GPL-3.0)</a>. You may install it on as many computers as you like, use it privately or at work, study, change and redistribute it. A changed version you redistribute must keep the same licence, with its source code.</p>

      <h2>2. No warranty</h2>
      <p>Ellipse is provided free of charge, “as is”, without any warranty, as sections 15 and 16 of the GPL-3.0 state, to the extent the applicable law allows. The publisher does their best to fix reported problems, with no commitment on timing.</p>

      <h2>3. Automatic deletion</h2>
      <p>When you turn on a timer or “after drag” for a download, Ellipse sends that file to the Windows Recycle Bin at the set time. Files you drop into the Stash yourself are never deleted from disk: only their shortcut is removed. Check the Recycle Bin before emptying it.</p>

      <h2>4. Transfers with the phone</h2>
      <p>Exchanges with the phone go over your local network, unencrypted. You remain responsible for the files you send and for the network you use.</p>

      <h2>5. Contact</h2>
      <p><a href="${REPO}/issues">Open an issue on GitHub</a>.</p>`,
  },
  {
    path: "code-signing/",
    lang: "en",
    title: "Release and signing policy",
    description: "How Ellipse's Windows installer is built and published, and how to check what you install.",
    body: `
      <p>Ellipse's Windows installer is not signed with a code-signing certificate yet, so Windows SmartScreen may warn about it the first time. Here is how each release is built, and how you can check what you install.</p>

      <h2>How releases are built</h2>
      <p>The Windows installer of each release (<code>Ellipse-Setup-x64.exe</code>) is published on <a href="${REPO}/releases">GitHub Releases</a>. Every installer is built by GitHub Actions from the tagged commit of the public repository, <a href="${REPO}">blasteur1916/ellipse-notch</a>. Nothing built elsewhere is published.</p>

      <h2>How to check what you install</h2>
      <p>Each release carries <code>Ellipse-Setup-x64.exe.sha256</code>, the SHA-256 of its installer. In PowerShell, <code>Get-FileHash Ellipse-Setup-x64.exe</code> must print the same value.</p>

      <h2>Team</h2>
      <p>Committer, reviewer and approver: <a href="https://github.com/blasteur1916">blasteur1916</a>. Changes from other people come as pull requests, reviewed before they are merged.</p>

      <h2>Privacy</h2>
      <p>Ellipse has no account, no advertising and no telemetry, and connects to no Internet server. The full policy is on the <a href="../en/privacy/">privacy page</a>.</p>`,
  },
];

const WORDS = {
  fr: { updated: "Mise à jour", guides: "Guides", other: "English", legal: ["mentions-legales/", "Mentions légales"], terms: ["conditions-utilisation/", "Conditions d'utilisation"], privacy: ["confidentialite/", "Confidentialité"], home: "" },
  en: { updated: "Updated", guides: "Guides", other: "Français", legal: ["en/legal-notice/", "Legal notice"], terms: ["en/terms/", "Terms of use"], privacy: ["en/privacy/", "Privacy"], home: "en/" },
};

for (const page of PAGES) {
  const up = "../".repeat(page.path.split("/").filter(Boolean).length);
  const w = WORDS[page.lang];
  const otherLang = page.lang === "fr" ? "en" : "fr";
  const html = `<!doctype html>
<html lang="${page.lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${page.title} · Ellipse</title>
    <meta name="description" content="${page.description.replace(/"/g, "&quot;")}" />
    <link rel="icon" href="${up}favicon-48.png" type="image/png" />
    <link rel="stylesheet" href="${up}legal.css" />
  </head>
  <body>
    <header class="top">
      <a class="brand" href="${up}${w.home}"><img src="${up}favicon-48.png" width="26" height="26" alt="" /><span>Ellipse</span></a>
      <nav>
        <a href="${up}${page.lang === "fr" ? "" : "en/"}guides/">${w.guides}</a>
        ${page.other ? `<a href="${up}${page.other}" hreflang="${otherLang}" lang="${otherLang}">${w.other}</a>` : ""}
      </nav>
    </header>
    <main>
      <h1>${page.title}</h1>
      <p class="updated">${w.updated} : ${UPDATED[page.lang]}</p>
${page.body}
    </main>
    <footer>
      <nav>
        <a href="${up}${w.legal[0]}">${w.legal[1]}</a>
        <a href="${up}${w.terms[0]}">${w.terms[1]}</a>
        <a href="${up}${w.privacy[0]}">${w.privacy[1]}</a>
        <a href="${up}code-signing/">Code signing</a>
      </nav>
      <span>© 2026 Ellipse · <a href="${REPO}">GitHub</a></span>
    </footer>
  </body>
</html>
`.replace(/ : (\d+ \w+ 2026)/, page.lang === "en" ? ": $1" : " : $1");
  mkdirSync(join(root, page.path), { recursive: true });
  writeFileSync(join(root, page.path, "index.html"), html);
}
console.log(`${PAGES.length} legal pages written`);
