import React from 'react';
import { Appointment, Barber, Locale } from '../types';
import AppointmentCard from './AppointmentCard';
import { getTranslation } from '../translations';
import { useAuth } from '../contexts/AuthContext';

interface BarberScheduleViewProps {
  barbers: Barber[];
  appointments: Appointment[];
  selectedBarberId: string | null;
  onSelectBarber: (barberId: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  language: Locale;
}

const BarberScheduleView: React.FC<BarberScheduleViewProps> = ({ barbers, appointments, selectedBarberId, onSelectBarber, isLoading, onRefresh, language }) => {
  const { currentUser } = useAuth();
  
  const handleBarberChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectBarber(event.target.value);
  };
  
  const sortedAppointments = [...appointments].sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const selectedBarber = selectedBarberId ? barbers.find(b => b.id === selectedBarberId) : null;
  const isBarberRole = currentUser?.role === 'barber';

  const viewTitle = isBarberRole ? getTranslation('myScheduleTitle', language) : getTranslation('barberScheduleTitle', language);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            {selectedBarber && selectedBarber.imageUrl && (
              <img 
                src={selectedBarber.imageUrl} 
                alt={selectedBarber.name}
                className="w-16 h-16 rounded-full object-cover shadow-md"
              />
            )}
            <h1 className="text-3xl font-bold text-amber-500">{viewTitle}</h1>
          </div>
          <div className="flex gap-2 items-center">
            {!isBarberRole && barbers.length > 0 && (
              <select
                value={selectedBarberId || ''}
                onChange={handleBarberChange}
                className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                aria-label={getTranslation('selectBarberPlaceholder', language)}
              >
                <option value="" disabled>{getTranslation('selectBarberPlaceholder', language)}</option>
                {barbers.map(barber => (
                  <option key={barber.id} value={barber.id}>{barber.name}</option>
                ))}
              </select>
            )}
            <button
                onClick={onRefresh}
                disabled={isLoading || !selectedBarberId}
                className="p-2 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : getTranslation('refreshButton', language)}
              </button>
          </div>
        </div>

        {isLoading && <p className="text-center text-amber-500 py-4">{getTranslation('loadingAppointments', language)}</p>}
        {!isLoading && !selectedBarberId && !isBarberRole && <p className="text-center text-slate-400 py-4">{getTranslation('pleaseSelectBarber', language)}</p>}
        {!isLoading && selectedBarberId && appointments.length === 0 && (
          <p className="text-center text-slate-400 py-4">
            {getTranslation('noAppointmentsScheduled', language)} {isBarberRole ? getTranslation('you', language) : selectedBarber?.name || getTranslation('noAppointmentsForSelectedBarber', language)}.
          </p>
        )}

        {!isLoading && appointments.length > 0 && (
          <div className="space-y-4">
            {sortedAppointments.map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarberScheduleView;
