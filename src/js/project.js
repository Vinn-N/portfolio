// Browsers can't display .HEIC natively; convert on the client when heic2any is loaded.
window.addEventListener("load", () => {
  if (typeof heic2any === "undefined") return;
  document.querySelectorAll('img[src$=".heic"], img[src$=".HEIC"]').forEach(async (img) => {
    try {
      const blob = await (await fetch(img.src)).blob();
      const jpeg = await heic2any({ blob, toType: "image/jpeg", quality: 0.8 });
      img.src = URL.createObjectURL(Array.isArray(jpeg) ? jpeg[0] : jpeg);
    } catch (e) {
      console.warn("Failed to convert HEIC image:", img.src);
    }
  });
});

// Click any project picture to view it larger; click again (or press Escape) to close.
document.addEventListener("click", (e) => {
  const img = e.target.closest(".pp img");
  if (!img) return;
  const box = document.createElement("div");
  box.className = "pp-lightbox";
  const big = document.createElement("img");
  big.src = img.currentSrc || img.src;
  big.alt = img.alt;
  box.appendChild(big);
  const close = () => { box.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (ev) => { if (ev.key === "Escape") close(); };
  box.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
  document.body.appendChild(box);
});
