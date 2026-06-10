/**
 * Main entry point for the parking lot system
 */

import { runParkingLotDemo, demonstrateConcurrency } from "./example";

async function main() {
  console.log("Starting Smart Parking Lot System...\n");

  try {
    // Run the demo
    await runParkingLotDemo();

    // Demonstrate concurrency handling
    await demonstrateConcurrency();

    console.log("\n✓ All demos completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
