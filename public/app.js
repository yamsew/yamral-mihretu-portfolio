
const $ = (s) => document.querySelector(s);

let language = "en";

// Current year
const yearElement = $("#year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Language switch
const langButton = $("#lang");

if (langButton) {
  langButton.addEventListener("click", () => {
    language = language === "en" ? "am" : "en";

    document.documentElement.lang = language;

    document.querySelectorAll("[data-en]").forEach((el) => {
      el.innerHTML = el.dataset[language];
    });

    langButton.textContent = language === "en" ? "አማ" : "EN";
  });
}

// Dark / Light theme
const themeButton = $("#theme");

if (themeButton) {
  themeButton.addEventListener("click", () => {
    document.body.dataset.theme =
      document.body.dataset.theme === "light" ? "dark" : "light";
  });
}

// Mobile menu
const menuButton = $("#menu");
const nav = $("#nav");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
    });
  });
}

// Load projects
async function loadProjects() {
  const box = $("#projectList");

  if (!box) return;

  try {
    const response = await fetch("/api/projects");

    if (!response.ok) {
      throw new Error("Could not load projects.");
    }

    const projects = await response.json();

    box.innerHTML = projects.map((p) => `
      <article class="panel">
        <div class="emoji">✦</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>
        <span class="muted">${escapeHtml(p.category)}</span>
      </article>
    `).join("");

  } catch (error) {
    box.innerHTML = `
      <article class="panel">
        <p>Projects could not be loaded right now.</p>
      </article>
    `;
    console.error("Projects error:", error);
  }
}

// Protect displayed text
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

// Contact form
const contactForm = $("#contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Keep a direct reference to the form
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const status = $("#formStatus");

    if (status) {
      status.textContent = "Sending...";
    }

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(Object.fromEntries(formData))
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not send message.");
      }

      if (status) {
        status.textContent = language === "am"
          ? "መልዕክትህ ተቀብሏል።"
          : "Your message has been received.";
      }

      // Clear the form safely
      if (formElement && typeof formElement.reset === "function") {
        formElement.reset();
      }

    } catch (error) {
      if (status) {
        status.textContent = error.message;
      }

      console.error("Contact form error:", error);
    }
  });
}

// Start loading projects
loadProjects();
