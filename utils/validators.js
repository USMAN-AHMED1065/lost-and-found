// // Validates Pakistani mobile numbers: 03XXXXXXXXX (11 digits, starts with 03)
// function isValidPakistaniPhone(phone) {
//   const regex = /^03[0-9]{9}$/;
//   return regex.test(phone);
// }

// function isValidEmail(email) {
//   const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return regex.test(email);
// }

// function isValidUniversityEmail(email) {
//   const regex = /^[a-zA-Z0-9._-]+@student\.uet\.edu\.pk$/;
//   return regex.test(email);
// }


// module.exports = { isValidPakistaniPhone, isValidEmail };



function isValidPakistaniPhone(phone) {
  const regex = /^03[0-9]{9}$/;
  return regex.test(phone);
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isValidUniversityEmail(email) {
  const regex = /^[a-zA-Z0-9._-]+@student\.uet\.edu\.pk$/;
  return regex.test(email);
}

module.exports = { isValidPakistaniPhone, isValidEmail, isValidUniversityEmail };