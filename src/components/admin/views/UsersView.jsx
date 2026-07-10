import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Shield, Monitor, Tv } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { db, functions } from '@/firebase/config';
import { collection, doc, updateDoc, deleteField, query, orderBy, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const UsersView = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Nuevo Usuario Form
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'kiosk'
  });

  // 1. Cargar Usuarios (Tiempo Real)
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    // Usamos onSnapshot para ver cambios en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 🧹 Migración de seguridad: las contraseñas nunca deben vivir en Firestore
      // (Firebase Auth es la única fuente). Purgamos el campo legacy 'password'.
      snapshot.docs.forEach((userDoc) => {
        if (userDoc.data().password !== undefined) {
          updateDoc(doc(db, 'users', userDoc.id), { password: deleteField() })
            .catch((e) => console.error("Error purgando password legacy:", e));
        }
      });

      setUsers(usersList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los usuarios"
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  // 2. Crear Usuario
  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUser.email || !newUser.name) {
      toast({ variant: "destructive", title: "Campos incompletos" });
      return;
    }

    try {
      const email = newUser.email.toLowerCase();

      // El alta se hace en el backend (Cloud Function admin-only) con el
      // Admin SDK. Así el registro público de Firebase Auth puede estar
      // DESHABILITADO y ningún externo puede crearse una cuenta.
      const createManagedUser = httpsCallable(functions, 'createManagedUser');
      await createManagedUser({
        email,
        name: newUser.name,
        password: newUser.password,
        role: newUser.role
      });

      toast({
        title: "✅ Usuario y Dispositivo Sincronizados",
        description: `El usuario ${email} ya está listo para recibir campañas.`
      });

      setIsModalOpen(false);
      setNewUser({ email: '', name: '', password: '', role: 'kiosk' });

    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "No se pudo autorizar al usuario."
      });
    }
  };

  // 3. Eliminar Usuario
  const handleDeleteUser = async (email) => {
    if (!window.confirm(`¿Estás seguro de quitar el acceso a ${email}?`)) return;

    try {
      // Revocación real en backend: borra la cuenta de Auth (mata sesiones
      // activas) además de quitar la whitelist de Firestore.
      const deleteManagedUser = httpsCallable(functions, 'deleteManagedUser');
      await deleteManagedUser({ email });
      toast({
        title: "🗑️ Acceso Revocado",
        description: "El usuario ya no podrá iniciar sesión."
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ variant: "destructive", title: "Error al eliminar", description: error?.message || '' });
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="flex items-center text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full w-fit">
            <Shield className="w-3 h-3 mr-1" /> Administrador
          </span>
        );
      case 'screen':
        return (
          <span className="flex items-center text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full w-fit">
            <Tv className="w-3 h-3 mr-1" /> Pantalla
          </span>
        );
      case 'kiosk':
      default:
        return (
          <span className="flex items-center text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full w-fit">
            <Monitor className="w-3 h-3 mr-1" /> Kiosco
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-gray-400 mt-1">Administra quién tiene acceso al sistema.</p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-naranti-orange hover:bg-naranti-orange/90 text-white font-bold rounded-lg"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden glass-effect">
        <table className="w-full text-left text-gray-300">
          <thead className="bg-gray-900/60 text-gray-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4">Usuario</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Registro</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {isLoading ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">Cargando usuarios...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">No hay usuarios registrados.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                        user.role === 'screen' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 text-right">
                    {/* Evitar borrar al admin principal por error */}
                    {user.email !== 'packozamsad@gmail.com' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CREACIÓN */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl relative"
            >
              <h2 className="text-2xl font-bold text-white mb-1">Nuevo Usuario</h2>
              <p className="text-gray-400 text-sm mb-6">Autoriza un nuevo correo para acceder al sistema.</p>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico (Gmail)</label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@gmail.com"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-gray-800 border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-naranti-orange focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-gray-800 border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-naranti-orange focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    placeholder="Define una contraseña (mínimo 6 caracteres)"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-gray-800 border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-naranti-orange focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Rol</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${newUser.role === 'admin'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                        }`}
                    >
                      <Shield className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">Admin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: 'kiosk' })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${newUser.role === 'kiosk'
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                        }`}
                    >
                      <Monitor className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">Kiosco</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, role: 'screen' })}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-all ${newUser.role === 'screen'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                        }`}
                    >
                      <Tv className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">Pantalla</span>
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 text-gray-300 hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-naranti-orange to-red-500 hover:from-naranti-orange/90 hover:to-red-500/90 text-white font-bold"
                  >
                    Autorizar Usuario
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UsersView;