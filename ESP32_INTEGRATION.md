# 🔌 ESP32 IoT Hardware Integration Guide - Samling AI

Dokumen ini berisi spesifikasi teknis dan panduan implementasi firmware **ESP32** (menggunakan Arduino Framework C++) untuk menghubungkan sensor fisik di Tempat Pembuangan Sampah (TPS) ke backend **Samling AI**.

---

## 🌐 1. Spesifikasi API Endpoint (IoT Telemetry)

Sistem menggunakan metode **HTTP PUT** (Upsert) untuk memperbarui status telemetri sensor secara berkala berdasarkan `zone_id` (ID TPS) dan `sensor_type` (jenis sensor).

*   **URL Endpoint:** `https://api-samling.naufalrafa.my.id/api/v1/sensor-data`
*   **Method:** `PUT`
*   **Headers:**
    *   `Content-Type: application/json`
*   **Valid Pydantic Schema (`SensorDataCreate`):**
    ```json
    {
      "zone_id": 1,
      "sensor_type": "string",
      "fill_percentage": 0.0,
      "value": 0.0
    }
    ```

### ⚠️ Validasi Ketat `sensor_type`
Backend menuntut nilai `sensor_type` harus berupa salah satu dari **5 Literal String** berikut (case-sensitive):
1.  `"Ultrasonic-Organic"` (Sensor kapasitas sampah organik)
2.  `"Ultrasonic-Anorganic"` (Sensor kapasitas sampah anorganik)
3.  `"MQ-135"` (Sensor kadar gas beracun/bau)
4.  `"DHT-22-Temp"` (Sensor suhu lingkungan TPS)
5.  `"DHT-22-Humid"` (Sensor kelembapan lingkungan TPS)

---

## 🔌 2. Skema Pin Hardware & Wiring (Rekomendasi)

Berikut konfigurasi pin ESP32 untuk pengujian (DHT-22 & Ultrasonic Organic) beserta opsi sensor penuh:

| Sensor | Komponen | Pin ESP32 | Keterangan |
| :--- | :--- | :--- | :--- |
| **Ultrasonic Organic** | HC-SR04 | Trigger: `GPIO 5`<br>Echo: `GPIO 18` | Sensor kapasitas sampah organik |
| **Ultrasonic Anorganic** | HC-SR04 | Trigger: `GPIO 19`<br>Echo: `GPIO 21` | Sensor kapasitas sampah anorganik *(Opsional)* |
| **Suhu/Kelembapan** | DHT-22 | Data: `GPIO 4` | Dilengkapi pull-up resistor 10K $\Omega$ ke 3.3V |
| **Gas Beracun** | MQ-135 | Analog Out: `GPIO 34` | Pembacaan analog ADC (0 - 4095) |

---

## 📝 3. Kode Firmware Lengkap ESP32 (C++ / Arduino IDE)

Gunakan kode boilerplate di bawah ini. Kode ini mengimplementasikan pembacaan sensor fisik **DHT-22** dan **Ultrasonic-Organic** secara riil, serta melakukan **simulasi (mocking)** nilai untuk sensor **Ultrasonic-Anorganic** dan **MQ-135** agar data yang dikirim ke sistem web tetap lengkap dan valid.

> [!NOTE]
> Pastikan Anda telah memasang pustaka berikut lewat Library Manager Arduino IDE:
> *   **ArduinoJson** (oleh Benoit Blanchon)
> *   **DHT sensor library** (oleh Adafruit)
> *   **Adafruit Unified Sensor** (oleh Adafruit)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ======================== CONFIGURATIONS ========================
// 1. WiFi Credentials
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// 2. API Server Address (Sesuaikan IP Host Backend Anda)
const char* serverUrl = "http://192.168.1.100:8000/api/v1/sensor-data";

// 3. Zone / TPS Configuration
const int ZONE_ID = 1; // ID Wilayah TPS sesuai database admin

// 4. Sensor Pinout & Constants
#define DHTPIN 4          // GPIO 4 untuk DHT22
#define DHTTYPE DHT22

#define TRIG_PIN_ORG 5    // GPIO 5 untuk Trigger Ultrasonic Organik
#define ECHO_PIN_ORG 18   // GPIO 18 untuk Echo Ultrasonic Organik

#define TRIG_PIN_ANORG 19 // GPIO 19 untuk Trigger Ultrasonic Anorganik (opsional)
#define ECHO_PIN_ANORG 21 // GPIO 21 untuk Echo Ultrasonic Anorganik (opsional)

#define MQ135_PIN 34      // GPIO 34 untuk Analog MQ-135 (opsional)

// Konstanta Jarak Wadah Sampah (cm) untuk HC-SR04
const float BIN_DEPTH_CM = 100.0; // Tinggi wadah tempat sampah dari sensor ke dasar
const float BIN_MIN_CM = 10.0;    // Jarak minimum sampah ke sensor (dianggap 100% penuh)

// 5. Timer (Interval Pengiriman Data - Default 10 Menit)
unsigned long lastTime = 0;
const unsigned long timerDelay = 600000; // 10 menit (600.000 ms)

// Instantiate DHT
DHT dht(DHTPIN, DHTTYPE);

// ======================== FUNCTION DECLARATIONS ========================
void connectWiFi();
float readUltrasonicPercent(int trigPin, int echoPin);
float readGasPPM();
void sendTelemetry(const char* sensorType, float fillPercentage, float value);

void setup() {
  Serial.begin(115200);
  
  // Set Pin Modes
  pinMode(TRIG_PIN_ORG, OUTPUT);
  pinMode(ECHO_PIN_ORG, INPUT);
  pinMode(TRIG_PIN_ANORG, OUTPUT);
  pinMode(ECHO_PIN_ANORG, INPUT);
  
  // Initialize Sensors
  dht.begin();
  
  // Establish WiFi Connection
  connectWiFi();
  
  Serial.println("ESP32 Sensor Unit Initiated Successfully.");
}

void loop() {
  // Hubungkan ulang WiFi jika terputus
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Jalankan pembacaan dan pengiriman data secara berkala
  if (millis() - lastTime >= timerDelay || lastTime == 0) {
    lastTime = millis();
    
    Serial.println("\n--- Memulai Siklus Telemetri Baru ---");

    // A. PEMBACAAN REAL SENSOR
    // 1. Suhu & Kelembapan (DHT-22)
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();

    // 2. Kapasitas Sampah Organik (Ultrasonic HC-SR04)
    float organicFillPercent = readUltrasonicPercent(TRIG_PIN_ORG, ECHO_PIN_ORG);

    // B. SIMULASI / MOCK DATA (Jaga-jaga Alat Belum Terpasang Fisik)
    // 3. Kapasitas Sampah Anorganik (Simulasi Ultrasonic atau baca sensor ke-2)
    float inorganicFillPercent = readUltrasonicPercent(TRIG_PIN_ANORG, ECHO_PIN_ANORG);
    // Fallback jika pin sensor ke-2 tidak terhubung fisik
    if (inorganicFillPercent < 0) {
       inorganicFillPercent = random(5, 25); // Simulasi normal
    }

    // 4. Kadar Gas (Simulasi MQ-135)
    float gasPPM = readGasPPM();

    // C. PENGIRIMAN DATA VIA HTTP PUT (UPSERT)
    // Mengirim ke 5 metrik wajib sesuai API Spec
    
    // 1. Ultrasonic Organic
    sendTelemetry("Ultrasonic-Organic", organicFillPercent, 100.0 - organicFillPercent);
    delay(500); // Jeda antar request agar tidak membebani server
    
    // 2. Ultrasonic Anorganic
    sendTelemetry("Ultrasonic-Anorganic", inorganicFillPercent, 100.0 - inorganicFillPercent);
    delay(500);

    // 3. MQ-135 (Gas)
    sendTelemetry("MQ-135", 0.0, gasPPM);
    delay(500);

    if (!isnan(temperature) && !isnan(humidity)) {
      // 4. DHT-22 Suhu
      sendTelemetry("DHT-22-Temp", 0.0, temperature);
      delay(500);
      
      // 5. DHT-22 Kelembapan
      sendTelemetry("DHT-22-Humid", 0.0, humidity);
    } else {
      Serial.println("WARNING: Gagal membaca data dari DHT-22!");
    }

    Serial.println("--- Siklus Telemetri Selesai ---");
  }
}

// ======================== HELPER FUNCTIONS ========================

// 1. Prosedur Penyambungan WiFi
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi network successfully!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
}

// 2. Fungsi Pembacaan Jarak & Konversi ke Persentase Kapasitas
float readUltrasonicPercent(int trigPin, int echoPin) {
  // Trigger pulsa ultrasonik
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Baca pantulan gelombang (durasi mikrodetik)
  long duration = pulseIn(echoPin, HIGH, 30000); // timeout 30ms
  
  if (duration == 0) {
    return -1.0; // Indikasi sensor terputus/timeout
  }
  
  // Hitung jarak dalam cm
  float distanceCm = duration * 0.034 / 2.0;
  
  // Batasi rentang jarak sesuai kedalaman wadah
  if (distanceCm > BIN_DEPTH_CM) distanceCm = BIN_DEPTH_CM;
  if (distanceCm < BIN_MIN_CM) distanceCm = BIN_MIN_CM;
  
  // Konversi jarak ke persentase kepenuhan wadah (0% - 100%)
  // Semakin dekat jarak ke sensor, wadah semakin penuh
  float fillPercent = ((BIN_DEPTH_CM - distanceCm) / (BIN_DEPTH_CM - BIN_MIN_CM)) * 100.0;
  
  return fillPercent;
}

// 3. Fungsi Pembacaan Sensor Gas MQ-135
float readGasPPM() {
  int rawADC = analogRead(MQ135_PIN);
  
  // Koreksi jika pin tidak terhubung fisik
  if (rawADC == 0) {
    return random(80, 140); // Simulasi PPM Gas Normal di sekitar TPS
  }
  
  // Rumus konversi kasar ADC ke PPM (Perlu kalibrasi lebih lanjut di lapangan)
  float ppm = (rawADC / 4095.0) * 500.0; 
  return ppm;
}

// 4. Fungsi Utama Pengiriman Payload JSON ke API via HTTP PUT
void sendTelemetry(const char* sensorType, float fillPercentage, float value) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Inisialisasi koneksi server
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Buat Payload JSON menggunakan ArduinoJson
    StaticJsonDocument<200> doc;
    doc["zone_id"] = ZONE_ID;
    doc["sensor_type"] = sensorType;
    doc["fill_percentage"] = fillPercentage;
    doc["value"] = value;
    
    String requestBody;
    serializeJson(doc, requestBody);
    
    // Kirim HTTP PUT request
    int httpResponseCode = http.PUT(requestBody);
    
    // Tampilkan log ke Serial Monitor
    Serial.printf("[%s] -> Status: %d | Payload: %s\n", sensorType, httpResponseCode, requestBody.c_str());
    
    if (httpResponseCode <= 0) {
      Serial.printf("Error pada pengiriman: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    
    // Tutup koneksi
    http.end();
  } else {
    Serial.println("WiFi terputus, gagal mengirim data telemetri.");
  }
}
```

---

## 🛠️ 4. Panduan Eksekusi bagi Developer / Agen AI
Untuk melanjutkan pengembangan bagian firmware, ikuti langkah-langkah berikut:
1.  **Impor Berkas:** Salin kode C++ di atas ke dalam berkas proyek `src/main.cpp` pada IDE PlatformIO atau direktori utama Arduino IDE.
2.  **Konfigurasi Jaringan:** Sesuaikan konstanta `ssid`, `password`, dan `serverUrl` dengan jaringan router lokal serta alamat IP host komputer backend FastAPI Anda.
3.  **Sesuaikan ID TPS:** Atur `ZONE_ID` sesuai dengan ID wilayah TPS yang ingin Anda simulasikan/uji (lihat ID wilayah di menu dashboard "Kelola Wilayah").
4.  **Uji Coba:** Jalankan Serial Monitor pada baud rate `115200` untuk meninjau log pengiriman HTTP PUT dan memverifikasi sinkronisasi status kepenuhan TPS di peta admin.
