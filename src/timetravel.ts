import { ScanningData } from "./galaxy";
import { clone } from "./patch";

export interface TimeMachineData {
    
}
export function futureTime(
  galaxy: ScanningData,
  tickOffset: number
): ScanningData {
  const newState: ScanningData & TimeMachineData = {...galaxy};
  newState.futureTime = true;
  newState.tick += tickOffset;
  return newState;
}
