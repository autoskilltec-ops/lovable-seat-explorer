// Utility functions for bus priority logic - can be used for testing
export interface Bus {
  bus_id: string;
  bus_number: number;
  total_seats: number;
  available_seats: number;
  occupied_seats: number;
}

export const getFirstAvailableBus = (busData: Bus[], isAdmin: boolean = false) => {
  if (isAdmin) {
    // Admins can select any bus
    return busData[0];
  }
  
  // For regular users, apply priority rules
  const sortedBuses = [...busData].sort((a, b) => a.bus_number - b.bus_number);
  
  for (const bus of sortedBuses) {
    if (bus.available_seats > 0) {
      return bus;
    }
  }
  
  // If no buses have available seats, return the first one
  return sortedBuses[0];
};

export const canSelectBus = (bus: Bus, buses: Bus[], isAdmin: boolean = false) => {
  if (isAdmin) {
    // Admins can select any bus
    return true;
  }
  
  const sortedBuses = [...buses].sort((a, b) => a.bus_number - b.bus_number);
  const busIndex = sortedBuses.findIndex(b => b.bus_id === bus.bus_id);
  
  // Bus 1 can always be selected if it has available seats
  if (busIndex === 0) {
    return bus.available_seats > 0;
  }
  
  // For subsequent buses, check if all previous buses are full
  for (let i = 0; i < busIndex; i++) {
    if (sortedBuses[i].available_seats > 0) {
      return false;
    }
  }
  
  return bus.available_seats > 0;
};

// Test function to validate the bus priority logic (only runs in development)
export const testBusPriorityLogic = () => {
  if (import.meta.env.DEV) {
    const testBuses: Bus[] = [
      { bus_id: '1', bus_number: 1, total_seats: 60, available_seats: 10, occupied_seats: 50 },
      { bus_id: '2', bus_number: 2, total_seats: 60, available_seats: 60, occupied_seats: 0 },
      { bus_id: '3', bus_number: 3, total_seats: 60, available_seats: 60, occupied_seats: 0 },
    ];

    // Test 1: Regular user should only be able to select Bus 1 when it has available seats
    console.log('Test 1 - Bus 1 has seats:');
    console.log('Can select Bus 1:', canSelectBus(testBuses[0], testBuses, false)); // Should be true
    console.log('Can select Bus 2:', canSelectBus(testBuses[1], testBuses, false)); // Should be false
    console.log('Can select Bus 3:', canSelectBus(testBuses[2], testBuses, false)); // Should be false

    // Test 2: When Bus 1 is full, Bus 2 should be available
    const testBusesFullBus1: Bus[] = [
      { bus_id: '1', bus_number: 1, total_seats: 60, available_seats: 0, occupied_seats: 60 },
      { bus_id: '2', bus_number: 2, total_seats: 60, available_seats: 60, occupied_seats: 0 },
      { bus_id: '3', bus_number: 3, total_seats: 60, available_seats: 60, occupied_seats: 0 },
    ];

    console.log('Test 2 - Bus 1 is full:');
    console.log('Can select Bus 1:', canSelectBus(testBusesFullBus1[0], testBusesFullBus1, false)); // Should be false
    console.log('Can select Bus 2:', canSelectBus(testBusesFullBus1[1], testBusesFullBus1, false)); // Should be true
    console.log('Can select Bus 3:', canSelectBus(testBusesFullBus1[2], testBusesFullBus1, false)); // Should be false

    // Test 3: Admin should be able to select any bus
    console.log('Test 3 - Admin access:');
    console.log('Admin can select Bus 1:', canSelectBus(testBuses[0], testBuses, true)); // Should be true
    console.log('Admin can select Bus 2:', canSelectBus(testBuses[1], testBuses, true)); // Should be true
    console.log('Admin can select Bus 3:', canSelectBus(testBuses[2], testBuses, true)); // Should be true
  }
};