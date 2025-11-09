export class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.objects = [];

    // canvas size change handlind
    const resizeCanvas = () => {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.ctx.imageSmoothingEnabled = false;
      this.render();
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  }

  addObject(obj) {
    this.objects.push(obj);
    this.objects.sort((a, b) => a.zIndex - b.zIndex);
  }

  removeObject(obj) {
    const index = this.objects.indexOf(obj);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }

  getBackgroundColor(yOffset) {
    const palette = [
      "#4b2e2a", "#cfa17a",
      "#2f5d35", "#8fcf8a",
      "#246b6b", "#6ad1d1",
    ];

    yOffset = Math.max(0, yOffset / 50);
    const hexToRgb = h => {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
      return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
    };

    const lerp = (a, b, t) => a + (b - a) * t;
    const lerpColor = (c1, c2, t) =>
      `rgb(${Math.round(lerp(c1[0], c2[0], t))},${Math.round(lerp(c1[1], c2[1], t))},${Math.round(lerp(c1[2], c2[2], t))})`;

    const n = Math.floor(yOffset);
    const idx = ((n % palette.length) + palette.length) % palette.length;
    const t = yOffset - Math.floor(yOffset);

    const start = hexToRgb(palette[idx]);
    const end = hexToRgb(palette[(idx + 1) % palette.length]);
    return lerpColor(start, end, t);
  }

  render(yOffset, drawHitboxes = false) {
    this.ctx.fillStyle = this.getBackgroundColor(yOffset);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const obj of this.objects) {
      if (drawHitboxes) {
        const x = obj.x * this.canvas.width;
        const y = this.canvas.height - (obj.y - yOffset + obj.height) * this.canvas.height;
        const width = obj.width * this.canvas.width;
        const height = obj.height * this.canvas.height;

        this.ctx.fillStyle = "green";
        this.ctx.fillRect(x, y, width, height);
      }

      const x = (obj.x + obj.offsetX) * this.canvas.width;
      const y = this.canvas.height - (obj.y + obj.offsetY - yOffset + obj.height) * this.canvas.height;
      const width = obj.width * this.canvas.width;
      const height = obj.height * this.canvas.height;

      if (obj.sprite) {
        if (obj.mirrorX) {
          this.ctx.save();
          this.ctx.scale(-1, 1);
          obj.sprite.draw(this.ctx, -x - width, y, width, height);
          this.ctx.restore();
          continue;
        }
        obj.sprite.draw(this.ctx, x, y, width, height);
      } else { // placeholder
        this.ctx.fillStyle = "pink";
        this.ctx.fillRect(x, y, width, height);
      }
    }
  }

  showScore(score) {
    this.ctx.fillStyle = "white";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    this.ctx.fillText(`${score}`, this.canvas.width / 2, 10);
  }

  showTitleScreen() {
    this.ctx.fillStyle = "white";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "bottom";
    this.ctx.fillText("Press A/D or ←/→ to move", this.canvas.width / 2, this.canvas.height);
  }
}