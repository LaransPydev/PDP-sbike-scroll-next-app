// app/components/Productsection.tsx
import { useState, useRef, useLayoutEffect } from "react";
import Image from "next/image";

/* ─── GALLERY DATA ─────────────────────────────────────── */
const galleryItems = [
  { id: 1, type: "full", src: "/sBike_Gallery_01 (1).webp", alt: "sBike hero" },
  { id: 2, type: "half", src: "/sBike_Gallery_02_(1).webp", alt: "App interface" },
  { id: 3, type: "half", src: "/sBike_Gallery_03_(1).webp", alt: "Seat adjustment" },
  { id: 4, type: "full", src: "/sBike_Gallery_04_(1).webp", alt: "Person working out" },
  { id: 5, type: "half", src: "/sBike_Gallery_05_(1).webp", alt: "Woman cycling" },
  { id: 6, type: "half", src: "/sBike_Gallery_06_(1).webp", alt: "Streaming" },
  { id: 7, type: "full", src: "/sBike_Gallery_07_(1).webp", alt: "Living room" },
];

const accessories = [
  { name: "sPulse Herzfrequenzsensor", desc: "Trainiere effizienter!", price: "59,49 €", old: "84,00 €", img: "/photo-1575311373937-040b8e1fd5b6.jpg" },
  { name: "AH100 2x 1,5kg Hantelset", desc: "", price: "23,99 €", old: "28,80 €", img: "/photo-1517836357463-d25dfeac3438.jpg" },
];

const subscriptions = [
  { id: 1, label: "12 Monate Premium-Mitgliedschaft (32% sparen)", price: "+89,99 €", badge: "AM BELIEBTESTEN" },
  { id: 2, label: "24 Monate Premium-Mitgliedschaft (43% sparen)", price: "+149,00 €", badge: null },
  { id: 3, label: "36 Monate Premium-Mitgliedschaft (52% sparen)", price: "+189,00 €", badge: null },
  { id: 4, label: "Kostenlose Testphase (14 Tage)", price: "Gratis", badge: null },
];

const deliveryOpts = [
  { label: "Aufbau am Wunschort in deinem Zuhause ⓘ", price: "299,00 €", disabled: false },
  { label: "Lieferung an den gewünschten Aufstellort in deinem Zuhause ⓘ", price: "69,00 €", disabled: false },
  { label: "Lieferung bis zur Bordsteinkante", price: "0,00 €", disabled: true },
];

const accordionData = [
  { key: "FUNKTION", content: "32 levels of magnetic resistance, Bluetooth 5.0, ANT+, heart rate monitoring, auto-resistance via app." },
  { key: "SOFTWARE", content: "Sportstech Live app, 1000+ workouts, Netflix, YouTube, Prime Video, Hulu, gaming mode." },
  { key: "DATEN", content: "Max weight: 150 kg · 120×55×140 cm · 32 resistance levels · 21.5\" FHD IPS touch · 2-year warranty" },
];

/* ─── HELPERS ───────────────────────────────────────────── */
function buildRows(items: typeof galleryItems) {
  const rows: (typeof items[0] | typeof items)[] = [];
  let i = 0;
  while (i < items.length) {
    if (items[i].type === "full") { rows.push(items[i]); i++; }
    else {
      const pair = [items[i]];
      if (i + 1 < items.length && items[i + 1].type === "half") { pair.push(items[i + 1]); i += 2; }
      else i++;
      rows.push(pair as any);
    }
  }
  return rows;
}

/* ─── COMPONENT ─────────────────────────────────────────── */
export default function ProductSection() {
  const [selectedSub, setSelectedSub] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const wrapperRef   = useRef<HTMLDivElement>(null);
  const leftRef      = useRef<HTMLDivElement>(null);
  const rightInner   = useRef<HTMLDivElement>(null);

  // Physics Refs
  const scrollTarget = useRef(0);
  const scrollCurrent = useRef(0);
  const rafId = useRef<number | null>(null);
  const isTouch = useRef(false);
  
  // Track if we are on desktop to enable/disable custom scroll behavior
  const isDesktopRef = useRef(true); 

  const metrics = useRef({
    viewHeight: 0,
    leftHeight: 0,
    rightInnerHeight: 0,
    wrapperTop: 0,
    maxScrollDistance: 0,
    maxInnerTranslate: 0
  });

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const left = leftRef.current;
    const inner = rightInner.current;
    if (!wrapper || !left || !inner) return;

    // 1. METRICS UPDATE
    const updateMetrics = () => {
      // Check if we are on a desktop screen (lg breakpoint in Tailwind)
      isDesktopRef.current = window.innerWidth >= 1024;

      const navH = 64;
      const viewH = window.innerHeight - navH;
      const wRect = wrapper.getBoundingClientRect();
      const wrapperTop = wRect.top + window.scrollY; 

      const leftH = left.offsetHeight;
      const innerH = inner.scrollHeight;

      metrics.current = {
        viewHeight: viewH,
        leftHeight: leftH,
        rightInnerHeight: innerH,
        wrapperTop: wrapperTop,
        maxScrollDistance: Math.max(0, leftH - viewH),
        maxInnerTranslate: Math.max(0, innerH - viewH)
      };
      
      scrollTarget.current = window.scrollY;
      scrollCurrent.current = window.scrollY;
    };

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(wrapper);
    resizeObserver.observe(left);
    resizeObserver.observe(inner);

    // 2. CUSTOM SMOOTH SCROLL LOGIC
    const onWheel = (e: WheelEvent) => {
      // Completely disable custom scroll override on mobile/tablet
      if (!isDesktopRef.current || isTouch.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      
      e.preventDefault(); 
      scrollTarget.current += e.deltaY;
    };

    const onTouchStart = () => { isTouch.current = true; };
    const onTouchEnd = () => { 
      setTimeout(() => { isTouch.current = false; }, 100);
      scrollTarget.current = window.scrollY; 
    };

    // 3. ANIMATION LOOP
    const rafLoop = () => {
      // If mobile, keep refs synced with native scroll but DO NOT translate/hijack
      if (!isDesktopRef.current) {
        if (inner) inner.style.transform = `translate3d(0, 0, 0)`;
        scrollTarget.current = window.scrollY;
        scrollCurrent.current = window.scrollY;
        rafId.current = requestAnimationFrame(rafLoop);
        return;
      }

      const docHeight = document.body.scrollHeight - window.innerHeight;
      scrollTarget.current = Math.max(0, Math.min(scrollTarget.current, docHeight));

      const lerpFactor = 0.08; 
      const diff = scrollTarget.current - scrollCurrent.current;
      
      if (Math.abs(diff) > 0.1) {
        scrollCurrent.current += diff * lerpFactor;
        window.scrollTo(0, scrollCurrent.current);

        const m = metrics.current;
        if (m.maxScrollDistance > 0) {
          const scrolledAmount = scrollCurrent.current - m.wrapperTop + 64;
          let progress = scrolledAmount / m.maxScrollDistance;
          progress = Math.max(0, Math.min(1, progress));

          const targetY = -(progress * m.maxInnerTranslate);
          if (inner) {
            inner.style.transform = `translate3d(0, ${Math.round(targetY)}px, 0)`;
          }
        } else if (inner) {
          inner.style.transform = `translate3d(0, 0, 0)`;
        }
      }

      rafId.current = requestAnimationFrame(rafLoop);
    };

    updateMetrics();
    rafId.current = requestAnimationFrame(rafLoop);

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      resizeObserver.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const rows = buildRows(galleryItems);

  return (
    <div ref={wrapperRef} className="w-full bg-white">
      {/* Changed to flex-col on mobile, flex-row on lg */}
      <div className="flex flex-col lg:flex-row w-full mx-auto max-w-[1400px]">

        {/* ══════════════════════════════════════
            LEFT — normal page flow, full gallery
        ══════════════════════════════════════ */}
        <div ref={leftRef} className="flex flex-col gap-0 w-full lg:w-[58%]">
          {rows.map((row) =>
            !Array.isArray(row) ? (
              // Adjusted heights for responsiveness
              <div key={(row as any).id} className="relative w-full overflow-hidden bg-gray-100 h-[350px] sm:h-[450px] lg:h-[540px]">
                <Image src={(row as any).src} alt={(row as any).alt} fill sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            ) : (
              // Adjusted heights for responsiveness
              <div key={(row as any[])[0].id} className="flex h-[250px] sm:h-[350px] lg:h-[480px]">
                {(row as any[]).map((item) => (
                  <div key={item.id} className="relative flex-1 overflow-hidden bg-gray-100 h-full">
                    <Image src={item.src} alt={item.alt} fill sizes="(max-width: 1024px) 50vw, 30vw"
                      className="object-cover transition-transform duration-700 hover:scale-105" />
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* ══════════════════════════════════════
            RIGHT — sticky viewport column
        ══════════════════════════════════════ */}
        <div
          className="w-full lg:w-[42%] border-t lg:border-t-0 lg:border-l border-gray-200 lg:sticky lg:top-[64px] lg:h-[calc(100vh-64px)] lg:overflow-hidden self-start bg-white"
        >
          <div 
            ref={rightInner} 
            style={{ 
                willChange: "transform", 
                backfaceVisibility: "hidden",
                perspective: "1000px" 
            }}>
            {/* Adjusted padding for mobile */}
            <div className="px-4 py-6 sm:px-6 lg:px-8">

              {/* ── Product title ── */}
              <div className="mb-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400 text-sm">★★★★★</span>
                  <span className="text-sm text-gray-500">415 Bewertungen</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
                  Sportstech sBike 21,5" Display
                </h1>
              </div>

              {/* ── Variant selector ── */}
              <div className="flex flex-col gap-2 mb-6">
                {[
                  { label: "10,1\" Display", price: "999,00 €", active: false },
                  { label: "21,5\" Display", price: "1.210,44 €", active: true },
                  { label: "Vorführgerät",   price: "990,00 €",   active: false },
                ].map((v) => (
                  <div key={v.label}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer border transition-all ${
                      v.active ? "border-gray-900 border-2 bg-white" : "border-gray-200 bg-white hover:border-gray-400"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        v.active ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                        {v.active && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm ${v.active ? "font-bold" : "font-normal text-gray-600"}`}>{v.label}</span>
                    </div>
                    <span className={`text-sm ${v.active ? "font-bold" : "text-gray-600"}`}>{v.price}</span>
                  </div>
                ))}
              </div>

              {/* ── Sportstech LIVE ── */}
              <div className="mb-5">
                <p className="text-xs font-black tracking-widest uppercase text-gray-800 mb-3">SPORTSTECH LIVE</p>
                <div className="flex gap-3 items-start p-3 rounded-lg bg-gray-50 border border-gray-100 mb-3">
                  <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=80&q=60&auto=format" loading="lazy"
                    className="w-14 h-10 rounded object-cover flex-shrink-0" alt="app" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 mb-0.5">Trainiere smarter mit Sportstech Live</p>
                    <p className="text-xs text-gray-500 leading-relaxed">Workouts, Gaming, Streaming, smarte Metriken & Community – alles in einer App.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {subscriptions.map((s) => (
                    <div key={s.id} onClick={() => setSelectedSub(s.id)}
                      className={`flex items-center justify-between px-3 sm:px-4 py-3 rounded-lg cursor-pointer border transition-all ${
                        selectedSub === s.id ? "border-gray-900 border-2 bg-white" : "border-gray-200 hover:border-gray-400"}`}>
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          selectedSub === s.id ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                          {selectedSub === s.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-gray-800 leading-tight">{s.label}</span>
                          {s.badge && (
                            <span className="text-[9px] sm:text-[10px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded flex-shrink-0">{s.badge}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-900 flex-shrink-0">{s.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Accessories ── */}
              <div className="mb-5">
                <p className="text-xs font-black tracking-widest uppercase text-gray-800 mb-3">PASSENDES ZUBEHÖR FÜR DEIN TRAINING</p>
                {/* Changed to CSS grid for mobile stacking */}
                <div className="grid grid-cols-2 gap-3">
                  {accessories.map((a) => (
                    <div key={a.name} className="border border-gray-200 rounded-lg p-2 sm:p-3 flex flex-col">
                      <div className="relative w-full h-20 sm:h-24 bg-gray-100 rounded mb-2 overflow-hidden flex-shrink-0">
                        <Image src={a.img} alt={a.name} fill sizes="(max-width: 640px) 50vw, 150px" className="object-cover" />
                      </div>
                      <p className="text-xs text-gray-800 font-medium leading-tight mb-1 flex-1">{a.name}</p>
                      {a.desc && <p className="text-[10px] sm:text-xs text-gray-500 mb-1 line-clamp-2">{a.desc}</p>}
                      <div className="mt-auto pt-1">
                        <p className="text-sm font-bold text-red-600">{a.price}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400 line-through">{a.old}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Pricing ── */}
              {/* Added flex-col on mobile, row on tablet+ */}
              <div className="flex flex-col md:flex-row md:items-start gap-4 py-4 mb-5 border-t border-b border-gray-100">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 line-through">1.767,80 €</p>
                  <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">1.299,44 €<span className="text-sm font-normal"> *</span></p>
                  <p className="text-xs text-gray-400">inkl. MwSt.</p>
                  <button className="mt-2 w-full sm:w-auto bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded">SPARE HEUTE 557 €</button>
                </div>
                
                {/* Divider lines for mobile vs desktop */}
                <div className="hidden md:block w-px self-stretch bg-gray-200" />
                <div className="block md:hidden w-full h-px bg-gray-200" />
                
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">IN RATEN ZAHLEN</p>
                  <p className="text-xl sm:text-2xl font-black text-gray-900">100,87 €<span className="text-sm font-normal">/Mon.</span></p>
                  <p className="text-xs text-gray-500">0% für 12 Mon. <span className="text-blue-600 underline cursor-pointer">Mehr erfahren</span></p>
                  <button className="mt-2 w-full sm:w-auto bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded">PayPal RATENZAHLUNG</button>
                </div>
              </div>

              {/* ── Delivery ── */}
              <div className="mb-5">
                <p className="text-xs font-black tracking-widest uppercase text-gray-800 mb-3 border-t border-gray-100 pt-4">LIEFERUNG UND AUFBAU</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {deliveryOpts.map((d, i) => (
                    <div key={i} onClick={() => !d.disabled && setSelectedDelivery(i)}
                      className={`flex items-center justify-between px-3 sm:px-4 py-3 border-b border-gray-100 last:border-b-0 transition-all ${
                        d.disabled ? "opacity-40 cursor-default" : "cursor-pointer hover:bg-gray-50"
                      } ${!d.disabled && selectedDelivery === i ? "bg-gray-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          !d.disabled && selectedDelivery === i ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                          {!d.disabled && selectedDelivery === i && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-[11px] sm:text-xs text-gray-700 leading-tight">{d.label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900 ml-2 flex-shrink-0">{d.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── CTA ── */}
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-base py-4 rounded-lg transition-colors mb-3">
                In den Warenkorb
              </button>
              <p className="text-center text-xs text-gray-400 mb-5">
                Voraussichtl. Lieferdatum <strong className="text-gray-700">13.03.26 – 27.03.26</strong>
              </p>

              {/* ── Trust badges ── */}
              {/* Switched to a grid on very small screens to avoid horizontal crowding */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-t border-gray-100 mb-4">
                {[
                  { icon: "🚚", l1: "Kostenloser", l2: "Versand" },
                  { icon: "🏆", l1: "3 Mio",       l2: "Kunden" },
                  { icon: "🛡️", l1: "2 Jahre",     l2: "Garantie" },
                ].map((b) => (
                  <div key={b.l1} className="text-center">
                    <div className="text-2xl mb-1">{b.icon}</div>
                    <p className="text-xs text-gray-500 font-medium">{b.l1}</p>
                    <p className="text-xs text-gray-500 font-medium">{b.l2}</p>
                  </div>
                ))}
              </div>

              {/* ── Accordions ── */}
              <div className="border-t border-gray-100">
                {accordionData.map((a) => (
                  <div key={a.key} className="border-b border-gray-100">
                    <button onClick={() => setOpenAccordion(openAccordion === a.key ? null : a.key)}
                      className="w-full flex items-center justify-between py-4 text-left">
                      <span className="text-xs font-black tracking-widest uppercase text-gray-800">{a.key}</span>
                      <svg className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${openAccordion === a.key ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openAccordion === a.key && (
                      <p className="text-xs text-gray-500 leading-relaxed pb-4">{a.content}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-300 mt-3 pb-6">* 30-Tage-Bestpreis: 1.210,44 €</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}