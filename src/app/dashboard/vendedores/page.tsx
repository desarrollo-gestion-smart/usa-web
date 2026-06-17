'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function VendedoresPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ id: string; name: string; qrDataUrl: string } | null>(null);
  const [editModal, setEditModal] = useState<{ id: string; name: string; email: string; phone: string; description: string; location: string; title: string; position: string; specialties: string; rating: number; responseFrequency: string } | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    fetchUsers(storedToken);
  }, [router]);

  const fetchUsers = async (authToken: string) => {
    try {
      const res = await fetch('/api/admin/users?role=seller', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      console.log('Response:', data);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowQr = async (user: User) => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sellers/${user.uid}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('QR Response:', data);
      const qrDataUrl = data.qrCode;
      setQrModal({ id: user.uid, name: user.name, qrDataUrl });
    } catch (err) {
      console.error('Error fetching QR', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('¿Eliminar este vendedor?')) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(token);
    } catch (err) {
      console.error('Error deleting', err);
    }
  };

  const handleEdit = (user: User) => {
    setEditModal({ 
      id: user.uid, 
      name: user.name, 
      email: user.email, 
      phone: user.phone || '',
      description: (user as any).description || '',
      location: (user as any).location || '',
      title: (user as any).title || '',
      position: (user as any).position || '',
      specialties: (user as any).specialties || '',
      rating: (user as any).rating || 0,
      responseFrequency: (user as any).responseFrequency || '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editModal) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${editModal.id}/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editModal.name,
          email: editModal.email,
          phone: editModal.phone,
          description: editModal.description,
          location: editModal.location,
          title: editModal.title,
          position: editModal.position,
          specialties: editModal.specialties,
          rating: editModal.rating,
          responseFrequency: editModal.responseFrequency,
        }),
      });
      setEditModal(null);
      fetchUsers(token);
    } catch (err) {
      console.error('Error saving', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <Image src="/images/ic_launcher.png" alt="USA ALL BENEFITS GROUP PANEL" width={36} height={36} className="rounded-lg" />
              <span className="text-xl font-bold text-slate-900">USA ALL BENEFITS GROUP PANEL</span>
            </div>
            <button
              onClick={async () => {
                const token = localStorage.getItem('token');
                if (token) {
                  try {
                    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                  } catch (err) {
                    console.error('Logout error', err);
                  }
                }
                localStorage.removeItem('token');
                router.push('/login');
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Vendedores</h2>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="text-slate-500">No hay vendedores</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Nombre</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Teléfono</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Fecha</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-slate-600">{user.phone || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleShowQr(user)}
                          className="p-2 text-slate-500 hover:text-[#FF6B00] hover:bg-orange-50 rounded-lg transition-colors"
                          title="Ver QR"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user.uid)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Editar Vendedor</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={e => setEditModal({...editModal, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editModal.email}
                  onChange={e => setEditModal({...editModal, email: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editModal.phone}
                  onChange={e => setEditModal({...editModal, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  value={editModal.title}
                  onChange={e => setEditModal({...editModal, title: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                <input
                  type="text"
                  value={editModal.position}
                  onChange={e => setEditModal({...editModal, position: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={editModal.location}
                  onChange={e => setEditModal({...editModal, location: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={editModal.description}
                  onChange={e => setEditModal({...editModal, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Especialidades</label>
                <input
                  type="text"
                  value={editModal.specialties}
                  onChange={e => setEditModal({...editModal, specialties: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  placeholder="Separadas por coma"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Calificación</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={editModal.rating}
                  onChange={e => setEditModal({...editModal, rating: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia de Respuesta</label>
                <input
                  type="text"
                  value={editModal.responseFrequency}
                  onChange={e => setEditModal({...editModal, responseFrequency: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  placeholder="Ej: 24 horas, 48 horas"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#FF6B00] hover:bg-[#E65A00] text-white rounded-lg transition-colors"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2 text-center">{qrModal.name}</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">Código QR del vendedor</p>
            <div className="flex justify-center mb-6">
              <img src={qrModal.qrDataUrl} alt={`QR ${qrModal.name}`} className="w-64 h-64 object-contain" />
            </div>
            <div className="flex gap-3">
              <a
                href={qrModal.qrDataUrl}
                download={`qr-${qrModal.name}.png`}
                className="flex-1 py-2 bg-[#FF6B00] hover:bg-[#E65A00] text-white rounded-lg transition-colors text-center"
              >
                Descargar
              </a>
              <button
                onClick={() => setQrModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}