// app.jsx — Tweaks overlay for CumbreLab landing
// Headline A/B/C · CTA variation · Plazas counter · Section numbering on/off

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "headline": "A",
  "cta": "A",
  "plazas": 3,
  "showNumbers": true,
  "greenIntensity": "balanced"
}/*EDITMODE-END*/;

// Headline copy variations
const HEADLINES = {
  A: `En 30 días tienes el <em>mapa real</em> de tu negocio en redes.<br/>Desde ahí, <span class="hl">construimos ventas</span>.`,
  B: `No somos otra agencia que te llena el feed.<br/>Somos el sistema que convierte tu marca en <span class="hl">ventas medibles</span>.`,
  C: `Tu negocio tiene producto.<br/>Lo que le falta es el <em>sistema</em>. <span class="hl">Eso construimos.</span>`
};

const CTAS = {
  A: "Aplicar al Loop de Crecimiento",
  B: "Quiero saber si mi negocio califica",
  C: "Agendar reunión estratégica"
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply headline
  React.useEffect(() => {
    const el = document.querySelector('[data-tweak-headline]');
    if (el) el.innerHTML = HEADLINES[t.headline] || HEADLINES.A;
  }, [t.headline]);

  // Apply CTA copy (only to hero CTA — keep final CTA as is)
  React.useEffect(() => {
    const el = document.querySelector('[data-tweak-cta]');
    if (el) {
      const copy = CTAS[t.cta] || CTAS.A;
      // preserve trailing arrow icon
      el.innerHTML = `${copy}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
    }
  }, [t.cta]);

  // Plazas number + bar
  React.useEffect(() => {
    const numEl = document.querySelector('[data-tweak-plazas]');
    const fillEl = document.querySelector('[data-tweak-plazas-fill]');
    const total = 4;
    const filled = Math.max(0, Math.min(total, total - t.plazas));
    const pct = (filled / total) * 100;
    if (numEl) numEl.textContent = String(t.plazas);
    if (fillEl) fillEl.style.width = `${pct}%`;
  }, [t.plazas]);

  // Toggle section numbers
  React.useEffect(() => {
    document.querySelectorAll('.eyebrow-num').forEach(el => {
      el.style.display = t.showNumbers ? '' : 'none';
    });
  }, [t.showNumbers]);

  // Green intensity (subtle: scales the hero glow + bg radials)
  React.useEffect(() => {
    const root = document.documentElement;
    const map = {
      muted:    '.06',
      balanced: '.10',
      bold:     '.18'
    };
    root.style.setProperty('--green-glow', `rgba(168,255,176,${map[t.greenIntensity] || '.10'})`);
    // Also bump hero glow visibility
    const glow = document.querySelector('.hero-glow');
    if (glow) glow.style.opacity = t.greenIntensity === 'bold' ? '1.4' : (t.greenIntensity === 'muted' ? '.5' : '1');
  }, [t.greenIntensity]);

  return (
    <TweaksPanel title="Tweaks · CumbreLab">
      <TweakSection label="Headline (A/B/C test)" />
      <TweakRadio
        label="Variante"
        value={t.headline}
        options={['A', 'B', 'C']}
        onChange={(v) => setTweak('headline', v)}
      />
      <div style={{ fontSize: 10.5, lineHeight: 1.4, color: 'rgba(41,38,27,.55)', padding: '2px 0 6px' }}>
        {t.headline === 'A' && 'A · Sistema + Resultado medible (recomendada)'}
        {t.headline === 'B' && 'B · Diferenciación anti-agencia'}
        {t.headline === 'C' && 'C · Urgencia + Cima'}
      </div>

      <TweakSection label="Botón principal (Hero)" />
      <TweakRadio
        label="Copy del CTA"
        value={t.cta}
        options={['A', 'B', 'C']}
        onChange={(v) => setTweak('cta', v)}
      />
      <div style={{ fontSize: 10.5, lineHeight: 1.4, color: 'rgba(41,38,27,.55)', padding: '2px 0 6px' }}>
        "{CTAS[t.cta]}"
      </div>

      <TweakSection label="Escasez" />
      <TweakSlider
        label="Plazas disponibles"
        value={t.plazas}
        min={0}
        max={4}
        step={1}
        unit=" / 4"
        onChange={(v) => setTweak('plazas', v)}
      />

      <TweakSection label="Apariencia" />
      <TweakToggle
        label="Mostrar números de sección"
        value={t.showNumbers}
        onChange={(v) => setTweak('showNumbers', v)}
      />
      <TweakRadio
        label="Intensidad del verde"
        value={t.greenIntensity}
        options={['muted', 'balanced', 'bold']}
        onChange={(v) => setTweak('greenIntensity', v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<App />);
