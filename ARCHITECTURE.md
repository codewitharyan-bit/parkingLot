# Smart Parking Lot System - Architecture

## Overview

Backend system managing multi-floor parking facilities with automated allocation, real-time tracking, and dynamic pricing.

### Core Features
- Automated spot allocation (multiple strategies)
- Thread-safe concurrent operations
- Dynamic fee calculation with discounts
- Real-time availability updates
- Revenue analytics & audit logging

## Architecture Design

### System Layers

```
┌─────────────────────────────────────────────┐
│          API Controller Layer               │
│  (Handles HTTP requests and responses)      │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│       Business Logic Layer                  │
│  (ParkingLotManager, FeeCalculation)        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│    Service Layer & Strategies               │
│  (Spot Allocation, Fee Calculation)         │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│       Repository Layer                      │
│  (Data Persistence & Access)                │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│       Data Layer                            │
│  (Database - In-memory or External)         │
└─────────────────────────────────────────────┘
```

## Data Models

| Entity | Purpose |
|--------|---------|
| **Vehicle** | Tracks entry/exit time, size, type |
| **ParkingSpot** | Represents a single parking spot, tracks occupancy |
| **ParkingTicket** | Transaction record: entry, exit, fee |
| **ParkingFloor** | Contains multiple spots, tracks floor-level stats |
| **ParkingLot** | Top-level container with multiple floors |

## Core Components

| Component | Responsibility |
|-----------|-----------------|
| **ParkingLotManager** | Orchestrates all parking operations |
| **SpotAllocationStrategy** | Determines where to park vehicles (pattern-based) |
| **ParkingRateManager** | Manages pricing & fee calculations |
| **ConcurrencyUtils** | Provides thread-safe synchronization primitives |
| **Repository** | Abstracts data persistence |

## Algorithms

### 1. Spot Allocation
**Time: O(n), Space: O(1)** where n = total spots

```
1. Use configured strategy
2. Check floors sequentially  
3. Find first spot that fits vehicle
4. Lock & reserve
5. Create ticket & return
```

### 2. Fee Calculation
**Time: O(1), Space: O(1)**

```
1. Get pricing model for vehicle type
2. If duration ≤ minimum: return minimum charge
3. Round duration to nearest hour
4. Calculate: hours × hourly_rate
5. Apply: min(total, daily_max)
6. Apply discount if applicable
```

### 3. Allocation Strategies

- **NearestSpot**: Lower floors first (best for customer convenience)
- **BestFit**: Smallest fitting spot (minimizes waste)
- **EvenDistribution**: Spreads vehicles evenly (balances floors)
- **Premium**: Prioritizes accessible spots (incentivizes parking)

## Concurrency Handling

### Thread-Safe Operations

| Lock Type | Use Case | Behavior |
|-----------|----------|----------|
| **Mutex** | Ticket creation/updates | Exclusive access |
| **ReadWriteLock** | Spot operations | Multiple readers, single writer |
| **Semaphore** | Resource throttling | Controls concurrent allocations |

### Implementation Pattern

```typescript
async vehicleEntry(licensePlate, vehicleType, vehicleSize) {
    return this.spotAllocationLock.runExclusive(async () => {
        return this.spotsLock.runExclusiveWrite(async () => {
            const spot = this.findAvailableSpot(vehicleSize);
            spot.occupy(vehicle);
            
            await this.ticketsLock.runExclusive(async () => {
                this.activeTickets.set(vehicleId, ticket);
            });
            
            return ticket;
        });
    });
}
```

**Prevents:**
- Double-booking of spots
- Race conditions on tickets
- Inconsistent state updates

## Fee Calculation

### Pricing Model
```
FinalFee = min(⌈hours⌉ × hourlyRate, dailyMax) × (1 - discount%)
```

### Rates by Vehicle Type

| Type | Hourly | Daily Max | Min Charge |
|------|--------|-----------|-----------|
| Motorcycle | $10 | $100 | $5 |
| Car | $20 | $200 | $10 |
| Truck | $30 | $300 | $15 |
| Bus | $50 | $500 | $25 |

### Discounts

- **1-24h**: 0%
- **1-3 days**: 5%
- **3-7 days**: 10%
- **7+ days**: 15%

## API Endpoints

### Vehicle Entry
```json
POST /vehicles/entry
{
    "licensePlate": "ABC-001",
    "vehicleType": "CAR",
    "vehicleSize": "SEDAN"
}

Response:
{
    "ticketId": "uuid",
    "vehicleId": "uuid",
    "spotNumber": "2-45",
    "floor": 2,
    "entryTime": "2024-01-15T10:30:00Z"
}
```

### Vehicle Exit
```json
POST /vehicles/exit
{
    "vehicleId": "uuid"
}

Response:
{
    "ticketId": "uuid",
    "duration": "2h 15m",
    "totalFee": 45.50
}
```

### Status Queries
```json
GET /status          → Lot occupancy
GET /floors/{id}     → Floor details
GET /revenue         → Financial analytics
```

## Performance

### Scalability Targets

| Metric | Target | Approach |
|--------|--------|----------|
| Vehicles/Hour | 1000+ | Async processing |
| Query Time | <100ms | Indexing, caching |
| Spot Allocation | <50ms | Optimized algorithms |
| Concurrent Users | 10000+ | Connection pooling |

### Optimization Strategies

1. **Database**: Index on license plate, vehicle ID, floor/spot composite
2. **Caching**: Cache floor availability, pricing models
3. **Connection Pooling**: Reuse database connections
4. **Batch Operations**: Batch status updates, ticket creation

## Deployment

### Prerequisites
- Node.js 16+, TypeScript 5.0+
- PostgreSQL 12+ or MongoDB 4.0+
- Redis 6.0+ (optional)

### Quick Start

```bash
npm install
npm run build
npm start
```

### Configuration

```typescript
// Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parking_lot

// Application
NODE_ENV=production
ALLOCATION_STRATEGY=NearestSpot
LOG_LEVEL=info
```

### Docker
See `DEPLOYMENT.md` for Docker Compose setup
