import React, { useState, useEffect } from 'react';
import { Barber, Locale } from '../types';
import { getTranslation } from '../translations';

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
   <input {...props} className={`w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder-slate-400 disabled:bg-slate-800 disabled:cursor-not-allowed ${props.className}`} />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
   <textarea {...props} rows={4} className={`w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder-slate-400 ${props.className}`} />
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


interface CreateBarberViewProps {
  onSave: (barberData: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  language: Locale;
  existingBarber: Barber | null;
  onDelete?: (barberId: string) => void;
}

const CreateBarberView: React.FC<CreateBarberViewProps> = ({ onSave, onCancel, isLoading, language, existingBarber, onDelete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [bio, setBio] = useState('');
  const [profitPercentage, setProfitPercentage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hireDate, setHireDate] = useState('');

  const isEditMode = !!existingBarber;

  useEffect(() => {
    if (existingBarber) {
      setName(existingBarber.name);
      setEmail(existingBarber.email);
      setSpecialties(existingBarber.specialties.join(', '));
      setBio(existingBarber.bio || '');
      setProfitPercentage(String(existingBarber.profitPercentage || ''));
      setImagePreview(existingBarber.imageUrl || null);
      setHireDate(existingBarber.hireDate ? new Date(existingBarber.hireDate).toISOString().split('T')[0] : '');
      setPassword(''); // Clear password field for edits
    }
  }, [existingBarber]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!isEditMode && !email)) return;
    
    const barberData: any = {
      name,
      specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
      bio,
      profitPercentage: profitPercentage ? parseFloat(profitPercentage) : undefined,
      imageUrl: imagePreview || undefined,
      hireDate: hireDate ? new Date(hireDate) : undefined,
    };
    
    if (!isEditMode) {
        barberData.email = email;
    }
    
    if (password) {
        barberData.password = password;
    }

    onSave(barberData);
  };

  return (
    <div className="bg-slate-800 p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-500 mb-6">{isEditMode ? getTranslation('updateBarberTitle', language) : getTranslation('createBarberTitle', language)}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="space-y-4 flex-grow">
                <div>
                  <label htmlFor="barberName" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('fullNameLabel', language)}</label>
                  <Input type="text" id="barberName" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                
                <div>
                  <label htmlFor="barberEmail" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('usernameLabel', language)}</label>
                  <Input type="text" id="barberEmail" value={email} onChange={e => setEmail(e.target.value)} required={!isEditMode} disabled={isEditMode} />
                </div>

                <div>
                  <label htmlFor="barberPassword" className="block text-sm font-medium text-slate-300 mb-1">
                    {isEditMode ? getTranslation('passwordLeaveBlankLabel', language) : getTranslation('passwordLabel', language)}
                  </label>
                  <Input type="password" id="barberPassword" value={password} onChange={e => setPassword(e.target.value)} required={!isEditMode} autoComplete="new-password" />
                </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center">
                 <label htmlFor="barberPhoto" className="block text-sm font-medium text-slate-300 mb-2">{getTranslation('uploadProfilePhotoLabel', language)}</label>
                 <div className="w-32 h-32 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden mb-2">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Barber preview" className="w-full h-full object-cover" />
                    ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    )}
                 </div>
                 <input type="file" id="barberPhoto" accept="image/*" onChange={handleImageChange} className="hidden" />
                 <label htmlFor="barberPhoto" className="cursor-pointer bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs font-semibold px-3 py-1 rounded-full transition-colors">
                    Choose File
                 </label>
            </div>
        </div>
        
        <hr className="border-slate-700 my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profitPercentage" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('profitPercentageLabel', language)}</label>
            <Input type="number" id="profitPercentage" value={profitPercentage} onChange={e => setProfitPercentage(e.target.value)} min="0" max="100" step="1" />
          </div>
          <div>
            <label htmlFor="hireDate" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('hireDateLabel', language)}</label>
            <Input type="date" id="hireDate" value={hireDate} onChange={e => setHireDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label htmlFor="barberSpecialties" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('specialtiesLabel', language)}</label>
          <Input type="text" id="barberSpecialties" value={specialties} onChange={e => setSpecialties(e.target.value)} placeholder="e.g. Fades, Beard Trims, Classic Cuts" />
        </div>

        <div>
          <label htmlFor="barberBio" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('bioLabel', language)}</label>
          <Textarea id="barberBio" value={bio} onChange={e => setBio(e.target.value)} />
        </div>
        
        <div className="flex flex-col sm:flex-row-reverse gap-4 pt-4">
            <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading 
                    ? (isEditMode ? getTranslation('updatingBarberButton', language) : getTranslation('savingBarberButton', language))
                    : (isEditMode ? getTranslation('updateBarberButton', language) : getTranslation('saveBarberButton', language))
                }
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
                {getTranslation('backToDashboardButton', language)}
            </Button>
            {isEditMode && onDelete && (
                 <button
                    type="button"
                    onClick={() => onDelete(existingBarber.id)}
                    disabled={isLoading}
                    className="w-full sm:w-auto font-semibold py-3 px-4 rounded-lg transition-colors duration-150 text-red-100 bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 disabled:opacity-50 sm:mr-auto"
                >
                    {getTranslation('deleteProfileButton', language)}
                </button>
            )}
        </div>
      </form>
    </div>
  );
};

export default CreateBarberView;