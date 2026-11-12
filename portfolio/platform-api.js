(function(){
  const API_URL = "https://kjrgvpxmqrbhbejqedcm.supabase.co/functions/v1/public-platform";
  const PUBLISHABLE_KEY = "sb_publishable_LIE3gft788Rt0Y9szWBBbQ_9vW2rwZw";

  async function api(action, payload) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": PUBLISHABLE_KEY },
      body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    });
    let result;
    try { result = await response.json(); } catch (_) { throw new Error("The service returned an unreadable response. Please try again."); }
    if (!response.ok || !result.ok) throw new Error(result.error || "Something went wrong. Please try again.");
    return result.data;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(char) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char];
    });
  }
  function initials(name) {
    return String(name || "").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join("").toUpperCase() || "BP";
  }
  function formatDate(value, lang) {
    if (!value) return "";
    const date = new Date(value + (String(value).length === 10 ? "T12:00:00" : ""));
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", { month:"short", year:"numeric" }).format(date);
  }
  function waLink(phone, message) {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits ? "https://wa.me/" + digits + "?text=" + encodeURIComponent(message || "Hello") : "";
  }
  function vcardEscape(value) {
    return String(value || "").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
  }
  function downloadVcard(profile) {
    const lines = ["BEGIN:VCARD", "VERSION:3.0", "FN:" + vcardEscape(profile.full_name)];
    if (profile.organization) lines.push("ORG:" + vcardEscape(profile.organization));
    if (profile.title_en || profile.title_fr) lines.push("TITLE:" + vcardEscape(profile.title_en || profile.title_fr));
    if (profile.whatsapp) lines.push("TEL;TYPE=CELL:" + vcardEscape(profile.whatsapp));
    if (profile.email) lines.push("EMAIL;TYPE=INTERNET:" + vcardEscape(profile.email));
    if (profile.linkedin_url) lines.push("URL:" + vcardEscape(profile.linkedin_url));
    lines.push("END:VCARD");
    const blob = new Blob([lines.join("\r\n") + "\r\n"], {type:"text/vcard;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = (String(profile.full_name || "contact").toLowerCase().replace(/[^a-z0-9]+/g,"-") || "contact") + ".vcf";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function photoToDataUrl(file) {
    return new Promise((resolve,reject) => {
      if (!file) return resolve(null);
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Choose a JPG, PNG or WebP image."));
      if (file.size > 12 * 1024 * 1024) return reject(new Error("Choose an image under 12 MB."));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read this image."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("This image could not be opened."));
        img.onload = () => {
          const ratio = Math.min(1, 1400 / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * ratio));
          canvas.height = Math.max(1, Math.round(img.height * ratio));
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,canvas.width,canvas.height);
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          const data = canvas.toDataURL("image/jpeg",0.84);
          if (data.length > 7000000) return reject(new Error("The compressed image is still too large. Choose a smaller portrait."));
          resolve(data);
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
  function setMessage(node, message, error) {
    if (!node) return;
    node.textContent = message || "";
    node.classList.toggle("show", !!message);
    node.classList.toggle("error", !!error);
  }
  function initBackTop() {
    const btn = document.querySelector("[data-backtop]");
    if (!btn) return;
    const update = () => { btn.hidden = window.scrollY < 320; };
    window.addEventListener("scroll", update, {passive:true});
    btn.addEventListener("click", () => window.scrollTo({top:0,behavior:"smooth"}));
    update();
  }
  document.addEventListener("DOMContentLoaded", initBackTop);
  window.PP = { api, esc, initials, formatDate, waLink, downloadVcard, photoToDataUrl, setMessage };
})();