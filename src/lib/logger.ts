import { supabase } from './supabaseClient';

interface CronLogEntry {
  job_name: string;
  error_message: string;
  stack_trace?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  additional_data?: Record<string, any>;
}

export const logCronError = async (
  jobName: string, 
  error: any, 
  severity: CronLogEntry['severity'] = 'error',
  additionalData?: Record<string, any>
) => {
  try {
    const logEntry: CronLogEntry = {
      job_name: jobName,
      error_message: error.message || String(error),
      stack_trace: error.stack,
      timestamp: new Date().toISOString(),
      severity,
      additional_data: additionalData
    };

    const { error: insertError } = await supabase
      .from('cron_logs')
      .insert([logEntry]);

    if (insertError) {
      // Fallback to console logging if database insert fails
      console.error('Failed to log to database:', insertError);
      console.error('Original error:', {
        jobName,
        error,
        severity,
        additionalData
      });
    }

    // For critical errors, you might want to implement additional notification logic
    if (severity === 'critical') {
      // TODO: Implement notification system (e.g., email, Telegram, etc.)
      console.error('CRITICAL ERROR:', logEntry);
    }

  } catch (loggingError) {
    // Fallback logging if everything fails
    console.error('Logging system failure:', loggingError);
    console.error('Original error:', {
      jobName,
      error,
      severity,
      additionalData
    });
  }
};

// Utility function for info logs
export const logCronInfo = async (
  jobName: string,
  message: string,
  additionalData?: Record<string, any>
) => {
  await logCronError(jobName, { message }, 'info', additionalData);
};

// Utility function for warning logs
export const logCronWarning = async (
  jobName: string,
  message: string,
  additionalData?: Record<string, any>
) => {
  await logCronError(jobName, { message }, 'warning', additionalData);
}; 