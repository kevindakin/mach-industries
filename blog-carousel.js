function blogCarousel() {
  const wrapper = document.querySelector(".blog_carousel_wrap");

  if (!wrapper) return;

  const slider = wrapper.querySelector(".blog_carousel_cms.swiper");
  const arrowPrev = wrapper.querySelector(".blog_carousel_arrow.swiper-prev");
  const arrowNext = wrapper.querySelector(".blog_carousel_arrow.swiper-next");

  let swiper = new Swiper(slider, {
    slidesPerView: "auto",
    spaceBetween: 0,
    speed: 400,
    watchOverflow: true,
    navigation: {
      nextEl: arrowNext,
      prevEl: arrowPrev,
    },
  });
}

document.addEventListener("DOMContentLoaded", function () {
  blogCarousel();
});