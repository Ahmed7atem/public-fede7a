// Function to parse date to MySQL DATE format (MM-DD-YY to YYYY-MM-DD)
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  }
  const [month, day, year] = dateStr.split('-');
  const fullYear = year.length === 2 ? `20${year}` : year; // Handle both YY and YYYY formats
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Function to convert time to 24-hour format
function parseTime(timeStr) {
  if (!timeStr) return null; // Return null for nullable TIME fields
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes, seconds = '00'] = time.split(':');
  hours = parseInt(hours);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}

// Function to get current timestamp in MySQL DATETIME format
function getCurrentTimestamp() {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
  parseDate,
  parseTime,
  getCurrentTimestamp,
};