import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MessageSquare, TrendingUp, Store, Bug, Sprout, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';
import { User } from '@supabase/supabase-js';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigation = [
    { name: 'Disease Predictor', href: '/predictor', icon: Sprout },
    { name: 'AgriChat', href: '/chatbot', icon: MessageSquare },
    { name: 'Yield Predictor', href: '/yield-predictor', icon: TrendingUp },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'Pest Advisor', href: '/pest-advisor', icon: Bug },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleNavigation = (href: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    navigate(href);
  };

  return (
    <>
      <nav className="bg-white shadow-lg fixed w-full z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <Sprout className="h-8 w-8 text-green-600" />
                <span className="ml-2 text-xl font-bold text-gray-800">AgriAssist</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden relative z-[101]">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    {item.name}
                  </button>
                );
              })}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} absolute top-0 left-0 right-0 z-[100]`}>
              <div className="absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          handleNavigation(item.href);
                          setIsOpen(false);
                        }}
                        className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-2" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}