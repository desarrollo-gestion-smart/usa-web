'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Recommendation {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  ctaLink: string | null;
  imageUrl: string;
}

export default function PublicidadesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    type: 'instagram',
    ctaLink: '',
    active: 'true',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [token, setToken] = useState<string | null>(null);
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
      const res = await fetch('/api/recommendations', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setItems(data.result?.recommendations || []);
    } catch {
      console.error('Error fetching');
    } finally {
      setLoading(false);
    }
  };

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        if (img.width < 1080 || img.height < 374) {
          setImageError(`La imagen debe tener al menos 1080×374px (actual: ${img.width}×${img.height}px)`);
          resolve(false);
        } else {
          setImageError(null);
          resolve(true);
        }
      };
      img.onerror = () => {
        setImageError('Error al cargar la imagen');
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (imageFile) {
      const valid = await validateImage(imageFile);
      if (!valid) return;
    }
    setCreating(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (imageFile) formData.append('image', imageFile);

      console.log('=== Enviando publicidad al backend ===');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `{file: ${value.name}, size: ${value.size}}` : value);
      }

      const res = await fetch('/api/admin/recommendations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      console.log('=== Respuesta del backend ===');
      console.log('  Status:', res.status);

      const data = await res.json();
      console.log('  Body:', data);

      if (res.ok) {
        setShowForm(false);
        setForm({ title: '', subtitle: '', type: 'instagram', ctaLink: '', active: 'true' });
        setImageFile(null);
        setImageError(null);
        setSuccessModal('Publicidad creada exitosamente');
        fetchItems(token);
      } else {
        setErrorModal(data.message || 'Error al crear publicidad');
      }
    } catch {
      setErrorModal('Error al conectar con el servidor');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('¿Eliminar esta publicidad?')) return;
    try {
      const res = await fetch(`/api/admin/recommendations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessModal('Publicidad eliminada exitosamente');
        fetchItems(token);
      } else {
        setErrorModal(data.message || 'Error al eliminar publicidad');
      }
    } catch (err) {
      console.error('Error de red al eliminar publicidad:', err);
      setErrorModal('Error de conexión');
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
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#E65A00] transition-colors"
          >
            {showForm ? 'Cancelar' : '+ Nueva Publicidad'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Publicidad</h2>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-6 mb-8 grid grid-cols-2 gap-4">
            <input placeholder="Título" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg" required />
            <input placeholder="Subtítulo" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg" />
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg">
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">X / Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="cursos">Cursos</option>
              <option value="productos">Productos</option>
            </select>
            <input placeholder="Redirigir a:" value={form.ctaLink} onChange={e => setForm({...form, ctaLink: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg" />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Imagen (mín. 1080×374px)</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#FF6B00] hover:bg-orange-50 transition-colors">
                {imageFile ? (
                  <Image src={URL.createObjectURL(imageFile)} alt="Preview" width={200} height={70} className="object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-slate-400">Seleccionar imagen</span>
                  </div>
                )}
              </label>
              {imageFile && <p className="text-xs text-slate-500 mt-1 truncate">{imageFile.name}</p>}
              {imageError && <p className="text-xs text-red-500 mt-1">{imageError}</p>}
            </div>
            <button type="submit" disabled={creating} className="col-span-2 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#E65A00] disabled:opacity-50">
              {creating ? 'Creando...' : 'Crear Publicidad'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500">No hay publicidades</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-6 hover:shadow-lg transition-shadow">
                <div className="w-40 h-[70px] rounded-lg flex-shrink-0 overflow-hidden bg-slate-100">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt={item.title} width={160} height={56} className="object-cover w-full h-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 truncate">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs px-3 py-1 bg-slate-100 rounded-full text-slate-600">{item.type}</span>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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