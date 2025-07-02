// import React, { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabaseClient';
// import { useTonConnectUI } from '@tonconnect/ui-react';
// import { useAuth } from '@/hooks/useAuth';

// interface Task {
//   id: number;
//   title: string;
//   description: string;
//   reward: number;
//   reward_type: 'TON' | 'STK';
//   difficulty: 'Easy' | 'Medium' | 'Hard';
//   status: 'available' | 'completed' | 'locked';
//   requirements?: {
//     min_stake?: number;
//     min_earnings?: number;
//     min_referrals?: number;
//     login_days?: number;
//     boost_days?: number;
//     rank?: string;
//     referral_min_stake?: number;
//     reinvestment_count?: number;
//     min_reinvestment?: number;
//     roi_percentage?: number;
//     team_volume?: number;
//     stake_days?: number;
//   };
// }

// const claimTaskReward = async (task: Task, userId: number, tonConnectUI: any, updateUserData: () => Promise<void>) => {
//   try {
//     // Check if task was already completed
//     const { data: existingTask } = await supabase
//       .from('completed_tasks')
//       .select('id')
//       .eq('user_id', userId)
//       .eq('task_id', task.id)
//       .single();

//     if (existingTask) {
//       return false; // Task already completed
//     }

//     // Get user data for requirement checks
//     const { data: userData } = await supabase
//       .from('users')
//       .select(`
//         stake,
//         total_earned,
//         rank,
//         referral_count,
//         boost_active_since,
//         login_streak,
//         reinvestment_count,
//         team_volume
//       `)
//       .eq('id', userId)
//       .single();

//     if (!userData) return false;

//     // Check task requirements
//     if (task.requirements) {
//       // Check minimum stake
//       if (task.requirements.min_stake && userData.stake < task.requirements.min_stake) {
//         return false;
//       }

//       // Check minimum earnings
//       if (task.requirements.min_earnings && userData.total_earned < task.requirements.min_earnings) {
//         return false;
//       }

//       // Check rank requirement
//       if (task.requirements.rank && userData.rank !== task.requirements.rank) {
//         return false;
//       }

//       // Check referral requirements
//       if (task.requirements.min_referrals && userData.referral_count < task.requirements.min_referrals) {
//         return false;
//       }

//       // Check boost days
//       if (task.requirements.boost_days && (!userData.boost_active_since || 
//           daysBetween(new Date(userData.boost_active_since), new Date()) < task.requirements.boost_days)) {
//         return false;
//       }

//       // Check login streak
//       if (task.requirements.login_days && userData.login_streak < task.requirements.login_days) {
//         return false;
//       }

//       // Check reinvestment count
//       if (task.requirements.reinvestment_count && userData.reinvestment_count < task.requirements.reinvestment_count) {
//         return false;
//       }

//       // Check team volume
//       if (task.requirements.team_volume && userData.team_volume < task.requirements.team_volume) {
//         return false;
//       }
//     }

//     // Process reward
//     if (task.reward_type === 'STK') {
//       const { error } = await supabase.rpc('claim_task_reward', {
//         p_user_id: userId,
//         p_task_id: task.id,
//         p_reward_amount: task.reward,
//         p_reward_type: task.reward_type
//       });

//       if (error) throw error;
//     } else {
//       // TON rewards need to be processed differently (e.g., through smart contract)
//       // Implement TON reward distribution here
//     }

//     // Refresh user data
//     await updateUserData();
//     return true;
//   } catch (error) {
//     console.error('Error claiming reward:', error);
//     return false;
//   }
// };

// // Helper function to calculate days between dates
// const daysBetween = (date1: Date, date2: Date) => {
//   const oneDay = 24 * 60 * 60 * 1000;
//   return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
// };

// export const TaskSystem = () => {
//   const { user } = useAuth();
//   const [tonConnectUI] = useTonConnectUI();
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     fetchTasks();
//   }, []);

//   const fetchTasks = async () => {
//     try {
//       setIsLoading(true);
//       const isWalletConnected = Boolean(tonConnectUI.account);
      
//       // Get all tasks from database
//       const { data: dbTasks, error: tasksError } = await supabase
//         .from('tasks')
//         .select('*');

//       if (tasksError) throw tasksError;

//       // Get completed tasks for the user
//       const { data: completedTasks } = await supabase
//         .from('completed_tasks')
//         .select('task_id')
//         .eq('user_id', user?.id);

//       const completedTaskIds = new Set(completedTasks?.map(task => task.task_id) || []);
      
//       const updatedTasks = (dbTasks || []).map(task => {
//         if (task.id === 1) { // Wallet connection task
//           return {
//             ...task,
//             status: isWalletConnected || completedTaskIds.has(task.id) 
//               ? 'completed' as const 
//               : 'available' as const
//           };
//         }
//         return {
//           ...task,
//           status: completedTaskIds.has(task.id) 
//             ? 'completed' as const 
//             : task.status
//         };
//       });

//       setTasks(updatedTasks);
//     } catch (error) {
//       console.error('Error fetching tasks:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Re-check tasks when wallet connection changes
//   useEffect(() => {
//     fetchTasks();
//   }, [tonConnectUI.account]);

//   const getDifficultyColor = (difficulty: Task['difficulty']) => {
//     switch (difficulty) {
//       case 'Easy': return 'text-green-400 bg-green-500/20';
//       case 'Medium': return 'text-yellow-400 bg-yellow-500/20';
//       case 'Hard': return 'text-red-400 bg-red-500/20';
//       default: return 'text-white/60 bg-white/10';
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center py-8">
//         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <h2 className="text-xl font-semibold text-white">Onchain Tasks</h2>
//         <div className="text-sm text-white/60">
//           Complete tasks to earn rewards
//         </div>
//       </div>

//       {/* Task Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {tasks.map((task) => (
//           <div 
//             key={task.id}
//             className={`bg-[#1A1B1E] rounded-xl border border-white/5 p-4 ${
//               task.status === 'locked' ? 'opacity-50' : ''
//             }`}
//           >
//             <div className="flex items-start justify-between">
//               <div>
//                 <h3 className="text-lg font-medium text-white mb-1">{task.title}</h3>
//                 <p className="text-sm text-white/60 mb-3">{task.description}</p>
//               </div>
//               <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
//                 {task.difficulty}
//               </div>
//             </div>

//             <div className="flex items-center justify-between mt-4">
//               <div className="flex items-center gap-3">
//                 <div className="flex items-center gap-1">
//                   <span className="text-sm font-medium text-white">{task.reward}</span>
//                   <span className="text-xs text-white/60">{task.reward_type}</span>
//                 </div>
//                 {task.requirements && (
//                   <div className="text-xs text-white/40">
//                     {task.requirements.min_stake && `Min Stake: ${task.requirements.min_stake} TON`}
//                     {task.requirements.rank && `Rank: ${task.requirements.rank}`}
//                   </div>
//                 )}
//               </div>

//               {task.status === 'completed' ? (
//                 <button
//                   onClick={async () => {
//                     if (user?.id) {
//                       const success = await claimTaskReward(task, user.id, tonConnectUI, async () => {
//                         fetchTasks();
//                       });
//                       if (success) {
//                         // Show success message or update UI
//                         setTasks(prev => prev.map(t => 
//                           t.id === task.id ? { ...t, status: 'completed' as const } : t
//                         ));
//                       }
//                     }
//                   }}
//                   className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   Claim Reward
//                 </button>
//               ) : (
//                 <button
//                   disabled={task.status !== 'available'}
//                   onClick={async () => {
//                     if (task.status === 'available' && user?.id) {
//                       const success = await claimTaskReward(task, user.id, tonConnectUI, async () => {
//                         fetchTasks();
//                       });
//                       if (success) {
//                         setTasks(prev => prev.map(t => 
//                           t.id === task.id ? { ...t, status: 'completed' as const } : t
//                         ));
//                       }
//                     }
//                   }}
//                   className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5
//                     ${task.status === 'available'
//                       ? 'bg-blue-500 hover:bg-blue-600 text-white'
//                       : 'bg-white/10 text-white/40 cursor-not-allowed'
//                     }`}
//                 >
//                   {task.status === 'available' ? 'Start Task' : 'Locked'}
//                 </button>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }; 