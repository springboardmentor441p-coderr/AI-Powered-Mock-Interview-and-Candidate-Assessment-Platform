/**
 * SmartHire AI - Main JavaScript utilities
 */

document.addEventListener('DOMContentLoaded', function () {
  // Auto-dismiss alerts after 5 seconds
  document.querySelectorAll('.alert').forEach(function (alert) {
    setTimeout(function () {
      var bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) bsAlert.close();
    }, 5000);
  });
});

/**
 * Format seconds as MM:SS
 */
function formatTime(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
