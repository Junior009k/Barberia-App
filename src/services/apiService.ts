import { Barber, Service, TimeSlot, Appointment, AppointmentStatus, Client, Role, Admin, User, BarberUpdateData, BusinessHours, DiscountCode } from '../types';

// --- MOCK DATABASE ---

let mockBarbers: Barber[] = [];

let mockClients: Client[] = [
  { id: 'c1', name: 'John Doe', email: 'john@example.com', password: 'password123', phone: '123-456-7890', role: 'client' },
  { id: 'c2', name: 'Jane Smith', email: 'jane@example.com', password: 'password123', phone: '098-765-4321', role: 'client' },
];

let mockAdmins: Admin[] = [
  { id: 'a1', name: 'Admin User', email: 'admin', password: 'admin', role: 'admin' },
];

let mockServices: Service[] = [
  { id: 's1', name: 'Classic Haircut', durationMinutes: 45, price: 30, description: "Timeless cut and style." },
  { id: 's2', name: 'Beard Trim & Shape', durationMinutes: 30, price: 20, description: "Expert beard grooming." },
  { id: 's3', name: 'Hot Towel Shave', durationMinutes: 60, price: 45, description: "Luxurious traditional shave." },
  { id: 's4', name: 'Cut & Shave Combo', durationMinutes: 90, price: 65, description: "The full experience." },
];

let mockAppointments: Appointment[] = [];

let mockBusinessHours: BusinessHours = {
  monday: { open: '09:00', close: '17:00', isClosed: false },
  tuesday: { open: '09:00', close: '17:00', isClosed: false },
  wednesday: { open: '09:00', close: '17:00', isClosed: false },
  thursday: { open: '09:00', close: '19:00', isClosed: false },
  friday: { open: '09:00', close: '19:00', isClosed: false },
  saturday: { open: '10:00', close: '16:00', isClosed: false },
  sunday: { open: '09:00', close: '17:00', isClosed: true },
};

let mockDiscountCodes: DiscountCode[] = [
    { id: 'dc1', code: 'WELCOME10', discountPercentage: 10, expiryDate: new Date('2025-12-31'), isActive: true },
    { id: 'dc2', code: 'SUMMER20', discountPercentage: 20, expiryDate: new Date('2024-08-31'), isActive: true },
];

// --- API FUNCTIONS ---

const getStartOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

const simulateDelay = <T,>(data: T, delay: number = 500): Promise<T> =>
  new Promise(resolve => setTimeout(() => {
    // If data is undefined, we can't stringify/parse it. Just resolve with the undefined value.
    if (typeof data === 'undefined') {
      return resolve(data);
    }
    // Otherwise, deep clone the data to simulate a real API call returning a new object.
    resolve(JSON.parse(JSON.stringify(data)));
  }, delay));

// --- Auth ---
export const login = async (email: string, password: string, role: Role): Promise<User> => {
    let userPool: User[] = [];
    if (role === 'client') userPool = mockClients;
    else if (role === 'barber') userPool = mockBarbers;
    else if (role === 'admin') userPool = mockAdmins;

    const user = userPool.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user) {
        // Return a copy without the password
        const { password: _, ...userWithoutPassword } = user;
        return simulateDelay(userWithoutPassword, 800);
    } else {
        return new Promise((_, reject) => setTimeout(() => reject(new Error("Invalid credentials")), 800));
    }
}

export const registerClient = async (name: string, email: string, phone: string, password: string): Promise<Client> => {
    const existingUser = mockClients.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        return new Promise((_, reject) => setTimeout(() => reject(new Error("Email already exists")), 400));
    }

    const newClient: Client = {
        id: `c${Date.now()}`,
        name,
        email,
        phone,
        password, // The password will be stripped before returning
        role: 'client',
    };

    mockClients.push(newClient);

    const { password: _, ...userWithoutPassword } = newClient;
    return simulateDelay(userWithoutPassword as Client, 800);
}

export const changePassword = async (userId: string, oldPassword: string, newPassword:string): Promise<void> => {
    let userPool: (User & { password?: string })[] = [];
    const rolePrefix = userId.charAt(0);

    if (rolePrefix === 'b') userPool = mockBarbers;
    else if (rolePrefix === 'c') userPool = mockClients;
    else if (rolePrefix === 'a') userPool = mockAdmins;
    else return Promise.reject(new Error("Invalid user ID format."));

    const user = userPool.find(u => u.id === userId);

    if (!user) {
         return Promise.reject(new Error("User not found."));
    }

    if(user.password !== oldPassword) {
         return new Promise((_, reject) => setTimeout(() => reject(new Error("Incorrect current password.")), 800));
    }

    user.password = newPassword; // This updates the object in the mock array by reference

    return simulateDelay(undefined, 800);
}

export const createBarber = async (data: Omit<Barber, 'id' | 'role'> & { password: string }): Promise<Barber> => {
    const existingUser = mockBarbers.find(b => b.email.toLowerCase() === data.email.toLowerCase());
    if (existingUser) {
        return new Promise((_, reject) => setTimeout(() => reject(new Error("A barber with this email already exists.")), 400));
    }

    const newBarber: Barber = {
        ...data,
        id: `b${Date.now()}`,
        role: 'barber',
        // Use provided image or fall back to a deterministic-random image
        imageUrl: data.imageUrl || `https://randomuser.me/api/portraits/men/${(mockBarbers.length + 1) % 100}.jpg`,
    };

    mockBarbers.push(newBarber);

    // Don't return the password
    const { password: _, ...barberWithoutPassword } = newBarber;
    const result = await simulateDelay(barberWithoutPassword as Barber, 800);
    return { ...result, hireDate: result.hireDate ? new Date(result.hireDate) : undefined };
}

export const updateBarber = async (barberId: string, data: BarberUpdateData): Promise<Barber> => {
    const barberIndex = mockBarbers.findIndex(b => b.id === barberId);
    if (barberIndex === -1) {
        return Promise.reject(new Error("Barber not found"));
    }

    const barberToUpdate = mockBarbers[barberIndex];

    // Explicitly handle the password first to prevent accidental erasure.
    // If a new password is provided and is not an empty string, update it.
    // Otherwise, the existing password on `barberToUpdate` remains unchanged.
    if (data.password && data.password.length > 0) {
        barberToUpdate.password = data.password;
    }

    // Now, update all other properties from the data, making sure to exclude the password.
    const { password, ...otherData } = data;
    Object.assign(barberToUpdate, otherData);
    
    // Prepare the return object, ensuring the password is not sent back to the client.
    const { password: removedPassword, ...barberWithoutPassword } = barberToUpdate;
    const result = await simulateDelay(barberWithoutPassword as Barber, 800);
    return { ...result, hireDate: result.hireDate ? new Date(result.hireDate) : undefined };
}

export const deleteBarber = async (barberId: string): Promise<void> => {
    const barberIndex = mockBarbers.findIndex(b => b.id === barberId);
    if (barberIndex === -1) {
        return new Promise((_, reject) => setTimeout(() => reject(new Error("Barber not found to delete.")), 400));
    }

    mockBarbers.splice(barberIndex, 1);
    // Also remove their appointments
    mockAppointments = mockAppointments.filter(app => app.barberId !== barberId);

    return simulateDelay(undefined, 800);
}


// --- Data Fetching ---
export const getBarbers = async (): Promise<Barber[]> => {
  const barbersWithoutPasswords = mockBarbers.map(b => {
    const { password, ...rest } = b;
    return rest;
  });
  const result = await simulateDelay(barbersWithoutPasswords as Barber[]);
  return result.map(b => ({ ...b, hireDate: b.hireDate ? new Date(b.hireDate) : undefined }));
};

export const getClients = async (): Promise<Client[]> => {
  const clientsWithoutPasswords = mockClients.map(c => {
    const { password, ...rest } = c;
    return rest;
  });
  return simulateDelay(clientsWithoutPasswords as Client[]);
};

export const getServices = async (): Promise<Service[]> => {
  return simulateDelay([...mockServices]);
};

export const getBusinessHours = async (): Promise<BusinessHours> => {
    return simulateDelay(mockBusinessHours, 300);
};

export const updateBusinessHours = async (newHours: BusinessHours): Promise<void> => {
    mockBusinessHours = newHours;
    return simulateDelay(undefined, 800);
};

export const getAvailableTimeSlots = async (date: Date, barberId: string, serviceDurationMinutes: number): Promise<TimeSlot[]> => {
  const slots: TimeSlot[] = [];
  const cleanDate = getStartOfDay(date);
  const dayOfWeek = cleanDate.getDay();

  // Find today's hours
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek] as keyof BusinessHours;
  const todayHours = mockBusinessHours[dayName];

  if (todayHours.isClosed) return simulateDelay([]); // Closed all day

  const [openingHour, openingMinute] = todayHours.open.split(':').map(Number);
  const [closingHour, closingMinute] = todayHours.close.split(':').map(Number);
  
  const openingTime = new Date(cleanDate);
  openingTime.setHours(openingHour, openingMinute);

  const closingTime = new Date(cleanDate);
  closingTime.setHours(closingHour, closingMinute);


  for (let time = openingTime.getTime(); time < closingTime.getTime(); time += 15 * 60000) {
      const startTimeCandidate = new Date(time);
      const endTimeCandidate = new Date(startTimeCandidate.getTime() + serviceDurationMinutes * 60000);

      if (endTimeCandidate > closingTime) {
        continue;
      }

      const conflict = mockAppointments.some(app => {
        const appStartTime = new Date(app.startTime);
        const appEndTime = new Date(app.endTime);
        const appStartDateClean = getStartOfDay(appStartTime);

        return app.barberId === barberId &&
               app.status === AppointmentStatus.SCHEDULED &&
               appStartDateClean.getTime() === cleanDate.getTime() &&
               startTimeCandidate < appEndTime && 
               endTimeCandidate > appStartTime;
      });

      if (!conflict) {
        slots.push({ startTime: new Date(startTimeCandidate), endTime: new Date(endTimeCandidate), barberId });
      }
  }
  
  const resultWithStrings = await simulateDelay(slots, 700);
  // Re-hydrate date strings back into Date objects
  return resultWithStrings.map(slot => ({
    ...slot,
    startTime: new Date(slot.startTime),
    endTime: new Date(slot.endTime)
  }));
};

export const createAppointment = async (
    data: Omit<Appointment, 'id' | 'status'> & { serviceId: string, barberId: string }
): Promise<Appointment> => {
  const service = mockServices.find(s => s.id === data.serviceId);
  const barber = mockBarbers.find(b => b.id === data.barberId);

  if (!service || !barber) {
    throw new Error("Service or Barber not found");
  }

  const newAppointment: Appointment = {
    ...data,
    id: `app${Date.now()}${Math.random().toString(16).slice(2)}`,
    status: AppointmentStatus.SCHEDULED,
    serviceName: service.name,
    barberName: barber.name,
    price: service.price,
  };
  mockAppointments.push(newAppointment);
  const result = await simulateDelay(newAppointment, 600);
  // Re-hydrate date strings back into Date objects
  return {
      ...result,
      startTime: new Date(result.startTime),
      endTime: new Date(result.endTime)
  };
};

export const getAllAppointments = async (): Promise<Appointment[]> => {
  const appointments = [...mockAppointments];
  const sortedAppointments = appointments.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const resultWithStrings = await simulateDelay(sortedAppointments, 400);
  // Re-hydrate date strings back into Date objects
  return resultWithStrings.map(app => ({
      ...app,
      startTime: new Date(app.startTime),
      endTime: new Date(app.endTime)
  }));
};

export const getBarberAppointments = async (barberId: string): Promise<Appointment[]> => {
  const appointments = mockAppointments.filter(app => app.barberId === barberId);
  const sortedAppointments = appointments.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const resultWithStrings = await simulateDelay(sortedAppointments, 400);
  // Re-hydrate date strings back into Date objects
  return resultWithStrings.map(app => ({
      ...app,
      startTime: new Date(app.startTime),
      endTime: new Date(app.endTime)
  }));
};

export const getClientAppointments = async (clientEmail: string): Promise<Appointment[]> => {
    const appointments = mockAppointments.filter(app => app.clientEmail.toLowerCase() === clientEmail.toLowerCase());
    const sortedAppointments = appointments.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const resultWithStrings = await simulateDelay(sortedAppointments, 400);
    // Re-hydrate date strings back into Date objects
    return resultWithStrings.map(app => ({
        ...app,
        startTime: new Date(app.startTime),
        endTime: new Date(app.endTime)
    }));
};

// --- Marketing Tools ---

export const getDiscountCodes = async (): Promise<DiscountCode[]> => {
    const resultWithStrings = await simulateDelay([...mockDiscountCodes], 200);
    return resultWithStrings.map(code => ({
        ...code,
        expiryDate: new Date(code.expiryDate)
    }));
};

export const createDiscountCode = async (data: Omit<DiscountCode, 'id' | 'isActive'>): Promise<DiscountCode> => {
    const newCode: DiscountCode = {
        ...data,
        id: `dc${Date.now()}`,
        isActive: new Date(data.expiryDate) >= new Date(),
    };
    mockDiscountCodes.push(newCode);
    const result = await simulateDelay(newCode, 600);
    return { ...result, expiryDate: new Date(result.expiryDate) };
};

export const deleteDiscountCode = async (codeId: string): Promise<void> => {
    const codeIndex = mockDiscountCodes.findIndex(c => c.id === codeId);
    if (codeIndex === -1) {
        return Promise.reject(new Error("Discount code not found"));
    }
    mockDiscountCodes.splice(codeIndex, 1);
    return simulateDelay(undefined, 500);
};

export const sendPromotionalEmail = async (subject: string, body: string, recipients: Client[]): Promise<void> => {
    console.log(`--- SIMULATING EMAIL CAMPAIGN ---`);
    console.log(`Sending to ${recipients.length} selected clients:`);
    recipients.forEach(client => {
        console.log(`  - ${client.name} <${client.email}>`);
    });
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log(`---------------------------------`);
    // In a real app, this would loop through clients and use an email service.
    return simulateDelay(undefined, 1500);
}