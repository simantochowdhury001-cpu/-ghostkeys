/* GhostKeys Matrix rain */
(() => {
  'use strict';

  const canvas = document.getElementById('rain');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!context) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = Array.from(
    'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF'
  );

  let paused = false;
  let batterySaver = false;
  let frame = 0;
  let previous = 0;
  let width = 0;
  let height = 0;
  let columns = [];
  let options;

  function number(style, name, fallback, min, max) {
    const value = parseFloat(style.getPropertyValue(name));

    return Math.min(
      max,
      Math.max(min, Number.isFinite(value) ? value : fallback)
    );
  }

  function readOptions() {
    const style = getComputedStyle(document.body);

    options = {
      color:
        style.getPropertyValue('--rain-color').trim() || '#1aff3c',
      size: number(style, '--rain-size', 16, 10, 40),
      speed: number(style, '--rain-speed', 1, 0.1, 4),
      fps: number(
        style,
        batterySaver ? '--saver-fps' : '--rain-fps',
        batterySaver ? 18 : 60,
        5,
        60
      )
    };

    context.font = `${options.size}px monospace`;
    context.textBaseline = 'top';
  }

  function resize() {
    const pixelRatio = Math.min(devicePixelRatio || 1, 1.5);

    width = Math.max(
      1,
      Math.min(innerWidth, screen.width || innerWidth)
    );

    height = Math.max(
      1,
      Math.min(innerHeight, screen.height || innerHeight)
    );

    canvas.width = Math.ceil(width * pixelRatio);
    canvas.height = Math.ceil(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    readOptions();

    const spacing = options.size * (batterySaver ? 2.5 : 1.35);

    columns = Array.from(
      { length: Math.ceil(width / spacing) },
      (_, index) => ({
        x: index * spacing,
        y: Math.random() * height,
        speed: 55 + Math.random() * 100,
        length: 5 + Math.floor(Math.random() * 9),
        offset: Math.floor(Math.random() * glyphs.length)
      })
    );

    if (reduced.matches) {
      context.clearRect(0, 0, width, height);
    }
  }

  function running() {
    return !paused && !reduced.matches && !document.hidden;
  }

  function draw(time) {
    frame = 0;
    if (!running()) return;

    frame = requestAnimationFrame(draw);

    if (previous && time - previous < 1000 / options.fps) {
      return;
    }

    const elapsed = previous
      ? Math.min((time - previous) / 1000, 0.1)
      : 0;

    previous = time;

    context.clearRect(0, 0, width, height);
    context.fillStyle = options.color;

    const phase = Math.floor(time / 180);

    for (const column of columns) {
      column.y += column.speed * options.speed * elapsed;

      if (column.y - column.length * options.size > height) {
        column.y = -options.size;
      }

      for (let index = column.length - 1; index >= 0; index--) {
        const y = column.y - index * options.size;

        if (y < -options.size || y > height) continue;

        context.globalAlpha = index === 0
          ? 1
          : 0.65 * (1 - index / column.length);

        const glyph =
          glyphs[
            (column.offset + phase + index * 7) % glyphs.length
          ];

        context.fillText(glyph, column.x, y);
      }
    }

    context.globalAlpha = 1;
  }

  function sync() {
    if (frame) cancelAnimationFrame(frame);

    frame = 0;
    previous = 0;

    if (reduced.matches) {
      context.clearRect(0, 0, width, height);
    }

    if (running()) {
      frame = requestAnimationFrame(draw);
    }
  }

  function configure(settings = {}) {
    if (typeof settings.paused === 'boolean') {
      paused = settings.paused;
    }

    if (typeof settings.batterySaver === 'boolean') {
      batterySaver = settings.batterySaver;
    }

    resize();
    sync();
  }

  window.GhostRain = {
    configure,
    refresh: () => configure()
  };

  document.addEventListener('ghost-motion', event => {
    configure(event.detail || {});
  });

  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);

  addEventListener('resize', () => {
    resize();
    sync();
  });

  window.visualViewport?.addEventListener('resize', () => {
    resize();
    sync();
  });

  new MutationObserver(() => {
    readOptions();
    sync();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class', 'style']
  });

  resize();
  sync();
})();
