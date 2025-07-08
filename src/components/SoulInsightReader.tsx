// import React, { useState, useEffect } from 'react';
// import { GiCrystalBall, GiStarsStack, GiMoon, GiSparkles, GiHearts, GiBrain, GiSpiralArrow } from 'react-icons/gi';
// import { BsLightning, BsEye, BsHeart, BsGem } from 'react-icons/bs';
// import { MdFavorite, MdFavoriteBorder, MdPsychology, MdAutoAwesome } from 'react-icons/md';
// import { calculatePlanetaryPositions, calculateAspects, generateSoulInsight, AdvancedChart, SoulInsight } from '../lib/astrologicalEngine';

// interface SoulInsightReaderProps {
//   birthDate: string;
//   birthTime: string;
//   latitude?: number;
//   longitude?: number;
// }

// export const SoulInsightReader: React.FC<SoulInsightReaderProps> = ({
//   birthDate,
//   birthTime,
//   latitude = 0,
//   longitude = 0
// }) => {
//   const [chart, setChart] = useState<Partial<AdvancedChart> | null>(null);
//   const [soulInsight, setSoulInsight] = useState<SoulInsight | null>(null);
//   const [isCalculating, setIsCalculating] = useState(false);
//   const [selectedInsight, setSelectedInsight] = useState<'purpose' | 'karma' | 'gifts' | 'shadow' | 'evolution' | 'past' | 'future'>('purpose');
//   const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

//   useEffect(() => {
//     if (birthDate && birthTime) {
//       calculateSoulInsight();
//     }
//   }, [birthDate, birthTime, latitude, longitude]);

//   const calculateSoulInsight = async () => {
//     setIsCalculating(true);
    
//     try {
//       // Simulate calculation time for better UX
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       const planetaryPositions = calculatePlanetaryPositions(
//         new Date(birthDate), 
//         birthTime, 
//         latitude, 
//         longitude
//       );
      
//       const aspects = calculateAspects(planetaryPositions);
//       const soulInsightData = generateSoulInsight(planetaryPositions);
      
//       setChart({ ...planetaryPositions, aspects });
//       setSoulInsight(soulInsightData);
//     } catch (error) {
//       console.error('Error calculating soul insight:', error);
//     } finally {
//       setIsCalculating(false);
//     }
//   };

//   const getInsightIcon = (type: string) => {
//     switch (type) {
//       case 'purpose': return <GiCrystalBall className="text-purple-500" />;
//       case 'karma': return <GiSpiralArrow className="text-blue-500" />;
//       case 'gifts': return <BsGem className="text-yellow-500" />;
//       case 'shadow': return <MdPsychology className="text-red-500" />;
//       case 'evolution': return <GiBrain className="text-green-500" />;
//       case 'past': return <BsEye className="text-indigo-500" />;
//       case 'future': return <MdAutoAwesome className="text-pink-500" />;
//       default: return <GiStarsStack className="text-gray-500" />;
//     }
//   };

//   const getInsightTitle = (type: string) => {
//     switch (type) {
//       case 'purpose': return 'Soul Purpose';
//       case 'karma': return 'Karmic Lessons';
//       case 'gifts': return 'Spiritual Gifts';
//       case 'shadow': return 'Shadow Work';
//       case 'evolution': return 'Soul Evolution';
//       case 'past': return 'Past Life Indicators';
//       case 'future': return 'Future Potential';
//       default: return 'Soul Insight';
//     }
//   };

//   const getInsightDescription = (type: string) => {
//     switch (type) {
//       case 'purpose': return 'Your divine mission and life purpose';
//       case 'karma': return 'Lessons you are here to learn and master';
//       case 'gifts': return 'Natural abilities and spiritual talents';
//       case 'shadow': return 'Areas for healing and transformation';
//       case 'evolution': return 'Your soul\'s current growth path';
//       case 'past': return 'Signs of past life experiences';
//       case 'future': return 'Your highest potential and destiny';
//       default: return 'Deep soul insights';
//     }
//   };

//   if (isCalculating) {
//     return (
//       <div className="bg-gradient-to-br from-purple-100/95 via-indigo-50/90 to-pink-100/95 rounded-xl p-8 border-2 border-purple-300 backdrop-blur-sm shadow-xl text-center">
//         <div className="flex items-center justify-center mb-6">
//           <div className="relative">
//             <GiCrystalBall className="text-6xl text-purple-600 animate-pulse" />
//             <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
//           </div>
//         </div>
//         <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
//           Reading Your Soul Blueprint
//         </h3>
//         <div className="flex items-center justify-center space-x-2">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
//           <span className="text-purple-700 font-medium">Connecting with the cosmic energies...</span>
//         </div>
//         <div className="mt-6 text-sm text-purple-600">
//           Analyzing planetary alignments and soul patterns
//         </div>
//       </div>
//     );
//   }

//   if (!soulInsight || !chart) {
//     return null;
//   }

//   return (
//     <div className="space-y-6">
//       {/* Main Soul Insight Display */}
//       <div className="bg-gradient-to-br from-purple-100/95 via-indigo-50/90 to-pink-100/95 rounded-xl p-6 border-2 border-purple-300 backdrop-blur-sm shadow-xl">
//         <div className="text-center mb-8">
//           <div className="relative inline-block mb-4">
//             <GiCrystalBall className="text-6xl text-purple-600 animate-pulse" />
//             <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
//           </div>
//           <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
//             Your Soul Blueprint
//           </h2>
//           <p className="text-purple-700 text-lg">Discover your divine purpose and spiritual path</p>
//         </div>

//         {/* Insight Navigation */}
//         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
//           {(['purpose', 'karma', 'gifts', 'shadow', 'evolution', 'past', 'future'] as const).map((insight) => (
//             <button
//               key={insight}
//               onClick={() => setSelectedInsight(insight)}
//               className={`p-3 rounded-lg transition-all duration-300 ${
//                 selectedInsight === insight
//                   ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
//                   : 'bg-gradient-to-r from-purple-50/90 to-pink-50/90 text-purple-700 border-2 border-purple-200 hover:from-purple-100 hover:to-pink-100 hover:scale-105'
//               }`}
//             >
//               <div className="text-2xl mb-1">{getInsightIcon(insight)}</div>
//               <div className="text-xs font-semibold">{getInsightTitle(insight)}</div>
//             </button>
//           ))}
//         </div>

//         {/* Selected Insight Content */}
//         <div className="bg-gradient-to-br from-white/90 to-purple-50/90 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
//           <div className="flex items-center mb-4">
//             <div className="text-3xl mr-3">{getInsightIcon(selectedInsight)}</div>
//             <div>
//               <h3 className="text-xl font-bold text-purple-800">{getInsightTitle(selectedInsight)}</h3>
//               <p className="text-sm text-purple-600">{getInsightDescription(selectedInsight)}</p>
//             </div>
//           </div>

//           <div className="space-y-4">
//             {selectedInsight === 'purpose' && (
//               <div className="space-y-4">
//                 <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
//                   <h4 className="font-semibold text-purple-800 mb-2">Life Path</h4>
//                   <p className="text-gray-700 leading-relaxed">{soulInsight.lifePath}</p>
//                 </div>
//                 <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
//                   <h4 className="font-semibold text-purple-800 mb-2">Soul Purpose</h4>
//                   <p className="text-gray-700 leading-relaxed">{soulInsight.soulPurpose}</p>
//                 </div>
//               </div>
//             )}

//             {selectedInsight === 'karma' && (
//               <div className="space-y-3">
//                 <h4 className="font-semibold text-purple-800 mb-3">Karmic Lessons to Master</h4>
//                 {soulInsight.karmicLessons.map((lesson, index) => (
//                   <div key={index} className="flex items-start space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
//                     <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
//                     <p className="text-gray-700">{lesson}</p>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {selectedInsight === 'gifts' && (
//               <div className="space-y-3">
//                 <h4 className="font-semibold text-purple-800 mb-3">Your Spiritual Gifts</h4>
//                 {soulInsight.spiritualGifts.map((gift, index) => (
//                   <div key={index} className="flex items-start space-x-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
//                     <BsGem className="text-yellow-600 mt-1 flex-shrink-0" />
//                     <p className="text-gray-700">{gift}</p>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {selectedInsight === 'shadow' && (
//               <div className="space-y-3">
//                 <h4 className="font-semibold text-purple-800 mb-3">Shadow Work Areas</h4>
//                 {soulInsight.shadowWork.map((shadow, index) => (
//                   <div key={index} className="flex items-start space-x-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3 border border-red-200">
//                     <MdPsychology className="text-red-600 mt-1 flex-shrink-0" />
//                     <p className="text-gray-700">{shadow}</p>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {selectedInsight === 'evolution' && (
//               <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
//                 <h4 className="font-semibold text-purple-800 mb-2">Soul Evolution Path</h4>
//                 <p className="text-gray-700 leading-relaxed">{soulInsight.soulEvolution}</p>
//               </div>
//             )}

//             {selectedInsight === 'past' && (
//               <div className="space-y-3">
//                 <h4 className="font-semibold text-purple-800 mb-3">Past Life Indicators</h4>
//                 {soulInsight.pastLifeIndicators.map((indicator, index) => (
//                   <div key={index} className="flex items-start space-x-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
//                     <BsEye className="text-indigo-600 mt-1 flex-shrink-0" />
//                     <p className="text-gray-700">{indicator}</p>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {selectedInsight === 'future' && (
//               <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
//                 <h4 className="font-semibold text-purple-800 mb-2">Future Potential</h4>
//                 <p className="text-gray-700 leading-relaxed">{soulInsight.futurePotential}</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Advanced Analysis Toggle */}
//         <div className="mt-6 text-center">
//           <button
//             onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
//             className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg transform hover:scale-105"
//           >
//             {showDetailedAnalysis ? 'Hide' : 'Show'} Advanced Analysis
//           </button>
//         </div>
//       </div>

//       {/* Advanced Analysis Section */}
//       {showDetailedAnalysis && (
//         <div className="bg-gradient-to-br from-indigo-100/95 via-purple-50/90 to-blue-100/95 rounded-xl p-6 border-2 border-indigo-300 backdrop-blur-sm shadow-xl">
//           <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 mb-6 text-center">
//             Advanced Soul Analysis
//           </h3>

//           {/* Planetary Positions */}
//           <div className="grid md:grid-cols-2 gap-6 mb-8">
//             <div className="bg-gradient-to-br from-yellow-50/90 to-orange-50/90 rounded-lg p-4 border-2 border-yellow-300 shadow-lg">
//               <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
//                 <GiMoon className="mr-2" />
//                 Planetary Positions
//               </h4>
//               <div className="space-y-2">
//                 {chart.sun && (
//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium">Sun:</span>
//                     <span>{chart.sun.sign} {chart.sun.degree.toFixed(1)}° (House {chart.sun.house})</span>
//                   </div>
//                 )}
//                 {chart.moon && (
//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium">Moon:</span>
//                     <span>{chart.moon.sign} {chart.moon.degree.toFixed(1)}° (House {chart.moon.house})</span>
//                   </div>
//                 )}
//                 {chart.ascendant && (
//                   <div className="flex justify-between text-sm">
//                     <span className="font-medium">Ascendant:</span>
//                     <span>{chart.ascendant.sign} {chart.ascendant.degree.toFixed(1)}°</span>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Aspects */}
//             <div className="bg-gradient-to-br from-purple-50/90 to-pink-50/90 rounded-lg p-4 border-2 border-purple-300 shadow-lg">
//               <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
//                 <GiStarsStack className="mr-2" />
//                 Key Aspects
//               </h4>
//               <div className="space-y-2">
//                 {chart.aspects && chart.aspects.slice(0, 5).map((aspect, index) => (
//                   <div key={index} className="flex justify-between text-sm">
//                     <span className="font-medium">{aspect.planet1}-{aspect.planet2}:</span>
//                     <span className={`${aspect.isHarmonious ? 'text-green-600' : 'text-red-600'}`}>
//                       {aspect.type} ({aspect.orb.toFixed(1)}°)
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Soul Integration Guidance */}
//           <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/90 rounded-lg p-6 border-2 border-emerald-300 shadow-lg">
//             <h4 className="font-semibold text-emerald-800 mb-4 flex items-center">
//               <GiBrain className="mr-2" />
//               Soul Integration Guidance
//             </h4>
//             <div className="grid md:grid-cols-2 gap-4">
//               <div>
//                 <h5 className="font-medium text-emerald-700 mb-2">Daily Practices</h5>
//                 <ul className="space-y-1 text-sm text-gray-700">
//                   <li>• Meditate on your soul purpose for 10 minutes daily</li>
//                   <li>• Practice gratitude for your spiritual gifts</li>
//                   <li>• Journal about your karmic lessons</li>
//                   <li>• Work with your shadow aspects through self-reflection</li>
//                 </ul>
//               </div>
//               <div>
//                 <h5 className="font-medium text-emerald-700 mb-2">Integration Tips</h5>
//                 <ul className="space-y-1 text-sm text-gray-700">
//                   <li>• Trust your intuition and inner guidance</li>
//                   <li>• Embrace challenges as growth opportunities</li>
//                   <li>• Connect with like-minded spiritual seekers</li>
//                   <li>• Practice self-compassion and patience</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }; 