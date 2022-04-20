function getCurrentTheme() {
  let theme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  localStorage.getItem("er-color-scheme")
    ? (theme = localStorage.getItem("er-color-scheme"))
    : null;
  return theme;
}

function loadTheme(theme) {
  const root = document.querySelector(":root");
  root.setAttribute("color-scheme", theme);
  localStorage.setItem("er-color-scheme", theme);
}

function switchTheme() {
  var theme;
  getCurrentTheme() == "dark" ? (theme = "light") : (theme = "dark");
  loadTheme(theme);
}

loadTheme(getCurrentTheme());

// add event listener to calls theme-toggle to switch theme once page is loaded
document.addEventListener("DOMContentLoaded", init, false);
function init() {
  // Add this manually after content load to avoid the navbar exapnding on page load
  let button = document.createElement("button");
  button.innerHTML = `<svg class="fa fa-lg fa-adjust"></svg>`;
  button.type = "button";
  button.title = "Toggle dark mode";
  button.classList.add("theme-toggle");
  document.querySelector(".navbar-text").appendChild(button);
  button.addEventListener("click", switchTheme, true);
}
