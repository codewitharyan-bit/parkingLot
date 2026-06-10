/**
 * Example usage and demonstration of the smart parking lot system
 */

import { ParkingLot } from "./models";
import { ParkingLotManager } from "./services/ParkingLotManager";
import { ParkingLotController } from "./api/ParkingLotController";
import {
  VehicleType,
  VehicleSize,
  ParkingLotLevel,
  TicketStatus
} from "./enums";
import {
  NearestSpotStrategy,
  BestFitStrategy,
  EvenDistributionStrategy,
  PremiumSpotStrategy
} from "./services/SpotAllocationStrategy";

/**
 * Demo function showcasing all features
 */
export async function runParkingLotDemo() {
  console.log("=".repeat(60));
  console.log("SMART PARKING LOT SYSTEM - DEMO");
  console.log("=".repeat(60));

  // Initialize parking lot
  const parkingLot = new ParkingLot(
    "Downtown Parking Center",
    600,
    "ParkingCorp Solutions",
    "123 Main Street, Downtown"
  );

  const manager = new ParkingLotManager(parkingLot, new NearestSpotStrategy());
  const controller = new ParkingLotController(manager);

  // Initialize parking lot with 6 floors and 100 spots each
  manager.initializeParkingLot(6, 100);

  console.log("\n1. PARKING LOT INITIALIZATION");
  console.log("-".repeat(60));
  const lotInfo = controller.getParkingLotInfo();
  console.log(`Name: ${lotInfo.name}`);
  console.log(`Company: ${lotInfo.companyName}`);
  console.log(`Location: ${lotInfo.location}`);

  let status = await controller.getParkingStatus();
  console.log(`\nInitial Status:`);
  console.log(`  Total Spots: ${status.totalSpots}`);
  console.log(`  Available: ${status.availableSpots}`);
  console.log(`  Occupancy: ${status.occupancyRate.toFixed(2)}%`);

  // Demo: Vehicle entries
  console.log("\n2. VEHICLE ENTRY OPERATIONS");
  console.log("-".repeat(60));

  const testVehicles = [
    {
      plate: "ABC-001",
      type: VehicleType.MOTORCYCLE,
      size: VehicleSize.MOTORCYCLE
    },
    { plate: "ABC-002", type: VehicleType.CAR, size: VehicleSize.SEDAN },
    { plate: "ABC-003", type: VehicleType.CAR, size: VehicleSize.COMPACT },
    { plate: "ABC-004", type: VehicleType.TRUCK, size: VehicleSize.SUV },
    { plate: "ABC-005", type: VehicleType.BUS, size: VehicleSize.BUS }
  ];

  const ticketIds: { vehicleId: string; ticketId: string }[] = [];

  for (const vehicle of testVehicles) {
    try {
      const response = await controller.handleVehicleEntry({
        licensePlate: vehicle.plate,
        vehicleType: vehicle.type,
        vehicleSize: vehicle.size
      });

      ticketIds.push({
        vehicleId: response.vehicleId,
        ticketId: response.ticketId
      });

      console.log(`✓ ${response.message}`);
      console.log(`  Spot: ${response.spotNumber} (Floor ${response.floor})`);
    } catch (error: any) {
      console.log(`✗ Error: ${error.message}`);
    }
  }

  // Check status after entries
  status = await controller.getParkingStatus();
  console.log(`\nParking Lot Status After Entries:`);
  console.log(`  Available: ${status.availableSpots}/${status.totalSpots}`);
  console.log(`  Occupancy: ${status.occupancyRate.toFixed(2)}%`);
  console.log(`  Active Vehicles: ${status.activeVehicles}`);

  // Demo: Floor status
  console.log("\n3. FLOOR STATUS");
  console.log("-".repeat(60));
  for (let floor = 0; floor < 3; floor++) {
    const floorStatus = await controller.getFloorStatus(floor as ParkingLotLevel);
    console.log(`Floor ${floor}:`);
    console.log(`  Total: ${floorStatus.totalSpots}`);
    console.log(`  Available: ${floorStatus.availableSpots}`);
    console.log(`  Occupied: ${floorStatus.occupiedSpots}`);
  }

  // Simulate some time passing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Demo: Vehicle exits and fee calculation
  console.log("\n4. VEHICLE EXIT OPERATIONS & FEE CALCULATION");
  console.log("-".repeat(60));

  if (ticketIds.length >= 2) {
    for (let i = 0; i < 2; i++) {
      const exitResponse = await controller.handleVehicleExit({
        vehicleId: ticketIds[i].vehicleId
      });

      console.log(`✓ ${exitResponse.message}`);
      console.log(`  Duration: ${exitResponse.duration}`);
      console.log(`  Fee: $${exitResponse.totalFee.toFixed(2)}`);
    }
  }

  // Final status
  status = await controller.getParkingStatus();
  console.log(`\nFinal Parking Lot Status:`);
  console.log(`  Available: ${status.availableSpots}/${status.totalSpots}`);
  console.log(`  Occupancy: ${status.occupancyRate.toFixed(2)}%`);
  console.log(`  Active Vehicles: ${status.activeVehicles}`);

  // Demo: Revenue statistics
  console.log("\n5. REVENUE STATISTICS");
  console.log("-".repeat(60));
  const revenue = await controller.getRevenueStats();
  console.log(`Total Transactions: ${revenue.totalTransactions}`);
  console.log(`Total Revenue: $${revenue.totalRevenue.toFixed(2)}`);
  console.log(`Average Fee: $${revenue.averageFee.toFixed(2)}`);

  // Demo: Allocation strategy switching
  console.log("\n6. ALLOCATION STRATEGY COMPARISON");
  console.log("-".repeat(60));

  const strategies = [
    { name: "NearestSpot", strategy: new NearestSpotStrategy() },
    { name: "BestFit", strategy: new BestFitStrategy() },
    { name: "EvenDistribution", strategy: new EvenDistributionStrategy() },
    { name: "PremiumSpot", strategy: new PremiumSpotStrategy() }
  ];

  console.log("Each strategy allocates spots differently:");
  for (const { name } of strategies) {
    console.log(`  • ${name}: Optimizes for specific criteria`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("DEMO COMPLETED SUCCESSFULLY");
  console.log("=".repeat(60));
}

/**
 * Demonstration of concurrency handling
 */
export async function demonstrateConcurrency() {
  console.log("\n" + "=".repeat(60));
  console.log("CONCURRENCY HANDLING DEMONSTRATION");
  console.log("=".repeat(60));

  const parkingLot = new ParkingLot(
    "Concurrent Test Lot",
    1000,
    "TestCorp",
    "Test Location"
  );

  const manager = new ParkingLotManager(parkingLot);
  manager.initializeParkingLot(5, 100);

  console.log("\nSimulating 20 concurrent vehicle entries...");

  const startTime = Date.now();
  const entries = [];

  for (let i = 0; i < 20; i++) {
    const entry = manager.vehicleEntry(
      `CONCURRENT-${i.toString().padStart(3, "0")}`,
      VehicleType.CAR,
      VehicleSize.SEDAN
    );
    entries.push(entry);
  }

  const results = await Promise.allSettled(entries);

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  const duration = Date.now() - startTime;

  console.log(`Results:`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Duration: ${duration}ms`);

  const status = await manager.getParkingLotStatus();
  console.log(`\nParking Lot After Concurrent Operations:`);
  console.log(`  Active Vehicles: ${status.activeVehicles}`);
  console.log(`  Occupancy Rate: ${status.occupancyRate.toFixed(2)}%`);
}

/**
 * Run demos
 */
if (require.main === module) {
  (async () => {
    try {
      await runParkingLotDemo();
      await demonstrateConcurrency();
    } catch (error) {
      console.error("Error running demo:", error);
      process.exit(1);
    }
  })();
}
