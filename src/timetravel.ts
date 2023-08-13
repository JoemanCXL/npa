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
  const stars = {...newState.stars};
  for (const sk in stars) {
    const star = stars[sk];
    if (star.v === "1") {
        if (star.i > 0) {
            const ticksPerDay = NeptunesPride.universe.galaxy.production_rate;
            // X*(Y+5) 
            const newStar = {...star};
            newStar.st += 10;
            newStar.totalDefenses += 10;
            stars[sk] = newStar;
        }
    }
  }
  newState.stars = stars;
  return newState;
}
