document.addEventListener("DOMContentLoaded", () => {
  
  /* ========================= */
  /* NAVBAR SCROLL EFFECT      */
  /* ========================= */
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      // When the user scrolls down 50px, add the dark glass background
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });
  }

  /* ========================= */
  /* SCROLL REVEAL ANIMATIONS  */
  /* ========================= */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    }, {
      threshold: 0.15 // Triggers when 15% of the element is visible
    });

    reveals.forEach((reveal) => {
      revealObserver.observe(reveal);
    });
  }

  /* ========================= */
  /* DESKTOP CONTACT BUTTON    */
  /* ========================= */
  const contactBtn = document.getElementById("contactBtn");
  if (contactBtn) {
    contactBtn.addEventListener("click", () => {
      window.location.href = "/#contact";
    });
  }

  /* ========================= */
  /* MOBILE MENU LOGIC         */
  /* ========================= */
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileContactBtn = document.getElementById("mobileContactBtn");

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener("click", () => {
      // Toggle the X animation on the hamburger icon
      hamburgerBtn.classList.toggle("active");
      // Fade the dark glass menu in and out
      mobileMenu.classList.toggle("active");

      // Prevent the user from scrolling the page in the background
      if (mobileMenu.classList.contains("active")) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });
  }

  // Close the mobile menu if they click the Contact button inside it
  if (mobileContactBtn) {
    mobileContactBtn.addEventListener("click", () => {
      hamburgerBtn.classList.remove("active");
      mobileMenu.classList.remove("active");
      document.body.style.overflow = "";
      
      window.location.href = "/#contact";
    });
  }

  /* ========================= */
  /* MOBILE SWIPE INDICATORS   */
  /* ========================= */
  const shopGrid = document.getElementById("shopGrid");
  const dots = document.querySelectorAll(".carousel-indicators .dot");

  if (shopGrid && dots.length > 0) {
    shopGrid.addEventListener("scroll", () => {
      // Calculate how far the user has swiped
      const maxScroll = shopGrid.scrollWidth - shopGrid.clientWidth;
      if (maxScroll <= 0) return; 

      // Figure out which product is in the center of the screen (0 to 3)
      let activeIndex = Math.round((shopGrid.scrollLeft / maxScroll) * (dots.length - 1));
      
      // Safety limits
      if (activeIndex < 0) activeIndex = 0;
      if (activeIndex >= dots.length) activeIndex = dots.length - 1;

      // Update the little square dots to match the active product
      dots.forEach((dot, index) => {
        if (index === activeIndex) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });
    });
  }

});