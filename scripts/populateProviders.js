const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Define the Provider schema with flat structure
const providerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['Hospital', 'Doctor', 'Lab'],
    default: 'Hospital'
  },
  isInNetwork: { type: Boolean, default: true },
  
  // Location fields
  city: { type: String, required: true },
  address: { type: String, required: true },
  area: String,
  latitude: Number,
  longitude: Number,

  // Contact fields
  phone: String,
  email: String,
  website: String,
  facebook: String,
  twitter: String,
  instagram: String,

  // Service fields
  specialties: String,
  departments: String,
  emergencyAvailable: Boolean,
  emergencyHours: String,
  icu: Boolean,
  operatingRooms: Number,
  diagnosticServices: String,

  // Insurance fields
  acceptedPlans: String,
  averageClaimAmount: Number,
  paymentMethods: String,

  // Quality fields
  accreditation: String,
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  bedCount: Number,
  staffCount: Number,
  establishedYear: Number,

  // Operations fields
  weekdaysHours: String,
  weekendHours: String,
  appointmentProcess: String,
  parking: Boolean,

  // Feature fields
  languages: String,
  internationalServices: Boolean,
  medicalTourism: Boolean,
  translationServices: Boolean,
  amenities: String,

  // Doctor specific fields
  specialization: String,
  fees: Number,
  waitingTime: String,
  experienceYears: Number,

  // Lab specific fields
  labSpecialty: String,
  averageTestFee: Number,
  resultProcessingTime: String
}, { timestamps: true });

// Create a 2dsphere index for location-based queries
providerSchema.index({ latitude: 1, longitude: 1 });

const Provider = mongoose.model('Provider', providerSchema);

// Hospital data with generated information
const hospitals = [
  {
    name: 'Saudi German Hospital Cairo',
    city: 'Cairo',
    address: 'Al Hay Al Asher, Nasr City, Cairo',
    area: 'Nasr City',
    latitude: 30.0444,
    longitude: 31.4217,
    phone: '+20 22 345 6789, +20 22 345 6790',
    email: 'info@sghcairo.com',
    website: 'www.sghcairo.com',
    facebook: 'SGH.Cairo',
    twitter: '@SGH_Cairo',
    instagram: 'sgh_cairo',
    specialties: 'Orthopedics, Neurology, Cardiology, General Surgery',
    departments: 'Emergency, ICU, Surgery, Radiology',
    emergencyAvailable: true,
    emergencyHours: '24/7',
    icu: true,
    operatingRooms: 8,
    diagnosticServices: 'MRI, CT Scan, X-Ray, Laboratory',
    acceptedPlans: 'Standard, Premium, VIP',
    averageClaimAmount: 5054,
    paymentMethods: 'Cash, Credit Card, Insurance',
    accreditation: 'JCI Accredited',
    rating: 4.5,
    ratingCount: 1200,
    bedCount: 300,
    staffCount: 500,
    establishedYear: 1988,
    weekdaysHours: '24/7',
    weekendHours: '24/7',
    appointmentProcess: 'Online and Phone Booking',
    parking: true,
    languages: 'Arabic, English, German',
    internationalServices: true,
    medicalTourism: true,
    translationServices: true,
    amenities: 'Cafeteria, Pharmacy, Gift Shop, Prayer Room'
  },
  {
    name: 'El Nada Hospital',
    city: 'Cairo',
    address: 'Maadi, Cairo',
    area: 'Maadi',
    latitude: 29.9667,
    longitude: 31.2833,
    phone: '+20 2 2525 6789',
    email: 'info@elnadahospital.com',
    website: 'www.elnadahospital.com',
    facebook: 'ElNadaHospital',
    twitter: '@ElNadaHospital',
    instagram: 'elnadahospital',
    specialties: 'Neurology, Internal Medicine, Pediatrics',
    departments: 'Emergency, ICU, Neurology, Pediatrics',
    emergencyAvailable: true,
    emergencyHours: '24/7',
    icu: true,
    operatingRooms: 5,
    diagnosticServices: 'MRI, CT Scan, X-Ray, Laboratory',
    acceptedPlans: 'Standard, Premium',
    averageClaimAmount: 7818,
    paymentMethods: 'Cash, Credit Card, Insurance',
    accreditation: 'ISO 9001',
    rating: 4.3,
    ratingCount: 800,
    bedCount: 150,
    staffCount: 300,
    establishedYear: 1995,
    weekdaysHours: '24/7',
    weekendHours: '24/7',
    appointmentProcess: 'Phone and Walk-in',
    parking: true,
    languages: 'Arabic, English',
    internationalServices: true,
    medicalTourism: false,
    translationServices: true,
    amenities: 'Cafeteria, Pharmacy'
  },
  {
    name: 'Misr International Hospital',
    city: 'Cairo',
    address: 'Cairo-Alexandria Desert Road, Cairo',
    area: 'Desert Road',
    latitude: 30.0833,
    longitude: 31.2167,
    phone: '+20 2 3855 5555',
    email: 'info@mih.com.eg',
    website: 'www.mih.com.eg',
    facebook: 'MIHCairo',
    twitter: '@MIH_Cairo',
    instagram: 'mih_cairo',
    specialties: 'Pediatrics, Obstetrics, Gynecology',
    departments: 'Emergency, ICU, Pediatrics, Obstetrics',
    emergencyAvailable: true,
    emergencyHours: '24/7',
    icu: true,
    operatingRooms: 6,
    diagnosticServices: 'MRI, CT Scan, X-Ray, Laboratory',
    acceptedPlans: 'Standard, Premium, VIP',
    averageClaimAmount: 4079,
    paymentMethods: 'Cash, Credit Card, Insurance',
    accreditation: 'JCI Accredited',
    rating: 4.6,
    ratingCount: 1500,
    bedCount: 250,
    staffCount: 400,
    establishedYear: 1987,
    weekdaysHours: '24/7',
    weekendHours: '24/7',
    appointmentProcess: 'Online and Phone Booking',
    parking: true,
    languages: 'Arabic, English, French',
    internationalServices: true,
    medicalTourism: true,
    translationServices: true,
    amenities: 'Cafeteria, Pharmacy, Gift Shop, Prayer Room'
  },
  {
    name: 'Andalusia Hospitals',
    city: 'Cairo',
    address: 'Maadi, Cairo',
    area: 'Maadi',
    latitude: 29.9667,
    longitude: 31.2833,
    phone: '+20 2 2524 4444',
    email: 'info@andalusia.com.eg',
    website: 'www.andalusia.com.eg',
    facebook: 'AndalusiaHospitals',
    twitter: '@AndalusiaHosp',
    instagram: 'andalusia_hospitals',
    specialties: 'General Practice, Internal Medicine, Surgery',
    departments: 'Emergency, ICU, Surgery, Internal Medicine',
    emergencyAvailable: true,
    emergencyHours: '24/7',
    icu: true,
    operatingRooms: 7,
    diagnosticServices: 'MRI, CT Scan, X-Ray, Laboratory',
    acceptedPlans: 'Standard, Premium',
    averageClaimAmount: 9980,
    paymentMethods: 'Cash, Credit Card, Insurance',
    accreditation: 'ISO 9001',
    rating: 4.4,
    ratingCount: 1000,
    bedCount: 200,
    staffCount: 350,
    establishedYear: 1984,
    weekdaysHours: '24/7',
    weekendHours: '24/7',
    appointmentProcess: 'Phone and Online Booking',
    parking: true,
    languages: 'Arabic, English',
    internationalServices: true,
    medicalTourism: false,
    translationServices: true,
    amenities: 'Cafeteria, Pharmacy, Prayer Room'
  },
  {
    name: 'Ain Shams University Hospital',
    city: 'Cairo',
    address: 'Abbassia, Cairo',
    area: 'Abbassia',
    latitude: 30.0667,
    longitude: 31.2833,
    phone: '+20 2 2482 1234',
    email: 'info@asu.edu.eg',
    website: 'www.asu.edu.eg',
    facebook: 'ASUHospital',
    twitter: '@ASU_Hospital',
    instagram: 'asu_hospital',
    specialties: 'General Medicine, Surgery, Pediatrics',
    departments: 'Emergency, ICU, Surgery, Internal Medicine',
    emergencyAvailable: true,
    emergencyHours: '24/7',
    icu: true,
    operatingRooms: 10,
    diagnosticServices: 'MRI, CT Scan, X-Ray, Laboratory',
    acceptedPlans: 'Standard, University Insurance',
    averageClaimAmount: 3500,
    paymentMethods: 'Cash, Insurance',
    accreditation: 'Ministry of Health',
    rating: 4.2,
    ratingCount: 2000,
    bedCount: 500,
    staffCount: 800,
    establishedYear: 1947,
    weekdaysHours: '24/7',
    weekendHours: '24/7',
    appointmentProcess: 'Walk-in and Referral',
    parking: true,
    languages: 'Arabic, English',
    internationalServices: false,
    medicalTourism: false,
    translationServices: false,
    amenities: 'Cafeteria, Pharmacy'
  },
  {
    name: 'Al Mokattam Hospital',
    city: 'Cairo',
    address: 'Mokattam, Cairo',
    area: 'Mokattam',
    latitude: 30.0167,
    longitude: 31.3667,
    phone: '+20 2 2505 5555',
    email: 'info@almokattamhospital.com',
    website: 'www.almokattamhospital.com',
    facebook: 'AlMokattamHospital',
    twitter: '@AlMokattamHosp',
    instagram: 'almokattam_hospital',
    specialties: 'General Medicine, Surgery, Obstetrics',
    departments: 'Emergency, ICU, Surgery, Obstetrics',
    emergencyAvailable: true,
    emergencyHours: '24/7',
    icu: true,
    operatingRooms: 6,
    diagnosticServices: 'MRI, CT Scan, X-Ray, Laboratory',
    acceptedPlans: 'Standard, Premium',
    averageClaimAmount: 4500,
    paymentMethods: 'Cash, Credit Card, Insurance',
    accreditation: 'ISO 9001',
    rating: 4.3,
    ratingCount: 900,
    bedCount: 180,
    staffCount: 320,
    establishedYear: 1990,
    weekdaysHours: '24/7',
    weekendHours: '24/7',
    appointmentProcess: 'Phone and Walk-in',
    parking: true,
    languages: 'Arabic, English',
    internationalServices: true,
    medicalTourism: false,
    translationServices: true,
    amenities: 'Cafeteria, Pharmacy, Prayer Room'
  },
  {
    name: 'As-Salam International Hospital',
    city: 'Cairo',
    address: 'Maadi, Cairo',
    area: 'Maadi',
    latitude: 29.9667,
    longitude: 31.2833,
    phone: '+20 2 2524 1234',
    email: 'info@assalamhospital.com',
    website: 'www.assalamhospital.com',
    facebook: 'AssalamHospital',
    twitter: '@AssalamHospital',
    instagram: 'assalam_hospital',
    specialties: 'General Medicine, Surgery, Cardiology',
    departments: 'Emergency, ICU, Surgery, Cardiology',
    emergencyAvailable: true,
    emergencyHours: '24/7',
    icu: true,
    operatingRooms: 5,
    diagnosticServices: 'MRI, CT Scan, X-Ray, Laboratory',
    acceptedPlans: 'Standard, Premium',
    averageClaimAmount: 6000,
    paymentMethods: 'Cash, Credit Card, Insurance',
    accreditation: 'ISO 9001',
    rating: 4.4,
    ratingCount: 1100,
    bedCount: 160,
    staffCount: 280,
    establishedYear: 1992,
    weekdaysHours: '24/7',
    weekendHours: '24/7',
    appointmentProcess: 'Phone and Online Booking',
    parking: true,
    languages: 'Arabic, English',
    internationalServices: true,
    medicalTourism: false,
    translationServices: true,
    amenities: 'Cafeteria, Pharmacy, Prayer Room'
  },
  {
    name: 'Cleopatra Hospital',
    city: 'Cairo',
    address: 'Heliopolis, Cairo',
    area: 'Heliopolis',
    latitude: 30.1000,
    longitude: 31.3333,
    phone: '+20 2 2415 5555',
    email: 'info@cleopatrahospital.com',
    website: 'www.cleopatrahospital.com',
    facebook: 'CleopatraHospital',
    twitter: '@CleopatraHosp',
    instagram: 'cleopatra_hospital',
    specialties: 'General Medicine, Surgery, Obstetrics',
    departments: 'Emergency, ICU, Surgery, Obstetrics',
    emergencyAvailable: true,
    emergencyHours: '24/7',
    icu: true,
    operatingRooms: 6,
    diagnosticServices: 'MRI, CT Scan, X-Ray, Laboratory',
    acceptedPlans: 'Standard, Premium',
    averageClaimAmount: 5500,
    paymentMethods: 'Cash, Credit Card, Insurance',
    accreditation: 'ISO 9001',
    rating: 4.3,
    ratingCount: 950,
    bedCount: 170,
    staffCount: 300,
    establishedYear: 1985,
    weekdaysHours: '24/7',
    weekendHours: '24/7',
    appointmentProcess: 'Phone and Walk-in',
    parking: true,
    languages: 'Arabic, English',
    internationalServices: true,
    medicalTourism: false,
    translationServices: true,
    amenities: 'Cafeteria, Pharmacy, Prayer Room'
  },
  {
    name: 'Dar Al Fouad Hospital',
    city: 'Cairo',
    address: '6th of October City, Cairo',
    area: '6th of October City',
    latitude: 29.9667,
    longitude: 30.9667,
    phone: '+20 2 3833 3333',
    email: 'info@daralfouad.org',
    website: 'www.daralfouad.org',
    facebook: 'DarAlFouadHospital',
    twitter: '@DarAlFouadHosp',
    instagram: 'daralfouad_hospital',
    specialties: 'Cardiology, Oncology, Transplant',
    departments: 'Emergency, ICU, Cardiology, Oncology',
    emergencyAvailable: true,
    emergencyHours: '24/7',
    icu: true,
    operatingRooms: 8,
    diagnosticServices: 'MRI, CT Scan, X-Ray, Laboratory',
    acceptedPlans: 'Standard, Premium, VIP',
    averageClaimAmount: 8500,
    paymentMethods: 'Cash, Credit Card, Insurance',
    accreditation: 'JCI Accredited',
    rating: 4.7,
    ratingCount: 1300,
    bedCount: 220,
    staffCount: 400,
    establishedYear: 1999,
    weekdaysHours: '24/7',
    weekendHours: '24/7',
    appointmentProcess: 'Online and Phone Booking',
    parking: true,
    languages: 'Arabic, English, French',
    internationalServices: true,
    medicalTourism: true,
    translationServices: true,
    amenities: 'Cafeteria, Pharmacy, Gift Shop, Prayer Room'
  },
  {
    name: 'Egypt Air Hospital',
    city: 'Cairo',
    address: 'Cairo International Airport, Cairo',
    area: 'Airport Area',
    latitude: 30.1167,
    longitude: 31.4000,
    phone: '+20 2 2265 4321',
    email: 'info@egyptairhospital.com',
    website: 'www.egyptairhospital.com',
    facebook: 'EgyptAirHospital',
    twitter: '@EgyptAirHospital',
    instagram: 'egyptair_hospital',
    specialties: 'Aviation Medicine, General Medicine, Emergency',
    departments: 'Emergency, ICU, Aviation Medicine, General Medicine',
    emergencyAvailable: true,
    emergencyHours: '24/7',
    icu: true,
    operatingRooms: 4,
    diagnosticServices: 'MRI, CT Scan, X-Ray, Laboratory',
    acceptedPlans: 'Standard, Egypt Air Insurance',
    averageClaimAmount: 4000,
    paymentMethods: 'Cash, Credit Card, Insurance',
    accreditation: 'ISO 9001',
    rating: 4.2,
    ratingCount: 700,
    bedCount: 120,
    staffCount: 250,
    establishedYear: 1975,
    weekdaysHours: '24/7',
    weekendHours: '24/7',
    appointmentProcess: 'Phone and Walk-in',
    parking: true,
    languages: 'Arabic, English',
    internationalServices: true,
    medicalTourism: false,
    translationServices: true,
    amenities: 'Cafeteria, Pharmacy'
  }
];

async function populateProviders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing providers
    await Provider.deleteMany({});
    console.log('Cleared existing providers');

    // Add IDs to hospitals
    const hospitalsWithIds = hospitals.map((hospital, index) => ({
      ...hospital,
      id: `HOSP${String(index + 1).padStart(3, '0')}`,
      type: 'Hospital'
    }));

    // Insert hospitals
    await Provider.insertMany(hospitalsWithIds);
    console.log(`Successfully inserted ${hospitalsWithIds.length} hospitals`);

    // Read and process doctors data
    const doctorsData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('/Volumes/MySSD/GP Code/public-fede7a/data/Egyptian Doctors Data.csv')
        .pipe(csv())
        .on('data', (data) => doctorsData.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const doctorsWithIds = doctorsData.map((doctor, index) => ({
      id: `DOC${String(index + 1).padStart(3, '0')}`,
      name: doctor.specialization || `Doctor ${index + 1}`,
      type: 'Doctor',
      specialization: doctor.specialization || 'General Practitioner',
      fees: parseFloat(doctor.fees) || 0,
      waitingTime: doctor.waiting_time || 'Not specified',
      city: 'Cairo',
      address: doctor.clinic_location || 'Location not specified',
      area: doctor.clinic_location || 'Area not specified',
      latitude: 30.0444,
      longitude: 31.2357,
      isInNetwork: true,
      phone: '',
      email: '',
      website: '',
      specialties: doctor.specialization || 'General Practice',
      departments: '',
      emergencyAvailable: false,
      emergencyHours: '',
      icu: false,
      operatingRooms: 0,
      diagnosticServices: '',
      acceptedPlans: 'Standard',
      averageClaimAmount: 0,
      paymentMethods: 'Cash, Insurance',
      accreditation: '',
      rating: parseFloat(doctor.avg_rate) || 0,
      ratingCount: parseInt(doctor.rate_count?.replace('From ', '').replace(' Visitors', '')) || 0,
      bedCount: 0,
      staffCount: 0,
      establishedYear: 0,
      weekdaysHours: '9:00 AM - 5:00 PM',
      weekendHours: 'Closed',
      appointmentProcess: 'Phone',
      parking: false,
      languages: 'Arabic, English',
      internationalServices: false,
      medicalTourism: false,
      translationServices: false,
      amenities: ''
    }));

    // Insert doctors
    await Provider.insertMany(doctorsWithIds);
    console.log(`Successfully inserted ${doctorsWithIds.length} doctors`);

    // Read and process labs data
    const labsData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('/Volumes/MySSD/GP Code/public-fede7a/data/Labs_Egypt.csv')
        .pipe(csv())
        .on('data', (data) => labsData.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const labsWithIds = labsData.map((lab, index) => ({
      id: `LAB${String(index + 1).padStart(3, '0')}`,
      name: lab.Lab_Institution,
      type: 'Lab',
      labSpecialty: lab.Lab_Specialty,
      averageTestFee: parseFloat(lab.Average_Test_Fee) || 0,
      resultProcessingTime: lab.Result_Processing_Time,
      city: 'Cairo',
      address: lab.Branch_Location,
      area: lab.Branch_Location,
      latitude: 30.0444,
      longitude: 31.2357,
      isInNetwork: true,
      rating: parseFloat(lab.Avg_Rate) || 0,
      ratingCount: parseInt(lab.Rate_Count?.replace('From ', '').replace(' Reviews', '')) || 0,
      phone: '',
      email: '',
      website: '',
      facebook: '',
      twitter: '',
      instagram: '',
      specialties: '',
      departments: '',
      emergencyAvailable: false,
      emergencyHours: '',
      icu: false,
      operatingRooms: 0,
      diagnosticServices: '',
      acceptedPlans: 'Standard',
      averageClaimAmount: 0,
      paymentMethods: 'Cash, Insurance',
      accreditation: '',
      bedCount: 0,
      staffCount: 0,
      establishedYear: 0,
      weekdaysHours: '9:00 AM - 5:00 PM',
      weekendHours: 'Closed',
      appointmentProcess: 'Phone',
      parking: false,
      languages: 'Arabic, English',
      internationalServices: false,
      medicalTourism: false,
      translationServices: false,
      amenities: ''
    }));

    // Insert labs
    await Provider.insertMany(labsWithIds);
    console.log(`Successfully inserted ${labsWithIds.length} labs`);

    // Verify the insertion
    const count = await Provider.countDocuments();
    console.log(`Total providers in collection: ${count}`);

    // Log counts by type
    const hospitalCount = await Provider.countDocuments({ type: 'Hospital' });
    const doctorCount = await Provider.countDocuments({ type: 'Doctor' });
    const labCount = await Provider.countDocuments({ type: 'Lab' });
    console.log(`Hospitals: ${hospitalCount}`);
    console.log(`Doctors: ${doctorCount}`);
    console.log(`Labs: ${labCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateProviders(); 