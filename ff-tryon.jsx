import { useState, useEffect, useCallback } from "react";

const C = { navy: "#1e2a3a", gold: "#c9a962", cream: "#FDF9F3", tan: "#b8a888", bdr: "#E8E0D4", mut: "#8B7355", lt: "#FAF8F5" };

const CLOTHING_CATS = ["dress","Dress","top","Tops","pants","skirt","shorts","Shorts","cardigan","sweater","Sweaters",
  "Crew Neck Sweaters","Hoodie Sweaters","Blouse","Wrap Dress","Petite Dress","Classic Skirt","Wrap Gaia Dress",
  "Diane Dress","Enola Dress","Cordelia Dress","Elaine Cardigan","Clementine Shirt","Coats","Jackets",
  "Knit Jumpsuits","clothing"];

const TIER_BADGE = { healing: { bg: "#FAF6EE", color: "#c9a962", border: "#c9a962" }, foundation: { bg: "#F0FAFB", color: "#4A9BA8", border: "#4A9BA8" } };

function buildTryOnPrompt(profile, product) {
  const bodyDesc = profile && profile.bodyType
    ? `Body: ${profile.bodyType}, ${profile.heightInches ? Math.floor(profile.heightInches/12) + "'" + (profile.heightInches%12) + '"' : "average height"}, bust ${profile.bust||"?"}", waist ${profile.waist||"?"}", hips ${profile.hips||"?"}".\nColor season: ${profile.colorSeason||"unknown"}. Undertone: ${profile.undertone||"unknown"}.`
    : "Standard fashion model proportions.";

  return {
    system: `You are the virtual fitting room AI for Frequency & Form, a luxury natural fiber fashion house.

TASK: Create an SVG fashion illustration showing how a specific garment looks on a specific body.

${bodyDesc}

SVG RULES:
- viewBox="0 0 500 750"
- Editorial fashion croquis — elongated 9-head figure with the specified body proportions
- Show the ACTUAL GARMENT from the product details, not a generic sketch
- Elegant flowing lines, Vogue editorial quality
- Use strokes and minimal fills
- Show how the fabric drapes on THIS body type specifically
- Include construction details: seams, darts, fabric weight
- Garment color: use the product's actual color
- Skin tone: #D4A574, Hair: #2D1F1F
- Small annotation labels: font-family="Georgia" font-size="9" fill="#8B7355"
- Include fit notes specific to this body type (e.g. "cinches at natural waist — flattering on hourglass")
- Bottom right corner: frequency badge showing Hz rating
- ONLY output valid SVG. No markdown. No backticks. No explanation.
- Must start with <svg and end with </svg>
- Make it BEAUTIFUL and ACCURATE to the actual garment`,

    user: `Show me wearing this garment:

Product: ${product.product_name || product.name}
Brand: ${product.brand_name || product.brand}
Category: ${product.category}
Fabric: ${product.fabric_type || "natural fiber"} (${product.frequency_hz || "?"} Hz)
Colors: ${product.colors ? product.colors.join(", ") : "as shown"}
Description: ${product.description || "No description available"}
Price: ${product.price_display || "$" + ((product.price_cents||0)/100).toFixed(2)}

Create the SVG illustration showing this exact garment on my body. Show how the fabric falls and drapes naturally on my proportions. Include fit annotations.`
  };
}

export default function FFTryOn() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("browse"); // browse | trying | wishlist
  const [filter, setFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tryOnSvg, setTryOnSvg] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [tryOnHistory, setTryOnHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load profile + wishlist from storage
  useEffect(() => {
    loadData();
    fetchProducts();
  }, []);

  async function loadData() {
    try {
      const r1 = await window.storage.get("ff-profile");
      if (r1?.value) setProfile(JSON.parse(r1.value));
    } catch {}
    try {
      const r2 = await window.storage.get("ff-wishlist");
      if (r2?.value) setWishlist(JSON.parse(r2.value));
    } catch {}
    try {
      const r3 = await window.storage.get("ff-tryon-history");
      if (r3?.value) setTryOnHistory(JSON.parse(r3.value));
    } catch {}
  }

  async function saveWishlist(items) {
    setWishlist(items);
    try { await window.storage.set("ff-wishlist", JSON.stringify(items)); } catch {}
  }

  async function saveTryOnHistory(items) {
    setTryOnHistory(items);
    try { await window.storage.set("ff-tryon-history", JSON.stringify(items)); } catch {}
  }

  async function saveProfile(p) {
    setProfile(p);
    try { await window.storage.set("ff-profile", JSON.stringify(p)); } catch {}
  }

  // Fetch products - mock since we can't hit the server from artifact
  async function fetchProducts() {
    setLoading(true);
    // Sample products based on actual database schema
    const sampleProducts = [
      { id: "1", product_name: "DAMME High-Waisted Pleated Linen Pants", brand_name: "notPERFECTLINEN", category: "pants", fabric_type: "linen", frequency_hz: 5000, frequency_tier: "healing", price_cents: 7080, price_display: "$70.80", colors: ["Creamy Brown"], description: "Fly front zipper and buttons. High-waist and tapered legs. Two pockets at the hips. Pleated-front styling with elastic at sides.", image_url: "https://cdn.shopify.com/s/files/1/0575/6387/3333/files/2023_03_23_Not_Perfect_Linen_shot_04_058-2_c7373c32-a3d9-40e8-b941-48965529c9f0.jpg?v=1739114892", affiliate_url: "https://notperfectlinen.com/products/linen-pants-sale-438" },
      { id: "2", product_name: "Ella Wrap Linen Dress in Dusty Rose", brand_name: "Son de Flor", category: "dress", fabric_type: "linen", frequency_hz: 5000, frequency_tier: "healing", price_cents: 15900, price_display: "$159.00", colors: ["Dusty Rose"], description: "Wrap silhouette with flutter sleeves, midi length, self-tie sash at the waist. Pure linen.", image_url: "https://sondeflor.com/cdn/shop/files/ella-wrap-dress-dusty-rose-1.jpg", affiliate_url: "https://sondeflor.com" },
      { id: "3", product_name: "Pure Cashmere Crew Neck Sweater", brand_name: "Naadam", category: "sweater", fabric_type: "cashmere", frequency_hz: 5000, frequency_tier: "healing", price_cents: 9800, price_display: "$98.00", colors: ["Oatmeal"], description: "Grade-A Mongolian cashmere. Relaxed fit, ribbed cuffs and hem.", image_url: "https://www.naadam.co/cdn/shop/products/essential-crew-oatmeal-1.jpg", affiliate_url: "https://naadam.co" },
      { id: "4", product_name: "Audrey Cashmere Cardigan", brand_name: "N.Peal", category: "cardigan", fabric_type: "cashmere", frequency_hz: 5000, frequency_tier: "healing", price_cents: 39500, price_display: "$395.00", colors: ["Navy"], description: "Fine-gauge Mongolian cashmere cardigan with mother-of-pearl buttons. Elegant drape.", image_url: "https://www.npeal.com/cdn/shop/products/audrey-cardigan-navy-1.jpg", affiliate_url: "https://npeal.com" },
      { id: "5", product_name: "Linen Maxi Skirt NIKA", brand_name: "notPERFECTLINEN", category: "skirt", fabric_type: "linen", frequency_hz: 5000, frequency_tier: "healing", price_cents: 8500, price_display: "$85.00", colors: ["Natural"], description: "High waist, A-line silhouette, side pockets, elastic at back waist. Ankle length.", image_url: "https://cdn.shopify.com/s/files/1/0575/6387/3333/files/nika-skirt-natural-1.jpg", affiliate_url: "https://notperfectlinen.com" },
      { id: "6", product_name: "The Reformation Linen Midi Dress", brand_name: "Christy Dawn", category: "dress", fabric_type: "linen", frequency_hz: 5000, frequency_tier: "healing", price_cents: 22800, price_display: "$228.00", colors: ["Cream"], description: "Deadstock linen. Fitted bodice, square neckline, puff sleeves, flowing midi skirt.", image_url: "https://christydawn.com/cdn/shop/products/reformation-midi-cream-1.jpg", affiliate_url: "https://christydawn.com" },
      { id: "7", product_name: "Merino Wool Turtleneck", brand_name: "Gentle Herd", category: "sweater", fabric_type: "wool", frequency_hz: 4800, frequency_tier: "healing", price_cents: 6900, price_display: "$69.00", colors: ["Charcoal"], description: "Fine merino wool turtleneck. Slim fit, ribbed neckline and cuffs.", image_url: "https://gentleherd.com/cdn/shop/products/merino-turtleneck-charcoal-1.jpg", affiliate_url: "https://gentleherd.com" },
      { id: "8", product_name: "Organic Cotton Wide-Leg Pants", brand_name: "MATE the Label", category: "pants", fabric_type: "cotton", frequency_hz: 100, frequency_tier: "foundation", price_cents: 11800, price_display: "$118.00", colors: ["White"], description: "Organic cotton twill. High waist, wide leg, front pleats, side pockets.", image_url: "https://matethelabel.com/cdn/shop/products/wide-leg-pant-white-1.jpg", affiliate_url: "https://matethelabel.com" },
      { id: "9", product_name: "Linen Blazer ALBA", brand_name: "Magic Linen", category: "Jackets", fabric_type: "linen", frequency_hz: 5000, frequency_tier: "healing", price_cents: 14900, price_display: "$149.00", colors: ["Champagne"], description: "Relaxed fit linen blazer with notch lapels, single button closure, patch pockets.", image_url: "https://magiclinen.com/cdn/shop/products/alba-blazer-champagne-1.jpg", affiliate_url: "https://magiclinen.com" },
      { id: "10", product_name: "Silk Charmeuse Camisole", brand_name: "Son de Flor", category: "top", fabric_type: "silk", frequency_hz: 4500, frequency_tier: "healing", price_cents: 8900, price_display: "$89.00", colors: ["Ivory"], description: "Pure mulberry silk charmeuse. Bias cut, adjustable straps, cowl neckline.", image_url: "https://sondeflor.com/cdn/shop/products/silk-cami-ivory-1.jpg", affiliate_url: "https://sondeflor.com" },
      { id: "11", product_name: "Cashmere V-Neck Wrap Sweater", brand_name: "Gentle Herd", category: "sweater", fabric_type: "cashmere", frequency_hz: 5000, frequency_tier: "healing", price_cents: 12900, price_display: "$129.00", colors: ["Camel"], description: "Grade-A cashmere. Wrap-front design, self-tie belt, dolman sleeves.", image_url: "https://gentleherd.com/cdn/shop/products/wrap-sweater-camel-1.jpg", affiliate_url: "https://gentleherd.com" },
      { id: "12", product_name: "Linen Shirt Dress BALI", brand_name: "Magic Linen", category: "dress", fabric_type: "linen", frequency_hz: 5000, frequency_tier: "healing", price_cents: 12900, price_display: "$129.00", colors: ["Dusty Rose"], description: "Button-front shirt dress in washed linen. Collar, rolled sleeves, self-tie waist, midi length.", image_url: "https://magiclinen.com/cdn/shop/products/bali-shirt-dress-dusty-rose-1.jpg", affiliate_url: "https://magiclinen.com" },
    ];
    setProducts(sampleProducts);
    setLoading(false);
  }

  // Get unique categories
  const categories = ["all", ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filter products
  const filtered = products.filter(p => {
    const matchCat = filter === "all" || p.category === filter;
    const matchSearch = !searchQuery || 
      (p.product_name||"").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand_name||"").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.fabric_type||"").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const isWishlisted = (id) => wishlist.some(w => w.id === id);

  function toggleWishlist(product) {
    if (isWishlisted(product.id)) {
      saveWishlist(wishlist.filter(w => w.id !== product.id));
    } else {
      saveWishlist([...wishlist, { ...product, savedAt: new Date().toISOString() }]);
    }
  }

  // Virtual Try-On
  async function tryOn(product) {
    setSelectedProduct(product);
    setView("trying");
    setIsGenerating(true);
    setError(null);
    setTryOnSvg(null);

    const prompts = buildTryOnPrompt(profile, product);
    const content = [];

    // Include product image if available
    if (product.image_url) {
      content.push({ type: "text", text: `[Product image available at: ${product.image_url}]\n\n${prompts.user}` });
    } else {
      content.push({ type: "text", text: prompts.user });
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: prompts.system,
          messages: [{ role: "user", content }]
        })
      });
      const data = await response.json();
      const text = (data.content || []).map(c => c.text || "").join("");
      const match = text.match(/<svg[\s\S]*?<\/svg>/);
      if (match) {
        setTryOnSvg(match[0]);
        saveTryOnHistory([{ id: Date.now().toString(), productId: product.id, productName: product.product_name, brandName: product.brand_name, svg: match[0], createdAt: new Date().toISOString() }, ...tryOnHistory].slice(0, 20));
      } else {
        setError("Couldn't generate the try-on. Try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setIsGenerating(false);
  }

  /* ══════════ PRODUCT CARD ══════════ */
  function ProductCard({ p }) {
    const tier = TIER_BADGE[p.frequency_tier] || TIER_BADGE.healing;
    return (
      <div style={{ background: "white", borderRadius: 10, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(30,42,58,0.04)", transition: "box-shadow 0.2s" }}>
        {/* Image */}
        <div style={{ position: "relative", aspectRatio: "3/4", background: C.lt, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {p.image_url ? (
            <img src={p.image_url} alt={p.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          ) : null}
          <div style={{ display: p.image_url ? "none" : "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", flexDirection: "column", color: C.tan }}>
            <span style={{ fontSize: 40, opacity: 0.2 }}>✦</span>
            <span style={{ fontSize: 11, marginTop: 4 }}>No image</span>
          </div>
          {/* Wishlist heart */}
          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }}
            style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 16, transition: "transform 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            {isWishlisted(p.id) ? "❤️" : "🤍"}
          </button>
          {/* Hz badge */}
          <div style={{ position: "absolute", bottom: 8, left: 8, padding: "3px 8px", borderRadius: 12, fontSize: 9,
            letterSpacing: 1, textTransform: "uppercase", background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
            {p.frequency_hz || "?"} Hz · {p.frequency_tier || "natural"}
          </div>
        </div>
        {/* Info */}
        <div style={{ padding: 14 }}>
          <p style={{ fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{p.brand_name}</p>
          <h3 style={{ fontSize: 14, color: C.navy, fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, marginBottom: 6, lineHeight: 1.3,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.product_name}</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>{p.price_display}</span>
            <span style={{ fontSize: 11, color: C.tan, textTransform: "capitalize" }}>{p.fabric_type}</span>
          </div>
          {p.colors && p.colors.length > 0 && (
            <p style={{ fontSize: 11, color: C.mut, marginBottom: 10 }}>{p.colors.join(", ")}</p>
          )}
          <button onClick={() => tryOn(p)} style={{
            width: "100%", padding: "10px", background: C.navy, color: "#FAFAFA", border: "none", borderRadius: 8,
            cursor: "pointer", fontFamily: "Cinzel, Georgia, serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
            transition: "background 0.2s"
          }}>
            ✨ Try This On Me
          </button>
        </div>
      </div>
    );
  }

  /* ══════════ RENDER ══════════ */
  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Cormorant Garamond', Georgia, serif", color: C.navy }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ background: C.navy, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `2px solid ${C.gold}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, border: `1.5px solid ${C.gold}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: C.gold, fontSize: 13, fontFamily: "Cinzel, Georgia, serif" }}>FF</span>
          </div>
          <div>
            <h1 style={{ color: "#FAFAFA", fontSize: 17, fontFamily: "Cinzel, Georgia, serif", fontWeight: 400, margin: 0, letterSpacing: 2 }}>VIRTUAL FITTING ROOM</h1>
            <p style={{ color: C.gold, fontSize: 9, margin: 0, letterSpacing: 3, textTransform: "uppercase" }}>Frequency & Form — Try Before You Buy</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div onClick={() => setShowProfile(!showProfile)} style={{
            padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 11, letterSpacing: 1,
            border: `1px solid ${profile ? C.gold : "#666"}`, color: profile ? C.gold : "#888", fontFamily: "inherit"
          }}>
            {profile ? `${profile.bodyType} · ${profile.colorSeason || ""}` : "Set My Profile"}
          </div>
          {[["Shop", "browse"], ["Wishlist", "wishlist"]].map(([label, v]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "6px 16px", border: `1px solid ${C.gold}`, borderRadius: 4, cursor: "pointer",
              fontFamily: "inherit", fontSize: 12, background: view === v ? C.gold : "transparent", color: view === v ? C.navy : C.gold
            }}>{label}{v === "wishlist" ? ` (${wishlist.length})` : ""}</button>
          ))}
        </div>
      </div>

      {/* ═══ PROFILE EDITOR ═══ */}
      {showProfile && (
        <div style={{ background: "white", borderBottom: `1px solid ${C.bdr}`, padding: "14px 24px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[["Body Type", "bodyType", "hourglass"], ["Height (in)", "heightInches", "65"], ["Bust", "bust", ""], ["Waist", "waist", ""], ["Hips", "hips", ""],
              ["Color Season", "colorSeason", "warm autumn"], ["Undertone", "undertone", "warm"]].map(([label, key, ph]) => (
              <div key={key} style={{ flex: "1 1 120px" }}>
                <label style={{ fontSize: 9, color: "#999", display: "block", marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>
                <input value={profile?.[key] || ""} onChange={(ev) => saveProfile({ ...profile, [key]: ev.target.value })} placeholder={ph}
                  style={{ width: "100%", padding: "6px 8px", border: `1px solid ${C.bdr}`, borderRadius: 4, fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ BROWSE VIEW ═══ */}
      {view === "browse" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
          {/* Search + Filter bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, or fabric..."
              style={{ flex: "1 1 250px", padding: "10px 14px", border: `1px solid ${C.bdr}`, borderRadius: 8,
                fontFamily: "inherit", fontSize: 14, color: C.navy, outline: "none" }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} style={{
                  padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === cat ? C.gold : C.bdr}`,
                  background: filter === cat ? C.gold : "white", color: filter === cat ? C.navy : C.mut,
                  cursor: "pointer", fontFamily: "inherit", fontSize: 11, textTransform: "capitalize"
                }}>{cat}</button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${C.bdr}`, borderTopColor: C.gold, borderRadius: "50%",
                animation: "trspin 1s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ color: C.mut, fontStyle: "italic" }}>Loading collection...</p>
              <style>{`@keyframes trspin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {filtered.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: C.tan }}>
              <p style={{ fontSize: 17, fontStyle: "italic" }}>No products match your search</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ TRY-ON VIEW ═══ */}
      {view === "trying" && selectedProduct && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
          <button onClick={() => setView("browse")} style={{
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
            color: C.gold, marginBottom: 16, padding: 0
          }}>← Back to Shop</button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, minHeight: 500 }}>
            {/* Left: Product */}
            <div style={{ background: "white", borderRadius: 12, border: `1px solid ${C.bdr}`, overflow: "hidden" }}>
              <div style={{ aspectRatio: "3/4", background: C.lt, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 60, opacity: 0.15 }}>✦</span>
                )}
              </div>
              <div style={{ padding: 16 }}>
                <p style={{ fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: 1 }}>{selectedProduct.brand_name}</p>
                <h2 style={{ fontSize: 18, color: C.navy, marginTop: 4, marginBottom: 8 }}>{selectedProduct.product_name}</h2>
                <p style={{ fontSize: 22, color: C.navy, fontWeight: 600, marginBottom: 8 }}>{selectedProduct.price_display}</p>
                <p style={{ fontSize: 12, color: C.mut, lineHeight: 1.5 }}>{selectedProduct.description}</p>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 10, background: "#FAF6EE", color: C.gold, border: `1px solid ${C.gold}` }}>
                    {selectedProduct.fabric_type} · {selectedProduct.frequency_hz} Hz
                  </span>
                  {selectedProduct.colors?.map(c => (
                    <span key={c} style={{ padding: "4px 10px", borderRadius: 12, fontSize: 10, background: C.lt, color: C.mut, border: `1px solid ${C.bdr}` }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Try-On Result */}
            <div style={{ background: "white", borderRadius: 12, border: `1px solid ${C.bdr}`, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 10, color: C.mut, textTransform: "uppercase", letterSpacing: 2 }}>
                  {profile ? `On Your ${profile.bodyType} Figure` : "Virtual Try-On"}
                </p>
                <button onClick={() => toggleWishlist(selectedProduct)} style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 18
                }}>{isWishlisted(selectedProduct.id) ? "❤️" : "🤍"}</button>
              </div>

              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                {isGenerating ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, border: `3px solid ${C.bdr}`, borderTopColor: C.gold,
                      borderRadius: "50%", animation: "trspin 1s linear infinite", margin: "0 auto 16px" }} />
                    <p style={{ color: C.mut, fontSize: 15, fontStyle: "italic" }}>Styling this on you...</p>
                    <p style={{ color: C.tan, fontSize: 12, marginTop: 8 }}>
                      {profile ? `Adapting for your ${profile.bodyType} silhouette` : "Creating illustration"}
                    </p>
                  </div>
                ) : error ? (
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <p style={{ color: "#991B1B", fontSize: 14, marginBottom: 12 }}>{error}</p>
                    <button onClick={() => tryOn(selectedProduct)} style={{
                      padding: "10px 24px", background: C.navy, color: "#FAFAFA", border: "none", borderRadius: 8,
                      cursor: "pointer", fontFamily: "inherit", fontSize: 13
                    }}>Try Again</button>
                  </div>
                ) : tryOnSvg ? (
                  <div dangerouslySetInnerHTML={{ __html: tryOnSvg }} style={{ maxWidth: "100%", maxHeight: "100%" }} />
                ) : null}
              </div>

              {tryOnSvg && !isGenerating && (
                <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.bdr}`, display: "flex", gap: 8 }}>
                  <button onClick={() => tryOn(selectedProduct)} style={{
                    flex: 1, padding: 10, background: C.lt, border: `1px solid ${C.bdr}`, borderRadius: 6,
                    cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: C.navy
                  }}>Regenerate</button>
                  {selectedProduct.affiliate_url && (
                    <a href={selectedProduct.affiliate_url} target="_blank" rel="noopener noreferrer" style={{
                      flex: 1, padding: 10, background: C.gold, border: "none", borderRadius: 6,
                      cursor: "pointer", fontFamily: "Cinzel, Georgia, serif", fontSize: 11, color: C.navy,
                      textAlign: "center", textDecoration: "none", letterSpacing: 1, textTransform: "uppercase"
                    }}>Shop Now →</a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ WISHLIST VIEW ═══ */}
      {view === "wishlist" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontFamily: "Cinzel, Georgia, serif", fontSize: 24, color: C.navy, fontWeight: 400, letterSpacing: 3 }}>MY WISHLIST</h2>
            <p style={{ color: C.mut, fontSize: 14, marginTop: 6 }}>{wishlist.length} saved piece{wishlist.length !== 1 ? "s" : ""}</p>
          </div>

          {wishlist.length === 0 ? (
            <div style={{ textAlign: "center", padding: 72, color: C.tan }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.2 }}>✦</div>
              <p style={{ fontSize: 17, fontStyle: "italic" }}>Your wishlist is empty</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Heart products while browsing to save them here</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {wishlist.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          )}

          {/* Try-On History */}
          {tryOnHistory.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <h3 style={{ fontFamily: "Cinzel, Georgia, serif", fontSize: 18, color: C.navy, fontWeight: 400, letterSpacing: 2, marginBottom: 16, textAlign: "center" }}>
                RECENT TRY-ONS
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {tryOnHistory.map(h => (
                  <div key={h.id} style={{ background: "white", borderRadius: 10, border: `1px solid ${C.bdr}`, overflow: "hidden" }}>
                    <div style={{ aspectRatio: "5/7", background: C.lt, display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
                      <div dangerouslySetInnerHTML={{ __html: h.svg }} style={{ maxWidth: "100%", maxHeight: "100%" }} />
                    </div>
                    <div style={{ padding: 10 }}>
                      <p style={{ fontSize: 10, color: C.gold, textTransform: "uppercase" }}>{h.brandName}</p>
                      <p style={{ fontSize: 12, color: C.navy, lineHeight: 1.3 }}>{h.productName}</p>
                      <p style={{ fontSize: 9, color: C.tan, marginTop: 4 }}>{new Date(h.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
