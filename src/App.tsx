import AdminDashboardView from './components/AdminDashboardView';
import BarberProfileView from './components/BarberProfileView';
import BarberScheduleView from './components/BarberScheduleView';
import BookingView from './components/BookingView';
import ClientAppointmentsView from './components/ClientAppointmentsView';
import React, { useState, useCallback, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import { Barber, Service, Appointment, Locale, Role, Client, AdminDashboardViewProps, BarberUpdateData, BusinessHours, DiscountCode } from './types';
import { getBarbers, getServices, createAppointment as apiCreateAppointment, getBarberAppointments as apiGetBarberAppointments, getAllAppointments as apiGetAllAppointments, getClientAppointments as apiGetClientAppointments, getClients, createBarber as apiCreateBarber, updateBarber as apiUpdateBarber, deleteBarber as apiDeleteBarber, changePassword as apiChangePassword, getBusinessHours, updateBusinessHours as apiUpdateBusinessHours, getDiscountCodes, createDiscountCode as apiCreateDiscountCode, deleteDiscountCode as apiDeleteDiscountCode } from './services/apiService';
import { getTranslation } from './translations';
import { useAuth } from './contexts/AuthContext';
export type Page = 'booking' | 'myAppointments' | 'barberSchedule' | 'adminDashboard' | 'myProfile';

const App: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const {currentUser, initialAuthChecked } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('booking');
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [language, setLanguage] = useState<Locale>('en');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBarberForSchedule, setSelectedBarberForSchedule] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const toggleLanguage = () => setLanguage((prevLang: string) => prevLang === 'en' ? 'es' : 'en');
  
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const [servicesData, businessHoursData] = await Promise.all([
            getServices(),
            getBusinessHours(),
        ] as const);
        setServices(servicesData);
        setBusinessHours(businessHoursData);
        
        if (currentUser) {
            const userPromises: any[] = [getBarbers()];
            if (currentUser.role === 'admin') {
                userPromises.push(getClients(), apiGetAllAppointments(), getDiscountCodes());
            }
            const [barbersData, clientsData, appointmentsData, codesData] = await Promise.all(userPromises);
            setBarbers(barbersData);
            if (clientsData) setClients(clientsData);
            if (appointmentsData) setAppointments(appointmentsData);
            if (codesData) setDiscountCodes(codesData);
        }
    } catch (err) {
        setError(getTranslation('failedToLoadInitialData', language));
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [language, currentUser]);

  useEffect(() => {
    if (currentUser) {
      // Set default page based on role
      const defaultPages: Record<Role, Page> = {client:'booking',barber:'barberSchedule',admin:'adminDashboard',};
      setCurrentPage(defaultPages[currentUser.role]);
      // Set initial barber for schedule view if barber/admin
      if(currentUser.role === 'barber')setSelectedBarberForSchedule(currentUser.id);
      else if (currentUser.role === 'admin' && barbers.length > 0)setSelectedBarberForSchedule(barbers[0].id);
    }}, [currentUser, barbers]);

  useEffect(() => {
    loadInitialData();}, [loadInitialData]);

  const fetchAppointments = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      let fetchedAppointments: Appointment[] = [];
      if (currentUser.role === 'admin')fetchedAppointments = await apiGetAllAppointments();
      else if (currentUser.role === 'barber')fetchedAppointments = await apiGetBarberAppointments(currentUser.id);
      else if (currentUser.role === 'client')fetchedAppointments = await apiGetClientAppointments(currentUser.email);
      setAppointments(fetchedAppointments);
    } 
    catch (err) {
      setError(getTranslation('failedToLoadAppointments', language));
      console.error(err);
    } finally {setIsLoading(false);}}, [currentUser, language]);

  useEffect(() => {
    // Fetch appointments when page or selected barber changes
    if ((currentPage === 'barberSchedule' || currentPage === 'myAppointments'))fetchAppointments();
    if (currentPage === 'adminDashboard' && currentUser?.role === 'admin') loadInitialData();
  }, [currentPage, fetchAppointments, loadInitialData, currentUser?.role]);

  const handleStateLoading=()=>{
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
  }
  const handleCreateAppointment = async (appointmentData: Omit<Appointment, 'id' | 'status' | 'barberName' | 'serviceName' | 'price'> & {serviceId: string}) => {
    setIsLoading(true);
    setError(null);
    try {
      const selectedService = services.find(s => s.id === appointmentData.serviceId);
      const selectedBarber = barbers.find(b => b.id === appointmentData.barberId);

      if (!selectedService || !selectedBarber) throw new Error(getTranslation('selectedServiceOrBarberNotFound', language));
      const newAppointment = await apiCreateAppointment({...appointmentData,serviceName: selectedService.name,barberName: selectedBarber.name,price: selectedService.price,barberId: ''});
      setAppointments(prev => [...prev, newAppointment]);
      return newAppointment;
    } catch (err) {
      const E = err as Error;
      setError(`${getTranslation('failedToBookAppointment', language)} ${E.message}`);
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateBarber: AdminDashboardViewProps['onCreateBarber'] = async (barberData: Omit<Barber, "role" | "id"> & { password: string; }) => {
    handleStateLoading()
    try {
        const newBarber = await apiCreateBarber(barberData);
        setBarbers(prevBarbers => [...prevBarbers, newBarber]);
        setSuccessMessage(getTranslation('barberCreateSuccess', language));
        setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
        const E = err as Error;
        setError(`${getTranslation('barberCreateError', language)} ${E.message}`);
        console.error(err);
        throw err; // Re-throw to let the caller know it failed
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpdateBarber = async (barberId: string, barberData: BarberUpdateData) => {
    handleStateLoading()
    try {
        const updatedBarber = await apiUpdateBarber(barberId, barberData);
        setBarbers(prevBarbers => prevBarbers.map(b => b.id === barberId ? updatedBarber : b));
        setSuccessMessage(getTranslation('barberUpdateSuccess', language));
        setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
        const E = err as Error;
        setError(`${getTranslation('barberUpdateError', language)} ${E.message}`);
        console.error(err);
        throw err; // Re-throw to let the caller know it failed
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteBarber = async (barberId: string) => {
    handleStateLoading()
    try {
      await apiDeleteBarber(barberId);
      await loadInitialData();
      setSuccessMessage(getTranslation('barberDeleteSuccess', language));
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const E = err as Error;
      setError(`${getTranslation('barberDeleteError', language)} ${E.message}`);
      console.error(err);
      // Re-throw the error so the calling component knows the operation failed
      // and can handle its UI state accordingly (e.g., stay on the edit form).
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    if (!currentUser) throw new Error("No user is currently logged in.");
    handleStateLoading()
    try {
      await apiChangePassword(currentUser.id, oldPassword, newPassword);
      setSuccessMessage(getTranslation('passwordUpdateSuccess', language));
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const E = err as Error;
      let errorMessage = `${getTranslation('passwordUpdateError', language)} `;
      if (E.message.includes('Incorrect current password')) {
        errorMessage = getTranslation('incorrectPasswordError', language);
      } else {
        errorMessage += E.message;
      }
      setError(errorMessage);
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateBusinessHours = async (hours: BusinessHours) => {
    handleStateLoading()
    try {
        await apiUpdateBusinessHours(hours);
        setBusinessHours(hours);
        setSuccessMessage(getTranslation('hoursUpdateSuccess', language));
        setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
        const E = err as Error;
        setError(`${getTranslation('hoursUpdateError', language)}: ${E.message}`);
        console.error(err);
        throw err;
    } finally {
        setIsLoading(false);
    }
  };
  
    const handleCreateDiscountCode = async (codeData: Omit<DiscountCode, 'id' | 'isActive'>) => {
      handleStateLoading()
      try {
        const newCode = await apiCreateDiscountCode(codeData);
        setDiscountCodes(prev => [...prev, newCode].sort((a,b) => b.expiryDate.getTime() - a.expiryDate.getTime()));
        setSuccessMessage(getTranslation('codeCreateSuccess', language));
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err) {
        const E = err as Error;
        setError(`${getTranslation('codeCreateError', language)}: ${E.message}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeleteDiscountCode = async (codeId: string) => {
      handleStateLoading()
      try {
        await apiDeleteDiscountCode(codeId);
        setDiscountCodes(prev => prev.filter(c => c.id !== codeId));
        setSuccessMessage(getTranslation('codeDeleteSuccess', language));
        setTimeout(() => setSuccessMessage(null), 4000);
      } catch (err) {
        const E = err as Error;
        setError(`${getTranslation('codeDeleteError', language)}: ${E.message}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    };

  const renderPage = () => {
    if (!currentUser) return null;
    switch (currentPage) {
      case 'booking':       return <BookingView services={services} barbers={barbers} onCreateAppointment={handleCreateAppointment} isLoading={isLoading} language={language} />;
      case 'myAppointments':return <ClientAppointmentsView appointments={appointments} isLoading={isLoading} onRefresh={fetchAppointments} language={language} />;
      case 'barberSchedule':return <BarberScheduleView  barbers={barbers} appointments={appointments} selectedBarberId={selectedBarberForSchedule} onSelectBarber={setSelectedBarberForSchedule} isLoading={isLoading} onRefresh={fetchAppointments} language={language}/>;
      case 'adminDashboard':return <AdminDashboardView appointments={appointments}  clients={clients}  barbers={barbers}  services={services}  language={language} onCreateBarber={handleCreateBarber} onUpdateBarber={handleUpdateBarber} onDeleteBarber={handleDeleteBarber} isLoading={isLoading} businessHours={businessHours} onUpdateBusinessHours={handleUpdateBusinessHours} discountCodes={discountCodes} onCreateDiscountCode={handleCreateDiscountCode} onDeleteDiscountCode={handleDeleteDiscountCode}/>;
      case 'myProfile':
        if (currentUser.role === 'barber') return <BarberProfileView  currentUser={currentUser as Barber}  onPasswordChange={handleChangePassword}  isLoading={isLoading}  language={language} />;
        return null;
        default:return <BookingView services={services} barbers={barbers} onCreateAppointment={handleCreateAppointment} isLoading={isLoading} language={language} />;
    }};

  if (!initialAuthChecked) {
    return (
        <div className="min-h-screen bg-slate-900 flex justify-center items-center">
            <h1 className="text-4xl font-bold text-amber-500">{getTranslation('loadingApp', language)}</h1>
        </div>
    );
  }

  if (!currentUser) {
    return <LoginView language={language} toggleLanguage={toggleLanguage} />;
  }
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} language={language} toggleLanguage={toggleLanguage} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center" role="alert">{error}</div>}
        {successMessage && <div className="bg-green-500 text-white p-3 rounded-md mb-4 text-center" role="alert">{successMessage}</div>}
        {renderPage()}
      </main>
      <footer className="bg-slate-950 text-center py-4 text-slate-400 border-t border-slate-700">
        <p>&copy; {new Date().getFullYear()} LUCIA APP. {getTranslation('footerRights', language)}</p>
      </footer>
    </div>
  );
};

export default App;