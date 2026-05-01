/**
 * Calculate straight-line distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {Number} Distance in kilometers
 */
export const calculateStraightLineDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const deltaLat = toRadians(coord2.latitude - coord1.latitude);
  const deltaLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
};

/**
 * Convert degrees to radians
 * @param {Number} degrees - Angle in degrees
 * @returns {Number} Angle in radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate road distance using Google Maps API (optional)
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {Promise<Number>} Distance in kilometers
 */
export const calculateRoadDistance = async (coord1, coord2) => {
  try {
    // TODO: Implement Google Maps Distance Matrix API integration
    // This requires GOOGLE_MAPS_API_KEY in environment
    
    // For now, fall back to straight-line distance
    return calculateStraightLineDistance(coord1, coord2);
    
    // Example implementation:
    // const googleMapsClient = require('@google/maps').createClient({
    //   key: process.env.GOOGLE_MAPS_API_KEY
    // });
    // 
    // const response = await googleMapsClient.distanceMatrix({
    //   origins: [`${coord1.latitude},${coord1.longitude}`],
    //   destinations: [`${coord2.latitude},${coord2.longitude}`],
    //   mode: 'driving'
    // }).asPromise();
    // 
    // const distanceMeters = response.json.rows[0].elements[0].distance.value;
    // return distanceMeters / 1000; // Convert to kilometers
  } catch (error) {
    console.error("Error calculating road distance:", error);
    // Fall back to straight-line distance
    return calculateStraightLineDistance(coord1, coord2);
  }
};

/**
 * Estimate delivery time based on distance
 * @param {Number} distanceKm - Distance in kilometers
 * @param {Number} averageSpeed - Average speed in km/h (default: 30)
 * @returns {Number} Estimated time in minutes
 */
export const estimateDeliveryTime = (distanceKm, averageSpeed = 30) => {
  if (distanceKm <= 0) return 0;
  
  const hours = distanceKm / averageSpeed;
  const minutes = Math.ceil(hours * 60);
  
  return minutes;
};

/**
 * Calculate distance and ETA for an order
 * @param {Object} dairyLocation - Dairy coordinates {latitude, longitude}
 * @param {Object} deliveryLocation - Delivery coordinates {latitude, longitude}
 * @returns {Object} {distanceKm, estimatedTimeMinutes}
 */
export const calculateOrderDistanceAndETA = (dairyLocation, deliveryLocation) => {
  const distanceKm = calculateStraightLineDistance(dairyLocation, deliveryLocation);
  const estimatedTimeMinutes = estimateDeliveryTime(distanceKm);
  
  return {
    distanceKm: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
    estimatedTimeMinutes,
  };
};

/**
 * Parse address string to extract coordinates (if available)
 * @param {String} address - Address string
 * @returns {Object|null} Coordinates {latitude, longitude} or null
 */
export const parseAddressCoordinates = (address) => {
  // Try to extract coordinates from address string
  // Format: "Building, Area, Colony, Lat: XX.XXXX, Lng: XX.XXXX"
  const latMatch = address.match(/Lat:\s*([-+]?\d+\.?\d*)/i);
  const lngMatch = address.match(/Lng:\s*([-+]?\d+\.?\d*)/i);
  
  if (latMatch && lngMatch) {
    return {
      latitude: parseFloat(latMatch[1]),
      longitude: parseFloat(lngMatch[1]),
    };
  }
  
  return null;
};
