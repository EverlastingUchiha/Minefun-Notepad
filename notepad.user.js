// ==UserScript==
// @name         Minefun.io Notepad
// @namespace    http://tampermonkey.net
// @version      1.0
// @description  In-game Notepad. Use ALT+D to Start.
// @author       Itz_Krishna AKA Everlasting
// @match        https://minefun.io/*
// @match        https://*.minefun.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=minefun.io
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Settings
    const config = {
        maxNotes: 10,
        toggleKey: 'd',
        saveDelay: 300
    };

    const theme = {
        accent: '#0ff',
        glow: '0 0 5px #0ff, 0 0 10px #0ff',
        panelBg: '#0a0a1a',
        panelDark: '#05050f',
        text: '#e0e0ff',
        dim: '#8888aa'
    };

    // Saved Data
    let notes = JSON.parse(localStorage.getItem('minefun_notepad')) || {
        activeId: 0,
        files: [{ id: 0, title: 'Note 1', content: '' }]
    };
    let trashNotes = JSON.parse(localStorage.getItem('minefun_notepad_trash_notes')) || [];
    let trashCoords = JSON.parse(localStorage.getItem('minefun_notepad_trash_coords')) || [];
    let coordPresets = JSON.parse(localStorage.getItem('notepad_coords')) || [];

    function saveNotes() { localStorage.setItem('minefun_notepad', JSON.stringify(notes)); }
    function saveTrashNotes() { localStorage.setItem('minefun_notepad_trash_notes', JSON.stringify(trashNotes)); }
    function saveTrashCoords() { localStorage.setItem('minefun_notepad_trash_coords', JSON.stringify(trashCoords)); }
    function saveCoords() { localStorage.setItem('notepad_coords', JSON.stringify(coordPresets)); }

    // Helper
    function escapeHtml(str) {
        return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
    }

    // UI
    const panel = document.createElement('div');
    panel.id = 'notepad-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'np-header';
    header.innerHTML = `
        <span class="np-title">NOTEPAD</span>
        <div class="np-header-buttons">
            <button class="np-info-btn" data-ref="infoBtn">ℹ️</button>
            <button class="np-trash-btn" data-ref="trashBtn">🗑️</button>
            <span class="np-close" data-ref="closePanel">✕</span>
        </div>
    `;
    panel.appendChild(header);

    // Tabs Container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'np-tabs';
    tabsContainer.setAttribute('data-ref', 'tabs');
    panel.appendChild(tabsContainer);

    // Main Body
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'np-body';
    panel.appendChild(bodyDiv);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'np-toolbar';
    toolbar.innerHTML = `
        <button class="np-tool-btn" data-command="bold" title="Bold (Ctrl+B)">B</button>
        <button class="np-tool-btn" data-command="italic" title="Italic (Ctrl+I)">I</button>
        <button class="np-tool-btn" data-command="underline" title="Underline (Ctrl+U)">U</button>
        <input type="color" class="np-color-picker" data-ref="colorPicker" title="Text Color">
        <select class="np-font-size" data-ref="fontSize" title="Font Size">
            <option value="10">10px</option><option value="12" selected>12px</option>
            <option value="14">14px</option><option value="16">16px</option>
            <option value="18">18px</option><option value="20">20px</option>
            <option value="24">24px</option>
        </select>
        <label class="np-image-upload" title="Insert Image">
            <span class="np-file-btn">Choose file</span>
            <input type="file" class="np-image-file" accept="image/*" style="display:none;">
        </label>
    `;
    bodyDiv.appendChild(toolbar);

    // Editor
    const editor = document.createElement('div');
    editor.id = 'np-editor';
    editor.setAttribute('contenteditable', 'true');
    bodyDiv.appendChild(editor);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'np-footer';
    footer.innerHTML = `
        <div class="np-status-area">
            <span class="np-spinner" style="display:none;">⟳</span>
            <span class="np-status"></span>
        </div>
        <button class="np-delete" data-ref="deleteNote">DELETE NOTE</button>
    `;
    panel.appendChild(footer);

    // Separator + Co-ordinates
    const separator = document.createElement('div');
    separator.className = 'np-separator';
    panel.appendChild(separator);

    const coordsSection = document.createElement('div');
    coordsSection.className = 'np-coords-section';
    coordsSection.innerHTML = `
        <div class="np-coords-header">
            <span>🗺️ COORDINATES</span>
            <button class="np-small-btn" data-ref="addCoord">+</button>
        </div>
        <div class="np-coords-list" data-ref="coordsList"></div>
    `;
    panel.appendChild(coordsSection);

    // Info Modal
    const infoModal = document.createElement('div');
    infoModal.className = 'np-modal';
    infoModal.id = 'np-info-modal';
    infoModal.innerHTML = `
        <div class="np-modal-content">
            <div class="np-modal-header">
                <span>NOTEPAD HELP</span>
                <button class="np-modal-close" data-ref="infoClose">✕</button>
            </div>
            <div class="np-modal-body">
                <div class="np-info-card"><div class="np-info-title">KEYBOARD SHORTCUTS</div>
                <div class="np-info-text">Alt+D – Toggle panel<br>Ctrl+B / I / U – Format text</div></div>
                <div class="np-info-card"><div class="np-info-title">HOW TO USE</div>
                <div class="np-info-text">• Click + to add a note (max ${config.maxNotes})<br>• Double‑click tab to rename<br>• Click ✕ on tab to delete<br>• Toolbar for formatting<br>• "Choose file" for images<br>• Coordinates save panel positions</div></div>
                <div class="np-info-card"><div class="np-info-title">CREDITS</div>
                <div class="np-info-text">Itz_Krishna AKA Everlasting · Version 1.0</div></div>
                <div class="np-info-card"><a href="https://discord.gg/byXxUkZxag" target="_blank" class="np-discord-link">JOIN OUR DISCORD</a></div>
            </div>
        </div>
    `;
    panel.appendChild(infoModal);

    // Trash
    const trashModal = document.createElement('div');
    trashModal.className = 'np-modal';
    trashModal.id = 'np-trash-modal';
    trashModal.innerHTML = `
        <div class="np-modal-content">
            <div class="np-modal-header">
                <span>TRASH</span>
                <button class="np-modal-close" data-ref="trashClose">✕</button>
            </div>
            <div class="np-modal-body" id="np-trash-body"></div>
        </div>
    `;
    panel.appendChild(trashModal);

    // Confirm
    const confirmModal = document.createElement('div');
    confirmModal.className = 'np-confirm';
    confirmModal.id = 'np-confirm';
    confirmModal.innerHTML = `
        <div class="np-confirm-content">
            <div class="np-confirm-text" data-ref="confirmMsg"></div>
            <div class="np-confirm-buttons">
                <button class="np-btn np-btn-danger" data-ref="confirmYes">YES</button>
                <button class="np-btn np-btn-secondary" data-ref="confirmNo">NO</button>
            </div>
        </div>
    `;
    panel.appendChild(confirmModal);

    document.body.appendChild(panel);

    // Grab Elements Using Data-Ref
    const refs = {};
    document.querySelectorAll('[data-ref]').forEach(el => {
        refs[el.dataset.ref] = el;
    });
    const colorPicker = document.querySelector('.np-color-picker');
    const fontSizeSelect = document.querySelector('.np-font-size');
    const imageFile = document.querySelector('.np-image-file');
    const imageLabel = document.querySelector('.np-image-upload');
    const coordsListDiv = refs.coordsList;
    const addCoordBtn = refs.addCoord;
    const statusSpan = document.querySelector('.np-status');
    const spinner = document.querySelector('.np-spinner');

    // State
    let pendingConfirm = null;
    let saveTimer = null;
    let currentSaveAction = null;

    // Save
    function showSpinner(show) {
        spinner.style.display = show ? 'inline-block' : 'none';
        if (show) spinner.style.animation = 'spin 0.8s linear infinite';
        else spinner.style.animation = '';
    }

    function setSaving() {
        if (saveTimer) clearTimeout(saveTimer);
        showSpinner(true);
        statusSpan.textContent = 'Saving...';
        saveTimer = setTimeout(() => {
            if (currentSaveAction) currentSaveAction();
            showSpinner(false);
            statusSpan.textContent = '';
            saveTimer = null;
        }, config.saveDelay);
    }

    function saveCurrentNote() {
        const active = notes.files.find(f => f.id === notes.activeId);
        if (active) {
            active.content = editor.innerHTML;
            saveNotes();
        }
    }

    function loadCurrentNote() {
        const active = notes.files.find(f => f.id === notes.activeId);
        editor.innerHTML = active ? active.content : '';
    }

    // Confirm
    function showConfirm(msg, onYes) {
        refs.confirmMsg.textContent = msg;
        confirmModal.style.display = 'flex';
        pendingConfirm = onYes;
    }
    function hideConfirm() { confirmModal.style.display = 'none'; pendingConfirm = null; }
    refs.confirmYes.addEventListener('click', () => { if (pendingConfirm) pendingConfirm(); hideConfirm(); });
    refs.confirmNo.addEventListener('click', hideConfirm);

    // Font Size
    function applyFontSize(sizePx) {
        editor.focus();
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        if (range.collapsed) return;
        const span = document.createElement('span');
        span.style.fontSize = sizePx + 'px';
        range.surroundContents(span);
        selection.removeAllRanges();
        setSaving();
        currentSaveAction = saveCurrentNote;
    }
    fontSizeSelect.addEventListener('change', (e) => applyFontSize(parseInt(e.target.value)));

    // Image
    imageLabel.addEventListener('click', () => imageFile.click());
    imageFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const imgHtml = `<img src="${ev.target.result}" style="max-width:100%; margin:5px 0;">`;
            document.execCommand('insertHTML', false, imgHtml);
            setSaving();
            currentSaveAction = saveCurrentNote;
        };
        reader.readAsDataURL(file);
        imageFile.value = '';
    });

    // Formatting
    document.querySelectorAll('.np-tool-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', () => {
            editor.focus();
            document.execCommand(btn.dataset.command, false, null);
            setSaving();
            currentSaveAction = saveCurrentNote;
        });
    });
    colorPicker.addEventListener('input', (e) => {
        editor.focus();
        document.execCommand('foreColor', false, e.target.value);
        setSaving();
        currentSaveAction = saveCurrentNote;
    });
    editor.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            if (e.key === 'b') { e.preventDefault(); document.execCommand('bold'); setSaving(); currentSaveAction = saveCurrentNote; }
            else if (e.key === 'i') { e.preventDefault(); document.execCommand('italic'); setSaving(); currentSaveAction = saveCurrentNote; }
            else if (e.key === 'u') { e.preventDefault(); document.execCommand('underline'); setSaving(); currentSaveAction = saveCurrentNote; }
        }
    });
    editor.addEventListener('input', () => {
        setSaving();
        currentSaveAction = saveCurrentNote;
    });

    // Tabs
    function renderTabs() {
        tabsContainer.innerHTML = '';
        notes.files.forEach(file => {
            const tab = document.createElement('div');
            tab.className = 'np-tab' + (file.id === notes.activeId ? ' active' : '');
            const titleSpan = document.createElement('span');
            titleSpan.className = 'np-tab-title';
            titleSpan.textContent = file.title;
            titleSpan.addEventListener('dblclick', () => {
                const input = document.createElement('input');
                input.value = file.title;
                input.className = 'np-tab-edit';
                titleSpan.style.display = 'none';
                tab.insertBefore(input, titleSpan);
                input.focus();
                input.addEventListener('blur', () => {
                    file.title = input.value.trim() || 'Untitled';
                    saveNotes();
                    renderTabs();
                });
                input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') input.blur(); });
            });
            tab.appendChild(titleSpan);
            const closeBtn = document.createElement('span');
            closeBtn.className = 'np-tab-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (notes.files.length <= 1) return;
                showConfirm(`Move "${file.title}" to trash?`, () => {
                    trashNotes.push({ ...file, deletedAt: Date.now() });
                    saveTrashNotes();
                    notes.files = notes.files.filter(f => f.id !== file.id);
                    if (notes.activeId === file.id) notes.activeId = notes.files[0].id;
                    if (notes.files.length === 0) {
                        notes.files = [{ id: Date.now(), title: 'Note 1', content: '' }];
                        notes.activeId = notes.files[0].id;
                    }
                    saveNotes();
                    renderTabs();
                    loadCurrentNote();
                });
            });
            tab.appendChild(closeBtn);
            tab.addEventListener('click', (e) => {
                if (e.target !== closeBtn && notes.activeId !== file.id) {
                    notes.activeId = file.id;
                    renderTabs();
                    loadCurrentNote();
                }
            });
            tabsContainer.appendChild(tab);
        });
        if (notes.files.length < config.maxNotes) {
            const addTab = document.createElement('div');
            addTab.className = 'np-tab-add';
            addTab.textContent = '+';
            addTab.addEventListener('click', () => {
                if (notes.files.length >= config.maxNotes) return;
                const newId = Date.now();
                notes.files.push({ id: newId, title: `Note ${notes.files.length+1}`, content: '' });
                notes.activeId = newId;
                saveNotes();
                renderTabs();
                loadCurrentNote();
            });
            tabsContainer.appendChild(addTab);
        }
    }

    // Co-Ordinates + Sign
    function renderCoords() {
        if (!coordsListDiv) return;
        if (coordPresets.length === 0) {
            coordsListDiv.innerHTML = '<div class="np-coords-empty">No coordinates. Click + to add.</div>';
            return;
        }
        coordsListDiv.innerHTML = coordPresets.map((p, idx) => `
            <div class="np-coord-item" data-idx="${idx}">
                <div class="np-coord-name">
                    <input type="text" class="np-coord-name-input" value="${escapeHtml(p.name)}" placeholder="Name">
                </div>
                <div class="np-coord-values">
                    <div class="np-coord-field"><label>X:</label><input type="number" class="np-coord-val" data-c="x" value="${p.x}">
                    <button class="np-sign-btn" data-c="x" data-op="pos">+</button><button class="np-sign-btn" data-c="x" data-op="neg">-</button></div>
                    <div class="np-coord-field"><label>Y:</label><input type="number" class="np-coord-val" data-c="y" value="${p.y}">
                    <button class="np-sign-btn" data-c="y" data-op="pos">+</button><button class="np-sign-btn" data-c="y" data-op="neg">-</button></div>
                    <div class="np-coord-field"><label>Z:</label><input type="number" class="np-coord-val" data-c="z" value="${p.z}">
                    <button class="np-sign-btn" data-c="z" data-op="pos">+</button><button class="np-sign-btn" data-c="z" data-op="neg">-</button></div>
                    <button class="np-small-btn np-coord-del" data-idx="${idx}">🗑️</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.np-coord-item').forEach(item => {
            const idx = parseInt(item.dataset.idx);
            const nameInp = item.querySelector('.np-coord-name-input');
            const xInp = item.querySelector('.np-coord-val[data-c="x"]');
            const yInp = item.querySelector('.np-coord-val[data-c="y"]');
            const zInp = item.querySelector('.np-coord-val[data-c="z"]');
            const del = item.querySelector('.np-coord-del');
            const update = () => {
                coordPresets[idx] = {
                    name: nameInp.value.trim() || 'Unnamed',
                    x: parseFloat(xInp.value) || 0,
                    y: parseFloat(yInp.value) || 0,
                    z: parseFloat(zInp.value) || 0
                };
                saveCoords();
            };
            nameInp.addEventListener('change', update);
            xInp.addEventListener('change', update);
            yInp.addEventListener('change', update);
            zInp.addEventListener('change', update);
            item.querySelectorAll('.np-sign-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const coord = btn.dataset.c;
                    const op = btn.dataset.op;
                    let inp;
                    if (coord === 'x') inp = xInp;
                    else if (coord === 'y') inp = yInp;
                    else inp = zInp;
                    let val = parseFloat(inp.value) || 0;
                    if (op === 'pos') val = Math.abs(val);
                    else val = -Math.abs(val);
                    inp.value = val;
                    update();
                });
            });
            del.addEventListener('click', () => {
                const deleted = coordPresets[idx];
                trashCoords.push({ ...deleted, deletedAt: Date.now() });
                saveTrashCoords();
                coordPresets.splice(idx, 1);
                saveCoords();
                renderCoords();
            });
        });
    }
    addCoordBtn.addEventListener('click', () => {
        const rect = panel.getBoundingClientRect();
        coordPresets.push({
            name: `Preset ${coordPresets.length+1}`,
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            z: 0
        });
        saveCoords();
        renderCoords();
    });

    // Trash UI
    function renderTrashLists() {
        const trashBody = document.getElementById('np-trash-body');
        if (!trashBody) return;
        trashBody.innerHTML = '';

        const notesSection = document.createElement('div');
        notesSection.className = 'np-trash-section';
        notesSection.innerHTML = '<div class="np-trash-section-title">NOTES</div><div class="np-trash-list" id="np-trash-notes-list"></div>';
        trashBody.appendChild(notesSection);
        const coordsSection = document.createElement('div');
        coordsSection.className = 'np-trash-section';
        coordsSection.innerHTML = '<div class="np-trash-section-title">COORDINATES</div><div class="np-trash-list" id="np-trash-coords-list"></div>';
        trashBody.appendChild(coordsSection);

        const notesList = document.getElementById('np-trash-notes-list');
        const coordsList = document.getElementById('np-trash-coords-list');

        if (trashNotes.length === 0) notesList.innerHTML = '<div class="np-trash-empty">No notes in trash</div>';
        else {
            notesList.innerHTML = trashNotes.map((item, idx) => `
                <div class="np-trash-item">
                    <span class="np-trash-title">${escapeHtml(item.title)}</span>
                    <button class="np-small-btn np-restore-note" data-idx="${idx}">Restore</button>
                </div>
            `).join('');
            notesList.querySelectorAll('.np-restore-note').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    const restored = trashNotes[idx];
                    notes.files.push(restored);
                    notes.activeId = restored.id;
                    trashNotes.splice(idx, 1);
                    saveNotes();
                    saveTrashNotes();
                    renderTabs();
                    loadCurrentNote();
                    renderTrashLists();
                });
            });
        }

        if (trashCoords.length === 0) coordsList.innerHTML = '<div class="np-trash-empty">No coordinates in trash</div>';
        else {
            coordsList.innerHTML = trashCoords.map((item, idx) => `
                <div class="np-trash-item">
                    <span class="np-trash-title">${escapeHtml(item.name)}</span>
                    <button class="np-small-btn np-restore-coord" data-idx="${idx}">Restore</button>
                </div>
            `).join('');
            coordsList.querySelectorAll('.np-restore-coord').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    const restored = trashCoords[idx];
                    coordPresets.push(restored);
                    trashCoords.splice(idx, 1);
                    saveCoords();
                    saveTrashCoords();
                    renderCoords();
                    renderTrashLists();
                });
            });
        }
    }
    function openTrashModal() {
        renderTrashLists();
        trashModal.style.display = 'flex';
    }

    // Footer
    refs.deleteNote.addEventListener('click', () => {
        if (notes.files.length <= 1) return;
        const active = notes.files.find(f => f.id === notes.activeId);
        showConfirm(`Move "${active.title}" to trash?`, () => {
            trashNotes.push({ ...active, deletedAt: Date.now() });
            saveTrashNotes();
            notes.files = notes.files.filter(f => f.id !== active.id);
            notes.activeId = notes.files[0].id;
            saveNotes();
            renderTabs();
            loadCurrentNote();
        });
    });

    // Modal Controls
    function openModal(modal) { modal.style.display = 'flex'; }
    function closeModal(modal) { modal.style.display = 'none'; }
    refs.infoBtn.addEventListener('click', () => openModal(infoModal));
    refs.infoClose.addEventListener('click', () => closeModal(infoModal));
    infoModal.addEventListener('click', (e) => { if (e.target === infoModal) closeModal(infoModal); });
    refs.trashBtn.addEventListener('click', openTrashModal);
    refs.trashClose.addEventListener('click', () => closeModal(trashModal));
    trashModal.addEventListener('click', (e) => { if (e.target === trashModal) closeModal(trashModal); });
    refs.closePanel.addEventListener('click', () => panel.style.display = 'none');

    // Drag
    let drag = false, offX, offY;
    const headerEl = document.querySelector('.np-header');
    headerEl.addEventListener('mousedown', (e) => {
        if (e.target.closest('.np-header-buttons')) return;
        drag = true;
        const rect = panel.getBoundingClientRect();
        offX = e.clientX - rect.left;
        offY = e.clientY - rect.top;
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!drag) return;
        let left = e.clientX - offX;
        let top = e.clientY - offY;
        left = Math.min(Math.max(0, left), window.innerWidth - panel.offsetWidth);
        top = Math.min(Math.max(0, top), window.innerHeight - panel.offsetHeight);
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => drag = false);

    // Hotkey
    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === config.toggleKey) {
            e.preventDefault();
            if (panel.style.display === 'none' || panel.style.display === '') {
                panel.style.display = 'block';
                loadCurrentNote();
            } else {
                panel.style.display = 'none';
            }
        }
    });

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #notepad-panel {
            position: fixed; top: 100px; left: 50px; width: 580px;
            background: ${theme.panelBg}; color: ${theme.text};
            border-radius: 16px; border: 1px solid ${theme.accent};
            box-shadow: 0 8px 28px rgba(0,255,255,0.2), ${theme.glow};
            font-family: 'Segoe UI', system-ui, sans-serif;
            font-size: 13px; z-index: 2147483647;
            display: none; overflow: hidden;
            resize: both; min-width: 420px; min-height: 550px;
        }
        #notepad-panel ::-webkit-scrollbar { width: 6px; }
        #notepad-panel ::-webkit-scrollbar-track { background: #0a0a1a; }
        #notepad-panel ::-webkit-scrollbar-thumb { background: #1a1a2a; border-radius: 3px; }
        #notepad-panel ::-webkit-scrollbar-thumb:hover { background: ${theme.accent}; }
        .np-header {
            display: flex; justify-content: space-between; align-items: center;
            background: ${theme.panelDark}; padding: 10px 14px;
            border-bottom: 1px solid ${theme.accent}; cursor: move;
        }
        .np-title { font-weight: 700; font-size: 14px; color: ${theme.accent}; text-shadow: 0 0 3px ${theme.accent}; }
        .np-header-buttons { display: flex; gap: 8px; }
        .np-info-btn, .np-trash-btn, .np-close {
            background: none; border: none; color: ${theme.dim}; cursor: pointer; font-size: 14px;
        }
        .np-info-btn:hover, .np-trash-btn:hover, .np-close:hover { color: #fff; text-shadow: 0 0 5px ${theme.accent}; }
        .np-tabs {
            display: flex; background: #0a0a1a; padding: 6px 8px; gap: 6px;
            overflow-x: auto; align-items: center; border-bottom: 1px solid #1a1a2a;
        }
        .np-tab {
            background: #111; border: 1px solid #2a2a3a; border-radius: 8px;
            padding: 4px 8px 4px 12px; font-size: 11px; cursor: pointer;
            display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
        }
        .np-tab.active { background: rgba(0,255,255,0.15); border-color: ${theme.accent}; color: ${theme.accent}; }
        .np-tab-title { max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
        .np-tab-close { background: none; border: none; color: #888; font-size: 14px; cursor: pointer; padding: 0 2px; border-radius: 4px; }
        .np-tab-close:hover { background: #ff4d4d; color: #fff; }
        .np-tab-edit { background: #111; border: 1px solid ${theme.accent}; border-radius: 6px; color: #fff; font-size: 11px; padding: 2px 6px; }
        .np-tab-add {
            background: #1a1a2a; border: 1px solid ${theme.accent}; border-radius: 8px;
            width: 26px; text-align: center; font-size: 14px; font-weight: bold;
            cursor: pointer; color: ${theme.accent}; line-height: 22px;
        }
        .np-tab-add:hover { background: ${theme.accent}; color: #000; }
        .np-body {
            display: flex; flex-direction: column; padding: 10px;
            flex: 2;
        }
        .np-toolbar {
            display: flex; gap: 6px; margin-bottom: 8px; padding-bottom: 6px;
            border-bottom: 1px solid #2a2a3a; flex-wrap: wrap; align-items: center;
        }
        .np-tool-btn {
            background: #1a1a2a; border: 1px solid #3a3a4a; border-radius: 6px;
            color: #ddd; font-size: 14px; width: 32px; height: 28px;
            cursor: pointer; font-weight: bold;
            display: inline-flex; align-items: center; justify-content: center;
        }
        .np-tool-btn:hover { background: ${theme.accent}; color: #000; }
        .np-color-picker { width: 28px; height: 28px; border: 1px solid #3a3a4a; border-radius: 6px; background: #111; cursor: pointer; vertical-align: middle; }
        .np-font-size {
            background: #111; border: 1px solid #3a3a4a; border-radius: 6px;
            color: #ddd; font-size: 11px; padding: 0 4px; height: 28px;
            cursor: pointer;
        }
        .np-image-upload { display: inline-flex; align-items: center; cursor: pointer; }
        .np-file-btn {
            background: #1a1a2a; border: 1px solid #3a3a4a; border-radius: 6px;
            color: #ddd; font-size: 11px; padding: 5px 10px; cursor: pointer;
            height: 28px; display: inline-flex; align-items: center;
        }
        .np-file-btn:hover { background: ${theme.accent}; color: #000; }
        #np-editor {
            width: 100%; flex: 1;
            background: #0a0a1a; color: #ddd;
            border: 1px solid #2a2a3a; border-radius: 8px; padding: 8px;
            font-family: 'Segoe UI', 'Consolas', monospace; font-size: 12px;
            overflow-y: auto; outline: none;
            min-height: 280px;
        }
        #np-editor:focus { border-color: ${theme.accent}; }
        #np-editor img { max-width: 100%; margin: 4px 0; }
        .np-footer {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px 12px; border-top: 1px solid #1a1a2a; background: ${theme.panelDark};
        }
        .np-status-area { display: flex; align-items: center; gap: 4px; }
        .np-spinner { font-size: 12px; animation: spin 0.8s linear infinite; }
        .np-status { font-size: 9px; color: ${theme.accent}; }
        .np-delete {
            background: none; border: none; color: #ff6666; font-size: 9px;
            font-weight: 600; cursor: pointer; text-transform: uppercase;
        }
        .np-delete:hover { color: #ff9999; text-decoration: underline; }
        .np-separator { height: 1px; background: #1a1a2a; margin: 8px 12px 0; }
        .np-coords-section {
            margin: 0 12px 12px; padding: 8px; background: #0a0a1a;
            border-radius: 8px; border: 1px solid #1a1a2a;
            max-height: 160px; overflow-y: auto;
        }
        .np-coords-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; color: ${theme.accent}; }
        .np-coords-list { max-height: 130px; overflow-y: auto; }
        .np-coord-item { background: #111; border-radius: 6px; padding: 4px; margin-bottom: 4px; border: 1px solid #2a2a3a; }
        .np-coord-name-input { width: 100%; background: #1a1a2a; border: 1px solid #3a3a4a; border-radius: 4px; color: #fff; font-size: 10px; padding: 2px 4px; margin-bottom: 4px; }
        .np-coord-values { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .np-coord-field { display: flex; align-items: center; gap: 2px; background: #1a1a2a; padding: 2px 4px; border-radius: 4px; }
        .np-coord-field label { font-size: 9px; color: ${theme.accent}; margin: 0; }
        .np-coord-field input { width: 45px; background: #05050f; border: 1px solid #3a3a4a; border-radius: 3px; color: #fff; font-size: 9px; text-align: center; }
        .np-sign-btn { background: #2a2a3a; border: none; color: #ccc; font-size: 8px; width: 20px; cursor: pointer; height: 16px; }
        .np-sign-btn:hover { background: ${theme.accent}; color: #000; }
        .np-coord-del { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 12px; }
        .np-coord-del:hover { color: #ff6666; }
        .np-coords-empty { text-align: center; color: #888; padding: 8px; font-size: 9px; }
        .np-small-btn { background: #1a1a2a; border: 1px solid #3a3a4a; border-radius: 4px; color: #ccc; font-size: 9px; padding: 2px 6px; cursor: pointer; height: 22px; }
        .np-small-btn:hover { background: ${theme.accent}; color: #000; }
        .np-modal {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: none; align-items: center; justify-content: center;
            z-index: 20; border-radius: 12px;
        }
        .np-modal-content {
            background: #0a0a1a; border-radius: 16px; border: 1px solid ${theme.accent};
            max-width: 400px; width: 90%; max-height: 70vh; overflow-y: auto;
            box-shadow: 0 0 20px rgba(0,255,127,0.3);
        }
        .np-modal-header {
            display: flex; justify-content: space-between; padding: 10px 14px;
            border-bottom: 1px solid ${theme.accent}; background: ${theme.panelDark};
            font-weight: bold; color: ${theme.accent};
        }
        .np-modal-close { background: none; border: none; color: #888; cursor: pointer; font-size: 16px; }
        .np-modal-close:hover { color: #fff; }
        .np-modal-body { padding: 14px; }
        .np-info-card { background: #0a0a1a; border-radius: 12px; padding: 10px; margin-bottom: 12px; border-left: 3px solid ${theme.accent}; }
        .np-info-title { font-size: 9px; color: ${theme.accent}; margin-bottom: 6px; letter-spacing: 1px; text-shadow: 0 0 2px ${theme.accent}; }
        .np-info-text { font-size: 10px; color: ${theme.dim}; line-height: 1.5; }
        .np-discord-link {
            display: block; text-align: center; text-decoration: none; color: #0ff;
            font-size: 12px; padding: 8px; border-radius: 10px; background: #0a0a1a;
            border: 1px solid #0ff; transition: 0.1s;
        }
        .np-discord-link:hover { background: #5865f2; color: #fff; border-color: #fff; box-shadow: 0 0 8px #5865f2; }
        .np-confirm {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: none; align-items: center; justify-content: center;
            z-index: 25; border-radius: 12px;
        }
        .np-confirm-content {
            background: #0a0a1a; border-radius: 12px; border: 1px solid ${theme.accent};
            width: 260px; padding: 20px; text-align: center;
        }
        .np-confirm-text { margin-bottom: 20px; color: #fff; font-size: 12px; }
        .np-confirm-buttons { display: flex; gap: 10px; justify-content: center; }
        .np-btn { padding: 5px 12px; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; }
        .np-btn-danger { background: #ff4d4d; color: #000; }
        .np-btn-secondary { background: #2a2a3a; color: #ddd; }
        .np-trash-section {
            margin-bottom: 16px;
        }
        .np-trash-section-title {
            font-size: 10px; color: ${theme.accent}; margin-bottom: 8px;
            border-bottom: 1px solid #2a2a3a; padding-bottom: 4px;
        }
        .np-trash-list {
            max-height: 150px; overflow-y: auto;
        }
        .np-trash-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 6px 0; border-bottom: 1px solid #2a2a3a;
        }
        .np-trash-title { font-size: 11px; }
        .np-restore-note, .np-restore-coord { background: #1a1a2a; border: 1px solid #3a3a4a; padding: 2px 8px; cursor: pointer; }
        .np-restore-note:hover, .np-restore-coord:hover { background: ${theme.accent}; color: #000; }
        .np-trash-empty { text-align: center; color: #888; padding: 20px; font-size: 11px; }
    `;
    document.head.appendChild(style);

    // Start
    renderTabs();
    loadCurrentNote();
    renderCoords();
    panel.style.display = 'none';
})();
