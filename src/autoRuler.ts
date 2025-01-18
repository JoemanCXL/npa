import { alliedFleet, getWeaponsLevel, tickNumber } from "./combatcalc";
import { getTech, isVisible, turnJumpTicks } from "./galaxy";
import { GameStore } from "./gamestore";
import "./globals";

// TODO: Centralize settings so we don't have to declare this here
interface GameStoreSettings {
  autoRulerPower: number;
}

// TODO: These utility functions are originally declared in intel.ts
const findClosestStars = (star: any, steps: number) => {
  let stepsOut = steps;
  const map = NeptunesPride.npui.map;
  const stars = NeptunesPride.universe.galaxy.stars;
  let closest = star;
  let closestSupport = star;
  const toStars = (s: any) => {
    return stars[s.uid];
  };
  const sortedByDistanceSquared = map.sortedStarSprites.map(toStars);
  sortedByDistanceSquared.sort(
    (a: any, b: any) => distance(star, b) - distance(star, a),
  );
  let i = sortedByDistanceSquared.length;
  do {
    i -= 1;
    const candidate = sortedByDistanceSquared[i];
    const allied = alliedFleet(
      NeptunesPride.universe.galaxy.players,
      candidate.puid,
      star.puid,
      0,
    );
    if (!allied && (closest === star || stepsOut > 0)) {
      closest = candidate;
      stepsOut--;
    } else if (allied && closestSupport === star) {
      closestSupport = candidate;
    }
  } while (
    (closest === star || closestSupport === star || stepsOut > 0) &&
    i > 0
  );
  const closestDist = distance(star, closest);
  const closerStars: any[] = [];
  for (let i = 0; i < sortedByDistanceSquared.length; ++i) {
    const candidate = stars[sortedByDistanceSquared[i].uid];
    const dsQ = distance(star, candidate);
    if (
      dsQ <= closestDist &&
      candidate !== closest &&
      candidate !== closestSupport &&
      candidate !== star
    ) {
      closerStars.push(candidate);
    }
  }

  return [closest, closestSupport, closerStars];
};

const distance = (star1: any, star2: any) => {
  const xoff = star1.x - star2.x;
  const yoff = star1.y - star2.y;
  const player =
    NeptunesPride.universe.galaxy.players[star2.puid] ||
    NeptunesPride.universe.player;
  const rangeTechLevel = getTech(player, "propulsion").level;
  const fleetRange = rangeTechLevel + combatInfo.combatHandicap;
  const gatefactor = star1?.ga * star2?.ga * (fleetRange + 3) || 1;
  return (xoff * xoff + yoff * yoff) / gatefactor;
};

const drawAutoRuler = (
  settings: GameStore & GameStoreSettings
) => {
  const universe = NeptunesPride.universe;
  const map = NeptunesPride.npui.map;
  if (
    universe.selectedStar?.alliedDefenders &&
    settings.autoRulerPower > 0 &&
    map.scale >= 100
  ) {
    const visTicks = NeptunesPride.universe.galaxy.turn_based
      ? turnJumpTicks()
      : 1;
    const speed = NeptunesPride.universe.galaxy.fleet_speed;
    const speedSq = speed * speed;
    const star = universe.selectedStar;
    const stepsOut = Math.ceil(settings.autoRulerPower / 2);
    const showAll = settings.autoRulerPower % 2 === 0;
    const [other, support, closerStars] = findClosestStars(star, stepsOut);
    const enemyColor = "#f3172d";
    const ineffectiveSupportColor = "#888888";
    const effectiveSupportColor = "#00ff00";
    const drawHUDRuler = (star: any, other: any, hudColor: string) => {
      let color = hudColor;
      const tickDistance = Math.sqrt(distance(star, other));
      const ticks = Math.ceil(tickDistance / speed);
      const midX = map.worldToScreenX((star.x + other.x) / 2);
      const midY = map.worldToScreenY((star.y + other.y) / 2);

      let rangeLevel = 0;
      if (other.puid !== -1) {
        const rangeRequired = (_puid: number) => {
          const origHandicap = combatInfo.combatHandicap;
          const player = NeptunesPride.universe.galaxy.players[other.puid];
          let fleetRange = getAdjustedFleetRange(player);
          const flightDistance = universe.distance(
            star.x,
            star.y,
            other.x,
            other.y,
          );
          while (
            flightDistance > fleetRange &&
            combatInfo.combatHandicap - origHandicap < 5
          ) {
            combatInfo.combatHandicap++;
            fleetRange = getAdjustedFleetRange(player);
          }
          const ret = combatInfo.combatHandicap - origHandicap;
          combatInfo.combatHandicap = origHandicap;
          return ret;
        };
        rangeLevel = rangeRequired(other.puid);
        if (rangeLevel > 0) {
          color = ineffectiveSupportColor;
        }
      }

      const rotationAngle = (star1: any, star2: any) => {
        const xoff = star1.x - star2.x;
        const yoff = star1.y - star2.y;
        const flipped = xoff < 0;
        const flip = Math.PI * (flipped ? 1 : 0);
        return { angle: Math.atan2(yoff, xoff) + flip, flipped };
      };
      map.context.save();
      map.context.globalAlpha = 1;
      map.context.strokeStyle = color;
      map.context.shadowColor = "black";
      map.context.shadowOffsetX = 2;
      map.context.shadowOffsetY = 2;
      map.context.shadowBlur = 2;
      map.context.fillStyle = color;
      map.context.lineWidth = 2 * map.pixelRatio;
      map.context.lineCap = "round";
      map.context.translate(midX, midY);
      const { angle, flipped } = rotationAngle(star, other);
      map.context.rotate(angle);
      const visArcRadius =
        map.worldToScreenX(visTicks * speed) - map.worldToScreenX(0);
      const visArcX =
        (map.worldToScreenX(tickDistance) - map.worldToScreenX(0)) / 2;
      const start =
        map.worldToScreenX(tickDistance - 2 * speed) -
        map.worldToScreenX(0);
      const dist = map.worldToScreenX(tickDistance) - map.worldToScreenX(0);
      const end =
        map.worldToScreenX(tickDistance - 2 * speed) -
        map.worldToScreenX(0);
      if (start > 0 && end > 0) {
        map.context.beginPath();
        map.context.moveTo(-start / 2, 0);
        map.context.lineTo(end / 2, 0);
        map.context.stroke();
        map.context.beginPath();
        const arrow = flipped ? -1 : 1;
        const arrowSize = 5;
        map.context.moveTo((arrow * end) / 2, 0);
        map.context.lineTo(
          (arrow * end) / 2 - arrow * arrowSize * map.pixelRatio,
          arrowSize * map.pixelRatio,
        );
        map.context.lineTo(
          (arrow * end) / 2 - arrow * arrowSize * map.pixelRatio,
          -arrowSize * map.pixelRatio,
        );
        map.context.closePath();
        map.context.fill();
        if (visArcRadius - visArcX - end / 2 + 1.0 <= 1.0) {
          map.context.beginPath();
          const arcLen = (Math.PI * 8) / visArcRadius;
          const flipPi = flipped ? Math.PI : 0;
          const x = flipped ? visArcX : -visArcX;
          map.context.arc(
            x,
            0,
            visArcRadius,
            flipPi - arcLen,
            flipPi + arcLen,
          );
          map.context.stroke();
        }
      }
      map.context.textAlign = "center";
      map.context.translate(0, -8 * map.pixelRatio);
      const textColor =
        color === ineffectiveSupportColor
          ? ineffectiveSupportColor
          : effectiveSupportColor;
      drawString(`[[Tick #${tickNumber(ticks)}]]`, 0, 0, textColor);
      if (visArcRadius - dist + 1.0 > 1.0) {
        map.context.translate(0, 2 * 9 * map.pixelRatio);
        drawString("invisible", 0, 0, textColor);
      } else {
        if (other.puid !== -1) {
          if (rangeLevel > 0) {
            map.context.translate(0, 2 * 9 * map.pixelRatio);
            drawString(`range +${rangeLevel}`, 0, 0, textColor);
          } else {
            map.context.translate(0, 2 * 9 * map.pixelRatio);
            drawString(
              `${isVisible(other) ? other.totalDefenses : "?"} ship${
                other.totalDefenses !== 1 ? "s" : ""
              }`,
              0,
              0,
              textColor,
            );
          }
        }
      }
      map.context.setLineDash([]);
      map.context.restore();
      return ticks;
    };
    const enemyTicks = drawHUDRuler(star, other, enemyColor);
    const ticks = Math.ceil(Math.sqrt(distance(star, support) / speedSq));
    let enemyShips = 0;
    let enemyWS = 1;
    let defenderShips = star.totalDefenses;
    const players = NeptunesPride.universe.galaxy.players;
    let defenderWS = Math.max(
      1,
      players[star.puid]?.tech ? getWeaponsLevel(players[star.puid]) : 0,
      ...star.alliedDefenders.map((d: number) =>
        getWeaponsLevel(players[d]),
      ),
    );
    let allVisible = true;
    if (other.puid !== -1) {
      allVisible = allVisible && isVisible(other);
      enemyShips += other.totalDefenses;
      enemyWS = Math.max(enemyWS, getWeaponsLevel(players[other.puid]));
    }

    if (enemyTicks - visTicks >= ticks) {
      drawHUDRuler(star, support, effectiveSupportColor);
      if (support.puid !== -1) {
        allVisible = allVisible && isVisible(support);
        defenderShips += support.totalDefenses;
        defenderWS = Math.max(
          defenderWS,
          getWeaponsLevel(players[support.puid]),
        );
      }
    } else {
      drawHUDRuler(star, support, ineffectiveSupportColor);
    }

    for (let i = 0; showAll && i < closerStars.length; ++i) {
      const o = closerStars[i];
      if (
        alliedFleet(
          NeptunesPride.universe.galaxy.players,
          o.puid,
          star.puid,
          0,
        )
      ) {
        const ticks = Math.ceil(Math.sqrt(distance(star, o) / speedSq));
        if (enemyTicks - visTicks >= ticks) {
          drawHUDRuler(star, o, effectiveSupportColor);
          if (o.puid !== -1) {
            allVisible = allVisible && isVisible(o);
            defenderShips += o.totalDefenses;
            defenderWS = Math.max(
              defenderWS,
              getWeaponsLevel(players[o.puid]),
            );
          }
        } else {
          drawHUDRuler(star, o, ineffectiveSupportColor);
        }
      } else {
        drawHUDRuler(star, o, enemyColor);
        if (o.puid !== -1) {
          allVisible = allVisible && isVisible(o);
          enemyShips += o.totalDefenses;
          enemyWS = Math.max(enemyWS, getWeaponsLevel(players[o.puid]));
        }
      }
    }
    if (NeptunesPride.gameVersion !== "proteus") {
      defenderWS += 1;
    }
    while (defenderShips > 0 && enemyShips > 0) {
      enemyShips -= defenderWS;
      if (enemyShips <= 0) break;
      defenderShips -= enemyWS;
    }
    let combatOutcome =
      enemyShips <= 0 ? `${defenderShips} live` : `${enemyShips} land`;
    if (!allVisible) {
      combatOutcome += "?";
    }
    const hudX = map.worldToScreenX(star.x + 0.125);
    const hudY = map.worldToScreenY(star.y) - 9 * map.pixelRatio;
    map.context.textAlign = "left";
    drawString(combatOutcome, hudX, hudY, "#00ff00");
    let attackersWon = true;
    if (enemyShips <= 0) {
      defenderShips -= enemyWS;
      attackersWon = false;
    }
    while (defenderShips > 0 || enemyShips > 0) {
      enemyShips -= defenderWS;
      defenderShips -= enemyWS;
    }
    const yOffset = 2 * 9 * map.pixelRatio;
    if (attackersWon) {
      defenderShips = Math.min(-1, defenderShips);
      drawString(
        `${-defenderShips} needed`,
        hudX,
        hudY + yOffset,
        "#00ff00",
      );
    } else {
      enemyShips = Math.min(-1, enemyShips);
      drawString(`${-enemyShips} needed`, hudX, hudY + yOffset, "#00ff00");
    }
  }
};
