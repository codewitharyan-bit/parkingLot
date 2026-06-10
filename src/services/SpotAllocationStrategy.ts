

import { ParkingSpot, ParkingFloor } from "../models";
import { VehicleSize, ParkingLotLevel } from "../enums";

export interface SpotAllocationStrategy {
  findSpot(
    floors: Map<ParkingLotLevel, ParkingFloor>,
    vehicleSize: VehicleSize
  ): ParkingSpot | null;
}

/**
 * Nearest available spot strategy
 * Finds the closest available parking spot to the entrance
 * Prefers lower floors first
 */
export class NearestSpotStrategy implements SpotAllocationStrategy {
  findSpot(
    floors: Map<ParkingLotLevel, ParkingFloor>,
    vehicleSize: VehicleSize
  ): ParkingSpot | null {
    // Sort floors by level (ground floor first)
    const sortedFloors = Array.from(floors.values()).sort(
      (a, b) => a.floor - b.floor
    );

    for (const floor of sortedFloors) {
      const availableSpots = floor.getAvailableSpots();
      for (const spot of availableSpots) {
        if (spot.canFit(vehicleSize)) {
          return spot;
        }
      }
    }

    return null;
  }
}

/**
 * Best-fit strategy
 * Finds the smallest available spot that can fit the vehicle
 * Minimizes space wastage
 */
export class BestFitStrategy implements SpotAllocationStrategy {
  private spotSizeOrder: VehicleSize[] = [
    VehicleSize.MOTORCYCLE,
    VehicleSize.COMPACT,
    VehicleSize.SEDAN,
    VehicleSize.SUV,
    VehicleSize.BUS
  ];

  findSpot(
    floors: Map<ParkingLotLevel, ParkingFloor>,
    vehicleSize: VehicleSize
  ): ParkingSpot | null {
    const minSpotSizeIndex = this.spotSizeOrder.indexOf(vehicleSize);
    let bestSpot: ParkingSpot | null = null;
    let bestSpotSizeIndex = this.spotSizeOrder.length;

    for (const floor of floors.values()) {
      for (const spot of floor.getAvailableSpots()) {
        if (spot.canFit(vehicleSize)) {
          const spotSizeIndex = this.spotSizeOrder.indexOf(spot.spotSize);
          if (spotSizeIndex < bestSpotSizeIndex) {
            bestSpot = spot;
            bestSpotSizeIndex = spotSizeIndex;
          }
        }
      }
    }

    return bestSpot;
  }
}

/**
 * Even distribution strategy
 * Distributes vehicles evenly across all floors
 * Prevents overloading of specific floors
 */
export class EvenDistributionStrategy implements SpotAllocationStrategy {
  findSpot(
    floors: Map<ParkingLotLevel, ParkingFloor>,
    vehicleSize: VehicleSize
  ): ParkingSpot | null {
    // Sort floors by available spots (ascending)
    const sortedFloors = Array.from(floors.values()).sort(
      (a, b) =>
        a.getAvailableSpotCount() - b.getAvailableSpotCount()
    );

    for (const floor of sortedFloors) {
      const availableSpots = floor.getAvailableSpots();
      for (const spot of availableSpots) {
        if (spot.canFit(vehicleSize)) {
          return spot;
        }
      }
    }

    return null;
  }
}

/**
 * Premium spot strategy
 * Prioritizes spots on lower floors and near elevators
 * Can be used to incentivize parking in less desirable areas
 */
export class PremiumSpotStrategy implements SpotAllocationStrategy {
  private preferredFloors: ParkingLotLevel[] = [
    ParkingLotLevel.GROUND,
    ParkingLotLevel.LEVEL_1,
    ParkingLotLevel.LEVEL_2
  ];

  findSpot(
    floors: Map<ParkingLotLevel, ParkingFloor>,
    vehicleSize: VehicleSize
  ): ParkingSpot | null {
    // First try preferred floors
    for (const floorLevel of this.preferredFloors) {
      const floor = floors.get(floorLevel);
      if (floor) {
        const spot = this.findSpotInFloor(floor, vehicleSize);
        if (spot) return spot;
      }
    }

    // If not found, check remaining floors
    for (const floor of floors.values()) {
      if (!this.preferredFloors.includes(floor.floor)) {
        const spot = this.findSpotInFloor(floor, vehicleSize);
        if (spot) return spot;
      }
    }

    return null;
  }

  private findSpotInFloor(
    floor: ParkingFloor,
    vehicleSize: VehicleSize
  ): ParkingSpot | null {
    for (const spot of floor.getAvailableSpots()) {
      if (spot.canFit(vehicleSize)) {
        return spot;
      }
    }
    return null;
  }
}
