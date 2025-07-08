// import React, { useState, useEffect } from 'react';
// import { GiMoon, GiStarsStack, GiCrystalBall, GiSparkles, GiHearts, GiBrain, GiSpiralArrow } from 'react-icons/gi';
// import { BsClock, BsGem, BsEye, BsArrowClockwise } from 'react-icons/bs';
// import { MdAutoAwesome, MdPsychology, MdFavorite } from 'react-icons/md';
// import { getRealTimeData, generateDetailedCosmicWeather, generatePersonalizedSpiritualFocus, calculateTransits } from '../lib/astrologicalEngine';

// interface RealTimeCosmicInsightsProps {
//   userChart?: any;
//   userLocation?: { lat: number; lon: number };
// }

// export const RealTimeCosmicInsights: React.FC<RealTimeCosmicInsightsProps> = ({ userChart, userLocation }) => {
//   const [realTimeData, setRealTimeData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [userTransits, setUserTransits] = useState<any[]>([]);
//   const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

//   useEffect(() => {
//     fetchRealTimeData();
//     const interval = setInterval(fetchRealTimeData, 5 * 60 * 1000); // Update every 5 minutes
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     if (userChart && realTimeData) {
//       calculateUserTransits();
//     }
//   }, [userChart, realTimeData]);

//   const fetchRealTimeData = async () => {
//     try {
//       setLoading(true);
//       const data = await getRealTimeData();
//       setRealTimeData(data);
//       setLastUpdate(new Date());
//       setError(null);
//     } catch (err) {
//       setError('Failed to fetch real-time cosmic data');
//       console.error('Error fetching real-time data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateUserTransits = () => {
//     if (userChart) {
//       const transits = calculateTransits(userChart);
//       setUserTransits(transits.slice(0, 5)); // Show top 5 transits
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-gradient-to-br from-purple-100/95 via-indigo-50/90 to-pink-100/95 rounded-xl p-8 border-2 border-purple-300 backdrop-blur-sm shadow-xl text-center">
//         <div className="flex items-center justify-center mb-6">
//           <div className="relative">
//             <GiCrystalBall className="text-6xl text-purple-600 animate-pulse" />
//             <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
//           </div>
//         </div>
//         <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
//           Connecting to Cosmic Energies
//         </h3>
//         <p className="text-purple-700 text-lg">
//           Fetching real-time planetary positions and cosmic weather...
//         </p>
//         <div className="mt-6">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-gradient-to-br from-red-100/95 via-orange-50/90 to-yellow-100/95 rounded-xl p-8 border-2 border-red-300 backdrop-blur-sm shadow-xl text-center">
//         <div className="flex items-center justify-center mb-6">
//           <GiCrystalBall className="text-6xl text-red-600" />
//         </div>
//         <h3 className="text-2xl font-bold text-red-800 mb-4">
//           Connection Error
//         </h3>
//         <p className="text-red-700 text-lg mb-6">
//           {error}
//         </p>
//         <button
//           onClick={fetchRealTimeData}
//           className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center space-x-2 mx-auto"
//         >
//           <BsArrowClockwise className="text-lg" />
//           <span>Retry Connection</span>
//         </button>
//       </div>
//     );
//   }

//   if (!realTimeData) {
//     return null;
//   }

//   const cosmicWeather = generateDetailedCosmicWeather(
//     realTimeData.currentAspects,
//     realTimeData.moonPhase,
//     realTimeData.retrogrades
//   );

//   const spiritualFocus = generatePersonalizedSpiritualFocus(
//     realTimeData.currentAspects,
//     realTimeData.moonPhase,
//     realTimeData.retrogrades,
//     userChart
//   );

//   return (
//     <div className="space-y-8">
//       {/* Header */}
//       <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 rounded-2xl p-8 text-white text-center shadow-2xl border border-purple-700">
//         <div className="flex items-center justify-center mb-4">
//           <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl mr-4">
//             <GiCrystalBall className="text-2xl text-white" />
//           </div>
//           <div>
//             <h3 className="text-4xl font-bold mb-2 tracking-tight">Real-Time Cosmic Insights</h3>
//             <p className="text-purple-300 text-lg">Live Planetary Positions & Spiritual Guidance</p>
//           </div>
//         </div>
//         <div className="bg-purple-800/50 rounded-xl p-4 border border-purple-600">
//           <div className="grid md:grid-cols-3 gap-4 text-sm">
//             <div className="flex items-center justify-center space-x-2">
//               <BsClock className="text-purple-400" />
//               <span className="text-purple-300">Last Updated: {lastUpdate.toLocaleTimeString()}</span>
//             </div>
//             <div className="flex items-center justify-center space-x-2">
//               <GiMoon className="text-purple-400" />
//               <span className="text-purple-300">Moon Phase: {realTimeData.moonPhase}</span>
//             </div>
//             <div className="flex items-center justify-center space-x-2">
//               <GiStarsStack className="text-purple-400" />
//               <span className="text-purple-300">{realTimeData.currentAspects.length} Active Aspects</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Cosmic Weather */}
//       <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
//         <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-slate-200">
//           <h4 className="text-2xl font-bold text-slate-900 flex items-center">
//             <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
//               <GiSparkles className="text-white" />
//             </div>
//             Current Cosmic Weather
//           </h4>
//           <p className="text-slate-600 mt-2">Real-time analysis of current planetary energies</p>
//         </div>
//         <div className="p-8">
//           <div className="prose prose-lg max-w-none">
//             <div className="whitespace-pre-line text-slate-700 leading-relaxed">
//               {cosmicWeather}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Current Planetary Positions */}
//       <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
//         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-slate-200">
//           <h4 className="text-2xl font-bold text-slate-900 flex items-center">
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
//               <GiStarsStack className="text-white" />
//             </div>
//             Current Planetary Positions
//           </h4>
//           <p className="text-slate-600 mt-2">Live positions of all major planets</p>
//         </div>
//         <div className="p-8">
//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {Object.entries(realTimeData.currentPlanets).map(([planet, data]: [string, any]) => (
//               <div key={planet} className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center space-x-3">
//                     <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
//                       <span className="text-2xl">
//                         {planet === 'Sun' ? '☀️' : 
//                          planet === 'Moon' ? '🌙' : 
//                          planet === 'Mercury' ? '☿' : 
//                          planet === 'Venus' ? '♀' : 
//                          planet === 'Mars' ? '♂' : 
//                          planet === 'Jupiter' ? '♃' : 
//                          planet === 'Saturn' ? '♄' : 
//                          planet === 'Uranus' ? '♅' : 
//                          planet === 'Neptune' ? '♆' : 
//                          planet === 'Pluto' ? '♇' : '⭐'}
//                       </span>
//                     </div>
//                     <div>
//                       <div className="font-bold text-slate-800 text-lg">{planet}</div>
//                       <div className="text-xs text-slate-600 font-medium">{data.sign}</div>
//                     </div>
//                   </div>
//                   {data.isRetrograde && (
//                     <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
//                       Retrograde
//                     </span>
//                   )}
//                 </div>
//                 <div className="space-y-2">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-slate-700">Position:</span>
//                     <span className="text-sm font-bold text-slate-900">{data.sign} {data.degree.toFixed(1)}°</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-slate-700">Dignity:</span>
//                     <span className={`px-2 py-1 rounded text-xs font-semibold ${
//                       data.dignity === 'Domicile' ? 'bg-green-100 text-green-700' :
//                       data.dignity === 'Exaltation' ? 'bg-blue-100 text-blue-700' :
//                       data.dignity === 'Detriment' ? 'bg-red-100 text-red-700' :
//                       data.dignity === 'Fall' ? 'bg-orange-100 text-orange-700' :
//                       'bg-gray-100 text-gray-700'
//                     }`}>
//                       {data.dignity}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* User's Current Transits */}
//       {userChart && userTransits.length > 0 && (
//         <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
//           <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-8 py-6 border-b border-slate-200">
//             <h4 className="text-2xl font-bold text-slate-900 flex items-center">
//               <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
//                 <GiHearts className="text-white" />
//               </div>
//               Your Current Transits
//             </h4>
//             <p className="text-slate-600 mt-2">How current planetary movements affect your chart</p>
//           </div>
//           <div className="p-8">
//             <div className="grid md:grid-cols-2 gap-6">
//               {userTransits.map((transit, index) => (
//                 <div 
//                   key={index}
//                   className={`rounded-xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 ${
//                     transit.isHarmonious 
//                       ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
//                       : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
//                   }`}
//                 >
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex items-center space-x-3">
//                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
//                         transit.isHarmonious ? 'bg-green-100' : 'bg-red-100'
//                       }`}>
//                         <span className={`text-xl font-bold ${
//                           transit.isHarmonious ? 'text-green-600' : 'text-red-600'
//                         }`}>
//                           {transit.type === 'Conjunction' ? '☌' : 
//                            transit.type === 'Sextile' ? '⚹' : 
//                            transit.type === 'Square' ? '□' : 
//                            transit.type === 'Trine' ? '△' : 
//                            transit.type === 'Opposition' ? '☍' : '⚻'}
//                         </span>
//                       </div>
//                       <div>
//                         <div className="font-bold text-slate-800 text-lg">{transit.planet} {transit.type} {transit.aspecting}</div>
//                         <div className={`text-sm font-medium ${
//                           transit.isHarmonious ? 'text-green-600' : 'text-red-600'
//                         }`}>
//                           {transit.intensity} Intensity
//                         </div>
//                       </div>
//                     </div>
//                     <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                       transit.intensity === 'High' 
//                         ? 'bg-red-100 text-red-700' 
//                         : transit.intensity === 'Medium'
//                         ? 'bg-yellow-100 text-yellow-700'
//                         : 'bg-green-100 text-green-700'
//                     }`}>
//                       {transit.orb.toFixed(1)}° orb
//                     </span>
//                   </div>
//                   <div className="text-sm text-slate-700 leading-relaxed bg-white/50 rounded-lg p-3 border border-white/50">
//                     {transit.influence}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Spiritual Focus */}
//       <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
//         <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b border-slate-200">
//           <h4 className="text-2xl font-bold text-slate-900 flex items-center">
//             <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
//               <GiBrain className="text-white" />
//             </div>
//             Personalized Spiritual Focus
//           </h4>
//           <p className="text-slate-600 mt-2">Tailored guidance for your spiritual journey</p>
//         </div>
//         <div className="p-8">
//           <div className="prose prose-lg max-w-none">
//             <div className="whitespace-pre-line text-slate-700 leading-relaxed">
//               {spiritualFocus}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="flex flex-wrap gap-6 justify-center">
//         <button
//           onClick={fetchRealTimeData}
//           className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-700 transition-all duration-300 shadow-xl font-semibold text-lg flex items-center space-x-2"
//         >
//           <BsArrowClockwise className="text-xl" />
//           <span>Refresh Cosmic Data</span>
//         </button>
//         <button
//           className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl font-semibold text-lg flex items-center space-x-2"
//         >
//           <MdFavorite className="text-xl" />
//           <span>Save Insights</span>
//         </button>
//       </div>
//     </div>
//   );
// }; 