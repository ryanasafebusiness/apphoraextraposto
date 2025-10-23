import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Security monitoring hook
 */
export function useSecurity() {
  const { user } = useAuth();

  // Monitor for suspicious activity
  const logSecurityEvent = useCallback((event: string, details?: any) => {
    console.warn(`[SECURITY] ${event}`, details);
    
    // In production, this would send to a security monitoring service
    if (import.meta.env.PROD) {
      // Send to security monitoring service
      // Example: sendToSecurityService(event, details);
    }
  }, []);

  // Monitor for XSS attempts
  const detectXSS = useCallback((input: string) => {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<style[^>]*>.*?<\/style>/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }, []);

  // Monitor for SQL injection attempts
  const detectSQLInjection = useCallback((input: string) => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/gi,
      /(UNION\s+SELECT)/gi,
      /(DROP\s+TABLE)/gi,
      /(INSERT\s+INTO)/gi,
      /(DELETE\s+FROM)/gi,
      /(UPDATE\s+SET)/gi,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }, []);

  // Monitor for path traversal attempts
  const detectPathTraversal = useCallback((input: string) => {
    const pathTraversalPatterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /\.\.%2f/gi,
      /\.\.%5c/gi,
      /\.\.%252f/gi,
      /\.\.%255c/gi,
    ];

    return pathTraversalPatterns.some(pattern => pattern.test(input));
  }, []);

  // Comprehensive input validation
  const validateInput = useCallback((input: string, fieldName: string) => {
    if (!input || typeof input !== 'string') {
      return { valid: true }; // Empty inputs are handled by required validation
    }

    // Check for XSS
    if (detectXSS(input)) {
      logSecurityEvent('XSS attempt detected', { field: fieldName, input: input.substring(0, 100) });
      return { valid: false, message: 'Entrada contém conteúdo suspeito' };
    }

    // Check for SQL injection
    if (detectSQLInjection(input)) {
      logSecurityEvent('SQL injection attempt detected', { field: fieldName, input: input.substring(0, 100) });
      return { valid: false, message: 'Entrada contém conteúdo suspeito' };
    }

    // Check for path traversal
    if (detectPathTraversal(input)) {
      logSecurityEvent('Path traversal attempt detected', { field: fieldName, input: input.substring(0, 100) });
      return { valid: false, message: 'Entrada contém conteúdo suspeito' };
    }

    return { valid: true };
  }, [detectXSS, detectSQLInjection, detectPathTraversal, logSecurityEvent]);

  // Monitor user session for suspicious activity
  useEffect(() => {
    if (!user) return;

    const startTime = Date.now();
    let requestCount = 0;
    const maxRequestsPerMinute = 60;

    const interval = setInterval(() => {
      requestCount = 0; // Reset counter every minute
    }, 60000);

    // Monitor for rapid requests (potential DoS)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      requestCount++;
      
      if (requestCount > maxRequestsPerMinute) {
        logSecurityEvent('High request rate detected', { 
          userId: user.id, 
          requestCount,
          timeElapsed: Date.now() - startTime 
        });
      }

      return originalFetch(...args);
    };

    return () => {
      clearInterval(interval);
      window.fetch = originalFetch;
    };
  }, [user, logSecurityEvent]);

  // Monitor for console access attempts
  useEffect(() => {
    const handleConsoleAccess = () => {
      logSecurityEvent('Console access detected', { 
        userId: user?.id,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    };

    // Monitor for common debugging attempts
    const originalConsole = { ...console };
    
    Object.keys(console).forEach(key => {
      if (typeof console[key as keyof Console] === 'function') {
        (console as any)[key] = (...args: any[]) => {
          handleConsoleAccess();
          return (originalConsole as any)[key](...args);
        };
      }
    });

    return () => {
      Object.keys(originalConsole).forEach(key => {
        (console as any)[key] = (originalConsole as any)[key];
      });
    };
  }, [user, logSecurityEvent]);

  return {
    validateInput,
    logSecurityEvent,
    detectXSS,
    detectSQLInjection,
    detectPathTraversal,
  };
}
