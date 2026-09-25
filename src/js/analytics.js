// Google Analytics 4. Paste your Measurement ID below (looks like G-XXXXXXXXXX) to turn it on.
// Until then this file does nothing, so no data is collected.
(function () {
  var MEASUREMENT_ID = "";
  if (!MEASUREMENT_ID || navigator.doNotTrack === "1") return;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID, { anonymize_ip: true });
})();
