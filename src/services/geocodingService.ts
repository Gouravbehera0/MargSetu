/**
 * MARGSETU - Geocoding & Location Intelligence Service
 * Provides reverse geocoding via OpenStreetMap Nominatim, place search autocomplete,
 * Indian city-aware landmark presets, and dynamic local destination pairing.
 */
import type { GeoPoint } from '@/types';

export interface LocationSearchResult {
  placeId: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

export interface PresetDestination {
  name: string;
  shortLabel: string;
  category: 'railway' | 'hospital' | 'tech' | 'transit' | 'airport' | 'landmark';
  icon: string;
  lat: number;
  lng: number;
}

export interface CityProfile {
  id: string;
  cityName: string;
  stateName: string;
  center: GeoPoint;
  defaultDestination: GeoPoint;
  presets: PresetDestination[];
}

// In-memory cache for reverse geocoding to prevent rate limiting & provide instant response
const reverseGeocodeCache = new Map<string, string>();

/**
 * Curated landmark profiles for major Indian cities
 * Ensures starting and ending points match the real geographic context accurately
 */
export const CITY_PROFILES: CityProfile[] = [
  {
    id: 'raipur',
    cityName: 'Raipur',
    stateName: 'Chhattisgarh',
    center: {
      lat: 21.2514,
      lng: 81.6296,
      name: 'Jaistambh Chowk, Raipur'
    },
    defaultDestination: {
      lat: 21.25586,
      lng: 81.62954,
      name: 'Raipur Junction Railway Station'
    },
    presets: [
      {
        name: 'Raipur Junction Railway Station',
        shortLabel: 'Raipur Jn Station',
        category: 'railway',
        icon: '🚉',
        lat: 21.25586,
        lng: 81.62954
      },
      {
        name: 'AIIMS Raipur Hospital, Tatibandh',
        shortLabel: 'AIIMS Raipur',
        category: 'hospital',
        icon: '🏥',
        lat: 21.25615,
        lng: 81.57887
      },
      {
        name: 'Jaistambh Chowk (City Center)',
        shortLabel: 'Jaistambh Chowk',
        category: 'landmark',
        icon: '🏛️',
        lat: 21.24366,
        lng: 81.63560
      },
      {
        name: 'Telibandha Marine Drive Lake',
        shortLabel: 'Marine Drive Lake',
        category: 'landmark',
        icon: '🌊',
        lat: 21.23330,
        lng: 81.66670
      },
      {
        name: 'Swami Vivekananda Airport Raipur',
        shortLabel: 'Raipur Airport',
        category: 'airport',
        icon: '✈️',
        lat: 21.18536,
        lng: 81.74593
      },
      {
        name: 'Pandri Cloth Market Commercial Hub',
        shortLabel: 'Pandri Hub',
        category: 'tech',
        icon: '🏢',
        lat: 21.2580,
        lng: 81.6500
      }
    ]
  },
  {
    id: 'bhubaneswar',
    cityName: 'Bhubaneswar',
    stateName: 'Odisha',
    center: {
      lat: 20.2685,
      lng: 85.8360,
      name: 'Master Canteen Junction, Bhubaneswar'
    },
    defaultDestination: {
      lat: 20.3120,
      lng: 85.8180,
      name: 'AIIMS Hospital Complex, Bhubaneswar'
    },
    presets: [
      {
        name: 'AIIMS Hospital Complex, Bhubaneswar',
        shortLabel: 'AIIMS Bhubaneswar',
        category: 'hospital',
        icon: '🏥',
        lat: 20.3120,
        lng: 85.8180
      },
      {
        name: 'Bhubaneswar Railway Station',
        shortLabel: 'Bhubaneswar Station',
        category: 'railway',
        icon: '🚉',
        lat: 20.2685,
        lng: 85.8420
      },
      {
        name: 'Patia Infocity Tech Park',
        shortLabel: 'Patia Infocity',
        category: 'tech',
        icon: '💻',
        lat: 20.3540,
        lng: 85.8170
      },
      {
        name: 'Capital Hospital Central',
        shortLabel: 'Capital Hospital',
        category: 'hospital',
        icon: '🏥',
        lat: 20.2640,
        lng: 85.8240
      },
      {
        name: 'Jayadev Vihar Chowk',
        shortLabel: 'Jayadev Vihar',
        category: 'landmark',
        icon: '🛣️',
        lat: 20.3010,
        lng: 85.8350
      },
      {
        name: 'Biju Patnaik International Airport',
        shortLabel: 'BBI Airport',
        category: 'airport',
        icon: '✈️',
        lat: 20.2525,
        lng: 85.8178
      }
    ]
  },
  {
    id: 'delhi',
    cityName: 'Delhi NCR',
    stateName: 'Delhi',
    center: {
      lat: 28.6315,
      lng: 77.2167,
      name: 'Connaught Place Central, Delhi'
    },
    defaultDestination: {
      lat: 28.5672,
      lng: 77.2100,
      name: 'AIIMS New Delhi, Ansari Nagar'
    },
    presets: [
      {
        name: 'New Delhi Railway Station',
        shortLabel: 'New Delhi Station',
        category: 'railway',
        icon: '🚉',
        lat: 28.6429,
        lng: 77.2195
      },
      {
        name: 'AIIMS New Delhi, Ansari Nagar',
        shortLabel: 'AIIMS New Delhi',
        category: 'hospital',
        icon: '🏥',
        lat: 28.5672,
        lng: 77.2100
      },
      {
        name: 'Connaught Place Central',
        shortLabel: 'Connaught Place',
        category: 'landmark',
        icon: '🏛️',
        lat: 28.6315,
        lng: 77.2167
      },
      {
        name: 'Indira Gandhi International Airport T3',
        shortLabel: 'IGI Airport T3',
        category: 'airport',
        icon: '✈️',
        lat: 28.5562,
        lng: 77.1000
      },
      {
        name: 'Cyber Hub Gurugram',
        shortLabel: 'Cyber Hub',
        category: 'tech',
        icon: '🏢',
        lat: 28.4986,
        lng: 77.0878
      }
    ]
  },
  {
    id: 'bengaluru',
    cityName: 'Bengaluru',
    stateName: 'Karnataka',
    center: {
      lat: 12.9756,
      lng: 77.6066,
      name: 'MG Road Central, Bengaluru'
    },
    defaultDestination: {
      lat: 12.9781,
      lng: 77.5695,
      name: 'KSR Bengaluru City Junction Station'
    },
    presets: [
      {
        name: 'KSR Bengaluru City Junction Station',
        shortLabel: 'KSR Station',
        category: 'railway',
        icon: '🚉',
        lat: 12.9781,
        lng: 77.5695
      },
      {
        name: 'Whitefield ITPL Tech Corridor',
        shortLabel: 'Whitefield ITPL',
        category: 'tech',
        icon: '💻',
        lat: 12.9863,
        lng: 77.7308
      },
      {
        name: 'Electronic City Phase 1',
        shortLabel: 'Electronic City',
        category: 'tech',
        icon: '🏢',
        lat: 12.8452,
        lng: 77.6602
      },
      {
        name: 'NIMHANS Premier Hospital Complex',
        shortLabel: 'NIMHANS Hospital',
        category: 'hospital',
        icon: '🏥',
        lat: 12.9372,
        lng: 77.5956
      },
      {
        name: 'Kempegowda International Airport (BLR)',
        shortLabel: 'BLR Airport',
        category: 'airport',
        icon: '✈️',
        lat: 13.1986,
        lng: 77.7066
      }
    ]
  },
  {
    id: 'mumbai',
    cityName: 'Mumbai',
    stateName: 'Maharashtra',
    center: {
      lat: 18.9402,
      lng: 72.8356,
      name: 'CSMT Railway Terminus, Mumbai'
    },
    defaultDestination: {
      lat: 19.0664,
      lng: 72.8687,
      name: 'Bandra Kurla Complex (BKC)'
    },
    presets: [
      {
        name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)',
        shortLabel: 'CSMT Station',
        category: 'railway',
        icon: '🚉',
        lat: 18.9402,
        lng: 72.8356
      },
      {
        name: 'Bandra Kurla Complex (BKC)',
        shortLabel: 'BKC Financial Hub',
        category: 'tech',
        icon: '🏢',
        lat: 19.0664,
        lng: 72.8687
      },
      {
        name: 'KEM Hospital & Medical College Parel',
        shortLabel: 'KEM Hospital',
        category: 'hospital',
        icon: '🏥',
        lat: 19.0028,
        lng: 72.8424
      },
      {
        name: 'Marine Drive Nariman Point',
        shortLabel: 'Marine Drive',
        category: 'landmark',
        icon: '🌊',
        lat: 18.9256,
        lng: 72.8242
      },
      {
        name: 'Chhatrapati Shivaji Maharaj Airport T2',
        shortLabel: 'CSMIA Airport',
        category: 'airport',
        icon: '✈️',
        lat: 19.0896,
        lng: 72.8656
      }
    ]
  },
  {
    id: 'hyderabad',
    cityName: 'Hyderabad',
    stateName: 'Telangana',
    center: {
      lat: 17.3616,
      lng: 78.4747,
      name: 'Charminar Heritage Hub, Hyderabad'
    },
    defaultDestination: {
      lat: 17.4504,
      lng: 78.3808,
      name: 'HITEC City Cyber Towers, Madhapur'
    },
    presets: [
      {
        name: 'HITEC City Cyber Towers, Madhapur',
        shortLabel: 'HITEC City',
        category: 'tech',
        icon: '💻',
        lat: 17.4504,
        lng: 78.3808
      },
      {
        name: 'Secunderabad Junction Station',
        shortLabel: 'Secunderabad Jn',
        category: 'railway',
        icon: '🚉',
        lat: 17.4338,
        lng: 78.5015
      },
      {
        name: 'Nizam Institute of Medical Sciences (NIMS)',
        shortLabel: 'NIMS Hospital',
        category: 'hospital',
        icon: '🏥',
        lat: 17.4224,
        lng: 78.4554
      },
      {
        name: 'Rajiv Gandhi International Airport (RGIA)',
        shortLabel: 'RGIA Airport',
        category: 'airport',
        icon: '✈️',
        lat: 17.2403,
        lng: 78.4294
      }
    ]
  },
  {
    id: 'kolkata',
    cityName: 'Kolkata',
    stateName: 'West Bengal',
    center: {
      lat: 22.5645,
      lng: 88.3518,
      name: 'Esplanade Central, Kolkata'
    },
    defaultDestination: {
      lat: 22.5839,
      lng: 88.3426,
      name: 'Howrah Junction Railway Station'
    },
    presets: [
      {
        name: 'Howrah Junction Railway Station',
        shortLabel: 'Howrah Station',
        category: 'railway',
        icon: '🚉',
        lat: 22.5839,
        lng: 88.3426
      },
      {
        name: 'Salt Lake Sector V Tech Hub',
        shortLabel: 'Salt Lake IT',
        category: 'tech',
        icon: '💻',
        lat: 22.5735,
        lng: 88.4331
      },
      {
        name: 'SSKM Hospital / IPGMER Complex',
        shortLabel: 'SSKM Hospital',
        category: 'hospital',
        icon: '🏥',
        lat: 22.5385,
        lng: 88.3427
      },
      {
        name: 'Netaji Subhash Chandra Bose Int Airport',
        shortLabel: 'Kolkata Airport',
        category: 'airport',
        icon: '✈️',
        lat: 22.6547,
        lng: 88.4467
      }
    ]
  },
  {
    id: 'pune',
    cityName: 'Pune',
    stateName: 'Maharashtra',
    center: {
      lat: 18.5293,
      lng: 73.8426,
      name: 'FC Road, Shivajinagar, Pune'
    },
    defaultDestination: {
      lat: 18.5284,
      lng: 73.8743,
      name: 'Pune Junction Railway Station'
    },
    presets: [
      {
        name: 'Pune Junction Railway Station',
        shortLabel: 'Pune Station',
        category: 'railway',
        icon: '🚉',
        lat: 18.5284,
        lng: 73.8743
      },
      {
        name: 'Hinjawadi IT Park Phase 1',
        shortLabel: 'Hinjawadi IT',
        category: 'tech',
        icon: '💻',
        lat: 18.5913,
        lng: 73.7389
      },
      {
        name: 'Ruby Hall Clinic Central Hospital',
        shortLabel: 'Ruby Hall Clinic',
        category: 'hospital',
        icon: '🏥',
        lat: 18.5323,
        lng: 73.8789
      },
      {
        name: 'Pune Lohegaon Airport',
        shortLabel: 'Pune Airport',
        category: 'airport',
        icon: '✈️',
        lat: 18.5822,
        lng: 73.9197
      }
    ]
  }
];

/**
 * Calculates Great-Circle Haversine distance in kilometers
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest configured city profile within 60 km
 */
export function findClosestCityProfile(lat: number, lng: number): CityProfile | null {
  let closest: CityProfile | null = null;
  let minDistance = 60; // Max radius in km to treat as the same metropolitan city

  for (const city of CITY_PROFILES) {
    const dist = calculateDistanceKm(lat, lng, city.center.lat, city.center.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  return closest;
}

/**
 * Reverse geocodes coordinates to a human-readable place name using OpenStreetMap Nominatim
 */
export async function reverseGeocodeLocation(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}&zoom=16&addressdetails=1`;
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MargSetu-Intelligent-Routing/1.0'
      }
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && data.address) {
        const addr = data.address;
        const mainPart = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || addr.railway || addr.commercial || addr.village;
        const cityPart = addr.city || addr.town || addr.municipality || addr.county || addr.state_district;
        const statePart = addr.state;

        const parts = [mainPart, cityPart, statePart].filter(Boolean);
        const formatted = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(', ');

        if (formatted) {
          reverseGeocodeCache.set(cacheKey, formatted);
          return formatted;
        }
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocoding unavailable or timed out:', err);
  }

  // Fallback: Check if near a known city center
  const matchedCity = findClosestCityProfile(lat, lng);
  if (matchedCity) {
    const fallbackName = `${matchedCity.cityName}, ${matchedCity.stateName}`;
    reverseGeocodeCache.set(cacheKey, fallbackName);
    return fallbackName;
  }

  const genericName = `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
  reverseGeocodeCache.set(cacheKey, genericName);
  return genericName;
}

/**
 * Searches places via OpenStreetMap Nominatim autocomplete
 */
export async function searchPlacesAutocomplete(
  query: string,
  nearLat?: number,
  nearLng?: number
): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&addressdetails=1&limit=6`;
    if (nearLat !== undefined && nearLng !== undefined) {
      // Prioritize places near the current viewport or user location
      const viewbox = `${(nearLng - 0.5).toFixed(4)},${(nearLat + 0.5).toFixed(4)},${(nearLng + 0.5).toFixed(4)},${(nearLat - 0.5).toFixed(4)}`;
      url += `&viewbox=${viewbox}&bounded=0`;
    }

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MargSetu-Intelligent-Routing/1.0'
      }
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => {
          const parts = item.display_name.split(',');
          const title = parts.slice(0, 2).join(',').trim();
          const subtitle = parts.slice(2, 4).join(',').trim();
          return {
            placeId: String(item.place_id || Math.random()),
            name: title,
            displayName: subtitle ? `${title} (${subtitle})` : title,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type || item.class || 'place'
          };
        });
      }
    }
  } catch (err) {
    console.warn('Place search autocomplete unavailable:', err);
  }

  // Fallback: match in our curated city presets
  const q = query.toLowerCase();
  const matchedPresets: LocationSearchResult[] = [];
  for (const city of CITY_PROFILES) {
    if (city.cityName.toLowerCase().includes(q)) {
      matchedPresets.push({
        placeId: `city-${city.id}`,
        name: city.center.name || city.cityName,
        displayName: `${city.cityName}, ${city.stateName} (City Center)`,
        lat: city.center.lat,
        lng: city.center.lng,
        type: 'city'
      });
    }
    for (const preset of city.presets) {
      if (preset.name.toLowerCase().includes(q) || preset.shortLabel.toLowerCase().includes(q)) {
        matchedPresets.push({
          placeId: `preset-${preset.name}`,
          name: preset.name,
          displayName: `${preset.name} - ${city.cityName}`,
          lat: preset.lat,
          lng: preset.lng,
          type: preset.category
        });
      }
    }
  }

  return matchedPresets.slice(0, 5);
}

/**
 * Generates an intelligent set of destination presets and a default destination
 * that genuinely corresponds to the user's location
 */
export function getIntelligentDestinationSetup(
  originLat: number,
  originLng: number,
  originName?: string
): {
  defaultDestination: GeoPoint;
  presets: PresetDestination[];
  detectedCityName: string;
} {
  const matchedCity = findClosestCityProfile(originLat, originLng);

  if (matchedCity) {
    return {
      defaultDestination: matchedCity.defaultDestination,
      presets: matchedCity.presets,
      detectedCityName: matchedCity.cityName
    };
  }

  // If outside known city hubs (e.g. smaller town, highway, custom coords),
  // generate realistic local destinations (~4 to 8 km away) in that immediate vicinity
  const offsetLat1 = Number((originLat + 0.038).toFixed(5));
  const offsetLng1 = Number((originLng + 0.026).toFixed(5));
  const offsetLat2 = Number((originLat - 0.032).toFixed(5));
  const offsetLng2 = Number((originLng + 0.019).toFixed(5));
  const offsetLat3 = Number((originLat + 0.021).toFixed(5));
  const offsetLng3 = Number((originLng - 0.035).toFixed(5));

  const localArea = originName ? originName.split(',')[0] : 'Local Area';

  const defaultDest: GeoPoint = {
    lat: offsetLat1,
    lng: offsetLng1,
    name: `${localArea} District Hospital / Medical Hub`
  };

  const dynamicPresets: PresetDestination[] = [
    {
      name: `${localArea} District Hospital / Medical Hub`,
      shortLabel: 'District Hospital',
      category: 'hospital',
      icon: '🏥',
      lat: offsetLat1,
      lng: offsetLng1
    },
    {
      name: `${localArea} Junction Railway / Transit Terminal`,
      shortLabel: 'Transit Terminal',
      category: 'railway',
      icon: '🚉',
      lat: offsetLat2,
      lng: offsetLng2
    },
    {
      name: `${localArea} Commercial / Tech Industrial Corridor`,
      shortLabel: 'Industrial Corridor',
      category: 'tech',
      icon: '🏢',
      lat: offsetLat3,
      lng: offsetLng3
    },
    {
      name: 'Raipur Junction Station (Hub)',
      shortLabel: 'Raipur Junction',
      category: 'railway',
      icon: '🚉',
      lat: 21.25586,
      lng: 81.62954
    }
  ];

  return {
    defaultDestination: defaultDest,
    presets: dynamicPresets,
    detectedCityName: localArea
  };
}
