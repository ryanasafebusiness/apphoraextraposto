import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isValidEmail, isValidPassword, isValidCPF, sanitizeInput, RateLimiter } from '@/utils/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, cpf: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  
  // Rate limiter for authentication attempts
  const rateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin role after state is set
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Input validation
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedPassword = sanitizeInput(password);

      // Validate email format
      if (!isValidEmail(sanitizedEmail)) {
        throw new Error('Formato de email inválido');
      }

      // Rate limiting
      if (!rateLimiter.isAllowed(sanitizedEmail)) {
        throw new Error('Muitas tentativas de login. Tente novamente em 15 minutos.');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (error) {
        throw error;
      }

      // Reset rate limiter on successful login
      rateLimiter.reset(sanitizedEmail);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, cpf: string) => {
    try {
      // Input validation
      if (!email || !password || !fullName || !cpf) {
        throw new Error('Todos os campos são obrigatórios');
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedPassword = sanitizeInput(password);
      const sanitizedFullName = sanitizeInput(fullName);
      const sanitizedCpf = sanitizeInput(cpf);

      // Validate inputs
      if (!isValidEmail(sanitizedEmail)) {
        throw new Error('Formato de email inválido');
      }

      const passwordValidation = isValidPassword(sanitizedPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      if (!isValidCPF(sanitizedCpf)) {
        throw new Error('CPF inválido');
      }

      if (sanitizedFullName.length < 2 || sanitizedFullName.length > 100) {
        throw new Error('Nome deve ter entre 2 e 100 caracteres');
      }

      // Rate limiting
      if (!rateLimiter.isAllowed(sanitizedEmail)) {
        throw new Error('Muitas tentativas de cadastro. Tente novamente em 15 minutos.');
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: sanitizedFullName,
            cpf: sanitizedCpf,
          }
        }
      });

      if (error) throw error;

      // Reset rate limiter on successful signup
      rateLimiter.reset(sanitizedEmail);
      toast.success('Cadastro realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer cadastro');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logout realizado com sucesso!');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer logout');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
