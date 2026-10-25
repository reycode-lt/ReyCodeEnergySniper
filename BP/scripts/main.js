import { world, system } from "@minecraft/server";

const WEAPONS = {
  "customweapons:usp": { damage: 5, speed: 2.6, sound: "random.bow" },
  "customweapons:desert_eagle": { damage: 8, speed: 3.0, sound: "random.bow" },
  "customweapons:awp": { damage: 20, speed: 4.5, sound: "random.bow" },
};

world.afterEvents.itemUse.subscribe((event) => {
  const { source: player, itemStack } = event;
  const data = WEAPONS[itemStack.typeId];
  if (!data) return;

  const dimension = player.dimension;
  const head = player.getHeadLocation();
  const view = player.getViewDirection();

  const spawnPoint = {
    x: head.x + view.x * 0.5,
    y: head.y + view.y * 0.5,
    z: head.z + view.z * 0.5,
  };

  dimension.spawnParticle("minecraft:basic_flame_particle", spawnPoint);
  dimension.spawnParticle("minecraft:critical_hit_emitter", spawnPoint);
  dimension.playSound(data.sound, player.location, { pitch: 1.4, volume: 0.8 });

  system.run(() => {
    const arrow = dimension.spawnEntity("minecraft:arrow", spawnPoint);
    arrow.clearVelocity();
    arrow.applyImpulse({
      x: view.x * data.speed,
      y: view.y * data.speed,
      z: view.z * data.speed,
    });
    arrow.addTag(`cw_dmg_${data.damage}`);

    let ticks = 0;
    const trail = system.runInterval(() => {
      ticks++;
      if (!arrow.isValid() || ticks > 15) {
        system.clearRun(trail);
        return;
      }
      dimension.spawnParticle("minecraft:basic_smoke_particle", arrow.location);
    }, 1);
  });
});

world.afterEvents.projectileHitEntity.subscribe((event) => {
  const projectile = event.projectile;
  if (!projectile || projectile.typeId !== "minecraft:arrow") return;

  const tag = projectile.getTags().find((t) => t.startsWith("cw_dmg_"));
  if (!tag) return;

  const extraDamage = Number(tag.replace("cw_dmg_", "")) - 2;
  const hit = event.getEntityHit && event.getEntityHit();
  const target = hit ? hit.entity : undefined;
  if (target && extraDamage > 0) {
    system.run(() => target.applyDamage(extraDamage));
  }
});
