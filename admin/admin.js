const uploadForm = document.getElementById("upload-form");
const adminPortfolioGrid = document.getElementById("admin-portfolio-grid");
const adminNote = document.getElementById("admin-note");
const resetButton = document.getElementById("reset-portfolio");
const metricTotal = document.getElementById("metric-total");
const metricLogos = document.getElementById("metric-logos");
const metricMixed = document.getElementById("metric-mixed");

let portfolioItems = [];
loadPortfolio();

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
  const response = await fetch("/api/portfolio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, category, description, image })
  });

  if (!response.ok) {
    adminNote.textContent = "Upload failed. Please try again.";
    return;
  }

  uploadForm.reset();
  adminNote.textContent = "Portfolio item uploaded. It is now live on the website.";
  await loadPortfolio();
});

resetButton.addEventListener("click", async () => {
  const response = await fetch("/api/portfolio/reset", { method: "POST" });
  if (!response.ok) {
    adminNote.textContent = "Reset failed. Please try again.";
    return;
  }

  adminNote.textContent = "Portfolio reset to the default showcase items.";
  await loadPortfolio();
});

async function loadPortfolio() {
  try {
    const response = await fetch("/api/portfolio", { cache: "no-store" });
    portfolioItems = await response.json();
  } catch (error) {
    portfolioItems = [];
  }

  renderPortfolio();
  updateMetrics();
}

function renderPortfolio() {
  adminPortfolioGrid.innerHTML = portfolioItems
    .map(
      (item) => `
        <article class="portfolio-card admin-card">
          <figure>
            <img src="${item.image}" alt="${escapeHtml(item.title)}">
          </figure>
          <span class="tag">${formatCategory(item.category)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <button class="button button-dark delete-button" type="button" data-id="${item.id}">Delete</button>
        </article>
      `
    )
    .join("");

  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const response = await fetch(`/api/portfolio/${button.dataset.id}`, { method: "DELETE" });
      if (!response.ok) {
        adminNote.textContent = "Delete failed. Please try again.";
        return;
      }

      adminNote.textContent = "Portfolio item removed from the website.";
      await loadPortfolio();
    });
  });
}

function updateMetrics() {
  const logos = portfolioItems.filter((item) => item.category === "logos").length;
  const mixed = portfolioItems.length - logos;

  metricTotal.textContent = String(portfolioItems.length);
  metricLogos.textContent = String(logos);
  metricMixed.textContent = String(mixed);
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
