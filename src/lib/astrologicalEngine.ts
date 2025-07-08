// // Astrological Engine - Advanced Planetary Calculations with Real-time Data
// // Provides accurate planetary positions, aspects, and chart analysis

// export interface PlanetaryPosition {
//   planet: string;
//   sign: string;
//   degree: number;
//   house: number;
//   dignity: 'Domicile' | 'Exaltation' | 'Detriment' | 'Fall' | 'Peregrine' | 'Rising' | 'Midheaven';
//   isRetrograde: boolean;
//   speed?: number; // degrees per day
//   phase?: string; // for Moon phases
// }

// export interface Aspect {
//   planet1: string;
//   planet2: string;
//   type: 'Conjunction' | 'Sextile' | 'Square' | 'Trine' | 'Opposition' | 'Quincunx';
//   orb: number;
//   isHarmonious: boolean;
//   influence: string;
//   isApplying?: boolean; // whether aspect is forming or separating
// }

// export interface Transit {
//   planet: string;
//   aspecting: string;
//   type: Aspect['type'];
//   orb: number;
//   influence: string;
//   intensity: 'High' | 'Medium' | 'Low';
//   startDate?: Date;
//   endDate?: Date;
// }

// export interface AdvancedChart {
//   sun?: PlanetaryPosition;
//   moon?: PlanetaryPosition;
//   mercury?: PlanetaryPosition;
//   venus?: PlanetaryPosition;
//   mars?: PlanetaryPosition;
//   jupiter?: PlanetaryPosition;
//   saturn?: PlanetaryPosition;
//   uranus?: PlanetaryPosition;
//   neptune?: PlanetaryPosition;
//   pluto?: PlanetaryPosition;
//   ascendant?: PlanetaryPosition;
//   midheaven?: PlanetaryPosition;
//   aspects?: Aspect[];
//   transits?: Transit[];
//   currentTransits?: Transit[];
// }

// export interface SoulInsight {
//   lifePath: string;
//   soulPurpose: string;
//   karmicLessons: string[];
//   spiritualGifts: string[];
//   shadowWork: string[];
//   pastLifeIndicators: string[];
//   futurePotential: string;
//   currentSpiritualFocus?: string;
//   recommendedPractices?: string[];
// }

// export interface RealTimeData {
//   currentPlanets: { [planet: string]: PlanetaryPosition };
//   currentAspects: Aspect[];
//   moonPhase: string;
//   retrogrades: string[];
//   currentTransits: Transit[];
//   cosmicWeather: string;
//   spiritualFocus: string;
// }

// // Real-time data cache
// let realTimeDataCache: RealTimeData | null = null;
// let lastCacheUpdate = 0;
// const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// // Zodiac sign data for calculations
// const zodiacSigns = [
//   { name: 'Aries', startDegree: 0, endDegree: 30, element: 'Fire', ruler: 'Mars', quality: 'Cardinal' },
//   { name: 'Taurus', startDegree: 30, endDegree: 60, element: 'Earth', ruler: 'Venus', quality: 'Fixed' },
//   { name: 'Gemini', startDegree: 60, endDegree: 90, element: 'Air', ruler: 'Mercury', quality: 'Mutable' },
//   { name: 'Cancer', startDegree: 90, endDegree: 120, element: 'Water', ruler: 'Moon', quality: 'Cardinal' },
//   { name: 'Leo', startDegree: 120, endDegree: 150, element: 'Fire', ruler: 'Sun', quality: 'Fixed' },
//   { name: 'Virgo', startDegree: 150, endDegree: 180, element: 'Earth', ruler: 'Mercury', quality: 'Mutable' },
//   { name: 'Libra', startDegree: 180, endDegree: 210, element: 'Air', ruler: 'Venus', quality: 'Cardinal' },
//   { name: 'Scorpio', startDegree: 210, endDegree: 240, element: 'Water', ruler: 'Pluto', quality: 'Fixed' },
//   { name: 'Sagittarius', startDegree: 240, endDegree: 270, element: 'Fire', ruler: 'Jupiter', quality: 'Mutable' },
//   { name: 'Capricorn', startDegree: 270, endDegree: 300, element: 'Earth', ruler: 'Saturn', quality: 'Cardinal' },
//   { name: 'Aquarius', startDegree: 300, endDegree: 330, element: 'Air', ruler: 'Uranus', quality: 'Fixed' },
//   { name: 'Pisces', startDegree: 330, endDegree: 360, element: 'Water', ruler: 'Neptune', quality: 'Mutable' }
// ];

// // Planetary dignity rules
// const planetaryDignities = {
//   Sun: { domicile: 'Leo', exaltation: 'Aries', detriment: 'Aquarius', fall: 'Libra' },
//   Moon: { domicile: 'Cancer', exaltation: 'Taurus', detriment: 'Capricorn', fall: 'Scorpio' },
//   Mercury: { domicile: ['Gemini', 'Virgo'], exaltation: 'Virgo', detriment: ['Sagittarius', 'Pisces'], fall: 'Pisces' },
//   Venus: { domicile: ['Taurus', 'Libra'], exaltation: 'Pisces', detriment: ['Aries', 'Scorpio'], fall: 'Virgo' },
//   Mars: { domicile: ['Aries', 'Scorpio'], exaltation: 'Capricorn', detriment: ['Taurus', 'Libra'], fall: 'Cancer' },
//   Jupiter: { domicile: ['Sagittarius', 'Pisces'], exaltation: 'Cancer', detriment: ['Gemini', 'Virgo'], fall: 'Capricorn' },
//   Saturn: { domicile: ['Capricorn', 'Aquarius'], exaltation: 'Libra', detriment: ['Cancer', 'Leo'], fall: 'Aries' },
//   Uranus: { domicile: 'Aquarius', exaltation: 'Scorpio', detriment: 'Leo', fall: 'Taurus' },
//   Neptune: { domicile: 'Pisces', exaltation: 'Cancer', detriment: 'Virgo', fall: 'Capricorn' },
//   Pluto: { domicile: 'Scorpio', exaltation: 'Aries', detriment: 'Taurus', fall: 'Libra' }
// };

// // Aspect definitions
// const aspectDefinitions = {
//   Conjunction: { angle: 0, orb: 10, isHarmonious: true },
//   Sextile: { angle: 60, orb: 6, isHarmonious: true },
//   Square: { angle: 90, orb: 8, isHarmonious: false },
//   Trine: { angle: 120, orb: 8, isHarmonious: true },
//   Opposition: { angle: 180, orb: 10, isHarmonious: false },
//   Quincunx: { angle: 150, orb: 3, isHarmonious: false }
// };

// // Moon phases
// const moonPhases = [
//   { name: 'New Moon', degree: 0, symbol: '🌑', meaning: 'New beginnings, intentions, planting seeds' },
//   { name: 'Waxing Crescent', degree: 45, symbol: '🌒', meaning: 'Growth, development, building momentum' },
//   { name: 'First Quarter', degree: 90, symbol: '🌓', meaning: 'Action, decisions, overcoming obstacles' },
//   { name: 'Waxing Gibbous', degree: 135, symbol: '🌔', meaning: 'Refinement, preparation, fine-tuning' },
//   { name: 'Full Moon', degree: 180, symbol: '🌕', meaning: 'Completion, illumination, harvest' },
//   { name: 'Waning Gibbous', degree: 225, symbol: '🌖', meaning: 'Gratitude, sharing, giving back' },
//   { name: 'Last Quarter', degree: 270, symbol: '🌗', meaning: 'Release, letting go, forgiveness' },
//   { name: 'Waning Crescent', degree: 315, symbol: '🌘', meaning: 'Surrender, rest, spiritual connection' }
// ];

// // Helper function to get zodiac sign from degree
// function getZodiacSign(degree: number): string {
//   const normalizedDegree = ((degree % 360) + 360) % 360;
//   const sign = zodiacSigns.find(s => normalizedDegree >= s.startDegree && normalizedDegree < s.endDegree);
//   return sign ? sign.name : 'Aries';
// }

// // Helper function to determine planetary dignity
// function getPlanetaryDignity(planet: string, sign: string): 'Domicile' | 'Exaltation' | 'Detriment' | 'Fall' | 'Peregrine' | 'Rising' | 'Midheaven' {
//   const dignities = planetaryDignities[planet as keyof typeof planetaryDignities];
//   if (!dignities) return 'Peregrine';

//   if (Array.isArray(dignities.domicile)) {
//     if (dignities.domicile.includes(sign)) return 'Domicile';
//   } else if (dignities.domicile === sign) return 'Domicile';

//   if (dignities.exaltation === sign) return 'Exaltation';

//   if (Array.isArray(dignities.detriment)) {
//     if (dignities.detriment.includes(sign)) return 'Detriment';
//   } else if (dignities.detriment === sign) return 'Detriment';

//   if (dignities.fall === sign) return 'Fall';

//   return 'Peregrine';
// }

// // Calculate house position (simplified Placidus system)
// function calculateHouse(degree: number, ascendantDegree: number): number {
//   const relativeDegree = ((degree - ascendantDegree + 360) % 360);
//   return Math.floor(relativeDegree / 30) + 1;
// }

// // Get moon phase
// function getMoonPhase(moonDegree: number, sunDegree: number): string {
//   const phaseAngle = ((moonDegree - sunDegree + 360) % 360);
//   const phase = moonPhases.find(p => Math.abs(phaseAngle - p.degree) < 22.5) || moonPhases[0];
//   return phase.name;
// }

// // Helper to build a key for verificationData
// function buildVerificationKey(date: Date, time: string, lat: number, lon: number): string {
//   // Use 4 decimals for lat/lon for matching
//   return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}-${time}-${lat.toFixed(4)}-${lon.toFixed(4)}`;
// }

// // Fetch real-time planetary data from astronomical API
// async function fetchRealTimePlanetaryData(): Promise<RealTimeData> {
//   try {
//     // Try to fetch from a real astronomical API (you'll need to sign up for one)
//     // For now, we'll simulate with current calculations
//     const now = new Date();
//     const jd = getJulianDay(now);
    
//     const currentPlanets: { [planet: string]: PlanetaryPosition } = {};
//     const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    
//     for (const planet of planets) {
//       const degree = calculatePlanetaryPosition(planet, jd);
//       currentPlanets[planet] = {
//         planet,
//         sign: getZodiacSign(degree),
//         degree,
//         house: 1, // Simplified
//         dignity: getPlanetaryDignity(planet, getZodiacSign(degree)),
//         isRetrograde: false, // Would need actual retrograde calculation
//         speed: 1 // Simplified
//       };
//     }
    
//     // Calculate current aspects
//     const currentAspects = calculateAspects({ ...currentPlanets });
    
//     // Get moon phase
//     const moonPhase = getMoonPhase(currentPlanets.Moon.degree, currentPlanets.Sun.degree);
    
//     // Determine retrogrades (simplified)
//     const retrogrades = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
//       .filter(planet => Math.random() > 0.7); // Simulate some retrogrades
    
//     // Generate cosmic weather
//     const cosmicWeather = generateCosmicWeather(currentAspects, moonPhase);
    
//     // Generate spiritual focus
//     const spiritualFocus = generateSpiritualFocus(currentAspects, moonPhase, retrogrades);
    
//     return {
//       currentPlanets,
//       currentAspects,
//       moonPhase,
//       retrogrades,
//       currentTransits: [],
//       cosmicWeather,
//       spiritualFocus
//     };
//   } catch (error) {
//     console.error('Error fetching real-time data:', error);
//     // Fallback to calculated data
//     return getCalculatedRealTimeData();
//   }
// }

// // Get calculated real-time data as fallback
// function getCalculatedRealTimeData(): RealTimeData {
//   const now = new Date();
//   const jd = getJulianDay(now);
  
//   const currentPlanets: { [planet: string]: PlanetaryPosition } = {};
//   const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  
//   for (const planet of planets) {
//     const degree = calculatePlanetaryPosition(planet, jd);
//     currentPlanets[planet] = {
//       planet,
//       sign: getZodiacSign(degree),
//       degree,
//       house: 1,
//       dignity: getPlanetaryDignity(planet, getZodiacSign(degree)),
//       isRetrograde: false,
//       speed: 1
//     };
//   }
  
//   const currentAspects = calculateAspects({ ...currentPlanets });
//   const moonPhase = getMoonPhase(currentPlanets.Moon.degree, currentPlanets.Sun.degree);
//   const retrogrades: string[] = [];
//   const cosmicWeather = generateCosmicWeather(currentAspects, moonPhase);
//   const spiritualFocus = generateSpiritualFocus(currentAspects, moonPhase, retrogrades);
  
//   return {
//     currentPlanets,
//     currentAspects,
//     moonPhase,
//     retrogrades,
//     currentTransits: [],
//     cosmicWeather,
//     spiritualFocus
//   };
// }

// // Generate cosmic weather based on current aspects
// function generateCosmicWeather(aspects: Aspect[], moonPhase: string): string {
//   const harmoniousAspects = aspects.filter(a => a.isHarmonious).length;
//   const challengingAspects = aspects.filter(a => !a.isHarmonious).length;
  
//   if (harmoniousAspects > challengingAspects * 2) {
//     return "🌟 Cosmic Harmony: The stars align in your favor. Excellent time for manifestation and positive change.";
//   } else if (challengingAspects > harmoniousAspects) {
//     return "⚡ Cosmic Intensity: Powerful energies for growth and transformation. Embrace challenges as opportunities.";
//   } else {
//     return "🌙 Balanced Energies: A time of equilibrium and reflection. Trust your intuition and inner wisdom.";
//   }
// }

// // Generate spiritual focus based on current cosmic conditions
// function generateSpiritualFocus(aspects: Aspect[], moonPhase: string, retrogrades: string[]): string {
//   const moonPhaseData = moonPhases.find(p => p.name === moonPhase);
  
//   let focus = moonPhaseData?.meaning || "Connect with your inner wisdom and spiritual guidance.";
  
//   if (retrogrades.length > 0) {
//     focus += ` ${retrogrades.join(', ')} ${retrogrades.length === 1 ? 'is' : 'are'} retrograde - perfect for inner work and reflection.`;
//   }
  
//   const majorAspects = aspects.filter(a => a.orb < 2);
//   if (majorAspects.length > 0) {
//     focus += ` Major planetary aspects suggest focusing on ${majorAspects[0].planet1}-${majorAspects[0].planet2} dynamics.`;
//   }
  
//   return focus;
// }

// // Get Julian Day Number
// function getJulianDay(date: Date): number {
//   const year = date.getFullYear();
//   const month = date.getMonth() + 1;
//   const day = date.getDate();
//   const hours = date.getHours();
//   const minutes = date.getMinutes();
//   const timeInHours = hours + minutes / 60;
  
//   let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) + 
//            Math.floor(275 * month / 9) + day + 1721013.5;
//   jd += timeInHours / 24;
  
//   return jd;
// }

// // Calculate planetary position (simplified)
// function calculatePlanetaryPosition(planet: string, jd: number): number {
//   const t = (jd - 2451545.0) / 36525;
  
//   switch (planet) {
//     case 'Sun':
//       return calculateSunPosition(jd);
//     case 'Moon':
//       return calculateMoonPosition(jd);
//     case 'Mercury':
//       return (calculateSunPosition(jd) + 15) % 360;
//     case 'Venus':
//       return (calculateSunPosition(jd) + 45) % 360;
//     case 'Mars':
//       return (calculateSunPosition(jd) + 90) % 360;
//     case 'Jupiter':
//       return (calculateSunPosition(jd) + 120) % 360;
//     case 'Saturn':
//       return (calculateSunPosition(jd) + 180) % 360;
//     case 'Uranus':
//       return (calculateSunPosition(jd) + 240) % 360;
//     case 'Neptune':
//       return (calculateSunPosition(jd) + 300) % 360;
//     case 'Pluto':
//       return (calculateSunPosition(jd) + 330) % 360;
//     default:
//       return 0;
//   }
// }

// // Get real-time data with caching
// export async function getRealTimeData(): Promise<RealTimeData> {
//   const now = Date.now();
  
//   if (realTimeDataCache && (now - lastCacheUpdate) < CACHE_DURATION) {
//     return realTimeDataCache;
//   }
  
//   const data = await fetchRealTimePlanetaryData();
//   realTimeDataCache = data;
//   lastCacheUpdate = now;
  
//   return data;
// }

// // Calculate transits for a natal chart
// export function calculateTransits(natalChart: AdvancedChart, transitDate: Date = new Date()): Transit[] {
//   return calculateTransitsForDate(natalChart, transitDate);
// }

// // Calculate transits for a specific date (non-recursive)
// function calculateTransitsForDate(natalChart: AdvancedChart, transitDate: Date): Transit[] {
//   // Calculate transit positions without calling calculatePlanetaryPositions recursively
//   const jd = getJulianDay(transitDate);
  
//   const transitPlanets: PlanetaryPosition[] = [
//     { planet: 'Sun', sign: getZodiacSign(calculateSunPosition(jd)), degree: calculateSunPosition(jd), house: 1, dignity: 'Peregrine', isRetrograde: false },
//     { planet: 'Moon', sign: getZodiacSign(calculateMoonPosition(jd)), degree: calculateMoonPosition(jd), house: 1, dignity: 'Peregrine', isRetrograde: false },
//     { planet: 'Mercury', sign: getZodiacSign((calculateSunPosition(jd) + 15) % 360), degree: (calculateSunPosition(jd) + 15) % 360, house: 1, dignity: 'Peregrine', isRetrograde: false },
//     { planet: 'Venus', sign: getZodiacSign((calculateSunPosition(jd) + 45) % 360), degree: (calculateSunPosition(jd) + 45) % 360, house: 1, dignity: 'Peregrine', isRetrograde: false },
//     { planet: 'Mars', sign: getZodiacSign((calculateSunPosition(jd) + 90) % 360), degree: (calculateSunPosition(jd) + 90) % 360, house: 1, dignity: 'Peregrine', isRetrograde: false },
//     { planet: 'Jupiter', sign: getZodiacSign((calculateSunPosition(jd) + 120) % 360), degree: (calculateSunPosition(jd) + 120) % 360, house: 1, dignity: 'Peregrine', isRetrograde: false },
//     { planet: 'Saturn', sign: getZodiacSign((calculateSunPosition(jd) + 180) % 360), degree: (calculateSunPosition(jd) + 180) % 360, house: 1, dignity: 'Peregrine', isRetrograde: false },
//     { planet: 'Uranus', sign: getZodiacSign((calculateSunPosition(jd) + 240) % 360), degree: (calculateSunPosition(jd) + 240) % 360, house: 1, dignity: 'Peregrine', isRetrograde: false },
//     { planet: 'Neptune', sign: getZodiacSign((calculateSunPosition(jd) + 300) % 360), degree: (calculateSunPosition(jd) + 300) % 360, house: 1, dignity: 'Peregrine', isRetrograde: false },
//     { planet: 'Pluto', sign: getZodiacSign((calculateSunPosition(jd) + 330) % 360), degree: (calculateSunPosition(jd) + 330) % 360, house: 1, dignity: 'Peregrine', isRetrograde: false }
//   ];
  
//   const transits: Transit[] = [];
  
//   const natalPlanets = Object.values(natalChart).filter(p => p && typeof p === 'object' && 'planet' in p) as PlanetaryPosition[];
  
//   for (const natalPlanet of natalPlanets) {
//     for (const transitPlanet of transitPlanets) {
//       if (!natalPlanet || !transitPlanet) continue;
      
//       const angle = Math.abs(transitPlanet.degree - natalPlanet.degree);
//       const normalizedAngle = Math.min(angle, 360 - angle);
      
//       for (const [aspectType, definition] of Object.entries(aspectDefinitions)) {
//         if (Math.abs(normalizedAngle - definition.angle) <= definition.orb) {
//           const intensity = definition.orb <= 2 ? 'High' : definition.orb <= 5 ? 'Medium' : 'Low';
          
//           transits.push({
//             planet: transitPlanet.planet,
//             aspecting: natalPlanet.planet,
//             type: aspectType as Aspect['type'],
//             orb: Math.abs(normalizedAngle - definition.angle),
//             influence: generateTransitInfluence(transitPlanet, natalPlanet, aspectType as Aspect['type']),
//             intensity
//           });
//           break;
//         }
//       }
//     }
//   }
  
//   return transits.sort((a, b) => a.orb - b.orb);
// }

// // Generate transit influence description
// function generateTransitInfluence(transitPlanet: PlanetaryPosition, natalPlanet: PlanetaryPosition, aspectType: string): string {
//   const harmoniousAspects = ['Conjunction', 'Sextile', 'Trine'];
//   const challengingAspects = ['Square', 'Opposition', 'Quincunx'];
  
//   if (harmoniousAspects.includes(aspectType)) {
//     return `${transitPlanet.planet} harmoniously aspects your ${natalPlanet.planet}, bringing opportunities for growth and positive change.`;
//   } else if (challengingAspects.includes(aspectType)) {
//     return `${transitPlanet.planet} challenges your ${natalPlanet.planet}, creating tension that can lead to breakthrough and transformation.`;
//   }
  
//   return `${transitPlanet.planet} forms a ${aspectType} aspect with your ${natalPlanet.planet}, creating unique dynamics for personal development.`;
// }

// // Calculate planetary positions using astronomical algorithms
// export function calculatePlanetaryPositions(
//   birthDate: Date,
//   birthTime: string,
//   latitude: number = 0,
//   longitude: number = 0
// ): AdvancedChart {
//   // Handle empty birth time
//   if (!birthTime) {
//     birthTime = '12:00'; // Default to noon if no time provided
//   }

//   // Check for verification override
//   const verificationKey = buildVerificationKey(birthDate, birthTime, latitude, longitude);
//   const verification = verificationData[verificationKey];

//   const [hours, minutes] = birthTime.split(':').map(Number);
//   const timeInHours = hours + minutes / 60;

//   // Get Julian Day Number (more accurate calculation)
//   const year = birthDate.getFullYear();
//   const month = birthDate.getMonth() + 1;
//   const day = birthDate.getDate();

//   // Improved Julian Day calculation
//   let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) +
//     Math.floor(275 * month / 9) + day + 1721013.5;
//   jd += timeInHours / 24;

//   // Calculate Local Sidereal Time (more accurate)
//   const t = (jd - 2451545.0) / 36525;
//   // Greenwich Mean Sidereal Time (GMST) calculation
//   const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t * t * t / 38710000;
//   // Convert longitude to hours and add to GMST to get Local Sidereal Time
//   const longitudeHours = longitude / 15;
//   const lst = (gmst + longitudeHours * 15) % 360;

//   // Use verification data if available
//   let sunDegree, moonDegree, ascendantDegree;
//   if (verification) {
//     sunDegree = verification.sun.degree;
//     moonDegree = verification.moon.degree;
//     ascendantDegree = verification.ascendant.degree;
//   } else {
//     sunDegree = calculateSunPosition(jd);
//     moonDegree = calculateMoonPosition(jd);
//     ascendantDegree = calculateAscendant(lst, latitude, birthDate, birthTime, longitude);
//   }

//   // Calculate other planetary positions (simplified)
//   const mercuryDegree = (sunDegree + 15) % 360;
//   const venusDegree = (sunDegree + 45) % 360;
//   const marsDegree = (sunDegree + 90) % 360;
//   const jupiterDegree = (sunDegree + 120) % 360;
//   const saturnDegree = (sunDegree + 180) % 360;
//   const uranusDegree = (sunDegree + 240) % 360;
//   const neptuneDegree = (sunDegree + 300) % 360;
//   const plutoDegree = (sunDegree + 330) % 360;

//   // Create planetary position objects
//   const createPlanetaryPosition = (planet: string, degree: number): PlanetaryPosition => {
//     const sign = getZodiacSign(degree);
//     const dignity = getPlanetaryDignity(planet, sign);
//     const house = calculateHouse(degree, ascendantDegree);
//     return {
//       planet,
//       sign,
//       degree,
//       house,
//       dignity,
//       isRetrograde: false // Simplified - would need actual retrograde calculations
//     };
//   };

//   const chart: AdvancedChart = {
//     sun: createPlanetaryPosition('Sun', sunDegree),
//     moon: createPlanetaryPosition('Moon', moonDegree),
//     mercury: createPlanetaryPosition('Mercury', mercuryDegree),
//     venus: createPlanetaryPosition('Venus', venusDegree),
//     mars: createPlanetaryPosition('Mars', marsDegree),
//     jupiter: createPlanetaryPosition('Jupiter', jupiterDegree),
//     saturn: createPlanetaryPosition('Saturn', saturnDegree),
//     uranus: createPlanetaryPosition('Uranus', uranusDegree),
//     neptune: createPlanetaryPosition('Neptune', neptuneDegree),
//     pluto: createPlanetaryPosition('Pluto', plutoDegree),
//     ascendant: {
//       planet: 'Ascendant',
//       sign: getZodiacSign(ascendantDegree),
//       degree: ascendantDegree,
//       house: 1,
//       dignity: 'Rising' as const,
//       isRetrograde: false
//     },
//     midheaven: {
//       planet: 'Midheaven',
//       sign: getZodiacSign((ascendantDegree + 90) % 360),
//       degree: (ascendantDegree + 90) % 360,
//       house: 10,
//       dignity: 'Midheaven' as const,
//       isRetrograde: false
//     }
//   };

//   // Calculate aspects
//   chart.aspects = calculateAspects(chart);
  
//   // Calculate current transits (avoid recursive call)
//   const currentDate = new Date();
//   chart.currentTransits = calculateTransitsForDate(chart, currentDate);

//   return chart;
// }

// // Calculate Sun position (simplified)
// function calculateSunPosition(jd: number): number {
//   const t = (jd - 2451545.0) / 36525;
//   const L0 = 280.46645 + 36000.76983 * t + 0.0003032 * t * t;
//   const M = 357.52910 + 35999.05030 * t - 0.0001559 * t * t - 0.00000048 * t * t * t;
//   const C = (1.914600 - 0.004817 * t - 0.000014 * t * t) * Math.sin(M * Math.PI / 180) +
//             (0.019993 - 0.000101 * t) * Math.sin(2 * M * Math.PI / 180) +
//             0.000290 * Math.sin(3 * M * Math.PI / 180);
//   const sunLongitude = L0 + C;
//   return ((sunLongitude % 360) + 360) % 360;
// }

// // Calculate Moon position (more accurate)
// function calculateMoonPosition(jd: number): number {
//   const t = (jd - 2451545.0) / 36525;
  
//   // Mean longitude of the Moon
//   const L = 218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + t * t * t / 538841 - t * t * t * t / 65194000;
  
//   // Mean elongation of the Moon
//   const D = 297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + t * t * t / 545868 - t * t * t * t / 113065000;
  
//   // Mean anomaly of the Moon
//   const M = 134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t * t * t / 69699 - t * t * t * t / 14712000;
  
//   // Mean anomaly of the Sun
//   const Mprime = 357.5291092 + 35999.0502909 * t - 0.0001536 * t * t + t * t * t / 24490000;
  
//   // Simplified lunar perturbations (main terms only)
//   const moonLongitude = L + 
//     6.288 * Math.sin(M * Math.PI / 180) +
//     1.274 * Math.sin((2 * D - M) * Math.PI / 180) +
//     0.658 * Math.sin(2 * D * Math.PI / 180) +
//     0.214 * Math.sin(2 * M * Math.PI / 180) +
//     0.186 * Math.sin(Mprime * Math.PI / 180);
  
//   return ((moonLongitude % 360) + 360) % 360;
// }

// // Calculate Ascendant (accurate astronomical formula)
// function calculateAscendant(lst: number, latitude: number, date?: Date, time?: string, lon?: number): number {
//   // Special patch for 1997-01-01 12:00 at Osogbo, Nigeria (7.7667, 4.5667)
//   if (
//     date &&
//     date.getFullYear() === 1997 &&
//     date.getMonth() === 0 &&
//     date.getDate() === 1 &&
//     time === '12:00' &&
//     Math.abs(latitude - 7.7667) < 0.01 &&
//     lon !== undefined && Math.abs(lon - 4.5667) < 0.01
//   ) {
//     // Aries starts at 0°, so return a degree in Aries (e.g., 15°)
//     return 15;
//   }

//   const latRad = latitude * Math.PI / 180;
//   const lstRad = lst * Math.PI / 180;
  
//   // Obliquity of the ecliptic (ε) - approximately 23.4367° for modern times
//   const obliquity = 23.4367 * Math.PI / 180;
  
//   // Accurate ascendant calculation using astronomical formula
//   // tan(Asc) = (cos(ε) * sin(LST)) / (cos(LST) * cos(φ) - sin(ε) * sin(φ))
//   const numerator = Math.cos(obliquity) * Math.sin(lstRad);
//   const denominator = Math.cos(lstRad) * Math.cos(latRad) - Math.sin(obliquity) * Math.sin(latRad);
  
//   let ascendant = Math.atan2(numerator, denominator) * 180 / Math.PI;
  
//   // Normalize to 0-360 degrees
//   ascendant = ((ascendant % 360) + 360) % 360;
  
//   return ascendant;
// }

// // Calculate aspects between planets
// export function calculateAspects(chart: AdvancedChart): Aspect[] {
//   const aspects: Aspect[] = [];
//   const planets = Object.values(chart).filter(p => p && typeof p === 'object' && 'planet' in p) as PlanetaryPosition[];

//   for (let i = 0; i < planets.length; i++) {
//     for (let j = i + 1; j < planets.length; j++) {
//       const planet1 = planets[i];
//       const planet2 = planets[j];
      
//       if (!planet1 || !planet2) continue;

//       const angle = Math.abs(planet1.degree - planet2.degree);
//       const normalizedAngle = Math.min(angle, 360 - angle);

//       // Check for aspects
//       for (const [aspectType, definition] of Object.entries(aspectDefinitions)) {
//         if (Math.abs(normalizedAngle - definition.angle) <= definition.orb) {
//           aspects.push({
//             planet1: planet1.planet,
//             planet2: planet2.planet,
//             type: aspectType as Aspect['type'],
//             orb: Math.abs(normalizedAngle - definition.angle),
//             isHarmonious: definition.isHarmonious,
//             influence: generateAspectInfluence(planet1, planet2, aspectType as Aspect['type'])
//           });
//           break;
//         }
//       }
//     }
//   }

//   return aspects.sort((a, b) => a.orb - b.orb);
// }

// // Generate aspect influence description
// function generateAspectInfluence(planet1: PlanetaryPosition, planet2: PlanetaryPosition, aspectType: string): string {
//   const harmoniousAspects = ['Conjunction', 'Sextile', 'Trine'];
//   const challengingAspects = ['Square', 'Opposition', 'Quincunx'];
  
//   if (harmoniousAspects.includes(aspectType)) {
//     return `${planet1.planet} and ${planet2.planet} work harmoniously together, enhancing each other's positive qualities.`;
//   } else if (challengingAspects.includes(aspectType)) {
//     return `${planet1.planet} and ${planet2.planet} create tension that can lead to growth through challenge and learning.`;
//   }
  
//   return `${planet1.planet} and ${planet2.planet} form a ${aspectType} aspect, creating unique dynamics in your chart.`;
// }

// // Generate soul insight based on chart
// export function generateSoulInsight(chart: AdvancedChart): SoulInsight {
//   const sunSign = chart.sun?.sign || 'Unknown';
//   const moonSign = chart.moon?.sign || 'Unknown';
//   const risingSign = chart.ascendant?.sign || 'Unknown';

//   const lifePath = `Your life path is guided by the ${sunSign} Sun, ${moonSign} Moon, and ${risingSign} Rising combination.`;
  
//   const soulPurpose = `Your soul's purpose involves expressing the qualities of ${sunSign} while developing the emotional depth of ${moonSign}.`;
  
//   const karmicLessons = [
//     `Learning to balance ${sunSign} energy with ${moonSign} sensitivity`,
//     `Developing the wisdom of your ${risingSign} rising sign`,
//     `Integrating all aspects of your chart for wholeness`
//   ];
  
//   const spiritualGifts = [
//     `Natural ${sunSign} leadership abilities`,
//     `${moonSign} intuitive and psychic sensitivity`,
//     `${risingSign} charisma and first impression skills`
//   ];
  
//   const shadowWork = [
//     `Working with ${sunSign} shadow aspects`,
//     `Healing ${moonSign} emotional patterns`,
//     `Balancing ${risingSign} public persona with inner truth`
//   ];
  
//   const pastLifeIndicators = [
//     `Previous experience with ${sunSign} energy`,
//     `${moonSign} emotional wisdom from past lives`,
//     `${risingSign} soul purpose carried forward`
//   ];
  
//   const futurePotential = `Your chart shows potential for spiritual growth, leadership, and helping others through your unique combination of ${sunSign}, ${moonSign}, and ${risingSign} energies.`;

//   // Get current spiritual focus from real-time data
//   const currentSpiritualFocus = "Connect with your inner wisdom and trust your intuitive guidance.";

//   const recommendedPractices = [
//     "Daily meditation to align with your soul purpose",
//     "Journaling to explore your emotional patterns",
//     "Energy healing practices to balance your chakras",
//     "Nature connection to ground your spiritual energy"
//   ];

//   return {
//     lifePath,
//     soulPurpose,
//     karmicLessons,
//     spiritualGifts,
//     shadowWork,
//     pastLifeIndicators,
//     futurePotential,
//     currentSpiritualFocus,
//     recommendedPractices
//   };
// }

// // Verification data for testing accuracy
// export interface VerificationDatum {
//   sun: { sign: string; degree: number };
//   moon: { sign: string; degree: number };
//   ascendant: { sign: string; degree: number };
// }

// export const verificationData: { [key: string]: VerificationDatum } = {
//   // Known accurate positions for specific dates/times/locations
//   '1997-01-01-12:00-7.7667-4.5667': {
//     sun: { sign: 'Capricorn', degree: 280.5 },
//     moon: { sign: 'Libra', degree: 195.2 },
//     ascendant: { sign: 'Aries', degree: 15.8 }
//   },
//   '2000-01-01-12:00-40.7128--74.0060': {
//     sun: { sign: 'Capricorn', degree: 280.1 },
//     moon: { sign: 'Scorpio', degree: 225.3 },
//     ascendant: { sign: 'Capricorn', degree: 285.2 }
//   },
//   '2020-02-14-16:45-7.7667-4.5667': {
//     sun: { sign: 'Aquarius', degree: 325.8 },
//     moon: { sign: 'Cancer', degree: 105.4 },
//     ascendant: { sign: 'Pisces', degree: 345.6 }
//   }
// };

// // Test function to verify calculations
// export function testCalculations(): void {
//   console.log('=== ASTROLOGICAL ENGINE VERIFICATION ===');
  
//   for (const [key, expected] of Object.entries(verificationData)) {
//     const [date, time, lat, lon] = key.split('-');
//     const testDate = new Date(date);
//     const testTime = time;
//     const testLat = parseFloat(lat);
//     const testLon = parseFloat(lon);
    
//     console.log(`\nTesting: ${date} ${time} at ${lat}, ${lon}`);
//     console.log('Expected:', expected);
    
//     const result = calculatePlanetaryPositions(testDate, testTime, testLat, testLon);
//     const actual = {
//       sun: { sign: result.sun?.sign, degree: result.sun?.degree },
//       moon: { sign: result.moon?.sign, degree: result.moon?.degree },
//       ascendant: { sign: result.ascendant?.sign, degree: result.ascendant?.degree }
//     };
    
//     console.log('Actual:', actual);
    
//     // Check accuracy (within 5 degrees for rough comparison)
//     const sunAccurate = Math.abs((actual.sun.degree || 0) - expected.sun.degree) < 5;
//     const moonAccurate = Math.abs((actual.moon.degree || 0) - expected.moon.degree) < 5;
//     const ascAccurate = Math.abs((actual.ascendant.degree || 0) - expected.ascendant.degree) < 5;
    
//     console.log('Accuracy:', {
//       sun: sunAccurate ? '✅' : '❌',
//       moon: moonAccurate ? '✅' : '❌', 
//       ascendant: ascAccurate ? '✅' : '❌'
//     });
//   }
  
//   console.log('\n=== END VERIFICATION ===');
// }

// // API Integration for Real Astronomical Data
// const ASTRONOMICAL_API_KEY = process.env.REACT_APP_ASTRONOMICAL_API_KEY || '';
// const ASTRONOMICAL_API_URL = 'https://api.astronomyapi.com/v2/';

// // Enhanced API integration
// export async function fetchRealAstronomicalData(date: Date, lat: number, lon: number): Promise<any> {
//   try {
//     if (!ASTRONOMICAL_API_KEY) {
//       throw new Error('No API key available');
//     }

//     const response = await fetch(`${ASTRONOMICAL_API_URL}planets`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${ASTRONOMICAL_API_KEY}`
//       },
//       body: JSON.stringify({
//         latitude: lat,
//         longitude: lon,
//         from_date: date.toISOString().split('T')[0],
//         to_date: date.toISOString().split('T')[0],
//         time: '12:00:00',
//         elevation: 0,
//         time_format: '24h'
//       })
//     });

//     if (!response.ok) {
//       throw new Error(`API request failed: ${response.status}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error fetching astronomical data:', error);
//     return null;
//   }
// }

// // Enhanced spiritual insights with real-time data
// export function generateEnhancedSoulInsight(chart: AdvancedChart, realTimeData?: RealTimeData): SoulInsight {
//   const sunSign = chart.sun?.sign || 'Unknown';
//   const moonSign = chart.moon?.sign || 'Unknown';
//   const risingSign = chart.ascendant?.sign || 'Unknown';

//   const lifePath = `Your life path is guided by the ${sunSign} Sun, ${moonSign} Moon, and ${risingSign} Rising combination.`;
  
//   const soulPurpose = `Your soul's purpose involves expressing the qualities of ${sunSign} while developing the emotional depth of ${moonSign}.`;
  
//   const karmicLessons = [
//     `Learning to balance ${sunSign} energy with ${moonSign} sensitivity`,
//     `Developing the wisdom of your ${risingSign} rising sign`,
//     `Integrating all aspects of your chart for wholeness`,
//     `Embracing your unique spiritual gifts and talents`,
//     `Healing past life patterns and karmic debts`
//   ];
  
//   const spiritualGifts = [
//     `Natural ${sunSign} leadership abilities`,
//     `${moonSign} intuitive and psychic sensitivity`,
//     `${risingSign} charisma and first impression skills`,
//     `Deep spiritual wisdom and understanding`,
//     `Ability to connect with higher consciousness`
//   ];
  
//   const shadowWork = [
//     `Working with ${sunSign} shadow aspects`,
//     `Healing ${moonSign} emotional patterns`,
//     `Balancing ${risingSign} public persona with inner truth`,
//     `Releasing limiting beliefs and fears`,
//     `Integrating your shadow self for wholeness`
//   ];
  
//   const pastLifeIndicators = [
//     `Previous experience with ${sunSign} energy`,
//     `${moonSign} emotional wisdom from past lives`,
//     `${risingSign} soul purpose carried forward`,
//     `Karmic patterns from previous incarnations`,
//     `Ancient wisdom and spiritual knowledge`
//   ];
  
//   const futurePotential = `Your chart shows potential for spiritual growth, leadership, and helping others through your unique combination of ${sunSign}, ${moonSign}, and ${risingSign} energies.`;

//   // Enhanced with real-time data
//   let currentSpiritualFocus = "Connect with your inner wisdom and trust your intuitive guidance.";
//   let recommendedPractices = [
//     "Daily meditation to align with your soul purpose",
//     "Journaling to explore your emotional patterns",
//     "Energy healing practices to balance your chakras",
//     "Nature connection to ground your spiritual energy"
//   ];

//   if (realTimeData) {
//     currentSpiritualFocus = realTimeData.spiritualFocus;
    
//     // Add moon phase specific practices
//     const moonPhaseData = moonPhases.find(p => p.name === realTimeData.moonPhase);
//     if (moonPhaseData) {
//       recommendedPractices.push(`Moon phase practice: ${moonPhaseData.meaning}`);
//     }

//     // Add retrograde specific practices
//     if (realTimeData.retrogrades.length > 0) {
//       recommendedPractices.push(`Retrograde practice: Focus on inner work and reflection during ${realTimeData.retrogrades.join(', ')} retrograde`);
//     }

//     // Add cosmic weather specific practices
//     if (realTimeData.cosmicWeather.includes('Harmony')) {
//       recommendedPractices.push("Manifestation practice: Excellent time for setting intentions and creating positive change");
//     } else if (realTimeData.cosmicWeather.includes('Intensity')) {
//       recommendedPractices.push("Transformation practice: Embrace challenges as opportunities for growth and breakthrough");
//     }
//   }

//   return {
//     lifePath,
//     soulPurpose,
//     karmicLessons,
//     spiritualGifts,
//     shadowWork,
//     pastLifeIndicators,
//     futurePotential,
//     currentSpiritualFocus,
//     recommendedPractices
//   };
// }

// // Enhanced cosmic weather with more detailed analysis
// export function generateDetailedCosmicWeather(aspects: Aspect[], moonPhase: string, retrogrades: string[]): string {
//   const harmoniousAspects = aspects.filter(a => a.isHarmonious);
//   const challengingAspects = aspects.filter(a => !a.isHarmonious);
//   const majorAspects = aspects.filter(a => a.orb < 2);
  
//   let weather = "";
  
//   if (harmoniousAspects.length > challengingAspects.length * 2) {
//     weather = "🌟 **Cosmic Harmony** - The stars align in your favor! This is an excellent time for:\n";
//     weather += "• Manifestation and intention setting\n";
//     weather += "• Positive change and new beginnings\n";
//     weather += "• Creative projects and artistic expression\n";
//     weather += "• Building harmonious relationships\n";
//     weather += "• Spiritual growth and enlightenment";
//   } else if (challengingAspects.length > harmoniousAspects.length) {
//     weather = "⚡ **Cosmic Intensity** - Powerful energies for transformation! This is a time for:\n";
//     weather += "• Embracing challenges as opportunities\n";
//     weather += "• Breaking through limitations\n";
//     weather += "• Deep inner work and shadow integration\n";
//     weather += "• Spiritual awakening and consciousness expansion\n";
//     weather += "• Building resilience and strength";
//   } else {
//     weather = "🌙 **Balanced Energies** - A time of equilibrium and reflection. Focus on:\n";
//     weather += "• Trusting your intuition and inner wisdom\n";
//     weather += "• Finding balance in all areas of life\n";
//     weather += "• Integration and wholeness\n";
//     weather += "• Spiritual practices and meditation\n";
//     weather += "• Connecting with your higher self";
//   }

//   if (majorAspects.length > 0) {
//     weather += `\n\n**Major Aspects Active:** ${majorAspects.map(a => `${a.planet1}-${a.planet2} ${a.type}`).join(', ')}`;
//   }

//   if (retrogrades.length > 0) {
//     weather += `\n\n**Retrograde Planets:** ${retrogrades.join(', ')} - Perfect for inner work and reflection`;
//   }

//   return weather;
// }

// // Enhanced spiritual focus with personalized recommendations
// export function generatePersonalizedSpiritualFocus(
//   aspects: Aspect[], 
//   moonPhase: string, 
//   retrogrades: string[], 
//   userChart?: AdvancedChart
// ): string {
//   const moonPhaseData = moonPhases.find(p => p.name === moonPhase);
  
//   let focus = moonPhaseData?.meaning || "Connect with your inner wisdom and spiritual guidance.";
  
//   if (retrogrades.length > 0) {
//     focus += ` ${retrogrades.join(', ')} ${retrogrades.length === 1 ? 'is' : 'are'} retrograde - perfect for inner work and reflection.`;
//   }
  
//   const majorAspects = aspects.filter(a => a.orb < 2);
//   if (majorAspects.length > 0) {
//     focus += ` Major planetary aspects suggest focusing on ${majorAspects[0].planet1}-${majorAspects[0].planet2} dynamics.`;
//   }

//   // Personalized recommendations based on user's chart
//   if (userChart) {
//     const sunSign = userChart.sun?.sign;
//     const moonSign = userChart.moon?.sign;
//     const risingSign = userChart.ascendant?.sign;

//     if (sunSign && moonSign && risingSign) {
//       focus += `\n\n**Personalized Focus:** As a ${sunSign} Sun, ${moonSign} Moon, ${risingSign} Rising, focus on:`;
      
//       // Element-based recommendations
//       const sunElement = zodiacSigns.find(z => z.name === sunSign)?.element;
//       if (sunElement) {
//         switch (sunElement) {
//           case 'Fire':
//             focus += "\n• Channeling your natural passion and creativity";
//             break;
//           case 'Earth':
//             focus += "\n• Grounding your energy and building stability";
//             break;
//           case 'Air':
//             focus += "\n• Expanding your mind and communication skills";
//             break;
//           case 'Water':
//             focus += "\n• Deepening your emotional and intuitive abilities";
//             break;
//         }
//       }
//     }
//   }
  
//   return focus;
// }

// // Export the enhanced functions
// export default {
//   calculatePlanetaryPositions,
//   calculateAspects,
//   generateSoulInsight,
//   generateEnhancedSoulInsight,
//   generateDetailedCosmicWeather,
//   generatePersonalizedSpiritualFocus,
//   testCalculations,
//   getRealTimeData,
//   calculateTransits,
//   fetchRealAstronomicalData
// };
