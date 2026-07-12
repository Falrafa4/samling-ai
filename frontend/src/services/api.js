const BASE_URL = import.meta.env.VITE_BASE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Wrapper helper untuk fetch API dengan menyisipkan Bearer token
 * secara otomatis jika tersedia di localStorage.
 */
async function fetchWithAuth(endpoint, options = {}) {
  let token = localStorage.getItem('admin_token');

  // Bersihkan token dari tanda kutip ganda jika ter-serialize oleh react-use
  if (token) {
    try {
      token = JSON.parse(token);
    } catch (e) {
      // Gunakan string asli jika bukan JSON string
    }
  }

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
    throw new Error('Sesi Anda telah berakhir. Silakan masuk kembali.');
  }

  const result = await response.json().catch(() => ({
    success: false,
    message: 'Gagal memproses respon dari server.',
  }));

  if (!response.ok) {
    throw new Error(result.message || 'Terjadi kesalahan sistem.');
  }

  return result;
}

export const api = {
  /**
   * Mengautentikasi khusus administrator menggunakan format input Form Data.
   * Mengirim payload as application/x-www-form-urlencoded.
   * 
   * @param {string} username 
   * @param {string} password 
   */
  async loginAdmin(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${BASE_URL}/auth/login/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json().catch(() => ({
      success: false,
      message: 'Gagal membaca respon server.',
    }));

    if (!response.ok) {
      throw new Error(result.message || 'Username atau Password admin salah.');
    }

    return result;
  },

  /**
   * Mengambil data ringkasan dashboard untuk memuat halaman dasbor admin dengan cepat.
   * Endpoint: GET /dashboard/summary
   */
  async getDashboardSummary() {
    return fetchWithAuth('/dashboard/summary');
  },

  /**
   * Mengambil seluruh daftar wilayah TPS untuk dipetakan.
   * Endpoint: GET /zones
   */
  async getZones(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    const url = query ? `/zones?${query}` : '/zones';
    return fetchWithAuth(url);
  },

  /**
   * Mengambil daftar opsi filter unik untuk wilayah TPS.
   * Endpoint: GET /zones/filter-options
   */
  async getZonesFilterOptions(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    const url = query ? `/zones/filter-options?${query}` : '/zones/filter-options';
    return fetchWithAuth(url);
  },

  /**
   * Mengambil detail wilayah TPS berdasarkan ID.
   * Endpoint: GET /zones/{zone_id}
   */
  async getZone(zoneId) {
    return fetchWithAuth(`/zones/${zoneId}`);
  },

  /**
   * Membuat wilayah TPS baru.
   * Endpoint: POST /zones
   */
  async createZone(data) {
    return fetchWithAuth('/zones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  /**
   * Memperbarui data wilayah TPS.
   * Endpoint: PUT /zones/{zone_id}
   */
  async updateZone(zoneId, data) {
    return fetchWithAuth(`/zones/${zoneId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  /**
   * Menghapus wilayah TPS berdasarkan ID.
   * Endpoint: DELETE /zones/{zone_id}
   */
  async deleteZone(zoneId) {
    return fetchWithAuth(`/zones/${zoneId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Mengambil seluruh daftar tipe armada kendaraan.
   * Endpoint: GET /fleets
   */
  async getFleets() {
    return fetchWithAuth('/fleets');
  },

  /**
   * Menambahkan tipe armada baru.
   * Endpoint: POST /fleets
   */
  async createFleet(data) {
    return fetchWithAuth('/fleets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  /**
   * Memperbarui detail tipe armada.
   * Endpoint: PUT /fleets/{id}
   */
  async updateFleet(id, data) {
    return fetchWithAuth(`/fleets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  /**
   * Menghapus tipe armada dari sistem.
   * Endpoint: DELETE /fleets/{id}
   */
  async deleteFleet(id) {
    return fetchWithAuth(`/fleets/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Mengambil seluruh daftar driver aktif.
   * Endpoint: GET /drivers
   */
  async getDrivers() {
    return fetchWithAuth('/drivers');
  },

  /**
   * Mendaftarkan supir armada baru.
   * Endpoint: POST /drivers
   */
  async createDriver(data) {
    return fetchWithAuth('/drivers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  /**
   * Memperbarui data supir armada.
   * Endpoint: PUT /drivers/{id}
   */
  async updateDriver(id, data) {
    return fetchWithAuth(`/drivers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  /**
   * Menghapus driver berdasarkan ID.
   * Endpoint: DELETE /drivers/{id}
   */
  async deleteDriver(id) {
    return fetchWithAuth(`/drivers/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Mengambil pembacaan data sensor terakhir per wilayah TPS.
   * Endpoint: GET /sensor-data/latest
   */
  async getLatestSensorData(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    const url = query ? `/sensor-data/latest?${query}` : '/sensor-data/latest';
    return fetchWithAuth(url);
  },

  /**
   * Mengambil semua data pembacaan sensor (Master Data).
   * Endpoint: GET /sensor-data
   */
  async getSensorData(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    const url = query ? `/sensor-data?${query}` : '/sensor-data';
    return fetchWithAuth(url);
  },

  /**
   * Menambahkan data sensor baru secara manual.
   * Endpoint: POST /sensor-data/manual
   */
  async createSensorDataManual(data) {
    return fetchWithAuth('/sensor-data/manual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  /**
   * Memperbarui data sensor secara manual.
   * Endpoint: PUT /sensor-data/{id}
   */
  async updateSensorDataManual(id, data) {
    return fetchWithAuth(`/sensor-data/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  /**
   * Menghapus data sensor.
   * Endpoint: DELETE /sensor-data/{id}
   */
  async deleteSensorData(id) {
    return fetchWithAuth(`/sensor-data/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Mengambil seluruh laporan aduan warga untuk papan Kanban.
   * Endpoint: GET /citizen-reports
   */
  async getCitizenReports() {
    return fetchWithAuth('/citizen-reports');
  },

  /**
   * Memperbarui status penanganan aduan warga (Kanban card move).
   * Endpoint: PUT /citizen-reports/{id}
   */
  async updateCitizenReportStatus(id, status) {
    return fetchWithAuth(`/citizen-reports/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Mengambil data proyeksi volume sampah untuk 7 hari ke depan per wilayah.
   * Endpoint: GET /volume-predictions/{zone_id}/projections
   */
  async getZoneProjections(zoneId) {
    return fetchWithAuth(`/volume-predictions/${zoneId}/projections`);
  },

  /**
   * Mengambil rute rekomendasi terbaru.
   * Endpoint: GET /route-recommendations/latest
   */
  async getLatestRouteRecommendation() {
    return fetchWithAuth('/route-recommendations/latest');
  },

  /**
   * Mengambil rute pengangkutan sampah aktif milik driver tertentu.
   * Endpoint: GET /route-recommendations/driver/{driver_id}
   */
  async getDriverActiveRoute(driverId) {
    return fetchWithAuth(`/route-recommendations/driver/${driverId}`);
  },

  /**
   * Menugaskan manifes rute ke supir secara digital di database.
   * Endpoint: POST /route-recommendations/dispatch/{driver_id}
   */
  async dispatchRoute(driverId) {
    return fetchWithAuth(`/route-recommendations/dispatch/${driverId}`, {
      method: 'POST',
    });
  },

  /**
   * Memperbarui status penyelesaian rute tugas supir.
   * Endpoint: PUT /route-recommendations/{id}/status
   */
  async updateRouteStatus(routeId, status) {
    return fetchWithAuth(`/route-recommendations/${routeId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Mengambil data sensor historis untuk wilayah tertentu.
   * Endpoint: GET /sensor-data/history?zone_id={zoneId}&days={days}
   */
  async getSensorDataHistory(zoneId, days = 7) {
    return fetchWithAuth(`/sensor-data/history?zone_id=${zoneId}&days=${days}`);
  },

  // ─── AI Predictions Page ───────────────────────────────────

  /**
   * Mengambil ringkasan statistik prediksi AI.
   * Endpoint: GET /volume-predictions/summary
   */
  async getPredictionsSummary() {
    return fetchWithAuth('/volume-predictions/summary');
  },

  /**
   * Mengambil proyeksi multi-zona sekaligus.
   * Endpoint: GET /volume-predictions/multi-zone?zone_ids=1,2,3&days=7
   */
  async getMultiZoneProjections(zoneIds, days = 7) {
    const ids = Array.isArray(zoneIds) ? zoneIds.join(',') : zoneIds;
    return fetchWithAuth(`/volume-predictions/multi-zone?zone_ids=${ids}&days=${days}`);
  },

  /**
   * Mengambil riwayat prediksi AI dengan pagination.
   * Endpoint: GET /volume-predictions/history?page=1&per_page=20&zone_id=1
   */
  async getPredictionsHistory(page = 1, perPage = 20, zoneId = null) {
    let url = `/volume-predictions/history?page=${page}&per_page=${perPage}`;
    if (zoneId) url += `&zone_id=${zoneId}`;
    return fetchWithAuth(url);
  },

  /**
   * Mengambil tren akurasi AI per hari.
   * Endpoint: GET /volume-predictions/accuracy-trend?days=30
   */
  async getAccuracyTrend(days = 30) {
    return fetchWithAuth(`/volume-predictions/accuracy-trend?days=${days}`);
  }
};
