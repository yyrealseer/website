var swiper = new Swiper("#track-compilation", {
  effect: "coverflow",
  grabCursor: false,
  centeredSlides: true,
  loop: false,
  slidesPerView: "auto",
  coverflowEffect: {
    rotate: 20,
    stretch: 0,
    depth: 10,
    modifier: 2.5,
    slideShadows: true,
  },
  pagination: {
    el: ".swiper-pagination",
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
    
  },
});