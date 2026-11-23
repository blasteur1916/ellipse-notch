/** Text and links shared by the page and its prerender (structured data). */
import { translate, type Lang } from "./i18n";

export const REPO = "https://github.com/blasteur1916/ellipse-notch";
export const RELEASES = `${REPO}/releases`;
/** The installer of the latest release, under a name that stays the same from one version to the next. */
export const DOWNLOAD = `${REPO}/releases/latest/download/Ellipse-Setup-x64.exe`;

export function faqs(lang: Lang): { q: string; a: string }[] {
  const tr = translate(lang);
  return [
    {
      q: tr("Qu'est-ce qu'Ellipse ?", "What is Ellipse?"),
      a: tr(
        "Un Notch pour Windows : une petite pilule noire collée en haut de l'écran. Au survol, elle s'ouvre sur le Stash, un tiroir où vous gardez vos fichiers du moment et vos derniers téléchargements, avec leur aperçu. Elle échange aussi des fichiers avec votre téléphone, sur le Wi-Fi.",
        "A Notch for Windows: a small black pill stuck to the top of the screen. On hover, it opens on the Stash, a drawer where you keep the files you're working with and your latest downloads, with their preview. It also swaps files with your phone, over Wi-Fi.",
      ),
    },
    {
      q: tr("Sur quels systèmes fonctionne-t-il ?", "Which systems does it run on?"),
      a: tr(
        "Windows 10 et Windows 11, en 64 bits. Côté téléphone, n'importe quel iPhone ou Android avec un navigateur : la page s'ouvre en scannant le QR code, sans appli à installer.",
        "Windows 10 and Windows 11, 64-bit. On the phone side, any iPhone or Android with a browser: the page opens when you scan the QR code, with no app to install.",
      ),
    },
    {
      q: tr("Comment installer Ellipse ?", "How do I install Ellipse?"),
      a: tr(
        "Téléchargez l'installateur, lancez-le, et le Notch apparaît en haut de l'écran. Aucun compte n'est demandé. Pour qu'il démarre avec Windows, cliquez sur l'icône d'Ellipse près de l'horloge, puis « Lancer au démarrage ». Pour le désinstaller, passez par Paramètres › Applications.",
        "Download the installer, run it, and the Notch appears at the top of the screen. No account needed. To start it with Windows, click Ellipse's icon near the clock, then “Launch at startup”. To uninstall it, go to Settings › Apps.",
      ),
    },
    {
      q: tr("Windows affiche « Windows a protégé votre ordinateur » : est-ce normal ?", "Windows says “Windows protected your PC”: is that normal?"),
      a: tr(
        "Oui. L'installateur n'est pas encore signé par un certificat payant, et SmartScreen avertit pour tout logiciel récent dans ce cas. Cliquez sur « Informations complémentaires », puis « Exécuter quand même ». Le code est public sur GitHub, et chaque installateur est compilé par GitHub Actions à partir de ce code.",
        "Yes. The installer isn't signed with a paid certificate yet, and SmartScreen warns about any recent software in that case. Click “More info”, then “Run anyway”. The code is public on GitHub, and every installer is built by GitHub Actions from that code.",
      ),
    },
    {
      q: tr("Comment ajouter un fichier au Stash ?", "How do I add a file to the Stash?"),
      a: tr(
        "Trois façons : glissez-le jusqu'au Notch, qui s'ouvre et devient une zone de dépôt ; ou secouez la souris pendant que vous le glissez, une orbe apparaît sous le curseur et il suffit de lâcher ; ou téléchargez-le, il arrive tout seul. Le fichier reste à sa place sur le disque : le Stash n'en garde qu'un raccourci.",
        "Three ways: drag it to the Notch, which opens and turns into a drop zone; or shake the mouse while dragging it, an orb appears under the pointer and you just let go; or download it, and it arrives by itself. The file stays where it is on disk: the Stash only keeps a shortcut.",
      ),
    },
    {
      q: tr("Comment vider automatiquement mes téléchargements ?", "How do I clear my downloads automatically?"),
      a: tr(
        "Survolez la carte d'un téléchargement dans le Notch et touchez le bouton minuteur : il part à la Corbeille après le délai choisi (5, 10, 30 ou 60 minutes), ou juste après que vous l'avez glissé ailleurs. Dans les réglages, vous pouvez lancer ce minuteur sur chaque nouveau téléchargement. Tout passe par la Corbeille : rien n'est effacé définitivement.",
        "Hover a download's card in the Notch and press the timer button: it goes to the Recycle Bin after the delay you chose (5, 10, 30 or 60 minutes), or right after you've dragged it elsewhere. In the settings, you can start that timer on every new download. Everything goes through the Recycle Bin: nothing is deleted for good.",
      ),
    },
    {
      q: tr("Comment envoyer une photo du téléphone vers le PC ?", "How do I send a photo from my phone to the PC?"),
      a: tr(
        "Ouvrez le Notch, touchez l'icône Téléphone et scannez le QR code avec l'appareil photo, sur le même Wi-Fi que le PC. La page Ellipse s'ouvre : choisissez vos photos, puis glissez-en une vers l'île en haut de l'écran. Le Notch du PC s'ouvre et la reçoit. Le téléphone reste appairé : pas besoin de rescanner.",
        "Open the Notch, tap the Phone icon and scan the QR code with the camera, on the same Wi-Fi as the PC. The Ellipse page opens: pick your photos, then flick one to the island at the top of the screen. The PC's Notch opens and receives it. The phone stays paired: no need to scan again.",
      ),
    },
    {
      q: tr("Et dans l'autre sens, du PC vers le téléphone ?", "And the other way, from the PC to the phone?"),
      a: tr(
        "Glissez un fichier sur la zone « Envoyer sur… » du Notch, ou touchez le bouton téléphone d'une carte du Stash. Il apparaît aussitôt sur la page Ellipse du téléphone, avec un bouton pour l'enregistrer.",
        "Drag a file onto the Notch's “Send to…” zone, or press a Stash card's phone button. It shows up at once on the phone's Ellipse page, with a button to save it.",
      ),
    },
    {
      q: tr("Le Notch me gêne ou cache un onglet : que faire ?", "The Notch gets in the way or hides a tab: what can I do?"),
      a: tr(
        "Fermé, il ne fait que 132 × 30 pixels et laisse passer les clics autour de lui. Il ne s'ouvre que lorsque la souris touche le haut de l'écran, et se referme dès qu'elle repart. Pour le retirer, quittez Ellipse depuis son icône près de l'horloge.",
        "Closed, it's only 132 × 30 pixels and lets clicks through around it. It only opens when the pointer touches the top of the screen, and closes as soon as it leaves. To remove it, quit Ellipse from its icon near the clock.",
      ),
    },
    {
      q: tr("Est-ce qu'Ellipse ralentit mon PC ?", "Does Ellipse slow down my PC?"),
      a: tr(
        "Non. L'installateur pèse moins de 2 Mo, l'appli est écrite en Rust et utilise le moteur web déjà présent dans Windows. Au repos, elle ne fait presque rien : elle attend un téléchargement ou le passage de la souris.",
        "No. The installer weighs under 2 MB, the app is written in Rust and uses the web engine already in Windows. At rest, it does almost nothing: it waits for a download or for the pointer.",
      ),
    },
    {
      q: tr("Mes fichiers passent-ils par Internet ?", "Do my files go over the Internet?"),
      a: tr(
        "Non. Pas de compte, pas de serveur, pas de télémétrie. La liste du Stash est enregistrée sur votre PC, et les transferts avec le téléphone se font directement sur votre Wi-Fi. Le QR code contient une clé que seul votre téléphone connaît.",
        "No. No account, no server, no telemetry. The Stash's list is saved on your PC, and transfers with the phone go straight over your Wi-Fi. The QR code holds a key only your phone knows.",
      ),
    },
    {
      q: tr("Ellipse est-il vraiment gratuit ?", "Is Ellipse really free?"),
      a: tr(
        "Oui, et libre : le code est publié sur GitHub sous licence GPL-3.0. Vous pouvez le lire, le compiler vous-même et proposer des améliorations.",
        "Yes, and open source: the code is published on GitHub under the GPL-3.0 licence. You can read it, build it yourself and suggest improvements.",
      ),
    },
  ];
}
