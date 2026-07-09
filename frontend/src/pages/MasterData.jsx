import { useEffect, useState } from 'react';
import { api } from '../services/api';
import MasterHeader from '../components/fragments/MasterHeader';
import AlertMessage from '../components/fragments/AlertMessage';
import MasterTabs from '../components/fragments/MasterTabs';
import MasterFilters from '../components/fragments/MasterFilters';
import DriverTable from '../components/fragments/DriverTable';
import SensorTable from '../components/fragments/SensorTable';
import DriverModal from '../components/fragments/DriverModal';
import SensorModal from '../components/fragments/SensorModal';
import ConfirmModal from '../components/fragments/ConfirmModal';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('driver');

  const [drivers, setDrivers] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [zones, setZones] = useState([]);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [selectedSensorTypeFilter, setSelectedSensorTypeFilter] = useState('');

  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const zonesRes = await api.getZones();
      if (zonesRes.success) setZones(zonesRes.data || []);

      if (activeTab === 'driver') {
        const driversRes = await api.getDrivers();
        if (driversRes.success) setDrivers(driversRes.data || []);
      } else {
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
  }, [activeTab]);

  const triggerSuccessMsg = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

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

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.whatsapp_number.includes(searchQuery);
    const matchesZone = selectedZoneFilter ? d.zone_id === Number(selectedZoneFilter) : true;
    return matchesSearch && matchesZone;
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
      <MasterHeader onRefresh={fetchData} loading={loading} />

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        <AlertMessage message={successMessage} />
        <AlertMessage type="error" message={errorMessage} />

        <MasterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          driverCount={drivers.length}
          sensorCount={sensors.length}
          onAdd={() => {
            if (activeTab === 'driver') {
              setSelectedDriver(null);
              setIsDriverModalOpen(true);
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
          />

          {activeTab === 'driver' ? (
            <DriverTable
              drivers={filteredDrivers}
              onEdit={(driver) => {
                setSelectedDriver(driver);
                setIsDriverModalOpen(true);
              }}
              onDelete={(id) => setConfirmDeleteId(id)}
              getZoneName={getZoneName}
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
        zones={zones}
        onSave={handleSaveDriver}
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
        title={activeTab === 'driver' ? 'Hapus Akun Driver' : 'Copot Sensor IoT'}
        message={
          activeTab === 'driver'
            ? 'Apakah Anda yakin ingin menghapus akun driver ini? Supir ini tidak akan dapat login kembali ke aplikasi driver.'
            : 'Apakah Anda yakin ingin mencopot sensor ini dari TPS? Seluruh pembacaan telemetri aktif untuk sensor ini akan hilang.'
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={deleting}
      />
    </div>
  );
}
