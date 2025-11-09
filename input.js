export class InputHandler {
  constructor() {
    this.keys = {
      left: false,
      right: false
    };

    window.addEventListener("keydown", (e) => this.keyChange(e, true));
    window.addEventListener("keyup", (e) => this.keyChange(e, false));

    window.addEventListener("touchstart", (e) => this.handleTouch(e, true));
    window.addEventListener("touchend", (e) => this.handleTouch(e, false));
  }

  keyChange(e, isDown) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      this.keys.left = isDown;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      this.keys.right = isDown;
    }
  }

  handleTouch(e, isDown) {
    const touch = e.changedTouches[0];
    const x = touch.clientX;

    if (x < window.innerWidth / 2) {
      this.keys.left = isDown;
    } else {
      this.keys.right = isDown;
    }
  }
}
