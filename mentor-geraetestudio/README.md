# MENTOR Gerätestudio

Webseite, um Gehäuse-Varianten von MENTOR als animierte 3D-Modelle zu vergleichen und im Team zu entscheiden.
Ohne Build-Schritt: reines HTML/JS, Three.js wird per CDN geladen.

## Starten

ES-Module brauchen einen lokalen Server (Doppelklick auf `index.html` reicht nicht):

```bash
cd mentor-geraetestudio
python3 serve.py
```

`serve.py` schaltet den Browser-Cache ab, damit Änderungen nach einem Reload sofort sichtbar sind
(`python3 -m http.server 8000` geht auch, zeigt aber manchmal alte Dateien).

Dann <http://localhost:8000> öffnen. Alternativ: VS Code → «Live Server».
Direktlink auf eine Variante: `http://localhost:8000/#<variant-id>`

## Struktur

```
index.html              Layout (Variantenliste · 3D-Bühne · Steuerung)
css/style.css           Gestaltung der Seite
js/main.js              Szene, Kamera, Licht, UI, Röntgen, Explosion, Masse, Demo-Sequenz
js/face.js              Animiertes Gesicht (Canvas-Textur) mit den Modi aus dem Systemprompt
js/materials.js         Oberflächen-Finishes für 3D-Druck, Farben, Akzentmaterialien
js/hardware.js          Bauteil-Platzhalter in echten Massen (Arduino, Displays, Lautsprecher …)
js/geometry.js          Helfer: Display-Flächen, Lünetten, Ringe, Explosions-Teile
js/variants/index.js    Register aller Varianten
js/variants/_vorlage.js Vorlage für neue Varianten
js/variants/shared/     Gemeinsame Bauteile (z. B. Holo-Prisma mit Hologramm)
skizzen/                Skizzen ablegen, Variante verweist per `sketch: 'skizzen/datei.jpg'`
```

## Neue Variante aus einer Skizze

1. `js/variants/_vorlage.js` kopieren → z. B. `js/variants/meine-idee.js`, `id` anpassen
2. Texte (Beschreibung, Pro/Contra) und `sketch` eintragen
3. In `build()` die Form aus Three.js-Geometrien bauen (Einheit **mm**, Y = oben, +Z = Front)
4. In `js/variants/index.js` importieren und in `VARIANTS` eintragen

Gehäuseteile nutzen `mats.case` / `mats.accent`, damit sie das Finish aus `defaults` übernehmen (z. B. `{ finish: 'chrome', accent: 'black', palette: 'holo' }`).
Mit `explode: [x, y, z]` erscheint ein Teil in der Explosionsansicht (z. B. Druckteile, Deckel).
Hardware mit `makeHW('<key>', …)` platzieren: sichtbar im Röntgen-Modus.

## Bedienung

Oben nur die Navigation (Variante 1, 2, …), darunter das Modell auf Schwarz. Maus: ziehen = drehen, Scroll = zoomen.
Versteckte Tastenkürzel für Präsentation und Tests:

- 1–5 Modus (Therapeut, Belohnung, Enttäuschung, Riss, Neutral)
- G Glitch · B Seitenblick · L Lächeln halten · S Sprechen an/aus
- R Drehen an/aus · X Röntgen (Hardware) · E Explosionsansicht
- I Panel «Umsetzung & 3D-Druck» (auch per Button unten rechts oder `?info=1` in der Adresse)

Das Panel zeigt pro Variante Anforderungen, Pro und Herausforderungen für den 3D-Druck
(Bambu Lab X2D im FHGR UX Lab, Bauraum 256 × 256 × 260 mm, zwei Düsen) und den Einbau der Elektronik. Inhalt: Feld `printing` in der Variantendatei.
