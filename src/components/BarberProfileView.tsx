import React, { useState } from 'react';
import { Barber, Locale } from '../types';
import { getTranslation } from '../translations';
import { BarberProfileViewProps } from '../types';

const Card: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className }) => (
  <div className={`bg-slate-800 p-6 rounded-lg shadow-xl ${className}`}>{children}</div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
   <input {...props} className={`w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder-slate-400 ${props.className}`} />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => (
  <button
    className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 bg-amber-500 hover:bg-amber-600 text-slate-900 focus:ring-amber-500
      ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);

const BarberProfileView: React.FC<BarberProfileViewProps> = ({ currentUser, onPasswordChange, isLoading, language }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError(getTranslation('passwordsDoNotMatchError', language));
            return;
        }
        if (!oldPassword || !newPassword) {
            setError(getTranslation('pleaseFillFields', language));
            return;
        }

        try {
            await onPasswordChange(oldPassword, newPassword);
            // On success, App.tsx will show a global success message
            // Clear fields after successful submission
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            // On failure, App.tsx will show a global error message, but we can also handle local form state if needed.
            console.error(err);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-amber-500">{getTranslation('myProfileTitle', language)}</h1>

            <Card>
                <h2 className="text-2xl font-semibold text-slate-100 mb-6 border-b border-slate-700 pb-3">{getTranslation('profileInfoTitle', language)}</h2>
                <div className="flex items-center space-x-6">
                    <img src={currentUser.imageUrl} alt={currentUser.name} className="w-24 h-24 rounded-full object-cover shadow-lg" />
                    <div className="space-y-2">
                        <p className="text-xl font-bold text-white">{currentUser.name}</p>
                        <p className="text-md text-slate-400">{getTranslation('usernameLabel', language)}: <span className="font-mono">{currentUser.email}</span></p>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {currentUser.specialties.map(spec => (
                                <span key={spec} className="bg-slate-600 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">{spec}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-2xl font-semibold text-slate-100 mb-6">{getTranslation('changePasswordTitle', language)}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                    <div>
                        <label htmlFor="oldPassword" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('currentPasswordLabel', language)}</label>
                        <Input type="password" id="oldPassword" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required autoComplete="current-password" />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('newPasswordLabel', language)}</label>
                        <Input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password"/>
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('confirmNewPasswordLabel', language)}</label>
                        <Input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password"/>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center" role="alert">{error}</p>}

                    <div className="pt-2">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? getTranslation('changingPasswordButton', language) : getTranslation('changePasswordButton', language)}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
export default BarberProfileView;
