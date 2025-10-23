import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, TrendingUp, Shield, BarChart3, Timer } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

const signupSchema = z.object({
  fullName: z.string().min(3, { message: 'Nome deve ter no mínimo 3 caracteres' }),
  cpf: z.string().regex(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos' }),
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const form = e.currentTarget.closest('form');
    if (!form) return;

    const formData = new FormData(form);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      const validated = loginSchema.parse(data);
      await signIn(validated.email, validated.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    const form = e.currentTarget.closest('form');
    if (!form) return;

    const formData = new FormData(form);
    const data = {
      fullName: formData.get('fullName') as string,
      cpf: formData.get('cpf') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    try {
      const validated = signupSchema.parse(data);
      await signUp(validated.email, validated.password, validated.fullName, validated.cpf);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen">
      <div className="w-full">
        <div className="grid h-screen w-full lg:grid-cols-2">
          {/* Left Side - Login Form */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col gap-4 p-6 md:p-10">
            <div className="flex justify-center gap-2 md:justify-start">
              <a href="#" className="text-slate-800 dark:text-slate-200">
                <Logo size="lg" />
              </a>
            </div>
            
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-lg">
                <form className="space-y-8 p-6">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-200">
                      Bem-vindo de volta! <br /> 
                      Faça login em sua conta.
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                      Sistema de Controle de Horas Extras
                    </p>
                  </div>
                  
                  <div className="grid gap-6">
                    <Tabs defaultValue="login" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-slate-200 dark:bg-slate-700">
                        <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Login</TabsTrigger>
                        <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Cadastro</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="login" className="space-y-4 mt-6">
                        <div className="grid gap-3">
                          <Input 
                            name="email"
                            type="email"
                            placeholder="Email" 
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                          {errors.email && (
                            <p className="text-sm text-red-600">{errors.email}</p>
                          )}
                        </div>
                        <div className="grid gap-3">
                          <Input 
                            name="password"
                            type="password"
                            placeholder="Senha" 
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                          {errors.password && (
                            <p className="text-sm text-red-600">{errors.password}</p>
                          )}
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                          disabled={isLoading}
                          onClick={handleLogin}
                        >
                          {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                      </TabsContent>
                      
                      <TabsContent value="signup" className="space-y-4 mt-6">
                        <div className="grid gap-3">
                          <Input 
                            name="fullName"
                            type="text"
                            placeholder="Nome Completo" 
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                          {errors.fullName && (
                            <p className="text-sm text-red-600">{errors.fullName}</p>
                          )}
                        </div>
                        <div className="grid gap-3">
                          <Input 
                            name="cpf"
                            type="text"
                            placeholder="CPF (somente números)" 
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            maxLength={11}
                            required
                          />
                          {errors.cpf && (
                            <p className="text-sm text-red-600">{errors.cpf}</p>
                          )}
                        </div>
                        <div className="grid gap-3">
                          <Input 
                            name="email"
                            type="email"
                            placeholder="Email" 
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                          {errors.email && (
                            <p className="text-sm text-red-600">{errors.email}</p>
                          )}
                        </div>
                        <div className="grid gap-3">
                          <Input 
                            name="password"
                            type="password"
                            placeholder="Senha (mínimo 6 caracteres)" 
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            required
                          />
                          {errors.password && (
                            <p className="text-sm text-red-600">{errors.password}</p>
                          )}
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                          disabled={isLoading}
                          onClick={handleSignup}
                        >
                          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <div className="space-y-3 text-center text-sm">
                    <p className="text-slate-600 dark:text-slate-400">
                      Problemas para fazer login?{" "}
                      <a href="#" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors">
                        Redefinir senha
                      </a>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Ao usar o JBRETAS HREXTRA, você concorda com nossa 
                      <a href="#" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors"> Política de Privacidade</a> e 
                      <a href="#" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors"> Termos de Uso</a>.
                    </p>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="mb-8 flex items-center justify-center gap-2">
              <div className="w-full max-w-lg text-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Sistema desenvolvido para controle eficiente de horas extras
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Features Showcase */}
          <div className="hidden h-full w-full flex-col space-y-6 lg:flex bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Controle Total de Horas Extras
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    Gerencie, acompanhe e analise as horas extras da sua equipe 
                    com precisão e eficiência.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 max-w-2xl">
                  <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg w-fit mb-4">
                      <Timer className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Registro Preciso</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Registre horas extras com precisão de minutos
                    </p>
                  </div>
                  
                  <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-lg w-fit mb-4">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Relatórios Detalhados</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Análises completas e relatórios exportáveis
                    </p>
                  </div>
                  
                  <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg w-fit mb-4">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Gestão de Equipe</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Controle individual e em equipe
                    </p>
                  </div>
                  
                  <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-lg w-fit mb-4">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Segurança Total</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Dados protegidos e acesso controlado
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-200 dark:border-slate-700">
              <p className="text-center text-slate-600 dark:text-slate-400 mb-4">
                Confiado por equipes em
              </p>
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm w-24 h-16 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm w-24 h-16 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm w-24 h-16 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
