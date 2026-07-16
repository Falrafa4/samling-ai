import { useEffect, useState, useCallback } from 'react';
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
import EventTable from '../components/fragments/EventTable';
import DriverModal from '../components/fragments/DriverModal';
import FleetModal from '../components/fragments/FleetModal';
import SensorModal from '../components/fragments/SensorModal';
import EventModal from '../components/fragments/EventModal';
import ConfirmModal from '../components/fragments/ConfirmModal';
import Pagination from '../components/fragments/Pagination';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('driver'); // 'driver', 'fleet', 'sensor', or 'event'

  // Data States
  const [drivers, setDrivers] = useState([]);
  const [fleets, setFleets] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [events, setEvents] = useState([]);
  const [zones, setZones] = useState([]);

  // Loading & Message States
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [selectedSensorTypeFilter, setSelectedSensorTypeFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Sensor Pagination States
  const [sensorPage, setSensorPage] = useState(1);
  const [sensorTotalPages, setSensorTotalPages] = useState(1);
  const [sensorTotal, setSensorTotal] = useState(0);
  const [sensorPerPage] = useState(10);

  // Driver Pagination States
  const [driverPage, setDriverPage] = useState(1);
  const [driverTotalPages, setDriverTotalPages] = useState(1);
  const [driverTotal, setDriverTotal] = useState(0);
  const [driverPerPage] = useState(10);

  // Fleet Pagination States
  const [fleetPage, setFleetPage] = useState(1);
  const [fleetTotalPages, setFleetTotalPages] = useState(1);
  const [fleetTotal, setFleetTotal] = useState(0);
  const [fleetPerPage] = useState(10);

  // Event Pagination States
  const [eventPage, setEventPage] = useState(1);
  const [eventTotalPages, setEventTotalPages] = useState(1);
  const [eventTotal, setEventTotal] = useState(0);
  const [eventPerPage] = useState(10);

  // Driver Modals State
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Fleet Modals State
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState(null);

  // Sensor Modals State
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);

  // Event Modals State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Delete Confirmation State
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStaticData = useCallback(async () => {
    try {
      const [zonesRes, fleetsRes] = await Promise.all([
        api.getZones(),
        api.getFleets()
      ]);
      if (zonesRes.success) setZones(zonesRes.data || []);
      if (fleetsRes.success) setFleets(fleetsRes.data || []);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat data referensi.');
    }
  }, []);

  const fetchDrivers = useCallback(async (page, search, zone) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await api.getDrivers({
        page,
        per_page: driverPerPage,
        search,
        zone_id: zone
      });
      if (res.success) {
        setDrivers(res.data.items || []);
        setDriverTotal(res.data.total || 0);
        setDriverTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat data driver.');
    } finally {
      setLoading(false);
    }
  }, [driverPerPage]);

  const fetchFleets = useCallback(async (page, search, category) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await api.getFleets({
        page,
        per_page: fleetPerPage,
        search,
        category
      });
      if (res.success) {
        setFleets(res.data.items || []);
        setFleetTotal(res.data.total || 0);
        setFleetTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat data armada.');
    } finally {
      setLoading(false);
    }
  }, [fleetPerPage]);

  const fetchSensors = useCallback(async (page, search, zone, type) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await api.getSensorData({
        page,
        per_page: sensorPerPage,
        search,
        zone_id: zone,
        sensor_type: type
      });
      if (res.success) {
        setSensors(res.data.items || []);
        setSensorTotal(res.data.total || 0);
        setSensorTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat data sensor.');
    } finally {
      setLoading(false);
    }
  }, [sensorPerPage]);

  const fetchEvents = useCallback(async (page, search) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await api.getEvents({
        page,
        per_page: eventPerPage,
        search
      });
      if (res.success) {
        setEvents(res.data.items || []);
        setEventTotal(res.data.total || 0);
        setEventTotalPages(res.data.total_pages || 1);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat data event.');
    } finally {
      setLoading(false);
    }
  }, [eventPerPage]);

  const fetchMetadataCounts = useCallback(async () => {
    try {
      const [driversRes, fleetsRes, sensorsRes, eventsRes] = await Promise.all([
        api.getDrivers({ page: 1, per_page: 1 }),
        api.getFleets({ page: 1, per_page: 1 }),
        api.getSensorData({ page: 1, per_page: 1 }),
        api.getEvents({ page: 1, per_page: 1 })
      ]);
      if (driversRes.success) setDriverTotal(driversRes.data.total || 0);
      if (fleetsRes.success) setFleetTotal(fleetsRes.data.total || 0);
      if (sensorsRes.success) setSensorTotal(sensorsRes.data.total || 0);
      if (eventsRes.success) setEventTotal(eventsRes.data.total || 0);
    } catch {
      // Fail silently
    }
  }, []);

  // Mount Effect
  useEffect(() => {
    fetchStaticData();
    fetchMetadataCounts();
  }, [fetchStaticData, fetchMetadataCounts]);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Tab Switch Effect
  useEffect(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedZoneFilter('');
    setSelectedSensorTypeFilter('');
    setSelectedCategoryFilter('');
    setDriverPage(1);
    setFleetPage(1);
    setSensorPage(1);
    setEventPage(1);

    if (activeTab === 'driver') {
      fetchDrivers(1, '', '');
    } else if (activeTab === 'fleet') {
      fetchFleets(1, '', '');
    } else if (activeTab === 'sensor') {
      fetchSensors(1, '', '', '');
    } else if (activeTab === 'event') {
      fetchEvents(1, '');
    }
  }, [activeTab, fetchDrivers, fetchFleets, fetchSensors, fetchEvents]);

  // Driver Page / Filter Change Effect
  useEffect(() => {
    if (activeTab === 'driver') {
      fetchDrivers(driverPage, debouncedSearchQuery, selectedZoneFilter);
    }
  }, [activeTab, driverPage, debouncedSearchQuery, selectedZoneFilter, fetchDrivers]);

  // Fleet Page / Filter Change Effect
  useEffect(() => {
    if (activeTab === 'fleet') {
      fetchFleets(fleetPage, debouncedSearchQuery, selectedCategoryFilter);
    }
  }, [activeTab, fleetPage, debouncedSearchQuery, selectedCategoryFilter, fetchFleets]);

  // Sensor Page / Filter Change Effect
  useEffect(() => {
    if (activeTab === 'sensor') {
      fetchSensors(sensorPage, debouncedSearchQuery, selectedZoneFilter, selectedSensorTypeFilter);
    }
  }, [activeTab, sensorPage, debouncedSearchQuery, selectedZoneFilter, selectedSensorTypeFilter, fetchSensors]);

  // Event Page / Filter Change Effect
  useEffect(() => {
    if (activeTab === 'event') {
      fetchEvents(eventPage, debouncedSearchQuery);
    }
  }, [activeTab, eventPage, debouncedSearchQuery, fetchEvents]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setDriverPage(1);
    setFleetPage(1);
    setSensorPage(1);
    setEventPage(1);
  };

  const handleZoneFilterChange = (val) => {
    setSelectedZoneFilter(val);
    setDriverPage(1);
    setSensorPage(1);
  };

  const handleSensorTypeFilterChange = (val) => {
    setSelectedSensorTypeFilter(val);
    setSensorPage(1);
  };

  const handleCategoryFilterChange = (val) => {
    setSelectedCategoryFilter(val);
    setFleetPage(1);
  };

  const handleRefresh = () => {
    fetchStaticData();
    fetchMetadataCounts();
    if (activeTab === 'driver') {
      fetchDrivers(driverPage, debouncedSearchQuery, selectedZoneFilter);
    } else if (activeTab === 'fleet') {
      fetchFleets(fleetPage, debouncedSearchQuery, selectedCategoryFilter);
    } else if (activeTab === 'sensor') {
      fetchSensors(sensorPage, debouncedSearchQuery, selectedZoneFilter, selectedSensorTypeFilter);
    } else if (activeTab === 'event') {
      fetchEvents(eventPage, debouncedSearchQuery);
    }
  };

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
        fetchDrivers(driverPage, debouncedSearchQuery, selectedZoneFilter);
        fetchMetadataCounts();
      }
    } else {
      const res = await api.createDriver(payload);
      if (res.success) {
        triggerSuccessMsg('Driver baru berhasil didaftarkan.');
        fetchDrivers(driverPage, debouncedSearchQuery, selectedZoneFilter);
        fetchMetadataCounts();
      }
    }
  };

  // FLEET CRUD Handlers
  const handleSaveFleet = async (payload) => {
    if (selectedFleet) {
      const res = await api.updateFleet(selectedFleet.id, payload);
      if (res.success) {
        triggerSuccessMsg('Informasi armada berhasil diperbarui.');
        fetchFleets(fleetPage, debouncedSearchQuery, selectedCategoryFilter);
        fetchMetadataCounts();
        fetchStaticData();
      }
    } else {
      const res = await api.createFleet(payload);
      if (res.success) {
        triggerSuccessMsg('Tipe armada baru berhasil terdaftar.');
        fetchFleets(fleetPage, debouncedSearchQuery, selectedCategoryFilter);
        fetchMetadataCounts();
        fetchStaticData();
      }
    }
  };

  // SENSOR CRUD Handlers
  const handleSaveSensor = async (payload) => {
    if (selectedSensor) {
      const res = await api.updateSensorDataManual(selectedSensor.id, payload);
      if (res.success) {
        triggerSuccessMsg('Data sensor berhasil diperbarui.');
        fetchSensors(sensorPage, debouncedSearchQuery, selectedZoneFilter, selectedSensorTypeFilter);
        fetchMetadataCounts();
      }
    } else {
      const res = await api.createSensorDataManual(payload);
      if (res.success) {
        triggerSuccessMsg('Sensor baru berhasil dipasang.');
        fetchSensors(sensorPage, debouncedSearchQuery, selectedZoneFilter, selectedSensorTypeFilter);
        fetchMetadataCounts();
      }
    }
  };

  // EVENT CRUD Handlers
  const handleSaveEvent = async (payload) => {
    if (selectedEvent) {
      const res = await api.updateEvent(selectedEvent.id, payload);
      if (res.success) {
        triggerSuccessMsg('Data event berhasil diperbarui.');
        fetchEvents(eventPage, debouncedSearchQuery);
        fetchMetadataCounts();
      }
    } else {
      const res = await api.createEvent(payload);
      if (res.success) {
        triggerSuccessMsg('Event baru berhasil ditambahkan.');
        fetchEvents(eventPage, debouncedSearchQuery);
        fetchMetadataCounts();
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
          fetchDrivers(driverPage, debouncedSearchQuery, selectedZoneFilter);
          fetchMetadataCounts();
        }
      } else if (activeTab === 'fleet') {
        const res = await api.deleteFleet(confirmDeleteId);
        if (res.success) {
          triggerSuccessMsg('Tipe armada berhasil dihapus dari sistem.');
          fetchFleets(fleetPage, debouncedSearchQuery, selectedCategoryFilter);
          fetchMetadataCounts();
          fetchStaticData();
        }
      } else if (activeTab === 'sensor') {
        const res = await api.deleteSensorData(confirmDeleteId);
        if (res.success) {
          triggerSuccessMsg('Sensor berhasil dicopot dari sistem.');
          fetchSensors(sensorPage, debouncedSearchQuery, selectedZoneFilter, selectedSensorTypeFilter);
          fetchMetadataCounts();
        }
      } else if (activeTab === 'event') {
        const res = await api.deleteEvent(confirmDeleteId);
        if (res.success) {
          triggerSuccessMsg('Event berhasil dihapus dari sistem.');
          fetchEvents(eventPage, debouncedSearchQuery);
          fetchMetadataCounts();
        }
      }
      setConfirmDeleteId(null);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menghapus data.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtering Logic
  const filteredDrivers = drivers;
  const filteredFleets = fleets;
  const filteredSensors = sensors;
  const filteredEvents = events;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <Header
        title="Manajemen Master Data"
        subtitle="Kelola data operasional terpusat driver dan sensor perangkat IoT."
        rightContent={
          <button
            onClick={handleRefresh}
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
          driverCount={driverTotal}
          fleetCount={fleetTotal}
          sensorCount={sensorTotal}
          eventCount={eventTotal}
          onAdd={() => {
            if (activeTab === 'driver') {
              setSelectedDriver(null);
              setIsDriverModalOpen(true);
            } else if (activeTab === 'fleet') {
              setSelectedFleet(null);
              setIsFleetModalOpen(true);
            } else if (activeTab === 'sensor') {
              setSelectedSensor(null);
              setIsSensorModalOpen(true);
            } else if (activeTab === 'event') {
              setSelectedEvent(null);
              setIsEventModalOpen(true);
            }
          }}
        />

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <MasterFilters
            activeTab={activeTab}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            zones={zones}
            selectedZoneFilter={selectedZoneFilter}
            onZoneFilterChange={handleZoneFilterChange}
            selectedSensorTypeFilter={selectedSensorTypeFilter}
            onSensorTypeFilterChange={handleSensorTypeFilterChange}
            selectedCategoryFilter={selectedCategoryFilter}
            onCategoryFilterChange={handleCategoryFilterChange}
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
          ) : activeTab === 'sensor' ? (
            <SensorTable
              sensors={filteredSensors}
              onEdit={(sensor) => {
                setSelectedSensor(sensor);
                setIsSensorModalOpen(true);
              }}
              onDelete={(id) => setConfirmDeleteId(id)}
              loading={loading}
            />
          ) : (
            <EventTable
              events={filteredEvents}
              onEdit={(event) => {
                setSelectedEvent(event);
                setIsEventModalOpen(true);
              }}
              onDelete={(id) => setConfirmDeleteId(id)}
              loading={loading}
            />
          )}

          {activeTab === 'driver' && (
            <Pagination
              currentPage={driverPage}
              totalPages={driverTotalPages}
              totalItems={driverTotal}
              onPageChange={setDriverPage}
              itemLabel="driver"
              loading={loading}
            />
          )}

          {activeTab === 'fleet' && (
            <Pagination
              currentPage={fleetPage}
              totalPages={fleetTotalPages}
              totalItems={fleetTotal}
              onPageChange={setFleetPage}
              itemLabel="tipe armada"
              loading={loading}
            />
          )}

          {activeTab === 'sensor' && (
            <Pagination
              currentPage={sensorPage}
              totalPages={sensorTotalPages}
              totalItems={sensorTotal}
              onPageChange={setSensorPage}
              itemLabel="data sensor"
              loading={loading}
            />
          )}

          {activeTab === 'event' && (
            <Pagination
              currentPage={eventPage}
              totalPages={eventTotalPages}
              totalItems={eventTotal}
              onPageChange={setEventPage}
              itemLabel="event"
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

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        onSave={handleSaveEvent}
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
            : activeTab === 'sensor'
            ? 'Copot Sensor IoT'
            : 'Hapus Master Event'
        }
        message={
          activeTab === 'driver'
            ? 'Apakah Anda yakin ingin menghapus akun driver ini? Supir ini tidak akan dapat login kembali ke aplikasi driver.'
            : activeTab === 'fleet'
            ? 'Apakah Anda yakin ingin menghapus tipe armada ini? Penugasan armada pada driver terkait akan dibatalkan otomatis.'
            : activeTab === 'sensor'
            ? 'Apakah Anda yakin ingin mencopot sensor ini dari TPS? Seluruh pembacaan telemetri aktif untuk sensor ini akan hilang.'
            : 'Apakah Anda yakin ingin menghapus data event tahunan ini? Event ini tidak akan lagi masuk dalam kalkulasi analisis risiko.'
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        loading={deleting}
      />
    </div>
  );
}
