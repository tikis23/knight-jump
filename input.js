export class InputHandler {
  constructor() {
    this.keys = {
      left: false,
      right: false
    };

    window.addEventListener("keydown", (e) => this.keyChange(e, true));
    window.addEventListener("keyup", (e) => this.keyChange(e, false));
  }

  keyChange(e, isDown) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      this.keys.left = isDown;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      this.keys.right = isDown;
    }
  }
}
