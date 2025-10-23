-- Security enhancements migration
-- This migration adds additional security measures to the existing schema

-- Add audit logging table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user ID
  action TEXT NOT NULL, -- 'login', 'signup', 'api_call'
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(identifier, action, window_start)
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can access rate limits (no user access)
CREATE POLICY "No user access to rate limits"
  ON public.rate_limits FOR ALL
  USING (false);

-- Add security settings table
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security settings
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage security settings
CREATE POLICY "Admins can manage security settings"
  ON public.security_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default security settings
INSERT INTO public.security_settings (setting_name, setting_value, description) VALUES
  ('max_login_attempts', '5', 'Maximum login attempts before blocking'),
  ('login_block_duration_minutes', '15', 'Duration to block user after max attempts'),
  ('session_timeout_minutes', '480', 'Session timeout duration in minutes'),
  ('require_strong_passwords', 'true', 'Require strong password policy'),
  ('enable_audit_logging', 'true', 'Enable audit logging for security events')
ON CONFLICT (setting_name) DO NOTHING;

-- Add constraints for data validation
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_full_name_length CHECK (length(full_name) >= 2 AND length(full_name) <= 100),
ADD CONSTRAINT profiles_cpf_format CHECK (cpf ~ '^\d{11}$'),
ADD CONSTRAINT profiles_email_format CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$');

ALTER TABLE public.overtime_records
ADD CONSTRAINT overtime_records_hours_positive CHECK (total_hours > 0),
ADD CONSTRAINT overtime_records_net_hours_positive CHECK (net_hours > 0),
ADD CONSTRAINT overtime_records_value_positive CHECK (total_value > 0),
ADD CONSTRAINT overtime_records_date_not_future CHECK (date <= CURRENT_DATE),
ADD CONSTRAINT overtime_records_time_order CHECK (start_time < end_time);

-- Add indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_action ON public.rate_limits(action);
CREATE INDEX IF NOT EXISTS idx_overtime_records_user_id ON public.overtime_records(user_id);
CREATE INDEX IF NOT EXISTS idx_overtime_records_date ON public.overtime_records(date);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean up old rate limit records
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - INTERVAL '1 hour';
  
  -- Get current window start
  v_window_start := date_trunc('minute', now() - INTERVAL '1 minute' * p_window_minutes);
  
  -- Get current attempts
  SELECT COALESCE(attempts, 0) INTO v_attempts
  FROM public.rate_limits
  WHERE identifier = p_identifier 
    AND action = p_action 
    AND window_start = v_window_start;
  
  -- Check if blocked
  IF v_attempts >= p_max_attempts THEN
    RETURN FALSE;
  END IF;
  
  -- Increment attempts
  INSERT INTO public.rate_limits (identifier, action, attempts, window_start)
  VALUES (p_identifier, p_action, 1, v_window_start)
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET attempts = rate_limits.attempts + 1;
  
  RETURN TRUE;
END;
$$;

-- Create function to validate user input
CREATE OR REPLACE FUNCTION public.validate_user_input(
  p_input TEXT,
  p_field_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for empty input
  IF p_input IS NULL OR trim(p_input) = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for suspicious patterns
  IF p_input ~* '<script|javascript:|on\w+\s*=|<iframe|<object|<embed' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for SQL injection patterns
  IF p_input ~* '\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for path traversal
  IF p_input ~* '\.\./|\.\.\\|\.\.%2f|\.\.%5c' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add triggers for audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      OLD.user_id,
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_overtime_records_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.overtime_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create function to clean up old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Keep audit logs for 1 year
  DELETE FROM public.audit_logs 
  WHERE created_at < now() - INTERVAL '1 year';
  
  -- Keep rate limits for 1 hour
  DELETE FROM public.rate_limits 
  WHERE created_at < now() - INTERVAL '1 hour';
END;
$$;

-- Create scheduled job to clean up old data (this would be set up in Supabase dashboard)
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT public.cleanup_old_audit_logs();');
