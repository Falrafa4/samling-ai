import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Header from '../components/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import AlertMessage from '../components/fragments/AlertMessage';
import MasterTabs from '../components/fragments/MasterTabs';
import MasterFilters from '../components/fragments/MasterFilters';
import DriverTable from '../components/fragments/DriverTable';
import FleetTable from '../components/fragments/FleetTable';
import SensorTable from '../components/fragments/SensorTable';
import DriverModal from '../components/fragments/DriverModal';
import FleetModal from '../components/fragments/FleetModal';
import SensorModal from '../components/fragments/SensorModal';
import ConfirmModal from '../components/fragments/ConfirmModal';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('driver'); // 'driver', 'fleet', or 'sensor'

  // Data States
  const [drivers, setDrivers] = useState([]);
  const [fleets, setFleets] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [zones, setZones] = useState([]);

  // Loading & Message States
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [selectedSensorTypeFilter, setSelectedSensorTypeFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Driver Modals State
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Fleet Modals State
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState(null);

  // Sensor Modals State
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);

  // Delete Confirmation State
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Selalu muat wilayah & armada untuk dropdown referensi silang
      const [zonesRes, fleetsRes] = await Promise.all([
        api.getZones(),
        api.getFleets()
      ]);

      if (zonesRes.success) setZones(zonesRes.data || []);
      if (fleetsRes.success) setFleets(fleetsRes.data || []);

      if (activeTab === 'driver') {
        const driversRes = await api.getDrivers();
        if (driversRes.success) setDrivers(driversRes.data || []);
      } else if (activeTab === 'sensor') {
        const sensorsRes = await api.getSensorData();
        if (sensorsRes.success) setSensors(sensorsRes.data || []);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat data master.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSearchQuery('');
    setSelectedZoneFilter('');
    setSelectedSensorTypeFilter('');
    setSelectedCategoryFilter('');
  }, [activeTab]);

  const triggerSuccessMsg = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // DRIVER CRUD Handlers
  const handleSaveDriver = async (payload) => {
    if (selectedDriver) {
      const res = await api.updateDriver(selectedDriver.id, payload);
      if (res.success) {
        triggerSuccessMsg('Data driver berhasil diperbarui.');
        fetchData();
      }
    } else {
      const res = await api.createDriver(payload);
      if (res.success) {
        triggerSuccessMsg('Driver baru berhasil didaftarkan.');
        fetchData();
      }
    }
  };

  // FLEET CRUD Handlers
  const handleSaveFleet = async (payload) => {
    if (selectedFleet) {
      const res = await api.updateFleet(selectedFleet.id, payload);
      if (res.success) {
        triggerSuccessMsg('Informasi armada berhasil diperbarui.');
        fetchData();
      }
    } else {
      const res = await api.createFleet(payload);
      if (res.success) {
        triggerSuccessMsg('Tipe armada baru berhasil terdaftar.');
        fetchData();
      }
    }
  };

  // SENSOR CRUD Handlers
  const handleSaveSensor = async (payload) => {
    if (selectedSensor) {
      const res = await api.updateSensorDataManual(selectedSensor.id, payload);
      if (res.success) {
        triggerSuccessMsg('Data sensor berhasil diperbarui.');
        fetchData();
      }
    } else {
      const res = await api.createSensorDataManual(payload);
      if (res.success) {
        triggerSuccessMsg('Sensor baru berhasil dipasang.');
        fetchData();
      }
    }
  };

  // DELETE CONFIRM Handler
  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeleting(true);
      setErrorMessage('');
      if (activeTab === 'driver') {
        const res = await api.deleteDriver(confirmDeleteId);
        if (res.success) {
          triggerSuccessMsg('Driver berhasil dihapus dari sistem.');
          fetchData();
        }
      } else if (activeTab === 'fleet') {
        const res = await api.deleteFleet(confirmDeleteId);
        if (res.success) {
          triggerSuccessMsg('Tipe armada berhasil dihapus dari sistem.');
          fetchData();
        }
      } else {
        const res = await api.deleteSensorData(confirmDeleteId);
        if (res.success) {
          triggerSuccessMsg('Sensor berhasil dicopot dari sistem.');
          fetchData();
        }
      }
      setConfirmDeleteId(null);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menghapus data.');
    } finally {
      setDeleting(false);
    }
  };

  const getZoneName = (id) => {
    const found = zones.find(z => z.id === id);
    return found ? `${found.name} (${found.kecamatan})` : `Zone #${id}`;
  };

  // Filtering Logic
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.whatsapp_number.includes(searchQuery);
    const matchesZone = selectedZoneFilter ? d.zone_id === Number(selectedZoneFilter) : true;
    return matchesSearch && matchesZone;
  });

  const filteredFleets = fleets.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter ? f.category === selectedCategoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const filteredSensors = sensors.filter(s => {
    const matchesSearch = s.sensor_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.zone && s.zone.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesZone = selectedZoneFilter ? s.zone_id === Number(selectedZoneFilter) : true;
    const matchesType = selectedSensorTypeFilter ? s.sensor_type === selectedSensorTypeFilter : true;
    return matchesSearch && matchesZone && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <Header
        title="Manajemen Master Data"
        subtitle="Kelola data operasional terpusat driver dan sensor perangkat IoT."
        rightContent={
          <button
            onClick={fetchData}
            className="w-9 h-9 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-xs"
            title="Segarkan Data"
          >
            <FontAwesomeIcon icon={faRefresh} className={loading ? "animate-spin" : ""} />
          </button>
        }
      />

      <div className="flex-1 px-8 py-6 space-y-6">
        <AlertMessage message={successMessage} />
        <AlertMessage type="error" message={errorMessage} />

        <MasterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          driverCount={drivers.length}
          fleetCount={fleets.length}
          sensorCount={sensors.length}
          onAdd={() => {
            if (activeTab === 'driver') {
              setSelectedDriver(null);
              setIsDriverModalOpen(true);
            } else if (activeTab === 'fleet') {
              setSelectedFleet(null);
              setIsFleetModalOpen(true);
            } else {
              setSelectedSensor(null);
              setIsSensorModalOpen(true);
            }
          }}
        />

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <MasterFilters
            activeTab={activeTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            zones={zones}
            selectedZoneFilter={selectedZoneFilter}
            onZoneFilterChange={setSelectedZoneFilter}
            selectedSensorTypeFilter={selectedSensorTypeFilter}
            onSensorTypeFilterChange={setSelectedSensorTypeFilter}
            selectedCategoryFilter={selectedCategoryFilter}
            onCategoryFilterChange={setSelectedCategoryFilter}
          />

          {activeTab === 'driver' ? (
            <DriverTable
              drivers={filteredDrivers}
              fleets={fleets}
              onEdit={(driver) => {
                setSelectedDriver(driver);
                setIsDriverModalOpen(true);
              }}
              onDelete={(id) => setConfirmDeleteId(id)}
              loading={loading}
            />
          ) : activeTab === 'fleet' ? (
            <FleetTable
              fleets={filteredFleets}
              onEdit={(fleet) => {
                setSelectedFleet(fleet);
                setIsFleetModalOpen(true);
              }}
              onDelete={(id) => setConfirmDeleteId(id)}
              loading={loading}
            />
          ) : (
            <SensorTable
              sensors={filteredSensors}
              onEdit={(sensor) => {
                setSelectedSensor(sensor);
                setIsSensorModalOpen(true);
              }}
              onDelete={(id) => setConfirmDeleteId(id)}
              loading={loading}
            />
          )}
        </div>
      </div>

      <DriverModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        driver={selectedDriver}
        fleets={fleets}
        onSave={handleSaveDriver}
      />

      <FleetModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        fleet={selectedFleet}
        onSave={handleSaveFleet}
      />

      <SensorModal
        isOpen={isSensorModalOpen}
        onClose={() => setIsSensorModalOpen(false)}
        sensor={selectedSensor}
        zones={zones}
        onSave={handleSaveSensor}
      />

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title={
          activeTab === 'driver'
            ? 'Hapus Akun Driver'
            : activeTab === 'fleet'
            ? 'Hapus Tipe Armada'
            : 'Copot Sensor IoT'
        }
        message={
          activeTab === 'driver'
            ? 'Apakah Anda yakin ingin menghapus akun driver ini? Supir ini tidak akan dapat login kembali ke aplikasi driver.'
            : activeTab === 'fleet'
            ? 'Apakah Anda yakin ingin menghapus tipe armada ini? Penugasan armada pada driver terkait akan dibatalkan otomatis.'
            : 'Apakah Anda yakin ingin mencopot sensor ini dari TPS? Seluruh pembacaan telemetri aktif untuk sensor ini akan hilang.'
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={deleting}
      />
    </div>
  );
}
