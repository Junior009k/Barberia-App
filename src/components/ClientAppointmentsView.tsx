import React from 'react';
import { Appointment, Locale } from '../types';
import AppointmentCard from './AppointmentCard';
import { getTranslation } from '../translations';

interface ClientAppointmentsViewProps {
  appointments: Appointment[];
  isLoading: boolean;
  onRefresh: () => void;
  language: Locale;
}

const ClientAppointmentsView: React.FC<ClientAppointmentsViewProps> = ({ appointments, isLoading, onRefresh, language }) => {
  const sortedAppointments = [...appointments].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-amber-500">{getTranslation('myAppointmentsTitle', language)}</h1>
            <button
                onClick={onRefresh}
                disabled={isLoading}
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

        {isLoading && <p className="text-center text-amber-500 py-4">{getTranslation('loadingAppointments', language)}</p>}
        
        {!isLoading && appointments.length === 0 && (
          <p className="text-center text-slate-400 py-4">
            {getTranslation('noAppointmentsBooked', language)}
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

export default ClientAppointmentsView;
