# Minefun.io Notepad

A feature‑rich, draggable in‑game notepad overlay for **minefun.io** – built as a Tampermonkey userscript.

Press `Alt + D` to toggle the panel.  
Works on `minefun.io` and all its subdomains.

---

## Features

- Multi‑tab notepad (up to 10 tabs) – create, rename, delete notes.
- Rich text formatting: bold, italic, underline, text colour, font size.
- Insert images directly into notes.
- Coordinates manager with sign toggles and presets.
- Trash system for deleted notes and coordinates (restoreable).
- Draggable, resizable panel.
- All data automatically saved to `localStorage`.
- Built‑in help modal and Discord link.
- Hotkey toggle: `Alt + D`.
- No external dependencies – pure vanilla JavaScript.

---

## Installation

1. Install a userscript manager like **Tampermonkey**, **Greasemonkey**, or **Violentmonkey**.
2. Create a new script and paste the full source code.
3. Save – it will run automatically on `minefun.io` and its subdomains.

---

## Usage

Once installed, press `Alt + D` to open the notepad panel.

- Click the **+** tab to add a new note.  
- Double‑click a tab title to rename it.  
- Use the toolbar to format text or change colour/size.  
- Click the **"Choose file"** button to embed an image.  
- Use the coordinates section to save positions (with sign buttons for positive/negative).  
- The **trash icon** opens a recovery area for deleted notes and coordinates.  
- Click the **information icon** for keyboard shortcuts and credits.  
- Drag the panel by its header; resize from the corner.

All content is saved automatically a few seconds after you stop typing.

---

## Customization

The script stores all data in `localStorage`. The main keys are:

| Key                           | Description                                      |
|-------------------------------|--------------------------------------------------|
| `minefun_notepad`             | Active notes (JSON)                              |
| `minefun_notepad_trash_notes` | Deleted notes (JSON)                             |
| `minefun_notepad_trash_coords`| Deleted coordinates (JSON)                       |
| `notepad_coords`              | Saved coordinate presets (JSON)                  |

You can modify the maximum number of notes by changing `config.maxNotes` inside the script.

---

## Keyboard Shortcuts

| Shortcut      | Action              |
|---------------|---------------------|
| `Alt + D`     | Toggle panel        |
| `Ctrl + B`    | Bold                |
| `Ctrl + I`    | Italic              |
| `Ctrl + U`    | Underline           |

---

## Author

**Itz_Krishna AKA Everlasting**
