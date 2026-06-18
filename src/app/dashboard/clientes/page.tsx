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

interface Service {
  id: string;
  name: string;
  type: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceItem {
  id: string;
  serviceName: string;
  serviceType: string;
  policyNumber: string;
  contractDate: string;
  expiryDate: string;
  status: string;
  coverageAmount: number;
  premiumAmount: number;
  currency: string;
  notes: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  createdAt: string;
  updatedAt: string;
}

interface UserDetail {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  services: ServiceItem[];
}

export default function ClientesPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [assignModal, setAssignModal] = useState<{ 
    userId: string; 
    userName: string;
    userEmail: string;
    userPhone: string;
    selectedService: { id: string; name: string; type: string } | null;
    serviceName: string;
    currency: string;
    contractDate: string;
    status: string;
    policyNumber: string;
    notes: string;
    coverageAmount: string;
    monthpay: string;
    documents: File[];
    images: File[];
    companyName: string;
  } | null>(null);
  const [viewModal, setViewModal] = useState<UserDetail | null>(null);
  const [assigning, setAssigning] = useState(false);

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
      const res = await fetch('/api/admin/users?role=client', {
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

  const fetchServices = async () => {
    if (!token) return;
    try {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/service-catalog`;
      console.log('Fetching services from:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Services response status:', res.status);
      const data = await res.json();
      console.log('Services response:', data);
      setServices(data.catalog || []);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('¿Eliminar este cliente?')) return;
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

  const handleView = async (user: User) => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('User details:', data);
      setViewModal(data);
    } catch (err) {
      console.error('Error fetching user', err);
    }
  };

  const handleAssignService = (user: User) => {
    console.log('Opening assign modal for:', user.name);
    fetchServices();
    setAssignModal({ 
      userId: user.uid, 
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '',
      selectedService: null,
      serviceName: '',
      currency: 'USD',
      contractDate: new Date().toISOString().split('T')[0],
      status: 'active',
      policyNumber: '',
      notes: '',
      coverageAmount: '',
      monthpay: '',
      documents: [],
      images: [],
      companyName: '',
    });
  };

  const handleServiceSelect = (serviceId: string) => {
    if (!assignModal) return;
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setAssignModal({
        ...assignModal,
        selectedService: { id: service.id, name: service.name, type: service.type },
        serviceName: service.name,
      });
    }
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !assignModal || !assignModal.selectedService) return;
    setAssigning(true);
    try {
      const formData = new FormData();
      formData.append('serviceName', assignModal.serviceName);
      formData.append('userId', assignModal.userId);
      formData.append('userEmail', assignModal.userEmail);
      formData.append('contractDate', assignModal.contractDate);
      formData.append('monthpay', assignModal.monthpay ? String(parseFloat(assignModal.monthpay)) : '0');
      formData.append('serviceType', assignModal.selectedService.type);
      formData.append('policyNumber', assignModal.policyNumber);
      formData.append('status', assignModal.status);
      formData.append('coverageAmount', assignModal.coverageAmount ? String(parseFloat(assignModal.coverageAmount)) : '0');
      formData.append('notes', assignModal.notes);
      formData.append('beneficiaryName', assignModal.userName);
      formData.append('beneficiaryPhone', assignModal.userPhone);
      formData.append('currency', assignModal.currency);
      formData.append('catalogItemId', assignModal.selectedService.id);
      formData.append('companyName', assignModal.companyName);

      assignModal.documents.forEach(file => formData.append('files', file));
      assignModal.images.forEach(file => formData.append('files', file));

      console.log('=== ENVIANDO DATOS AL BACKEND ===');
      console.log(' Campos:', {
        serviceName: assignModal.serviceName,
        userId: assignModal.userId,
        userEmail: assignModal.userEmail,
        contractDate: assignModal.contractDate,
        monthpay: assignModal.monthpay,
        serviceType: assignModal.selectedService.type,
        policyNumber: assignModal.policyNumber,
        status: assignModal.status,
        coverageAmount: assignModal.coverageAmount,
        notes: assignModal.notes,
        beneficiaryName: assignModal.userName,
        beneficiaryPhone: assignModal.userPhone,
        currency: assignModal.currency,
        catalogItemId: assignModal.selectedService.id,
        companyName: assignModal.companyName,
      });
      console.log(' Archivos:', {
        documents: assignModal.documents.map(f => f.name),
        images: assignModal.images.map(f => f.name),
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/services`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      console.log('=== RESPUESTA DEL BACKEND ===');
      console.log(' Status:', res.status);
      console.log(' Data:', data);
      setAssignModal(null);
    } catch (err) {
      console.error('Error assigning service', err);
    } finally {
      setAssigning(false);
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
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Clientes</h2>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : users.length === 0 ? (
          <p className="text-slate-500">No hay clientes</p>
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
                          onClick={() => handleView(user)}
                          className="p-2 text-slate-500 hover:text-[#FF6B00] hover:bg-orange-50 rounded-lg transition-colors"
                          title="Ver Detalles"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAssignService(user)}
                          className="p-2 text-slate-500 hover:text-[#FF6B00] hover:bg-orange-50 rounded-lg transition-colors"
                          title="Asignar Servicio"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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

      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Asignar Servicio</h3>
            <p className="text-sm text-slate-500 mb-6">Complete los datos para {assignModal.userName}</p>
            <form onSubmit={handleSubmitService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Servicio</label>
                <select 
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>Seleccionar servicio...</option>
                  {services.filter(s => s.active).map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              {assignModal.selectedService && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Servicio</label>
                    <input
                      type="text"
                      value={assignModal.serviceName}
                      onChange={(e) => setAssignModal({...assignModal, serviceName: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Compañía</label>
                    <input
                      type="text"
                      value={assignModal.companyName}
                      onChange={(e) => setAssignModal({...assignModal, companyName: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                    <select
                      value={assignModal.currency}
                      onChange={(e) => setAssignModal({...assignModal, currency: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                      required
                    >
                      <option value="USD">USD</option>
                      <option value="COP">COP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Contratación</label>
                    <input
                      type="date"
                      value={assignModal.contractDate}
                      onChange={(e) => setAssignModal({...assignModal, contractDate: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estatus</label>
                    <select
                      value={assignModal.status}
                      onChange={(e) => setAssignModal({...assignModal, status: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                      required
                    >
                      <option value="active">Activa</option>
                      <option value="paused">Pausada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Póliza</label>
                    <input
                      type="text"
                      value={assignModal.policyNumber}
                      onChange={(e) => setAssignModal({...assignModal, policyNumber: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Monto de Cobertura</label>
                    <input
                      type="number"
                      value={assignModal.coverageAmount}
                      onChange={(e) => setAssignModal({...assignModal, coverageAmount: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pago Mensual</label>
                    <input
                      type="number"
                      step="0.01"
                      value={assignModal.monthpay}
                      onChange={(e) => setAssignModal({...assignModal, monthpay: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                    <textarea
                      value={assignModal.notes}
                      onChange={(e) => setAssignModal({...assignModal, notes: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Documentos</label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setAssignModal({...assignModal, documents: Array.from(e.target.files || [])})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Imágenes</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setAssignModal({...assignModal, images: Array.from(e.target.files || [])})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!assignModal.selectedService || assigning}
                  className="flex-1 py-2 bg-[#FF6B00] hover:bg-[#E65A00] text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {assigning ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{viewModal.name}</h3>
            <p className="text-sm text-slate-500 mb-6">{viewModal.email} · {viewModal.phone || 'Sin teléfono'}</p>
            
            <h4 className="font-semibold text-slate-900 mb-4">Servicios</h4>
            {viewModal.services.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No tiene servicios asignados</p>
            ) : (
              <div className="space-y-4">
                {viewModal.services.map((service) => (
                  <div key={service.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-slate-900">{service.serviceName}</p>
                        <p className="text-sm text-slate-500">{service.serviceType}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        service.status === 'active' ? 'bg-green-100 text-green-700' :
                        service.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {service.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Póliza</p>
                        <p className="text-slate-900">{service.policyNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Moneda</p>
                        <p className="text-slate-900">{service.currency}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Cobertura</p>
                        <p className="text-slate-900">${service.coverageAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Premio</p>
                        <p className="text-slate-900">${service.premiumAmount?.toLocaleString() || '0'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Fecha de Contratación</p>
                        <p className="text-slate-900">{service.contractDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Fecha de Vencimiento</p>
                        <p className="text-slate-900">{service.expiryDate}</p>
                      </div>
                      {service.beneficiaryName && (
                        <div>
                          <p className="text-slate-500">Beneficiario</p>
                          <p className="text-slate-900">{service.beneficiaryName}</p>
                        </div>
                      )}
                      {service.beneficiaryPhone && (
                        <div>
                          <p className="text-slate-500">Teléfono Beneficiario</p>
                          <p className="text-slate-900">{service.beneficiaryPhone}</p>
                        </div>
                      )}
                    </div>
                    {service.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-slate-500 text-sm">Notas</p>
                        <p className="text-slate-900 text-sm">{service.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setViewModal(null)}
              className="w-full mt-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}