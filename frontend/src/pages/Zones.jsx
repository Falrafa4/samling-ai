import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPen,
  faTrashCan,
  faEye,
  faGaugeHigh,
  faSpinner,
  faLocationDot,
  faTriangleExclamation,
  faMagnifyingGlass,
  faCheckCircle,
  faFilter,
  faFilterCircleXmark,
  faMapPin,
  faLayerGroup,
  faRoad,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../services/api';
import ZoneFormModal from '../components/fragments/ZoneFormModal';
import ConfirmModal from '../components/fragments/ConfirmModal';
import FilterModal from '../components/fragments/FilterModal';
import ZoneDetailModal from '../components/fragments/ZoneDetailModal';

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

  // Filter states
  const [filters, setFilters] = useState({
    wilayah: '',
    kecamatan: '',
    kelurahan: '',
    jenis_tps: ''
  });
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailZone, setDetailZone] = useState(null);

  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [allZones, setAllZones] = useState([]); // Untuk cascading filter dropdown
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const ITEMS_PER_PAGE = 10;

  // Count active filters
  const activeFilterCount = [filters.wilayah, filters.kecamatan, filters.kelurahan, filters.jenis_tps].filter(Boolean).length;

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Debouncing search query input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch paginated zones from server
  async function fetchZones() {
    try {
      setLoading(true);
      const res = await api.getZones({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearchQuery,
        wilayah: filters.wilayah,
        kecamatan: filters.kecamatan,
        kelurahan: filters.kelurahan,
        jenis_tps: filters.jenis_tps
      });
      if (res.success) {
        setZones(res.data.data || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat data wilayah.');
    } finally {
      setLoading(false);
    }
  }

  // Fetch all zones once on mount to populate cascading filter dropdowns
  async function fetchAllZones() {
    try {
      const res = await api.getZones();
      if (res.success) {
        setAllZones(res.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat opsi filter:', err);
    }
  }

  // Fetch when page, search query, or filters change
  useEffect(() => {
    fetchZones();
  }, [currentPage, debouncedSearchQuery, filters]);

  useEffect(() => {
    fetchAllZones();
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
        wilayah: formData.wilayah,
        kecamatan: formData.kecamatan,
        kelurahan: formData.kelurahan,
        jenis_tps: formData.jenis_tps,
        alamat: formData.alamat,
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
        fetchAllZones();
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
        fetchAllZones();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menghapus wilayah. Pastikan tidak ada supir yang ditugaskan ke wilayah ini.');
      setDeleteModalOpen(false);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Open Detail Modal
  const handleOpenDetail = (zone) => {
    setDetailZone(zone);
    setDetailModalOpen(true);
  };

  // Apply filters from FilterModal
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Paginasi dan pemfilteran dilakukan di sisi server
  const paginatedZones = zones;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

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
      <header className="px-4 sm:px-8 py-4 sm:py-6 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Kelola Wilayah dan Monitoring TPS</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Daftarkan, perbarui, dan hapus area cakupan TPS, koordinat geospasial GPS, serta tingkat urgensi sampah.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Tambah Wilayah</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
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

        {/* Search & Filter & Stats Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none text-xs">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </span>
              <input
                type="text"
                placeholder="Cari nama wilayah TPS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => setFilterModalOpen(true)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FontAwesomeIcon icon={activeFilterCount > 0 ? faFilterCircleXmark : faFilter} />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4.5 h-4.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
            <div>
              {activeFilterCount > 0 ? 'Hasil' : 'Total Wilayah'}:{' '}
              <span className="text-slate-800 font-bold">
                {totalItems}
              </span>
              {totalItems !== allZones.length && (
                <span className="text-slate-400 font-normal ml-1">
                  dari {allZones.length}
                </span>
              )}
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-200" />
            <div>
              Kritis (High Priority):{' '}
              <span className="text-red-600 font-bold">
                {allZones.filter((z) => z.risk_status === 'High Priority').length}
              </span>
            </div>
          </div>
        </div>

        {/* TPS Card List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-slate-400">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-emerald-500 mb-3" />
              <span className="text-xs font-semibold">Sinkronisasi data wilayah...</span>
            </div>
          ) : totalItems > 0 ? (
            <>
              {paginatedZones.map((zone) => {
              const riskAccent = zone.risk_status === 'High Priority' ? 'bg-red-500' : zone.risk_status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div
                  key={zone.id}
                  className="group bg-white border border-slate-200 rounded-xl shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden"
                >
                  <div className="flex">
                    <div className={`w-1 shrink-0 ${riskAccent}`} />

                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4 px-5 py-4 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded`}>
                            #{zone.id}
                          </span>
                          {zone.jenis_tps && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                              {zone.jenis_tps}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors" title={zone.name}>
                          {zone.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <FontAwesomeIcon icon={faMapPin} className="text-slate-400 text-[9px]" />
                            {zone.wilayah || '-'}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <FontAwesomeIcon icon={faLayerGroup} className="text-slate-400 text-[9px]" />
                            {zone.kecamatan || '-'}
                          </span>
                          {zone.kelurahan && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <FontAwesomeIcon icon={faLocationDot} className="text-slate-400 text-[9px]" />
                              {zone.kelurahan}
                            </span>
                          )}
                        </div>
                        {zone.alamat && (
                          <p className="text-[11px] text-slate-400 mt-1.5 truncate flex items-center gap-1" title={zone.alamat}>
                            <FontAwesomeIcon icon={faRoad} className="text-slate-300 text-[9px] shrink-0" />
                            <span className="truncate">{zone.alamat}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 md:gap-2 shrink-0 pt-3 md:pt-0 border-t border-slate-100 md:border-none">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${getRiskBadgeClasses(zone.risk_status)}`}>
                          {zone.risk_status}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenDetail(zone)}
                            className="w-7 h-7 rounded-lg border border-sky-200 text-sky-500 hover:bg-sky-50 hover:border-sky-300 transition-all flex items-center justify-center cursor-pointer"
                            title="Monitoring Sensor TPS"
                          >
                            <FontAwesomeIcon icon={faGaugeHigh} className="text-[11px]" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(zone)}
                            className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center cursor-pointer"
                            title="Edit Wilayah"
                          >
                            <FontAwesomeIcon icon={faPen} className="text-[11px]" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(zone)}
                            className="w-7 h-7 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center cursor-pointer"
                            title="Hapus Wilayah"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="text-[11px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

              {totalPages > 1 && (
                <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Halaman {currentPage} dari {totalPages}
                    <span className="text-slate-300 mx-1">|</span>
                    {totalItems} wilayah
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all flex items-center justify-center cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
                    </button>
                    {getPageNumbers().map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-8 h-8 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                          page === currentPage
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all flex items-center justify-center cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl py-20 flex flex-col items-center justify-center text-slate-400">
              <FontAwesomeIcon icon={activeFilterCount > 0 ? faFilterCircleXmark : faLocationDot} className="text-3xl text-slate-300 mb-3" />
              <span className="text-xs font-semibold">
                {activeFilterCount > 0
                  ? 'Tidak ada wilayah TPS yang cocok dengan filter'
                  : 'Tidak ada wilayah TPS ditemukan'}
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ wilayah: '', kecamatan: '', kelurahan: '', jenis_tps: '' })}
                  className="mt-3 px-4 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                >
                  Reset Filter
                </button>
              )}
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

      {/* FILTER MODAL */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        zones={zones}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />

      {/* DETAIL MODAL */}
      <ZoneDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        zone={detailZone}
        onZoneChange={setDetailZone}
      />
    </div>
  );
}
