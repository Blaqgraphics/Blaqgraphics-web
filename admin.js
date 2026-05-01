const storageKey = "blaqgraphics-portfolio-items";
const uploadForm = document.getElementById("upload-form");
const adminPortfolioGrid = document.getElementById("admin-portfolio-grid");
const adminNote = document.getElementById("admin-note");
const resetButton = document.getElementById("reset-portfolio");

const defaultPortfolio = [
  {
    id: "default-logo-1",
    title: "Signature Logo Direction",
    category: "logos",
    description: "A premium identity concept designed to feel bold, polished, and memorable.",
    image: "assets/blaqgraphics-logo.jpeg",
  },
  {
    id: "default-graphics-1",
    title: "Social Promo Flyer",
    category: "graphics",
    description: "High-energy flyer layout style for events, offers, launches, and promotions.",
    image: createPlaceholderImage("Motion Flyer", "Graphics"),
  },
  {
    id: "default-web-1",
    title: "Business Website Concept",
    category: "web",
    description: "A clean digital presentation for brands that want to feel established online.",
    image: createPlaceholderImage("Website Build", "Digital"),
  },
  {
    id: "default-logo-2",
    title: "Luxury Brand Mark",
    category: "logos",
    description: "Identity work for businesses that need a richer, more premium first impression.",
    image: createPlaceholderImage("Logo Suite", "Branding"),
  },
  {
    id: "default-graphics-2",
    title: "Print Banner Direction",
    category: "graphics",
    description: "Outdoor-ready banners and event materials with strong visual hierarchy.",
    image: createPlaceholderImage("Banner Design", "Print"),
  },
  {
    id: "default-web-2",
    title: "Mobile App Preview",
    category: "web",
    description: "App interface presentation designed for bookings, product browsing, or customer flow.",
    image: createPlaceholderImage("Mobile App", "Experience"),
  },
];

let portfolioItems = loadPortfolioItems();
renderPortfolio();

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fileInput = document.getElementById("item-image");
  const title = document.getElementById("item-title").value.trim();
  const category = document.getElementById("item-category").value;
  const description = document.getElementById("item-description").value.trim();
  const file = fileInput.files[0];

  if (!file) {
    return;
  }

  const image = await readFileAsDataUrl(file);
  const newItem = {
    id: `custom-${Date.now()}`,
    title,
    category,
    description,
    image,
  };

  portfolioItems = [newItem, ...portfolioItems];
  savePortfolioItems();
  uploadForm.reset();
  adminNote.textContent = "Portfolio item uploaded. Refresh the website page to see it live.";
  renderPortfolio();
});

resetButton.addEventListener("click", () => {
  portfolioItems = defaultPortfolio;
  savePortfolioItems();
  adminNote.textContent = "Portfolio reset to default showcase items.";
  renderPortfolio();
});

function loadPortfolioItems() {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : defaultPortfolio;
  } catch (error) {
    return defaultPortfolio;
  }
}

function savePortfolioItems() {
  localStorage.setItem(storageKey, JSON.stringify(portfolioItems));
}

function renderPortfolio() {
  adminPortfolioGrid.innerHTML = portfolioItems
    .map(
      (item) => `
        <article class="portfolio-card admin-card">
          <figure>
            <img src="${item.image}" alt="${item.title}">
          </figure>
          <span class="tag">${formatCategory(item.category)}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <button class="button button-dark delete-button" type="button" data-id="${item.id}">Delete</button>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", () => {
      const { id } = button.dataset;
      portfolioItems = portfolioItems.filter((item) => item.id !== id);
      savePortfolioItems();
      renderPortfolio();
      adminNote.textContent = "Portfolio item removed from the website.";
    });
  });
}

function formatCategory(category) {
  if (category === "web") {
    return "Web / App";
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function createPlaceholderImage(title, label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#050505" />
          <stop offset="55%" stop-color="#1a1a1a" />
          <stop offset="100%" stop-color="#8c6114" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" />
      <circle cx="980" cy="160" r="170" fill="rgba(255,255,255,0.08)" />
      <circle cx="200" cy="760" r="240" fill="rgba(216,157,44,0.18)" />
      <rect x="74" y="72" width="1052" height="756" rx="38" fill="none" stroke="rgba(255,255,255,0.14)" />
      <text x="100" y="190" fill="#f0c972" font-size="42" font-family="Arial, sans-serif" letter-spacing="8">${label}</text>
      <text x="100" y="420" fill="#f7f4ef" font-size="92" font-weight="700" font-family="Arial, sans-serif">${title}</text>
      <text x="100" y="500" fill="#d9d9df" font-size="32" font-family="Arial, sans-serif">Blaqgraphics portfolio preview</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
