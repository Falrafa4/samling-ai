import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPen,
  faTrashCan,
  faSpinner,
  faLocationDot,
  faTriangleExclamation,
  faMagnifyingGlass,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../services/api';
import ZoneFormModal from '../components/fragments/ZoneFormModal';
import ConfirmModal from '../components/fragments/ConfirmModal';

export default function Zones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Alert messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal Control States
  const [formOpen, setFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null); // null = Create, object = Edit
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingZone, setDeletingZone] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Fetch all zones
  async function fetchZones() {
    try {
      setLoading(true);
      const res = await api.getZones();
      if (res.success) {
        setZones(res.data || []);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat data wilayah.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchZones();
  }, []);

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingZone(null);
    setFormError('');
    setFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setFormError('');
    setFormOpen(true);
  };

  // Open Delete Confirmation
  const handleOpenDelete = (zone) => {
    setDeletingZone(zone);
    setDeleteModalOpen(true);
  };

  // Validate form inputs
  const validateForm = (data) => {
    if (!data.name.trim()) {
      setFormError('Nama wilayah TPS tidak boleh kosong.');
      return false;
    }
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Garis Lintang (Latitude) harus bernilai desimal valid antara -90 dan 90.');
      return false;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError('Garis Bujur (Longitude) harus bernilai desimal valid antara -180 dan 180.');
      return false;
    }
    return true;
  };

  // Handle Submit Form (Create / Edit)
  const handleSubmit = async (formData) => {
    if (!validateForm(formData)) return;

    try {
      setFormSubmitting(true);
      setFormError('');
      
      const payload = {
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        risk_status: formData.risk_status
      };

      let res;
      if (editingZone) {
        res = await api.updateZone(editingZone.id, payload);
      } else {
        res = await api.createZone(payload);
      }

      if (res.success) {
        setSuccessMessage(editingZone ? 'Wilayah berhasil diperbarui.' : 'Wilayah baru berhasil ditambahkan.');
        setFormOpen(false);
        fetchZones();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setFormError(err.message || 'Gagal memproses data wilayah.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingZone) return;
    try {
      setDeleteSubmitting(true);
      setErrorMessage('');
      const res = await api.deleteZone(deletingZone.id);
      if (res.success) {
        setSuccessMessage(`Wilayah "${deletingZone.name}" berhasil dihapus.`);
        setDeleteModalOpen(false);
        setDeletingZone(null);
        fetchZones();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menghapus wilayah. Pastikan tidak ada supir yang ditugaskan ke wilayah ini.');
      setDeleteModalOpen(false);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Filter zones by search query
  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper for risk status styling
  const getRiskBadgeClasses = (status) => {
    switch (status) {
      case 'High Priority':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'Warning':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="px-8 py-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Kelola Wilayah TPS</h2>
          <p className="text-sm text-slate-500">
            Daftarkan, perbarui, dan hapus area cakupan TPS, koordinat geospasial GPS, serta tingkat urgensi sampah.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Tambah Wilayah</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        
        {/* Alerts */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 select-none animate-fade-in">
            <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fade-in">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Search & Stats Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none text-xs">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </span>
            <input
              type="text"
              placeholder="Cari nama wilayah TPS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          
          <div className="flex gap-4 text-xs font-semibold text-slate-500">
            <div>
              Total Wilayah: <span className="text-slate-800 font-bold">{zones.length}</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div>
              Kritis (High Priority):{' '}
              <span className="text-red-600 font-bold">
                {zones.filter((z) => z.risk_status === 'High Priority').length}
              </span>
            </div>
          </div>
        </div>

        {/* Table Data Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-emerald-500 mb-2" />
              <span className="text-xs font-semibold">Sinkronisasi data wilayah...</span>
            </div>
          ) : filteredZones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold select-none">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Nama Wilayah TPS</th>
                    <th className="px-6 py-4">Garis Lintang (Latitude)</th>
                    <th className="px-6 py-4">Garis Bujur (Longitude)</th>
                    <th className="px-6 py-4">Status Risiko AI</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredZones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-bold">#{zone.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{zone.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-500">{zone.latitude.toFixed(6)}</td>
                      <td className="px-6 py-4 font-mono text-slate-500">{zone.longitude.toFixed(6)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadgeClasses(zone.risk_status)}`}>
                          {zone.risk_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(zone)}
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer"
                            title="Edit Wilayah"
                          >
                            <FontAwesomeIcon icon={faPen} className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(zone)}
                            className="w-8 h-8 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer"
                            title="Hapus Wilayah"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <FontAwesomeIcon icon={faLocationDot} className="text-3xl text-slate-350 mb-2" />
              <span className="text-xs font-semibold">Tidak ada wilayah TPS ditemukan</span>
            </div>
          )}
        </div>
      </div>

      {/* FORM MODAL (CREATE / EDIT) */}
      <ZoneFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        editingZone={editingZone}
        submitting={formSubmitting}
        errorMessage={formError}
        clearError={() => setFormError('')}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Wilayah TPS?"
        message={`Apakah Anda yakin ingin menghapus wilayah "${deletingZone?.name || ''}"? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.`}
        confirmText="Hapus Permanen"
        confirmBgColorClass="bg-red-600 hover:bg-red-500"
        icon={faTrashCan}
        submitting={deleteSubmitting}
      />
    </div>
  );
}
