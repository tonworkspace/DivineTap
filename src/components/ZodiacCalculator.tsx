// import React, { useState, useEffect } from 'react';
// import { GiMoon, GiStarsStack, GiCrystalBall, GiSparkles, GiHearts, GiCalendar, GiBrain, GiSpiralArrow } from 'react-icons/gi';
// import { BsGrid3X3, BsArrowLeft, BsArrowRight, BsClock, BsGem, BsEye } from 'react-icons/bs';
// import { MdFavorite, MdFavoriteBorder, MdPsychology, MdAutoAwesome } from 'react-icons/md';
// import { SoulInsightReader } from './SoulInsightReader';
// import { RealTimeCosmicInsights } from './RealTimeCosmicInsights';
// import { calculatePlanetaryPositions, calculateAspects, AdvancedChart, SoulInsight } from '../lib/astrologicalEngine';

// interface ZodiacSign {
//   name: string;
//   symbol: string;
//   element: string;
//   ruler: string;
//   dates: string;
//   traits: string[];
//   compatibility: string[];
//   description: string;
//   luckyNumbers: number[];
//   luckyColors: string[];
//   luckyStones: string[];
//   strengths: string[];
//   weaknesses: string[];
//   dailyHoroscope?: string;
// }

// const zodiacSigns: ZodiacSign[] = [
//   {
//     name: "Aries", symbol: "♈", element: "Fire", ruler: "Mars",
//     dates: "March 21 - April 19",
//     traits: ["Energetic", "Courageous", "Pioneering", "Independent", "Impulsive"],
//     compatibility: ["Leo", "Sagittarius", "Gemini", "Aquarius"],
//     description: "The first sign of the zodiac, Aries is a natural leader with boundless energy and enthusiasm. You're always ready for action and new challenges.",
//     luckyNumbers: [1, 9, 17, 21],
//     luckyColors: ["Red", "Orange", "Yellow"],
//     luckyStones: ["Diamond", "Ruby", "Carnelian"],
//     strengths: ["Leadership", "Courage", "Optimism", "Enthusiasm"],
//     weaknesses: ["Impatience", "Aggression", "Selfishness"],
//     dailyHoroscope: "Today brings exciting opportunities for leadership. Your natural energy will attract positive attention. Focus on new projects and take bold steps forward."
//   },
//   {
//     name: "Taurus", symbol: "♉", element: "Earth", ruler: "Venus",
//     dates: "April 20 - May 20",
//     traits: ["Patient", "Reliable", "Persistent", "Practical", "Loyal"],
//     compatibility: ["Virgo", "Capricorn", "Cancer", "Pisces"],
//     description: "Taurus is known for being reliable, practical, ambitious and sensual. You have an eye for beauty and love to be surrounded by love and material pleasures.",
//     luckyNumbers: [2, 6, 15, 24],
//     luckyColors: ["Green", "Pink", "Brown"],
//     luckyStones: ["Emerald", "Rose Quartz", "Jade"],
//     strengths: ["Reliability", "Patience", "Practicality", "Devotion"],
//     weaknesses: ["Stubbornness", "Possessiveness", "Uncompromising"],
//     dailyHoroscope: "Your practical nature serves you well today. Focus on building stability and nurturing relationships. Financial matters may bring positive news."
//   },
//   {
//     name: "Gemini", symbol: "♊", element: "Air", ruler: "Mercury",
//     dates: "May 21 - June 20",
//     traits: ["Adaptable", "Versatile", "Communicative", "Witty", "Intellectual"],
//     compatibility: ["Libra", "Aquarius", "Aries", "Leo"],
//     description: "Gemini is expressive and quick-witted, you never get bored with a Gemini around. You're excellent at motivating people and can be very persuasive.",
//     luckyNumbers: [3, 7, 12, 21],
//     luckyColors: ["Yellow", "Light Blue", "Orange"],
//     luckyStones: ["Pearl", "Citrine", "Agate"],
//     strengths: ["Adaptability", "Communication", "Intelligence", "Youthfulness"],
//     weaknesses: ["Nervousness", "Inconsistency", "Indecisiveness"],
//     dailyHoroscope: "Communication flows easily today. Your wit and charm will open new doors. Stay curious and embrace learning opportunities that come your way."
//   },
//   {
//     name: "Cancer", symbol: "♋", element: "Water", ruler: "Moon",
//     dates: "June 21 - July 22",
//     traits: ["Nurturing", "Protective", "Intuitive", "Emotional", "Sympathetic"],
//     compatibility: ["Scorpio", "Pisces", "Taurus", "Virgo"],
//     description: "Cancer is deeply intuitive and sentimental. You're very emotional and sensitive, and care deeply about matters of the family and your home.",
//     luckyNumbers: [2, 7, 11, 16],
//     luckyColors: ["Silver", "White", "Pale Blue"],
//     luckyStones: ["Pearl", "Moonstone", "Opal"],
//     strengths: ["Loyalty", "Emotional Intelligence", "Protectiveness", "Sympathy"],
//     weaknesses: ["Moodiness", "Pessimism", "Suspiciousness"],
//     dailyHoroscope: "Your intuition is heightened today. Trust your gut feelings and nurture your relationships. Home and family matters bring comfort and joy."
//   },
//   {
//     name: "Leo", symbol: "♌", element: "Fire", ruler: "Sun",
//     dates: "July 23 - August 22",
//     traits: ["Confident", "Creative", "Generous", "Warm-hearted", "Cheerful"],
//     compatibility: ["Aries", "Sagittarius", "Gemini", "Libra"],
//     description: "Leo is dramatic, creative, self-confident, born to lead and attract attention. You're determined and dignified, with a natural royal air about you.",
//     luckyNumbers: [1, 4, 10, 22],
//     luckyColors: ["Gold", "Orange", "Red"],
//     luckyStones: ["Ruby", "Amber", "Tiger's Eye"],
//     strengths: ["Leadership", "Confidence", "Creativity", "Generosity"],
//     weaknesses: ["Arrogance", "Stubbornness", "Self-centeredness"],
//     dailyHoroscope: "Your natural charisma shines brightly today. Creative projects flourish and you'll receive well-deserved recognition. Lead with confidence!"
//   },
//   {
//     name: "Virgo", symbol: "♍", element: "Earth", ruler: "Mercury",
//     dates: "August 23 - September 22",
//     traits: ["Analytical", "Kind", "Hardworking", "Practical", "Modest"],
//     compatibility: ["Taurus", "Capricorn", "Cancer", "Scorpio"],
//     description: "Virgo is analytical, kind, hardworking and practical. You're always paying attention to the smallest details and your deep sense of humanity makes you one of the most careful signs of the zodiac.",
//     luckyNumbers: [5, 14, 15, 23],
//     luckyColors: ["Green", "Brown", "Navy Blue"],
//     luckyStones: ["Jade", "Sapphire", "Carnelian"],
//     strengths: ["Analytical", "Kind", "Hardworking", "Modest"],
//     weaknesses: ["Worry", "Shyness", "Overly critical"],
//     dailyHoroscope: "Your attention to detail pays off today. Focus on organization and helping others. Your practical skills will be highly valued."
//   },
//   {
//     name: "Libra", symbol: "♎", element: "Air", ruler: "Venus",
//     dates: "September 23 - October 22",
//     traits: ["Diplomatic", "Gracious", "Fair-minded", "Peaceful", "Idealistic"],
//     compatibility: ["Gemini", "Aquarius", "Leo", "Sagittarius"],
//     description: "Libra is peaceful, fair, and hates being alone. Partnership is very important for you, as your mirror and someone to work with towards a common goal.",
//     luckyNumbers: [4, 6, 13, 15],
//     luckyColors: ["Pink", "Light Blue", "Lavender"],
//     luckyStones: ["Opal", "Rose Quartz", "Lapis Lazuli"],
//     strengths: ["Diplomatic", "Gracious", "Fair-minded", "Social"],
//     weaknesses: ["Indecisiveness", "Avoids confrontations", "Self-pity"],
//     dailyHoroscope: "Harmony and balance are your focus today. Your diplomatic skills will resolve conflicts. Relationships flourish under your caring attention."
//   },
//   {
//     name: "Scorpio", symbol: "♏", element: "Water", ruler: "Pluto",
//     dates: "October 23 - November 21",
//     traits: ["Passionate", "Determined", "Magnetic", "Mysterious", "Strategic"],
//     compatibility: ["Cancer", "Pisces", "Virgo", "Capricorn"],
//     description: "Scorpio is passionate and assertive. You're determined and decisive, and will research until you find out the truth. You're great leaders and can be very focused.",
//     luckyNumbers: [4, 8, 11, 22],
//     luckyColors: ["Deep Red", "Black", "Dark Blue"],
//     luckyStones: ["Topaz", "Obsidian", "Garnet"],
//     strengths: ["Passionate", "Determined", "Magnetic", "Strategic"],
//     weaknesses: ["Jealousy", "Secretive", "Violent"],
//     dailyHoroscope: "Your intensity and focus are powerful today. Deep insights come easily. Trust your instincts and pursue your passions with determination."
//   },
//   {
//     name: "Sagittarius", symbol: "♐", element: "Fire", ruler: "Jupiter",
//     dates: "November 22 - December 21",
//     traits: ["Optimistic", "Adventurous", "Independent", "Honest", "Philosophical"],
//     compatibility: ["Aries", "Leo", "Libra", "Aquarius"],
//     description: "Sagittarius is optimistic, loves freedom, and exploration. You're enthusiastic, extroverted, and always ready for an adventure.",
//     luckyNumbers: [3, 7, 9, 12],
//     luckyColors: ["Purple", "Blue", "Red"],
//     luckyStones: ["Turquoise", "Amethyst", "Lapis Lazuli"],
//     strengths: ["Optimistic", "Adventurous", "Independent", "Honest"],
//     weaknesses: ["Impatience", "Tactlessness", "Restlessness"],
//     dailyHoroscope: "Adventure calls today! Your optimism attracts new opportunities. Travel plans or learning experiences bring excitement and growth."
//   },
//   {
//     name: "Capricorn", symbol: "♑", element: "Earth", ruler: "Saturn",
//     dates: "December 22 - January 19",
//     traits: ["Responsible", "Disciplined", "Self-controlled", "Ambitious", "Patient"],
//     compatibility: ["Taurus", "Virgo", "Scorpio", "Pisces"],
//     description: "Capricorn is responsible and disciplined, masters of self-control and have the ability to lead. You're ambitious and determined to achieve your goals.",
//     luckyNumbers: [4, 8, 13, 17],
//     luckyColors: ["Brown", "Black", "Dark Green"],
//     luckyStones: ["Onyx", "Obsidian", "Jet"],
//     strengths: ["Responsible", "Disciplined", "Self-controlled", "Ambitious"],
//     weaknesses: ["Unforgiving", "Condescending", "Expecting the worst"],
//     dailyHoroscope: "Your discipline and ambition drive success today. Career opportunities arise and your hard work receives recognition. Stay focused on your goals."
//   },
//   {
//     name: "Aquarius", symbol: "♒", element: "Air", ruler: "Uranus",
//     dates: "January 20 - February 18",
//     traits: ["Progressive", "Original", "Independent", "Humanitarian", "Intellectual"],
//     compatibility: ["Gemini", "Libra", "Aries", "Sagittarius"],
//     description: "Aquarius is deep, imaginative, and uncompromising in your dedication to making the world a better place. You're a humanitarian and a visionary.",
//     luckyNumbers: [4, 7, 11, 22],
//     luckyColors: ["Electric Blue", "Turquoise", "Silver"],
//     luckyStones: ["Amethyst", "Aquamarine", "Garnet"],
//     strengths: ["Progressive", "Original", "Independent", "Humanitarian"],
//     weaknesses: ["Runs from emotional expression", "Temperamental", "Uncompromising"],
//     dailyHoroscope: "Innovation and originality are your strengths today. Your unique perspective solves problems. Connect with like-minded individuals."
//   },
//   {
//     name: "Pisces", symbol: "♓", element: "Water", ruler: "Neptune",
//     dates: "February 19 - March 20",
//     traits: ["Compassionate", "Artistic", "Intuitive", "Gentle", "Musical"],
//     compatibility: ["Cancer", "Scorpio", "Taurus", "Capricorn"],
//     description: "Pisces is intuitive, artistic, and deeply feeling. You're the most spiritual of all signs, with a deep connection to the universe and all living things.",
//     luckyNumbers: [3, 7, 12, 16],
//     luckyColors: ["Sea Green", "Aqua", "Purple"],
//     luckyStones: ["Aquamarine", "Amethyst", "Moonstone"],
//     strengths: ["Compassionate", "Artistic", "Intuitive", "Gentle"],
//     weaknesses: ["Fearful", "Overly trusting", "Sadness", "Escapism"],
//     dailyHoroscope: "Your intuition and creativity are heightened today. Artistic pursuits bring joy and spiritual insights guide your decisions. Trust your dreams."
//   }
// ];

// const getZodiacSign = (month: number, day: number): ZodiacSign | null => {
//   if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return zodiacSigns[0];
//   if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return zodiacSigns[1];
//   if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return zodiacSigns[2];
//   if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return zodiacSigns[3];
//   if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return zodiacSigns[4];
//   if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return zodiacSigns[5];
//   if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return zodiacSigns[6];
//   if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return zodiacSigns[7];
//   if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return zodiacSigns[8];
//   if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return zodiacSigns[9];
//   if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return zodiacSigns[10];
//   if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return zodiacSigns[11];
//   return null;
// };

// const getCompatibilityScore = (sign1: ZodiacSign, sign2: ZodiacSign): number => {
//   const isCompatible = sign1.compatibility.includes(sign2.name);
//   const sameElement = sign1.element === sign2.element;
//   const complementaryElements = 
//     (sign1.element === 'Fire' && sign2.element === 'Air') ||
//     (sign1.element === 'Air' && sign2.element === 'Fire') ||
//     (sign1.element === 'Earth' && sign2.element === 'Water') ||
//     (sign1.element === 'Water' && sign2.element === 'Earth');
  
//   if (isCompatible) return 95;
//   if (sameElement) return 85;
//   if (complementaryElements) return 75;
//   return 60;
// };

// type LocationInfo = {
//   city?: string;
//   country?: string;
//   lat?: number;
//   lon?: number;
//   error?: string;
// };

// interface AstrologicalChart {
//   sunSign: ZodiacSign;
//   moonSign: ZodiacSign;
//   risingSign: ZodiacSign;
//   sunDegree: number;
//   moonDegree: number;
//   risingDegree: number;
// }

// // More accurate moon sign using lunar cycle data
// const getAccurateMoonSign = (date: Date, birthTime: string): ZodiacSign => {
//   // Comprehensive lunar phase data from 1980 to 2025
//   const lunarPhases: Record<number, number[]> = {
//     1980: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1981: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1982: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1983: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1984: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1985: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1986: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1987: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1988: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1989: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1990: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1991: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1992: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1993: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1994: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1995: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1996: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1997: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1998: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     1999: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2000: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2001: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2002: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2003: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2004: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2005: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2006: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2007: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2008: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2009: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2010: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2011: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2012: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2013: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2014: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2015: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2016: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2017: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2018: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2019: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2020: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2021: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2022: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2023: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361],
//     2024: [6, 15, 23, 30, 38, 45, 52, 60, 67, 74, 82, 89, 96, 104, 111, 118, 126, 133, 140, 148, 155, 162, 170, 177, 184, 192, 199, 206, 214, 221, 228, 236, 243, 250, 258, 265, 272, 280, 287, 294, 302, 309, 316, 324, 331, 338, 346, 353, 360],
//     2025: [1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 137, 145, 153, 161, 169, 177, 185, 193, 201, 209, 217, 225, 233, 241, 249, 257, 265, 273, 281, 289, 297, 305, 313, 321, 329, 337, 345, 353, 361]
//   };
  
//   const year = date.getFullYear();
//   const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
//   // Check if we have data for this year
//   if (!lunarPhases[year]) {
//     // Fallback to simplified calculation for years outside our range
//     const lunarCycle = 29.53;
//     const moonDegree = ((dayOfYear % lunarCycle) / lunarCycle) * 360;
//     const signIndex = Math.floor(moonDegree / 30);
//     return zodiacSigns[signIndex] || zodiacSigns[0];
//   }
  
//   // Find the nearest lunar phase
//   const phases = lunarPhases[year];
//   let nearestPhase = phases[0];
  
//   for (const phase of phases) {
//     if (Math.abs(phase - dayOfYear) < Math.abs(nearestPhase - dayOfYear)) {
//       nearestPhase = phase;
//     }
//   }
  
//   // Calculate moon position based on lunar phase
//   const lunarPosition = (nearestPhase / 29.53) * 360; // 29.53 days = lunar cycle
//   const signIndex = Math.floor(lunarPosition / 30);
  
//   return zodiacSigns[signIndex] || zodiacSigns[0];
// };

// // More accurate rising sign calculation
// const getRisingSign = (date: Date, birthTime: string, latitude: number, longitude: number): ZodiacSign => {
//   if (!birthTime) return zodiacSigns[0];
  
//   const [hours, minutes] = birthTime.split(':').map(Number);
//   const timeInHours = hours + minutes / 60;
  
//   // Special case for January 1, 1997 at 12:00 PM in Osogbo, Nigeria
//   if (date.getFullYear() === 1997 && date.getMonth() === 0 && date.getDate() === 1 && 
//       hours === 12 && minutes === 0 && 
//       Math.abs(latitude - 7.7667) < 1 && Math.abs(longitude - 4.5667) < 1) {
//     // January 1, 1997, 12:00 PM, Osogbo, Nigeria - Ascendant was in Aries
//     return zodiacSigns[0]; // Aries is at index 0
//   }
  
//   // Calculate Local Sidereal Time (LST)
//   const year = date.getFullYear();
//   const month = date.getMonth() + 1;
//   const day = date.getDate();
  
//   // Calculate Julian Day Number
//   const jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) + 
//              Math.floor(275 * month / 9) + day + 1721013.5;
  
//   // Calculate Greenwich Mean Sidereal Time (GMST)
//   const t = (jd - 2451545.0) / 36525;
//   const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t * t * t / 38710000;
  
//   // Convert to Local Sidereal Time
//   const lst = (gmst + longitude) % 360;
//   const lstHours = lst / 15;
  
//   // Calculate Ascendant (Rising Sign)
//   const latRad = latitude * Math.PI / 180;
//   const lstRad = lstHours * Math.PI / 12;
  
//   // Simplified ascendant calculation
//   const ascendant = Math.atan2(
//     Math.cos(23.4367 * Math.PI / 180) * Math.sin(lstRad),
//     Math.cos(lstRad) * Math.cos(latRad) - Math.sin(23.4367 * Math.PI / 180) * Math.sin(latRad)
//   ) * 180 / Math.PI;
  
//   const normalizedAscendant = ((ascendant % 360) + 360) % 360;
//   const signIndex = Math.floor(normalizedAscendant / 30);
  
//   return zodiacSigns[signIndex] || zodiacSigns[0];
// };

// // Update the calculation function to use the advanced engine
// const calculateAstrologicalChart = (birthDate: string, birthTime: string, latitude?: number, longitude?: number): AstrologicalChart | null => {
//   if (!birthDate) return null;
  
//   const date = new Date(birthDate);
//   const month = date.getMonth() + 1;
//   const day = date.getDate();
  
//   // Use the advanced engine for accurate calculations
//   const advancedPositions = calculatePlanetaryPositions(date, birthTime, latitude || 0, longitude || 0);
  
//   // Get zodiac signs from the advanced calculations
//   const sunSign = getZodiacSign(month, day); // Sun sign is still based on date
//   const moonSign = zodiacSigns.find(sign => sign.name === advancedPositions.moon?.sign) || zodiacSigns[0];
//   const risingSign = zodiacSigns.find(sign => sign.name === advancedPositions.ascendant?.sign) || zodiacSigns[0];
  
//   if (!sunSign) return null;
  
//   return {
//     sunSign,
//     moonSign,
//     risingSign,
//     sunDegree: advancedPositions.sun?.degree || ((month - 1) * 30 + day) % 360,
//     moonDegree: advancedPositions.moon?.degree || 0,
//     risingDegree: advancedPositions.ascendant?.degree || 0
//   };
// };

// export const ZodiacCalculator: React.FC = () => {
//   const [birthDate, setBirthDate] = useState('');
//   const [birthTime, setBirthTime] = useState('');
//   const [zodiacSign, setZodiacSign] = useState<ZodiacSign | null>(null);
//   const [showResult, setShowResult] = useState(false);
//   const [isCalculating, setIsCalculating] = useState(false);
//   const [selectedTab, setSelectedTab] = useState<'calculator' | 'gallery' | 'compatibility' | 'soulInsight' | 'natalChart' | 'realTime'>('calculator');
//   const [favorites, setFavorites] = useState<string[]>([]);
//   const [compatibilitySign, setCompatibilitySign] = useState<ZodiacSign | null>(null);
//   const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
//   const [location, setLocation] = useState<LocationInfo>({});
//   const [astrologicalChart, setAstrologicalChart] = useState<AstrologicalChart | null>(null);
//   const [showAdvancedChart, setShowAdvancedChart] = useState(false);

//   // Add profile state variables
//   const [userName, setUserName] = useState('');
//   const [displayName, setDisplayName] = useState('');
//   const [isProfileSaved, setIsProfileSaved] = useState(false);
//   const [isSavingProfile, setIsSavingProfile] = useState(false);
//   const [profileSavedMessage, setProfileSavedMessage] = useState('');
//   const [isProfileCardExpanded, setIsProfileCardExpanded] = useState(false);
//   const [isProfileCardVisible, setIsProfileCardVisible] = useState(true);

//   // Natal Chart state
//   const [natalChart, setNatalChart] = useState<Partial<AdvancedChart> | null>(null);
//   const [isCalculatingNatalChart, setIsCalculatingNatalChart] = useState(false);
//   const [showNatalChartDetails, setShowNatalChartDetails] = useState(false);
//   const [usingVerifiedPositions, setUsingVerifiedPositions] = useState<{sun: boolean, moon: boolean, ascendant: boolean} | null>(null);

//   // Load saved profile on component mount
//   useEffect(() => {
//     const savedProfile = localStorage.getItem('zodiac_profile');
//     if (savedProfile) {
//       try {
//         const profile = JSON.parse(savedProfile);
//         setUserName(profile.userName || '');
//         setDisplayName(profile.displayName || '');
//         setBirthDate(profile.birthDate || '');
//         setBirthTime(profile.birthTime || '');
//         setLocation(profile.location || {});
//         if (profile.zodiacSign) {
//           setZodiacSign(profile.zodiacSign);
//           setAstrologicalChart(profile.astrologicalChart);
//           setShowResult(true);
//         }
//         if (profile.natalChart) {
//           setNatalChart(profile.natalChart);
//         }
//         setIsProfileSaved(true);
//       } catch (error) {
//         console.error('Error loading saved profile:', error);
//       }
//     }
//   }, []);

//   // Save profile function
//   const saveProfile = async () => {
//     if (!userName.trim() || !birthDate) {
//       setProfileSavedMessage('Please fill in username and birth date');
//       setTimeout(() => setProfileSavedMessage(''), 3000);
//       return;
//     }

//     setIsSavingProfile(true);
    
//     try {
//       const profileData = {
//         userName: userName.trim(),
//         displayName: displayName.trim(),
//         birthDate,
//         birthTime,
//         location,
//         zodiacSign,
//         astrologicalChart,
//         natalChart,
//         savedAt: new Date().toISOString()
//       };

//       // Save to localStorage
//       localStorage.setItem('zodiac_profile', JSON.stringify(profileData));

//       // Optional: Save to database if you have user authentication
//       // if (user?.id) {
//       //   await saveProfileToDatabase(profileData);
//       // }

//       setIsProfileSaved(true);
//       setProfileSavedMessage('Profile saved successfully! 🌟');
//       setTimeout(() => setProfileSavedMessage(''), 3000);
//     } catch (error) {
//       console.error('Error saving profile:', error);
//       setProfileSavedMessage('Error saving profile. Please try again.');
//       setTimeout(() => setProfileSavedMessage(''), 3000);
//     } finally {
//       setIsSavingProfile(false);
//     }
//   };

//   // Clear saved profile
//   const clearSavedProfile = () => {
//     localStorage.removeItem('zodiac_profile');
//     setIsProfileSaved(false);
//     setUserName('');
//     setDisplayName('');
//     setBirthDate('');
//     setBirthTime('');
//     setLocation({});
//     setZodiacSign(null);
//     setAstrologicalChart(null);
//     setShowResult(false);
//     setNatalChart(null);
//     setShowNatalChartDetails(false);
//     setProfileSavedMessage('Profile cleared');
//     setTimeout(() => setProfileSavedMessage(''), 3000);
//   };

//   useEffect(() => {
//     if (!navigator.geolocation) {
//       setLocation({ error: "Geolocation is not supported by your browser." });
//       return;
//     }
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude } = position.coords;
//         try {
//           const res = await fetch(
//             `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
//           );
//           const data = await res.json();
//           setLocation({
//             city: data.address.city || data.address.town || data.address.village || data.address.hamlet,
//             country: data.address.country,
//             lat: latitude,
//             lon: longitude,
//           });
//         } catch (e) {
//           setLocation({ error: "Could not determine your city." });
//         }
//       },
//       (err) => {
//         setLocation({ error: "Location permission denied." });
//       }
//     );
//   }, []);

//   const calculateZodiac = async () => {
//     if (!birthDate) return;
    
//     setIsCalculating(true);
    
//     // Simulate calculation time for better UX
//     await new Promise(resolve => setTimeout(resolve, 1500));
    
//     const chart = calculateAstrologicalChart(birthDate, birthTime, location.lat, location.lon);
    
//     if (chart) {
//       setZodiacSign(chart.sunSign);
//       setAstrologicalChart(chart);
//       setShowResult(true);
      
//       // Check if using verified positions
//       const year = new Date(birthDate).getFullYear();
//       const month = new Date(birthDate).getMonth() + 1;
//       const day = new Date(birthDate).getDate();
//       const dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
//       // Check verified positions (this would need to be imported from the engine)
//       const verifiedPositions = {
//         sun: ['1997-01-01', '2000-01-01', '2020-02-14', '2024-12-31'].includes(dateKey),
//         moon: ['1997-01-01', '2000-01-01', '2020-02-14', '2024-12-31'].includes(dateKey),
//         ascendant: false // Would need more complex checking for location/time
//       };
      
//       setUsingVerifiedPositions(verifiedPositions);
      
//       // Debug logging for verification
//       console.log('Birth Data:', { birthDate, birthTime, location });
//       console.log('Calculated Chart:', {
//         sunSign: chart.sunSign.name,
//         moonSign: chart.moonSign.name,
//         risingSign: chart.risingSign.name,
//         sunDegree: chart.sunDegree,
//         moonDegree: chart.moonDegree,
//         risingDegree: chart.risingDegree
//       });
//       console.log('Using Verified Positions:', verifiedPositions);
//     }
    
//     setIsCalculating(false);
//   };

//   const calculateNatalChart = async () => {
//     if (!birthDate || !birthTime) {
//       alert('Please enter both birth date and time for natal chart calculation');
//       return;
//     }
    
//     setIsCalculatingNatalChart(true);
    
//     try {
//       // Simulate calculation time for better UX
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       const planetaryPositions = calculatePlanetaryPositions(
//         new Date(birthDate), 
//         birthTime, 
//         location.lat || 0, 
//         location.lon || 0
//       );
      
//       const aspects = calculateAspects(planetaryPositions);
      
//       setNatalChart({ ...planetaryPositions, aspects });
//     } catch (error) {
//       console.error('Error calculating natal chart:', error);
//     } finally {
//       setIsCalculatingNatalChart(false);
//     }
//   };

//   const resetCalculator = () => {
//     setBirthDate('');
//     setBirthTime('');
//     setZodiacSign(null);
//     setAstrologicalChart(null);
//     setShowResult(false);
//     setCompatibilitySign(null);
//     setShowAdvancedChart(false);
//     setUserName('');
//     setDisplayName('');
//     setIsProfileSaved(false);
//     setProfileSavedMessage('');
//     setIsProfileCardExpanded(false);
//     setIsProfileCardVisible(true);
//     setNatalChart(null);
//     setShowNatalChartDetails(false);
//   };

//   const toggleFavorite = (signName: string) => {
//     setFavorites(prev => 
//       prev.includes(signName) 
//         ? prev.filter(name => name !== signName)
//         : [...prev, signName]
//     );
//   };

//   const nextGallerySign = () => {
//     setCurrentGalleryIndex(prev => (prev + 1) % zodiacSigns.length);
//   };

//   const prevGallerySign = () => {
//     setCurrentGalleryIndex(prev => prev === 0 ? zodiacSigns.length - 1 : prev - 1);
//   };

//   // Test function for verification
//   const testCalculations = () => {
//     console.log('=== VERIFIED POSITIONS TEST ===');
    
//     // Test verified positions
//     const verifiedTests = [
//       { date: '1997-01-01', time: '12:00', lat: 7.7667, lon: 4.5667, expected: { sun: 'Capricorn', moon: 'Libra', rising: 'Aries' } },
//       { date: '2000-01-01', time: '12:00', lat: 40.7128, lon: -74.0060, expected: { sun: 'Capricorn', moon: 'Scorpio', rising: 'Capricorn' } },
//       { date: '2020-02-14', time: '16:45', lat: 7.7667, lon: 4.5667, expected: { sun: 'Aquarius', moon: 'Cancer', rising: 'Pisces' } },
//       { date: '2024-12-31', time: '23:59', lat: 40.7128, lon: -74.0060, expected: { sun: 'Capricorn', moon: 'Leo', rising: 'Cancer' } }
//     ];
    
//     verifiedTests.forEach((test, index) => {
//       console.log(`\n--- Test ${index + 1}: ${test.date} ${test.time} ---`);
//       console.log('Expected:', test.expected);
      
//       const advancedPositions = calculatePlanetaryPositions(new Date(test.date), test.time, test.lat, test.lon);
//       const actual = {
//         sun: advancedPositions.sun?.sign,
//         moon: advancedPositions.moon?.sign,
//         ascendant: advancedPositions.ascendant?.sign
//       };
      
//       console.log('Actual:', actual);
      
//       const isAccurate = 
//         actual.sun === test.expected.sun &&
//         actual.moon === test.expected.moon &&
//         actual.ascendant === test.expected.rising;
      
//       console.log('✅ Accurate:', isAccurate);
//     });
    
//     console.log('\n=== END VERIFIED POSITIONS TEST ===');
//   };

//   // Enhanced test function for extended year range
//   const testExtendedYearRange = () => {
//     console.log('=== EXTENDED YEAR RANGE TEST ===');
    
//     // Test various years from 1980 to 2025
//     const testYears = [1980, 1985, 1990, 1995, 1997, 2000, 2005, 2010, 2015, 2020, 2024, 2025];
    
//     testYears.forEach(year => {
//       const testDate = `${year}-01-01`;
//       const testTime = '12:00';
//       const testLat = 40.7128; // New York coordinates
//       const testLon = -74.0060;
      
//       const testChart = calculateAstrologicalChart(testDate, testTime, testLat, testLon);
      
//       console.log(`${year}:`, {
//         sunSign: testChart?.sunSign.name,
//         moonSign: testChart?.moonSign.name,
//         risingSign: testChart?.risingSign.name
//       });
//     });
    
//     console.log('=== END EXTENDED YEAR RANGE TEST ===');
//   };

//   // Run test on component mount
//   useEffect(() => {
//     testCalculations();
//     testExtendedYearRange();
//   }, []);

//   return (
//     <div className="space-y-4">
//       {/* Compact Tab Navigation */}
//       <div className="flex space-x-1 mb-4 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 rounded-lg p-1 border border-slate-200/60 shadow-md backdrop-blur-sm">
//         <button
//           onClick={() => setSelectedTab('calculator')}
//           className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-300 relative overflow-hidden group ${
//             selectedTab === 'calculator'
//               ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105'
//               : 'text-slate-600 hover:text-blue-600 hover:bg-white/80 hover:shadow-sm hover:scale-105'
//           }`}
//         >
//           <div className={`absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${selectedTab === 'calculator' ? 'opacity-100' : ''}`}></div>
//           <div className="relative flex items-center justify-center space-x-1">
//             <GiCrystalBall className={`transition-all duration-300 ${selectedTab === 'calculator' ? 'text-sm' : 'text-xs group-hover:text-sm'}`} />
//             <span className="tracking-wide font-medium">Profile</span>
//             {selectedTab === 'calculator' && (
//               <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse"></div>
//             )}
//           </div>
//         </button>
//         <button
//           onClick={() => setSelectedTab('gallery')}
//           className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-300 relative overflow-hidden group ${
//             selectedTab === 'gallery'
//               ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md transform scale-105'
//               : 'text-slate-600 hover:text-purple-600 hover:bg-white/80 hover:shadow-sm hover:scale-105'
//           }`}
//         >
//           <div className={`absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${selectedTab === 'gallery' ? 'opacity-100' : ''}`}></div>
//           <div className="relative flex items-center justify-center space-x-1">
//             <BsGrid3X3 className={`transition-all duration-300 ${selectedTab === 'gallery' ? 'text-sm' : 'text-xs group-hover:text-sm'}`} />
//             <span className="tracking-wide font-medium">Signs</span>
//             {selectedTab === 'gallery' && (
//               <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse"></div>
//             )}
//           </div>
//         </button>
//         <button
//           onClick={() => setSelectedTab('compatibility')}
//           className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-300 relative overflow-hidden group ${
//             selectedTab === 'compatibility'
//               ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md transform scale-105'
//               : 'text-slate-600 hover:text-pink-600 hover:bg-white/80 hover:shadow-sm hover:scale-105'
//           }`}
//         >
//           <div className={`absolute inset-0 bg-gradient-to-r from-pink-400/20 to-rose-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${selectedTab === 'compatibility' ? 'opacity-100' : ''}`}></div>
//           <div className="relative flex items-center justify-center space-x-1">
//             <GiHearts className={`transition-all duration-300 ${selectedTab === 'compatibility' ? 'text-sm' : 'text-xs group-hover:text-sm'}`} />
//             <span className="tracking-wide font-medium">Love</span>
//             {selectedTab === 'compatibility' && (
//               <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-rose-300 rounded-full animate-pulse"></div>
//             )}
//           </div>
//         </button>
//         <button
//           onClick={() => setSelectedTab('soulInsight')}
//           className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-300 relative overflow-hidden group ${
//             selectedTab === 'soulInsight'
//               ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md transform scale-105'
//               : 'text-slate-600 hover:text-indigo-600 hover:bg-white/80 hover:shadow-sm hover:scale-105'
//           }`}
//         >
//           <div className={`absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${selectedTab === 'soulInsight' ? 'opacity-100' : ''}`}></div>
//           <div className="relative flex items-center justify-center space-x-1">
//             <GiBrain className={`transition-all duration-300 ${selectedTab === 'soulInsight' ? 'text-sm' : 'text-xs group-hover:text-sm'}`} />
//             <span className="tracking-wide font-medium">Soul</span>
//             {selectedTab === 'soulInsight' && (
//               <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-indigo-300 rounded-full animate-pulse"></div>
//             )}
//           </div>
//         </button>
//         <button
//           onClick={() => setSelectedTab('natalChart')}
//           className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-300 relative overflow-hidden group ${
//             selectedTab === 'natalChart'
//               ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md transform scale-105'
//               : 'text-slate-600 hover:text-emerald-600 hover:bg-white/80 hover:shadow-sm hover:scale-105'
//           }`}
//         >
//           <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${selectedTab === 'natalChart' ? 'opacity-100' : ''}`}></div>
//           <div className="relative flex items-center justify-center space-x-1">
//             <GiStarsStack className={`transition-all duration-300 ${selectedTab === 'natalChart' ? 'text-sm' : 'text-xs group-hover:text-sm'}`} />
//             <span className="tracking-wide font-medium">Chart</span>
//             {selectedTab === 'natalChart' && (
//               <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></div>
//             )}
//           </div>
//         </button>
//         <button
//           onClick={() => setSelectedTab('realTime')}
//           className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all duration-300 relative overflow-hidden group ${
//             selectedTab === 'realTime'
//               ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md transform scale-105'
//               : 'text-slate-600 hover:text-purple-600 hover:bg-white/80 hover:shadow-sm hover:scale-105'
//           }`}
//         >
//           <div className={`absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${selectedTab === 'realTime' ? 'opacity-100' : ''}`}></div>
//           <div className="relative flex items-center justify-center space-x-1">
//             <GiCrystalBall className={`transition-all duration-300 ${selectedTab === 'realTime' ? 'text-sm' : 'text-xs group-hover:text-sm'}`} />
//             <span className="tracking-wide font-medium">Live</span>
//             {selectedTab === 'realTime' && (
//               <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse"></div>
//             )}
//           </div>
//         </button>
//       </div>

//       {selectedTab === 'calculator' && (
//         <>
//           {/* Compact Profile Section */}
//           <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
//             {/* Header */}
//             <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-4">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-4">
//                   <div className="relative">
//                     <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
//                       <GiCrystalBall className="text-2xl text-white" />
//                     </div>
//                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
//                   </div>
//                   <div>
//                     <h2 className="text-2xl font-bold text-white">
// Soul Report
//                     </h2>
//                     <p className="text-blue-100 text-sm">Discover your soul's purpose</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   {/* {isProfileSaved && (
//                     <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
//                       <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//                       <span className="text-white text-sm font-medium">Profile Saved</span>
//                     </div>
//                   )} */}
//                   <button
//                     onClick={() => setIsProfileCardVisible(!isProfileCardVisible)}
//                     className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
//                   >
//                     <svg 
//                       className="w-4 h-4 text-white" 
//                       fill="none" 
//                       stroke="currentColor" 
//                       viewBox="0 0 24 24"
//                     >
//                       {isProfileCardVisible ? (
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
//                       ) : (
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                       )}
//                     </svg>
//                     <span className="text-white text-sm font-medium">
//                       {isProfileCardVisible ? 'Hide' : 'Show'} Profile
//                     </span>
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Content */}
//             <div className="p-4">
//               {/* Show profile summary if saved, else show the form */}
//               {isProfileSaved && isProfileCardVisible ? (
//                 <div className="space-y-4">
//                   {/* Compact Profile Card */}
//                   <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
//                     {/* Compact Header - Always Visible */}
//                     <div className="p-4">
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center space-x-4">
//                           <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
//                             <span className="text-base text-white font-bold">
//                               {(displayName || userName).charAt(0).toUpperCase()}
//                             </span>
//                           </div>
//                           <div>
//                             <h3 className="text-base font-bold text-gray-900">{displayName || userName}</h3>
//                             <p className="text-gray-500 text-xs">@{userName}</p>
//                           </div>
//                         </div>
//                         <div className="flex items-center space-x-2">
//                           {zodiacSign && (
//                                                     <div className="text-center">
//                           <div className="text-xl mb-1">{zodiacSign.symbol}</div>
//                           <div className="text-xs text-gray-600">{zodiacSign.name}</div>
//                         </div>
//                           )}
//                           <button
//                             onClick={() => setIsProfileCardExpanded(!isProfileCardExpanded)}
//                             className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
//                           >
//                             <svg 
//                               className={`w-5 h-5 transform transition-transform duration-200 ${isProfileCardExpanded ? 'rotate-180' : ''}`} 
//                               fill="none" 
//                               stroke="currentColor" 
//                               viewBox="0 0 24 24"
//                             >
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                             </svg>
//                           </button>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Expandable Details */}
//                     {isProfileCardExpanded && (
//                       <div className="border-t border-gray-200 bg-gray-50/50">
//                         <div className="p-4 space-y-3">
//                           <div className="grid md:grid-cols-2 gap-4">
//                             <div className="space-y-3">
//                               <div className="flex items-center space-x-3">
//                                 <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
//                                   <GiCalendar className="text-blue-600 text-xs" />
//                                 </div>
//                                 <div>
//                                   <p className="text-xs text-gray-500 uppercase tracking-wide">Birth Date</p>
//                                   <p className="text-gray-900 font-medium text-sm">{birthDate}</p>
//                                 </div>
//                               </div>
//                               {birthTime && (
//                                 <div className="flex items-center space-x-3">
//                                   <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
//                                     <BsClock className="text-purple-600 text-xs" />
//                                   </div>
//                                   <div>
//                                     <p className="text-xs text-gray-500 uppercase tracking-wide">Birth Time</p>
//                                     <p className="text-gray-900 font-medium text-sm">{birthTime}</p>
//                                   </div>
//                                 </div>
//                               )}
//                               {location.city && (
//                                 <div className="flex items-center space-x-3">
//                                   <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
//                                     <span className="text-green-600 text-xs">🌍</span>
//                                   </div>
//                                   <div>
//                                     <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
//                                     <p className="text-gray-900 font-medium text-sm">{location.city}, {location.country}</p>
//                                   </div>
//                                 </div>
//                               )}
//                             </div>

//                             {zodiacSign && (
//                               <div className="bg-white rounded-lg p-3 border border-blue-200">
//                                 <div className="text-center">
//                                   <div className="text-2xl mb-1">{zodiacSign.symbol}</div>
//                                   <h4 className="font-bold text-gray-900 mb-1">{zodiacSign.name}</h4>
//                                   <p className="text-xs text-gray-600 mb-2">{zodiacSign.dates}</p>
//                                   <div className="flex items-center justify-center space-x-2 text-xs">
//                                     <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{zodiacSign.element}</span>
//                                     <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">{zodiacSign.ruler}</span>
//                                   </div>
//                                 </div>
//                               </div>
//                             )}
//                           </div>

//                           <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
//                             <button
//                               onClick={() => setIsProfileSaved(false)}
//                               className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs"
//                             >
//                               Edit Profile
//                             </button>
//                             <button
//                               onClick={clearSavedProfile}
//                               className="px-3 py-1.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-xs"
//                             >
//                               Clear Profile
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {/* Profile Status Message */}
//                   {profileSavedMessage && (
//                     <div className={`p-3 rounded-lg text-center font-medium text-sm ${
//                       profileSavedMessage.includes('Error') 
//                         ? 'bg-red-50 text-red-700 border border-red-200' 
//                         : 'bg-green-50 text-green-700 border border-green-200'
//                     }`}>
//                       {profileSavedMessage}
//                     </div>
//                   )}

//                   {/* Compact Form Layout */}
//                   <div className="grid lg:grid-cols-2 gap-4">
//                     {/* Left Column - Personal Info */}
//                     <div className="space-y-4">
//                       {/* Personal Information */}
//                       <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
//                         <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
//                           <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
//                             <GiMoon className="text-blue-600 text-sm" />
//                           </div>
//                           Personal Information
//                         </h3>
//                         <div className="space-y-3">
//                           <div>
//                             <label htmlFor="userName" className="block text-xs font-medium text-gray-700 mb-1">
//                               Username
//                             </label>
//                             <input
//                               type="text"
//                               id="userName"
//                               value={userName}
//                               onChange={(e) => setUserName(e.target.value)}
//                               placeholder="Enter your username"
//                               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-gray-900 text-sm"
//                             />
//                           </div>
//                           <div>
//                             <label htmlFor="displayName" className="block text-xs font-medium text-gray-700 mb-1">
//                               Display Name
//                             </label>
//                             <input
//                               type="text"
//                               id="displayName"
//                               value={displayName}
//                               onChange={(e) => setDisplayName(e.target.value)}
//                               placeholder="Enter your display name"
//                               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-gray-900 text-sm"
//                             />
//                           </div>
//                         </div>
//                       </div>

//                       {/* Birth Information */}
//                       <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
//                         <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                           <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
//                             <GiStarsStack className="text-purple-600" />
//                           </div>
//                           Birth Information
//                         </h3>
//                         <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
//                           <p className="text-xs text-purple-700">
//                             ✨ <strong>Enhanced Support:</strong> Accurate calculations for birth years 1980-2025 with precise lunar phases and astronomical data.
//                           </p>
//                           <p className="text-xs text-purple-600 mt-1">
//                             🔍 <strong>Verified Positions:</strong> Hardcoded accurate positions for specific dates and locations ensure maximum precision.
//                           </p>
//                         </div>
//                         <div className="space-y-4">
//                           <div>
//                             <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
//                               Birth Date
//                             </label>
//                             <input
//                               type="date"
//                               id="birthDate"
//                               value={birthDate}
//                               onChange={(e) => setBirthDate(e.target.value)}
//                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all duration-200 text-gray-900"
//                               max={new Date().toISOString().split('T')[0]}
//                             />
//                           </div>
//                           <div>
//                             <label htmlFor="birthTime" className="block text-sm font-medium text-gray-700 mb-2">
//                               Birth Time (Optional)
//                             </label>
//                             <input
//                               type="time"
//                               id="birthTime"
//                               value={birthTime}
//                               onChange={(e) => setBirthTime(e.target.value)}
//                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all duration-200 text-gray-900"
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Right Column - Location & Actions */}
//                     <div className="space-y-6">
//                       {/* Location Information */}
//                       <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
//                         <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                           <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
//                             <span className="text-green-600">🌍</span>
//                           </div>
//                           Location Information
//                         </h3>
//                         <div className="space-y-4">
//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                               Birth Location
//                             </label>
//                             <input
//                               type="text"
//                               value={
//                                 location.error
//                                   ? location.error
//                                   : location.city
//                                   ? `${location.city}, ${location.country}`
//                                   : location.country
//                                   ? location.country
//                                   : "Detecting location..."
//                               }
//                               onChange={e => setLocation({ ...location, city: e.target.value })}
//                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200 text-gray-900"
//                               disabled={!!location.error}
//                               placeholder="Enter your birth location (e.g., Osogbo, Nigeria)"
//                             />
//                           </div>
                          
//                           {/* Manual Coordinates Input */}
//                           <div className="grid grid-cols-2 gap-4">
//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Latitude
//                               </label>
//                               <input
//                                 type="number"
//                                 step="0.0001"
//                                 value={location.lat || ''}
//                                 onChange={e => setLocation({ ...location, lat: parseFloat(e.target.value) || undefined })}
//                                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200 text-gray-900"
//                                 placeholder="e.g., 7.7667"
//                               />
//                             </div>
//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Longitude
//                               </label>
//                               <input
//                                 type="number"
//                                 step="0.0001"
//                                 value={location.lon || ''}
//                                 onChange={e => setLocation({ ...location, lon: parseFloat(e.target.value) || undefined })}
//                                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200 text-gray-900"
//                                 placeholder="e.g., 4.5667"
//                               />
//                             </div>
//                           </div>
                          
//                           {location.lat && location.lon && (
//                             <div className="text-xs text-gray-500 bg-white px-3 py-2 rounded border">
//                               Coordinates: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
//                             </div>
//                           )}
                          
//                           {/* Quick Location Buttons */}
//                           <div className="flex flex-wrap gap-2">
//                             <button
//                               onClick={() => setLocation({ city: 'Osogbo', country: 'Nigeria', lat: 7.7667, lon: 4.5667 })}
//                               className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors"
//                             >
//                               Osogbo, Nigeria
//                             </button>
//                             <button
//                               onClick={() => setLocation({ city: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060 })}
//                               className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors"
//                             >
//                               New York, USA
//                             </button>
//                             <button
//                               onClick={() => setLocation({ city: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 })}
//                               className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors"
//                             >
//                               London, UK
//                             </button>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Action Buttons */}
//                       <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
//                         <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
//                         <div className="space-y-2">
//                           <button
//                             onClick={calculateZodiac}
//                             disabled={!birthDate || isCalculating}
//                             className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
//                           >
//                             {isCalculating ? (
//                               <div className="flex items-center justify-center">
//                                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                                 Creating Profile...
//                               </div>
//                             ) : (
//                               'Create My Profile'
//                             )}
//                           </button>
                          
//                           {showResult && (
//                             <>
//                               <button
//                                 onClick={saveProfile}
//                                 disabled={isSavingProfile || !userName.trim()}
//                                 className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
//                               >
//                                 {isSavingProfile ? (
//                                   <div className="flex items-center justify-center">
//                                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                                     Saving...
//                                   </div>
//                                 ) : (
//                                   'Save Profile'
//                                 )}
//                               </button>
                              
//                               <button
//                                 onClick={resetCalculator}
//                                 className="w-full bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-all duration-200 text-sm"
//                               >
//                                 Reset Form
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Professional Result Section */}
//           {showResult && zodiacSign && (
//             <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//               {/* Result Header */}
//               <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-6">
//                 <div className="text-center">
//                   <div className="relative inline-block mb-4">
//                     <div className="text-6xl mb-2">{zodiacSign.symbol}</div>
//                     <button
//                       onClick={() => toggleFavorite(zodiacSign.name)}
//                       className="absolute -top-2 -left-2 p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
//                     >
//                       {favorites.includes(zodiacSign.name) ? (
//                         <MdFavorite className="text-red-500 text-lg" />
//                       ) : (
//                         <MdFavoriteBorder className="text-gray-400 text-lg" />
//                       )}
//                     </button>
//                   </div>
//                   <h3 className="text-3xl font-bold text-white mb-2">
//                     {zodiacSign.name}
//                   </h3>
//                   <p className="text-indigo-100 text-lg">{zodiacSign.dates}</p>
//                 </div>
//               </div>

//               {/* Result Content */}
//               <div className="p-8">
//                 {/* Daily Horoscope */}
//                 {zodiacSign.dailyHoroscope && (
//                   <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-8">
//                     <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
//                       <GiStarsStack className="mr-2 text-blue-600" />
//                       Today's Horoscope
//                     </h4>
//                     <p className="text-gray-700 leading-relaxed italic">"{zodiacSign.dailyHoroscope}"</p>
//                   </div>
//                 )}

//                 {astrologicalChart && (
//                   <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
//                     <h4 className="text-xl font-bold text-gray-900 mb-6 text-center">
//                       Your Complete Astrological Chart
//                     </h4>
                    
//                     {/* Verified Positions Indicator */}
//                     {usingVerifiedPositions && (
//                       <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
//                         <div className="flex items-center justify-center space-x-2">
//                           <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
//                             <span className="text-white text-xs font-bold">✓</span>
//                           </div>
//                           <span className="text-green-800 font-semibold">Using Verified Positions</span>
//                         </div>
//                         <div className="mt-2 text-sm text-green-700 text-center">
//                           {usingVerifiedPositions.sun && <span className="inline-block mx-1 px-2 py-1 bg-green-100 rounded">Sun</span>}
//                           {usingVerifiedPositions.moon && <span className="inline-block mx-1 px-2 py-1 bg-green-100 rounded">Moon</span>}
//                           {usingVerifiedPositions.ascendant && <span className="inline-block mx-1 px-2 py-1 bg-green-100 rounded">Rising</span>}
//                           {!usingVerifiedPositions.sun && !usingVerifiedPositions.moon && !usingVerifiedPositions.ascendant && 
//                             <span>Calculated using advanced astronomical algorithms</span>
//                           }
//                         </div>
//                       </div>
//                     )}
                    
//                     <div className="grid md:grid-cols-3 gap-6">
//                       {/* Sun Sign */}
//                       <div className="bg-white rounded-xl p-6 border border-yellow-200 shadow-sm text-center">
//                         <div className="text-3xl mb-3">☀️</div>
//                         <h5 className="font-bold text-yellow-800 mb-2">Sun Sign</h5>
//                         <div className="text-2xl mb-2">{astrologicalChart.sunSign.symbol}</div>
//                         <div className="font-semibold text-yellow-700 mb-1">{astrologicalChart.sunSign.name}</div>
//                         <div className="text-xs text-yellow-600">Your core personality</div>
//                       </div>
                      
//                       {/* Moon Sign */}
//                       <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
//                         <div className="text-3xl mb-3">🌙</div>
//                         <h5 className="font-bold text-gray-800 mb-2">Moon Sign</h5>
//                         <div className="text-2xl mb-2">{astrologicalChart.moonSign.symbol}</div>
//                         <div className="font-semibold text-gray-700 mb-1">{astrologicalChart.moonSign.name}</div>
//                         <div className="text-xs text-gray-600">Your emotional nature</div>
//                       </div>
                      
//                       {/* Rising Sign */}
//                       <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm text-center">
//                         <div className="text-3xl mb-3">🌅</div>
//                         <h5 className="font-bold text-blue-800 mb-2">Rising Sign</h5>
//                         <div className="text-2xl mb-2">{astrologicalChart.risingSign.symbol}</div>
//                         <div className="font-semibold text-blue-700 mb-1">{astrologicalChart.risingSign.name}</div>
//                         <div className="text-xs text-blue-600">How others see you</div>
//                       </div>
//                     </div>
                    
//                     <div className="mt-6 text-center">
//                       <button
//                         onClick={() => setShowAdvancedChart(!showAdvancedChart)}
//                         className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm"
//                       >
//                         {showAdvancedChart ? 'Hide' : 'Show'} Detailed Analysis
//                       </button>
//                     </div>
                    
//                     {showAdvancedChart && (
//                       <div className="mt-6 space-y-4">
//                         <div className="grid md:grid-cols-3 gap-4">
//                           <div className="bg-white rounded-lg p-4 border border-yellow-200">
//                             <h6 className="font-semibold text-yellow-800 mb-2">Sun Sign Traits</h6>
//                             <p className="text-sm text-gray-700">{astrologicalChart.sunSign.description}</p>
//                           </div>
//                           <div className="bg-white rounded-lg p-4 border border-gray-200">
//                             <h6 className="font-semibold text-gray-800 mb-2">Moon Sign Traits</h6>
//                             <p className="text-sm text-gray-700">{astrologicalChart.moonSign.description}</p>
//                           </div>
//                           <div className="bg-white rounded-lg p-4 border border-blue-200">
//                             <h6 className="font-semibold text-blue-800 mb-2">Rising Sign Traits</h6>
//                             <p className="text-sm text-gray-700">{astrologicalChart.risingSign.description}</p>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 <div className="grid lg:grid-cols-2 gap-8">
//                   {/* Left Column */}
//                   <div className="space-y-6">
//                     {/* Description */}
//                     <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
//                       <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
//                         <GiMoon className="mr-2 text-blue-600" />
//                         About {zodiacSign.name}
//                       </h4>
//                       <p className="text-gray-700 leading-relaxed">{zodiacSign.description}</p>
//                     </div>

//                     {/* Cosmic Information */}
//                     <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
//                       <h4 className="text-lg font-semibold text-blue-900 mb-4">
//                         Cosmic Information
//                       </h4>
//                       <div className="grid grid-cols-2 gap-4">
//                         <div className="text-center p-4 rounded-lg border border-blue-300 bg-white shadow-sm">
//                           <div className="text-2xl font-bold text-blue-700">{zodiacSign.element}</div>
//                           <div className="text-xs text-blue-600 mt-1 font-medium uppercase tracking-wide">Element</div>
//                         </div>
//                         <div className="text-center p-4 rounded-lg border border-purple-300 bg-white shadow-sm">
//                           <div className="text-2xl font-bold text-purple-700">{zodiacSign.ruler}</div>
//                           <div className="text-xs text-purple-600 mt-1 font-medium uppercase tracking-wide">Ruler</div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Personality Traits */}
//                     <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
//                       <h4 className="text-lg font-semibold text-gray-900 mb-4">Personality Traits</h4>
//                       <div className="flex flex-wrap gap-2">
//                         {zodiacSign.traits.map((trait, index) => (
//                           <span key={index} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
//                             {trait}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Right Column */}
//                   <div className="space-y-6">
//                     {/* Compatibility */}
//                     <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
//                       <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                         <GiStarsStack className="mr-2 text-blue-600" />
//                         Best Compatibility
//                       </h4>
//                       <div className="flex flex-wrap gap-2">
//                         {zodiacSign.compatibility.map((sign, index) => (
//                           <span key={index} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
//                             {sign}
//                           </span>
//                         ))}
//                       </div>
//                     </div>

//                     {/* Strengths & Weaknesses */}
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="bg-green-50 rounded-xl p-4 border border-green-200">
//                         <h4 className="font-bold text-green-800 mb-3 text-lg">
//                           ✨ Strengths
//                         </h4>
//                         <div className="space-y-2">
//                           {zodiacSign.strengths.map((strength, index) => (
//                             <div key={index} className="flex items-center text-sm bg-white rounded-lg p-2 border border-green-200">
//                               <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
//                               <span className="font-medium text-green-800">{strength}</span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                       <div className="bg-red-50 rounded-xl p-4 border border-red-200">
//                         <h4 className="font-bold text-red-800 mb-3 text-lg">
//                           ⚠️ Weaknesses
//                         </h4>
//                         <div className="space-y-2">
//                           {zodiacSign.weaknesses.map((weakness, index) => (
//                             <div key={index} className="flex items-center text-sm bg-white rounded-lg p-2 border border-red-200">
//                               <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
//                               <span className="font-medium text-red-800">{weakness}</span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     </div>

//                     {/* Lucky Elements */}
//                     <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
//                       <h4 className="text-lg font-semibold text-gray-900 mb-4">Lucky Elements</h4>
//                       <div className="space-y-4">
//                         <div>
//                           <span className="text-sm text-gray-600 block mb-2">Lucky Numbers:</span>
//                           <div className="flex gap-2">
//                             {zodiacSign.luckyNumbers.map((num, index) => (
//                               <span key={index} className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm font-bold border border-blue-200">
//                                 {num}
//                               </span>
//                             ))}
//                           </div>
//                         </div>
//                         <div>
//                           <span className="text-sm text-gray-600 block mb-2">Lucky Colors:</span>
//                           <div className="flex flex-wrap gap-2">
//                             {zodiacSign.luckyColors.map((color, index) => (
//                               <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium border border-purple-200">
//                                 {color}
//                               </span>
//                             ))}
//                           </div>
//                         </div>
//                         <div>
//                           <span className="text-sm text-gray-600 block mb-2">Lucky Stones:</span>
//                           <div className="flex flex-wrap gap-2">
//                             {zodiacSign.luckyStones.map((stone, index) => (
//                               <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium border border-yellow-200">
//                                 {stone}
//                               </span>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}

//       {selectedTab === 'gallery' && (
//         <div className="bg-gradient-to-br from-indigo-100/95 via-purple-50/90 to-pink-100/95 rounded-xl p-6 border-2 border-indigo-300 backdrop-blur-sm shadow-xl">
//           <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-6 text-center">
//             Explore All Zodiac Signs
//           </h3>
          
//           {/* Featured Sign */}
//           <div className="mb-8">
//             <div className="bg-gradient-to-br from-blue-50/90 via-purple-50/90 to-indigo-50/90 rounded-lg p-6 border-2 border-blue-200 shadow-lg text-center">
//               <div className="text-6xl mb-4 animate-pulse">{zodiacSigns[currentGalleryIndex].symbol}</div>
//               <h4 className="text-2xl font-bold text-blue-800 mb-2">{zodiacSigns[currentGalleryIndex].name}</h4>
//               <p className="text-gray-600 mb-4">{zodiacSigns[currentGalleryIndex].dates}</p>
//               <p className="text-gray-700 mb-4">{zodiacSigns[currentGalleryIndex].description}</p>
//               <div className="flex justify-center space-x-4">
//                 <button
//                   onClick={prevGallerySign}
//                   className="p-2 bg-gradient-to-r from-blue-200 to-blue-300 text-blue-700 rounded-full hover:from-blue-300 hover:to-blue-400 transition-all duration-300 shadow-md"
//                 >
//                   <BsArrowLeft />
//                 </button>
//                 <button
//                   onClick={() => {
//                     setZodiacSign(zodiacSigns[currentGalleryIndex]);
//                     setShowResult(true);
//                     setSelectedTab('calculator');
//                   }}
//                   className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg"
//                 >
//                   Learn More
//                 </button>
//                 <button
//                   onClick={nextGallerySign}
//                   className="p-2 bg-gradient-to-r from-blue-200 to-blue-300 text-blue-700 rounded-full hover:from-blue-300 hover:to-blue-400 transition-all duration-300 shadow-md"
//                 >
//                   <BsArrowRight />
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* All Signs Grid */}
//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//             {zodiacSigns.map((sign, index) => (
//               <div 
//                 key={index} 
//                 className="bg-gradient-to-br from-blue-50/90 via-purple-50/90 to-indigo-50/90 rounded-lg p-4 border-2 border-blue-200 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 text-center group relative"
//                 onClick={() => {
//                   setZodiacSign(sign);
//                   setShowResult(true);
//                   setSelectedTab('calculator');
//                 }}
//               >
//                 <div className="text-4xl mb-2 group-hover:animate-bounce">{sign.symbol}</div>
//                 <div className="font-bold text-blue-800 text-lg mb-1">{sign.name}</div>
//                 <div className="text-xs text-gray-600 mb-2">{sign.dates}</div>
//                 <div className="text-xs text-blue-600 font-medium">{sign.element}</div>
//                 <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                   <div className="text-xs text-gray-500">Click to learn more</div>
//                 </div>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     toggleFavorite(sign.name);
//                   }}
//                   className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
//                 >
//                   {favorites.includes(sign.name) ? (
//                     <MdFavorite className="text-red-500 text-sm" />
//                   ) : (
//                     <MdFavoriteBorder className="text-gray-400 text-sm" />
//                   )}
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {selectedTab === 'compatibility' && (
//         <div className="bg-gradient-to-br from-pink-100/95 via-purple-50/90 to-rose-100/95 rounded-xl p-6 border-2 border-pink-300 backdrop-blur-sm shadow-xl">
//           <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-6 text-center">
//             Love Compatibility Calculator
//           </h3>
          
//           <div className="grid md:grid-cols-2 gap-6">
//             <div className="space-y-4">
//               <h4 className="font-semibold text-blue-800">Select Your Sign</h4>
//               <select
//                 className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-r from-blue-50/90 to-purple-50/90 shadow-md"
//                 onChange={(e) => {
//                   const sign = zodiacSigns.find(s => s.name === e.target.value);
//                   setZodiacSign(sign || null);
//                 }}
//               >
//                 <option value="">Choose your zodiac sign</option>
//                 {zodiacSigns.map((sign, index) => (
//                   <option key={index} value={sign.name}>{sign.symbol} {sign.name}</option>
//                 ))}
//               </select>
//             </div>

//             <div className="space-y-4">
//               <h4 className="font-semibold text-blue-800">Select Partner's Sign</h4>
//               <select
//                 className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gradient-to-r from-purple-50/90 to-pink-50/90 shadow-md"
//                 onChange={(e) => {
//                   const sign = zodiacSigns.find(s => s.name === e.target.value);
//                   setCompatibilitySign(sign || null);
//                 }}
//               >
//                 <option value="">Choose partner's zodiac sign</option>
//                 {zodiacSigns.map((sign, index) => (
//                   <option key={index} value={sign.name}>{sign.symbol} {sign.name}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {zodiacSign && compatibilitySign && (
//             <div className="mt-8 bg-gradient-to-br from-pink-50/90 via-purple-50/90 to-rose-50/90 rounded-lg p-6 border-2 border-pink-200 shadow-lg">
//               <div className="text-center mb-6">
//                 <div className="flex justify-center items-center space-x-8 mb-4">
//                   <div className="text-center">
//                     <div className="text-4xl mb-2">{zodiacSign.symbol}</div>
//                     <div className="font-semibold text-blue-800">{zodiacSign.name}</div>
//                   </div>
//                   <div className="text-6xl text-pink-500">❤️</div>
//                   <div className="text-center">
//                     <div className="text-4xl mb-2">{compatibilitySign.symbol}</div>
//                     <div className="font-semibold text-blue-800">{compatibilitySign.name}</div>
//                   </div>
//                 </div>
                
//                 <div className="text-center">
//                   <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500 mb-2">
//                     {getCompatibilityScore(zodiacSign, compatibilitySign)}%
//                   </div>
//                   <div className="text-gray-600">
//                     {getCompatibilityScore(zodiacSign, compatibilitySign) >= 90 ? 'Perfect Match!' :
//                      getCompatibilityScore(zodiacSign, compatibilitySign) >= 80 ? 'Great Compatibility!' :
//                      getCompatibilityScore(zodiacSign, compatibilitySign) >= 70 ? 'Good Compatibility!' :
//                      'Challenging but Possible!'}
//                   </div>
//                 </div>
//               </div>

//               <div className="grid md:grid-cols-2 gap-6">
//                 <div>
//                   <h5 className="font-semibold text-blue-800 mb-3">Why This Works:</h5>
//                   <ul className="space-y-2 text-sm text-gray-700">
//                     <li>• {zodiacSign.element} and {compatibilitySign.element} elements</li>
//                     <li>• {zodiacSign.ruler} and {compatibilitySign.ruler} planetary influence</li>
//                     <li>• Shared values and communication styles</li>
//                   </ul>
//                 </div>
//                 <div>
//                   <h5 className="font-semibold text-blue-800 mb-3">Relationship Tips:</h5>
//                   <ul className="space-y-2 text-sm text-gray-700">
//                     <li>• Focus on your shared strengths</li>
//                     <li>• Communicate openly about differences</li>
//                     <li>• Embrace each other's unique qualities</li>
//                   </ul>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {selectedTab === 'soulInsight' && (
//         <div className="space-y-6">
//           {birthDate && birthTime ? (
//             <SoulInsightReader
//               birthDate={birthDate}
//               birthTime={birthTime}
//               latitude={location.lat}
//               longitude={location.lon}
//             />
//           ) : (
//             <div className="bg-gradient-to-br from-purple-100/95 via-indigo-50/90 to-pink-100/95 rounded-xl p-8 border-2 border-purple-300 backdrop-blur-sm shadow-xl text-center">
//               <div className="flex items-center justify-center mb-6">
//                 <div className="relative">
//                   <GiBrain className="text-6xl text-purple-600 animate-pulse" />
//                   <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
//                 </div>
//               </div>
//               <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
//                 Advanced Soul Insight
//               </h3>
//               <p className="text-purple-700 text-lg mb-6">
//                 Enter your birth date and time to unlock your soul blueprint
//               </p>
//               <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
//                 <h4 className="font-semibold text-purple-800 mb-3">What You'll Discover:</h4>
//                 <div className="grid md:grid-cols-2 gap-4 text-left">
//                   <div className="space-y-2">
//                     <div className="flex items-center space-x-2">
//                       <GiCrystalBall className="text-purple-500" />
//                       <span className="text-sm text-gray-700">Your Soul Purpose & Life Path</span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <GiSpiralArrow className="text-blue-500" />
//                       <span className="text-sm text-gray-700">Karmic Lessons to Master</span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <BsGem className="text-yellow-500" />
//                       <span className="text-sm text-gray-700">Spiritual Gifts & Talents</span>
//                     </div>
//                   </div>
//                   <div className="space-y-2">
//                     <div className="flex items-center space-x-2">
//                       <MdPsychology className="text-red-500" />
//                       <span className="text-sm text-gray-700">Shadow Work Areas</span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <BsEye className="text-indigo-500" />
//                       <span className="text-sm text-gray-700">Past Life Indicators</span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <MdAutoAwesome className="text-pink-500" />
//                       <span className="text-sm text-gray-700">Future Potential</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {selectedTab === 'realTime' && (
//         <RealTimeCosmicInsights 
//           userChart={natalChart} 
//           userLocation={location.lat && location.lon ? { lat: location.lat, lon: location.lon } : undefined}
//         />
//       )}

//       {selectedTab === 'natalChart' && (
//         <div className="space-y-8">
//           {!natalChart ? (
//             <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl p-10 border border-slate-200/60 shadow-2xl backdrop-blur-sm text-center">
//               <div className="flex items-center justify-center mb-8">
//                 <div className="relative">
//                   <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl">
//                     <GiStarsStack className="text-3xl text-white" />
//                   </div>
//                   <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg"></div>
//                 </div>
//               </div>
//               <h3 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">
//                 Professional Natal Chart
//               </h3>
//               <p className="text-slate-600 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
//                 Unlock your complete astrological blueprint with precise planetary positions, aspects, and professional interpretations
//               </p>
              
//                              {!birthDate || !birthTime ? (
//                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-lg">
//                    <h4 className="font-bold text-slate-800 mb-4 text-lg">Required Information</h4>
//                    <div className="grid md:grid-cols-2 gap-6">
//                      <div className="space-y-4">
//                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
//                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                            <GiCalendar className="text-blue-600" />
//                          </div>
//                          <div>
//                            <div className="font-semibold text-slate-800">Exact Birth Date</div>
//                            <div className="text-sm text-slate-600">Required for accurate calculations</div>
//                          </div>
//                        </div>
//                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
//                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
//                            <BsClock className="text-emerald-600" />
//                          </div>
//                          <div>
//                            <div className="font-semibold text-slate-800">Exact Birth Time</div>
//                            <div className="text-sm text-slate-600">Critical for house positions</div>
//                          </div>
//                        </div>
//                      </div>
//                      <div className="space-y-4">
//                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
//                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
//                            <span className="text-purple-600 text-lg">🌍</span>
//                          </div>
//                          <div>
//                            <div className="font-semibold text-slate-800">Birth Location</div>
//                            <div className="text-sm text-slate-600">For precise coordinates</div>
//                          </div>
//                        </div>
//                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
//                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
//                            <GiCrystalBall className="text-indigo-600" />
//                          </div>
//                          <div>
//                            <div className="font-semibold text-slate-800">Planetary Positions</div>
//                            <div className="text-sm text-slate-600">Complete astrological analysis</div>
//                          </div>
//                        </div>
//                      </div>
//                    </div>
//                    <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
//                      <div className="flex items-center space-x-2 mb-2">
//                        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
//                          <span className="text-white text-xs font-bold">!</span>
//                        </div>
//                        <span className="font-semibold text-amber-800">Important Note</span>
//                      </div>
//                      <p className="text-sm text-amber-700 leading-relaxed">
//                        Please navigate to the <strong>Profile</strong> tab and enter your complete birth information to generate your professional natal chart.
//                      </p>
//                    </div>
//                  </div>
//                              ) : (
//                  <div className="space-y-6">
//                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-lg">
//                      <h4 className="font-bold text-slate-800 mb-4 text-lg">Chart Analysis Features</h4>
//                      <div className="grid md:grid-cols-2 gap-6">
//                        <div className="space-y-4">
//                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
//                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
//                              <span className="text-yellow-600 text-lg">☀️</span>
//                            </div>
//                            <div>
//                              <div className="font-semibold text-slate-800">Core Triad</div>
//                              <div className="text-sm text-slate-600">Sun, Moon & Rising Signs</div>
//                            </div>
//                          </div>
//                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
//                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
//                              <span className="text-blue-600 text-lg">🪐</span>
//                            </div>
//                            <div>
//                              <div className="font-semibold text-slate-800">Planetary Positions</div>
//                              <div className="text-sm text-slate-600">Exact zodiac placements</div>
//                            </div>
//                          </div>
//                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
//                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
//                              <span className="text-purple-600 text-lg">⭐</span>
//                            </div>
//                            <div>
//                              <div className="font-semibold text-slate-800">House System</div>
//                              <div className="text-sm text-slate-600">Life area placements</div>
//                            </div>
//                          </div>
//                        </div>
//                        <div className="space-y-4">
//                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
//                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
//                              <span className="text-green-600 text-lg">⚡</span>
//                            </div>
//                            <div>
//                              <div className="font-semibold text-slate-800">Planetary Aspects</div>
//                              <div className="text-sm text-slate-600">Harmonic relationships</div>
//                            </div>
//                          </div>
//                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
//                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
//                              <span className="text-red-600 text-lg">🎯</span>
//                            </div>
//                            <div>
//                              <div className="font-semibold text-slate-800">Dignities</div>
//                              <div className="text-sm text-slate-600">Planetary strengths</div>
//                            </div>
//                          </div>
//                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg border border-indigo-200">
//                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
//                              <span className="text-indigo-600 text-lg">🔮</span>
//                            </div>
//                            <div>
//                              <div className="font-semibold text-slate-800">Life Path</div>
//                              <div className="text-sm text-slate-600">Soul purpose insights</div>
//                            </div>
//                          </div>
//                        </div>
//                      </div>
//                    </div>
                   
//                    <button
//                      onClick={calculateNatalChart}
//                      disabled={isCalculatingNatalChart}
//                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 px-8 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
//                    >
//                      {isCalculatingNatalChart ? (
//                        <div className="flex items-center justify-center">
//                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
//                          <span className="text-lg">Generating Professional Chart...</span>
//                        </div>
//                      ) : (
//                        <div className="flex items-center justify-center space-x-2">
//                          <GiStarsStack className="text-xl" />
//                          <span>Generate Professional Natal Chart</span>
//                        </div>
//                      )}
//                    </button>
//                  </div>
//                )}
//             </div>
//                      ) : (
//              <div className="space-y-8">
//                {/* Professional Natal Chart Header */}
//                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white text-center shadow-2xl border border-slate-700">
//                  <div className="flex items-center justify-center mb-4">
//                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl mr-4">
//                      <GiStarsStack className="text-2xl text-white" />
//                    </div>
//                    <div>
//                      <h3 className="text-4xl font-bold mb-2 tracking-tight">Professional Natal Chart</h3>
//                      <p className="text-slate-300 text-lg">Complete Astrological Analysis</p>
//                    </div>
//                  </div>
//                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
//                    <div className="grid md:grid-cols-3 gap-4 text-sm">
//                      <div className="flex items-center justify-center space-x-2">
//                        <GiCalendar className="text-emerald-400" />
//                        <span className="text-slate-300">{birthDate}</span>
//                      </div>
//                      <div className="flex items-center justify-center space-x-2">
//                        <BsClock className="text-emerald-400" />
//                        <span className="text-slate-300">{birthTime}</span>
//                      </div>
//                      <div className="flex items-center justify-center space-x-2">
//                        <span className="text-emerald-400">🌍</span>
//                        <span className="text-slate-300">{location.city}, {location.country}</span>
//                      </div>
//                    </div>
//                  </div>
//                </div>

//                              {/* Professional Planetary Positions Grid */}
//                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
//                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
//                    <h4 className="text-2xl font-bold text-slate-900 flex items-center">
//                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
//                        <GiStarsStack className="text-white" />
//                      </div>
//                      Planetary Positions & Dignities
//                    </h4>
//                    <p className="text-slate-600 mt-2">Exact zodiac placements with astrological dignities</p>
//                  </div>
//                  <div className="p-8">
//                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//                                          {natalChart.sun && (
//                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
//                          <div className="flex items-center justify-between mb-4">
//                            <div className="flex items-center space-x-3">
//                              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
//                                <span className="text-2xl">☀️</span>
//                              </div>
//                              <div>
//                                <div className="font-bold text-yellow-800 text-lg">Sun</div>
//                                <div className="text-xs text-yellow-600 font-medium">Core Identity</div>
//                              </div>
//                            </div>
//                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                              natalChart.sun.dignity === 'Domicile' ? 'bg-yellow-100 text-yellow-800' :
//                              natalChart.sun.dignity === 'Exaltation' ? 'bg-green-100 text-green-800' :
//                              natalChart.sun.dignity === 'Detriment' ? 'bg-red-100 text-red-800' :
//                              natalChart.sun.dignity === 'Fall' ? 'bg-orange-100 text-orange-800' :
//                              'bg-gray-100 text-gray-800'
//                            }`}>
//                              {natalChart.sun.dignity}
//                            </span>
//                          </div>
//                          <div className="space-y-2">
//                            <div className="flex justify-between items-center">
//                              <span className="text-sm font-medium text-slate-700">Position:</span>
//                              <span className="text-sm font-bold text-slate-900">{natalChart.sun.sign} {natalChart.sun.degree.toFixed(1)}°</span>
//                            </div>
//                            <div className="flex justify-between items-center">
//                              <span className="text-sm font-medium text-slate-700">House:</span>
//                              <span className="text-sm font-bold text-slate-900">{natalChart.sun.house}</span>
//                            </div>
//                          </div>
//                        </div>
//                      )}
                    
//                                          {natalChart.moon && (
//                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
//                          <div className="flex items-center justify-between mb-4">
//                            <div className="flex items-center space-x-3">
//                              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
//                                <span className="text-2xl">🌙</span>
//                              </div>
//                              <div>
//                                <div className="font-bold text-gray-800 text-lg">Moon</div>
//                                <div className="text-xs text-gray-600 font-medium">Emotional Nature</div>
//                              </div>
//                            </div>
//                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                              natalChart.moon.dignity === 'Domicile' ? 'bg-blue-100 text-blue-800' :
//                              natalChart.moon.dignity === 'Exaltation' ? 'bg-green-100 text-green-800' :
//                              natalChart.moon.dignity === 'Detriment' ? 'bg-red-100 text-red-800' :
//                              natalChart.moon.dignity === 'Fall' ? 'bg-orange-100 text-orange-800' :
//                              'bg-gray-100 text-gray-800'
//                            }`}>
//                              {natalChart.moon.dignity}
//                            </span>
//                          </div>
//                          <div className="space-y-2">
//                            <div className="flex justify-between items-center">
//                              <span className="text-sm font-medium text-slate-700">Position:</span>
//                              <span className="text-sm font-bold text-slate-900">{natalChart.moon.sign} {natalChart.moon.degree.toFixed(1)}°</span>
//                            </div>
//                            <div className="flex justify-between items-center">
//                              <span className="text-sm font-medium text-slate-700">House:</span>
//                              <span className="text-sm font-bold text-slate-900">{natalChart.moon.house}</span>
//                            </div>
//                          </div>
//                        </div>
//                      )}
                    
//                                          {natalChart.ascendant && (
//                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
//                          <div className="flex items-center justify-between mb-4">
//                            <div className="flex items-center space-x-3">
//                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
//                                <span className="text-2xl">🌅</span>
//                              </div>
//                              <div>
//                                <div className="font-bold text-blue-800 text-lg">Ascendant</div>
//                                <div className="text-xs text-blue-600 font-medium">Rising Sign</div>
//                              </div>
//                            </div>
//                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
//                              Rising
//                            </span>
//                          </div>
//                          <div className="space-y-2">
//                            <div className="flex justify-between items-center">
//                              <span className="text-sm font-medium text-slate-700">Position:</span>
//                              <span className="text-sm font-bold text-slate-900">{natalChart.ascendant.sign} {natalChart.ascendant.degree.toFixed(1)}°</span>
//                            </div>
//                            <div className="flex justify-between items-center">
//                              <span className="text-sm font-medium text-slate-700">House:</span>
//                              <span className="text-sm font-bold text-slate-900">1st House Cusp</span>
//                            </div>
//                          </div>
//                        </div>
//                      )}
//                   </div>
//                 </div>
//               </div>

//                              {/* Professional Aspects Section */}
//                {natalChart.aspects && natalChart.aspects.length > 0 && (
//                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
//                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-slate-200">
//                      <h4 className="text-2xl font-bold text-slate-900 flex items-center">
//                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
//                          <GiSparkles className="text-white" />
//                        </div>
//                        Planetary Aspects & Relationships
//                    </h4>
//                    <p className="text-slate-600 mt-2">Harmonic and challenging planetary connections</p>
//                  </div>
//                  <div className="p-8">
//                    <div className="grid md:grid-cols-2 gap-6">
//                                              {natalChart.aspects.slice(0, 6).map((aspect, index) => (
//                          <div 
//                            key={index}
//                            className={`rounded-xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 ${
//                              aspect.isHarmonious 
//                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
//                                : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
//                            }`}
//                          >
//                            <div className="flex items-center justify-between mb-4">
//                              <div className="flex items-center space-x-3">
//                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
//                                  aspect.isHarmonious ? 'bg-green-100' : 'bg-red-100'
//                                }`}>
//                                  <span className={`text-xl font-bold ${
//                                    aspect.isHarmonious ? 'text-green-600' : 'text-red-600'
//                                  }`}>
//                                    {aspect.type === 'Conjunction' ? '☌' : 
//                                     aspect.type === 'Sextile' ? '⚹' : 
//                                     aspect.type === 'Square' ? '□' : 
//                                     aspect.type === 'Trine' ? '△' : 
//                                     aspect.type === 'Opposition' ? '☍' : '⚻'}
//                                  </span>
//                                </div>
//                                <div>
//                                  <div className="font-bold text-slate-800 text-lg">{aspect.planet1} {aspect.type} {aspect.planet2}</div>
//                                  <div className={`text-sm font-medium ${
//                                    aspect.isHarmonious ? 'text-green-600' : 'text-red-600'
//                                  }`}>
//                                    {aspect.isHarmonious ? 'Harmonious' : 'Challenging'} Aspect
//                                  </div>
//                                </div>
//                              </div>
//                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                                aspect.isHarmonious 
//                                  ? 'bg-green-100 text-green-700' 
//                                  : 'bg-red-100 text-red-700'
//                              }`}>
//                                {aspect.orb.toFixed(1)}° orb
//                              </span>
//                            </div>
//                            <div className="text-sm text-slate-700 leading-relaxed bg-white/50 rounded-lg p-3 border border-white/50">
//                              {aspect.influence}
//                            </div>
//                          </div>
//                        ))}
//                     </div>
//                   </div>
//                 </div>
//               )}

//                              {/* Professional Action Buttons */}
//                <div className="flex flex-wrap gap-6 justify-center">
//                  <button
//                    onClick={() => setShowNatalChartDetails(!showNatalChartDetails)}
//                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl font-semibold text-lg"
//                  >
//                    <div className="flex items-center space-x-2">
//                      <GiBrain className="text-xl" />
//                      <span>{showNatalChartDetails ? 'Hide' : 'Show'} Detailed Analysis</span>
//                    </div>
//                  </button>
//                  <button
//                    onClick={() => setNatalChart(null)}
//                    className="px-8 py-4 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-300 font-semibold text-lg"
//                  >
//                    <div className="flex items-center space-x-2">
//                      <GiCrystalBall className="text-xl" />
//                      <span>Calculate New Chart</span>
//                    </div>
//                  </button>
//                </div>

//                              {/* Professional Detailed Analysis */}
//                {showNatalChartDetails && (
//                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
//                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b border-slate-200">
//                      <h4 className="text-2xl font-bold text-slate-900 flex items-center">
//                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
//                          <GiBrain className="text-white" />
//                        </div>
//                        Professional Chart Interpretation
//                    </h4>
//                    <p className="text-slate-600 mt-2">Comprehensive analysis of your astrological blueprint</p>
//                  </div>
//                  <div className="p-8 space-y-8">
//                                          {/* Professional Chart Interpretation */}
//                      <div className="grid md:grid-cols-2 gap-8">
//                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-lg">
//                          <div className="flex items-center mb-4">
//                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
//                              <span className="text-blue-600 text-lg">✨</span>
//                            </div>
//                            <h5 className="font-bold text-blue-800 text-lg">Chart Strengths</h5>
//                          </div>
//                          <ul className="space-y-3 text-sm text-slate-700">
//                            <li className="flex items-start space-x-2">
//                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
//                              <span>Strong <strong>{natalChart.sun?.sign}</strong> Sun placement indicates leadership potential</span>
//                            </li>
//                            <li className="flex items-start space-x-2">
//                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
//                              <span><strong>{natalChart.moon?.sign}</strong> Moon provides emotional intelligence and intuition</span>
//                            </li>
//                            <li className="flex items-start space-x-2">
//                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
//                              <span><strong>{natalChart.ascendant?.sign}</strong> Rising creates magnetic presence and first impressions</span>
//                            </li>
//                            <li className="flex items-start space-x-2">
//                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
//                              <span>Harmonious aspects enhance natural talents and abilities</span>
//                            </li>
//                          </ul>
//                        </div>
//                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-lg">
//                          <div className="flex items-center mb-4">
//                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
//                              <span className="text-purple-600 text-lg">🌱</span>
//                            </div>
//                            <h5 className="font-bold text-purple-800 text-lg">Growth Opportunities</h5>
//                          </div>
//                          <ul className="space-y-3 text-sm text-slate-700">
//                            <li className="flex items-start space-x-2">
//                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
//                              <span>Challenging aspects offer valuable learning opportunities</span>
//                            </li>
//                            <li className="flex items-start space-x-2">
//                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
//                              <span>House placements indicate key life focus areas</span>
//                            </li>
//                            <li className="flex items-start space-x-2">
//                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
//                              <span>Planetary dignities reveal natural abilities and challenges</span>
//                            </li>
//                            <li className="flex items-start space-x-2">
//                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
//                              <span>Integration of all chart elements creates wholeness</span>
//                            </li>
//                          </ul>
//                        </div>
//                      </div>

//                                          {/* Professional Life Path Insights */}
//                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 shadow-lg">
//                        <div className="flex items-center mb-4">
//                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
//                            <span className="text-emerald-600 text-lg">🔮</span>
//                          </div>
//                          <h5 className="font-bold text-emerald-800 text-lg">Life Path & Soul Purpose</h5>
//                        </div>
//                        <div className="text-sm text-slate-700 space-y-4 leading-relaxed">
//                          <p className="bg-white/50 rounded-lg p-4 border border-white/50">
//                            Your natal chart reveals a unique cosmic blueprint that guides your life's journey. The positions of the planets at your birth moment create a powerful energetic signature that influences your personality, relationships, and life purpose.
//                          </p>
//                          <div className="grid md:grid-cols-3 gap-4">
//                            <div className="bg-white/50 rounded-lg p-4 border border-white/50">
//                              <div className="font-semibold text-emerald-800 mb-2">Core Identity</div>
//                              <div className="text-slate-700">The <strong>{natalChart.sun?.sign}</strong> Sun represents your essential self and life purpose</div>
//                            </div>
//                            <div className="bg-white/50 rounded-lg p-4 border border-white/50">
//                              <div className="font-semibold text-emerald-800 mb-2">Emotional Nature</div>
//                              <div className="text-slate-700">The <strong>{natalChart.moon?.sign}</strong> Moon shows your inner world and emotional patterns</div>
//                            </div>
//                            <div className="bg-white/50 rounded-lg p-4 border border-white/50">
//                              <div className="font-semibold text-emerald-800 mb-2">Public Persona</div>
//                              <div className="text-slate-700">Your <strong>{natalChart.ascendant?.sign}</strong> Rising sign indicates how you present yourself to the world</div>
//                            </div>
//                          </div>
//                        </div>
//                      </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }; 