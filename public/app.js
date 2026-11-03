const $ = (s) => document.querySelector(s);
let language = "en";
$("#year").textContent = new Date().getFullYear();
$("#lang").addEventListener("click", () => {
  language = language === "en" ? "am" : "en";
  document.documentElement.lang = language;
  document.querySelectorAll("[data-en]").forEach(el => {
    el.innerHTML = el.dataset[language];
  });
  $("#lang").textContent = language === "en" ? "አማ" : "EN";
});
$("#theme").addEventListener("click", () => {
  document.body.dataset.theme = document.body.dataset.theme === "light" ? "dark" : "light";
});
$("#menu").addEventListener("click", () => $("#nav").classList.toggle("open"));
$("#nav").querySelectorAll("a").forEach(a => a.addEventListener("click", () => $("#nav").classList.remove("open")));

async function loadProjects() {
  const box = $("#projectList");
  try {
    const response = await fetch("/api/projects");
    const projects = await response.json();
    box.innerHTML = projects.map(p => `<article class="panel"><div class="emoji">✦</div><small class="kicker"></small><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description)}</p><span class="muted">${escapeHtml(p.category)}</span></article>`).join("");
  } catch {
    box.innerHTML = "<article class='panel'><p>Projects could not be loaded right now.</p></article>";
  }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
$("#contactForm").addEventListener("submit", async e => {
  e.preventDefault();

  const formElement = e.currentTarget;
  const form = new FormData(formElement);
  const status = $("#formStatus");

  status.textContent = "Sending…";

  try {
    const r = await fetch("/api/messages", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(Object.fromEntries(form))
    });

    const data = await r.json();

    if (!r.ok) throw new Error(data.error || "Could not send message.");

    status.textContent = language === "am"
      ? "መልዕክትህ ተቀብሏል።"
      : "Your message has been received.";

    formElement.reset();

  } catch (err) {
    status.textContent = err.message;
  }
});
  } catch (err) { status.textContent = err.message; }
});
loadProjects();
