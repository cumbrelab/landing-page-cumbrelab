/* ============================================================
   CumbreLab — Incorporación guiada (motor)
   - Recorrido acompañado por las preguntas (window.ONB)
   - Autoguardado en localStorage (pausar y volver)
   - Scoring de calidad de llenado (5 dimensiones)
   - Documento final: Resumen (cliente) + Scorecard (agencia)
   - Envío a Google Sheet + mensaje de WhatsApp
============================================================ */
(function () {
  'use strict';

  var WA_NUMBER = '593990064933';
  var YT_URL = 'https://www.youtube.com/@cumbrelab';
  var SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxJeUow2J8wUzdZtz0-TnEupKyhyafiny9KJzU09vU_aZcBZQACvk-wWYE5aPQv2Q/exec';
  var STORE_KEY = 'cumbre_onboarding_v1';
  var LANDING_URL = 'index.html'; // página principal del sitio

  var Q = window.ONB.QUESTIONS;
  var SECTIONS = window.ONB.SECTIONS;
  var PACT = window.ONB.PACT;

  var state = { i: 0, answers: {} };
  var root, stage, railList, bar, stepCount, btnNext, btnBack, companion;

  // ── util ─────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  }); }
  function words(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }
  function qById(id) { for (var i = 0; i < Q.length; i++) if (Q[i].id === id) return Q[i]; return null; }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) { var s = JSON.parse(raw); if (s && s.answers) state = s; }
    } catch (e) {}
  }

  // ── ¿respondida? ─────────────────────────────────────────
  function answered(q) {
    var a = state.answers[q.id];
    if (q.type === 'duo') {
      if (!a) return false;
      // requerida => todos los campos con valor
      return q.fields.every(function (f) { return a[f.key] && a[f.key].trim().length > 1; });
    }
    if (q.type === 'multi' || q.type === 'checklist') return !!(a && a.length);
    if (q.type === 'radio') return !!a;
    return !!(a && String(a).trim().length > 1);
  }
  function satisfied(q) { return !q.req || answered(q); }

  // ── init ─────────────────────────────────────────────────
  function build() {
    root = document.getElementById('onb-root');

    root.innerHTML =
      // INTRO / PACTO
      '<section class="onb-screen" data-screen="intro">' +
        '<nav class="onb-sitenav">' +
          '<a class="onb-brand" href="' + LANDING_URL + '">' + brandSvg() + '<span>CumbreLab</span></a>' +
          '<a class="onb-sitenav-back" href="' + LANDING_URL + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Volver a la página</a>' +
        '</nav>' +
        '<div class="onb-intro">' +
          '<div class="onb-kicker">' + esc(PACT.kicker) + '</div>' +
          '<h1 class="onb-intro-title">' + PACT.title + '</h1>' +
          '<p class="onb-intro-lead">' + esc(PACT.lead) + '</p>' +
          '<div class="onb-pact">' + PACT.points.map(function (p, i) {
            return '<div class="onb-pact-item"><div class="onb-pact-num">0' + (i + 1) + '</div>' +
              '<div><strong>' + esc(p.t) + '</strong><span>' + esc(p.d) + '</span></div></div>';
          }).join('') + '</div>' +
          '<button type="button" class="btn btn-primary btn-xl" data-start>' + esc(PACT.commit) +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
          '</button>' +
          '<p class="onb-intro-time">' + esc(PACT.time) + '</p>' +
          '<button type="button" class="onb-resume" data-resume hidden>Tienes respuestas guardadas — continuar donde quedaste →</button>' +
        '</div>' +
      '</section>' +

      // WIZARD
      '<section class="onb-screen" data-screen="wizard">' +
        '<aside class="onb-rail">' +
          '<span class="onb-brand"><a href="' + LANDING_URL + '" aria-label="Volver a la página">' + brandSvg() + '</a><span>CumbreLab</span></span>' +
          '<ol class="onb-rail-list" data-rail></ol>' +
          '<div class="onb-rail-foot">' +
            '<div class="onb-rail-note" data-companion></div>' +
          '</div>' +
        '</aside>' +
        '<main class="onb-main">' +
          '<div class="onb-topbar">' +
            '<div class="onb-progress"><div class="onb-progress-fill" data-bar></div></div>' +
            '<span class="onb-count" data-count></span>' +
          '</div>' +
          '<div class="onb-stage" data-stage></div>' +
          '<footer class="onb-nav">' +
            '<button type="button" class="onb-back" data-back><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Atrás</button>' +
            '<span class="onb-nav-spacer"></span>' +
            '<span class="onb-hint" data-hint></span>' +
            '<button type="button" class="btn btn-primary onb-next" data-next>Continuar' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
            '</button>' +
          '</footer>' +
        '</main>' +
      '</section>' +

      // RESULT
      '<section class="onb-screen" data-screen="result"><div class="onb-doc" data-doc></div></section>';

    stage = root.querySelector('[data-stage]');
    railList = root.querySelector('[data-rail]');
    bar = root.querySelector('[data-bar]');
    stepCount = root.querySelector('[data-count]');
    btnNext = root.querySelector('[data-next]');
    btnBack = root.querySelector('[data-back]');
    companion = root.querySelector('[data-companion]');

    buildRail();

    root.querySelector('[data-start]').addEventListener('click', function () { goWizard(0); });
    var resumeBtn = root.querySelector('[data-resume]');
    if (Object.keys(state.answers).length) {
      resumeBtn.hidden = false;
      resumeBtn.addEventListener('click', function () { goWizard(firstUnanswered()); });
    }
    btnNext.addEventListener('click', next);
    btnBack.addEventListener('click', back);
    document.addEventListener('keydown', function (e) {
      if (root.getAttribute('data-screen') !== 'wizard') return;
      if (e.key === 'Enter' && (e.target.tagName !== 'TEXTAREA') && !btnNext.disabled) next();
    });
  }

  function firstUnanswered() {
    for (var i = 0; i < Q.length; i++) if (!satisfied(Q[i])) return i;
    return Q.length - 1;
  }

  function brandSvg() {
    return '<svg viewBox="0 0 120 110" fill="none"><path d="M60 12 L111 100 L99 100 L60 34 L21 100 L9 100 Z" fill="currentColor"/><path d="M60 34 L96 100 L84 100 L60 54 L36 100 L24 100 Z" fill="currentColor" opacity=".7"/><path d="M60 54 L81 100 L69 100 L60 78 L51 100 L39 100 Z" fill="currentColor" opacity=".45"/></svg>';
  }

  // ── rail ─────────────────────────────────────────────────
  function sectionComplete(sid) {
    return Q.filter(function (q) { return q.section === sid; }).every(satisfied);
  }
  function buildRail() {
    railList.innerHTML = SECTIONS.map(function (s) {
      return '<li class="onb-rail-item" data-sec="' + s.id + '">' +
        '<span class="onb-rail-dot"><span class="onb-rail-num">' + s.num + '</span>' +
          '<svg class="onb-rail-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
        '</span>' +
        '<span class="onb-rail-title">' + esc(s.title) + '</span>' +
      '</li>';
    }).join('');
    railList.querySelectorAll('.onb-rail-item').forEach(function (li) {
      li.addEventListener('click', function () {
        var sid = li.getAttribute('data-sec');
        for (var i = 0; i < Q.length; i++) if (Q[i].section === sid) { go(i); break; }
      });
    });
  }
  function refreshRail() {
    var curSec = Q[state.i].section;
    railList.querySelectorAll('.onb-rail-item').forEach(function (li) {
      var sid = li.getAttribute('data-sec');
      li.classList.toggle('is-active', sid === curSec);
      li.classList.toggle('is-done', sectionComplete(sid) && sid !== curSec);
    });
  }

  // ── screens ──────────────────────────────────────────────
  function goWizard(i) {
    root.setAttribute('data-screen', 'wizard');
    go(i);
    window.scrollTo(0, 0);
  }

  function go(i) {
    state.i = Math.max(0, Math.min(Q.length - 1, i));
    renderStep();
    save();
  }
  function next() {
    if (btnNext.disabled) return;
    if (state.i >= Q.length - 1) { finish(); return; }
    go(state.i + 1);
  }
  function back() { if (state.i > 0) go(state.i - 1); }

  // ── render de un paso ────────────────────────────────────
  function renderStep() {
    var q = Q[state.i];
    var sec = SECTIONS.filter(function (s) { return s.id === q.section; })[0];
    var idxInSec = Q.filter(function (x) { return x.section === q.section; }).indexOf(q) + 1;
    var secTotal = Q.filter(function (x) { return x.section === q.section; }).length;

    var html = '<div class="onb-step">' +
      '<div class="onb-step-kicker"><span class="onb-step-sec">' + sec.num + ' · ' + esc(sec.title) + '</span>' +
        '<span class="onb-step-mini">' + idxInSec + ' / ' + secTotal + '</span></div>' +
      '<h2 class="onb-q">' + esc(q.q) + (q.req ? '' : '<span class="onb-opt">opcional</span>') + '</h2>' +
      '<p class="onb-help">' + esc(q.help) + '</p>' +
      renderInput(q) +
      (q.companion ? '<div class="onb-companion"><span class="onb-companion-mark">' + brandSvg() + '</span><p>' + esc(q.companion) + '</p></div>' : '') +
    '</div>';
    stage.innerHTML = html;

    bindInput(q);

    // progreso + contador
    var pct = ((state.i) / Q.length) * 100;
    bar.style.width = pct + '%';
    stepCount.textContent = 'Pregunta ' + (state.i + 1) + ' de ' + Q.length;
    btnBack.hidden = state.i === 0;
    companion.textContent = sec.companion;

    // botón final
    btnNext.querySelector('svg') && (btnNext.childNodes[0].nodeValue = state.i >= Q.length - 1 ? 'Ver mi diagnóstico' : 'Continuar');

    refreshRail();
    refreshNext();
    stage.scrollTop = 0;
    // foco al primer campo de texto
    var f = stage.querySelector('input, textarea');
    if (f) setTimeout(function () { f.focus(); }, 80);
  }

  function refreshNext() {
    var q = Q[state.i];
    var ok = satisfied(q);
    btnNext.disabled = !ok;
    var hint = root.querySelector('[data-hint]');
    if (q.req && !answered(q)) hint.textContent = 'Responde para continuar';
    else if (!q.req && !answered(q)) hint.textContent = 'Puedes saltar esta';
    else hint.textContent = '';
  }

  function renderInput(q) {
    var a = state.answers[q.id];
    if (q.type === 'text') {
      return '<div class="onb-field"><input class="onb-input" type="text" data-in ' +
        'placeholder="' + esc(q.placeholder || '') + '" ' +
        (q.autocomplete ? 'autocomplete="' + q.autocomplete + '" ' : '') +
        'value="' + esc(a || '') + '" /></div>';
    }
    if (q.type === 'textarea') {
      return '<div class="onb-field"><textarea class="onb-input onb-textarea" data-in rows="4" ' +
        'placeholder="' + esc(q.placeholder || '') + '">' + esc(a || '') + '</textarea>' +
        '<div class="onb-meta-row"><span class="onb-depth" data-depth></span>' +
        (q.optionalNote ? '<span class="onb-optnote">' + esc(q.optionalNote) + '</span>' : '') +
        '</div></div>';
    }
    if (q.type === 'duo') {
      return '<div class="onb-duo">' + q.fields.map(function (f) {
        var v = a && a[f.key] ? a[f.key] : '';
        return '<div class="onb-field"><label class="onb-label">' + esc(f.label) + '</label>' +
          '<input class="onb-input" type="text" data-duo="' + f.key + '" ' +
          (f.autocomplete ? 'autocomplete="' + f.autocomplete + '" ' : '') +
          'placeholder="' + esc(f.placeholder || '') + '" value="' + esc(v) + '" /></div>';
      }).join('') + '</div>';
    }
    if (q.type === 'radio') {
      return '<div class="onb-options">' + q.options.map(function (o, j) {
        var sel = a && a.val === o.val ? ' is-sel' : '';
        return '<button type="button" class="onb-opt' + sel + '" data-opt="' + j + '">' + tickSvg() +
          '<span>' + esc(o.label) + '</span></button>';
      }).join('') + '</div>';
    }
    if (q.type === 'multi' || q.type === 'checklist') {
      var arr = Array.isArray(a) ? a : [];
      var cls = q.type === 'checklist' ? ' onb-checklist' : '';
      var opts = q.options.map(function (o, j) {
        var sel = arr.indexOf(o.val) > -1 ? ' is-sel' : '';
        return '<button type="button" class="onb-opt onb-opt-check' + sel + '" data-multi="' + j + '">' + boxSvg() +
          '<span>' + esc(o.label) + '</span></button>';
      }).join('');
      var other = '';
      if (q.allowOther) {
        var otherVal = '';
        arr.forEach(function (v) { if (q.options.every(function (o) { return o.val !== v; })) otherVal = v; });
        other = '<div class="onb-field onb-other"><input class="onb-input" type="text" data-other ' +
          'placeholder="Otro mercado…" value="' + esc(otherVal) + '" /></div>';
      }
      return '<div class="onb-options' + cls + '">' + opts + '</div>' + other;
    }
    return '';
  }

  function tickSvg() { return '<span class="onb-opt-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>'; }
  function boxSvg() { return '<span class="onb-opt-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>'; }

  // ── bind inputs del paso ─────────────────────────────────
  function bindInput(q) {
    if (q.type === 'text') {
      var inp = stage.querySelector('[data-in]');
      inp.addEventListener('input', function () { state.answers[q.id] = inp.value; refreshNext(); save(); });
    }
    if (q.type === 'textarea') {
      var ta = stage.querySelector('[data-in]');
      var depthEl = stage.querySelector('[data-depth]');
      var upd = function () {
        state.answers[q.id] = ta.value; refreshNext(); save();
        if (depthEl && q.depth) {
          var w = words(ta.value);
          var lvl = w === 0 ? '' : w < 8 ? 'Bien — cuéntanos un poco más' : w < 20 ? 'Buen detalle ✓' : 'Excelente, muy claro ✓';
          depthEl.textContent = lvl;
          depthEl.className = 'onb-depth' + (w >= 20 ? ' is-full' : w >= 8 ? ' is-mid' : '');
        }
      };
      ta.addEventListener('input', upd); upd();
    }
    if (q.type === 'duo') {
      stage.querySelectorAll('[data-duo]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var cur = state.answers[q.id] || {};
          cur[inp.getAttribute('data-duo')] = inp.value;
          state.answers[q.id] = cur; refreshNext(); save();
        });
      });
    }
    if (q.type === 'radio') {
      stage.querySelectorAll('[data-opt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var o = q.options[+btn.getAttribute('data-opt')];
          state.answers[q.id] = o;
          stage.querySelectorAll('.onb-opt').forEach(function (b) { b.classList.remove('is-sel'); });
          btn.classList.add('is-sel');
          refreshNext(); save();
          setTimeout(function () { if (state.i === Q.indexOf(q) && !btnNext.disabled) next(); }, 280);
        });
      });
    }
    if (q.type === 'multi' || q.type === 'checklist') {
      stage.querySelectorAll('[data-multi]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var o = q.options[+btn.getAttribute('data-multi')];
          var arr = Array.isArray(state.answers[q.id]) ? state.answers[q.id].slice() : [];
          var pos = arr.indexOf(o.val);
          if (pos > -1) arr.splice(pos, 1); else arr.push(o.val);
          state.answers[q.id] = arr;
          btn.classList.toggle('is-sel');
          refreshNext(); save();
        });
      });
      var other = stage.querySelector('[data-other]');
      if (other) {
        other.addEventListener('input', function () {
          var arr = Array.isArray(state.answers[q.id]) ? state.answers[q.id].slice() : [];
          // quitar cualquier valor "otro" previo (los que no están en opciones)
          arr = arr.filter(function (v) { return q.options.some(function (o) { return o.val === v; }); });
          if (other.value.trim()) arr.push(other.value.trim());
          state.answers[q.id] = arr; refreshNext(); save();
        });
      }
    }
  }

  // ============================================================
  //  SCORING — calidad de llenado
  // ============================================================
  function fieldScore(q) {
    var a = state.answers[q.id];
    if (q.type === 'duo') {
      if (!a) return 0;
      var filled = q.fields.filter(function (f) { return a[f.key] && a[f.key].trim().length > 1; }).length;
      return filled / q.fields.length;
    }
    if (q.type === 'radio') return a ? 1 : 0;
    if (q.type === 'multi') { var n = (a || []).length; return n === 0 ? 0 : n === 1 ? 0.7 : 1; }
    if (q.type === 'checklist') { var c = (a || []).length; return Math.min(1, c / 4); }
    // texto / textarea
    if (q.depth) {
      var w = words(a);
      return w === 0 ? 0 : w < 8 ? 0.45 : w < 20 ? 0.8 : 1;
    }
    return a && String(a).trim().length > 1 ? 1 : 0;
  }

  function score() {
    // global
    var sw = 0, sum = 0;
    Q.forEach(function (q) { sw += q.w; sum += fieldScore(q) * q.w; });
    var overall = Math.round((sum / sw) * 100);

    // por dimensión
    var dims = {};
    Q.forEach(function (q) {
      if (!dims[q.dim]) dims[q.dim] = { w: 0, s: 0 };
      dims[q.dim].w += q.w; dims[q.dim].s += fieldScore(q) * q.w;
    });
    var dimList = SECTIONS.map(function (s) {
      var d = dims[s.id] || { w: 1, s: 0 };
      return { id: s.id, title: s.title, pct: Math.round((d.s / d.w) * 100) };
    });

    // señales
    var modo = state.answers.modo;
    var modoSignal = modo ? (modo.signal != null ? modo.signal : 1) : 0;
    var ticketLow = state.answers.ticket && state.answers.ticket.val === 'Menos de $200';
    var avatarW = words(state.answers.avatar);
    var hasCasos = words(state.answers.casos) >= 6;

    var flags = [], strengths = [];
    if (modoSignal <= -1) flags.push('Espera que la agencia “haga todo”: alto riesgo de fricción y baja co-responsabilidad.');
    else if (modoSignal === 0) flags.push('Prefiere delegar casi todo: alinear expectativas de participación desde el kickoff.');
    else strengths.push('Cliente dispuesto a colaborar activamente en las decisiones.');

    if (ticketLow) flags.push('Ticket promedio bajo (<$200): validar viabilidad de pauta pagada y márgenes.');
    else strengths.push('Ticket promedio sano para sostener inversión en pauta.');

    if (avatarW < 12) flags.push('Cliente ideal poco definido: agendar sesión de avatar antes de crear anuncios.');
    else strengths.push('Cliente ideal bien descrito: base sólida para segmentar.');

    if (!hasCasos) flags.push('Sin casos de éxito claros para prueba social: prioridad recolectar testimonios.');
    else strengths.push('Casos de éxito disponibles para prueba social.');

    var thin = Q.filter(function (q) { return q.depth && q.req && words(state.answers[q.id]) < 8 && words(state.answers[q.id]) > 0; });
    if (thin.length >= 3) flags.push('Varias respuestas abiertas muy breves: pedir ampliación en el kickoff.');

    // veredicto
    var tier, verdict, action;
    if (overall >= 78 && modoSignal >= 1) {
      tier = 'listo';
      verdict = 'Cliente listo para arrancar';
      action = 'Calificado. Agendar kickoff y arrancar el Loop. Perfil completo y con buena disposición.';
    } else if (overall >= 55 && modoSignal >= 0) {
      tier = 'prometedor';
      verdict = 'Cliente prometedor — pulir detalles';
      action = 'Califica con matices. Cerrar los vacíos marcados en una llamada breve antes del kickoff.';
    } else {
      tier = 'revisar';
      verdict = 'Revisar antes de avanzar';
      action = 'Hay señales de desalineación o información insuficiente. Reunión de descubrimiento antes de comprometer plazas.';
    }

    return {
      overall: overall, dims: dimList, flags: flags, strengths: strengths,
      tier: tier, verdict: verdict, action: action,
      modoSignal: modoSignal
    };
  }

  // ============================================================
  //  DOCUMENTO FINAL
  // ============================================================
  function nameFirst() {
    var p = state.answers.persona;
    var n = p && p.nombre ? p.nombre.trim() : '';
    return n ? n.split(' ')[0] : '';
  }
  function biz() { return (state.answers.empresa || '').trim(); }
  function val(id) {
    var a = state.answers[id];
    if (!a) return '';
    if (a.val) return a.val;
    if (Array.isArray(a)) return a.join(', ');
    if (typeof a === 'object') return Object.keys(a).map(function (k) { return a[k]; }).filter(Boolean).join(' · ');
    return String(a);
  }

  function finish() {
    var s = score();
    sendToSheet(s);
    root.setAttribute('data-screen', 'result');
    renderDoc(s);
    window.scrollTo(0, 0);
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
  }

  function renderDoc(s) {
    var doc = root.querySelector('[data-doc]');
    var first = nameFirst();
    var company = biz() || 'tu negocio';
    var today = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.innerHTML =
      '<div class="onb-doc-top">' +
        '<a class="onb-brand" href="' + LANDING_URL + '">' + brandSvg() + '<span>CumbreLab</span></a>' +
        '<div class="onb-doc-tabs">' +
          '<button type="button" class="onb-tab is-active" data-tab="resumen">Resumen del negocio</button>' +
          '<button type="button" class="onb-tab" data-tab="score">Scorecard interno</button>' +
        '</div>' +
        '<div class="onb-doc-actions">' +
          '<button type="button" class="onb-doc-btn" data-print><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>Descargar / Imprimir</button>' +
        '</div>' +
      '</div>' +

      '<div class="onb-doc-view" data-view="resumen">' + docResumen(s, first, company, today) + '</div>' +
      '<div class="onb-doc-view" data-view="score" hidden>' + docScore(s, company, today) + '</div>';

    // tabs
    doc.querySelectorAll('.onb-tab').forEach(function (t) {
      t.addEventListener('click', function () {
        doc.querySelectorAll('.onb-tab').forEach(function (x) { x.classList.remove('is-active'); });
        t.classList.add('is-active');
        var name = t.getAttribute('data-tab');
        doc.querySelectorAll('.onb-doc-view').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== name; });
        doc.setAttribute('data-printing', name);
        window.scrollTo(0, 0);
      });
    });
    doc.setAttribute('data-printing', 'resumen');
    doc.querySelector('[data-print]').addEventListener('click', function () { window.print(); });

    // WhatsApp
    var wa = doc.querySelector('[data-go-wa]');
    if (wa) wa.setAttribute('href', 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(waMessage(s)));
  }

  function row(label, value) {
    return '<div class="onb-sum-row"><dt>' + esc(label) + '</dt><dd>' + (value ? esc(value) : '<span class="onb-empty">— sin responder —</span>') + '</dd></div>';
  }

  function docResumen(s, first, company, today) {
    var qualifies = s.tier !== 'revisar';
    var head =
      '<header class="onb-doc-head">' +
        '<div class="onb-kicker">Resumen de incorporación</div>' +
        '<h1 class="onb-doc-h1">' + esc(company) + '</h1>' +
        '<p class="onb-doc-sub">Preparado por CumbreLab · ' + esc(today) + (first ? ' · para ' + esc(first) : '') + '</p>' +
      '</header>';

    var completeness =
      '<div class="onb-doc-meter">' +
        '<div class="onb-meter-ring" style="--pct:' + s.overall + '">' +
          '<span>' + s.overall + '<i>%</i></span>' +
        '</div>' +
        '<div><div class="onb-meter-label">Calidad de tu perfil</div>' +
        '<p class="onb-meter-text">' + (s.overall >= 78 ? 'Perfil muy completo. Tenemos todo para arrancar con foco.' :
          s.overall >= 55 ? 'Buen perfil. Con un par de detalles más afinamos la estrategia al máximo.' :
          'Perfil inicial. Vale la pena completar algunos puntos para que el arranque sea certero.') + '</p></div>' +
      '</div>';

    var secciones = [
      ['Tu negocio', [
        ['Contacto', val('persona')],
        ['Empresa', val('empresa')],
        ['Equipo', val('tamano')],
        ['Ubicación', val('ubicacion')],
        ['Correos', val('contacto')],
        ['Socios / aliados', val('aliados')]
      ]],
      ['Lo que vendes', [
        ['Servicios y foco', val('servicios')],
        ['Ventaja diferencial', val('diferencia')],
        ['Problema que resuelve', val('beneficio')],
        ['Ticket promedio', val('ticket')]
      ]],
      ['Tus clientes', [
        ['Mercados actuales', val('mercados')],
        ['Cliente ideal', val('avatar')]
      ]],
      ['Lo que respalda', [
        ['Casos de éxito', val('casos')],
        ['Validación legal', val('legal')],
        ['Marketing previo', val('marketing')]
      ]],
      ['Cómo trabajaremos', [
        ['Metas 3m / 1 año', val('metas')],
        ['Ya tiene listo', val('accesos')],
        ['Modo de trabajo', val('modo')]
      ]]
    ].map(function (blk) {
      return '<section class="onb-sum-block"><h3>' + esc(blk[0]) + '</h3><dl class="onb-sum">' +
        blk[1].map(function (r) { return row(r[0], r[1]); }).join('') + '</dl></section>';
    }).join('');

    var next =
      '<section class="onb-next-box">' +
        '<h3>' + (qualifies ? 'Siguiente paso' : 'Cómo seguimos') + '</h3>' +
        '<p>' + (qualifies ?
          'Con esta información ya podemos preparar tu <strong>kickoff</strong>: revisamos juntos el mapa preliminar de tu Loop de Crecimiento y definimos las primeras campañas. Confirmemos fecha por WhatsApp.' :
          'Gracias por tu tiempo. Antes de avanzar nos gustaría conversar unos minutos para completar el panorama de ' + esc(company) + ' y asegurarnos de que el Loop es lo correcto para ti hoy.') + '</p>' +
        '<div class="onb-next-actions">' +
          '<a class="btn btn-primary" data-go-wa target="_blank" rel="noopener">Coordinar por WhatsApp' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11.94 11.94 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.6 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1 1-3.7-.2-.4c-1-1.6-1.6-3.4-1.6-5.3 0-5.5 4.5-10 10-10 2.7 0 5.2 1 7.1 2.9 1.9 1.9 2.9 4.4 2.9 7.1.2 5.6-4.3 10-9.9 10zm5.5-7.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.5-.5.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/></svg>' +
          '</a>' +
        '</div>' +
      '</section>';

    return head + completeness + '<div class="onb-sum-grid">' + secciones + '</div>' + next + community();
  }

  function community() {
    return '<section class="onb-community">' +
      '<div class="onb-community-glow"></div>' +
      '<div class="onb-kicker">Comunidad CumbreLab</div>' +
      '<h3>Mientras arrancamos, sigue aprendiendo.</h3>' +
      '<p>Seas cliente o estés explorando, entra a nuestra comunidad: un <strong>curso accesible</strong> con lo esencial del Loop de Crecimiento, plantillas y sesiones en vivo. Trabajamos en conjunto — y la comunidad es parte de eso.</p>' +
      '<div class="onb-community-actions">' +
        '<a class="btn btn-primary" href="' + YT_URL + '" target="_blank" rel="noopener">Entrar a la comunidad' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>' +
        '</a>' +
        '<span class="onb-community-note">Gratis · Nuevo contenido cada semana</span>' +
      '</div>' +
    '</section>';
  }

  function docScore(s, company, today) {
    var tierLabel = { listo: 'CALIFICA', prometedor: 'CALIFICA CON MATICES', revisar: 'REVISAR' }[s.tier];
    var head =
      '<header class="onb-doc-head">' +
        '<div class="onb-kicker">Scorecard interno · confidencial</div>' +
        '<h1 class="onb-doc-h1">' + esc(company) + '</h1>' +
        '<p class="onb-doc-sub">Evaluación automática de calidad de llenado · ' + esc(today) + '</p>' +
      '</header>';

    var verdict =
      '<div class="onb-verdict onb-verdict-' + s.tier + '">' +
        '<div class="onb-verdict-score"><span>' + s.overall + '</span><i>/100</i></div>' +
        '<div class="onb-verdict-body">' +
          '<span class="onb-verdict-tag">' + tierLabel + '</span>' +
          '<h3>' + esc(s.verdict) + '</h3>' +
          '<p>' + esc(s.action) + '</p>' +
        '</div>' +
      '</div>';

    var dims = '<div class="onb-dims"><h4>Calidad por dimensión</h4>' +
      s.dims.map(function (d) {
        var cls = d.pct >= 75 ? 'is-high' : d.pct >= 45 ? 'is-mid' : 'is-low';
        return '<div class="onb-dim ' + cls + '"><span class="onb-dim-label">' + esc(d.title) + '</span>' +
          '<span class="onb-dim-bar"><span style="width:' + d.pct + '%"></span></span>' +
          '<span class="onb-dim-pct">' + d.pct + '%</span></div>';
      }).join('') + '</div>';

    var cols =
      '<div class="onb-score-cols">' +
        '<div class="onb-score-col onb-flags"><h4>Banderas a revisar</h4>' +
          (s.flags.length ? '<ul>' + s.flags.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' :
            '<p class="onb-none">Sin banderas relevantes. 👌</p>') +
        '</div>' +
        '<div class="onb-score-col onb-strengths"><h4>Fortalezas</h4>' +
          (s.strengths.length ? '<ul>' + s.strengths.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' :
            '<p class="onb-none">—</p>') +
        '</div>' +
      '</div>';

    // apéndice de respuestas crudas
    var raw = '<div class="onb-raw"><h4>Respuestas completas</h4><dl class="onb-sum">' +
      Q.map(function (q) { return row(q.q, val(q.id)); }).join('') + '</dl></div>';

    return head + verdict + dims + cols + raw;
  }

  // ── WhatsApp + Sheet ─────────────────────────────────────
  function waMessage(s) {
    var l = [];
    l.push('Hola CumbreLab 👋 Completé el formulario de incorporación.');
    l.push('');
    l.push('• Negocio: ' + (biz() || '—'));
    l.push('• Contacto: ' + (val('persona') || '—'));
    l.push('• Sector prioritario: ' + (val('mercados') || '—'));
    l.push('• Ticket: ' + (val('ticket') || '—'));
    l.push('• Modo de trabajo: ' + (val('modo') || '—'));
    l.push('• Calidad de perfil: ' + s.overall + '/100');
    l.push('');
    l.push('¿Coordinamos el kickoff?');
    return l.join('\n');
  }

  function sendToSheet(s) {
    if (!SHEET_ENDPOINT) return;
    var payload = {
      tipo: 'onboarding',
      nombre: (state.answers.persona && state.answers.persona.nombre) || '',
      rol: (state.answers.persona && state.answers.persona.rol) || '',
      negocio: biz(),
      tamano: val('tamano'), ubicacion: val('ubicacion'), contacto: val('contacto'),
      aliados: val('aliados'), servicios: val('servicios'), diferencia: val('diferencia'),
      beneficio: val('beneficio'), ticket: val('ticket'), mercados: val('mercados'),
      avatar: val('avatar'), casos: val('casos'), legal: val('legal'), marketing: val('marketing'),
      metas: val('metas'), accesos: val('accesos'), modo: val('modo'),
      calidad: s.overall, veredicto: s.verdict, tier: s.tier,
      banderas: s.flags.join(' | ')
    };
    try {
      fetch(SHEET_ENDPOINT, { method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }).catch(function () {});
    } catch (e) {}
  }

  // ── boot ─────────────────────────────────────────────────
  function init() { load(); build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
