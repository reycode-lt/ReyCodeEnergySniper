
import { world, system } from "@minecraft/server";

const ITEM_ID = "reycode:energy_sniper";
const COOLDOWN_TICKS = 20;
const MAX_DISTANCE = 48;

const cooldowns = new Map();

world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;

  if (!player || player.typeId !== "minecraft:player") return;
  if (item.typeId !== ITEM_ID) return;

  const now = system.currentTick;
  const lastUse = cooldowns.get(player.id) ?? -Infinity;

  if (now - lastUse < COOLDOWN_TICKS) return;
  cooldowns.set(player.id, now);

  const direction = player.getViewDirection();
  const start = player.getHeadLocation();

  // Visualisasi garis energi fiksi.
  // Tidak memberikan damage pada versi prototipe ini.
  for (let distance = 1; distance <= MAX_DISTANCE; distance += 2) {
    const position = {
      x: start.x + direction.x * distance,
      y: start.y + direction.y * distance,
      z: start.z + direction.z * distance
    };

    try {
      player.dimension.spawnParticle(
        "minecraft:blue_flame_particle",
        position
      );
    } catch (error) {
      // Partikel dapat berbeda menurut versi game.
    }
  }

  try {
    player.playSound("beacon.activate", {
      location: start,
      volume: 0.7,
      pitch: 1.5
    });
  } catch (error) {
    // Suara opsional.
  }
});
