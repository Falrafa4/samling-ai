import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function SensorDashboard() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLatestData = async () => {
    try {
      const result = await api.getLatestSensorData({ zone_id: 1 });
      
      const zoneOneData = Array.isArray(result?.data)
        ? result.data.find((item) => item?.sensor_type === 'DHT-22-Temp') || result.data[0]
        : null;

      setSensorData(zoneOneData ?? null);
      console.log('Data sensor zona 1:', zoneOneData);
      setError('');
    } catch (err) {
      console.error('Gagal mengambil data sensor:', err);
      setError('Gagal mengambil data sensor.');
      setSensorData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestData();

    const interval = setInterval(fetchLatestData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h2>Monitoring Suhu TPS (SAMLING AI)</h2>

      {loading && <p>Memuat data sensor...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {!loading && !sensorData && !error && (
        <p>Data sensor untuk zona 1 belum tersedia.</p>
      )}

      {sensorData && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h3>Zona:</h3>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {sensorData.zone?.name || 'TPS Zona 1'}
            </p>
          </div>
          <div>
            <h3>Suhu:</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {sensorData.value} °C
            </p>
          </div>
          <div>
            <h3>Jenis Sensor:</h3>
            <p>{sensorData.sensor_type || '-'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SensorDashboard;