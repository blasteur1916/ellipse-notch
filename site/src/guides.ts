/**
 * The guides: pages on what Ellipse touches (files, downloads, phone ↔ PC).
 * Each guide exists in French and in English; scripts/prerender.mjs turns
 * them into static pages at /guides/<slug>/ and /en/guides/<slug>/.
 *
 * Text conventions: [label](url) makes a link, **text** bold, `code` code.
 */

export interface GuideBlock {
  h2: string;
  p?: string[];
  list?: string[];
  steps?: string[];
  /** Paragraphs after the list or the steps. */
  note?: string[];
  code?: string;
}

export interface GuideText {
  /** Its address in this language, when it differs from the guide's slug. */
  slug?: string;
  /** The page's title (also the <title>). */
  title: string;
  /** The meta description: one or two sentences. */
  description: string;
  intro: string;
  blocks: GuideBlock[];
}

/** The guides' families, in the index's order (see GUIDE_CATEGORIES). */
export type GuideCategory = "notch" | "files" | "phone" | "usage";

export interface Guide {
  slug: string;
  category: GuideCategory;
  /** When its facts were last checked (YYYY-MM-DD). */
  updated: string;
  fr: GuideText;
  en: GuideText;
  related: string[];
}

const UPDATED = "2026-11-23";

export const GUIDES: Guide[] = [
  {
    slug: "notch-for-windows",
    category: "notch",
    updated: UPDATED,
    related: ["file-shelf-windows", "auto-clean-downloads-windows", "install-ellipse"],
    fr: {
      slug: "notch-windows",
      title: "Un Notch pour Windows : la Dynamic Island version PC",
      description: "Comment ajouter un Notch façon Dynamic Island en haut de l'écran de Windows 10 ou 11, et à quoi il sert vraiment au quotidien.",
      intro:
        "Sur iPhone, la Dynamic Island transforme l'encoche en zone utile. Sur Windows, il n'y a pas d'encoche, mais le haut de l'écran reste un espace libre que la souris atteint sans viser : il suffit de la pousser vers le haut. Un Notch logiciel s'y installe.",
      blocks: [
        {
          h2: "Ce que fait un Notch sur PC",
          list: [
            "**Au repos**, une petite pilule noire collée au bord de l'écran, qui n'affiche que l'heure.",
            "**Au survol**, elle s'ouvre sur un panneau : fichiers, téléchargements, téléphone.",
            "**Quand quelque chose arrive** (un téléchargement, une photo du téléphone), elle s'agrandit quelques secondes avec un aperçu, puis se range.",
          ],
        },
        {
          h2: "Le Notch d'Ellipse",
          p: [
            "[Ellipse](../../) est un Notch gratuit et open source pour Windows 10 et 11, centré sur les fichiers. Son panneau, le **Stash**, garde vos fichiers du moment et vos derniers téléchargements avec leur vrai aperçu ; vous les glissez ensuite dans n'importe quelle appli.",
            "Fermé, il ne fait que 132 × 30 pixels et laisse passer les clics autour de lui : il ne gêne ni les onglets du navigateur, ni les barres de titre.",
          ],
        },
        {
          h2: "Et pour la musique ou l'agenda ?",
          p: [
            "Ellipse reste volontairement simple et se concentre sur les fichiers. Pour une île complète avec musique et paroles, agenda, minuteur et notifications, [Quiera](https://quiera.eu) fait ce travail sur Windows 11.",
          ],
        },
      ],
    },
    en: {
      title: "A Notch for Windows: the Dynamic Island, PC edition",
      description: "How to add a Dynamic Island-style Notch at the top of the Windows 10 or 11 screen, and what it's really useful for every day.",
      intro:
        "On the iPhone, the Dynamic Island turns the notch into a useful area. Windows has no notch, but the top of the screen is free space the pointer reaches without aiming: you just push it up. A software Notch lives there.",
      blocks: [
        {
          h2: "What a Notch does on a PC",
          list: [
            "**At rest**, a small black pill stuck to the edge of the screen, showing only the time.",
            "**On hover**, it opens on a panel: files, downloads, phone.",
            "**When something arrives** (a download, a photo from the phone), it grows for a few seconds with a preview, then tucks away.",
          ],
        },
        {
          h2: "Ellipse's Notch",
          p: [
            "[Ellipse](../../) is a free, open-source Notch for Windows 10 and 11, built around files. Its panel, the **Stash**, keeps the files you're working with and your latest downloads with their real preview; you then drag them into any app.",
            "Closed, it's only 132 × 30 pixels and lets clicks through around it: it doesn't get in the way of browser tabs or title bars.",
          ],
        },
        {
          h2: "What about music or a calendar?",
          p: [
            "Ellipse stays simple on purpose and sticks to files. For a full island with music and lyrics, calendar, timer and notifications, [Quiera](https://quiera.eu/en/) does that job on Windows 11.",
          ],
        },
      ],
    },
  },
  {
    slug: "auto-clean-downloads-windows",
    category: "files",
    updated: UPDATED,
    related: ["file-shelf-windows", "drag-and-drop-windows", "notch-for-windows"],
    fr: {
      slug: "vider-telechargements-automatiquement-windows",
      title: "Vider automatiquement le dossier Téléchargements sur Windows",
      description: "Deux façons de garder Téléchargements propre sur Windows 10 et 11 : l'Assistant de stockage intégré, et un minuteur par fichier avec Ellipse.",
      intro:
        "Le dossier Téléchargements se remplit de fichiers qu'on n'ouvre qu'une fois : une facture, un PDF, une image envoyée par mail. Windows sait le nettoyer tout seul, mais seulement au bout de plusieurs jours. Pour les fichiers éphémères, un minuteur par fichier va plus vite.",
      blocks: [
        {
          h2: "Avec l'Assistant de stockage de Windows",
          steps: [
            "Ouvrez **Paramètres › Système › Stockage**.",
            "Activez **Assistant de stockage**, puis ouvrez ses réglages.",
            "À « Supprimer les fichiers de mon dossier Téléchargements s'ils n'ont pas été ouverts depuis plus de », choisissez 1, 14, 30 ou 60 jours.",
          ],
          note: ["C'est simple, mais le délai minimum est d'un jour, et il s'applique à tout le dossier sans distinction."],
        },
        {
          h2: "Avec un minuteur par fichier (Ellipse)",
          steps: [
            "Installez [Ellipse](../../) : chaque nouveau téléchargement s'affiche dans le Notch, en haut de l'écran.",
            "Survolez la carte du fichier et touchez le bouton minuteur : il part à la Corbeille après 5, 10, 30 ou 60 minutes.",
            "Touchez-le une deuxième fois pour « après glisser » : le fichier disparaît dès que vous l'avez déposé ailleurs (un mail, une conversation).",
          ],
          note: ["Dans les réglages, vous pouvez aussi lancer le minuteur sur chaque nouveau téléchargement."],
        },
        {
          h2: "Rien n'est perdu",
          p: [
            "Dans les deux cas, les fichiers passent par la **Corbeille** : un fichier supprimé trop tôt se restaure d'un clic droit, « Restaurer ».",
          ],
        },
      ],
    },
    en: {
      title: "Clear the Downloads folder automatically on Windows",
      description: "Two ways to keep Downloads tidy on Windows 10 and 11: the built-in Storage Sense, and a per-file timer with Ellipse.",
      intro:
        "The Downloads folder fills up with files you open once: an invoice, a PDF, an image sent by email. Windows can clean it by itself, but only after several days. For short-lived files, a per-file timer is quicker.",
      blocks: [
        {
          h2: "With Windows' Storage Sense",
          steps: [
            "Open **Settings › System › Storage**.",
            "Turn on **Storage Sense**, then open its settings.",
            "Under “Delete files in my Downloads folder if they haven't been opened for more than”, pick 1, 14, 30 or 60 days.",
          ],
          note: ["It's simple, but the shortest delay is one day, and it applies to the whole folder alike."],
        },
        {
          h2: "With a per-file timer (Ellipse)",
          steps: [
            "Install [Ellipse](../../): every new download shows up in the Notch, at the top of the screen.",
            "Hover the file's card and press the timer button: it goes to the Recycle Bin after 5, 10, 30 or 60 minutes.",
            "Press it again for “after drag”: the file goes away as soon as you've dropped it elsewhere (an email, a chat).",
          ],
          note: ["In the settings, you can also start the timer on every new download."],
        },
        {
          h2: "Nothing is lost",
          p: ["Either way, files go through the **Recycle Bin**: a file deleted too soon comes back with a right-click, “Restore”."],
        },
      ],
    },
  },
  {
    slug: "file-shelf-windows",
    category: "files",
    updated: UPDATED,
    related: ["drag-and-drop-windows", "auto-clean-downloads-windows", "notch-for-windows"],
    fr: {
      slug: "etagere-fichiers-windows",
      title: "Une étagère à fichiers pour Windows, comme Dropover ou Yoink sur Mac",
      description: "Garder des fichiers de côté le temps de les glisser ailleurs : l'équivalent Windows des étagères Dropover et Yoink, avec le Stash d'Ellipse.",
      intro:
        "Sur Mac, des applis comme Dropover ou Yoink offrent une « étagère » : on y pose des fichiers pris dans plusieurs dossiers, puis on les glisse tous ensemble dans une appli. Windows n'a rien d'équivalent de base ; voici comment obtenir la même chose.",
      blocks: [
        {
          h2: "À quoi sert une étagère",
          list: [
            "Rassembler des fichiers de plusieurs dossiers avant de les joindre à un mail.",
            "Garder sous la main une image ou un PDF pendant qu'on change de fenêtre.",
            "Éviter les allers-retours dans l'Explorateur pendant un glisser-déposer.",
          ],
        },
        {
          h2: "Le Stash d'Ellipse",
          steps: [
            "Glissez un fichier jusqu'en haut de l'écran : le Notch s'ouvre et l'accueille.",
            "Ou, pendant le glisser, **secouez la souris** : une orbe apparaît sous le curseur. Lâchez n'importe où, le fichier rejoint le Stash.",
            "Plus tard, survolez le Notch et glissez la carte du fichier vers l'appli de votre choix.",
          ],
          note: [
            "Le fichier n'est ni copié ni déplacé : le Stash garde seulement son chemin. Il affiche le même aperçu que l'Explorateur, et une recherche par nom retrouve un fichier en un instant.",
          ],
        },
      ],
    },
    en: {
      title: "A file shelf for Windows, like Dropover or Yoink on Mac",
      description: "Keep files aside while you drag them elsewhere: the Windows counterpart of the Dropover and Yoink shelves, with Ellipse's Stash.",
      intro:
        "On Mac, apps like Dropover or Yoink offer a “shelf”: you put files from several folders on it, then drag them all into an app at once. Windows has nothing like it out of the box; here's how to get the same thing.",
      blocks: [
        {
          h2: "What a shelf is for",
          list: [
            "Gathering files from several folders before attaching them to an email.",
            "Keeping an image or a PDF at hand while you switch windows.",
            "Avoiding back-and-forth in File Explorer during a drag and drop.",
          ],
        },
        {
          h2: "Ellipse's Stash",
          steps: [
            "Drag a file to the top of the screen: the Notch opens and takes it in.",
            "Or, while dragging, **shake the mouse**: an orb appears under the pointer. Let go anywhere, and the file joins the Stash.",
            "Later, hover the Notch and drag the file's card into any app.",
          ],
          note: [
            "The file is neither copied nor moved: the Stash only keeps its path. It shows the same preview as File Explorer, and searching by name finds a file in an instant.",
          ],
        },
      ],
    },
  },
  {
    slug: "drag-and-drop-windows",
    category: "files",
    updated: UPDATED,
    related: ["file-shelf-windows", "notch-for-windows", "auto-clean-downloads-windows"],
    fr: {
      slug: "glisser-deposer-windows-astuces",
      title: "Glisser-déposer sur Windows : 5 astuces pour aller plus vite",
      description: "Copier, déplacer, créer un raccourci, atteindre une fenêtre cachée : les gestes de glisser-déposer que Windows ne montre pas.",
      intro: "Le glisser-déposer cache plusieurs raccourcis bien pratiques. Les voici, dans Windows 10 et 11.",
      blocks: [
        {
          h2: "Choisir ce que fait le dépôt",
          list: [
            "**Ctrl** pendant le glisser : le fichier est **copié**.",
            "**Maj** : il est **déplacé**, même vers un autre disque.",
            "**Alt** : Windows crée un **raccourci** vers lui.",
            "**Clic droit** pendant le glisser : un menu propose de copier, déplacer ou créer un raccourci au moment de lâcher.",
          ],
        },
        {
          h2: "Atteindre une fenêtre cachée",
          p: [
            "Glissez le fichier au-dessus de l'icône d'une appli dans la barre des tâches et attendez une seconde : sa fenêtre passe au premier plan, et vous pouvez y déposer le fichier.",
          ],
        },
        {
          h2: "Ne plus viser du tout",
          p: [
            "Avec [Ellipse](../../), secouez la souris pendant le glisser : une orbe apparaît sous le curseur. Lâchez, le fichier est mis de côté dans le Notch en haut de l'écran, prêt à être glissé ailleurs plus tard.",
          ],
        },
      ],
    },
    en: {
      title: "Drag and drop on Windows: 5 tips to go faster",
      description: "Copy, move, create a shortcut, reach a hidden window: the drag-and-drop moves Windows doesn't show you.",
      intro: "Drag and drop hides several handy shortcuts. Here they are, in Windows 10 and 11.",
      blocks: [
        {
          h2: "Choose what the drop does",
          list: [
            "**Ctrl** while dragging: the file is **copied**.",
            "**Shift**: it's **moved**, even to another drive.",
            "**Alt**: Windows creates a **shortcut** to it.",
            "**Right-click** while dragging: a menu offers copy, move or create a shortcut when you let go.",
          ],
        },
        {
          h2: "Reach a hidden window",
          p: ["Drag the file over an app's icon in the taskbar and wait a second: its window comes to the front, and you can drop the file in it."],
        },
        {
          h2: "Stop aiming altogether",
          p: [
            "With [Ellipse](../../), shake the mouse while dragging: an orb appears under the pointer. Let go, and the file is set aside in the Notch at the top of the screen, ready to be dragged elsewhere later.",
          ],
        },
      ],
    },
  },
  {
    slug: "send-photo-iphone-to-pc",
    category: "phone",
    updated: UPDATED,
    related: ["send-file-pc-to-phone", "install-ellipse", "notch-for-windows"],
    fr: {
      slug: "envoyer-photo-iphone-vers-pc",
      title: "Envoyer une photo de l'iPhone vers un PC Windows sans câble",
      description: "Trois façons de passer des photos d'un iPhone à un PC Windows : par le Wi-Fi avec Ellipse, avec iCloud pour Windows, ou par câble.",
      intro:
        "AirDrop ne marche qu'entre appareils Apple. Pour envoyer une photo d'un iPhone vers un PC Windows, voici ce qui existe, du plus rapide au plus classique.",
      blocks: [
        {
          h2: "Par le Wi-Fi, avec Ellipse",
          steps: [
            "Sur le PC, ouvrez le Notch d'[Ellipse](../../) et touchez l'icône Téléphone : un QR code s'affiche.",
            "Scannez-le avec l'appareil photo de l'iPhone, sur le même Wi-Fi. Une page Ellipse s'ouvre dans Safari, sans appli à installer.",
            "Choisissez vos photos, puis glissez-en une vers l'île en haut de l'écran : le Notch du PC s'ouvre et la reçoit.",
          ],
          note: ["Les photos passent directement de l'iPhone au PC sur votre réseau, sans compte et sans passer par Internet. Le téléphone reste appairé pour la fois suivante."],
        },
        {
          h2: "Avec iCloud pour Windows",
          p: [
            "L'appli iCloud d'Apple, sur le Microsoft Store, synchronise la photothèque iCloud avec un dossier du PC. Pratique pour tout récupérer, mais les photos passent par les serveurs d'Apple et l'envoi dépend de la synchronisation.",
          ],
        },
        {
          h2: "Par câble",
          p: [
            "Branchez l'iPhone, déverrouillez-le et touchez « Se fier ». Il apparaît dans l'Explorateur ; l'appli Photos de Windows propose aussi « Importer ».",
          ],
        },
      ],
    },
    en: {
      title: "Send a photo from iPhone to a Windows PC without a cable",
      description: "Three ways to move photos from an iPhone to a Windows PC: over Wi-Fi with Ellipse, with iCloud for Windows, or with a cable.",
      intro: "AirDrop only works between Apple devices. To send a photo from an iPhone to a Windows PC, here's what exists, from quickest to most classic.",
      blocks: [
        {
          h2: "Over Wi-Fi, with Ellipse",
          steps: [
            "On the PC, open [Ellipse](../../)'s Notch and press the Phone icon: a QR code shows up.",
            "Scan it with the iPhone's camera, on the same Wi-Fi. An Ellipse page opens in Safari, with no app to install.",
            "Pick your photos, then flick one to the island at the top of the screen: the PC's Notch opens and receives it.",
          ],
          note: ["Photos go straight from the iPhone to the PC over your network, with no account and not through the Internet. The phone stays paired for next time."],
        },
        {
          h2: "With iCloud for Windows",
          p: [
            "Apple's iCloud app, on the Microsoft Store, syncs the iCloud photo library with a folder on the PC. Handy to get everything, but photos go through Apple's servers and sending depends on the sync.",
          ],
        },
        {
          h2: "With a cable",
          p: ["Plug in the iPhone, unlock it and tap “Trust”. It shows up in File Explorer; Windows' Photos app also offers “Import”."],
        },
      ],
    },
  },
  {
    slug: "send-file-pc-to-phone",
    category: "phone",
    updated: UPDATED,
    related: ["send-photo-iphone-to-pc", "file-shelf-windows", "install-ellipse"],
    fr: {
      slug: "envoyer-fichier-pc-vers-telephone",
      title: "Envoyer un fichier du PC vers son téléphone (iPhone ou Android)",
      description: "Passer un PDF, une photo ou une vidéo d'un PC Windows à un iPhone ou un Android, sans câble ni compte, sur le Wi-Fi.",
      intro:
        "S'envoyer un fichier par mail ou par messagerie marche, mais c'est lent et ça laisse des traces partout. Sur un même Wi-Fi, le fichier peut aller directement du PC au téléphone.",
      blocks: [
        {
          h2: "Avec Ellipse, iPhone comme Android",
          steps: [
            "Appairez le téléphone une fois : ouvrez le Notch, icône Téléphone, et scannez le QR code.",
            "Glissez le fichier sur la zone « Envoyer sur… » du Notch, ou touchez le bouton téléphone d'une carte du Stash.",
            "Il apparaît aussitôt sur la page Ellipse du téléphone : touchez « Enregistrer ».",
          ],
        },
        {
          h2: "Avec Quick Share, sur Android",
          p: ["Google propose Quick Share pour Windows : le PC apparaît dans le partage des téléphones Android proches. Il ne marche pas avec l'iPhone."],
        },
        {
          h2: "Ce qui ne quitte pas votre réseau",
          p: ["Avec Ellipse, le fichier va du PC au téléphone sur votre Wi-Fi : pas de compte, pas de serveur, et seul votre téléphone appairé y a accès."],
        },
      ],
    },
    en: {
      title: "Send a file from your PC to your phone (iPhone or Android)",
      description: "Move a PDF, a photo or a video from a Windows PC to an iPhone or an Android, with no cable and no account, over Wi-Fi.",
      intro:
        "Emailing or messaging a file to yourself works, but it's slow and leaves copies everywhere. On the same Wi-Fi, the file can go straight from the PC to the phone.",
      blocks: [
        {
          h2: "With Ellipse, iPhone and Android alike",
          steps: [
            "Pair the phone once: open the Notch, Phone icon, and scan the QR code.",
            "Drag the file onto the Notch's “Send to…” zone, or press a Stash card's phone button.",
            "It shows up at once on the phone's Ellipse page: tap “Save”.",
          ],
        },
        {
          h2: "With Quick Share, on Android",
          p: ["Google offers Quick Share for Windows: the PC shows up in nearby Android phones' share sheet. It doesn't work with iPhone."],
        },
        {
          h2: "What stays on your network",
          p: ["With Ellipse, the file goes from the PC to the phone over your Wi-Fi: no account, no server, and only your paired phone can reach it."],
        },
      ],
    },
  },
  {
    slug: "install-ellipse",
    category: "usage",
    updated: UPDATED,
    related: ["notch-for-windows", "auto-clean-downloads-windows", "send-photo-iphone-to-pc"],
    fr: {
      slug: "installer-ellipse",
      title: "Installer Ellipse et passer l'avertissement SmartScreen",
      description: "Installer Ellipse sur Windows 10 ou 11, comprendre l'écran « Windows a protégé votre ordinateur », et lancer le Notch au démarrage.",
      intro: "Ellipse s'installe en quelques secondes, sans compte. Seul l'écran bleu de SmartScreen peut surprendre la première fois.",
      blocks: [
        {
          h2: "Installer",
          steps: [
            "Téléchargez l'installateur depuis [la page d'accueil](../../).",
            "Lancez-le. Si Windows affiche « Windows a protégé votre ordinateur », cliquez sur **Informations complémentaires**, puis **Exécuter quand même**.",
            "Le Notch apparaît en haut de l'écran. Au premier lancement, Windows peut demander d'autoriser Ellipse sur le réseau : acceptez pour les réseaux privés, c'est ce qui permet au téléphone de se connecter.",
          ],
        },
        {
          h2: "Pourquoi SmartScreen avertit",
          p: [
            "L'installateur n'est pas encore signé par un certificat payant, et SmartScreen avertit pour tout logiciel récent dans ce cas. Chaque installateur est compilé par GitHub Actions à partir du [code public](https://github.com/blasteur1916/ellipse-notch), et publié avec son empreinte SHA-256.",
          ],
        },
        {
          h2: "Lancer au démarrage, quitter",
          p: [
            "Cliquez sur l'icône d'Ellipse dans la zone de notification, près de l'horloge : « Lancer au démarrage » et « Quitter Ellipse » s'y trouvent. Pour désinstaller, passez par Paramètres › Applications.",
          ],
        },
      ],
    },
    en: {
      title: "Install Ellipse and get past the SmartScreen warning",
      description: "Install Ellipse on Windows 10 or 11, understand the “Windows protected your PC” screen, and launch the Notch at startup.",
      intro: "Ellipse installs in a few seconds, with no account. Only SmartScreen's blue screen may surprise you the first time.",
      blocks: [
        {
          h2: "Install",
          steps: [
            "Download the installer from [the home page](../../).",
            "Run it. If Windows shows “Windows protected your PC”, click **More info**, then **Run anyway**.",
            "The Notch appears at the top of the screen. On first launch, Windows may ask to allow Ellipse on the network: accept for private networks, that's what lets the phone connect.",
          ],
        },
        {
          h2: "Why SmartScreen warns",
          p: [
            "The installer isn't signed with a paid certificate yet, and SmartScreen warns about any recent software in that case. Every installer is built by GitHub Actions from the [public code](https://github.com/blasteur1916/ellipse-notch), and published with its SHA-256 fingerprint.",
          ],
        },
        {
          h2: "Launch at startup, quit",
          p: ["Click Ellipse's icon in the notification area, near the clock: “Launch at startup” and “Quit Ellipse” are there. To uninstall, go to Settings › Apps."],
        },
      ],
    },
  },
];

/** The families, in the index's order, with their icon (an inline SVG path). */
export const GUIDE_CATEGORIES: { id: GuideCategory; icon: string; fr: { name: string; text: string }; en: { name: string; text: string } }[] = [
  {
    id: "notch",
    icon: "M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM4 16h16M4 20h10",
    fr: { name: "Notch et Dynamic Island", text: "Le haut de l'écran de Windows, enfin utile." },
    en: { name: "Notch and Dynamic Island", text: "The top of the Windows screen, finally useful." },
  },
  {
    id: "files",
    icon: "M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z",
    fr: { name: "Fichiers et téléchargements", text: "Ranger, garder sous la main, faire le ménage." },
    en: { name: "Files and downloads", text: "Tidy up, keep at hand, clean up." },
  },
  {
    id: "phone",
    icon: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
    fr: { name: "Téléphone et PC", text: "Passer photos et fichiers entre le téléphone et Windows." },
    en: { name: "Phone and PC", text: "Move photos and files between the phone and Windows." },
  },
  {
    id: "usage",
    icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 13.6H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10.4 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.8 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.8H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.1z",
    fr: { name: "Installer et utiliser", text: "Installer Ellipse et le régler à votre goût." },
    en: { name: "Install and use", text: "Install Ellipse and set it up your way." },
  },
];

export const FEATURED_GUIDES = ["auto-clean-downloads-windows", "send-photo-iphone-to-pc", "file-shelf-windows", "notch-for-windows"];

/** The guides' index page. */
export const GUIDES_INDEX = {
  fr: {
    title: "Guides Windows : Notch, fichiers, téléchargements et téléphone",
    description: "Guides pratiques pour Windows : un Notch façon Dynamic Island, vider Téléchargements automatiquement, étagère à fichiers, envoyer des photos entre iPhone, Android et PC.",
    intro: "Des réponses courtes à des questions concrètes sur Windows, ses fichiers et votre téléphone.",
  },
  en: {
    title: "Windows guides: Notch, files, downloads and phone",
    description: "Practical guides for Windows: a Dynamic Island-style Notch, clearing Downloads automatically, a file shelf, sending photos between iPhone, Android and PC.",
    intro: "Short answers to concrete questions about Windows, its files and your phone.",
  },
};
