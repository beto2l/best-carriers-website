(function () {
  "use strict";

  function setYear() {
    document.querySelectorAll("[data-current-year]").forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function initializeVideos() {
    document.querySelectorAll("[data-video-card]").forEach(function (card) {
      var buttons = card.querySelectorAll("[data-play-video]");
      var videoId = card.getAttribute("data-video-id") || "";
      var title = card.getAttribute("data-video-title") || "Best Carriers video";
      if (!buttons.length || !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) return;
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          if (card.classList.contains("is-playing")) return;
          var iframe = document.createElement("iframe");
          iframe.title = title;
          iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId) + "?autoplay=1&rel=0&modestbranding=1";
          iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
          iframe.referrerPolicy = "strict-origin-when-cross-origin";
          iframe.allowFullscreen = true;
          card.replaceChildren(iframe);
          card.classList.add("is-playing");
        });
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

  function enhanceSocialProof() {
    var locale = document.body.getAttribute("data-locale") || "es";
    var labels = locale === "es"
      ? { photosTitle: "Fotos de participantes", photosBody: "Una muestra de participantes de las capacitaciones de Best Carriers." }
      : { photosTitle: "Participant photos", photosBody: "A sample of participants in Best Carriers training programs." };

    document.querySelectorAll(".opinx-social-proof").forEach(function (proof) {
      var rating = proof.querySelector("header");
      if (rating) rating.setAttribute("aria-label", rating.textContent.trim());

      proof.querySelectorAll(".opinx-social-proof__reviews article footer span").forEach(function (ratingLabel) {
        ratingLabel.setAttribute("aria-label", ratingLabel.textContent.trim());
      });

      var reviews = proof.querySelector(".opinx-social-proof__reviews");
      var moreReviews = proof.querySelector(".opinx-social-proof__more--reviews");
      if (reviews && moreReviews) reviews.insertAdjacentElement("afterend", moreReviews);

      var photos = proof.querySelector(".opinx-social-proof__photos");
      if (photos && !proof.querySelector(".opinx-social-proof__photos-heading")) {
        var heading = document.createElement("div");
        heading.className = "opinx-social-proof__photos-heading";
        var title = document.createElement("h3");
        title.textContent = labels.photosTitle;
        var body = document.createElement("p");
        body.textContent = labels.photosBody;
        heading.append(title, body);
        photos.insertAdjacentElement("beforebegin", heading);
      }

      var morePhotos = proof.querySelector(".opinx-social-proof__more--photos");
      if (photos && morePhotos) photos.insertAdjacentElement("afterend", morePhotos);
    });
  }

  function ready() {
    setYear();
    initializeVideos();
    initializeFaq();
    enhanceSocialProof();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
}());
