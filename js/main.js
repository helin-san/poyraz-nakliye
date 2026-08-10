(function () {
  "use strict";

  /* Mobil menü aç/kapat */
  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  if (navToggle && header) {
    navToggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    document.querySelectorAll(".main-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* SSS akordeon */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    var answer = item.querySelector(".faq-answer");
    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");

      document.querySelectorAll(".faq-item.open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("open");
          openItem.querySelector(".faq-answer").style.maxHeight = null;
          openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        }
      });

      if (isOpen) {
        item.classList.remove("open");
        answer.style.maxHeight = null;
        question.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
        question.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* Teklif formu: WhatsApp'a hazır mesaj olarak gönder + FormSubmit ile e-posta yedeği */
  var form = document.getElementById("quote-form");
  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("submit-btn");
  var WHATSAPP_NUMBER = "905454771476";

  function triggerButtonSuccess(btn) {
    if (!btn || btn.classList.contains("is-success")) return;
    btn.classList.add("is-success");
    btn.disabled = true;
    setTimeout(function () {
      btn.classList.remove("is-success");
      btn.disabled = false;
    }, 2000);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var from = form.from.value.trim();
      var to = form.to.value.trim();

      if (!name || !phone || !from || !to) {
        e.preventDefault();
        showStatus("Lütfen zorunlu alanları (Ad Soyad, Telefon, Nereden, Nereye) doldurun.", false);
        return;
      }

      // Formu FormSubmit'e AJAX ile gönder, ardından WhatsApp'ı aç.
      e.preventDefault();
      var formData = new FormData(form);

      fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      })
        .then(function () {
          showStatus("Teşekkürler! Talebiniz alındı, en kısa sürede dönüş yapacağız.", true);
          triggerButtonSuccess(submitBtn);
          form.reset();
        })
        .catch(function () {
          showStatus("Form gönderilemedi. Lütfen WhatsApp veya telefon ile ulaşın.", false);
        });

      var itemType = form.itemType.value;
      var message = form.message.value.trim();
      var waText =
        "Merhaba, fiyat teklifi almak istiyorum.%0A" +
        "Ad Soyad: " + encodeURIComponent(name) + "%0A" +
        "Telefon: " + encodeURIComponent(phone) + "%0A" +
        "Nereden: " + encodeURIComponent(from) + "%0A" +
        "Nereye: " + encodeURIComponent(to) + "%0A" +
        "Eşya Tipi: " + encodeURIComponent(itemType) +
        (message ? "%0ANot: " + encodeURIComponent(message) : "");

      var waLink = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + waText;
      setTimeout(function () {
        window.open(waLink, "_blank");
      }, 600);
    });
  }

  function showStatus(text, ok) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.remove("ok", "err");
    statusEl.classList.add("show", ok ? "ok" : "err");
  }

  /* WhatsApp float buton linkini de aynı numaraya bağla */
  var waFloat = document.getElementById("whatsapp-float");
  if (waFloat) {
    waFloat.href =
      "https://wa.me/" + WHATSAPP_NUMBER +
      "?text=" + encodeURIComponent("Merhaba, nakliyat hizmetleriniz hakkında bilgi almak istiyorum.");
  }
})();
