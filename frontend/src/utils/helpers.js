/**
 * Utility functions for Samling Frontend
 */

/**
 * Format timestamp into Indonesian time-ago format
 * @param {string|Date} date 
 * @returns {string}
 */
export function timeAgo(date) {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (isNaN(seconds)) return '';
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun lalu";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan lalu";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari lalu";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam lalu";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit lalu";
    return "Baru saja";
}

/**
 * Format datetime into readable Indonesian text or time-ago
 * @param {string|Date} date 
 * @returns {string}
 */
export function formatTime(date) {
    if (!date) return '';
    let d = date;
    if (!(d instanceof Date)) d = new Date(d);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffSeconds = Math.round((now - d) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return `beberapa detik yang lalu`;
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays <= 30) return `${diffDays} hari yang lalu`;
    
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Extract capacity number (integer) from string e.g. "500 kg/minggu" or "1000 kg"
 * @param {string|number} s 
 * @returns {number}
 */
export function getCapacityValue(s) {
    if (s === undefined || s === null) return 0;
    if (typeof s === 'number') return s;
    const m = s.toString().match(/\d+/g);
    return m ? (m.length > 1 ? (parseInt(m[0]) + parseInt(m[1])) / 2 : parseInt(m[0])) : 0;
}

/**
 * Export data array to CSV format
 * @param {Array<Object>} data 
 * @param {string} filename 
 * @param {Array<string>} headers 
 * @param {Array<string>} keys 
 */
export function exportToCSV(data, filename, headers, keys) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";

    data.forEach(row => {
        const rowData = keys.map(key => {
            let val = row[key];
            if (val === undefined || val === null) {
                return "-";
            }
            if (typeof val === 'boolean') {
                return val ? "Yes" : "No";
            }
            if (val instanceof Date) {
                return val.toLocaleDateString('id-ID');
            }
            // Escape double quotes and wrap in quotes if contains commas
            let strVal = val.toString();
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
                strVal = `"${strVal.replace(/"/g, '""')}"`;
            }
            // For phone numbers starting with '62', format as string
            if (key === 'phone') {
                strVal = `'${strVal}`;
            }
            return val;
        });
        csvContent += rowData.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
