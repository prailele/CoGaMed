//
//
import React, { useState, useEffect, useRef } from 'react';
import {
  PlusCircle, Search, Check, Terminal, Activity, Receipt, X, Copy, Paperclip,
  LogOut, Edit, UserPlus, Users, Calendar, RefreshCw,
  ShieldCheck, Trash2, Trash, Eye, Download, AlertTriangle,
  FileText, ChevronRight
} from 'lucide-react';

import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, getDocs, onSnapshot, doc, setDoc, deleteDoc,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager
} from "firebase/firestore";
import {
  getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail,
  signInAnonymously, setPersistence, browserLocalPersistence
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDwT-LmHFyO-IbYDGqLOxRf2xCjjHA3ayw",
  authDomain: "control-gastos-medicos.firebaseapp.com",
  projectId: "control-gastos-medicos",
  storageBucket: "control-gastos-medicos.firebasestorage.app",
  messagingSenderId: "602821115987",
  appId: "1:602821115987:web:6e61fbcad659ec9a4446a6",
  measurementId: "G-Z4ZN28BFBF"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
const storage = getStorage(firebaseApp);


// DATABASE_ID: Mantén "control-gastos-v1-test" aquí y cámbialo a "control-gastos-v1" en tu localhost
const DATABASE_ID = "control-gastos-v1";
const ADMIN_EMAILS = ["prailele@gmail.com"];

// --- FUNCIONES DE ESTILO ---
const getStatusStyles = (status) => {
  switch(status) {
    case 'INGRESADO': return 'bg-white/50 text-amber-600 border-white/40 backdrop-blur-sm shadow-sm';
    case 'EN ISAPRE': return 'bg-white/50 text-emerald-500 border-white/40 backdrop-blur-sm shadow-sm';
    case 'EN SEGURO': return 'bg-white/50 text-violet-500 border-white/40 backdrop-blur-sm shadow-sm';
    case 'FINALIZADO': return 'bg-white/50 text-slate-500 border-white/40 backdrop-blur-sm shadow-sm';
    default: return 'bg-white/50 text-slate-600 border-white/40 backdrop-blur-sm shadow-sm';
  }
};

const getStatusGlow = (status) => {
  switch(status) {
    case 'INGRESADO': return 'bg-amber-300/40';
    case 'EN ISAPRE': return 'bg-emerald-400/40';
    case 'EN SEGURO': return 'bg-violet-400/40';
    case 'FINALIZADO': return 'bg-slate-400/30';
    default: return 'bg-slate-400/30';
  }
};

const getFilterBadgeStyles = (status, isActive) => {
  if (!isActive) return 'bg-white/30 text-slate-400 border-white/40 hover:bg-white/50 hover:text-slate-500 backdrop-blur-sm shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]';
  
  switch(status) {
    case 'TODOS': return 'bg-gradient-to-r from-slate-100/80 to-white/80 text-slate-800 border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.05)] backdrop-blur-md';
    case 'INGRESADO': return 'bg-gradient-to-r from-amber-200/60 to-amber-100/60 text-amber-700 border-amber-300/50 shadow-[0_0_15px_rgba(251,191,36,0.2)] backdrop-blur-md';
    case 'EN ISAPRE': return 'bg-gradient-to-r from-emerald-200/60 to-emerald-100/60 text-emerald-700 border-emerald-300/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-blur-md';
    case 'EN SEGURO': return 'bg-gradient-to-r from-violet-200/60 to-violet-100/60 text-violet-700 border-violet-300/50 shadow-[0_0_15px_rgba(139,92,246,0.2)] backdrop-blur-md';
    case 'FINALIZADO': return 'bg-gradient-to-r from-slate-200/60 to-slate-100/60 text-slate-700 border-slate-300/50 shadow-[0_0_15px_rgba(148,163,184,0.2)] backdrop-blur-md';
    default: return 'bg-white/80 text-slate-800 border-white/60 backdrop-blur-md';
  }
};

// --- COMPONENTE DE ADJUNTO ---
const InlineFile = ({ label, fileData, onFileSelect, onFileDelete, isLoading, typeKey }) => {
  const hiddenInput = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!fileData) setShowConfirm(false);
  }, [fileData]);

  return (
    <div className="flex justify-end mt-1.5 w-full">
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        ref={hiddenInput}
        onChange={(e) => { if (e.target.files[0]) onFileSelect(typeKey, e.target.files[0]); e.target.value = null; }}
      />
      {!fileData ? (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => hiddenInput.current.click()}
          className="flex items-center justify-end w-full gap-1.5 py-1.5 px-2.5 transition-colors text-slate-500 bg-white/40 hover:text-indigo-500 hover:bg-white/60 border border-white/50 backdrop-blur-sm rounded-lg disabled:opacity-50 shadow-sm"
        >
          {isLoading ? <RefreshCw size={10} className="animate-spin" /> : <Paperclip size={10} strokeWidth={2.5} />}
          <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
        </button>
      ) : (
        <div className="flex items-center justify-between w-full gap-1.5 text-teal-700 bg-teal-50/60 px-2 py-1.5 rounded-lg shadow-sm border border-teal-100/50 backdrop-blur-sm animate-in zoom-in">
          <button type="button" onClick={() => window.open(fileData, '_blank')} className="flex items-center gap-1 hover:text-teal-900 overflow-hidden w-full">
            <Eye size={10} className="shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
          </button>
          {!showConfirm ? (
            <button type="button" onClick={() => setShowConfirm(true)} className="text-rose-400 hover:text-rose-600 border-l border-teal-200/50 pl-1.5 ml-0.5 shrink-0 transition-colors"><X size={10} strokeWidth={3} /></button>
          ) : (
            <div className="flex items-center gap-1.5 border-l border-teal-200/50 pl-1.5 ml-0.5 shrink-0 animate-in slide-in-from-right-2">
              <button type="button" onClick={() => setShowConfirm(false)} className="text-[9px] font-black text-slate-400 hover:text-slate-600">NO</button>
              <button type="button" onClick={() => { setShowConfirm(false); onFileDelete(typeKey); }} className="text-[9px] font-black text-rose-500 hover:text-rose-700">SÍ</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const App = () => {
  const [debugLogs, setDebugLogs] = useState([]);
  const addLog = (msg) => setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${String(msg)}`, ...prev].slice(0, 25));

  const [user, setUser] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [records, setRecords] = useState([]);
  const [personasConfig, setPersonasConfig] = useState([]);
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const [activePersonaId, setActivePersonaId] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newAuthEmail, setNewAuthEmail] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPersonaModalOpen, setIsAddPersonaModalOpen] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [editPersonaId, setEditPersonaId] = useState(null);
  const [editPersonaName, setEditPersonaName] = useState('');
  const [deletePersonaConfirmId, setDeletePersonaConfirmId] = useState(null);
  const [deleteRecordConfirmId, setDeleteRecordConfirmId] = useState(null);
  
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [showToast, setShowToast] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  
  const [editRecordId, setEditRecordId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [highlightedRecord, setHighlightedRecord] = useState(null);

  const ESTADOS = ['INGRESADO', 'EN ISAPRE', 'EN SEGURO', 'FINALIZADO'];
  const initialRecordState = { fecha: new Date().toISOString().split('T')[0], descripcion: '', valorTotal: '', estado: 'INGRESADO' };
  const [newRecord, setNewRecord] = useState(initialRecordState);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // --- FUENTES EXTERNAS ---
  useEffect(() => {
    if (!document.getElementById('plus-jakarta-font')) {
      const link = document.createElement('link');
      link.id = 'plus-jakarta-font';
      link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // --- FUNCIONES CORE ---
  const executeDbOp = async (promise) => {
    if (navigator.onLine) {
      await promise;
    }
  };

  const showNotification = (text, type = 'info') => { setStatusMsg({ text, type }); setShowToast(true); setTimeout(() => setShowToast(false), 5000); };
  
  const formatNumberOnly = (v) => new Intl.NumberFormat('es-CL').format(Number(v) || 0);
  const formatCurrency = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(v) || 0);
  const calculateFinalBalance = (r) => (Number(r.valorTotal) || 0) - (Number(r.isapreAbonado) || 0) - (Number(r.metlifeAbonado) || 0);

  const copyToClipboard = (text) => {
    const el = document.createElement('textarea'); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    showNotification("Copiado al portapapeles", 'info');
  };

  const exportAllToCSV = () => {
    // Filtrar solo los registros de pacientes que actualmente existen (sin registros fantasma)
    const validRecordsToExport = records.filter(r => personasConfig.some(p => String(p.id) === String(r.personaId)));
    
    if (validRecordsToExport.length === 0) return showNotification("No hay registros para exportar", "error");
    
    // Títulos de columnas corregidos
    const headers = ["Paciente", "Fecha", "Descripción", "Monto Total", "Reembolso Isapre", "Reembolso Seguro", "Copago Final", "Estado"];
    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
    
    const rows = validRecordsToExport.map(r => {
      const p = personasConfig.find(per => String(per.id) === String(r.personaId));
      return [
        escapeCsv(p?.name || 'Desconocido'),
        escapeCsv(r.fecha),
        escapeCsv(r.descripcion),
        Number(r.valorTotal) || 0,
        Number(r.isapreAbonado) || 0,
        Number(r.metlifeAbonado) || 0,
        calculateFinalBalance(r),
        escapeCsv(r.estado)
      ];
    });
    
    const content = [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + content], { type: 'text/csv;charset=utf-8;' });
    
    // Se crea y adjunta el enlace temporalmente al documento para forzar la descarga sin bloqueos
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `control_gastos_medicos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddAuthorizedUser = async (e) => {
    e.preventDefault();
    if (!newAuthEmail || !user) return;
    try {
      setIsLoading(true);
      // Usamos el email como ID (formateado) para evitar duplicados
      const emailSafeId = newAuthEmail.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      await executeDbOp(setDoc(doc(db, 'artifacts', DATABASE_ID, 'public', 'data', 'authorized_users', emailSafeId), {
        email: newAuthEmail.toLowerCase().trim(),
        addedAt: Date.now()
      }));
      setNewAuthEmail('');
      showNotification("Usuario autorizado", "success");
    } catch (err) {
      showNotification("Error al autorizar", "error");
      addLog("Error auth: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAuthorizedUser = async (id) => {
    if (!user) return;
    try {
      await executeDbOp(deleteDoc(doc(db, 'artifacts', DATABASE_ID, 'public', 'data', 'authorized_users', id)));
      showNotification("Acceso revocado", "success");
    } catch (err) {
      showNotification("Error al eliminar", "error");
    }
  };

  const handleUpdateRecord = async (id, fields) => {
    if (!user) return;
    try {
      if (fields.estado !== undefined) {
        setHighlightedRecord(id);
        setTimeout(() => setHighlightedRecord(null), 2000);
      }
      const recordRef = doc(db, 'artifacts', DATABASE_ID, 'users', user.uid, 'reembolsos', id);
      await executeDbOp(setDoc(recordRef, fields, { merge: true }));
    } catch (e) { addLog(`ERROR DB: ${e.message}`); }
  };

  const handleUpdatePersona = async (id, newName) => {
    if (!user) return;
    try {
      await executeDbOp(setDoc(doc(db, 'artifacts', DATABASE_ID, 'users', user.uid, 'personas', id), { name: newName }, { merge: true }));
      showNotification("Paciente actualizado", "success");
    } catch (e) { addLog(`ERROR Paciente: ${e.message}`); }
  };

  const handleUploadFileToRecord = async (recordId, type, file) => {
    if (!user || user.isAnonymous) return;
    setIsLoading(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/docs/${recordId}_${type}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      const currentRec = records.find(r => r.id === recordId);
      await handleUpdateRecord(recordId, { files: { ...(currentRec?.files || {}), [type]: url } });
      addLog(`Archivo subido: ${type}`);
    } catch (e) { addLog(`Error en archivo: ${e.message}`); } finally { setIsLoading(false); }
  };

  // --- AUTENTICACIÓN ---
  useEffect(() => {
    const startAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        onAuthStateChanged(auth, async (u) => {
          if (u) {
            setUser(u);
            addLog(`Sesión Activa: ${u.email || 'Anónimo (' + u.uid + ')'}`);
            if (!u.isAnonymous) setIsAdmin(ADMIN_EMAILS.includes(u.email?.toLowerCase().trim()));
          } else {
            addLog("Iniciando sesión anónima de respaldo...");
            await signInAnonymously(auth);
          }
          setIsInitialLoad(false);
        });
      } catch (e) { addLog("Error de Auth: " + e.message); setIsInitialLoad(false); }
    };
    startAuth();
  }, []);

  // --- SINCRONIZACIÓN DE DATOS ---
  useEffect(() => {
    // RESTRICCIÓN ESTRICTA: Detener toda sincronización si no hay usuario o si es anónimo
    if (!user || user.isAnonymous) return;
    
    setRecords([]);
    setPersonasConfig([]);

    let unsubWhite = () => {};
    if (!user.isAnonymous) {
      unsubWhite = onSnapshot(collection(db, 'artifacts', DATABASE_ID, 'public', 'data', 'authorized_users'),
        (s) => setAuthorizedUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))
      );
    }
    
    const unsubP = onSnapshot(collection(db, 'artifacts', DATABASE_ID, 'users', user.uid, 'personas'), (s) => {
      try {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));
        setPersonasConfig(data);
      } catch (err) { addLog(`Error mapeo Pacientes: ${err.message}`); }
    });
    
    const unsubR = onSnapshot(collection(db, 'artifacts', DATABASE_ID, 'users', user.uid, 'reembolsos'), (s) => {
      try {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
        setRecords(data);
      } catch (err) { addLog(`CRÍTICO Error mapeando boletas: ${err.message}`); }
    });
    
    return () => { unsubWhite(); unsubP(); unsubR(); };
  }, [user?.uid]);

  // --- AUTO-SELECCIÓN DE PACIENTE ---
  useEffect(() => {
    if (personasConfig.length > 0) {
      const exists = personasConfig.find(p => p.id === activePersonaId);
      if (!exists) { setActivePersonaId(personasConfig[0].id); }
    }
  }, [personasConfig, activePersonaId]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const emailLower = email.toLowerCase().trim();
      if (!ADMIN_EMAILS.includes(emailLower) && authMode !== 'reset') {
        const snap = await getDocs(collection(db, 'artifacts', DATABASE_ID, 'public', 'data', 'authorized_users'));
        if (!snap.docs.some(d => d.data().email?.toLowerCase().trim() === emailLower)) throw new Error("UNAUTHORIZED");
      }
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, emailLower, password);
      } else if (authMode === 'signup') {
        if (password !== confirmPassword) throw new Error("MISMATCH");
        await createUserWithEmailAndPassword(auth, emailLower, password);
      } else {
        await sendPasswordResetEmail(auth, emailLower);
        showNotification("Correo enviado. Revisa tu bandeja o SPAM.", "success");
        setAuthMode('login');
      }
    } catch (err) {
      let m = err.message;
      if (err.message === "UNAUTHORIZED") m = "Email no autorizado";
      else if (err.message === "MISMATCH") m = "Las contraseñas no coinciden";
      showNotification(m, 'error');
    } finally { setIsLoading(false); }
  };

  const handleLogout = () => signOut(auth).then(() => { setShowAdminPanel(false); setActivePersonaId(null); setRecords([]); });

  const openRecordModal = (record = null) => {
    if (!activePersonaId) return showNotification("Selecciona un paciente primero", "error");
    if (record) { setEditRecordId(record.id); setNewRecord({ fecha: record.fecha, descripcion: record.descripcion, valorTotal: record.valorTotal, estado: record.estado }); }
    else { setEditRecordId(null); setNewRecord(initialRecordState); }
    setIsModalOpen(true);
  };

  if (isInitialLoad) return <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-stone-50 to-stone-100 text-xs font-black uppercase tracking-widest text-slate-400 italic">Conectando...</div>;

  // RESTRICCIÓN ESTRICTA: Bloquear acceso a la app si el usuario es anónimo
  if (!user || user.isAnonymous) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-stone-50 to-stone-100 p-4 font-sans">
        
        {/* TOAST DE NOTIFICACIONES EN LOGIN */}
        {showToast && (
          <div className={`fixed top-6 right-6 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 z-[100] animate-in slide-in-from-top-4 ${statusMsg.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
            {statusMsg.type === 'error' ? <AlertTriangle size={16} /> : <Check className="text-emerald-400" size={16} />}
            <span className="font-bold text-xs uppercase tracking-tight">{statusMsg.text}</span>
          </div>
        )}

        {/* LOGIN GLASSMORPHISM */}
        <div className="relative bg-white/30 backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-sm w-full border border-amber-200/50 text-center overflow-hidden">
          {/* Resplandores de fondo del login */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* ICONO APP */}
            <div className="bg-gradient-to-tr from-indigo-400/80 to-amber-200/80 backdrop-blur-xl border border-amber-100/60 w-14 h-14 rounded-[1rem] flex items-center justify-center text-indigo-950 shadow-[0_8px_20px_rgba(129,140,248,0.2)] mx-auto mb-6">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-black uppercase italic mb-1 tracking-tighter text-slate-800 leading-tight">Control de Gastos Médicos</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">{authMode === 'login' ? 'Iniciar Sesión' : authMode === 'signup' ? 'Registro' : 'Recuperar'}</p>
            
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-amber-200/40 outline-none text-sm font-bold text-center text-slate-700 placeholder:text-slate-400 focus:bg-white/70 focus:border-indigo-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" required />
              
              {authMode !== 'reset' && (
                <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-amber-200/40 outline-none text-sm font-bold text-center text-slate-700 placeholder:text-slate-400 focus:bg-white/70 focus:border-indigo-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" required />
              )}
              
              {authMode === 'signup' && (
                <input type="password" placeholder="Repetir Contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-amber-200/40 outline-none text-sm font-bold text-center text-slate-700 placeholder:text-slate-400 focus:bg-white/70 focus:border-indigo-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" required />
              )}
              
              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-400/80 to-amber-200/80 backdrop-blur-xl border border-amber-100/60 text-indigo-950 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_8px_20px_rgba(129,140,248,0.2)] hover:shadow-[0_10px_25px_rgba(129,140,248,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all mt-4 flex items-center justify-center">
                {isLoading ? <RefreshCw className="animate-spin mx-auto" size={16}/> : 'Continuar'}
              </button>
            </form>
            
            <div className="mt-8 flex flex-col gap-3">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                {authMode === 'login' ? 'Crear Cuenta' : 'Ya tengo cuenta'}
              </button>
              {authMode === 'login' && (
                <button onClick={() => setAuthMode('reset')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-500 transition-colors">
                  ¿Olvidaste la clave?
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LÓGICA DE FILTRADO
  const currentPersona = personasConfig.find(p => p.id === activePersonaId);
  const validRecords = records.filter(r => personasConfig.some(p => String(p.id) === String(r.personaId)));
  const activeRecords = validRecords.filter(r => String(r.personaId) === String(activePersonaId));
  const filteredRecords = activeRecords.filter(r => {
    const mSearch = (r.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
    const mStatus = filterStatus === 'TODOS' || r.estado === filterStatus;
    const mMonth = !filterMonth || r.fecha?.startsWith(filterMonth);
    return mSearch && mStatus && mMonth;
  });

  const sortedFilteredRecords = [...filteredRecords].sort((a, b) => {
    if (filterStatus === 'TODOS') {
      const aFinal = a.estado === 'FINALIZADO' ? 1 : 0;
      const bFinal = b.estado === 'FINALIZADO' ? 1 : 0;
      if (aFinal !== bFinal) return aFinal - bFinal;
    }
    return String(b.fecha || '').localeCompare(String(a.fecha || ''));
  });

  const globalStats = {
    total: validRecords.reduce((acc, curr) => acc + (Number(curr.valorTotal) || 0), 0),
    isapre: validRecords.reduce((acc, curr) => acc + (Number(curr.isapreAbonado) || 0), 0),
    metlife: validRecords.reduce((acc, curr) => acc + (Number(curr.metlifeAbonado) || 0), 0),
    copago: validRecords.reduce((acc, curr) => acc + calculateFinalBalance(curr), 0),
    count: validRecords.length
  };

  const personaStats = {
    total: activeRecords.reduce((acc, curr) => acc + (Number(curr.valorTotal) || 0), 0),
    isapre: activeRecords.reduce((acc, curr) => acc + (Number(curr.isapreAbonado) || 0), 0),
    metlife: activeRecords.reduce((acc, curr) => acc + (Number(curr.metlifeAbonado) || 0), 0),
    copago: activeRecords.reduce((acc, curr) => acc + calculateFinalBalance(curr), 0),
    count: activeRecords.length
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-stone-50 to-stone-100 pb-24 font-sans text-slate-700">
      
      {/* TOAST DE NOTIFICACIONES PRINCIPAL */}
      {showToast && (
        <div className={`fixed top-6 right-6 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 z-[100] animate-in slide-in-from-top-4 ${statusMsg.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
          {statusMsg.type === 'error' ? <AlertTriangle size={16} /> : <Check className="text-emerald-400" size={16} />}
          <span className="font-bold text-xs uppercase tracking-tight">{statusMsg.text}</span>
        </div>
      )}
      
      <div className="max-w-[1300px] mx-auto p-4 md:p-6 lg:px-8">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-1">
          <div className="flex items-center gap-3">
            {/* ICONO APP EN CABECERA */}
            <div className="bg-gradient-to-tr from-indigo-400/80 to-amber-200/80 backdrop-blur-xl border border-amber-100/60 w-12 h-12 rounded-[1rem] flex items-center justify-center text-indigo-950 shadow-[0_8px_20px_rgba(129,140,248,0.2)] shrink-0">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-['Plus_Jakarta_Sans'] text-xl md:text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none mb-1">Control de Gastos Médicos</h1>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase truncate mt-0.5 flex items-center gap-2">{user.email || 'Invitado'} <button onClick={handleLogout} className="hover:text-rose-500 bg-white/50 backdrop-blur-sm border border-white/60 p-1 rounded-md transition-colors shadow-sm"><LogOut size={12}/></button></p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isAdmin && <button onClick={() => setShowAdminPanel(!showAdminPanel)} className={`p-2.5 rounded-xl border backdrop-blur-sm transition-all shadow-sm ${showAdminPanel ? 'bg-amber-500 text-white border-amber-500' : 'bg-white/50 text-slate-500 border-white/60 hover:bg-white/80'}`}><ShieldCheck size={16}/></button>}
            <button onClick={exportAllToCSV} className="px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-[10px] font-black text-slate-900 shadow-sm uppercase tracking-widest flex items-center gap-1.5 hover:bg-white/80 transition-colors"><Download size={14} /> Exportar CSV</button>
          </div>
        </header>

        {/* PANEL DE ADMINISTRADOR */}
        {showAdminPanel && (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <div className="bg-white/40 backdrop-blur-2xl rounded-3xl p-6 md:p-8 mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-amber-200/50 text-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/20 rounded-full blur-3xl -translate-y-1/2"></div>
              
              <div className="flex items-center gap-3 mb-8 relative z-10 border-b border-amber-200/40 pb-5">
                 <ShieldCheck className="text-amber-500" size={24} strokeWidth={2.5} />
                 <div>
                   <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-black text-slate-900 uppercase italic tracking-tighter">Panel de Administrador</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Gestión de Acceso a la Plataforma</p>
                 </div>
              </div>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* AGREGAR USUARIO */}
                 <div className="bg-white/30 backdrop-blur-md rounded-[1.25rem] p-6 border border-amber-100/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><UserPlus size={14}/> Autorizar Nuevo Correo</h3>
                    <form onSubmit={handleAddAuthorizedUser} className="flex flex-col gap-3">
                       <input
                         type="email"
                         value={newAuthEmail}
                         onChange={(e) => setNewAuthEmail(e.target.value)}
                         placeholder="correo@ejemplo.com"
                         className="w-full px-4 py-3 rounded-xl bg-white/50 backdrop-blur-sm border border-amber-200/50 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white/70 focus:border-indigo-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
                         required
                       />
                       <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-gradient-to-r from-indigo-400/80 to-amber-200/80 backdrop-blur-xl border border-amber-100/60 text-indigo-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(129,140,248,0.2)] hover:shadow-[0_6px_20px_rgba(129,140,248,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center">
                         {isLoading ? <RefreshCw className="animate-spin" size={14}/> : 'Autorizar Acceso'}
                       </button>
                    </form>
                 </div>
                 
                 {/* LISTA DE USUARIOS */}
                 <div className="bg-white/30 backdrop-blur-md rounded-[1.25rem] p-6 border border-amber-100/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2"><Users size={14}/> Usuarios Permitidos</span>
                      <span className="bg-white/50 px-2 py-0.5 rounded-md">{authorizedUsers.length}</span>
                    </h3>
                    
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                      {authorizedUsers.length === 0 ? (
                        <p className="text-xs text-slate-400 font-bold italic text-center py-4">No hay usuarios extra autorizados.</p>
                      ) : (
                        authorizedUsers.map(u => (
                          <div key={u.id} className="flex items-center justify-between bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-amber-200/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] transition-all hover:bg-white/60">
                            <span className="text-xs font-bold text-slate-700">{u.email}</span>
                            <button onClick={() => handleRemoveAuthorizedUser(u.id)} className="text-slate-400 hover:text-rose-500 p-1.5 bg-white/50 hover:bg-white/80 rounded-lg shadow-sm transition-colors" title="Revocar Acceso">
                              <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* RESUMEN GLOBAL */}
        {!showAdminPanel && (
          <div className="bg-white/40 backdrop-blur-2xl rounded-3xl p-6 md:p-8 mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-amber-200/50 text-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl -translate-y-1/2"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-center mb-6 relative z-10 border-b border-amber-200/40 pb-5">
               <div className="flex items-center gap-2 text-slate-900 text-xs font-black uppercase tracking-[0.2em] font-['Plus_Jakarta_Sans']"><Activity size={14}/> Resumen Global</div>
               <div className="bg-white/50 backdrop-blur-sm border border-amber-200/50 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">{globalStats.count} Registros</div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
              <div className="bg-white/30 backdrop-blur-md rounded-[1.25rem] p-5 border border-amber-100/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] flex flex-col items-start w-full transition-transform hover:-translate-y-1 duration-300">
                <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Gasto Total</p>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(globalStats.total)}</p>
              </div>
              <div className="bg-white/30 backdrop-blur-md rounded-[1.25rem] p-5 border border-amber-100/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] flex flex-col items-start w-full transition-transform hover:-translate-y-1 duration-300">
                <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Reembolsos Isapre</p>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(globalStats.isapre)}</p>
              </div>
              <div className="bg-white/30 backdrop-blur-md rounded-[1.25rem] p-5 border border-amber-100/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] flex flex-col items-start w-full transition-transform hover:-translate-y-1 duration-300">
                <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Reembolsos Seguros</p>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(globalStats.metlife)}</p>
              </div>
              <div className="bg-white/30 backdrop-blur-md rounded-[1.25rem] p-5 border border-amber-100/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] flex flex-col items-start w-full transition-transform hover:-translate-y-1 duration-300">
                <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Total Copago</p>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(globalStats.copago)}</p>
              </div>
            </div>
          </div>
        )}

        {!showAdminPanel && (
          <>
            {/* PESTAÑAS PERSONAS */}
            <div className="flex flex-wrap items-center gap-3 mb-8 border-b border-white/40 pb-6 px-1">
              {personasConfig.map(p => (
                <div key={p.id} className="relative group">
                  <button onClick={() => setActivePersonaId(p.id)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border flex items-center gap-2 ${
                    activePersonaId === p.id
                    ? 'bg-gradient-to-r from-indigo-400/70 to-amber-200/70 backdrop-blur-md text-indigo-950 border-white/60 pr-20 shadow-[0_0_20px_rgba(129,140,248,0.3)]'
                    : 'bg-white/30 backdrop-blur-sm text-slate-500 border-white/40 hover:bg-white/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]'
                  }`}>
                    <Users size={14} className="shrink-0" /> <span className="truncate max-w-[120px] block">{p.name}</span>
                  </button>
                  {activePersonaId === p.id && (
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-1 z-10">
                      <button onClick={() => { setEditPersonaId(p.id); setEditPersonaName(p.name); }} className="bg-white/40 text-indigo-900 p-1.5 rounded-full shadow-sm hover:bg-white/70 transition-colors"><Edit size={12}/></button>
                      <button onClick={() => setDeletePersonaConfirmId(p.id)} className="bg-white/40 text-indigo-900 p-1.5 rounded-full shadow-sm hover:bg-rose-400 hover:text-white transition-colors"><X size={12}/></button>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setIsAddPersonaModalOpen(true)} className="px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 border border-dashed border-slate-300 hover:bg-white/60 hover:text-indigo-500 transition-all flex items-center gap-1.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] backdrop-blur-sm"><UserPlus size={14}/> AGREGAR</button>
            </div>

            {activePersonaId && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 px-1">
                  <div className="flex items-start gap-3">
                    <Users size={24} className="text-indigo-500 mt-1"/>
                    <div>
                      <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-slate-800 uppercase italic tracking-tighter">{currentPersona?.name}</h2>
                      <p className="font-['Plus_Jakarta_Sans'] text-xs font-black text-slate-400 uppercase tracking-widest mt-1 italic">Registros Individuales</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center md:items-end gap-2 mt-4 md:mt-0 w-full md:w-auto">
                    <button onClick={() => openRecordModal()} className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-400/80 to-amber-200/80 backdrop-blur-xl border border-amber-100/60 text-indigo-950 rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(129,140,248,0.2)] hover:shadow-[0_10px_25px_rgba(129,140,248,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2">
                      <PlusCircle size={16} strokeWidth={2.5} /> NUEVA BOLETA
                    </button>
                    <div className="bg-white/50 backdrop-blur-sm border border-amber-200/50 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm mt-1">
                      {personaStats.count} Registros
                    </div>
                  </div>
                </div>

                {/* CAJAS INDICADORAS POR PERSONA (DISEÑO EXACTO, 4 COLUMNAS) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 px-1 w-full">
                  <div className="relative bg-white/30 backdrop-blur-xl px-5 py-4 rounded-[1.25rem] shadow-sm border border-amber-200/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] flex flex-col items-end w-full transition-transform hover:-translate-y-1 hover:shadow-md duration-300 overflow-hidden">
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-cyan-300/50 blur-2xl rounded-full pointer-events-none"></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 w-full text-right truncate relative z-10">TOTAL PAGADO</p>
                    <p className="text-2xl font-bold text-slate-800 tracking-tight relative z-10">{formatCurrency(personaStats.total)}</p>
                  </div>
                  
                  <div className="relative bg-white/30 backdrop-blur-xl px-5 py-4 rounded-[1.25rem] shadow-sm border border-amber-200/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] flex flex-col items-end w-full transition-transform hover:-translate-y-1 hover:shadow-md duration-300 overflow-hidden">
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-emerald-300/50 blur-2xl rounded-full pointer-events-none"></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 w-full text-right truncate relative z-10">REEMBOLSO ISAPRE</p>
                    <p className="text-2xl font-bold text-slate-800 tracking-tight relative z-10">{formatCurrency(personaStats.isapre)}</p>
                  </div>
                  
                  <div className="relative bg-white/30 backdrop-blur-xl px-5 py-4 rounded-[1.25rem] shadow-sm border border-amber-200/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] flex flex-col items-end w-full transition-transform hover:-translate-y-1 hover:shadow-md duration-300 overflow-hidden">
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-violet-300/50 blur-2xl rounded-full pointer-events-none"></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 w-full text-right truncate relative z-10">REEMBOLSO SEGURO</p>
                    <p className="text-2xl font-bold text-slate-800 tracking-tight relative z-10">{formatCurrency(personaStats.metlife)}</p>
                  </div>

                  <div className="relative bg-white/30 backdrop-blur-xl px-5 py-4 rounded-[1.25rem] shadow-sm border border-amber-200/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] flex flex-col items-end w-full transition-transform hover:-translate-y-1 hover:shadow-md duration-300 overflow-hidden">
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-orange-300/50 blur-2xl rounded-full pointer-events-none"></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 w-full text-right truncate relative z-10">COPAGO TOTAL</p>
                    <p className="text-2xl font-bold text-slate-800 tracking-tight relative z-10">{formatCurrency(personaStats.copago)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6 px-1">
                   <div className="relative w-full md:w-auto flex-1 md:flex-none min-w-[200px]">
                     <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input type="text" placeholder="Buscar descripción..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/60 rounded-full text-sm font-bold outline-none focus:border-indigo-300 shadow-sm transition-colors text-slate-700" />
                   </div>
                   <label className={`relative px-4 py-2.5 border rounded-full flex items-center justify-between transition-colors min-w-[120px] cursor-pointer overflow-hidden flex-1 md:flex-none shadow-sm backdrop-blur-sm ${filterMonth ? 'border-amber-300 bg-amber-50/50 text-amber-600 pr-8' : 'border-white/60 bg-white/50 text-slate-500 hover:bg-white/80'}`}>
                      <span className={`text-[10px] font-bold flex items-center gap-1.5 pointer-events-none ${!filterMonth ? 'italic lowercase' : 'uppercase tracking-widest'}`}>
                        {filterMonth ? filterMonth : 'histórico'}
                        <Calendar size={14} />
                      </span>
                      <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0" />
                      {filterMonth && <button type="button" className="absolute right-2 z-20 text-amber-500 hover:text-rose-500" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFilterMonth(''); }}><X size={14} strokeWidth={2.5} /></button>}
                   </label>
                   <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <button onClick={()=>setFilterStatus('TODOS')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${getFilterBadgeStyles('TODOS', filterStatus === 'TODOS')}`}>TODOS</button>
                      {ESTADOS.map(st => (
                        <button key={st} onClick={()=>setFilterStatus(st)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${getFilterBadgeStyles(st, filterStatus === st)}`}>{st}</button>
                      ))}
                   </div>
                </div>
                
                {/* LISTA REGISTROS - UNA FILA, ALINEADA A LA DERECHA */}
                <div className="space-y-4">
                  {sortedFilteredRecords.length === 0 ? (
                    <div className="py-16 text-center bg-white/40 backdrop-blur-xl rounded-3xl border border-dashed border-amber-200/60 shadow-sm">
                      <Receipt size={32} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No hay registros</p>
                    </div>
                  ) : (
                    sortedFilteredRecords.map(record => {
                      const glowClass = getStatusGlow(record.estado);
                      const stylesObj = getStatusStyles(record.estado);
                      const isFinalizado = record.estado === 'FINALIZADO';
                      
                      // 1. Opacidad General para apagar visualmente el registro
                      const cardOpacity = isFinalizado ? 'opacity-60' : '';
                      
                      // Clases de cristal base y fondo gris total si está finalizado
                      const cardBgClass = isFinalizado
                        ? 'bg-gradient-to-br from-slate-200/40 to-slate-300/20 backdrop-blur-xl border border-slate-300/50'
                        : 'bg-white/30 backdrop-blur-xl border border-amber-200/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]';
                      
                      // 4. Aplanar cajas (sin fondo ni borde si es finalizado)
                      const totalBoxBg = isFinalizado ? 'bg-transparent border-transparent' : 'bg-white/40 border-amber-200/40 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]';
                      const isapreBoxBg = isFinalizado ? 'bg-transparent border-transparent' : 'bg-white/40 border-amber-200/40 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus-within:bg-white/70 focus-within:border-emerald-300';
                      const metlifeBoxBg = isFinalizado ? 'bg-transparent border-transparent' : 'bg-white/40 border-amber-200/40 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus-within:bg-white/70 focus-within:border-violet-300';

                      // 3. Atenuar tipografía para que pasen a segundo plano
                      const titleColor = isFinalizado ? 'text-slate-500' : 'text-slate-800';
                      const totalValColor = isFinalizado ? 'text-slate-500' : 'text-slate-700';
                      const copagoColor = isFinalizado ? 'text-slate-500' : 'text-slate-800';

                      // Colores dinámicos y atenuación si está finalizado
                      const isapreValColor = isFinalizado
                        ? (record.isapreAbonado ? 'text-slate-500' : 'text-slate-400')
                        : (record.isapreAbonado ? 'text-slate-700' : 'text-slate-400');
                        
                      const metlifeValColor = isFinalizado
                        ? (record.metlifeAbonado ? 'text-slate-500' : 'text-slate-400')
                        : (record.metlifeAbonado ? 'text-slate-700' : 'text-slate-400');

                      return (
                        <div key={record.id} className={`rounded-[2rem] p-5 pr-14 lg:pr-16 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden ${cardBgClass} ${cardOpacity} ${highlightedRecord === record.id ? 'ring-2 ring-indigo-400 shadow-[0_0_30px_rgba(129,140,248,0.4)] scale-[1.02] z-50 animate-in fade-in slide-in-from-top-4 duration-500' : 'shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-300'}`}>
                          {/* Resplandor difuso de fondo (solo si no está finalizado) */}
                          {!isFinalizado && <div className={`absolute -left-12 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[2.5rem] opacity-70 pointer-events-none ${glowClass}`}></div>}
                          
                          {/* 1. INFORMACIÓN (Izquierda - Fecha debajo de estado) */}
                          <div className="flex items-start gap-4 w-full lg:w-[28%] shrink-0 relative z-10 pl-2">
                            <div className="flex flex-col w-full min-w-0">
                              <h3 className={`font-black ${titleColor} text-sm uppercase tracking-tight mb-2.5 truncate`}>{record.descripcion}</h3>
                              <div className="flex flex-col items-start gap-1">
                                <div className="relative">
                                  <select value={record.estado} onChange={(e) => handleUpdateRecord(record.id, { estado: e.target.value })} className={`pl-3 pr-7 py-1.5 rounded-full text-[9px] font-black uppercase appearance-none outline-none cursor-pointer border ${stylesObj}`}>
                                    {ESTADOS.map(st => <option key={st} value={st}>{st}</option>)}
                                  </select>
                                  <ChevronRight size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none rotate-90 opacity-50`} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 italic pt-1 pl-1">FECHA: {record.fecha}</span>
                              </div>
                            </div>
                          </div>

                          {/* 2. MONTOS (Centro - Alineados a la derecha, Bold oscurecido, Bordes limpios) */}
                          <div className="flex-1 w-full grid grid-cols-3 gap-3 lg:flex lg:items-start lg:justify-end lg:gap-4 border-t lg:border-t-0 lg:border-l border-amber-200/30 pt-4 lg:pt-0 lg:pl-6 min-w-0 relative z-10">
                            
                            <div className="flex flex-col items-end w-full lg:w-[130px] xl:w-[145px] shrink-0">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 text-right w-full">TOTAL BOLETA</label>
                              <div className={`border ${totalBoxBg} w-full px-3 py-2 rounded-lg text-right text-[13px] font-bold ${totalValColor} mb-1.5 truncate transition-colors`}>
                                {formatCurrency(record.valorTotal)}
                              </div>
                              <InlineFile label="BOLETA" fileData={record.files?.boleta} onFileSelect={(t, f) => handleUploadFileToRecord(record.id, t, f)} onFileDelete={(t) => handleUpdateRecord(record.id, { files: { ...(record.files || {}), [t]: null } })} isLoading={isLoading} typeKey="boleta" />
                              <InlineFile label="ORDEN MÉDICA" fileData={record.files?.ordenMedica} onFileSelect={(t, f) => handleUploadFileToRecord(record.id, t, f)} onFileDelete={(t) => handleUpdateRecord(record.id, { files: { ...(record.files || {}), [t]: null } })} isLoading={isLoading} typeKey="ordenMedica" />
                            </div>

                            <div className="flex flex-col items-end w-full lg:w-[130px] xl:w-[145px] shrink-0">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 w-full text-right truncate">REEMBOLSO ISAPRE</label>
                              <div className={`flex items-center justify-end w-full rounded-lg px-3 py-2 mb-1.5 border transition-colors cursor-text ${isapreBoxBg}`} onClick={(e) => { if(!isFinalizado) e.currentTarget.querySelector('input').focus(); }}>
                                <span className={`${isapreValColor} font-bold text-[13px] mr-0.5 pointer-events-none`}>$</span>
                                <input
                                  type="text"
                                  disabled={isFinalizado}
                                  value={record.isapreAbonado ? formatNumberOnly(record.isapreAbonado) : ''}
                                  onChange={(e) => handleUpdateRecord(record.id, { isapreAbonado: Number(e.target.value.replace(/\D/g, '')) })}
                                  className={`bg-transparent outline-none text-left text-[13px] font-bold ${isapreValColor} placeholder-slate-400 p-0 m-0 ${isFinalizado ? 'cursor-not-allowed' : ''}`}
                                  style={{ width: `${Math.max(1, (record.isapreAbonado ? formatNumberOnly(record.isapreAbonado) : '').length) + 0.5}ch` }}
                                  placeholder="0"
                                />
                              </div>
                              <InlineFile label="LIQ. ISAPRE" fileData={record.files?.liqIsapre} onFileSelect={(t, f) => handleUploadFileToRecord(record.id, t, f)} onFileDelete={(t) => handleUpdateRecord(record.id, { files: { ...(record.files || {}), [t]: null } })} isLoading={isLoading} typeKey="liqIsapre" />
                            </div>

                            <div className="flex flex-col items-end w-full lg:w-[130px] xl:w-[145px] shrink-0">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 w-full text-right truncate">REEMBOLSO SEGURO</label>
                              <div className={`flex items-center justify-end w-full rounded-lg px-3 py-2 mb-1.5 border transition-colors cursor-text ${metlifeBoxBg}`} onClick={(e) => { if(!isFinalizado) e.currentTarget.querySelector('input').focus(); }}>
                                <span className={`${metlifeValColor} font-bold text-[13px] mr-0.5 pointer-events-none`}>$</span>
                                <input
                                  type="text"
                                  disabled={isFinalizado}
                                  value={record.metlifeAbonado ? formatNumberOnly(record.metlifeAbonado) : ''}
                                  onChange={(e) => handleUpdateRecord(record.id, { metlifeAbonado: Number(e.target.value.replace(/\D/g, '')) })}
                                  className={`bg-transparent outline-none text-left text-[13px] font-bold ${metlifeValColor} placeholder-slate-400 p-0 m-0 ${isFinalizado ? 'cursor-not-allowed' : ''}`}
                                  style={{ width: `${Math.max(1, (record.metlifeAbonado ? formatNumberOnly(record.metlifeAbonado) : '').length) + 0.5}ch` }}
                                  placeholder="0"
                                />
                              </div>
                              <InlineFile label="LIQ. SEGURO" fileData={record.files?.liqMetlife} onFileSelect={(t, f) => handleUploadFileToRecord(record.id, t, f)} onFileDelete={(t) => handleUpdateRecord(record.id, { files: { ...(record.files || {}), [t]: null } })} isLoading={isLoading} typeKey="liqMetlife" />
                            </div>
                          </div>

                          {/* 3. COPAGO Y ACCIONES (Derecha) */}
                          <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto lg:border-l border-amber-200/30 lg:pl-6 shrink-0 mt-3 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 relative z-10">
                            <div className="text-left lg:text-right min-w-[80px]">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">COPAGO FINAL</label>
                              <p className={`text-[17px] font-bold ${copagoColor} leading-none tracking-tighter`}>{formatCurrency(calculateFinalBalance(record))}</p>
                            </div>
                          </div>

                          {/* Strip de Acciones Integrado */}
                          <div className="absolute right-0 top-0 bottom-0 w-12 lg:w-14 bg-white/20 backdrop-blur-md border-l border-amber-200/40 flex flex-col items-center justify-center gap-4 z-20 shadow-[inset_1px_0_2px_rgba(255,255,255,0.4)]">
                            <button onClick={() => copyToClipboard(`🧾 Resumen: ${record.descripcion}\n📅 Fecha: ${record.fecha}\n💰 Total: ${formatCurrency(record.valorTotal)}\n🔵 Reembolso Isapre: ${formatCurrency(record.isapreAbonado)}\n🟣 Reembolso Seguro: ${formatCurrency(record.metlifeAbonado)}\n💳 Copago Final: ${formatCurrency(calculateFinalBalance(record))}`)} className="text-slate-400 hover:text-indigo-500 transition-colors" title="Copiar"><Copy size={18} strokeWidth={1.5} /></button>
                            <button onClick={() => openRecordModal(record)} className="text-slate-400 hover:text-slate-700 transition-colors" title="Editar"><Edit size={18} strokeWidth={1.5} /></button>
                            <button onClick={() => setDeleteRecordConfirmId(record.id)} className="text-slate-400 hover:text-rose-500 transition-colors" title="Eliminar"><Trash size={18} strokeWidth={1.5} /></button>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALES PERSONA */}
      {(editPersonaId || deletePersonaConfirmId || isAddPersonaModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[130] animate-in fade-in">
          <div className="relative bg-white/40 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-sm w-full border border-amber-200/50 text-center overflow-hidden">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              {editPersonaId ? (
                <>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-black text-slate-800 mb-6 uppercase italic tracking-tighter">Editar Paciente</h2>
                  <form onSubmit={async (e) => { e.preventDefault(); await handleUpdatePersona(editPersonaId, editPersonaName); setEditPersonaId(null); }} className="space-y-4">
                    <input required autoFocus type="text" value={editPersonaName} onChange={e => setEditPersonaName(e.target.value)} className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-amber-200/40 rounded-xl font-bold text-center outline-none focus:bg-white/70 focus:border-indigo-300 text-sm uppercase transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-slate-700" />
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setEditPersonaId(null)} className="flex-1 py-3.5 text-[10px] font-black uppercase text-slate-500 bg-white/50 border border-amber-200/50 backdrop-blur-sm rounded-xl hover:bg-white/80 shadow-sm transition-all">Cancelar</button>
                      <button type="submit" className="flex-1 py-3.5 bg-gradient-to-r from-indigo-400/80 to-amber-200/80 backdrop-blur-xl border border-amber-100/60 text-indigo-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(129,140,248,0.2)] hover:shadow-[0_6px_20px_rgba(129,140,248,0.3)] hover:-translate-y-0.5 transition-all active:scale-95">Guardar</button>
                    </div>
                  </form>
                </>
              ) : deletePersonaConfirmId ? (
                <>
                  <AlertTriangle size={40} className="text-rose-400 mx-auto mb-4" />
                  <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-black text-slate-800 mb-2 uppercase italic tracking-tighter">¿Eliminar Perfil?</h2>
                  <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">Esta acción borrará todos sus registros permanentemente.</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={async () => {
                        setIsLoading(true);
                        try {
                          const recordsToDelete = records.filter(r => String(r.personaId) === String(deletePersonaConfirmId));
                          for (const r of recordsToDelete) {
                            await executeDbOp(deleteDoc(doc(db, 'artifacts', DATABASE_ID, 'users', user.uid, 'reembolsos', r.id)));
                          }
                          await executeDbOp(deleteDoc(doc(db, 'artifacts', DATABASE_ID, 'users', user.uid, 'personas', deletePersonaConfirmId)));
                          addLog("Paciente eliminado.");
                        } catch (e) {
                          addLog("Error al eliminar: " + e.message);
                        } finally {
                          setIsLoading(false);
                          setDeletePersonaConfirmId(null);
                        }
                    }} className="w-full py-3.5 bg-gradient-to-r from-rose-400/80 to-orange-300/80 backdrop-blur-xl border border-rose-200/60 text-rose-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(244,63,94,0.2)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center">
                        {isLoading ? <RefreshCw className="animate-spin" size={14}/> : 'Eliminar Todo'}
                    </button>
                    <button onClick={() => setDeletePersonaConfirmId(null)} className="w-full py-3.5 text-[10px] font-black uppercase text-slate-500 bg-white/50 border border-amber-200/50 backdrop-blur-sm rounded-xl hover:bg-white/80 shadow-sm transition-all">Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-black text-slate-800 mb-6 uppercase italic tracking-tighter text-center">Nuevo Paciente</h2>
                  <form onSubmit={async (e) => { e.preventDefault(); const newId = Date.now().toString(); await executeDbOp(setDoc(doc(db, 'artifacts', DATABASE_ID, 'users', user.uid, 'personas', newId), { name: newPersonaName.trim(), createdAt: Date.now() })); setIsAddPersonaModalOpen(false); setNewPersonaName(''); setActivePersonaId(newId); }} className="space-y-4">
                    <input required autoFocus type="text" placeholder="Nombre" value={newPersonaName} onChange={e => setNewPersonaName(e.target.value)} className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-amber-200/40 rounded-xl font-bold text-center outline-none focus:bg-white/70 focus:border-indigo-300 text-sm uppercase transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-slate-700" />
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setIsAddPersonaModalOpen(false)} className="flex-1 py-3.5 text-[10px] font-black uppercase text-slate-500 bg-white/50 border border-amber-200/50 backdrop-blur-sm rounded-xl hover:bg-white/80 shadow-sm transition-all">Cerrar</button>
                      <button type="submit" className="flex-1 py-3.5 bg-gradient-to-r from-indigo-400/80 to-amber-200/80 backdrop-blur-xl border border-amber-100/60 text-indigo-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(129,140,248,0.2)] hover:shadow-[0_6px_20px_rgba(129,140,248,0.3)] hover:-translate-y-0.5 transition-all active:scale-95">Crear Perfil</button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN BORRAR REGISTRO */}
      {deleteRecordConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[130] animate-in fade-in">
          <div className="relative bg-white/40 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-sm w-full border border-amber-200/50 text-center overflow-hidden">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <AlertTriangle size={40} className="text-rose-400 mx-auto mb-4" />
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-black text-slate-800 mb-2 uppercase italic tracking-tighter">¿Eliminar Registro?</h2>
              <div className="flex flex-col gap-3 mt-6">
                <button onClick={async () => { await executeDbOp(deleteDoc(doc(db, 'artifacts', DATABASE_ID, 'users', user.uid, 'reembolsos', deleteRecordConfirmId))); setDeleteRecordConfirmId(null); showNotification(navigator.onLine ? "Registro eliminado" : "Registro borrado offline", "success"); }} className="w-full py-3.5 bg-gradient-to-r from-rose-400/80 to-orange-300/80 backdrop-blur-xl border border-rose-200/60 text-rose-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(244,63,94,0.2)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.3)] hover:-translate-y-0.5 transition-all active:scale-95">Eliminar</button>
                <button onClick={() => setDeleteRecordConfirmId(null)} className="w-full py-3.5 text-[10px] font-black uppercase text-slate-500 bg-white/50 border border-amber-200/50 backdrop-blur-sm rounded-xl hover:bg-white/80 shadow-sm transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA PRESTACIÓN */}
      {isModalOpen && activePersonaId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[120] animate-in fade-in">
          <div className="relative bg-white/40 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-md w-full border border-amber-200/50 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 overflow-y-auto custom-scrollbar pr-2">
              <div className="mb-8 text-center">
                <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-black text-slate-800 uppercase italic tracking-tighter mb-1">{editRecordId ? 'EDITAR PRESTACIÓN' : 'NUEVA PRESTACIÓN'}</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Paciente: {currentPersona?.name}</p>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault(); if (uploadingFiles) return; setUploadingFiles(true);
                if (!user) { addLog("ERROR: No hay usuario."); setUploadingFiles(false); return; }
                try {
                  if (editRecordId) {
                    await handleUpdateRecord(editRecordId, { ...newRecord, valorTotal: Number(newRecord.valorTotal) || 0 });
                    showNotification(navigator.onLine ? "Actualizado" : "Guardado offline", "success");
                  } else {
                    const collRef = collection(db, 'artifacts', DATABASE_ID, 'users', user.uid, 'reembolsos');
                    await executeDbOp(addDoc(collRef, {
                      ...newRecord,
                      valorTotal: Number(newRecord.valorTotal) || 0,
                      isapreAbonado: 0,
                      metlifeAbonado: 0,
                      personaId: activePersonaId,
                      createdAt: Date.now(),
                      files: { boleta: null, ordenMedica: null, liqIsapre: null, liqMetlife: null }
                    }));
                    showNotification(navigator.onLine ? "Registrado con éxito" : "Guardado offline", "success");
                  }
                  setIsModalOpen(false); setNewRecord(initialRecordState);
                } catch (err) { showNotification("Error al guardar", "error"); } finally { setUploadingFiles(false); }
              }} className="space-y-4">
                <div className="bg-white/40 backdrop-blur-sm border border-amber-200/40 rounded-xl overflow-hidden focus-within:bg-white/70 focus-within:border-indigo-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all">
                   <input type="text" placeholder="Descripción de la prestación" value={newRecord.descripcion} onChange={e => setNewRecord({...newRecord, descripcion: e.target.value})} className="w-full px-4 py-3 font-bold text-slate-700 bg-transparent outline-none text-sm placeholder:text-slate-400" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white/40 backdrop-blur-sm border border-amber-200/40 rounded-xl overflow-hidden focus-within:bg-white/70 focus-within:border-indigo-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all">
                      <input type="date" value={newRecord.fecha} onChange={e => setNewRecord({...newRecord, fecha: e.target.value})} className="w-full px-4 py-3 font-bold text-slate-700 bg-transparent outline-none text-xs text-center uppercase" required />
                   </div>
                   <div className="bg-white/40 backdrop-blur-sm border border-amber-200/40 rounded-xl overflow-hidden focus-within:bg-white/70 focus-within:border-indigo-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all flex items-center px-4">
                      <span className="text-indigo-400 font-black text-sm">$</span>
                      <input type="number" placeholder="0" value={newRecord.valorTotal} onChange={e => setNewRecord({...newRecord, valorTotal: e.target.value})} className="w-full py-3 pl-2 font-bold text-slate-700 bg-transparent outline-none text-sm placeholder:text-slate-400" required />
                   </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-[10px] font-black uppercase text-slate-500 bg-white/50 border border-amber-200/50 backdrop-blur-sm rounded-xl hover:bg-white/80 shadow-sm transition-all">CERRAR</button>
                  <button type="submit" disabled={uploadingFiles} className="flex-1 py-3.5 bg-gradient-to-r from-indigo-400/80 to-amber-200/80 backdrop-blur-xl border border-amber-100/60 text-indigo-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(129,140,248,0.2)] hover:shadow-[0_6px_20px_rgba(129,140,248,0.3)] hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center">
                    {uploadingFiles ? <RefreshCw className="animate-spin" size={14}/> : 'GUARDAR'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TERMINAL DE SISTEMA */}
      <button onClick={() => setShowConsole(!showConsole)} className="fixed bottom-6 left-6 bg-slate-900 text-white p-3 rounded-full shadow-2xl z-[111] hover:scale-110 active:scale-95 transition-all"><Terminal size={20}/></button>
      {showConsole && (
        <div className="fixed bottom-0 left-0 right-0 h-48 bg-slate-900 p-6 text-[10px] font-mono text-slate-400 overflow-y-auto z-[110] border-t border-slate-800 animate-in slide-in-from-bottom-10 select-text">
          <p className="uppercase font-black border-b border-slate-800 pb-2 mb-3 tracking-widest text-blue-400 flex justify-between">
            <span>Consola de Sistema</span>
            <span className="opacity-50 uppercase">{filteredRecords.length} en vista / {validRecords.length} totales</span>
          </p>
          {debugLogs.length === 0 ? <p className="italic text-slate-700">Esperando eventos...</p> : debugLogs.map((log, i) => <div key={i} className="mb-1.5 border-l-2 pl-3 border-slate-700">{log}</div>)}
        </div>
      )}
    </div>
  );
};

export default App;