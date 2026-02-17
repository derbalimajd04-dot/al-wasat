const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // If element is in view → show
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      } else {
        // If element leaves view → hide (so it can animate again)
        entry.target.classList.remove("show");
      }
    });
  },
  {
    threshold: 0.2,
    rootMargin: "0px 0px -10% 0px" // makes it feel slightly delayed/premium
  }
);

reveals.forEach((el) => observer.observe(el));

// HERO DARKEN ON SCROLL
const hero = document.querySelector(".hero");
const overlay = document.querySelector(".overlay");

window.addEventListener("scroll", () => {
  const heroHeight = hero.offsetHeight;
  const scrollPosition = window.scrollY;

  // calculate scroll percentage within hero
  let progress = scrollPosition / heroHeight;

  if (progress > 1) progress = 1;

  // base opacity is 0.6 from CSS
  // we increase it slightly as user scrolls
  const newOpacity = 0.6 + progress * 0.3;

  overlay.style.background = `rgba(0,0,0,${newOpacity})`;
});

// NAVBAR DARKEN AFTER HERO
const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
  const heroHeight = document.querySelector(".hero").offsetHeight;

  if (window.scrollY > heroHeight * 0.7) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// SMOOTH SCROLL TO CONTACT (reliable)
const contactBtn = document.getElementById("contactBtn");
const contactSection = document.getElementById("contact");

if (contactBtn && contactSection) {
  contactBtn.addEventListener("click", () => {
    contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
