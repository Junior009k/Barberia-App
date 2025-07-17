import React, { useState, useEffect } from 'react';
import { Appointment, Client, Barber, Service, Locale, AdminDashboardViewProps, BarberUpdateData, BusinessHours, DayHours, DiscountCode } from '../types';
import { getTranslation } from '../translations';
import CreateBarberView from './CreateBarberView';
import { GoogleGenAI } from "@google/genai";
import { sendPromotionalEmail as apiSendPromotionalEmail } from '../services/apiService';

const StatCard: React.FC<{title: string; value: string | number; icon?: React.ReactNode}> = ({ title, value, icon }) => (
  <div className="bg-slate-800 p-6 rounded-lg shadow-lg flex items-center space-x-4">
    {icon && <div className="text-amber-500 text-3xl">{icon}</div>}
    <div>
      <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
      <p className="text-slate-100 text-2xl font-semibold">{value}</p>
    </div>
  </div>
);

// New component for managing business hours, included here for simplicity
const BusinessHoursManager: React.FC<{
  businessHours: BusinessHours;
  onUpdate: (hours: BusinessHours) => Promise<void>;
  isLoading: boolean;
  language: Locale;
}> = ({ businessHours, onUpdate, isLoading, language }) => {
  const [localHours, setLocalHours] = useState<BusinessHours>(businessHours);

  useEffect(() => {
    setLocalHours(businessHours);
  }, [businessHours]);

  const handleTimeChange = (day: keyof BusinessHours, type: 'open' | 'close', value: string) => {
    setLocalHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }));
  };

  const handleClosedToggle = (day: keyof BusinessHours, isChecked: boolean) => {
    setLocalHours(prev => ({
      ...prev,
      [day]: { ...prev[day], isClosed: isChecked }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(localHours);
  };

  const daysOfWeek: (keyof BusinessHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels: Record<keyof BusinessHours, string> = {
    monday: getTranslation('dayMonday', language),
    tuesday: getTranslation('dayTuesday', language),
    wednesday: getTranslation('dayWednesday', language),
    thursday: getTranslation('dayThursday', language),
    friday: getTranslation('dayFriday', language),
    saturday: getTranslation('daySaturday', language),
    sunday: getTranslation('daySunday', language),
  };

  if (!localHours) {
    return <p>{getTranslation('loading', language)}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-slate-100 mb-6">{getTranslation('businessHoursTitle', language)}</h2>
      <div className="space-y-6">
        {daysOfWeek.map(day => (
          <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-t border-slate-700 pt-4">
            <label className="font-semibold capitalize text-slate-300 md:col-span-1">{dayLabels[day]}</label>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="time"
                value={localHours[day].open}
                onChange={e => handleTimeChange(day, 'open', e.target.value)}
                disabled={localHours[day].isClosed}
                className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-amber-500 outline-none w-full disabled:opacity-50"
              />
              <span>-</span>
              <input
                type="time"
                value={localHours[day].close}
                onChange={e => handleTimeChange(day, 'close', e.target.value)}
                disabled={localHours[day].isClosed}
                className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-amber-500 outline-none w-full disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-1 justify-end">
              <input
                type="checkbox"
                id={`closed-${day}`}
                checked={localHours[day].isClosed}
                onChange={e => handleClosedToggle(day, e.target.checked)}
                className="h-4 w-4 rounded border-slate-500 bg-slate-600 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor={`closed-${day}`} className="text-sm text-slate-400">{getTranslation('closedDayLabel', language)}</label>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-right">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? getTranslation('savingButton', language) : getTranslation('saveHoursButton', language)}
        </button>
      </div>
    </form>
  );
};


const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ appointments, clients, barbers, services, language, onCreateBarber, onUpdateBarber, onDeleteBarber, isLoading, businessHours, onUpdateBusinessHours, discountCodes, onCreateDiscountCode, onDeleteDiscountCode }) => {
  const [view, setView] = useState<'dashboard' | 'createForm'>('dashboard');
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  const totalAppointments = appointments.length;
  const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
  const uniqueClients = clients.length; 

  const CalendarIcon = () => <span aria-hidden="true">📅</span>;
  const UsersIcon = () => <span aria-hidden="true">👥</span>;
  const DollarIcon = () => <span aria-hidden="true">💰</span>;
  const ScissorsIcon = () => <span aria-hidden="true">✂️</span>;

  const handleSave = async (formData: any) => {
      try {
        if (editingBarber) {
          // This is an update
          const { name, specialties, bio, profitPercentage, imageUrl, password, hireDate } = formData;
          
          const updateData: BarberUpdateData = { name, specialties, bio, profitPercentage, imageUrl, hireDate };
          if (password) {
              updateData.password = password;
          }
          await onUpdateBarber(editingBarber.id, updateData);

        } else {
            // This is a create
            await onCreateBarber(formData);
        }
        setView('dashboard'); // Switch back on success
        setEditingBarber(null);
      } catch (error) {
        // Error is already handled and displayed in App.tsx, so just log it here
        console.error("Failed to save barber from dashboard view, staying on form.");
      }
  };
  
  const handleDeleteAndGoBack = async (barberId: string) => {
    const barber = barbers.find(b => b.id === barberId);
    if (!barber) return;

    const confirmMessage = getTranslation('deleteConfirmMessage', language).replace('{name}', barber.name);
    if (window.confirm(confirmMessage)) {
      try {
        await onDeleteBarber(barberId);
        setView('dashboard');
        setEditingBarber(null);
      } catch (error) {
        console.error("Deletion failed, staying on edit form.", error);
      }
    }
  };

  if (view === 'createForm') {
    return <CreateBarberView 
              onSave={handleSave} 
              onCancel={() => { setView('dashboard'); setEditingBarber(null); }}
              isLoading={isLoading}
              language={language}
              existingBarber={editingBarber}
              onDelete={handleDeleteAndGoBack}
            />;
  }

  return (
    <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-amber-500">{getTranslation('adminDashboardTitle', language)}</h1>
             <button
                onClick={() => { setEditingBarber(null); setView('createForm'); }}
                className="bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {getTranslation('createBarberButton', language)}
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title={getTranslation('totalAppointments', language)} value={totalAppointments} icon={<CalendarIcon />} />
            <StatCard title={getTranslation('totalRevenue', language)} value={`$${totalRevenue.toFixed(2)}`} icon={<DollarIcon />} />
            <StatCard title={getTranslation('registeredClients', language)} value={uniqueClients} icon={<UsersIcon />} />
            <StatCard title={getTranslation('activeBarbers', language)} value={barbers.length} icon={<ScissorsIcon />} />
        </div>

        {businessHours && <div className="mb-8"><BusinessHoursManager businessHours={businessHours} onUpdate={onUpdateBusinessHours} isLoading={isLoading} language={language} /></div>}

        <div className="mb-8">
           
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">{getTranslation('manageBarbersTitle', language)}</h2>
            <div className="space-y-4">
                {barbers.length > 0 ? (
                    barbers.map(barber => (
                        <div key={barber.id} className="bg-slate-700 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <img src={barber.imageUrl} alt={barber.name} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <p className="font-semibold text-slate-100">{barber.name}</p>
                                    <p className="text-sm text-slate-400">{getTranslation('usernameLabel', language)}: {barber.email}</p>
                                    <p className="text-xs text-slate-500">{getTranslation('hireDateLabel', language)}: {barber.hireDate ? new Date(barber.hireDate).toLocaleDateString(language) : 'N/A'}</p>
                                 </div>
                            </div>
                            <div className="flex-grow text-center">
                                {barber.specialties && barber.specialties.length > 0 && (
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {barber.specialties.map(spec => (
                                            <span key={spec} className="bg-slate-600 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">{spec}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                             <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="text-right">
                                    <p className="text-sm text-slate-400">{getTranslation('profitPercentageLabel', language)}</p>
                                    <p className="font-semibold text-amber-500 text-lg">{barber.profitPercentage ?? 0}%</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingBarber(barber);
                                        setView('createForm');
                                    }}
                                    className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors text-sm"
                                >
                                    {getTranslation('editButton', language)}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-400 text-center py-4">{getTranslation('noBarbersCreatedYet', language)}</p>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">{getTranslation('recentAppointments', language)}</h2>
                {appointments.slice(0, 5).map(app => (
                    <div key={app.id} className="border-b border-slate-700 py-2 last:border-b-0">
                        <p className="text-slate-300">{app.serviceName} with {app.barberName} for {app.clientName}</p>
                        <p className="text-xs text-slate-400">{new Date(app.startTime).toLocaleString(language)}</p>
                    </div>
                ))}
                {appointments.length === 0 && <p className="text-slate-400">{getTranslation('noAppointmentsYet', language)}</p>}
            </div>

            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">{getTranslation('servicePopularity', language)}</h2>
                {services.map(service => (
                    <div key={service.id} className="flex justify-between items-center py-1">
                        <span className="text-slate-300">{service.name}</span>
                        <span className="text-amber-500 font-semibold">{Math.floor(Math.random() * 50) + 5} {getTranslation('bookingsSuffix', language)}</span>
                    </div>
                ))}
                 {services.length === 0 && <p className="text-slate-400">{getTranslation('noServicesDefined', language)}</p>}
            </div>
        </div>
        
    </div>
  );
};

export default AdminDashboardView;