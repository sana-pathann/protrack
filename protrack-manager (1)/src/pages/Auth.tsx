import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthPage() {
  const { user, signIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center"
      >
        <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
          <span className="text-white font-bold text-xl">P.</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to ProTrack</h1>
        <p className="text-slate-500 mb-8">Manage your projects and tasks with ease.</p>
        
        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 py-3 px-4 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
        
        <div className="mt-8 pt-8 border-t border-slate-100 italic text-xs text-slate-400">
          "The best way to get things done is to simple begin."
        </div>
      </motion.div>
    </div>
  );
}
