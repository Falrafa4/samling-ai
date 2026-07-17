#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>

// --- KONFIGURASI DEBUGGING ---
#define DEBUG_MODE true 

// --- Konfigurasi WiFi / API ---
const char* ssid = "vivo X200";
const char* password = "12345678";
const char* apiUrl = "https://api-samling.naufalrafa.my.id/api/v1/sensor-data";

// --- Pin Sensor & Aktuator ---
const int TRIG_PIN_1 = 14; 
const int ECHO_PIN_1 = 27; 

const int TRIG_PIN_2 = 13;
const int ECHO_PIN_2 = 12;

#define DHTPIN 4 
#define DHTTYPE DHT22 
DHT dht(DHTPIN, DHTTYPE); 

#define BUZZER_PIN 5          
#define MQ135_PIN 34          

// --- Pin Indikator LED Set 1 ---
#define LED1_HIJAU 15  
#define LED1_KUNING 18 
#define LED1_MERAH 19 

// --- Pin Indikator LED Set 2 ---
#define LED2_MERAH 21
#define LED2_KUNING 22
#define LED2_HIJAU 23

// --- Kalibrasi Fisik Tempat Sampah ---
const float MIN_DISTANCE_CM = 3.0;   
const float MAX_DISTANCE_CM = 27.0; 
const int GAS_THRESHOLD = 2000;      

// --- Variabel Global Berbagi (Volatile) ---
volatile float globalDistanceCm1 = 0.0;
volatile float globalPct1 = 0.0;
volatile float globalDistanceCm2 = 0.0;
volatile float globalPct2 = 0.0;
volatile float globalSuhu = 0.0; 
volatile float globalKelembaban = 0.0; 
volatile int globalNilaiGas = 0; 

// Status flags untuk keperluan Debugging
bool us1_success = false;
bool us2_success = false;

TaskHandle_t TaskCloud;

int bacaMQ135() {
    return analogRead(MQ135_PIN); 
}

bool bacaUltrasonic(int trig, int echo, float &distanceCm) {
    digitalWrite(trig, LOW);
    delayMicroseconds(4);
    digitalWrite(trig, HIGH);
    delayMicroseconds(10);
    digitalWrite(trig, LOW);

    // Timeout diturunkan ke 15000 us (~2.5 meter) agar pembacaan tidak hang lama jika kabel putus
    unsigned long duration = pulseIn(echo, HIGH, 15000); 
    if (duration == 0) return false;

    distanceCm = (duration * 0.0343) / 2.0; 
    if (isnan(distanceCm) || distanceCm < 2.0 || distanceCm > 400.0) return false; 
    
    return true;
}

void kirimSensor(String sensorType, float fillPercentage, float value) {
    if (WiFi.status() != WL_CONNECTED) return; 

    WiFiClientSecure client;
    client.setInsecure(); 
    HTTPClient http;

    String payload = "{\"zone_id\":1,\"sensor_type\":\"" + sensorType + "\",\"fill_percentage\":" +
                     String(fillPercentage, 2) + ",\"value\":" + String(value, 2) + "}"; 
    http.begin(client, apiUrl); 
    http.addHeader("Content-Type", "application/json"); 

    int httpCode = http.POST(payload); 
    if (DEBUG_MODE) {
        if (httpCode > 0) {
            Serial.printf("  -> [API POST] %s terupdate | Status: %d\n", sensorType.c_str(), httpCode); 
        } else {
            Serial.printf("  -> [API ERROR] %s gagal | Error: %s\n", sensorType.c_str(), http.errorToString(httpCode).c_str()); 
        }
    }
    http.end(); 
}

// --- TASK CORE 0: Sinkronisasi Internet ---
void TaskCloudCode(void * pvParameters) {
    for (;;) {
        // PERUBAHAN: 5000ms → 1000ms (1 detik interval)
        vTaskDelay(1000 / portTICK_PERIOD_MS); 

        if (WiFi.status() == WL_CONNECTED) {
            float t = dht.readTemperature(); 
            float h = dht.readHumidity(); 
            if (!isnan(t)) globalSuhu = t; 
            if (!isnan(h)) globalKelembaban = h; 

            // PERUBAHAN: Hapus vTaskDelay(200) antar POST
            // Sekarang semua POST dikirim langsung tanpa jeda
            kirimSensor("Ultrasonic-Organic", globalPct1, globalDistanceCm1); 
            kirimSensor("Ultrasonic-Anorganic", globalPct2, globalDistanceCm2); 
            kirimSensor("MQ-135", 0.0, (float)globalNilaiGas); 
            kirimSensor("DHT-22-Temp", 0.0, globalSuhu); 
            kirimSensor("DHT-22-Humid", 0.0, globalKelembaban); 
        }
    }
}

void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println("\n=== SYSTEM START (DIAGNOSTIC MODE ACTIVE) ===");

    dht.begin(); 
    
    pinMode(TRIG_PIN_1, OUTPUT); digitalWrite(TRIG_PIN_1, LOW); 
    pinMode(ECHO_PIN_1, INPUT); 
    pinMode(TRIG_PIN_2, OUTPUT); digitalWrite(TRIG_PIN_2, LOW);
    pinMode(ECHO_PIN_2, INPUT);
    
    pinMode(BUZZER_PIN, OUTPUT); 
    digitalWrite(BUZZER_PIN, HIGH); // Active LOW (Mati di awal)
    pinMode(MQ135_PIN, INPUT); 
    
    pinMode(LED1_HIJAU, OUTPUT); pinMode(LED1_KUNING, OUTPUT); pinMode(LED1_MERAH, OUTPUT); 
    pinMode(LED2_HIJAU, OUTPUT); pinMode(LED2_KUNING, OUTPUT); pinMode(LED2_MERAH, OUTPUT); 
    
    digitalWrite(LED1_HIJAU, LOW); digitalWrite(LED1_KUNING, LOW); digitalWrite(LED1_MERAH, LOW); 
    digitalWrite(LED2_HIJAU, LOW); digitalWrite(LED2_KUNING, LOW); digitalWrite(LED2_MERAH, LOW);

    Serial.print("Menghubungkan ke WiFi: ");
    Serial.println(ssid); 
    WiFi.begin(ssid, password); 
    
    unsigned long start = millis(); 
    while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) { // Timeout WiFi dipangkas ke 10 detik untuk debugging cepat
        delay(500);
        Serial.print('.'); 
    } 
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[SUKSES] WiFi Terhubung!"); 
        Serial.print("IP Address: "); 
        Serial.println(WiFi.localIP()); 
    } else {
        Serial.println("\n[TIMEOUT] WiFi Lewat! Sistem berjalan dalam Mode Diagnostik Offline."); 
    }

    xTaskCreatePinnedToCore(TaskCloudCode, "CloudTask", 10000, NULL, 1, &TaskCloud, 0); 
}

float hitungPersentase(float rawDistance) {
    float currentPct = 0.0;
    if (rawDistance <= MIN_DISTANCE_CM) currentPct = 100.0; 
    else if (rawDistance >= MAX_DISTANCE_CM) currentPct = 0.0; 
    else {
        currentPct = (1.0 - (rawDistance - MIN_DISTANCE_CM) / (MAX_DISTANCE_CM - MIN_DISTANCE_CM)) * 100.0; 
    }
    return currentPct;
}

void kendaliLED(float pct, int pinH, int pinK, int pinM) {
    if (pct >= 0 && pct < 40.0) { 
        digitalWrite(pinH, HIGH); 
        digitalWrite(pinK, LOW);  
        digitalWrite(pinM, LOW);  
    } 
    else if (pct >= 40.0 && pct < 70.0) { 
        digitalWrite(pinH, HIGH); 
        digitalWrite(pinK, HIGH); 
        digitalWrite(pinM, LOW);  
    } 
    else if (pct >= 70.0) { 
        digitalWrite(pinH, HIGH); 
        digitalWrite(pinK, HIGH); 
        digitalWrite(pinM, HIGH); 
    }
}

// --- CORE 1: Eksekusi & Pelaporan Status Real-time ---
void loop() {
    // 1. Uji Ultrasonik 1 (Organik)
    float rawDistanceCm1;
    us1_success = bacaUltrasonic(TRIG_PIN_1, ECHO_PIN_1, rawDistanceCm1);
    if (us1_success) { 
        globalDistanceCm1 = rawDistanceCm1; 
        float pct1 = hitungPersentase(rawDistanceCm1);
        globalPct1 = (0.2 * pct1) + (0.8 * globalPct1); 
    }
    if (globalPct1 < 0.0) globalPct1 = 0.0; 
    if (globalPct1 > 100.0) globalPct1 = 100.0; 

    // 2. Uji Ultrasonik 2 (Anorganik)
    float rawDistanceCm2;
    us2_success = bacaUltrasonic(TRIG_PIN_2, ECHO_PIN_2, rawDistanceCm2);
    if (us2_success) {
        globalDistanceCm2 = rawDistanceCm2;
        float pct2 = hitungPersentase(rawDistanceCm2);
        globalPct2 = (0.2 * pct2) + (0.8 * globalPct2); 
    }
    if (globalPct2 < 0.0) globalPct2 = 0.0;
    if (globalPct2 > 100.0) globalPct2 = 100.0;

    // 3. Uji Gas MQ-135
    globalNilaiGas = bacaMQ135(); 

    // 4. Jalankan Kendali Output Hardware
    kendaliLED(globalPct1, LED1_HIJAU, LED1_KUNING, LED1_MERAH);
    kendaliLED(globalPct2, LED2_HIJAU, LED2_KUNING, LED2_MERAH);

    if (globalPct1 >= 70.0 || globalPct2 >= 70.0 || globalNilaiGas >= GAS_THRESHOLD) {
        digitalWrite(BUZZER_PIN, LOW); 
    } else {
        digitalWrite(BUZZER_PIN, HIGH); 
    }

    // --- LIVE REPORT DIAGNOSTIK HARDWARE ---
    if (DEBUG_MODE) {
        static unsigned long lastDebugPrint = 0; 
        if (millis() - lastDebugPrint >= 1000) { 
            lastDebugPrint = millis(); 
            
            Serial.println("\n========== DIAGNOSTIK PIN & SENSOR ESP32 ==========");
            
            // Status Ultrasonik 1
            if (us1_success) {
                Serial.printf("[OK] Ultrasonik 1 (Organik)  : Jarak = %.1f cm | Kapasitas = %.1f%%\n", globalDistanceCm1, globalPct1);
            } else {
                Serial.println("[ERR] Ultrasonik 1 (Organik) : PIN ERROR / TIMEOUT (Periksa solderan Pin 27 & 14)");
            }
            
            // Status Ultrasonik 2
            if (us2_success) {
                Serial.printf("[OK] Ultrasonik 2 (Anorganik): Jarak = %.1f cm | Kapasitas = %.1f%%\n", globalDistanceCm2, globalPct2);
            } else {
                Serial.println("[ERR] Ultrasonik 2 (Anorganik): PIN ERROR / TIMEOUT (Periksa solderan Pin 12 & 13 / Masalah Booting!)");
            }
            
            // Status MQ-135
            Serial.printf("[RAW] Sensor Gas MQ-135      : Nilai ADC = %d ", globalNilaiGas);
            if (globalNilaiGas == 0) {
                Serial.println("-> [Kritis: Jalur GND putus atau VCC tidak masuk 5V!]");
            } else if (globalNilaiGas >= 4095) {
                Serial.println("-> [Kritis: Jalur Data Pin 34 Korslet langsung ke VCC 3.3V/5V!]");
            } else {
                Serial.println("-> [OK]");
            }
            
            // Status DHT22
            float t_test = dht.readTemperature();
            if (!isnan(t_test)) {
                Serial.printf("[OK] Sensor Suhu DHT-22      : %.1f C | Lembab = %.1f%%\n", globalSuhu, globalKelembaban);
            } else {
                Serial.println("[ERR] Sensor Suhu DHT-22      : GAGAL MEMBACA DATA (Periksa Pin 4, VCC, atau Resistor Pull-up)");
            }
            
            Serial.println("===================================================");
        }
    }

    delay(100); 
} 
