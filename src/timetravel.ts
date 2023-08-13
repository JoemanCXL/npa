import { ScanningData } from "./galaxy";
import { logCount } from "./npaserver";
import { clone } from "./patch";

export interface TimeMachineData {
    futureTime: boolean;
};
export function futureTime(
  galaxy: ScanningData,
  tickOffset: number
): ScanningData {
  const newState: ScanningData & TimeMachineData = {...galaxy, futureTime: true};
  newState.tick += tickOffset;
  if (tickOffset <= 0) {
    console.error("Future time machine going backwards NIY")
    logCount("error_back_to_the_future");
    return newState;
  }
  const players = newState.players;
  const stars = {...newState.stars};
  for (const sk in stars) {
    const star = stars[sk];
    if (star.v === "1") {
        if (star.i > 0) {
            const ticksPerDay = newState.production_rate;
            const industry = star.i;
            const manufacturing = players[star.puid].tech.manufacturing.level;
            const production = (industry*(manufacturing+5))*tickOffset/ticksPerDay;
            const newStar = {...star};
            newStar.st += production + newStar.c;
            newStar.c = newStar.st - Math.floor(newStar.st);
            newStar.st = Math.floor(newStar.st);
            newStar.totalDefenses += newStar.st - star.st;
            stars[sk] = newStar;
        }
    }
  }
  newState.stars = stars;
  const fleets = {...newState.fleets};
  for (const fk in fleets) {
    if (fleets[fk].o.length > 0) {
        const newFleet = {...fleets[fk]};
        const [destX, destY] = [parseFloat(destination)]
        const [lx, ly] = [newFleet.x, newFleet.y]
        newFleet.x = String(parseFloat(newFleet.x) + parseFloat(newFleet.x) - parseFloat(newFleet.lx));
        newFleet.y = String(parseFloat(newFleet.y) + parseFloat(newFleet.y) - parseFloat(newFleet.ly));
        [newFleet.lx, newFleet.ly] = [lx, ly];
        fleets[fk] = newFleet;
    }
  }
  newState.fleets = fleets;
  return newState;
}
