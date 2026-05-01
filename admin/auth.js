const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutButton = document.getElementById("logout-button");

bootstrap();

async function bootstrap() {
  const session = await fetchSession();

  if (isLoginPage() && session.authenticated) {
    window.location.replace("/admin/panel.html");
    return;
  }

  if (isPanelPage() && !session.authenticated) {
    window.location.replace("/admin/");
    return;
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.classList.add("hidden");

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      window.location.replace("/admin/panel.html");
      return;
    }

    loginError.classList.remove("hidden");
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.replace("/admin/");
  });
}

function isLoginPage() {
  return window.location.pathname === "/admin/" || window.location.pathname === "/admin/index.html";
}

function isPanelPage() {
  return window.location.pathname === "/admin/panel.html";
}

async function fetchSession() {
  try {
    const response = await fetch("/api/session", { cache: "no-store" });
    return await response.json();
  } catch (error) {
    return { authenticated: false };
  }
}
