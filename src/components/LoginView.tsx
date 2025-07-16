import React, { useState, useEffect } from 'react';
import { Role, Locale, BusinessHours } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getTranslation } from '../translations';
import { getBusinessHours } from '../services/apiService';

interface LoginViewProps {
  language: Locale;
  toggleLanguage: () => void;
}

// By defining these components outside LoginView, we prevent them from being
// re-created on every render. This is a crucial performance optimization and
// prevents bugs like input fields losing focus unexpectedly.
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
   <input {...props} className={`w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder-slate-400 ${props.className}`} />
);

// Props for our custom button, ensuring we pass the loading state explicitly.
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  loadingText: string;
  isLoading: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ text, loadingText, isLoading, ...props }) => (
  <button
      {...props}
      disabled={isLoading || props.disabled}
      className="w-full font-semibold py-3 px-4 rounded-lg transition-colors duration-150 bg-amber-500 hover:bg-amber-600 text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
  >
      {isLoading ? loadingText : text}
  </button>
);


const LoginView: React.FC<LoginViewProps> = ({ language, toggleLanguage }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  // Login state
  const [activeTab, setActiveTab] = useState<Role>('client');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const { login, register, isLoading } = useAuth();
  
  const [shopStatus, setShopStatus] = useState<'Checking...' | 'Open' | 'Closed'>('Checking...');

  useEffect(() => {
    // Check for remembered user on component mount
    try {
      const rememberedData = localStorage.getItem('barberapp_remember');
      if (rememberedData) {
        const { email, role } = JSON.parse(rememberedData);
        setLoginEmail(email);
        setActiveTab(role);
        setRememberMe(true);
      }
    } catch (e) {
      console.error("Failed to parse remembered user data", e);
      localStorage.removeItem('barberapp_remember'); // Clear corrupted data
    }
    
    // Fetch business hours to determine shop status
    getBusinessHours().then(hours => {
      const now = new Date();
      const dayIndex = now.getDay(); // 0 for Sun, 1 for Mon...
      const dayMap: (keyof BusinessHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayKey = dayMap[dayIndex];
      const todayHours = hours[todayKey];

      if (todayHours.isClosed) {
        setShopStatus('Closed');
        return;
      }
      
      const [openH, openM] = todayHours.open.split(':').map(Number);
      const [closeH, closeM] = todayHours.close.split(':').map(Number);

      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
      const openTimeMinutes = openH * 60 + openM;
      const closeTimeMinutes = closeH * 60 + closeM;
      
      if (currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes) {
          setShopStatus('Open');
      } else {
          setShopStatus('Closed');
      }

    }).catch(err => {
        console.error("Failed to fetch business hours", err);
        setShopStatus('Closed'); // Default to closed on error
    });

  }, []); // Empty array ensures this runs only once on mount

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(loginEmail, loginPassword, activeTab, rememberMe);
    } catch (err) {
      setError(getTranslation('invalidCredentialsError', language));
      setLoginPassword('');
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (regPassword !== regConfirmPassword) {
        setError(getTranslation('passwordsDoNotMatchError', language));
        return;
    }
    try {
        await register(regName, regEmail, regPhone, regPassword);
        // On success, auth context will handle redirect
    } catch (err: any) {
        if (err.message.includes("Email already exists")) {
            setError(getTranslation('emailExistsError', language));
        } else {
            setError(getTranslation('registrationFailedError', language));
        }
        console.error(err);
    }
  };

  const roles: Role[] = ['client', 'barber', 'admin'];
  
  const renderLoginForm = () => (
    <>
        <div className="flex border-b border-slate-700 mb-6">
            {roles.map(role => (
                <button
                    key={role}
                    onClick={() => setActiveTab(role)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors capitalize
                    ${activeTab === role
                        ? 'text-amber-500 border-b-2 border-amber-500'
                        : 'text-slate-400 hover:text-white'
                    }`}
                >
                   {getTranslation(`role${role.charAt(0).toUpperCase() + role.slice(1)}` as any, language)}
                </button>
            ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label htmlFor="login-identifier" className="block text-sm font-medium text-slate-300 mb-1">
                  {activeTab === 'admin' || activeTab === 'barber' ? getTranslation('usernameLabel', language) : getTranslation('emailLabel', language)}
                </label>
                <Input 
                  type={activeTab === 'admin' || activeTab === 'barber' ? 'text' : 'email'} 
                  id="login-identifier" 
                  value={loginEmail} 
                  onChange={e => setLoginEmail(e.target.value)} 
                  required 
                  autoComplete={activeTab === 'admin' || activeTab === 'barber' ? 'username' : 'email'}
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('passwordLabel', language)}</label>
                <Input type="password" id="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required autoComplete="current-password" />
            </div>

            <div className="flex items-center">
                <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">
                   {getTranslation('rememberMeLabel', language)}
                </label>
            </div>

            {error && <p className="text-red-500 text-sm text-center" role="alert">{error}</p>}

            <AuthButton text={getTranslation('loginButton', language)} loadingText={getTranslation('loggingInButton', language)} type="submit" isLoading={isLoading} />
        </form>
        {activeTab === 'client' && (
            <div className="text-center mt-6 text-sm">
                <span className="text-slate-400">{getTranslation('signUpPrompt', language)}</span>{' '}
                <button onClick={() => {setIsRegistering(true); setError(null);}} className="font-medium text-amber-500 hover:text-amber-400">
                    {getTranslation('signUpButton', language)}
                </button>
            </div>
        )}
    </>
  );
  
  const renderRegisterForm = () => (
    <>
        <h2 className="text-2xl font-bold text-center text-slate-100 mb-6">{getTranslation('createAccountTitle', language)}</h2>
        <form onSubmit={handleRegister} className="space-y-4">
             <div>
                <label htmlFor="regName" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('fullNameLabelRequired', language)}</label>
                <Input type="text" id="regName" value={regName} onChange={e => setRegName(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="regEmail" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('emailLabel', language)}</label>
                <Input type="email" id="regEmail" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="regPhone" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('phoneLabelRequired', language)}</label>
                <Input type="tel" id="regPhone" value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="regPassword" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('passwordLabel', language)}</label>
                <Input type="password" id="regPassword" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="regConfirmPassword" className="block text-sm font-medium text-slate-300 mb-1">{getTranslation('confirmPasswordLabel', language)}</label>
                <Input type="password" id="regConfirmPassword" value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} required />
            </div>

            {error && <p className="text-red-500 text-sm text-center" role="alert">{error}</p>}
            
            <AuthButton text={getTranslation('createAccountButton', language)} loadingText={getTranslation('creatingAccountButton', language)} type="submit" isLoading={isLoading} />
        </form>
        <div className="text-center mt-6 text-sm">
            <span className="text-slate-400">{getTranslation('backToLoginPrompt', language)}</span>{' '}
            <button onClick={() => {setIsRegistering(false); setError(null);}} className="font-medium text-amber-500 hover:text-amber-400">
                {getTranslation('backToLoginLink', language)}
            </button>
        </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
            <div className="text-center mb-8 space-y-4">
                <h1 className="text-6xl font-bold text-amber-500">LUCIA APP</h1>
                {shopStatus === 'Checking...' ? (
                    <div className="h-12 flex items-center justify-center">
                        <p className="text-slate-400 text-lg animate-pulse">
                            {getTranslation('checkingStatus', language)}
                        </p>
                    </div>
                ) : (
                    <div className={`
                        w-full max-w-[240px] mx-auto p-1 rounded-lg border-2 font-bold text-xl uppercase tracking-widest
                        transition-all duration-500 text-center
                        ${shopStatus === 'Open'
                            ? 'border-green-500 text-green-400 shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#22c55e,0_0_15px_#22c55e,0_0_30px_#22c55e] [text-shadow:0_0_5px_#fff,0_0_10px_#4ade80]'
                            : 'border-red-500 text-red-400 shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#ef4444,0_0_15px_#ef4444,0_0_30px_#ef4444] [text-shadow:0_0_5px_#fff,0_0_10px_#f87171]'
                        }
                    `}>
                        {shopStatus === 'Open' 
                            ? getTranslation('shopStatusOpenShort', language)
                            : getTranslation('shopStatusClosedShort', language)
                        }
                    </div>
                )}
                <p className="text-slate-400 pt-2">{getTranslation('loginSubtitle', language)}</p>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-xl p-8">
                {isRegistering ? renderRegisterForm() : renderLoginForm()}
            </div>
             <div className="text-center mt-6">
                 <button
                    onClick={toggleLanguage}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                    aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
                >
                    {language === 'en' ? 'Español' : 'English'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default LoginView;