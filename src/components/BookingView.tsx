import React, { useState, useEffect } from 'react';
import { Barber, Service, TimeSlot, Appointment, Locale } from '../types';
import { getAvailableTimeSlots } from '../services/apiService';
import { getTranslation } from '../translations';
import { useAuth } from '../contexts/AuthContext';

interface BookingViewProps {
  services: Service[];
  barbers: Barber[];
  onCreateAppointment: (appointmentData: Omit<Appointment, 'id' | 'status' | 'barberName' | 'serviceName' | 'price'> & {serviceId: string}) => Promise<Appointment | void>;
  isLoading: boolean;
  language: Locale;
}

type BookingStep = 1 | 2 | 3 | 4 | 5; // 1:Service, 2:Barber, 3:Time, 4:Details, 5:Confirmation

// By defining these re-usable UI components outside the main BookingView component,
// we ensure they are not re-created on every render. This is a key React
// performance principle that prevents unnecessary DOM updates and bugs
// like input fields losing focus.

const Card: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className }) => (
  <div className={`bg-slate-800 p-6 rounded-lg shadow-xl ${className}`}>{children}</div>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary' | 'secondary'}> = ({ children, className, variant = 'primary', ...props }) => (
  <button
    className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800
      ${variant === 'primary' ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 focus:ring-amber-500' : 'bg-slate-600 hover:bg-slate-500 text-slate-100 focus:ring-slate-500'}
      ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
   <input {...props} className={`w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder-slate-400 ${props.className}`} />
);


const BookingView: React.FC<BookingViewProps> = ({ services, barbers, onCreateAppointment, isLoading: appIsLoading, language }) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<BookingStep>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.role === 'client') {
      setClientName(currentUser.name);
      setClientEmail(currentUser.email);
      setClientPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const selectedService = services.find(s => s.id === selectedServiceId);

  useEffect(() => {
    const fetchSlots = async () => {
      const service = services.find(s => s.id === selectedServiceId);
      if (!service || !selectedBarberId) return;

      setInternalLoading(true);
      setConfirmationMessage(null);
      try {
        const today = new Date();
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
          const nextDate = new Date(today);
          nextDate.setDate(today.getDate() + i);
          dates.push(nextDate);
        }
        
        let allSlots: TimeSlot[] = [];
        for (const date of dates) {
          const slots = await getAvailableTimeSlots(date, selectedBarberId, service.durationMinutes);
          allSlots = [...allSlots, ...slots];
        }
        setAvailableSlots(allSlots);
      } catch (error) {
        console.error("Failed to fetch time slots:", error);
        setConfirmationMessage(getTranslation('failedLoadTimes', language));
      } finally {
        setInternalLoading(false);
      }
    };
    
    if (step === 3) {
      fetchSlots();
    }
  // This effect depends on primitive state values and stable props, which is a robust pattern.
  // It fires correctly when the step changes to 3 after a service and barber are selected.
  }, [step, selectedServiceId, selectedBarberId, services, language]);


  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedBarberId(''); 
    setAvailableSlots([]);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleBarberSelect = (barberId: string) => {
    setSelectedBarberId(barberId);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setStep(3);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(4);
  };
  
  const resetBookingFlow = () => {
      setStep(1);
      setSelectedServiceId('');
      setSelectedBarberId('');
      setSelectedSlot(null);
      setConfirmationMessage(null);
      if (currentUser?.role !== 'client') {
        setClientName('');
        setClientEmail('');
        setClientPhone('');
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedBarberId || !selectedSlot || !clientName || !clientEmail) {
      setConfirmationMessage(getTranslation('pleaseFillFields', language));
      return;
    }
    setInternalLoading(true);
    setConfirmationMessage(null);
    try {
      await onCreateAppointment({
        clientName,
        clientEmail,
        clientPhone,
        barberId: selectedBarberId,
        serviceId: selectedService.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      setConfirmationMessage(`${getTranslation('bookingSuccessfulMessage', language)} ${clientName}.`);
      setStep(5);
      setTimeout(() => {
        resetBookingFlow();
      }, 5000);
    } catch (error) {
      console.error("Booking failed:", error);
      setConfirmationMessage(getTranslation('bookingFailedMessage', language));
    } finally {
      setInternalLoading(false);
    }
  };
  
  if (appIsLoading && !services.length && !barbers.length) {
    return <Card><p className="text-center text-amber-500 text-lg">{getTranslation('loadingApp', language)}</p></Card>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-amber-500 mb-8 text-center">{getTranslation('bookAppointmentTitle', language)}</h1>
      
      {confirmationMessage && step !== 5 && (
        <div className={`p-4 mb-6 rounded-md text-center ${confirmationMessage.includes(getTranslation('bookingSuccessfulMessage', language).split(' ')[0]) ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`} role="alert">
          {confirmationMessage}
        </div>
      )}

      {step === 1 && (
        <Card>
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">{getTranslation('bookingStep1', language)}</h2>
          {services.length === 0 && <p>{getTranslation('loadingServices', language)}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(service => (
              <button key={service.id} onClick={() => handleServiceSelect(service.id)}
                className="p-4 bg-slate-700 rounded-lg hover:bg-amber-500 hover:text-slate-900 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800">
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <p className="text-sm text-slate-400">{service.durationMinutes} min - ${service.price.toFixed(2)}</p>
                {service.description && <p className="text-xs text-slate-500 mt-1">{service.description}</p>}
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 2 && selectedService && (
        <Card>
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">{getTranslation('bookingStep2Prefix', language)} {selectedService.name}</h2>
          {barbers.length === 0 && <p>{getTranslation('loadingBarbers', language)}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {barbers.map(barber => (
              <button 
                key={barber.id} 
                onClick={() => handleBarberSelect(barber.id)}
                className="bg-slate-700 rounded-lg overflow-hidden hover:shadow-amber-500/30 shadow-lg hover:ring-2 hover:ring-amber-500 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                {barber.imageUrl && (
                  <img 
                    src={barber.imageUrl} 
                    alt={barber.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-amber-400">{barber.name}</h3>
                  <p className="text-sm text-slate-300">{barber.specialties.join(', ')}</p>
                </div>
              </button>
            ))}
          </div>
           <Button onClick={() => setStep(1)} variant="secondary" className="mt-8">{getTranslation('backToServicesButton', language)}</Button>
        </Card>
      )}

      {step === 3 && selectedService && selectedBarberId && (
        <Card>
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">{getTranslation('bookingStep3', language)}</h2>
          <p className="text-slate-300 mb-4">{getTranslation('serviceLabel', language)}: {selectedService.name}</p>
          <p className="text-slate-300 mb-4">{getTranslation('barberLabel', language)}: {barbers.find(b => b.id === selectedBarberId)?.name}</p>
          {(internalLoading || appIsLoading) && <p className="text-amber-500 text-center py-4">{getTranslation('loadingSlots', language)}</p>}
          {!internalLoading && !appIsLoading && availableSlots.length === 0 && <p className="text-slate-400 text-center py-4">{getTranslation('noSlotsFound', language)}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
            {availableSlots.map(slot => (
              <button key={slot.startTime.toISOString()} onClick={() => handleSlotSelect(slot)}
                className="p-3 bg-slate-700 rounded-lg hover:bg-amber-500 hover:text-slate-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800">
                <p className="font-semibold">{slot.startTime.toLocaleDateString(language, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <p className="text-sm">{slot.startTime.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}</p>
              </button>
            ))}
          </div>
          <Button onClick={() => setStep(2)} variant="secondary" className="mt-6">{getTranslation('backToBarbersButton', language)}</Button>
        </Card>
      )}

      {step === 4 && selectedService && selectedBarberId && selectedSlot && (
        <Card>
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">{getTranslation('bookingStep4', language)}</h2>
          <p className="text-slate-300 mb-1">{getTranslation('serviceLabel', language)}: <span className="font-semibold">{selectedService.name}</span></p>
          <p className="text-slate-300 mb-1">{getTranslation('barberLabel', language)}: <span className="font-semibold">{barbers.find(b => b.id === selectedBarberId)?.name}</span></p>
          <p className="text-slate-300 mb-4">{getTranslation('timeLabel', language)}: <span className="font-semibold">{selectedSlot.startTime.toLocaleDateString(language)} at {selectedSlot.startTime.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}</span></p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('fullNameLabel', language)}</label>
              <Input type="text" id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} required readOnly={currentUser?.role === 'client'} />
            </div>
            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('emailLabel', language)}</label>
              <Input type="email" id="clientEmail" value={clientEmail} onChange={e => setClientEmail(e.target.value)} required readOnly={currentUser?.role === 'client'} />
            </div>
            <div>
              <label htmlFor="clientPhone" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('phoneLabel', language)}</label>
              <Input type="tel" id="clientPhone" value={clientPhone} onChange={e => setClientPhone(e.target.value)} readOnly={currentUser?.role === 'client'} />
            </div>
            <Button type="submit" disabled={internalLoading || appIsLoading}>
              {(internalLoading || appIsLoading) ? getTranslation('bookingButton', language) : getTranslation('confirmBookingButton', language)}
            </Button>
            <Button onClick={() => setStep(3)} variant="secondary" type="button">{getTranslation('backToTimeSlotsButton', language)}</Button>
          </form>
        </Card>
      )}
       {step === 5 && confirmationMessage && (
        <Card className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">{getTranslation('bookingStep5Title', language)}</h2>
          <p className="text-slate-300 mb-6">{confirmationMessage}</p>
          <Button onClick={resetBookingFlow}>
            {getTranslation('bookAnotherAppointmentButton', language)}
          </Button>
        </Card>
      )}
    </div>
  );
};

export default BookingView;