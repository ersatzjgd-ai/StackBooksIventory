:root {
  --cream: #f2ecdc;
  --cream-2: #e9e1cb;
  --ink: #22282b;
  --ink-soft: #4d5559;
  --green: #1f3b33;
  --green-2: #172b25;
  --oak: #8a5a3b;
  --oak-dark: #5f3c26;
  --brass: #b98a46;
  --brass-light: #d9b171;
  --stamp: #a63d40;
  --card: #fffdf7;
  --radius: 3px;
  --shadow: 0 8px 24px rgba(23, 20, 10, 0.16);
  --font-display: "Fraunces", serif;
  --font-body: "Source Sans 3", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--cream);
  color: var(--ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}

a, button, input { font-family: inherit; }

/* ---------------- Topbar ---------------- */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 32px;
  background: var(--green);
  color: var(--cream);
  border-bottom: 4px solid var(--brass);
}
.topbar__brand { display: flex; align-items: center; gap: 10px; }
.topbar__mark { font-size: 20px; color: var(--brass-light); }
.topbar__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 22px;
  letter-spacing: 0.06em;
}
.topbar__meta {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--cream-2);
  opacity: 0.9;
}
.topbar__meta .dot { margin: 0 8px; color: var(--brass); }

/* ---------------- Hero / 3D shelf ---------------- */
.hero {
  position: relative;
  background: linear-gradient(180deg, var(--green-2) 0%, var(--green) 55%, #2a4a40 100%);
  height: min(72vh, 640px);
  min-height: 420px;
  overflow: hidden;
}
.hero__canvas { position: absolute; inset: 0; cursor: grab; }
.hero__canvas:active { cursor: grabbing; }
.hero__caption {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--cream-2);
  background: rgba(23, 43, 37, 0.55);
  padding: 6px 14px;
  border-radius: 999px;
  letter-spacing: 0.02em;
  pointer-events: none;
}
.hero__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--cream-2);
  font-family: var(--font-display);
  font-size: 22px;
  gap: 6px;
}
.hero__empty .muted {
  font-family: var(--font-body);
  font-size: 14px;
  color: rgba(242, 236, 220, 0.6);
}

/* ---------------- Book detail floating card ---------------- */
.book-detail {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 280px;
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  display: flex;
  gap: 12px;
  border-left: 5px solid var(--stamp);
}
.book-detail__image {
  width: 64px;
  height: 96px;
  flex-shrink: 0;
  background: var(--oak);
  background-size: cover;
  background-position: center;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.15);
}
.book-detail__close {
  position: absolute;
  top: 6px;
  right: 8px;
  border: none;
  background: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: var(--ink-soft);
}
.book-detail__call {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--stamp);
  margin: 0 0 4px;
  letter-spacing: 0.03em;
}
.book-detail__body h3 {
  font-family: var(--font-display);
  font-size: 17px;
  margin: 0 0 8px;
  line-height: 1.25;
}
.book-detail__facts {
  display: flex;
  gap: 18px;
  margin: 0 0 10px;
  font-size: 13px;
}
.book-detail__facts dt {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  color: var(--ink-soft);
  letter-spacing: 0.05em;
}
.book-detail__facts dd { margin: 2px 0 0; font-weight: 600; }
.book-detail__actions { display: flex; gap: 8px; }

/* ---------------- Layout ---------------- */
.layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 28px;
  max-width: 1200px;
  margin: -32px auto 0;
  padding: 0 24px 60px;
  position: relative;
  z-index: 2;
}
@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; margin-top: -18px; }
}

.panel {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 22px 22px 24px;
}
.panel h2 {
  font-family: var(--font-display);
  font-size: 19px;
  margin: 0 0 16px;
  color: var(--green);
}
.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.panel__header h2 { margin: 0; }
.panel__header input[type="search"] {
  flex: 1;
  max-width: 220px;
}

/* ---------------- Form ---------------- */
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; font-size: 13px; font-weight: 600; color: var(--ink-soft); }
.field-row { display: flex; gap: 12px; }
.field--small { flex: 1; }
.req { color: var(--stamp); font-weight: 500; text-transform: lowercase; font-size: 11px; }
.opt { color: var(--ink-soft); font-weight: 400; text-transform: lowercase; font-size: 11px; }

input[type="text"], input[type="number"], input[type="search"], input[type="file"] {
  border: 1.5px solid var(--cream-2);
  background: #fff;
  border-radius: var(--radius);
  padding: 9px 10px;
  font-size: 14px;
  color: var(--ink);
  font-family: var(--font-body);
}
input[type="text"]:focus, input[type="number"]:focus, input[type="search"]:focus {
  outline: none;
  border-color: var(--brass);
  box-shadow: 0 0 0 3px rgba(185, 138, 70, 0.2);
}
input[type="file"] { padding: 6px; font-size: 13px; }

.image-preview { display: flex; align-items: center; gap: 10px; margin: -4px 0 14px; }
.image-preview img { width: 46px; height: 68px; object-fit: cover; border-radius: 2px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); }
.link-btn { background: none; border: none; color: var(--stamp); font-size: 12px; cursor: pointer; text-decoration: underline; padding: 0; }

.form-error {
  background: rgba(166, 61, 64, 0.1);
  color: var(--stamp);
  border-radius: var(--radius);
  padding: 8px 10px;
  font-size: 13px;
  margin: 0 0 14px;
}

.form-actions { display: flex; gap: 10px; }

.btn {
  border: none;
  border-radius: var(--radius);
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-body);
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}
.btn:active { transform: translateY(1px); }
.btn--primary { background: var(--brass); color: #241a0c; }
.btn--primary:hover { background: var(--brass-light); }
.btn--ghost { background: transparent; color: var(--green); box-shadow: inset 0 0 0 1.5px var(--cream-2); }
.btn--ghost:hover { box-shadow: inset 0 0 0 1.5px var(--brass); }
.btn--danger { background: transparent; color: var(--stamp); box-shadow: inset 0 0 0 1.5px rgba(166,61,64,0.4); }
.btn--danger:hover { background: rgba(166,61,64,0.08); }
.btn--sm { padding: 6px 10px; font-size: 12px; }
.hidden { display: none !important; }

/* ---------------- Catalog list ---------------- */
.catalog-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; max-height: 560px; overflow-y: auto; }
.catalog-empty { color: var(--ink-soft); font-size: 14px; padding: 20px 0; text-align: center; }

.catalog-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border-radius: var(--radius);
  border: 1px solid var(--cream-2);
  background: #fffef9;
}
.catalog-card__thumb {
  width: 42px;
  height: 60px;
  border-radius: 2px;
  background: var(--oak);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.15);
}
.catalog-card__body { flex: 1; min-width: 0; }
.catalog-card__title {
  font-family: var(--font-display);
  font-size: 15px;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.catalog-card__meta {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--ink-soft);
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.catalog-card__actions { display: flex; gap: 6px; flex-shrink: 0; }

/* ---------------- Footer ---------------- */
.footer {
  text-align: center;
  padding: 24px;
  font-size: 12px;
  color: var(--ink-soft);
}
