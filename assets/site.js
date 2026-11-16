// Small extras. The page works without this file: the nav stays open and one screenshot shows.
document.documentElement.classList.add("js");

const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
menu.hidden = false;
menu.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
  })
);

const screen = document.querySelector("#screen");
const switcher = document.querySelector(".switcher");
const buttons = switcher.querySelectorAll("button");
switcher.hidden = false;
buttons.forEach((button) =>
  button.addEventListener("click", () => {
    buttons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
    screen.src = button.dataset.src;
    screen.alt = button.dataset.alt;
  })
);
