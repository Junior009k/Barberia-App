
import React from 'react';
import { Appointment, AppointmentStatus } from '../types';

interface AppointmentCardProps {
  appointment: Appointment;
}

const getStatusColor = (status: AppointmentStatus) => {
  switch (status) {
    case AppointmentStatus.SCHEDULED: return 'bg-blue-500 text-blue-100';
    case AppointmentStatus.COMPLETED: return 'bg-green-500 text-green-100';
    case AppointmentStatus.CANCELLED: return 'bg-red-500 text-red-100';
    case AppointmentStatus.NO_SHOW: return 'bg-yellow-500 text-yellow-900';
    default: return 'bg-slate-500 text-slate-100';
  }
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment }) => {
  const { clientName, serviceName, startTime, endTime, barberName, status, price, clientEmail, clientPhone } = appointment;

  const formatDate = (date: Date) => date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-slate-700 p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
        <h3 className="text-xl font-semibold text-amber-400">{serviceName}</h3>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
        <p><span className="font-medium text-slate-400">Client:</span> {clientName}</p>
        <p><span className="font-medium text-slate-400">Barber:</span> {barberName}</p>
        <p><span className="font-medium text-slate-400">Date:</span> {formatDate(new Date(startTime))}</p>
        <p><span className="font-medium text-slate-400">Time:</span> {formatTime(new Date(startTime))} - {formatTime(new Date(endTime))}</p>
        <p><span className="font-medium text-slate-400">Price:</span> ${price.toFixed(2)}</p>
        {clientEmail && <p><span className="font-medium text-slate-400">Email:</span> {clientEmail}</p>}
        {clientPhone && <p><span className="font-medium text-slate-400">Phone:</span> {clientPhone}</p>}
      </div>
      {appointment.notes && (
        <div className="mt-3 pt-3 border-t border-slate-600">
          <p className="text-sm text-slate-400"><span className="font-medium">Notes:</span> {appointment.notes}</p>
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
