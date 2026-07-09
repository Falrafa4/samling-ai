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
  async getZonesFilterOptions() {
    return fetchWithAuth('/zones/filter-options');
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
   * Mengambil seluruh daftar driver aktif.
   * Endpoint: GET /drivers
   */
  async getDrivers() {
    return fetchWithAuth('/drivers');
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
   * Mengambil rute pengangkutan sampah aktif milik driver tertentu.
   * Endpoint: GET /route-recommendations/driver/{driver_id}
   */
  async getDriverActiveRoute(driverId) {
    return fetchWithAuth(`/route-recommendations/driver/${driverId}`);
  },

  /**
   * Mengirim manifes rute ke WhatsApp supir dan mengaktifkan penugasan.
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
  }
};
