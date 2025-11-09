const audioContext = new AudioContext();

async function loadSound(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

export const sounds = {};

export async function initSounds() {
  sounds.music = await loadSound("./assets/music/time_for_adventure.mp3");
  sounds.jump = await loadSound("./assets/sounds/jump.wav");
  sounds.jumpBreak = await loadSound("./assets/sounds/tap.wav");
  sounds.jumpJumpy = await loadSound("./assets/sounds/power_up.wav");
  sounds.die = await loadSound("./assets/sounds/explosion.wav");
  sounds.coin = await loadSound("./assets/sounds/coin.wav");
}

export function playSound(sound) {
  const source = audioContext.createBufferSource();
  source.buffer = sound;
  source.connect(audioContext.destination);
  source.start();
  return source;
}

export function playLoopingSound(buffer) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  source.connect(audioContext.destination);
  source.start();
  return source;
}