(function () {
  "use strict";

  function setYear() {
    document.querySelectorAll("[data-current-year]").forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function initializeHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;
    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 16);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initializeVideos() {
    document.querySelectorAll("[data-video-card]").forEach(function (card) {
      var button = card.querySelector("[data-play-video]");
      var videoId = card.getAttribute("data-video-id") || "";
      var title = card.getAttribute("data-video-title") || "Best Carriers video";
      if (!button || !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) return;
      button.addEventListener("click", function () {
        if (card.classList.contains("is-playing")) return;
        var iframe = document.createElement("iframe");
        iframe.title = title;
        iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId) + "?autoplay=1&rel=0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allowFullscreen = true;
        card.replaceChildren(iframe);
        card.classList.add("is-playing");
      });
    });
  }

  function initializeFaq() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".faq-list details"));
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  function copyLivePrice() {
    var mobile = document.querySelector("[data-mobile-price]");
    if (!mobile) return;
    var price = document.querySelector(".opinx-checkout-model span");
    if (price && price.textContent.trim()) mobile.textContent = "· " + price.textContent.trim();
  }

  function initializePriceObserver() {
    copyLivePrice();
    if (!window.MutationObserver) return;
    var checkout = document.querySelector("[data-motus-checkout]");
    if (!checkout) return;
    var observer = new MutationObserver(copyLivePrice);
    observer.observe(checkout, { childList: true, subtree: true, characterData: true });
  }

  function ready() {
    setYear();
    initializeHeader();
    initializeVideos();
    initializeFaq();
    initializePriceObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
}());
