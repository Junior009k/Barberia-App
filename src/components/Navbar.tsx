import React from 'react';
import type { Page } from '../App';
import { Locale, Role } from '../types';
import { getTranslation } from '../translations';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  language: Locale;
  toggleLanguage: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage, language, toggleLanguage }) => {
  const { currentUser, logout } = useAuth();

  const navItems: { page: Page; labelKey: keyof typeof import('../translations').translations, roles: Role[] }[] = [
    { page: 'booking', labelKey: 'navBookAppointment', roles: ['client', 'admin'] },
    { page: 'myAppointments', labelKey: 'navMyAppointments', roles: ['client'] },
    { page: 'barberSchedule', labelKey: 'navBarberSchedule', roles: ['barber', 'admin'] },
    { page: 'myProfile', labelKey: 'navMyProfile', roles: ['barber'] },
    { page: 'adminDashboard', labelKey: 'navAdminDashboard', roles: ['admin'] },
  ];

  const visibleNavItems = currentUser ? navItems.filter(item => item.roles.includes(currentUser.role)) : [];

  return (
    <nav className="bg-slate-950 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <span className="font-bold text-3xl text-amber-500">LUCIA APP</span>
          </div>
          
          {currentUser && (
          <div className="hidden md:flex items-center space-x-4">
            {visibleNavItems.map((item) => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150
                  ${currentPage === item.page
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                aria-current={currentPage === item.page ? 'page' : undefined}
              >
                {getTranslation(item.labelKey, language)}
              </button>
            ))}
          </div>
          )}

          <div className="flex items-center space-x-4">
            {currentUser && (
               <div className="flex items-center space-x-3">
                 <div className="text-right">
                    <p className="text-sm font-medium text-white">{currentUser.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
                 </div>
                <button
                    onClick={logout}
                    className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors duration-150"
                    aria-label={getTranslation('logoutButton', language)}
                  >
                  {getTranslation('logoutButton', language)}
                </button>
               </div>
            )}
             <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-150"
              aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
            >
              {language === 'en' ? getTranslation('languageToggleEN', language) : getTranslation('languageToggleES', language)}
            </button>
          </div>
        </div>
        {/* Mobile Nav Menu */}
        {currentUser && (
           <div className="md:hidden flex items-center space-x-2 pb-3 justify-center overflow-x-auto">
            {visibleNavItems.map((item) => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 whitespace-nowrap
                  ${currentPage === item.page
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                aria-current={currentPage === item.page ? 'page' : undefined}
              >
                {getTranslation(item.labelKey, language)}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;