class Tileset {
  constructor(image, tileWidth, tileHeight) {
    this.tileset = new Image();
    this.tileset.src = image;
    this.loaded = false;
    this.tileset.onload = () => {
      this.loaded = true;
    }

    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
  }

  drawTiles(ctx, tileStartX, tileStartY, tileCountX, tileCountY, destX, destY, destWidth, destHeight) {
    ctx.drawImage(
      this.tileset,
      tileStartX * this.tileWidth,
      tileStartY * this.tileHeight,
      tileCountX * this.tileWidth,
      tileCountY * this.tileHeight,
      destX,
      destY,
      destWidth,
      destHeight
    );
  }
}

class Sprite {
  constructor(tileset, tileStartX, tileStartY, tileCountX, tileCountY) {
    this.tileset = tileset;
    this.tileStartX = tileStartX;
    this.tileStartY = tileStartY;
    this.tileCountX = tileCountX;
    this.tileCountY = tileCountY;
  }

  draw(ctx, destX, destY, destWidth, destHeight) {
    this.tileset.drawTiles(
      ctx,
      this.tileStartX,
      this.tileStartY,
      this.tileCountX,
      this.tileCountY,
      destX,
      destY,
      destWidth,
      destHeight
    );
  }
}

const tilesets = {
  platforms: new Tileset("./assets/sprites/platforms.png", 8, 8),
  knight: new Tileset("./assets/sprites/knight.png", 8, 8),
  coin: new Tileset("./assets/sprites/coin.png", 8, 8),
}

export function tilesetsLoaded() {
  for (const key in tilesets) {
    if (!tilesets[key].loaded) {
      return false;
    }
  }
  return true;
}

export async function waitForTilesets() {
  return new Promise((resolve) => {
    const checkLoaded = () => {
      if (tilesetsLoaded()) {
        resolve();
      } else {
        setTimeout(checkLoaded, 100);
      }
    };
    checkLoaded();
  });
}

export const sprites = {
  greenPlatform: new Sprite(tilesets.platforms, 2, 0, 4, 1),
  brownPlatform: new Sprite(tilesets.platforms, 2, 2, 4, 1),
  yellowPlatform: new Sprite(tilesets.platforms, 2, 4, 4, 1),
  icePlatform: new Sprite(tilesets.platforms, 2, 6, 4, 1),
  knightJump: new Sprite(tilesets.knight, 1, 1, 2, 3),
  knightFall: new Sprite(tilesets.knight, 9, 1, 2, 3),
  coinAnim: (() => {
    const frames = [];
    for (let i = 0; i < 6; i++) {
      frames.push(new Sprite(tilesets.coin, i * 2, 0, 2, 2));
    }
    return frames;
  })(),
}