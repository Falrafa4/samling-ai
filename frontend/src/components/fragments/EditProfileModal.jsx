import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCamera, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';

const defaultAvatars = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Joshua",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Alyssa",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Sophia"
];

export default function EditProfileModal({ isOpen, onClose, onSave, currentName, currentAvatar }) {
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const username = localStorage.getItem('username') || 'admin';

  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentName || '');
      setSelectedAvatar(currentAvatar || defaultAvatars[0]);
    }
  }, [isOpen, currentName, currentAvatar]);

  if (!isOpen) return null;

  const handleAvatarChange = (url) => {
    setSelectedAvatar(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedAvatar(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert("Nama tidak boleh kosong!");
      return;
    }
    onSave(displayName, selectedAvatar);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 animate-modalFade flex flex-col max-h-[90vh] transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-slate-700 pb-4">
          <h3 className="text-xl font-bold dark:text-white">Edit Profil</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition"
          >
            <FontAwesomeIcon icon={faXmark} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="overflow-y-auto no-scrollbar space-y-6 pb-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <img 
                src={selectedAvatar} 
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100 dark:border-emerald-900/50 shadow-md bg-gray-50 dark:bg-slate-700" 
                alt="Preview" 
              />
              <div className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1.5 border-2 border-white dark:border-slate-800 shadow-sm">
                <FontAwesomeIcon icon={faCamera} className="text-xs" />
              </div>
            </div>
            <p className="text-xs text-gray-400 font-medium">Preview Foto Profil</p>
          </div>

          {/* Select Avatar Choices */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Ganti Foto Profil
            </label>
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4">
              {defaultAvatars.map((url, i) => (
                <label key={i} className="cursor-pointer group text-center">
                  <input 
                    type="radio" 
                    name="avatarSelect" 
                    value={url} 
                    checked={selectedAvatar === url}
                    onChange={() => handleAvatarChange(url)}
                    className="peer sr-only" 
                  />
                  <div className="relative rounded-full p-1 border-2 border-transparent peer-checked:border-emerald-500 transition-all hover:bg-gray-50 dark:hover:bg-slate-700">
                    <img src={url} className="w-full rounded-full bg-gray-100 dark:bg-slate-700" alt={`Avatar ${i+1}`} />
                  </div>
                </label>
              ))}
            </div>
            
            {/* Custom File Upload */}
            <div className="relative">
              <input 
                type="file" 
                id="fileInput" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="hidden" 
              />
              <button 
                type="button" 
                onClick={() => document.getElementById('fileInput').click()} 
                className="w-full py-2.5 px-4 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faCloudArrowUp} />
                Atau upload foto dari galeri
              </button>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={username} 
                disabled
                className="w-full pl-4 pr-10 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" 
              />
            </div>
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nama Tampilan
            </label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama Lengkap" 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
