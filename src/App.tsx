import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart2, 
  Bell, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  Plus, 
  CheckCircle2, 
  Circle,
  Menu,
  X,
  PlusCircle,
  Clock,
  User,
  Activity,
  Zap,
  Target,
  Waves,
  ArrowLeft,
  ArrowRight,
  History,
  Archive
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { translations, type Language, type TranslationKeys } from './translations';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface User {
  id: number;
  email: string;
  role: string;
  full_name?: string;
}

interface ActivityItem {
  id: number;
  type: string;
  duration: number;
  description: string;
  timestamp: string;
}

interface Reminder {
  id: number;
  title: string;
  due_date: string;
  completed: number;
  notify: number;
}

interface Goal {
  id: number;
  title: string;
  description: string;
  target_date: string;
  completed: boolean;
  created_at: string;
}

interface Habit {
  id: number;
  name: string;
  streak: number;
  last_completed: string | null;
}

type View = 'dashboard' | 'statistics' | 'reminders' | 'calendar' | 'goals' | 'archive' | 'history' | 'settings';

// --- Components ---

const ActivityButton = ({ type, onClick, icon: Icon, color, isActive }: any) => (
  <button 
    onClick={() => onClick(type)}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
      isActive 
        ? "bg-blue-600 text-white" 
        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5"
    )}
  >
    <Icon size={12} />
    <span>{type}</span>
  </button>
);

const Card = ({ children, className, title, subtitle }: any) => (
  <div className={cn("bg-white dark:bg-surface-dark rounded-[2rem] p-8 border border-slate-100 dark:border-border-dark", className)}>
    {title && (
      <div className="mb-6">
        <h3 className="text-xl font-display font-bold leading-none">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-2 font-medium">{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('planexa_token') || sessionStorage.getItem('planexa_token'));
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(localStorage.getItem('planexa_theme') as any || 'dark');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>((localStorage.getItem('planexa_language') as Language) || 'English');
  const [isAuthMode, setIsAuthMode] = useState<'login' | 'signup'>('login');
  const [statPeriod, setStatPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [habitFormName, setHabitFormName] = useState('');
  const [manualActivity, setManualActivity] = useState({ type: 'Teaching', duration: '30' });
  const [customActivityTypes, setCustomActivityTypes] = useState<any[]>([]);
  const [newCustomActivityName, setNewCustomActivityName] = useState('');

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    localStorage.setItem('planexa_theme', theme);
  }, [theme]);

  // Language persistent effect
  useEffect(() => {
    localStorage.setItem('planexa_language', selectedLanguage);
  }, [selectedLanguage]);

  const t = (key: TranslationKeys) => translations[selectedLanguage][key] || key;

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('faculty');
  const [fullName, setFullName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Clear auth error when switching modes
  useEffect(() => {
    setAuthError(null);
  }, [isAuthMode]);

  const [selectedActivity, setSelectedActivity] = useState('All Activities');
  const [activeTimer, setActiveTimer] = useState<{ type: string; start: number } | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  
  // Timer logic
  useEffect(() => {
    let interval: any;
    if (activeTimer) {
      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  const getEfficiency = () => {
    if (!activeTimer) return "0%";
    // Mock efficiency that fluctuates slightly during a session
    const base = 85;
    const flux = Math.sin(sessionSeconds / 10) * 5;
    return `${Math.round(base + flux)}%`;
  };

  // Data State
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [archivedActivities, setArchivedActivities] = useState<ActivityItem[]>([]);
  const [archivedReminders, setArchivedReminders] = useState<Reminder[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [actRes, remRes, statRes, habRes, userRes, customActRes, goalRes, archActRes, archRemRes] = await Promise.all([
        fetch('/api/activities', { headers }),
        fetch('/api/reminders', { headers }),
        fetch('/api/stats', { headers }),
        fetch('/api/habits', { headers }),
        fetch('/api/auth/me', { headers }),
        fetch('/api/custom_activities', { headers }),
        fetch('/api/goals', { headers }),
        fetch('/api/activities?archived=true', { headers }),
        fetch('/api/reminders?archived=true', { headers })
      ]);
      
      if (actRes.ok) setActivities(await actRes.json());
      if (remRes.ok) setReminders(await remRes.json());
      if (statRes.ok) setStats(await statRes.json());
      if (habRes.ok) setHabits(await habRes.json());
      if (userRes.ok) setUser(await userRes.json());
      if (customActRes.ok) setCustomActivityTypes(await customActRes.json());
      if (goalRes.ok) setGoals(await goalRes.json());
      if (archActRes.ok) setArchivedActivities(await archActRes.json());
      if (archRemRes.ok) setArchivedReminders(await archRemRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = isAuthMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body: any = { email, password };
    if (isAuthMode === 'signup') {
      body.role = role;
      body.full_name = fullName;
    }

    setIsAuthLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        if (isAuthMode === 'login') {
          if (rememberMe) {
            localStorage.setItem('planexa_token', data.token);
          } else {
            sessionStorage.setItem('planexa_token', data.token);
          }
          setToken(data.token);
          setUser(data.user);
          setCurrentView('dashboard');
        } else {
          setIsAuthMode('login');
          setAuthError('Account created! Sign in to continue.');
        }
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Authentication failed. Please check your connection.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('planexa_token');
    sessionStorage.removeItem('planexa_token');
    setToken(null);
    setUser(null);
    setCurrentView('dashboard');
  };

  const stopTracking = async () => {
    if (!activeTimer) return;
    
    const durationMinutes = Math.max(1, Math.round((Date.now() - activeTimer.start) / 60000));
    
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          type: activeTimer.type,
          duration: durationMinutes,
          description: `Logged session for ${activeTimer.type}`
        })
      });
      setActiveTimer(null);
      setSessionSeconds(0);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const logActivity = (type: string) => {
    if (activeTimer) {
      if (activeTimer.type === type) {
        stopTracking();
      } else {
        stopTracking().then(() => {
          setActiveTimer({ type, start: Date.now() });
        });
      }
    } else {
      setActiveTimer({ type, start: Date.now() });
    }
  };

  const completeHabit = async (id: number) => {
    try {
      const res = await fetch(`/api/habits/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const addCustomActivityType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomActivityName.trim()) return;
    try {
      const res = await fetch('/api/custom_activities', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCustomActivityName })
      });
      if (res.ok) {
        setNewCustomActivityName('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCustomActivityType = async (id: number) => {
    try {
      const res = await fetch(`/api/custom_activities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitFormName.trim()) return;
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: habitFormName })
      });
      if (res.ok) {
        setHabitFormName('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteHabit = async (id: number) => {
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const logManualActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          type: manualActivity.type, 
          duration: parseInt(manualActivity.duration) || 0
        })
      });
      if (res.ok) {
        fetchData();
        setManualActivity({ ...manualActivity, duration: '30' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addReminder = async (title: string, dueDate: string, notify: boolean) => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, due_date: dueDate, notify })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const archiveActivity = async (id: number) => {
    try {
      const res = await fetch(`/api/activities/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const archiveReminder = async (id: number) => {
    try {
      const res = await fetch(`/api/reminders/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReminderNotification = async (id: number, notify: boolean) => {
    try {
      const res = await fetch(`/api/reminders/${id}/notify`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ notify })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReminder = async (id: number) => {
    try {
      const res = await fetch(`/api/reminders/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const addGoal = async (title: string, description: string, targetDate: string) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, target_date: targetDate })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGoal = async (id: number, completed: boolean) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteGoal = async (id: number) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReminder = async (id: number) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem('planexa_token');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white dark:bg-bg-dark flex flex-col items-center justify-center p-6 transition-colors duration-500">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-xl p-10 border border-slate-200 dark:border-slate-800 shadow-xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-medium text-slate-900 dark:text-white mb-1">
              {isAuthMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-[9px] text-[#ef4444] font-bold uppercase tracking-widest">
              {isAuthMode === 'login' ? 'Login to continue PLANEXA' : 'Signup to get started'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Email</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                placeholder="Planexa@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? <Sun size={14} /> : <Moon size={14} />}
                </button>
              </div>
            </div>
            
            {isAuthMode === 'signup' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Full Name (Optional)</label>
                  <input 
                    type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Role</label>
                  <select 
                    value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="faculty">Select Role</option>
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setRememberMe(!rememberMe)}>
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center transition-all",
                  rememberMe ? "bg-blue-600 border-blue-500" : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                )}>
                  {rememberMe && <CheckCircle2 size={10} className="text-white" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">Remember Me</span>
              </div>
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center transition-all",
                  theme === 'dark' ? "bg-blue-600 border-blue-500" : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                )}>
                  {theme === 'dark' && <CheckCircle2 size={10} className="text-white" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">{t('appearance')}</span>
              </div>
            </div>

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-3 rounded-lg text-[11px] font-bold text-center mt-2 mb-2",
                  authError.includes('created') ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}
              >
                {authError}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-lg text-xs hover:opacity-90 transition-opacity mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthLoading ? 'Processing...' : (isAuthMode === 'login' ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-8 text-center text-[11px] text-slate-400">
            {isAuthMode === 'login' ? (
              <p>New User? <button onClick={() => setIsAuthMode('signup')} className="text-blue-500 font-bold">Create an account</button></p>
            ) : (
              <p>Already have an account? <button onClick={() => setIsAuthMode('login')} className="text-blue-500 font-bold">Login</button></p>
            )}
            <p className="mt-6 text-[#ef4444] font-bold">© 2026 PLANEXA</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-dark flex text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 overflow-x-hidden">
      
      {/* Sidebar - Overlay on mobile, toggleable on desktop */}
      <aside 
        className={cn(
          "w-64 bg-white dark:bg-sidebar-dark border-r border-slate-200 dark:border-[#1e293b] flex flex-col p-6 fixed h-full z-40 transition-colors",
          !isSidebarOpen && "hidden lg:flex"
        )}
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-black tracking-tighter text-blue-500">PLANEXA</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem active={currentView === 'dashboard'} icon={LayoutDashboard} label={t('dashboard')} onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }} />
          <NavItem active={currentView === 'statistics'} icon={BarChart2} label={t('productivity')} onClick={() => { setCurrentView('statistics'); setIsSidebarOpen(false); }} />
          <NavItem active={currentView === 'calendar'} icon={Calendar} label={t('calendar')} onClick={() => { setCurrentView('calendar'); setIsSidebarOpen(false); }} />
          <NavItem active={currentView === 'reminders'} icon={Bell} label={t('reminders')} onClick={() => { setCurrentView('reminders'); setIsSidebarOpen(false); }} />
          <NavItem active={currentView === 'goals'} icon={Target} label={t('goals')} onClick={() => { setCurrentView('goals'); setIsSidebarOpen(false); }} />
          <NavItem active={currentView === 'archive'} icon={Archive} label={t('archive')} onClick={() => { setCurrentView('archive'); setIsSidebarOpen(false); }} />
          <NavItem active={currentView === 'history'} icon={History} label={t('history')} onClick={() => { setCurrentView('history'); setIsSidebarOpen(false); }} />
          <NavItem active={currentView === 'settings'} icon={Settings} label={t('settings')} onClick={() => { setCurrentView('settings'); setIsSidebarOpen(false); }} />
        </nav>

        <div className="mt-auto space-y-4">
          <button className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-white"><Plus size={14} /> Add</button>
          <p className="text-[8px] text-slate-600">Manage cookies or opt out</p>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden">
        <header className="h-16 px-6 lg:px-10 flex items-center justify-between border-b border-slate-200 dark:border-[#1e293b] bg-white/80 dark:bg-bg-dark/50 backdrop-blur-md z-10 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <Menu size={20} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            {/* Minimal header */}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {currentView === 'dashboard' && (
                <div className="space-y-8 max-w-6xl">
                  {/* Greeting Section */}
                  <div className="flex flex-col gap-1">
                    <h1 className="text-sm font-bold text-[#ef4444]">Good Morning, {user?.email.split('@')[0] || 'User'}!</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Role: {user?.role || 'Guest'}</p>
                    <p className="text-[10px] text-slate-500">Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>

                  {/* Activities Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">{t('logActivity')}</h3>
                      {activeTimer && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-md">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-[9px] font-bold text-blue-400 uppercase">Tracking: {activeTimer.type}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActivityButton type="Teaching" icon={Activity} onClick={logActivity} isActive={activeTimer?.type === 'Teaching'} />
                      <ActivityButton type="Research" icon={BarChart2} onClick={logActivity} isActive={activeTimer?.type === 'Research'} />
                      <ActivityButton type="Admin Work" icon={Settings} onClick={logActivity} isActive={activeTimer?.type === 'Admin Work'} />
                      <ActivityButton type="Meetings" icon={Clock} onClick={logActivity} isActive={activeTimer?.type === 'Meetings'} />
                      <ActivityButton type="Personal" icon={User} onClick={logActivity} isActive={activeTimer?.type === 'Personal'} />
                      <ActivityButton type="Breaks" icon={Zap} onClick={logActivity} isActive={activeTimer?.type === 'Breaks'} />
                      
                      {customActivityTypes.map((ct) => (
                        <ActivityButton 
                          key={ct.id} 
                          type={ct.name} 
                          icon={Target} 
                          onClick={logActivity} 
                          isActive={activeTimer?.type === ct.name} 
                        />
                      ))}
                    </div>

                    {/* Quick Manual Log */}
                    <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                      <form onSubmit={logManualActivity} className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t('quickLog')}</label>
                          <select 
                            value={manualActivity.type}
                            onChange={(e) => setManualActivity({ ...manualActivity, type: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                          >
                            {['Teaching', 'Research', 'Admin Work', 'Meetings', 'Personal', 'Breaks'].map(a => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                            {customActivityTypes.map(ct => (
                              <option key={ct.id} value={ct.name}>{ct.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-full sm:w-32 space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t('duration')}</label>
                          <input 
                            type="number"
                            value={manualActivity.duration}
                            onChange={(e) => setManualActivity({ ...manualActivity, duration: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                            placeholder="30"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full sm:w-auto self-end px-6 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-500 transition-colors"
                        >
                          {t('add')}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Custom Activity Types Management */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">{t('customActivity')}</h3>
                      <form onSubmit={addCustomActivityType} className="flex gap-2">
                        <input 
                          type="text" 
                          value={newCustomActivityName}
                          onChange={(e) => setNewCustomActivityName(e.target.value)}
                          placeholder="New Activity Type..."
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1 text-[10px] outline-none focus:border-blue-500 transition-colors"
                        />
                        <button type="submit" className="p-1.5 bg-pink-600 rounded-lg text-white hover:bg-pink-500 transition-colors">
                          <Plus size={12} />
                        </button>
                      </form>
                    </div>
                    {customActivityTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customActivityTypes.map((ct) => (
                          <div key={ct.id} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-lg group">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{ct.name}</span>
                            <button 
                              onClick={() => deleteCustomActivityType(ct.id)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Habits Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">{t('habits')}</h3>
                      <form onSubmit={addHabit} className="flex gap-2">
                        <input 
                          type="text" 
                          value={habitFormName}
                          onChange={(e) => setHabitFormName(e.target.value)}
                          placeholder={t('addHabit')}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1 text-[10px] outline-none focus:border-blue-500 transition-colors"
                        />
                        <button type="submit" className="p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors">
                          <Plus size={12} />
                        </button>
                      </form>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {habits.map((h, i) => {
                        const isDone = h.last_completed === new Date().toISOString().split('T')[0];
                        
                        return (
                          <div key={h.id || i} className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl group transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm">
                            <div className="flex items-center gap-3 cursor-pointer overflow-hidden" onClick={() => completeHabit(h.id)}>
                              <div className={cn(
                                "w-5 h-5 border rounded flex items-center justify-center transition-all flex-shrink-0",
                                isDone ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
                              )}>
                                {isDone && <CheckCircle2 size={12} className="text-white" />}
                              </div>
                              <span className={cn("text-xs font-bold truncate transition-colors", isDone ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300")}>{h.name}</span>
                            </div>
                            <button 
                              onClick={() => deleteHabit(h.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Overview Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-600 dark:text-slate-200">{t('overview')}</h3>
                      {activeTimer && (
                        <button 
                          onClick={stopTracking}
                          className="px-3 py-1 bg-red-600/20 border border-red-500/40 text-red-500 text-[9px] font-bold uppercase rounded-md hover:bg-red-600/40 transition-all"
                        >
                          Stop Tracking
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[#1e1b4b]/40 border border-red-500/30 rounded-lg p-6 flex flex-col gap-1">
                        <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">{t('totalHours')}</span>
                        <h4 className="text-2xl font-mono font-bold text-red-500">{activeTimer ? formatTime(sessionSeconds) : "00:00:00"}</h4>
                      </div>
                      <div className="bg-[#1e1b4b]/40 border border-yellow-500/30 rounded-lg p-6 flex flex-col gap-1">
                        <span className="text-[8px] font-bold text-yellow-400 uppercase tracking-widest">{t('productivity')}</span>
                        <h4 className="text-2xl font-mono font-bold text-yellow-500">{getEfficiency()}</h4>
                      </div>
                      <div className="bg-[#1e1b4b]/40 border border-purple-500/30 rounded-lg p-6 flex flex-col gap-1">
                        <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest">Status</span>
                        <h4 className="text-2xl font-mono font-bold text-purple-500">{activeTimer ? t('allActivities') : "Idle"}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-200">Quick Actions</h3>
                    <div className="flex gap-4">
                      <button onClick={() => setCurrentView('calendar')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-[10px] font-bold text-white"><Calendar size={14} /> {t('calendar')}</button>
                      <button onClick={() => setCurrentView('reminders')} className="flex items-center gap-2 px-4 py-2 bg-pink-500 rounded-lg text-[10px] font-bold text-white"><Bell size={14} /> {t('reminders')}</button>
                      <button onClick={() => setCurrentView('statistics')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-lg text-[10px] font-bold text-white"><BarChart2 size={14} /> {t('productivity')}</button>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'statistics' && (
                <div className="space-y-10 max-w-5xl mx-auto flex flex-col items-center">
                  <h1 className="text-2xl font-display font-bold text-blue-500 uppercase tracking-[0.2em] mb-4">Statistics</h1>
                  
                  <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg flex gap-1 mb-8">
                    {(['Daily', 'Weekly', 'Monthly'] as const).map(p => (
                      <button 
                        key={p} onClick={() => setStatPeriod(p)} 
                        className={cn("px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all", statPeriod === p ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300")}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="w-full max-w-sm mb-12">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Filter by Activity:</p>
                     <div className="relative">
                        <select 
                          value={selectedActivity}
                          onChange={(e) => setSelectedActivity(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-bold appearance-none outline-none text-slate-900 dark:text-slate-300 cursor-pointer transition-colors"
                        >
                          <option>All Activities</option>
                          {['Teaching', 'Research', 'Admin Work', 'Meetings', 'Personal', 'Breaks'].map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Plus size={12} className="rotate-45 text-slate-400" />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    {(() => {
                      const baseStats = Array.isArray(stats) && stats.length > 0 ? stats : [
                        { name: 'Teaching', value: 30 },
                        { name: 'Research', value: 45 },
                        { name: 'Admin Work', value: 20 },
                        { name: 'Meetings', value: 25 },
                        { name: 'Personal', value: 15 },
                        { name: 'Breaks', value: 10 },
                      ];
                      
                      let displayStats = [...baseStats];
                      if (statPeriod === 'Daily') displayStats = baseStats.map(s => ({ ...s, value: Math.round(s.value * 0.4) }));
                      if (statPeriod === 'Monthly') displayStats = baseStats.map(s => ({ ...s, value: Math.round(s.value * 4.2) }));
                      
                      const filtered = displayStats.filter(s => selectedActivity === 'All Activities' || s.name === selectedActivity);
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="col-span-2 py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                             <BarChart2 className="mx-auto mb-4 text-slate-300 dark:text-slate-700" size={48} />
                             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('noSchedules')}</p>
                          </div>
                        );
                      }
                      
                      return (
                        <>
                          <Card className="shadow-sm" title={`${statPeriod} Activity Breakdown`}>
                            <div className="h-64 mt-4 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filtered}>
                                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#475569' : '#94a3b8', fontSize: 10}} />
                                   <YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#475569' : '#94a3b8', fontSize: 10}} />
                                   <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', border: 'none', borderRadius: '8px', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                   <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                     {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                   </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Card>
                          <Card className="shadow-sm" title="Productivity Trend">
                            <div className="h-64 mt-4 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={filtered}>
                                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#475569' : '#94a3b8', fontSize: 10}} />
                                   <YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#475569' : '#94a3b8', fontSize: 10}} />
                                   <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', border: 'none', borderRadius: '8px', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                   <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </Card>
                        </>
                      );
                    })()}
                  </div>

                  <div className="w-full mt-8 p-8 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['Teaching', 'Research', 'Admin Work', 'Meetings', 'Personal', 'Breaks'].map((cat, i) => {
                      const stat = stats.find(s => s.name === cat);
                      return (
                        <div key={i} className="flex flex-col gap-1 p-4 bg-white dark:bg-bg-dark rounded-xl border border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
                          </div>
                          <p className="text-xl font-mono font-bold">{stat ? Math.round(stat.value) : 0} <span className="text-[10px] text-slate-500 uppercase">min</span></p>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="mt-12 px-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[8px] font-bold uppercase tracking-widest text-slate-400 hover:text-white"
                  >
                    {t('back')}
                  </button>
                </div>
              )}

              {currentView === 'reminders' && <RemindersView reminders={reminders} onAdd={addReminder} onToggle={toggleReminder} onArchive={archiveReminder} onToggleNotify={toggleReminderNotification} onDelete={deleteReminder} t={t} />}
              {currentView === 'calendar' && <CalendarView activities={activities} reminders={reminders} t={t} />}
              {currentView === 'goals' && <GoalsView goals={goals} onAdd={addGoal} onToggle={toggleGoal} onDelete={deleteGoal} t={t} />}
              {currentView === 'archive' && <ArchiveView archivedActivities={archivedActivities} archivedReminders={archivedReminders} t={t} />}
              {currentView === 'history' && <HistoryView activities={activities} onArchive={archiveActivity} t={t} />}
              {currentView === 'settings' && <SettingsView theme={theme} setTheme={setTheme} user={user} setUser={setUser} handleLogOut={handleLogOut} t={t} selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Sub-Components ---

function StatusCard({ title, value, subtitle, icon: Icon, color, isActive }: any) {
  return (
    <Card className={cn(
      "flex flex-col justify-between overflow-hidden relative group cursor-default transition-all duration-500",
      isActive ? "ring-2 ring-blue-500/20" : "opacity-60 grayscale-[0.5]"
    )}>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none opacity-80">{title}</span>
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", 
          isActive ? color.replace('text-', 'bg-') + " bg-opacity-10" : "bg-slate-100 dark:bg-bg-dark"
        )}>
          <Icon size={18} className={isActive ? color : "text-slate-400"} />
        </div>
      </div>
      <div className="relative z-10">
        <h4 className={cn("text-4xl font-display font-black tracking-tight transition-all", isActive ? "text-slate-900 dark:text-white" : "text-slate-400")}>{value}</h4>
        <p className={cn("text-[9px] font-black mt-2 uppercase tracking-widest leading-none", isActive ? color : "text-slate-400")}>{subtitle}</p>
      </div>
      
      {/* Decorative background element */}
      {isActive && (
        <div className={cn("absolute -bottom-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity", color.replace('text-', 'bg-'))} />
      )}
    </Card>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-5 py-3 rounded-lg transition-all text-xs font-medium group relative",
        active 
          ? "bg-blue-600/90 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <Icon size={16} className={cn("transition-transform group-hover:scale-105", active ? "text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white")} />
      <span>{label}</span>
    </button>
  );
}

function RemindersView({ reminders, onAdd, onToggle, onArchive, onToggleNotify, onDelete, t }: any) {
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [notifyMe, setNotifyMe] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle && newDate && newTime) {
      onAdd(newTitle, `${newDate}T${newTime}`, notifyMe);
      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setNotifyMe(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center space-y-10">
      <h1 className="text-2xl font-display font-bold text-blue-500 uppercase tracking-[0.2em]">{t('reminders')}</h1>
      
      <Card className="w-full" title={t('reminders')}>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('fullName')}:</label>
            <input 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" 
              type="text" placeholder="Faculty Meeting" value={newTitle} onChange={e => setNewTitle(e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Date:</label>
            <input 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" 
              type="date" value={newDate} onChange={e => setNewDate(e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Time:</label>
              {newTime && (
                <span className="text-[10px] text-blue-500 font-bold">
                  {new Date(`2000-01-01T${newTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                </span>
              )}
            </div>
            <input 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" 
              type="time" value={newTime} onChange={e => setNewTime(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => setNotifyMe(!notifyMe)}>
            <div className={cn(
              "w-5 h-5 border rounded flex items-center justify-center transition-all",
              notifyMe ? "bg-blue-600 border-blue-500" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            )}>
              {notifyMe && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{t('notifyMe')}</span>
          </div>
          <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-lg text-[10px] uppercase tracking-widest mt-4 hover:opacity-90 transition-opacity">{t('save')}</button>
        </form>
      </Card>

      <div className="w-full space-y-4">
        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-200">Your Reminders</h3>
        <div className="space-y-4">
          {reminders.map((r: any) => (
            <div key={r.id} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-5 rounded-lg flex items-center justify-between group transition-colors shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => onToggle(r.id)} className={cn("transition-colors", r.completed ? "text-green-500" : "text-slate-300 hover:text-blue-500")}>
                  {r.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={cn("text-xs font-bold transition-all", r.completed ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-200")}>{r.title}</p>
                    <button 
                      onClick={() => onToggleNotify(r.id, !r.notify)}
                      className={cn("transition-colors", r.notify ? "text-blue-500" : "text-slate-400 hover:text-blue-400")}
                    >
                      <Bell size={12} fill={r.notify ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{new Date(r.due_date).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onArchive(r.id)}
                  title={t('archiveItem')}
                  className="text-amber-500 hover:text-amber-600 transition-colors"
                >
                  <Archive size={16} />
                </button>
                <button 
                  onClick={() => onDelete(r.id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <Plus size={16} className="rotate-45" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarView({ activities, reminders, t }: { activities: ActivityItem[], reminders: Reminder[], t: any }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const days = [];
  const totalDays = daysInMonth(currentMonth);
  const startOffset = firstDayOfMonth(currentMonth);

  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const getDayItems = (day: number) => {
    const dayStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayActivities = activities.filter(act => act.timestamp.startsWith(dayStr)).map(act => ({
      type: 'activity',
      label: act.type,
      value: `${act.duration || 0} min`,
      color: COLORS[['Teaching', 'Research', 'Admin Work', 'Meetings', 'Personal', 'Breaks'].indexOf(act.type) % COLORS.length] || '#3b82f6'
    }));

    const dayReminders = reminders.filter(rem => rem.due_date && rem.due_date.startsWith(dayStr)).map(rem => ({
      type: 'reminder',
      label: rem.title,
      value: rem.completed ? 'Completed' : 'Pending',
      color: '#8b5cf6' // Purple for reminders
    }));

    return [...dayActivities, ...dayReminders];
  };

  const hasItems = (day: number) => {
    const dayStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return activities.some(act => act.timestamp.startsWith(dayStr)) || reminders.some(rem => rem.due_date && rem.due_date.startsWith(dayStr));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

  return (
    <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-start gap-10">
      <div className="flex-1 w-full space-y-10">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft size={18} className="text-slate-500" />
            </button>
            <h1 className="text-2xl font-display font-bold text-blue-500 uppercase tracking-[0.2em]">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h1>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowRight size={18} className="text-slate-500" />
            </button>
          </div>
          <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid grid-cols-7 gap-4 md:gap-6 text-center w-full">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-[10px] font-bold text-slate-500">{d}</div>
          ))}
          {days.map((day, i) => (
            <div key={i} className="flex items-center justify-center relative">
              {day ? (
                <>
                  <button 
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-sm font-bold transition-all border",
                      selectedDay === day 
                        ? "bg-blue-600 border-blue-500 text-white shadow-glow" 
                        : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm"
                    )}
                  >
                    {day}
                  </button>
                  {hasItems(day) && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full" />
                  )}
                </>
              ) : <div className="w-12 h-12 md:w-14 md:h-14" />}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-6 lg:border-l lg:border-slate-200 lg:dark:border-slate-800 lg:pl-10">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('selectedDate')}</p>
          <p className="text-lg font-display font-bold text-slate-900 dark:text-white">
            {currentMonth.toLocaleString('default', { month: 'long' })} {selectedDay}, {currentMonth.getFullYear()}
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-4">{t('eventsAndReminders')}</h3>
            <div className="space-y-3">
              {getDayItems(selectedDay).length > 0 ? (
                getDayItems(selectedDay).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{item.label}</p>
                        <p className="text-[8px] font-medium text-slate-500 uppercase">{item.type === 'activity' ? t('logActivity') : t('reminders')}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2">
                      {item.value === 'Completed' ? t('completed') : item.value === 'Pending' ? t('pending') : item.value}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  <p className="text-[10px] font-medium text-slate-400 italic">{t('noSchedules')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalsView({ goals, onAdd, onToggle, onDelete, t }: { goals: Goal[], onAdd: any, onToggle: any, onDelete: any, t: any }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onAdd(title, description, date);
    setTitle('');
    setDescription('');
    setDate('');
    setIsAdding(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-blue-500 uppercase tracking-[0.2em]">{t('goals')}</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-500 transition-all active:scale-95 shadow-glow"
        >
          {isAdding ? t('cancel') : `+ ${t('add')}`}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-8 mb-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('goals')}</label>
                    <input 
                      type="text" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Master React Hooks"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('calendar')}</label>
                    <input 
                      type="date" value={date} onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Details about your personal development goal..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 h-24 text-slate-900 dark:text-white"
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-glow">{t('save')}</button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className={cn(
            "p-6 rounded-3xl border transition-all group",
            goal.completed 
              ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60" 
              : "bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 hover:border-blue-500/50"
          )}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => onToggle(goal.id, !goal.completed)}
                  className={cn(
                    "mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                    goal.completed ? "bg-blue-500 border-blue-500" : "border-slate-200 dark:border-slate-700"
                  )}
                >
                  {goal.completed && <CheckCircle2 size={12} className="text-white" />}
                </button>
                <div className="space-y-1">
                  <h3 className={cn("text-sm font-bold", goal.completed ? "line-through text-slate-400" : "text-slate-900 dark:text-white")}>{goal.title}</h3>
                  {goal.description && <p className="text-[10px] text-slate-500">{goal.description}</p>}
                  {goal.target_date && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <Calendar size={10} className="text-blue-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{goal.target_date}</span>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => onDelete(goal.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {goals.length === 0 && !isAdding && (
          <div className="col-span-1 md:col-span-2 py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Target className="mx-auto mb-4 text-slate-300 dark:text-slate-700" size={48} />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No goals set yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ArchiveView({ archivedActivities, archivedReminders, t }: { archivedActivities: ActivityItem[], archivedReminders: Reminder[], t: any }) {
  const [activeTab, setActiveTab] = useState<'activities' | 'reminders'>('activities');

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center space-y-8 pb-20">
      <h1 className="text-2xl font-display font-bold text-blue-500 uppercase tracking-[0.2em]">{t('archive')}</h1>
      
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('activities')}
          className={cn("px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'activities' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}
        >
          {t('allActivities')}
        </button>
        <button 
          onClick={() => setActiveTab('reminders')}
          className={cn("px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'reminders' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}
        >
          {t('reminders')}
        </button>
      </div>

      <div className="w-full space-y-4">
        {activeTab === 'activities' && (
          archivedActivities.length > 0 ? (
            archivedActivities.map((act, i) => (
              <div key={i} className="bg-white/50 dark:bg-surface-dark/50 p-6 rounded-3xl border border-dotted border-slate-200 dark:border-slate-800 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-4">
                  <Activity size={18} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-400">{act.type}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{new Date(act.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-slate-500">{act.duration}m</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl w-full">
              <Archive className="mx-auto mb-4 text-slate-200 dark:text-slate-800" size={48} />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('noArchived')}</p>
            </div>
          )
        )}

        {activeTab === 'reminders' && (
          archivedReminders.length > 0 ? (
            archivedReminders.map((rem, i) => (
              <div key={i} className="bg-white/50 dark:bg-surface-dark/50 p-6 rounded-3xl border border-dotted border-slate-200 dark:border-slate-800 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-4">
                  <Bell size={18} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-400">{rem.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{new Date(rem.due_date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rem.completed ? t('completed') : t('pending')}</p>
                </div>
              </div>
            ))
          ) : (
             <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl w-full">
              <Archive className="mx-auto mb-4 text-slate-200 dark:text-slate-800" size={48} />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('noArchived')}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function HistoryView({ activities, onArchive, t }: { activities: any[], onArchive: any, t: any }) {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center space-y-10 pb-20">
      <h1 className="text-2xl font-display font-bold text-blue-500 uppercase tracking-[0.2em]">{t('history')}</h1>
      <div className="w-full space-y-4">
        {activities.length > 0 ? (
          activities.map((act, i) => (
            <div key={i} className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group transition-all hover:border-blue-500/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                  <Activity size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{act.type}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{new Date(act.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-blue-500">{act.duration}m</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Min</p>
                </div>
                <button 
                  onClick={() => onArchive(act.id)}
                  title={t('archiveItem')}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-amber-500 transition-all active:scale-95"
                >
                  <Archive size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <Card className="w-full py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
            <History className="mx-auto mb-4 text-slate-300 dark:text-slate-700" size={48} />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('noSchedules')}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function SettingsView({ theme, setTheme, user, setUser, handleLogOut, t, selectedLanguage, setSelectedLanguage }: any) {
  const [activeSubView, setActiveSubView] = useState<'none' | 'edit-profile' | 'language' | 'terms' | 'privacy'>('none');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [role, setRole] = useState(user?.role || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('planexa_token')}`
        },
        body: JSON.stringify({ full_name: fullName, role })
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setActiveSubView('none');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const languages = ["English", "Hindi", "Tamil"];

  const settingsItems = [
    { 
      label: t('profileInfo'), 
      sub: user?.full_name ? `${user.full_name} (${user.role})` : user?.role,
      action: () => setActiveSubView('edit-profile') 
    },
    { 
      label: `${t('appearance')} (${theme === 'dark' ? 'Dark' : 'Light'})`, 
      sub: "Toggle theme",
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark') 
    },
    { 
      label: t('language'), 
      sub: selectedLanguage, 
      action: () => setActiveSubView('language') 
    },
    { label: t('notifications'), sub: "Enabled", action: () => alert("Push notifications enabled") },
    { label: t('terms'), sub: "View agreements", action: () => setActiveSubView('terms') },
    { label: t('privacy'), sub: "Data usage info", action: () => setActiveSubView('privacy') }
  ];

  if (activeSubView === 'edit-profile') {
    return (
      <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveSubView('none')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('back')}</span>
          </button>
          <h1 className="text-xl font-display font-bold text-blue-500 uppercase tracking-[0.2em]">{t('editProfile')}</h1>
          <div className="w-10" />
        </div>

        <Card className="p-8">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('fullName')}</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('fullName')}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-xs font-semibold focus:border-blue-500 transition-all outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('role')}</label>
              <input 
                type="text" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Professor, Researcher"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-xs font-semibold focus:border-blue-500 transition-all outline-none text-slate-900 dark:text-white"
              />
            </div>
            
            <div className="pt-4 space-y-3">
              <button 
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-glow transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "SAVING..." : t('save')}
              </button>
              <button 
                type="button"
                onClick={() => setActiveSubView('none')}
                className="w-full text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-widest"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (activeSubView === 'language') {
    return (
      <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveSubView('none')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('back')}</span>
          </button>
          <h1 className="text-xl font-display font-bold text-blue-500 uppercase tracking-[0.2em]">{t('selectLanguage')}</h1>
          <div className="w-10" />
        </div>

        <div className="space-y-3">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setSelectedLanguage(lang as Language);
                setActiveSubView('none');
              }}
              className={cn(
                "w-full flex items-center justify-between p-6 rounded-3xl border transition-all active:scale-98",
                selectedLanguage === lang
                  ? "bg-blue-600 border-blue-500 text-white shadow-glow"
                  : "bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white hover:border-blue-500/50"
              )}
            >
              <span className="text-xs font-bold uppercase tracking-widest">{lang}</span>
              {selectedLanguage === lang && <div className="w-2 h-2 bg-white rounded-full shadow-glow" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeSubView === 'terms' || activeSubView === 'privacy') {
    const title = activeSubView === 'terms' ? t('terms') : t('privacy');
    const content = activeSubView === 'terms' ? t('termsContent') : t('privacyContent');

    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900 dark:text-white pb-20">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveSubView('none')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('back')}</span>
          </button>
          <h1 className="text-xl font-display font-bold text-blue-500 uppercase tracking-[0.2em]">{title}</h1>
          <div className="w-10" />
        </div>

        <Card className="p-10 leading-relaxed">
          <div className="whitespace-pre-wrap text-sm font-medium text-slate-600 dark:text-slate-300">
            {content}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center space-y-10">
      <h1 className="text-2xl font-display font-bold text-blue-500 uppercase tracking-[0.2em] mb-4">{t('settings')}</h1>
      
      <div className="w-full space-y-4">
        {settingsItems.map((item, i) => (
          <div key={i} className="group cursor-pointer bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 p-6 rounded-3xl hover:border-blue-500/50 transition-all" onClick={item.action}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest group-hover:text-blue-500 transition-colors">{item.label}</span>
                {item.sub && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.sub}</p>}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                <Plus size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        ))}

        <div className="pt-10 w-full">
          <button 
            onClick={handleLogOut}
            className="w-full group flex items-center justify-center gap-3 py-4 rounded-3xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <LogOut size={16} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">{t('logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
