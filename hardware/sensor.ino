#include <WiFi.h>
#include <HTTPClient.h>

// --- Konfigurasi WiFi / API ---
const char* ssid = "vivo X200";
const char* password = "12345678";
const char* apiUrl = "https://api-samling.naufalrafa.my.id/api/v1/sensor-data";

// --- Pin HC-SR04 (sesuai permintaan) ---
const int TRIG_PIN = 13; // TRIG ke GPIO13
const int ECHO_PIN = 14; // ECHO ke GPIO14 (PASTIKAN melalui level-shifter / voltage divider!)

// Parameter jarak untuk perhitungan fill percentage
const float MIN_DISTANCE_CM = 5.0;   // jarak saat TPS dianggap penuh
const float MAX_DISTANCE_CM = 100.0; // jarak saat TPS dianggap kosong

void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println("=== Sensor Sketch (ESP32) ===");
  Serial.print("TRIG_PIN: "); Serial.println(TRIG_PIN);
  Serial.print("ECHO_PIN: "); Serial.println(ECHO_PIN);

  // Catatan penting: HC-SR04 ECHO output = 5V. ESP32 I/O tidak 5V tolerant.
  // Gunakan voltage divider (2 resistors) atau level shifter pada ECHO.

  pinMode(TRIG_PIN, OUTPUT);
  digitalWrite(TRIG_PIN, LOW);
  // Gunakan internal pulldown untuk menjaga ECHO tetap LOW saat idle
  pinMode(ECHO_PIN, INPUT_PULLDOWN);

  Serial.print("Menghubungkan WiFi");
  WiFi.begin(ssid, password);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print('.');
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    Serial.print("IP: "); Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connect timeout (continuing without network)");
  }
}

// Baca sensor ultrasonic dengan diagnostik lebih lengkap dan retry
bool bacaUltrasonic(float &distanceCm) {
  const int maxRetries = 3;
  for (int attempt = 1; attempt <= maxRetries; ++attempt) {
    // Pastikan TRIG low untuk waktu singkat
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(4);

    // Kirim trigger pulse 10us
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);


    // Baca durasi pulse menggunakan pembacaan berbasis micros (lebih andal pada beberapa board)
    unsigned long duration = 0;
    // custom pulseIn-like implementation with timeout (microseconds)
    unsigned long timeout = 30000UL; // 30 ms
    unsigned long startMicros = micros();

    // pastikan sinyal idle LOW sebelum memulai
    unsigned long t0 = micros();
    while (digitalRead(ECHO_PIN) == HIGH) {
      if (micros() - t0 > timeout) break;
    }

    // tunggu rising edge
    unsigned long waitStart = micros();
    while (digitalRead(ECHO_PIN) == LOW) {
      if (micros() - waitStart > timeout) break;
    }
    // jika masih LOW setelah timeout, duration tetap 0
    if (digitalRead(ECHO_PIN) == HIGH) {
      unsigned long pulseStart = micros();
      // tunggu falling edge
      while (digitalRead(ECHO_PIN) == HIGH) {
        if (micros() - pulseStart > timeout) break;
      }
      duration = micros() - pulseStart;
    }

    Serial.print("[DBG] Attempt "); Serial.print(attempt);
    Serial.print(" - duration: "); Serial.print(duration);
    Serial.print(" us, ECHO level: "); Serial.println(digitalRead(ECHO_PIN));

    if (duration == 0) {
      // tidak ada echo, retry
      Serial.println("[Warn] Tidak ada respons dari sensor ultrasonik, mencoba ulang...");
      delay(50);
      continue;
    }

    // Konversi ke cm (speed of sound ~343 m/s)
    distanceCm = (duration * 0.0343) / 2.0;
    Serial.print("[DBG] Distance: "); Serial.print(distanceCm); Serial.println(" cm");

    if (isnan(distanceCm) || distanceCm < 0.0) {
      Serial.println("[Error] Pembacaan jarak bukan angka/negatif.");
      return false;
    }

    // Batasi jarak realistis
    if (distanceCm < 2.0 || distanceCm > 400.0) {
      Serial.println("[Warn] Nilai jarak di luar rentang wajar.");
      return false;
    }

    return true;
  }

  Serial.println("[Error] Gagal membaca sensor Ultrasonik setelah beberapa percobaan.");
  return false;
}

// Fungsi kirim data ke server (HTTP POST JSON)
void kirimSensor(String sensorType, float fillPercentage, float value) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi belum terhubung. Lewati pengiriman.");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  String payload = "{\"zone_id\":1,\"sensor_type\":\"" + sensorType + "\",\"fill_percentage\":" +
                   String(fillPercentage, 2) + ",\"value\":" + String(value, 2) + "}";

  Serial.print("[HTTP] POST: "); Serial.println(payload);
  http.begin(client, apiUrl);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(payload);

  Serial.println("Mengirim Data " + sensorType + "...");
  Serial.print("Respons "); Serial.print(sensorType); Serial.print(" (HTTP Code): "); Serial.println(httpCode);

  http.end();
}

void loop() {
  float distanceCm;
  if (bacaUltrasonic(distanceCm)) {
    // Hitung persentase isi berdasarkan rentang jarak
    float pct;
    if (distanceCm <= MIN_DISTANCE_CM) pct = 100.0;
    else if (distanceCm >= MAX_DISTANCE_CM) pct = 0.0;
    else {
      pct = (1.0 - (distanceCm - MIN_DISTANCE_CM) / (MAX_DISTANCE_CM - MIN_DISTANCE_CM)) * 100.0;
    }
    // Clamp 0..100
    if (pct < 0.0) pct = 0.0;
    if (pct > 100.0) pct = 100.0;

    Serial.print("[Result] Distance cm: "); Serial.print(distanceCm);
    Serial.print("  | Fill%: "); Serial.println(pct);

    kirimSensor("Ultrasonic", pct, distanceCm);
  } else {
    Serial.println("[Info] Lewati pengiriman Ultrasonic karena gagal baca.");
  }

  delay(5000);
}