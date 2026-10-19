// Tukar URL selepas deploy backend/Code.gs sebagai Web App.
// URL mestilah berakhir dengan /exec, bukan /dev.
window.WIRA_CONFIG = Object.freeze({
  apiUrl: '',
  title: 'WIRA RALLY',
  subtitle: 'Satu perlumbaan. Satu rezeki.',
  maxParticipants: 100,
  defaultDuration: 8,
  defaultTheme: 'run',
  // Kosong = gunakan URL GitHub Pages semasa.
  publicBaseUrl: ''
});
