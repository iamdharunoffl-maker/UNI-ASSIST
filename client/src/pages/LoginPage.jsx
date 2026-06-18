import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
      toast.success('Logged in successfully! Welcome back.');
      navigate('/', { replace: true });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))] px-4 py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent-500/10 blur-3xl -z-10" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-950/40 border border-slate-800 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        {/* Logo Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20 text-2xl mb-4">
          U
        </div>
        
        <h2 className="text-2xl font-extrabold text-white font-sans tracking-tight mb-1">
          Sign in to Uni Assist
        </h2>
        <p className="text-xs text-slate-400 font-sans font-medium mb-8">
          Welcome back! Please enter your details.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-5">
          <FormField
            label="Username"
            name="username"
            placeholder="e.g. admin"
            autoComplete="username"
            className="text-white"
            {...register('username', { 
              required: 'Username is required',
              minLength: { value: 3, message: 'Username must be at least 3 characters' }
            })}
            error={errors.username}
            // Add custom color hooks for dark themed inputs
            style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: 'rgba(71, 85, 105, 0.3)', color: '#fff' }}
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="text-white"
            {...register('password', { 
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
            error={errors.password}
            style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: 'rgba(71, 85, 105, 0.3)', color: '#fff' }}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/10 focus:outline-none flex justify-center items-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="border-white" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xxs text-slate-500 font-sans leading-relaxed">
            Uni Assist Consultancy Management Portal.<br />
            Security managed under TLS and HttpOnly cookie tokens.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
