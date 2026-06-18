'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface CatalogItem {
  id: string;
  name: string;
  type: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ServiciosPage() {
  const router = useRouter();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: '', description: '', active: true });
  const [creating, setCreating] = useState(false);
  const [successModal, setSuccessModal] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    fetchItems(storedToken);
  }, [router]);

  const fetchItems = async (authToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/service-catalog`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      console.log('Catalog response:', data);
      setItems(data.catalog || []);
    } catch (err) {
      console.error('Error fetching', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/service-catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', type: '', description: '', active: true });
        setSuccessModal('Servicio creado exitosamente');
        fetchItems(token);
      } else {
        setErrorModal(data.message || 'Error al crear servicio');
      }
    } catch (err) {
      console.error('Error creating', err);
      setErrorModal('Error al conectar con el servidor');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('¿Eliminar este servicio?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/service-catalog/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessModal('Servicio eliminado exitosamente');
        fetchItems(token);
      } else {
        setErrorModal(data.message || 'Error al eliminar servicio');
      }
    } catch (err) {
      console.error('Error deleting', err);
      setErrorModal('Error al conectar con el servidor');
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Catálogo de Servicios</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#FF6B00] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e55f00] transition-colors"
          >
            + Nuevo Servicio
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500">No hay servicios en el catálogo</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Nombre</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Tipo</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Descripción</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Fecha</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Estado</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-[#FF6B00]/10 text-[#FF6B00] rounded-full text-xs font-medium">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm max-w-md truncate">{item.description}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Nuevo Servicio</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <input
                  type="text"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-[#FF6B00] border-slate-300 rounded focus:ring-[#FF6B00]"
                />
                <label htmlFor="active" className="text-sm text-slate-700">Activo</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55f00] disabled:opacity-50"
                >
                  {creating ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {successModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSuccessModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">¡Éxito!</h3>
            <p className="text-slate-600 mb-6">{successModal}</p>
            <button
              onClick={() => setSuccessModal(null)}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {errorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setErrorModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Error</h3>
            <p className="text-slate-600 mb-6">{errorModal}</p>
            <button
              onClick={() => setErrorModal(null)}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}