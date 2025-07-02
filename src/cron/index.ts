import { CronJob } from 'cron';
import { supabase } from '@/lib/supabaseClient';
import { logCronError, logCronInfo, logCronWarning } from '@/lib/logger';

export const initializeCronJobs = () => {
  // Daily rewards distribution - Runs every day at midnight
  new CronJob('0 0 * * *', async () => {
    try {
      await logCronInfo('dailyRewards', 'Starting daily rewards distribution');

      const { data: activeStakes, error: fetchError } = await supabase
        .from('stakes')
        .select('*')
        .eq('is_active', true);

      if (fetchError) {
        await logCronWarning('dailyRewards', 'Failed to fetch active stakes', {
          error: fetchError.message
        });
        return;
      }

      let processedCount = 0;
      let errorCount = 0;

      // Process rewards for each stake
      for (const stake of activeStakes || []) {
        try {
          let dailyRate = stake.daily_rate;
          if (stake.speed_boost_active) {
            dailyRate *= 2; // Double the rate if speed boost is active
          }

          const dailyEarning = stake.amount * dailyRate;

          // Update stake and user balance
          const { error: updateError } = await supabase.rpc('process_daily_rewards', {
            p_stake_id: stake.id,
            p_amount: dailyEarning
          });

          if (updateError) {
            throw updateError;
          }

          processedCount++;
        } catch (stakeError) {
          errorCount++;
          await logCronError('dailyRewards', stakeError, 'error', {
            stakeId: stake.id,
            userId: stake.user_id
          });
        }
      }

      await logCronInfo('dailyRewards', 'Completed daily rewards distribution', {
        totalStakes: activeStakes?.length || 0,
        processedCount,
        errorCount
      });

    } catch (error) {
      await logCronError('dailyRewards', error, 'critical');
    }
  }).start();

  // Team volume recalculation - Runs every hour
  new CronJob('0 * * * *', async () => {
    try {
      await logCronInfo('teamVolume', 'Starting team volume recalculation');

      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('id');

      if (fetchError) {
        await logCronWarning('teamVolume', 'Failed to fetch users', {
          error: fetchError.message
        });
        return;
      }

      let processedCount = 0;
      let errorCount = 0;

      for (const user of users || []) {
        try {
          const { error: updateError } = await supabase.rpc('recalculate_team_volume', {
            p_user_id: user.id
          });

          if (updateError) throw updateError;
          processedCount++;
        } catch (userError) {
          errorCount++;
          await logCronError('teamVolume', userError, 'error', {
            userId: user.id
          });
        }
      }

      await logCronInfo('teamVolume', 'Completed team volume recalculation', {
        totalUsers: users?.length || 0,
        processedCount,
        errorCount
      });

    } catch (error) {
      await logCronError('teamVolume', error, 'critical');
    }
  }).start();

  // Rank updates - Runs daily at 1 AM
  new CronJob('0 1 * * *', async () => {
    try {
      await logCronInfo('rankUpdate', 'Starting rank updates');

      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('id, team_volume, total_deposit, direct_referrals, rank');

      if (fetchError) {
        await logCronWarning('rankUpdate', 'Failed to fetch users', {
          error: fetchError.message
        });
        return;
      }

      let processedCount = 0;
      let errorCount = 0;
      let rankChanges = 0;

      for (const user of users || []) {
        try {
          const { data: newRank, error: updateError } = await supabase.rpc('calculate_user_rank', {
            p_user_id: user.id
          });

          if (updateError) throw updateError;
          if (newRank !== user.rank) rankChanges++;
          processedCount++;
        } catch (userError) {
          errorCount++;
          await logCronError('rankUpdate', userError, 'error', {
            userId: user.id
          });
        }
      }

      await logCronInfo('rankUpdate', 'Completed rank updates', {
        totalUsers: users?.length || 0,
        processedCount,
        errorCount,
        rankChanges
      });

    } catch (error) {
      await logCronError('rankUpdate', error, 'critical');
    }
  }).start();

  // User activity monitoring - Runs every 15 minutes
  new CronJob('*/15 * * * *', async () => {
    try {
      await logCronInfo('activityMonitor', 'Starting activity monitoring');

      // Clean up inactive sessions
      const { error: cleanupError } = await supabase.rpc('cleanup_inactive_sessions');

      if (cleanupError) {
        await logCronWarning('activityMonitor', 'Failed to cleanup sessions', {
          error: cleanupError.message
        });
      }

      // Monitor for suspicious activity
      const { data: suspiciousActivity, error: monitorError } = await supabase.rpc('check_suspicious_activity');

      if (monitorError) {
        await logCronError('activityMonitor', monitorError, 'warning');
      } else if (suspiciousActivity && suspiciousActivity.length > 0) {
        await logCronWarning('activityMonitor', 'Suspicious activity detected', {
          activities: suspiciousActivity
        });
      }

      await logCronInfo('activityMonitor', 'Completed activity monitoring');

    } catch (error) {
      await logCronError('activityMonitor', error, 'critical');
    }
  }).start();
}; 