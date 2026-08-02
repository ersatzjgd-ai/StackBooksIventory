import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// =============================================================================
// Constants / helpers
// =============================================================================
const SPINE_PALETTE = [
  0x6b2d33, // wine
  0x1f3b33, // forest
  0x1b3a5c, // navy
  0x8a5a3b, // oak
  0x5c4a72, // plum
  0x9c6b1f, // ochre
  0x2c5c58, // teal
  0x7a3b2e, // brick
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function deriveCallNumber(title) {
  const h = hashString(title);
  const num = (100 + (h % 899)).toString();
  const dec = (h % 10).toString();
  const letters = (title.replace(/[^a-zA-Z]/g, "").slice(0, 3) || "XXX").toUpperCase();
  return `${num}.${dec} ${letters}`;
}

function pickColor(title) {
  return SPINE_PALETTE[hashString(title) % SPINE_PALETTE.length];
}

function hexToCss(hex) {
  return "#" + hex.toString(16).padStart(6, "0");
}

// Build a canvas texture for a book's front face. Uses the cover photo if
// present, otherwise a generated "spine label" in a library-card style.
function buildSpineCanvas(book) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const callNumber = deriveCallNumber(book.title);

    const drawLabelStrip = () => {
      const stripH = 64;
      ctx.fillStyle = "rgba(20, 16, 10, 0.72)";
      ctx.fillRect(0, canvas.height - stripH, canvas.width, stripH);
      ctx.fillStyle = "#d9b171";
      ctx.font = "600 20px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(callNumber, canvas.width / 2, canvas.height - stripH / 2 - 10);
      if (book.quantity > 1) {
        ctx.font = "500 15px 'IBM Plex Mono', monospace";
        ctx.fillStyle = "#f2ecdc";
        ctx.fillText(`× ${book.quantity} copies`, canvas.width / 2, canvas.height - 14);
      }
    };

    if (book.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        drawLabelStrip();
        resolve(canvas);
      };
      img.onerror = () => {
        drawGeneratedLabel();
        resolve(canvas);
      };
      img.src = book.imageUrl;
      return;
    }

    drawGeneratedLabel();
    resolve(canvas);

    function drawGeneratedLabel() {
      const color = pickColor(book.title);
      ctx.fillStyle = hexToCss(color);
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // brass rules near top and bottom of the spine
      ctx.strokeStyle = "#d9b171";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, 28);
      ctx.lineTo(canvas.width - 14, 28);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(14, canvas.height - 90);
      ctx.lineTo(canvas.width - 14, canvas.height - 90);
      ctx.stroke();

      // vertical title, rotated like a real spine
      ctx.save();
      ctx.translate(canvas.width / 2 + 8, canvas.height / 2 - 30);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#f2ecdc";
      ctx.font = "500 30px 'Fraunces', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let title = book.title;
      if (title.length > 34) title = title.slice(0, 32) + "…";
      ctx.fillText(title, 0, 0);
      ctx.restore();

      drawLabelStrip();
    }
  });
}

// =============================================================================
// Scene setup
// =============================================================================
const container = document.getElementById("shelfCanvas");
const emptyState = document.getElementById("shelfEmpty");

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 2.4, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * 0.62;
controls.target.set(0, 1.4, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const keyLight = new THREE.DirectionalLight(0xfff1d8, 0.9);
keyLight.position.set(4, 6, 6);
scene.add(keyLight);
const fillLight = new THREE.PointLight(0xd9b171, 0.6, 20);
fillLight.position.set(-4, 3, 4);
scene.add(fillLight);

const shelfGroup = new THREE.Group();
scene.add(shelfGroup);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoverable = [];
let selectedMesh = null;

function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener("resize", resize);
resize();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// =============================================================================
// Shelf building
// =============================================================================
const SPINE_WIDTH = 0.26;
const SPINE_DEPTH = 0.6;
const SHELF_GAP_Y = 2.05;
const SHELF_PLANK_H = 0.12;
const SHELF_PLANK_D = 0.85;

async function rebuildShelves(books) {
  while (shelfGroup.children.length) {
    const obj = shelfGroup.children.pop();
    obj.traverse?.((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (c.material.map) c.material.map.dispose();
        c.material.dispose();
      }
    });
  }
  hoverable = [];
  hideDetail();

  emptyState.classList.toggle("hidden", books.length > 0);
  if (!books.length) return;

  const groups = new Map();
  books.forEach((b) => {
    const key = b.location || "Unsorted";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  });

  const locations = [...groups.keys()].sort((a, b) =>
    a === "Unsorted" ? 1 : b === "Unsorted" ? -1 : a.localeCompare(b)
  );

  const textures = await Promise.all(
    books.map((b) => buildSpineCanvas(b).then((canvas) => [b.id, new THREE.CanvasTexture(canvas)]))
  );
  const textureById = new Map(textures);

  let maxShelfWidth = 4;
  const shelfRows = locations.map((loc) => {
    const items = groups.get(loc);
    const width = Math.max(4, items.reduce((sum, b) => sum + SPINE_WIDTH + 0.045, 0.6));
    maxShelfWidth = Math.max(maxShelfWidth, width);
    return { loc, items, width };
  });

  const totalHeight = shelfRows.length * SHELF_GAP_Y;

  shelfRows.forEach((row, rowIndex) => {
    const y = totalHeight - rowIndex * SHELF_GAP_Y;
    const rowGroup = new THREE.Group();
    rowGroup.position.set(0, y, 0);

    // shelf plank
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(maxShelfWidth + 0.5, SHELF_PLANK_H, SHELF_PLANK_D),
      new THREE.MeshStandardMaterial({ color: 0x6b4429, roughness: 0.85 })
    );
    plank.position.y = -SHELF_PLANK_H / 2;
    rowGroup.add(plank);

    // location plaque
    const plaqueCanvas = document.createElement("canvas");
    plaqueCanvas.width = 512;
    plaqueCanvas.height = 96;
    const pctx = plaqueCanvas.getContext("2d");
    pctx.fillStyle = "#1f3b33";
    pctx.fillRect(0, 0, plaqueCanvas.width, plaqueCanvas.height);
    pctx.fillStyle = "#d9b171";
    pctx.font = "600 40px 'IBM Plex Mono', monospace";
    pctx.textAlign = "center";
    pctx.textBaseline = "middle";
    pctx.fillText(row.loc.toUpperCase(), plaqueCanvas.width / 2, plaqueCanvas.height / 2);
    const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.3),
      new THREE.MeshBasicMaterial({ map: plaqueTex, transparent: true })
    );
    plaque.position.set(-(maxShelfWidth + 0.5) / 2 + 0.85, -SHELF_PLANK_H - 0.22, SHELF_PLANK_D / 2 + 0.01);
    rowGroup.add(plaque);

    // books
    let cursorX = -(row.width) / 2 + 0.1;
    row.items.forEach((book) => {
      const h = 0.82 + (hashString(book.title + "h") % 60) / 100; // 0.82 - 1.42
      const geo = new THREE.BoxGeometry(SPINE_WIDTH, h, SPINE_DEPTH);
      const sideColor = new THREE.Color(pickColor(book.title)).multiplyScalar(0.75);
      const sideMat = new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.7 });
      const pageMat = new THREE.MeshStandardMaterial({ color: 0xe9e1cb, roughness: 0.9 });
      const frontMat = new THREE.MeshStandardMaterial({
        map: textureById.get(book.id),
        roughness: 0.55,
      });
      const materials = [sideMat, sideMat, pageMat, pageMat, frontMat, sideMat];
      const mesh = new THREE.Mesh(geo, materials);
      mesh.position.set(cursorX + SPINE_WIDTH / 2, h / 2, 0);
      mesh.userData.bookId = book.id;
      mesh.userData.baseY = h / 2;
      rowGroup.add(mesh);
      hoverable.push(mesh);
      cursorX += SPINE_WIDTH + 0.045;
    });

    shelfGroup.add(rowGroup);
  });

  // Frame the camera around the shelving unit
  const dist = Math.max(6, maxShelfWidth * 0.85, totalHeight * 1.6);
  camera.position.set(dist * 0.35, totalHeight * 0.55 + 1, dist);
  controls.target.set(0, totalHeight * 0.45, 0);
  controls.update();
}

// =============================================================================
// Selection / detail panel
// =============================================================================
const detailPanel = document.getElementById("bookDetail");
let currentBooks = [];

function hideDetail() {
  detailPanel.classList.add("hidden");
  if (selectedMesh) {
    selectedMesh.position.y = selectedMesh.userData.baseY;
    selectedMesh = null;
  }
}

function showDetailForMesh(mesh) {
  const book = currentBooks.find((b) => b.id === mesh.userData.bookId);
  if (!book) return;

  if (selectedMesh && selectedMesh !== mesh) {
    selectedMesh.position.y = selectedMesh.userData.baseY;
  }
  selectedMesh = mesh;
  mesh.position.y = mesh.userData.baseY + 0.18;

  document.getElementById("bookDetailCall").textContent = deriveCallNumber(book.title);
  document.getElementById("bookDetailTitle").textContent = book.title;
  document.getElementById("bookDetailQty").textContent = book.quantity;
  document.getElementById("bookDetailLocation").textContent = book.location || "—";
  const img = document.getElementById("bookDetailImage");
  if (book.imageUrl) {
    img.style.backgroundImage = `url("${book.imageUrl}")`;
  } else {
    img.style.backgroundImage = "none";
  }
  detailPanel.dataset.bookId = book.id;
  detailPanel.classList.remove("hidden");
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(hoverable, false);
  if (hits.length) {
    showDetailForMesh(hits[0].object);
  }
});

document.getElementById("closeDetail").addEventListener("click", hideDetail);

document.getElementById("bookDetailDelete").addEventListener("click", async () => {
  const id = detailPanel.dataset.bookId;
  if (!id) return;
  if (!confirm("Remove this title from the catalog?")) return;
  await fetch(`/api/books/${id}`, { method: "DELETE" });
  hideDetail();
  await loadBooks();
});

document.getElementById("bookDetailEdit").addEventListener("click", () => {
  const id = detailPanel.dataset.bookId;
  const book = currentBooks.find((b) => String(b.id) === String(id));
  if (book) startEdit(book);
});

// =============================================================================
// Catalog list + form
// =============================================================================
const form = document.getElementById("bookForm");
const titleInput = document.getElementById("title");
const quantityInput = document.getElementById("quantity");
const locationInput = document.getElementById("location");
const imageInput = document.getElementById("image");
const editingIdInput = document.getElementById("editingId");
const formHeading = document.getElementById("formHeading");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formError = document.getElementById("formError");
const imagePreviewWrap = document.getElementById("imagePreviewWrap");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");
const searchInput = document.getElementById("searchInput");
const catalogList = document.getElementById("catalogList");
const catalogEmpty = document.getElementById("catalogEmpty");
const bookCountEl = document.getElementById("bookCount");
const copyCountEl = document.getElementById("copyCount");

let removeExistingImage = false;

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;
  removeExistingImage = false;
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreviewWrap.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

removeImageBtn.addEventListener("click", () => {
  imageInput.value = "";
  imagePreviewWrap.classList.add("hidden");
  removeExistingImage = true;
});

function resetForm() {
  form.reset();
  editingIdInput.value = "";
  formHeading.textContent = "Add to the catalog";
  submitBtn.textContent = "Add book";
  cancelEditBtn.classList.add("hidden");
  imagePreviewWrap.classList.add("hidden");
  removeExistingImage = false;
  formError.classList.add("hidden");
}

function startEdit(book) {
  editingIdInput.value = book.id;
  titleInput.value = book.title;
  quantityInput.value = book.quantity;
  locationInput.value = book.location || "";
  removeExistingImage = false;
  imageInput.value = "";
  if (book.imageUrl) {
    imagePreview.src = book.imageUrl;
    imagePreviewWrap.classList.remove("hidden");
  } else {
    imagePreviewWrap.classList.add("hidden");
  }
  formHeading.textContent = `Editing “${book.title}”`;
  submitBtn.textContent = "Save changes";
  cancelEditBtn.classList.remove("hidden");
  formError.classList.add("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

cancelEditBtn.addEventListener("click", resetForm);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.classList.add("hidden");

  const title = titleInput.value.trim();
  if (!title) {
    formError.textContent = "Please give the book a title.";
    formError.classList.remove("hidden");
    return;
  }

  const fd = new FormData();
  fd.append("title", title);
  fd.append("quantity", quantityInput.value || "1");
  fd.append("location", locationInput.value.trim());
  if (imageInput.files[0]) fd.append("image", imageInput.files[0]);
  if (removeExistingImage) fd.append("removeImage", "true");

  const editingId = editingIdInput.value;
  submitBtn.disabled = true;
  try {
    const res = await fetch(editingId ? `/api/books/${editingId}` : "/api/books", {
      method: editingId ? "PUT" : "POST",
      body: fd,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Something went wrong saving this book.");
    }
    resetForm();
    await loadBooks();
  } catch (err) {
    formError.textContent = err.message;
    formError.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
  }
});

searchInput.addEventListener("input", () => renderCatalogList(currentBooks));

function renderCatalogList(books) {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = q
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) || (b.location || "").toLowerCase().includes(q)
      )
    : books;

  catalogList.innerHTML = "";
  catalogEmpty.classList.toggle("hidden", filtered.length > 0);

  filtered.forEach((book) => {
    const li = document.createElement("li");
    li.className = "catalog-card";
    const thumb = document.createElement("div");
    thumb.className = "catalog-card__thumb";
    if (book.imageUrl) thumb.style.backgroundImage = `url("${book.imageUrl}")`;

    const body = document.createElement("div");
    body.className = "catalog-card__body";
    const title = document.createElement("p");
    title.className = "catalog-card__title";
    title.textContent = book.title;
    const meta = document.createElement("div");
    meta.className = "catalog-card__meta";
    meta.innerHTML = `<span>qty ${book.quantity}</span><span>${book.location || "no location"}</span>`;
    body.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "catalog-card__actions";
    const editBtn = document.createElement("button");
    editBtn.className = "btn btn--ghost btn--sm";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEdit(book));
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn--danger btn--sm";
    delBtn.textContent = "Remove";
    delBtn.addEventListener("click", async () => {
      if (!confirm(`Remove "${book.title}" from the catalog?`)) return;
      await fetch(`/api/books/${book.id}`, { method: "DELETE" });
      await loadBooks();
    });
    actions.append(editBtn, delBtn);

    li.append(thumb, body, actions);
    catalogList.appendChild(li);
  });
}

function updateCounts(books) {
  const titles = books.length;
  const copies = books.reduce((sum, b) => sum + (b.quantity || 0), 0);
  bookCountEl.textContent = `${titles} title${titles === 1 ? "" : "s"}`;
  copyCountEl.textContent = `${copies} cop${copies === 1 ? "y" : "ies"}`;
}

async function loadBooks() {
  const res = await fetch("/api/books");
  const books = await res.json();
  currentBooks = books;
  updateCounts(books);
  renderCatalogList(books);
  await rebuildShelves(books);
}

loadBooks();
