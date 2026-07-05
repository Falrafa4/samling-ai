import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faCircleCheck,
  faTriangleExclamation,
  faRoute,
  faUserSlash,
  faImages
} from '@fortawesome/free-solid-svg-icons';

export default function FleetDispatch() {
  const [selectedDriver, setSelectedDriver] = useState(1);
  const [dispatchStatus, setDispatchStatus] = useState('idle'); // idle, sending, success

  // Data Driver aktif (akan dihubungkan ke endpoint /drivers pada Tahap 4)
  const drivers = [
    {
      id: 1,
      name: 'Budi Utomo',
      whatsapp: '6281234567890',
      status: 'Offline', // Belum merespon
      color: 'bg-slate-400 text-slate-800 border-slate-300',
      zone: 'TPS 01 - Kebon Jeruk'
    },
    {
      id: 2,
      name: 'Joko Anwar',
      whatsapp: '6281122334455',
      status: 'Available', // Siap Bertugas
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      zone: 'TPS 02 - Alun-Alun'
    },
    {
      id: 3,
      name: 'Asep Sunandar',
      whatsapp: '6289988776655',
      status: 'On Duty', // Ada Kendala / Sedang Bertugas
      color: 'bg-amber-100 text-amber-800 border-amber-300',
      zone: 'TPS 03 - Keputih'
    }
  ];

  const handleDispatch = () => {
    setDispatchStatus('sending');
    setTimeout(() => {
      setDispatchStatus('success');
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="px-8 py-6 bg-white border-b border-slate-200 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Rute &amp; Armada</h2>
        <p className="text-sm text-slate-500">
          Kirim manifes rute prioritas hasil prediksi AI ke driver supir via WhatsApp Gateway.
        </p>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Columns): Rute Rekomendasi AI & Mini Map */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-slate-800">Rute Pengangkutan Optimal</h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                AI Recommendation
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Urutan pengangkutan TPS terbaik yang dihitung berdasarkan volume urgensi dan jarak tempuh.
            </p>
          </div>

          {/* Map Preview Placeholder */}
          <div className="flex-1 bg-slate-100 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-6 text-slate-400 mb-6">
            <FontAwesomeIcon icon={faRoute} className="text-4xl text-slate-300 mb-3" />
            <p className="text-xs font-bold text-slate-700">Preview Lintasan Rute Statis</p>
            <p className="text-[10px] text-slate-500 mt-1">
              (Leaflet mini-map akan digambarkan pada Tahap 4)
            </p>
          </div>

          {/* Route Milestones */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tahapan Rute Penugasan</h4>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <div className="px-2.5 py-1 bg-red-100 border border-red-200 text-red-700 rounded-md">1. TPS 01 (Kritis)</div>
              <span>&rarr;</span>
              <div className="px-2.5 py-1 bg-amber-100 border border-amber-200 text-amber-700 rounded-md">2. TPS 02 (Warning)</div>
              <span>&rarr;</span>
              <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">3. TPA Benowo (Finish)</div>
            </div>
          </div>
        </div>

        {/* Right Column (5 Columns): Driver Readiness Panel & Execution CTA */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Driver Readiness Tracker Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col flex-1">
            <h3 className="text-md font-bold text-slate-800 mb-4">Kesiapan Driver (WhatsApp Chatbot)</h3>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 flex justify-between items-center ${
                    selectedDriver === driver.id
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{driver.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Tugas: {driver.zone}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${driver.color}`}>
                    {driver.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dispatch Execution Module */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-md font-bold text-slate-800">Eksekusi Penugasan Rute</h3>
            <p className="text-xs text-slate-500">
              Kirim link navigasi maps dan pesan manifes ke nomor driver yang dipilih.
            </p>

            <button
              onClick={handleDispatch}
              disabled={dispatchStatus === 'sending' || dispatchStatus === 'success'}
              className={`w-full py-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                dispatchStatus === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-not-allowed'
                  : dispatchStatus === 'sending'
                  ? 'bg-slate-200 text-slate-500 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20'
              }`}
            >
              <FontAwesomeIcon icon={dispatchStatus === 'success' ? faCircleCheck : faPaperPlane} />
              <span>
                {dispatchStatus === 'success'
                  ? 'Rute Terkirim - Menunggu Driver'
                  : dispatchStatus === 'sending'
                  ? 'Sedang Mengirim...'
                  : 'Kirim Manifes via WhatsApp'}
              </span>
            </button>
          </div>

          {/* Proof Viewer Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-800">Bukti Pengangkutan Driver</h4>
              <FontAwesomeIcon icon={faImages} className="text-slate-400 text-sm" />
            </div>
            <p className="text-[10px] text-slate-500 mb-4">
              Review foto bukti TPS bersih yang dikirim driver via chatbot WhatsApp.
            </p>
            <div className="h-28 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[10px]">
              Tidak ada bukti foto untuk rute aktif ini.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
