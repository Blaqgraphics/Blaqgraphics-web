const contactConfig = {
  email: "talk2blaqgraphicslivee@gmail.com",
  instagram: "https://www.instagram.com/blaq.graphics_?igsh=MWd0bHp5b2M4dTJsZw%3D%3D&utm_source=qr",
};

const portfolioGrid = document.getElementById("portfolio-grid");
const filterButtons = document.querySelectorAll(".tab-button");
const quoteForm = document.getElementById("quote-form");
const formNote = document.getElementById("form-note");
const formFeedback = document.getElementById("form-feedback");
const topbar = document.getElementById("topbar");
const scrollProgress = document.getElementById("scroll-progress");
const magneticButtons = document.querySelectorAll(".magnetic");
const backToTopButton = document.getElementById("back-to-top");
let feedbackTimeoutId;
let isSubmittingQuote = false;

let activeFilter = "all";
let portfolioItems = [];

applyContactConfig();
initRevealAnimations();
initScrollEffects();
initMagneticButtons();
initBackToTop();
loadPortfolio();

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderPortfolio();
  });
});

quoteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (isSubmittingQuote) {
    return;
  }

  isSubmittingQuote = true;

  const submitButton = quoteForm.querySelector('button[type="submit"]');
  const name = document.getElementById("client-name").value.trim();
  const email = document.getElementById("client-email").value.trim();
  const service = document.getElementById("service-type").value;
  const route = document.getElementById("contact-route").value;
  const details = document.getElementById("project-details").value.trim();

  let feedbackMessage = "Your quote request has been sent successfully. I will review it and get back to you soon.";

  if (route === "both") {
    feedbackMessage = "Your quote request has been sent successfully. I will review it, reply by email, and continue follow-up on Instagram too.";
  } else if (route === "instagram") {
    feedbackMessage = "Your quote request has been sent successfully. I will review it and follow up with you on Instagram.";
  }

  if (submitButton) {
    submitButton.disabled = true;
  }

  showFormFeedback(feedbackMessage, "success");

  const payload = {
    name,
    email,
    service,
    followUpPreference: route,
    details
  };

  quoteForm.reset();

  fetch("/api/quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    cache: "no-store",
    keepalive: true,
    body: JSON.stringify(payload)
  }).catch((error) => {
    console.error("Quote form submission error:", error);
  }).finally(() => {
    setTimeout(() => {
      isSubmittingQuote = false;
      if (submitButton) {
        submitButton.disabled = false;
      }
    }, 700);
  });
});

function showFormFeedback(message, type = "success") {
  if (!formFeedback) {
    return;
  }

  if (feedbackTimeoutId) {
    clearTimeout(feedbackTimeoutId);
  }

  formFeedback.textContent = message;
  formFeedback.classList.remove("success", "error");
  formFeedback.classList.add("is-visible", type);
  formFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });

  feedbackTimeoutId = setTimeout(() => {
    formFeedback.classList.remove("is-visible", "success", "error");
    formFeedback.textContent = "";
  }, 4200);
}

async function loadPortfolio() {
  try {
    const response = await fetch("/api/portfolio", { cache: "no-store" });
    portfolioItems = await response.json();
  } catch (error) {
    portfolioItems = [];
  }

  renderPortfolio();
}

function renderPortfolio() {
  const itemsToRender = activeFilter === "all"
    ? portfolioItems
    : portfolioItems.filter((item) => item.category === activeFilter);

  if (!itemsToRender.length) {
    portfolioGrid.innerHTML = '<article class="portfolio-card reveal is-visible"><h3>Portfolio coming soon</h3><p>Fresh work will appear here as soon as it is published from the admin dashboard.</p></article>';
    return;
  }

  portfolioGrid.innerHTML = itemsToRender
    .map(
      (item, index) => `
        <article class="portfolio-card reveal is-visible" style="transition-delay:${index * 80}ms">
          <figure>
            <img src="${item.image}" alt="${escapeHtml(item.title)}">
          </figure>
          <span class="tag">${formatCategory(item.category)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `
    )
    .join("");
}

function formatCategory(category) {
  if (category === "web") {
    return "Web / App";
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}

function applyContactConfig() {
  const emailLink = document.getElementById("email-link");
  const instagramLink = document.getElementById("instagram-link");

  if (emailLink) {
    emailLink.href = `mailto:${contactConfig.email}`;
    emailLink.textContent = contactConfig.email;
  }

  if (instagramLink) {
    instagramLink.href = contactConfig.instagram;
    instagramLink.textContent = "@blaq.graphics_";
  }
}

function initRevealAnimations() {
  const revealNodes = document.querySelectorAll("[data-reveal]");

  if (!revealNodes.length) {
    return;
  }

  document.body.classList.add("motion-ready");

  revealNodes.forEach((node, index) => {
    node.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      node.classList.add("is-visible");
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  }, { threshold: 0.18 });

  revealNodes.forEach((node) => observer.observe(node));
}

function initScrollEffects() {
  const updateScroll = () => {
    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? (scrollTop / height) * 100 : 0;

    scrollProgress.style.width = `${progress}%`;
    topbar.classList.toggle("is-scrolled", scrollTop > 18);
  };

  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });
}

function initMagneticButtons() {
  magneticButtons.forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translate(0, 0)";
    });
  });
}

function initBackToTop() {
  if (!backToTopButton) {
    return;
  }

  const toggleButton = () => {
    backToTopButton.classList.toggle("is-visible", window.scrollY > 520);
  };

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  toggleButton();
  window.addEventListener("scroll", toggleButton, { passive: true });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


















