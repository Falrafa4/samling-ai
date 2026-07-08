import React, { useState, useEffect } from 'react';

function SensorDashboard() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLatestData = async () => {
    try {
      const response = await fetch('https://api-samling.naufalrafa.my.id/api/v1/sensor-data/latest');
      if (!response.ok) {
        throw new Error('Gagal mengambil data sensor');
      }

      const result = await response.json();
      const zoneOneData = Array.isArray(result?.data)
        ? result.data.find((item) => item?.zone_id === 1 || item?.zone?.id === 1)
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