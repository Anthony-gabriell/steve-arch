/**
 * Vibrant green, faint background detail.
 */
(function () {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  const DOT_COUNT = 80;
  const MAX_DIST = 150;
  const SPEED = 0.4;

  const DOT_COLOR = 'rgba(46, 232, 176, 0.15)';
  const LINE_COLOR = 'rgba(46, 232, 176, 0.08)';

  const dots = [];
  for (let i = 0; i < DOT_COUNT; i++) {
    dots.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      radius: 1.2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          ctx.beginPath();
          ctx.strokeStyle = LINE_COLOR;
          ctx.lineWidth = 0.5;
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      ctx.beginPath();
      ctx.fillStyle = DOT_COLOR;
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > width) d.vx *= -1;
      if (d.y < 0 || d.y > height) d.vy *= -1;
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', function () {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    for (let i = 0; i < dots.length; i++) {
      if (dots[i].x > width) dots[i].x = Math.random() * width;
      if (dots[i].y > height) dots[i].y = Math.random() * height;
    }
  });

  draw();
})();
