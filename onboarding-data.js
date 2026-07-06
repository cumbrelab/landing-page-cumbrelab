/* ============================================================
   CumbreLab — Incorporación guiada (contenido)
   Preguntas del formulario de onboarding, reescritas con
   tono de trabajo en conjunto (cliente ⇄ agencia).
   Cada pregunta declara su dimensión de calidad + peso.
   Dimensiones: contexto · oferta · mercado · prueba · compromiso
============================================================ */
(function () {
  'use strict';

  // ── El pacto de colaboración (pantalla de entrada) ───────
  var PACT = {
    kicker: 'Antes de empezar',
    title: 'Esto lo construimos <em>juntos</em>.',
    lead: 'CumbreLab no es una agencia que “hace todo por ti” mientras miras. ' +
          'El Loop de Crecimiento funciona porque tú conoces tu negocio y nosotros el sistema. ' +
          'Este formulario es el primer trabajo en equipo: mientras mejor lo llenes, más rápido y ' +
          'más certero arranca tu crecimiento.',
    points: [
      { t: 'Tú aportas el contexto', d: 'Nadie conoce tu producto, tus clientes y tu mercado como tú. Eso no se delega.' },
      { t: 'Nosotros aportamos el sistema', d: 'Estrategia, pauta y data. Convertimos tu contexto en un motor de ventas.' },
      { t: 'Decidimos en conjunto', d: 'Reuniones cada 15 días. Tú apruebas la dirección; nosotros ejecutamos y medimos.' }
    ],
    commit: 'Entiendo que mi participación honesta es parte del resultado. Empecemos.',
    time: '± 8–12 min · Puedes pausar y volver — tus respuestas se guardan en este dispositivo.'
  };

  // ── Secciones ────────────────────────────────────────────
  var SECTIONS = [
    { id: 'contexto',   num: '01', title: 'Tu negocio',        companion: 'Empecemos por lo básico: quién eres y desde dónde construimos.' },
    { id: 'oferta',     num: '02', title: 'Lo que vendes',     companion: 'Ahora lo importante: qué ofreces y por qué la gente te elige.' },
    { id: 'mercado',    num: '03', title: 'Tus clientes',      companion: 'A quién le hablamos define cada anuncio que vamos a crear.' },
    { id: 'prueba',     num: '04', title: 'Lo que respalda',   companion: 'Lo que ya lograste es la materia prima de tu credibilidad.' },
    { id: 'compromiso', num: '05', title: 'Cómo trabajaremos', companion: 'El último tramo: metas, herramientas y nuestro modo de colaborar.' }
  ];

  // ── Preguntas ────────────────────────────────────────────
  // type: text | textarea | radio | multi | duo | checklist
  // dim:  dimensión de calidad · w: peso relativo
  // depth:true → puntúa por profundidad (nº de palabras) en textareas
  var QUESTIONS = [
    // ─────────── 01 · CONTEXTO ───────────
    {
      section: 'contexto', id: 'persona', type: 'duo', dim: 'contexto', w: 1, req: true,
      q: '¿Con quién trabajaremos de tu lado?',
      help: 'Vamos a tratar directo contigo. Queremos saber tu nombre y qué rol tienes.',
      companion: 'Nada de intermediarios perdidos: sabemos a quién escribir y quién decide.',
      fields: [
        { key: 'nombre', label: 'Tu nombre completo', placeholder: 'Ej. Andrea Salazar', autocomplete: 'name' },
        { key: 'rol', label: 'Tu rol en el negocio', placeholder: 'Ej. Dueña / Gerente de marketing', autocomplete: 'organization-title' }
      ]
    },
    {
      section: 'contexto', id: 'empresa', type: 'text', dim: 'contexto', w: 1, req: true,
      q: '¿Cómo se llama tu empresa o marca?',
      help: 'El nombre con el que te conoce tu cliente.',
      placeholder: 'Ej. Clínica Odentix', autocomplete: 'organization'
    },
    {
      section: 'contexto', id: 'tamano', type: 'radio', dim: 'contexto', w: 1, req: true,
      q: '¿De qué tamaño es tu equipo hoy?',
      help: 'Nos ayuda a calibrar el ritmo y el tipo de acompañamiento.',
      companion: 'No hay tamaño “correcto”: solo nos ubica.',
      options: [
        { label: 'Somos de 1 a 10', val: '1–10 personas' },
        { label: 'Entre 11 y 50', val: '11–50 personas' },
        { label: 'Entre 51 y 100', val: '51–100 personas' },
        { label: 'Más de 100', val: '+100 personas' }
      ]
    },
    {
      section: 'contexto', id: 'ubicacion', type: 'duo', dim: 'contexto', w: 1, req: true,
      q: '¿Dónde opera tu negocio?',
      help: 'Ciudad y país principales de operación.',
      fields: [
        { key: 'pais', label: 'País', placeholder: 'Ej. Ecuador', autocomplete: 'country-name' },
        { key: 'ciudad', label: 'Ciudad', placeholder: 'Ej. Quito' }
      ]
    },
    {
      section: 'contexto', id: 'contacto', type: 'text', dim: 'contexto', w: 1, req: true,
      q: '¿A qué correos coordinamos el proyecto?',
      help: 'Uno o varios, separados por coma. Aquí llegan carpetas, reportes y accesos.',
      companion: 'Incluye a quien deba estar en el loop (contabilidad, ventas, tú).',
      placeholder: 'nombre@empresa.com, ventas@empresa.com', autocomplete: 'email'
    },
    {
      section: 'contexto', id: 'aliados', type: 'textarea', dim: 'contexto', w: 0.5, req: false, depth: true,
      q: '¿Hay socios, aliados o personas clave que debamos conocer?',
      help: 'Co-fundadores, aliados de marca, proveedores estratégicos. Opcional, pero suma.',
      placeholder: 'Ej. Mi socio Luis lleva operaciones. Tenemos alianza con la Cámara de la Construcción…',
      optionalNote: 'Puedes saltar esta si no aplica.'
    },

    // ─────────── 02 · OFERTA ───────────
    {
      section: 'oferta', id: 'servicios', type: 'textarea', dim: 'oferta', w: 1.4, req: true, depth: true,
      q: '¿Qué vendes hoy y en qué quieres que enfoquemos el crecimiento?',
      help: 'Lista tus servicios/productos y márcanos el que más te interesa escalar.',
      companion: 'Sé concreto: “vendo X, Y, Z — pero quiero llenar la agenda de X”.',
      placeholder: 'Ej. Ofrecemos ortodoncia, limpieza y blanqueamiento. Quiero enfocar el crecimiento en ortodoncia de adultos.'
    },
    {
      section: 'oferta', id: 'diferencia', type: 'textarea', dim: 'oferta', w: 1.2, req: true, depth: true,
      q: '¿Qué hace que elijan tu producto y no el de al lado?',
      help: 'Materiales, procesos, garantía, experiencia, precio… tu ventaja real.',
      companion: 'Esto se vuelve el corazón de tus anuncios. Mientras más honesto, mejor convierte.',
      placeholder: 'Ej. Somos los únicos en la ciudad con tecnología X, damos garantía de por vida y atendemos el mismo día.'
    },
    {
      section: 'oferta', id: 'beneficio', type: 'textarea', dim: 'oferta', w: 1.2, req: true, depth: true,
      q: '¿Qué problema real le resuelves a tu cliente?',
      help: 'No la función — el cambio en su vida o su negocio.',
      companion: 'La gente no compra taladros, compra el agujero. ¿Cuál es tu “agujero”?',
      placeholder: 'Ej. Les devolvemos la confianza para sonreír sin taparse la boca en fotos y reuniones.'
    },
    {
      section: 'oferta', id: 'ticket', type: 'radio', dim: 'oferta', w: 1, req: true,
      q: '¿Cuánto factura en promedio un cliente contigo?',
      help: 'El ticket promedio. Define cuánto podemos invertir por lead con retorno sano.',
      companion: 'Un rango está perfecto — no necesitamos el número exacto.',
      options: [
        { label: 'Menos de $200', val: 'Menos de $200' },
        { label: 'Entre $200 y $1.000', val: '$200 – $1.000' },
        { label: 'Entre $1.000 y $5.000', val: '$1.000 – $5.000' },
        { label: 'Más de $5.000', val: 'Más de $5.000' }
      ]
    },

    // ─────────── 03 · MERCADO ───────────
    {
      section: 'mercado', id: 'mercados', type: 'multi', dim: 'mercado', w: 1, req: true,
      q: '¿A qué mercados pertenecen tus clientes hoy?',
      help: 'Marca todos los que apliquen. Puedes añadir uno propio.',
      options: [
        { label: 'Inmobiliarias', val: 'Inmobiliarias' },
        { label: 'Clínicas médicas', val: 'Clínicas médicas' },
        { label: 'Arquitectos', val: 'Arquitectos' },
        { label: 'Software / tecnología', val: 'Software / tecnología' },
        { label: 'Constructoras', val: 'Constructoras' },
        { label: 'Retail / consumo', val: 'Retail / consumo' },
        { label: 'Servicios profesionales', val: 'Servicios profesionales' }
      ],
      allowOther: true
    },
    {
      section: 'mercado', id: 'avatar', type: 'textarea', dim: 'mercado', w: 1.6, req: true, depth: true,
      q: 'Si pudieras clonar a tu mejor cliente, ¿cómo sería?',
      help: 'A qué mercado quieres apuntar como prioridad y cómo es esa persona: edad, cargo, qué le duele, cómo decide.',
      companion: 'Este es el retrato al que le vamos a hablar. Mientras más nítido, menos dinero desperdiciamos.',
      placeholder: 'Ej. Mujeres de 30–50, profesionales, que valoran su imagen, con capacidad de pago, que investigan mucho antes de decidir…'
    },

    // ─────────── 04 · PRUEBA ───────────
    {
      section: 'prueba', id: 'casos', type: 'textarea', dim: 'prueba', w: 1.3, req: true, depth: true,
      q: '¿Quiénes ya te compraron y quedaron felices?',
      help: 'Nombres de clientes o casos que podamos usar como testimonio (con su permiso). Números si los tienes.',
      companion: 'Tu mejor vendedor es un cliente contento. Danos con qué trabajar.',
      placeholder: 'Ej. La familia Pérez (caso de $8k), Constructora ABC. Tengo 3 clientes dispuestos a dar testimonio en video.'
    },
    {
      section: 'prueba', id: 'legal', type: 'textarea', dim: 'prueba', w: 0.7, req: false, depth: true,
      q: '¿Tienes certificaciones, permisos o registros que den confianza?',
      help: 'Registro sanitario, marca registrada, licencias, premios… Opcional pero potente.',
      placeholder: 'Ej. Permiso ARCSA, marca registrada en el IEPI, certificación ISO 9001.',
      optionalNote: 'Si no aplica, puedes saltarla.'
    },
    {
      section: 'prueba', id: 'marketing', type: 'textarea', dim: 'prueba', w: 1, req: true, depth: true,
      q: '¿Qué has intentado antes en marketing y cómo te fue?',
      help: 'Agencias, pauta, freelancers, ferias, referidos… Lo que funcionó y lo que no.',
      companion: 'Aprendemos de tu historia para no repetir lo que ya sabes que no sirve.',
      placeholder: 'Ej. Contraté una agencia 6 meses: muchos likes, cero ventas. Meta Ads por mi cuenta sin saber medir. Boca a boca es mi mejor canal.'
    },

    // ─────────── 05 · COMPROMISO ───────────
    {
      section: 'compromiso', id: 'metas', type: 'textarea', dim: 'compromiso', w: 1.3, req: true, depth: true,
      q: '¿Qué quieres lograr en 3 meses? ¿Y en un año?',
      help: 'Metas concretas y medibles si puedes: ventas, leads, sucursales, facturación.',
      companion: 'Trabajamos con ingeniería inversa: de tu meta construimos el sistema hacia atrás.',
      placeholder: 'Ej. En 3 meses: 30 pacientes nuevos/mes. En 1 año: abrir una segunda sede y duplicar facturación.'
    },
    {
      section: 'compromiso', id: 'accesos', type: 'checklist', dim: 'compromiso', w: 1, req: false,
      q: '¿Qué de esto ya tienes listo?',
      help: 'Marca lo que ya existe. No subas nada ahora — lo conectamos juntos en el kickoff.',
      companion: 'Cuanto más ya tengas ordenado, más rápido despegamos. Nada es obligatorio hoy.',
      options: [
        { label: 'Google Drive con material de ventas (brochures, pitch, catálogos)', val: 'Material de ventas' },
        { label: 'Logos, banners y piezas gráficas de la marca', val: 'Piezas gráficas / marca' },
        { label: 'Un CRM donde registran clientes', val: 'CRM' },
        { label: 'Agendador de reuniones (Calendly, HubSpot…)', val: 'Agendador de reuniones' },
        { label: 'Base de clientes / métricas pasadas (Excel, reportes)', val: 'Base de clientes / métricas' },
        { label: 'Números de WhatsApp del equipo para el grupo del proyecto', val: 'WhatsApp del equipo' }
      ]
    },
    {
      section: 'compromiso', id: 'modo', type: 'radio', dim: 'compromiso', w: 1.4, req: true,
      q: '¿Cómo te imaginas trabajando con nosotros?',
      help: 'Seamos honestos desde el día uno. Esto define si somos el equipo correcto para ti.',
      companion: 'No hay respuesta “bonita”. La real nos ahorra fricción a los dos.',
      options: [
        { label: 'En equipo: entro a las reuniones quincenales, doy contexto y decido rápido', val: 'Colaboración activa', signal: 2 },
        { label: 'Colaboro, pero necesito que me guíen paso a paso al inicio', val: 'Colaboración con guía', signal: 1 },
        { label: 'Prefiero delegar casi todo y revisar solo resultados', val: 'Delegación alta', signal: 0 },
        { label: 'Quiero que la agencia haga absolutamente todo sin molestarme', val: 'Delegación total', signal: -1 }
      ]
    }
  ];

  window.ONB = { PACT: PACT, SECTIONS: SECTIONS, QUESTIONS: QUESTIONS };
})();
