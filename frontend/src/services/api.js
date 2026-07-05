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
      throw new Error(result.message || 'Email/Katasandi admin salah.');
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
  async getZones() {
    return fetchWithAuth('/zones');
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
  async getLatestSensorData() {
    return fetchWithAuth('/sensor-data/latest');
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
  }
};
