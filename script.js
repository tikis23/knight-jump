import { InputHandler } from "./input.js";
import { Renderer } from "./renderer.js";
import { sprites, waitForTilesets } from "./sprites.js";
import { sounds, initSounds, playSound, playLoopingSound } from "./audio.js";

const renderer = new Renderer("gameCanvas");
const input = new InputHandler();
let game = {};
let lastTime = performance.now();

const newGame = () => {
  return {
    musicSource: null,
    player: null,
    platforms: [],
    height: 0,
    maxHeight: 0,
    coins: 0,
    keepAliveHeight: 2.5,
    showTitle: true
  };
};

class BaseObject {
  constructor(sprite, x, y, width, height, offsetX = 0, offsetY = 0, zIndex = 0) {
    this.sprite = sprite;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.zIndex = zIndex;
    this.mirrorX = false;

    renderer.addObject(this);
  }

  destroy() {
    renderer.removeObject(this);
  }
}

const PlatformSpecialTypes = {
  NONE: 0,
  JUMPY: 1,
  BREAKABLE: 2
}

class Coin extends BaseObject {
  constructor(platform, x, y) {
    super(sprites.coinAnim[0], x, y, 0.05, 0.05, 0, 0, 1);

    this.platform = platform;
    this.accumTime = 0;
    this.currentFrame = 0;
  }

  update(dt) {
    this.accumTime += dt;
    if (this.accumTime >= 0.1) {
      this.accumTime = 0;
      this.currentFrame = (this.currentFrame + 1) % sprites.coinAnim.length;
      this.sprite = sprites.coinAnim[this.currentFrame];
    }

    if (game.player.x + game.player.width > this.x &&
      game.player.x < this.x + this.width &&
      game.player.y + game.player.height > this.y &&
      game.player.y < this.y + this.height) {
      game.coins += 1;
      playSound(sounds.coin);
      this.destroy();
    }
  }

  destroy() {
    this.platform.coin = null;
    super.destroy();
  }
}

class Platform extends BaseObject {
  constructor(sprite, x, y, width, height, specialType, hasCoin = false, moveSpeed = 0, moveRange = 0) {
    super(sprite, x, y, width, height);
    this.moveSpeed = moveSpeed;
    this.moveRange = moveRange;
    this.startX = x;
    this.specialType = specialType;
    if (hasCoin) {
      this.coinOffset = Math.random() * (this.width - 0.08) + 0.04;
      this.coin = new Coin(
        this,
        this.x + this.coinOffset,
        this.y + this.height
      );
    }

    if (this.specialType === PlatformSpecialTypes.JUMPY) {
      this.sprite = sprites.yellowPlatform;
    } else if (this.specialType === PlatformSpecialTypes.BREAKABLE) {
      this.sprite = sprites.icePlatform;
    }
  }

  update(dt) {
    if (this.x < 0) {
      this.moveSpeed = Math.abs(this.moveSpeed);
    } else if (this.x + this.width > 1) {
      this.moveSpeed = -Math.abs(this.moveSpeed);
    } else if (Math.abs(this.x - this.startX) >= this.moveRange) {
      this.moveSpeed = -this.moveSpeed;
    }
    this.x += this.moveSpeed * dt;

    if (this.coin) {
      this.coin.x = this.x + this.coinOffset;
      this.coin.y = this.y + this.height;
      this.coin.update(dt);
    }
  }

  destroy() {
    if (this.coin) {
      this.coin.destroy();
      this.coin = null;
    }
    super.destroy();
  }
}

class Player extends BaseObject {
  constructor(x, y, width, height) {
    super(null, x, y, width, height, 0, -0.015, 100);

    this.jumpSprite = sprites.knightJump;
    this.fallSprite = sprites.knightFall;
    this.sprite = this.jumpSprite;

    this.gravity = -5;
    this.jumpPower = 1.8;
    this.yVelocity = 0;
    this.moveSpeed = 1.1;
  }

  jump(dt, platform) {
    if (game.showTitle) {
      return;
    }
    if (platform.specialType === PlatformSpecialTypes.NONE) {
      this.yVelocity = this.jumpPower;
      playSound(sounds.jump);
    } else if (platform.specialType === PlatformSpecialTypes.BREAKABLE) {
      platform.destroy();
      const index = game.platforms.indexOf(platform);
      if (index > -1) {
        game.platforms.splice(index, 1);
      }

      this.yVelocity = this.jumpPower;
      playSound(sounds.jumpBreak);
    } else if (platform.specialType === PlatformSpecialTypes.JUMPY) {
      this.yVelocity = this.jumpPower * 2.2;
      playSound(sounds.jumpJumpy);
    }

  }

  update(dt) {
    if (input.keys.left) {
      this.x -= this.moveSpeed * dt;
      this.mirrorX = true;
    }
    if (input.keys.right) {
      this.x += this.moveSpeed * dt;
      this.mirrorX = false;
    }

    if (game.showTitle) {
      this.yVelocity = 0;
    }

    // velocity
    this.y += this.yVelocity * dt;
    this.yVelocity += this.gravity * dt;

    // bounds
    this.x = Math.max(0, Math.min(1 - this.width, this.x));

    // platform jump
    for (const platform of game.platforms) {
      if (this.yVelocity <= 0 &&
        this.x + this.width > platform.x &&
        this.x < platform.x + platform.width &&
        this.y <= platform.y + platform.height &&
        this.y >= platform.y) {
        this.y = platform.y + platform.height;
        this.jump(dt, platform);
      }
    }

    // camera animation
    const heightPadding = this.getMaxJumpHeight() + 0.1;
    const newHeight = this.y - 0.1 - heightPadding;

    if (newHeight < game.height - heightPadding) {
      game.height = newHeight + heightPadding;
    }
    game.height = Math.max(game.height, newHeight);

    // sprite
    if (this.yVelocity > 0) {
      this.sprite = this.jumpSprite;
    } else {
      this.sprite = this.fallSprite;
    }
  }

  getMaxJumpHeight() {
    return (this.jumpPower * this.jumpPower) / (2 * -this.gravity);
  }
}

function removeOldPlatforms() {
  for (let i = 0; i < game.platforms.length; i++) {
    if (game.platforms[i].y < game.height - game.keepAliveHeight) {
      game.platforms[i].destroy();
      game.platforms.splice(i, 1);
      i--;
    }
  }
}

function generatePlatforms() {
  const randomPlatformWidth = (y) => Math.max(0.07, 0.2 - y / 850) + Math.random() * 0.05;
  const randomPlatformHeight = (y) => 0.035;
  const randomPlatformX = (y) => Math.random() * (1 - 0.2);
  const randomPlatformY = (y) => game.player.getMaxJumpHeight() * 0.2 + (Math.random() * game.player.getMaxJumpHeight() * 0.8);
  const randomNormalPlatformType = (y) => {
    const startMix = 10;
    const endMix = 300;
    if (y < startMix) {
      return sprites.brownPlatform;
    }
    if (y > endMix) {
      return sprites.greenPlatform;
    }
    const mix = (y - startMix) / (endMix - startMix);
    return Math.random() < mix ? sprites.greenPlatform : sprites.brownPlatform;
  }
  const randomMoveSpeed = (y) => {
    const speedMin = 0.2;
    const speedMax = 0.5;
    const startMix = 1;
    const endMix = 300;

    if (y < startMix) {
      return 0;
    }

    let doMove = (y - startMix) / (endMix - startMix);
    Math.min(doMove, 0.9);
    if (Math.random() > doMove) return 0;

    const mix = 0.04 + Math.min((y - 15) / 800, 0.8) * (Math.random() * 0.5 + 0.5);
    return speedMin + (speedMax - speedMin) * mix;
  };
  const randomMoveRange = (y) => {
    const rangeMin = 0.1;
    const rangeMax = 0.9;
    return Math.random() * (rangeMax - rangeMin) + rangeMin;
  };
  const randomPlatformSpecial = (y) => {
    // jumpy always rare
    if (Math.random() < 0.05) {
      return PlatformSpecialTypes.JUMPY;
    }

    // breakable gets more common
    const startMix = 5;
    const endMix = 600;
    if (y < startMix) {
      return PlatformSpecialTypes.NONE;
    }
    const mix = Math.min((y - startMix) / (endMix - startMix), 0.9);
    return Math.random() < mix ? PlatformSpecialTypes.BREAKABLE : PlatformSpecialTypes.NONE;
  };
  const randomCoin = (y) => {
    const chance = 0.075;
    return Math.random() < chance;
  }

  if (game.platforms.length == 0) {
    let x = -0.1;
    while (x < 1) {
      const width = randomPlatformWidth(0);
      const initialPlatform = new Platform(
        randomNormalPlatformType(0),
        x,
        0,
        width,
        randomPlatformHeight(0),
        PlatformSpecialTypes.NONE
      );
      x += width;
      game.platforms.push(initialPlatform);
    }
  }

  while (game.platforms[game.platforms.length - 1].y < game.height + 3) {
    const y = game.platforms[game.platforms.length - 1].y + randomPlatformY();
    game.platforms.push(new Platform(
      randomNormalPlatformType(y),
      randomPlatformX(y),
      y,
      randomPlatformWidth(y),
      randomPlatformHeight(y),
      randomPlatformSpecial(y),
      randomCoin(y),
      randomMoveSpeed(y),
      randomMoveRange(y)
    ));
  }
}

function update(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  removeOldPlatforms();
  generatePlatforms();

  game.player.update(dt);

  for (const platform of game.platforms) {
    platform.update(dt);
  }

  // game over
  if (game.platforms.length > 0 && game.player.y < game.platforms[0].y - 0.5) {
    playSound(sounds.die);
    endGame();
    return;
  }

  // score
  game.maxHeight = Math.max(game.maxHeight, game.height);
  const score = Math.floor(game.maxHeight * 10) + game.coins * 25;

  renderer.render(game.height);

  if (game.showTitle) {
    renderer.showTitleScreen();
    if (input.keys.left || input.keys.right) {
      game.showTitle = false;
    }
  } else {
    renderer.showScore(score);
  }

  requestAnimationFrame(update);
}

async function endGame() {
  await deinit();
  setTimeout(async () => {
    await init();
  }, 3000);
}

async function deinit() {
  if (game.musicSource) {
    game.musicSource.stop();
    game.musicSource = null;
  }
  for (const platform of game.platforms) {
    platform.destroy();
  }
  game.player.destroy();
}

async function init() {
  const promises = [
    waitForTilesets(),
    initSounds()
  ];
  await Promise.all(promises);
  game = newGame();

  game.musicSource = playLoopingSound(sounds.music);
  game.player = new Player(0.5, 0.0, 0.1, 0.1);

  update(performance.now());
}
init();