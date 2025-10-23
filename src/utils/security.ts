// Security utilities for input validation and sanitization

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validates CPF format (Brazilian tax ID)
 */
export function isValidCPF(cpf: string): boolean {
  if (typeof cpf !== 'string') return false;
  
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check if it has 11 digits
  if (cleanCPF.length !== 11) return false;
  
  // Check for invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Senha deve ser uma string' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: 'Senha deve ter pelo menos 8 caracteres' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Senha muito longa' };
  }
  
  // Check for common weak patterns
  if (/^(.)\1+$/.test(password)) {
    return { valid: false, message: 'Senha não pode ter caracteres repetidos' };
  }
  
  if (password.toLowerCase().includes('password') || password.toLowerCase().includes('123456')) {
    return { valid: false, message: 'Senha muito comum' };
  }
  
  return { valid: true };
}

/**
 * Validates time format (HH:MM)
 */
export function isValidTime(time: string): boolean {
  if (typeof time !== 'string') return false;
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validates date format (YYYY-MM-DD)
 */
export function isValidDate(date: string): boolean {
  if (typeof date !== 'string') return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

/**
 * Sanitizes user input for database storage
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, 1000); // Limit length
}

/**
 * Validates numeric input
 */
export function isValidNumber(value: string | number, min?: number, max?: number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static tokens: Map<string, number> = new Map();
  private static readonly TOKEN_LIFETIME = 30 * 60 * 1000; // 30 minutes
  
  static generateToken(): string {
    const token = crypto.randomUUID();
    this.tokens.set(token, Date.now());
    return token;
  }
  
  static validateToken(token: string): boolean {
    const timestamp = this.tokens.get(token);
    if (!timestamp) return false;
    
    if (Date.now() - timestamp > this.TOKEN_LIFETIME) {
      this.tokens.delete(token);
      return false;
    }
    
    return true;
  }
  
  static cleanup(): void {
    const now = Date.now();
    for (const [token, timestamp] of this.tokens.entries()) {
      if (now - timestamp > this.TOKEN_LIFETIME) {
        this.tokens.delete(token);
      }
    }
  }
}
