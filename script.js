(function () {
  const tilesWrap = document.getElementById("tiles");
  const isCoarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const YEAR_EL = document.getElementById("year");
  if (YEAR_EL) YEAR_EL.textContent = new Date().getFullYear();

  // --------- Particle FX engine ----------
  class Particle {
    constructor(x, y, vx, vy, life, hue) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.life = life; this.max = life; this.hue = hue;
    }
    step(dt) {
      this.life -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vy += 0.0005 * dt; // лёгкая «гравитация»
      return this.life > 0;
    }
    draw(ctx) {
      const t = this.life / this.max;
      ctx.globalAlpha = Math.max(t, 0) * 0.9;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 1.6 + (1 - t) * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 90%, ${60 + 20 * (1 - t)}%, ${Math.max(t,0)})`;
      ctx.fill();
    }
  }

  class TileFX {
    constructor(tile) {
      this.tile = tile;
      this.canvas = document.createElement("canvas");
      this.canvas.className = "tile__fx";
      this.ctx = this.canvas.getContext("2d");
      tile.appendChild(this.canvas);

      this.particles = [];
      this.running = false;
      this.last = 0;

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(tile);
      this.resize();
    }
    resize() {
      const r = this.tile.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(r.width * dpr);
      this.canvas.height = Math.floor(r.height * dpr);
      this.canvas.style.width = r.width + "px";
      this.canvas.style.height = r.height + "px";
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    burst(x, y, accentHex) {
      // если нет координат (мобайл), бьём из центра
      const rect = this.tile.getBoundingClientRect();
      const cx = (x ?? rect.width / 2);
      const cy = (y ?? rect.height / 2);

      const hue = TileFX.hexToHue(accentHex) ?? 240;
      for (let i = 0; i < 18; i++) {
        const a = (Math.random() * Math.PI * 2);
        const sp = 0.18 + Math.random() * 0.45;
        const vx = Math.cos(a) * sp;
        const vy = Math.sin(a) * sp * 0.8;
        const life = 600 + Math.random() * 500; // мс
        this.particles.push(new Particle(cx, cy, vx, vy, life, hue));
      }
      if (!this.running) {
        this.running = true; this.last = performance.now();
        requestAnimationFrame((t) => this.loop(t));
      }
    }
    loop(t) {
      const dt = t - this.last; this.last = t;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.particles = this.particles.filter(p => p.step(dt));
      for (const p of this.particles) p.draw(ctx);
      if (this.particles.length) requestAnimationFrame((tt) => this.loop(tt));
      else this.running = false;
    }
    static hexToHue(hex) {
      if (!hex) return null;
      const m = hex.replace("#","").match(/.{1,2}/g);
      if (!m) return null;
      const [r,g,b] = m.map(v => parseInt(v.length===1 ? v+v : v, 16)/255);
      const max = Math.max(r,g,b), min = Math.min(r,g,b);
      const d = max - min;
      let h = 0;
      if (d !== 0) {
        switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
      }
      return Math.round(h);
    }
  }
  // ---------------------------------------

  function createTile({ title, desc, href, image, accent }) {
    const a = document.createElement("a");
    a.className = "tile";
    a.href = href;
    a.setAttribute("data-accent", accent);
    a.setAttribute("aria-label", title);

    const bg = document.createElement("div");
    bg.className = "tile__bg";
    bg.style.setProperty("--img", `url('${image}')`);

    const fog = document.createElement("div");
    fog.className = "tile__fog";

    const glow = document.createElement("div");
    glow.className = "tile__glow";

    const fx = document.createElement("canvas");
    fx.className = "tile__fx";

    const meta = document.createElement("div");
    meta.className = "tile__meta";
    meta.innerHTML = `
      <h2 class="tile__title">${title}</h2>
      <p class="tile__desc">${desc}</p>
    `;

    a.append(bg,fog,glow,fx,meta);

    // FX controller
    const fxCtrl = new TileFX(a);

    // Мобильное поведение: первый тап — подсветка ~1с, затем переход
    let tapTimer = null;
    let primed = false;
    const go = () => { window.location.href = href; };

    const burstFromEvent = (e) => {
      const accent = a.getAttribute("data-accent");
      if (e && e.clientX !== undefined) {
        const r = a.getBoundingClientRect();
        fxCtrl.burst(e.clientX - r.left, e.clientY - r.top, accent);
      } else {
        fxCtrl.burst(undefined, undefined, accent);
      }
    };

    a.addEventListener("mouseenter", (e) => {
      if (!isCoarse) burstFromEvent(e);
    });

    a.addEventListener("mousemove", (e) => {
      // лёгкие искры при движении
      if (!isCoarse && Math.random() < 0.04) burstFromEvent(e);
    });

    a.addEventListener("click", (e) => {
      if (!isCoarse) return; // десктоп — обычный клик
      if (!primed) {
        e.preventDefault();
        primed = true;
        a.classList.add("tile--active");
        burstFromEvent(e);
        const delay = parseInt(getComputedStyle(a).getPropertyValue("--tap-delay"), 10) || 900;
        tapTimer = setTimeout(go, delay);
      } else {
        if (tapTimer) clearTimeout(tapTimer);
        go();
      }
    }, { passive: false });

    a.addEventListener("mouseleave", () => {
      a.classList.remove("tile--active");
      primed = false;
      if (tapTimer) clearTimeout(tapTimer);
    });

    return a;
  }

  function mount() {
    if (!window.TILES || !Array.isArray(window.TILES)) return;
    const frag = document.createDocumentFragment();
    window.TILES.forEach((tile) => frag.appendChild(createTile(tile)));
    tilesWrap.appendChild(frag);
  }

  mount();
})();
