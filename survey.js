/* ============================================================
   CumbreLab — Encuesta de calificación
   Vanilla JS. Independiente de React/Tweaks.
   - 6 preguntas + paso de contacto
   - Scoring con 3 filtros duros (decisor · producto vendiendo · inversión)
   - Califica  -> WhatsApp con resumen de respuestas
   - No califica -> mensaje amable, SIN WhatsApp
============================================================ */
(function () {
  'use strict';

  var WA_NUMBER = '593990064933'; // CumbreLab Ecuador
  var YT_URL = 'https://www.youtube.com/@cumbrelab';

  // Google Apps Script web app — recibe cada lead en la Hoja de Google.
  // Para cambiarla, reemplaza esta URL (debe terminar en /exec).
  var SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxJeUow2J8wUzdZtz0-TnEupKyhyafiny9KJzU09vU_aZcBZQACvk-wWYE5aPQv2Q/exec';

  // ── Modelo de preguntas ──────────────────────────────────
  // disq:true  => respuesta que descalifica (filtro duro)
  var QUESTIONS = [
    {
      id: 'rol',
      kicker: 'Sobre ti',
      q: '¿Cuál es tu rol en el negocio?',
      help: 'Trabajamos directo con quien toma las decisiones.',
      options: [
        { label: 'Soy dueño o socio', val: 'Dueño / socio' },
        { label: 'Dirijo marketing o ventas', val: 'Dirección de marketing/ventas' },
        { label: 'Trabajo en el equipo', val: 'Parte del equipo' },
        { label: 'Estoy explorando una idea aún', val: 'Explorando una idea', disq: true }
      ]
    },
    {
      id: 'sector',
      kicker: 'Tu negocio',
      q: '¿En qué sector se mueve tu negocio?',
      help: 'Nos ayuda a entender tu ciclo de venta.',
      options: [
        { label: 'Clínica o salud', val: 'Clínica / salud' },
        { label: 'Inmobiliaria o construcción', val: 'Inmobiliaria / construcción' },
        { label: 'Software o tecnología', val: 'Software / tecnología' },
        { label: 'Retail o consumo', val: 'Retail / consumo' },
        { label: 'Servicios profesionales', val: 'Servicios profesionales' },
        { label: 'Otro sector', val: 'Otro' }
      ]
    },
    {
      id: 'etapa',
      kicker: 'Momento actual',
      q: '¿En qué punto está hoy tu negocio?',
      help: 'El Loop acelera lo que ya funciona — no valida ideas.',
      options: [
        { label: 'Ya vendo de forma constante', val: 'Vende de forma constante' },
        { label: 'Vendo, pero de forma irregular', val: 'Ventas irregulares' },
        { label: 'Recién estoy arrancando', val: 'Recién arrancando' },
        { label: 'Todavía es una idea / la estoy validando', val: 'Idea en validación', disq: true }
      ]
    },
    {
      id: 'experiencia',
      kicker: 'Experiencia previa',
      q: '¿Has invertido antes en publicidad o agencias?',
      help: 'No hay respuesta mala — solo nos ubica.',
      options: [
        { label: 'Sí, y me funcionó', val: 'Sí, con resultados' },
        { label: 'Sí, pero no vi resultados claros', val: 'Sí, sin resultados claros' },
        { label: 'No, sería mi primera vez', val: 'Primera vez' }
      ]
    },
    {
      id: 'inversion',
      kicker: 'Inversión',
      q: '¿Cuánto podrías destinar al mes a marketing + pauta?',
      help: 'Incluye lo que pagas a Meta. Sé honesto: filtra por ti.',
      options: [
        { label: 'Menos de $300 / aún no puedo invertir', val: 'Menos de $300', disq: true },
        { label: 'Entre $300 y $800', val: '$300 – $800' },
        { label: 'Entre $800 y $2.000', val: '$800 – $2.000' },
        { label: 'Más de $2.000', val: 'Más de $2.000' }
      ]
    },
    {
      id: 'urgencia',
      kicker: 'Tiempos',
      q: '¿Cuándo te gustaría empezar?',
      help: 'Solo abrimos 4 plazas nuevas por trimestre.',
      options: [
        { label: 'Lo antes posible', val: 'Lo antes posible' },
        { label: 'En los próximos 1–3 meses', val: 'En 1–3 meses' },
        { label: 'Solo estoy investigando por ahora', val: 'Investigando' }
      ]
    }
  ];

  var state = { step: 0, answers: {}, name: '' };
  var els = {};

  // ── Construcción del DOM ─────────────────────────────────
  function tick() {
    return '<span class="qz-opt-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>';
  }

  function build() {
    var overlay = document.createElement('div');
    overlay.className = 'qz-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Encuesta de calificación CumbreLab');

    var totalSteps = QUESTIONS.length + 1; // + contacto

    var stepsHtml = QUESTIONS.map(function (qq, i) {
      var opts = qq.options.map(function (o, j) {
        return '<button type="button" class="qz-opt" data-step="' + i + '" data-idx="' + j + '">' +
          tick() + '<span>' + o.label + '</span></button>';
      }).join('');
      return '<div class="qz-step" data-step="' + i + '">' +
        '<div class="qz-kicker">' + qq.kicker + '</div>' +
        '<h3 class="qz-q">' + qq.q + '</h3>' +
        '<p class="qz-help">' + qq.help + '</p>' +
        '<div class="qz-options">' + opts + '</div>' +
        '</div>';
    }).join('');

    // Paso de contacto
    var contactStep = '<div class="qz-step" data-step="' + QUESTIONS.length + '">' +
      '<div class="qz-kicker">Casi listo</div>' +
      '<h3 class="qz-q">¿Cómo te llamas?</h3>' +
      '<p class="qz-help">Para que el diagnóstico llegue a tu nombre, no a un número.</p>' +
      '<div class="qz-field">' +
      '<label class="qz-label" for="qz-name">Tu nombre</label>' +
      '<input class="qz-input" id="qz-name" type="text" autocomplete="given-name" placeholder="Escribe tu nombre" />' +
      '</div>' +
      '<div class="qz-field">' +
      '<label class="qz-label" for="qz-biz">Nombre de tu negocio <span>(opcional)</span></label>' +
      '<input class="qz-input" id="qz-biz" type="text" autocomplete="organization" placeholder="Ej. Clínica Odentix" />' +
      '</div>' +
      '</div>';

    // Resultados
    var resultGood = '<div class="qz-result" data-result="good">' +
      '<div class="qz-result-badge good"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>' +
      '<h3 class="qz-result-title" data-good-title>Tu negocio encaja con el Loop.</h3>' +
      '<p class="qz-result-text" data-good-text></p>' +
      '<dl class="qz-summary" data-summary></dl>' +
      '<div class="qz-result-actions">' +
      '<a class="btn btn-primary qz-wa-btn" href="onboarding.html">Completar mi incorporación' +
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
      '</a>' +
      '<a class="btn qz-alt-btn" data-go-wa target="_blank" rel="noopener">Prefiero coordinar por WhatsApp' +
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11.94 11.94 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.6 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1 1-3.7-.2-.4c-1-1.6-1.6-3.4-1.6-5.3 0-5.5 4.5-10 10-10 2.7 0 5.2 1 7.1 2.9 1.9 1.9 2.9 4.4 2.9 7.1.2 5.6-4.3 10-9.9 10zm5.5-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.5-.5.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/></svg>' +
      '</a>' +
      '<p class="qz-result-micro">Tus respuestas guían tu incorporación · También puedes coordinar por WhatsApp.</p>' +
      '</div>' +
      '</div>';

    var resultSoft = '<div class="qz-result" data-result="soft">' +
      '<div class="qz-result-badge soft"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5"/><circle cx="12" cy="16.5" r=".6" fill="currentColor"/><circle cx="12" cy="12" r="9"/></svg></div>' +
      '<h3 class="qz-result-title" data-soft-title>Gracias por tu honestidad.</h3>' +
      '<p class="qz-result-text" data-soft-text></p>' +
      '<div class="qz-result-actions">' +
      '<a class="btn qz-yt-btn" href="' + YT_URL + '" target="_blank" rel="noopener">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>' +
      'Aprende gratis en nuestro canal' +
      '</a>' +
      '<button type="button" class="qz-result-link" data-close-result>Volver a la página</button>' +
      '</div>' +
      '</div>';

    overlay.innerHTML =
      '<div class="qz-card">' +
        '<div class="qz-head">' +
          '<span class="qz-brand">' +
            '<svg viewBox="0 0 120 110" fill="none"><path d="M60 12 L111 100 L99 100 L60 34 L21 100 L9 100 Z" fill="currentColor"/><path d="M60 34 L96 100 L84 100 L60 54 L36 100 L24 100 Z" fill="currentColor" opacity=".7"/><path d="M60 54 L81 100 L69 100 L60 78 L51 100 L39 100 Z" fill="currentColor" opacity=".45"/></svg>' +
            '<span class="qz-brand-word">CumbreLab</span>' +
          '</span>' +
          '<span class="qz-step-count" data-count></span>' +
          '<button type="button" class="qz-close" data-close aria-label="Cerrar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="qz-progress"><div class="qz-progress-fill" data-fill></div></div>' +
        '<div class="qz-body" data-body>' +
          stepsHtml + contactStep + resultGood + resultSoft +
        '</div>' +
        '<div class="qz-foot" data-foot>' +
          '<button type="button" class="qz-back" data-back><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Atrás</button>' +
          '<span class="qz-foot-spacer"></span>' +
          '<span class="qz-hint" data-hint>Elige una opción</span>' +
          '<button type="button" class="btn btn-primary qz-next" data-next disabled>Continuar' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    els.overlay = overlay;
    els.body = overlay.querySelector('[data-body]');
    els.fill = overlay.querySelector('[data-fill]');
    els.count = overlay.querySelector('[data-count]');
    els.foot = overlay.querySelector('[data-foot]');
    els.back = overlay.querySelector('[data-back]');
    els.next = overlay.querySelector('[data-next]');
    els.hint = overlay.querySelector('[data-hint]');
    els.totalSteps = totalSteps;

    bindEvents();
  }

  // ── Eventos ──────────────────────────────────────────────
  function bindEvents() {
    // Selección de opción
    els.body.querySelectorAll('.qz-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = +btn.dataset.step;
        var idx = +btn.dataset.idx;
        var stepEl = els.body.querySelector('.qz-step[data-step="' + step + '"]');
        stepEl.querySelectorAll('.qz-opt').forEach(function (b) { b.classList.remove('is-sel'); });
        btn.classList.add('is-sel');
        state.answers[QUESTIONS[step].id] = QUESTIONS[step].options[idx];
        enableNext(true);
        // auto-avance suave
        setTimeout(function () {
          if (state.step === step) goNext();
        }, 260);
      });
    });

    // Nombre (paso contacto)
    var nameInput = els.body.querySelector('#qz-name');
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        state.name = nameInput.value.trim();
        var biz = els.body.querySelector('#qz-biz');
        state.biz = biz ? biz.value.trim() : '';
        enableNext(state.name.length >= 2);
      });
      nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && state.name.length >= 2) goNext();
      });
    }

    els.next.addEventListener('click', goNext);
    els.back.addEventListener('click', goBack);

    els.overlay.querySelectorAll('[data-close], [data-close-result]').forEach(function (b) {
      b.addEventListener('click', close);
    });
    els.overlay.addEventListener('click', function (e) {
      if (e.target === els.overlay) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.overlay.classList.contains('is-open')) close();
    });
  }

  function enableNext(on) {
    els.next.disabled = !on;
    els.hint.style.visibility = on ? 'hidden' : 'visible';
  }

  // ── Navegación ───────────────────────────────────────────
  function render() {
    var total = els.totalSteps;
    // ocultar todo
    els.body.querySelectorAll('.qz-step, .qz-result').forEach(function (s) {
      s.classList.remove('is-active');
    });
    var current = els.body.querySelector('.qz-step[data-step="' + state.step + '"]');
    if (current) current.classList.add('is-active');

    // progreso
    var pct = (state.step / total) * 100;
    els.fill.style.width = pct + '%';
    els.count.textContent = 'Paso ' + (state.step + 1) + ' de ' + total;

    // back visible salvo en el primero
    els.back.hidden = state.step === 0;

    // estado del botón Continuar según si hay respuesta
    if (state.step < QUESTIONS.length) {
      var qid = QUESTIONS[state.step].id;
      enableNext(!!state.answers[qid]);
    } else {
      enableNext(state.name && state.name.length >= 2);
      els.next.innerHTML = 'Ver mi resultado<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    }

    // body scroll al tope
    els.body.scrollTop = 0;
  }

  function goNext() {
    if (els.next.disabled) return;
    if (state.step < QUESTIONS.length) {
      state.step++;
      render();
    } else {
      finish();
    }
  }

  function goBack() {
    if (state.step > 0) {
      state.step--;
      render();
    }
  }

  // ── Resultado ────────────────────────────────────────────
  function isQualified() {
    // Filtro duro: ninguna respuesta marcada disq
    var disq = QUESTIONS.some(function (qq) {
      var a = state.answers[qq.id];
      return a && a.disq;
    });
    return !disq;
  }

  function buildSummaryRows() {
    var map = [
      ['Rol', 'rol'],
      ['Sector', 'sector'],
      ['Etapa', 'etapa'],
      ['Pauta previa', 'experiencia'],
      ['Inversión/mes', 'inversion'],
      ['Empezar', 'urgencia']
    ];
    return map.map(function (m) {
      var a = state.answers[m[1]];
      return { k: m[0], v: a ? a.val : '—' };
    });
  }

  function waMessage() {
    var rows = buildSummaryRows();
    var lines = [];
    lines.push('Hola CumbreLab 👋 Completé el diagnóstico en su web y quiero agendar la reunión estratégica.');
    lines.push('');
    lines.push('Soy ' + state.name + (state.biz ? ' — ' + state.biz : '') + '. Mi perfil:');
    rows.forEach(function (r) { lines.push('• ' + r.k + ': ' + r.v); });
    lines.push('');
    lines.push('¿Califico para el Loop de Crecimiento?');
    return lines.join('\n');
  }

  // ── Envío a Google Sheets ────────────────────────────────
  function sendToSheet(qualified) {
    if (!SHEET_ENDPOINT) return;
    var a = state.answers;
    var val = function (id) { return a[id] ? a[id].val : ''; };
    var motivo = qualified ? '' : softReason().title;
    var payload = {
      nombre: state.name || '',
      negocio: state.biz || '',
      rol: val('rol'),
      sector: val('sector'),
      etapa: val('etapa'),
      experiencia: val('experiencia'),
      inversion: val('inversion'),
      urgencia: val('urgencia'),
      califico: qualified,
      motivo: motivo
    };
    try {
      // text/plain evita el preflight CORS; Apps Script lee igual el body.
      fetch(SHEET_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) { /* silencioso: nunca bloquea al usuario */ }
  }

  function finish() {
    var qualified = isQualified();
    sendToSheet(qualified);
    els.body.querySelectorAll('.qz-step, .qz-result').forEach(function (s) {
      s.classList.remove('is-active');
    });
    els.fill.style.width = '100%';
    els.foot.style.display = 'none';
    els.count.textContent = qualified ? 'Calificas' : 'Resultado';

    if (qualified) {
      var good = els.body.querySelector('[data-result="good"]');
      good.classList.add('is-active');
      var first = state.name ? state.name.split(' ')[0] : '';
      good.querySelector('[data-good-title]').textContent =
        (first ? first + ', ' : '') + 'tu negocio encaja con el Loop.';
      good.querySelector('[data-good-text]').innerHTML =
        'Por tu perfil, eres exactamente con quien trabajamos. El siguiente paso es una ' +
        '<strong>reunión estratégica gratis de 30 min</strong> donde te entregamos un ' +
        '<span class="hl">diagnóstico inicial</span> — califiques o no para avanzar después.';
      // resumen
      var dl = good.querySelector('[data-summary]');
      dl.innerHTML = buildSummaryRows().map(function (r) {
        return '<div class="qz-summary-row"><dt>' + r.k + '</dt><dd>' + r.v + '</dd></div>';
      }).join('');
      // WA link
      var wa = good.querySelector('[data-go-wa]');
      wa.setAttribute('href', 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(waMessage()));
    } else {
      var soft = els.body.querySelector('[data-result="soft"]');
      soft.classList.add('is-active');
      var reason = softReason();
      soft.querySelector('[data-soft-title]').textContent = reason.title;
      soft.querySelector('[data-soft-text]').innerHTML = reason.text;
    }
    els.body.scrollTop = 0;
  }

  function softReason() {
    var a = state.answers;
    // Mensajes honestos según el motivo principal
    if (a.rol && a.rol.disq) {
      return {
        title: 'Todavía es pronto para el Loop.',
        text: 'El Loop de Crecimiento está pensado para negocios <strong>en marcha</strong>, no para validar ideas. ' +
              'Cuando tu proyecto ya tenga producto y primeras ventas, vuelve por aquí — <span class="hl">te vamos a recibir con gusto</span>.'
      };
    }
    if (a.etapa && a.etapa.disq) {
      return {
        title: 'Aún no es tu momento — y está bien.',
        text: 'El Loop <strong>acelera lo que ya funciona</strong>; no valida ideas desde cero. ' +
              'Primero consigue tus primeras ventas de forma constante. Cuando eso pase, el sistema te va a potenciar de verdad.'
      };
    }
    if (a.inversion && a.inversion.disq) {
      return {
        title: 'Seamos honestos contigo.',
        text: 'Por debajo de cierto presupuesto, la publicidad pagada no rinde y no queremos hacerte gastar en vano. ' +
              'Cuando puedas destinar una inversión sostenible al mes, <span class="hl">conversamos sin problema</span>. Preferimos decírtelo antes que cobrarte de más.'
      };
    }
    return {
      title: 'Gracias por tu honestidad.',
      text: 'Por ahora no es el calce ideal, pero los negocios cambian rápido. ' +
            'Síguenos y, cuando tu situación evolucione, <span class="hl">el Loop seguirá aquí</span>.'
    };
  }

  // ── Open / Close ─────────────────────────────────────────
  function reset() {
    state = { step: 0, answers: {}, name: '', biz: '' };
    els.body.querySelectorAll('.qz-opt.is-sel').forEach(function (b) { b.classList.remove('is-sel'); });
    var n = els.body.querySelector('#qz-name'); if (n) n.value = '';
    var bz = els.body.querySelector('#qz-biz'); if (bz) bz.value = '';
    els.foot.style.display = '';
    els.next.innerHTML = 'Continuar<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    render();
  }

  function open() {
    reset();
    els.overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    els.overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    build();
    // Cualquier elemento con [data-survey] abre el modal
    document.querySelectorAll('[data-survey]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    });
    window.CumbreSurvey = { open: open, close: close };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
