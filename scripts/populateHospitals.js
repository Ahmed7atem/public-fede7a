const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Define the Provider schema
const providerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['Hospital', 'Clinic', 'Labs'],
    default: 'Hospital'
  },
  isInNetwork: { type: Boolean, default: true },
  location: {
    city: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    area: String
  },
  contactInfo: {
    phone: [String],
    email: String,
    website: String,
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String
    }
  },
  services: {
    specialties: [String],
    departments: [String],
    emergency: {
      available: Boolean,
      hours: String
    },
    icu: Boolean,
    operatingRooms: Number,
    diagnosticServices: [String]
  },
  insurance: {
    acceptedPlans: [String],
    averageClaimAmount: Number,
    paymentMethods: [String]
  },
  quality: {
    accreditation: String,
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    bedCount: Number,
    staffCount: Number,
    establishedYear: Number
  },
  operations: {
    hours: {
      weekdays: String,
      weekend: String
    },
    emergencyHours: String,
    appointmentProcess: String,
    parking: Boolean
  },
  features: {
    languages: [String],
    internationalServices: Boolean,
    medicalTourism: Boolean,
    translationServices: Boolean,
    amenities: [String]
  }
}, { timestamps: true });

// Create a 2dsphere index for location-based queries
providerSchema.index({ 'location.coordinates': '2dsphere' });

const Provider = mongoose.model('Provider', providerSchema);

// Hospital data with generated information
const hospitals = [
  {
    name: 'Saudi German Hospital Cairo',
    location: {
      city: 'Cairo',
      address: 'Al Hay Al Asher, Nasr City, Cairo',
      coordinates: {
        type: 'Point',
        coordinates: [31.4217, 30.0444] // Cairo coordinates
      },
      area: 'Nasr City'
    },
    contactInfo: {
      phone: ['+20 2 2345 6789', '+20 2 2345 6790'],
      email: 'info@sghcairo.com',
      website: 'www.sghcairo.com',
      socialMedia: {
        facebook: 'SGH.Cairo',
        twitter: '@SGH_Cairo',
        instagram: 'sgh_cairo'
      }
    },
    services: {
      specialties: ['Orthopedics', 'Neurology', 'Cardiology', 'General Surgery'],
      departments: ['Emergency', 'ICU', 'Surgery', 'Radiology'],
      emergency: {
        available: true,
        hours: '24/7'
      },
      icu: true,
      operatingRooms: 8,
      diagnosticServices: ['MRI', 'CT Scan', 'X-Ray', 'Laboratory']
    },
    insurance: {
      acceptedPlans: ['Standard', 'Premium', 'VIP'],
      averageClaimAmount: 5054,
      paymentMethods: ['Cash', 'Credit Card', 'Insurance']
    },
    quality: {
      accreditation: 'JCI Accredited',
      rating: 4.5,
      ratingCount: 1200,
      bedCount: 300,
      staffCount: 500,
      establishedYear: 1988
    },
    operations: {
      hours: {
        weekdays: '24/7',
        weekend: '24/7'
      },
      emergencyHours: '24/7',
      appointmentProcess: 'Online and Phone Booking',
      parking: true
    },
    features: {
      languages: ['Arabic', 'English', 'German'],
      internationalServices: true,
      medicalTourism: true,
      translationServices: true,
      amenities: ['Cafeteria', 'Pharmacy', 'Gift Shop', 'Prayer Room']
    }
  },
  {
    name: 'El Nada Hospital',
    location: {
      city: 'Cairo',
      address: 'Maadi, Cairo',
      coordinates: {
        type: 'Point',
        coordinates: [31.2833, 29.9667] // Maadi coordinates
      },
      area: 'Maadi'
    },
    contactInfo: {
      phone: ['+20 2 2525 6789'],
      email: 'info@elnadahospital.com',
      website: 'www.elnadahospital.com',
      socialMedia: {
        facebook: 'ElNadaHospital',
        twitter: '@ElNadaHospital',
        instagram: 'elnadahospital'
      }
    },
    services: {
      specialties: ['Neurology', 'Internal Medicine', 'Pediatrics'],
      departments: ['Emergency', 'ICU', 'Neurology', 'Pediatrics'],
      emergency: {
        available: true,
        hours: '24/7'
      },
      icu: true,
      operatingRooms: 5,
      diagnosticServices: ['MRI', 'CT Scan', 'X-Ray', 'Laboratory']
    },
    insurance: {
      acceptedPlans: ['Standard', 'Premium'],
      averageClaimAmount: 7818,
      paymentMethods: ['Cash', 'Credit Card', 'Insurance']
    },
    quality: {
      accreditation: 'ISO 9001',
      rating: 4.3,
      ratingCount: 800,
      bedCount: 150,
      staffCount: 300,
      establishedYear: 1995
    },
    operations: {
      hours: {
        weekdays: '24/7',
        weekend: '24/7'
      },
      emergencyHours: '24/7',
      appointmentProcess: 'Phone and Walk-in',
      parking: true
    },
    features: {
      languages: ['Arabic', 'English'],
      internationalServices: true,
      medicalTourism: false,
      translationServices: true,
      amenities: ['Cafeteria', 'Pharmacy']
    }
  },
  {
    name: 'Misr International Hospital',
    location: {
      city: 'Cairo',
      address: 'Cairo-Alexandria Desert Road, Cairo',
      coordinates: {
        type: 'Point',
        coordinates: [31.2167, 30.0833] // Desert Road coordinates
      },
      area: 'Desert Road'
    },
    contactInfo: {
      phone: ['+20 2 3855 5555'],
      email: 'info@mih.com.eg',
      website: 'www.mih.com.eg',
      socialMedia: {
        facebook: 'MIHCairo',
        twitter: '@MIH_Cairo',
        instagram: 'mih_cairo'
      }
    },
    services: {
      specialties: ['Pediatrics', 'Obstetrics', 'Gynecology'],
      departments: ['Emergency', 'ICU', 'Pediatrics', 'Obstetrics'],
      emergency: {
        available: true,
        hours: '24/7'
      },
      icu: true,
      operatingRooms: 6,
      diagnosticServices: ['MRI', 'CT Scan', 'X-Ray', 'Laboratory']
    },
    insurance: {
      acceptedPlans: ['Standard', 'Premium', 'VIP'],
      averageClaimAmount: 4079,
      paymentMethods: ['Cash', 'Credit Card', 'Insurance']
    },
    quality: {
      accreditation: 'JCI Accredited',
      rating: 4.6,
      ratingCount: 1500,
      bedCount: 250,
      staffCount: 400,
      establishedYear: 1987
    },
    operations: {
      hours: {
        weekdays: '24/7',
        weekend: '24/7'
      },
      emergencyHours: '24/7',
      appointmentProcess: 'Online and Phone Booking',
      parking: true
    },
    features: {
      languages: ['Arabic', 'English', 'French'],
      internationalServices: true,
      medicalTourism: true,
      translationServices: true,
      amenities: ['Cafeteria', 'Pharmacy', 'Gift Shop', 'Prayer Room']
    }
  },
  {
    name: 'Andalusia Hospitals',
    location: {
      city: 'Cairo',
      address: 'Maadi, Cairo',
      coordinates: {
        type: 'Point',
        coordinates: [31.2833, 29.9667] // Maadi coordinates
      },
      area: 'Maadi'
    },
    contactInfo: {
      phone: ['+20 2 2524 4444'],
      email: 'info@andalusia.com.eg',
      website: 'www.andalusia.com.eg',
      socialMedia: {
        facebook: 'AndalusiaHospitals',
        twitter: '@AndalusiaHosp',
        instagram: 'andalusia_hospitals'
      }
    },
    services: {
      specialties: ['General Practice', 'Internal Medicine', 'Surgery'],
      departments: ['Emergency', 'ICU', 'Surgery', 'Internal Medicine'],
      emergency: {
        available: true,
        hours: '24/7'
      },
      icu: true,
      operatingRooms: 7,
      diagnosticServices: ['MRI', 'CT Scan', 'X-Ray', 'Laboratory']
    },
    insurance: {
      acceptedPlans: ['Standard', 'Premium'],
      averageClaimAmount: 9980,
      paymentMethods: ['Cash', 'Credit Card', 'Insurance']
    },
    quality: {
      accreditation: 'ISO 9001',
      rating: 4.4,
      ratingCount: 1000,
      bedCount: 200,
      staffCount: 350,
      establishedYear: 1984
    },
    operations: {
      hours: {
        weekdays: '24/7',
        weekend: '24/7'
      },
      emergencyHours: '24/7',
      appointmentProcess: 'Phone and Online Booking',
      parking: true
    },
    features: {
      languages: ['Arabic', 'English'],
      internationalServices: true,
      medicalTourism: false,
      translationServices: true,
      amenities: ['Cafeteria', 'Pharmacy', 'Prayer Room']
    }
  },
  {
    name: 'Ain Shams University Hospital',
    location: {
      city: 'Cairo',
      address: 'Abbassia, Cairo',
      coordinates: {
        type: 'Point',
        coordinates: [31.2833, 30.0667] // Abbassia coordinates
      },
      area: 'Abbassia'
    },
    contactInfo: {
      phone: ['+20 2 2482 1234'],
      email: 'info@asu.edu.eg',
      website: 'www.asu.edu.eg',
      socialMedia: {
        facebook: 'ASUHospital',
        twitter: '@ASU_Hospital',
        instagram: 'asu_hospital'
      }
    },
    services: {
      specialties: ['General Medicine', 'Surgery', 'Pediatrics'],
      departments: ['Emergency', 'ICU', 'Surgery', 'Internal Medicine'],
      emergency: {
        available: true,
        hours: '24/7'
      },
      icu: true,
      operatingRooms: 10,
      diagnosticServices: ['MRI', 'CT Scan', 'X-Ray', 'Laboratory']
    },
    insurance: {
      acceptedPlans: ['Standard', 'University Insurance'],
      averageClaimAmount: 3500,
      paymentMethods: ['Cash', 'Insurance']
    },
    quality: {
      accreditation: 'Ministry of Health',
      rating: 4.2,
      ratingCount: 2000,
      bedCount: 500,
      staffCount: 800,
      establishedYear: 1947
    },
    operations: {
      hours: {
        weekdays: '24/7',
        weekend: '24/7'
      },
      emergencyHours: '24/7',
      appointmentProcess: 'Walk-in and Referral',
      parking: true
    },
    features: {
      languages: ['Arabic', 'English'],
      internationalServices: false,
      medicalTourism: false,
      translationServices: false,
      amenities: ['Cafeteria', 'Pharmacy']
    }
  },
  {
    name: 'Al Mokattam Hospital',
    location: {
      city: 'Cairo',
      address: 'Mokattam, Cairo',
      coordinates: {
        type: 'Point',
        coordinates: [31.3667, 30.0167] // Mokattam coordinates
      },
      area: 'Mokattam'
    },
    contactInfo: {
      phone: ['+20 2 2505 5555'],
      email: 'info@almokattamhospital.com',
      website: 'www.almokattamhospital.com',
      socialMedia: {
        facebook: 'AlMokattamHospital',
        twitter: '@AlMokattamHosp',
        instagram: 'almokattam_hospital'
      }
    },
    services: {
      specialties: ['General Medicine', 'Surgery', 'Orthopedics'],
      departments: ['Emergency', 'ICU', 'Surgery', 'Orthopedics'],
      emergency: {
        available: true,
        hours: '24/7'
      },
      icu: true,
      operatingRooms: 6,
      diagnosticServices: ['MRI', 'CT Scan', 'X-Ray', 'Laboratory']
    },
    insurance: {
      acceptedPlans: ['Standard', 'Premium'],
      averageClaimAmount: 4500,
      paymentMethods: ['Cash', 'Credit Card', 'Insurance']
    },
    quality: {
      accreditation: 'ISO 9001',
      rating: 4.3,
      ratingCount: 900,
      bedCount: 180,
      staffCount: 320,
      establishedYear: 1990
    },
    operations: {
      hours: {
        weekdays: '24/7',
        weekend: '24/7'
      },
      emergencyHours: '24/7',
      appointmentProcess: 'Phone and Walk-in',
      parking: true
    },
    features: {
      languages: ['Arabic', 'English'],
      internationalServices: true,
      medicalTourism: false,
      translationServices: true,
      amenities: ['Cafeteria', 'Pharmacy', 'Prayer Room']
    }
  },
  {
    name: 'As-Salam International Hospital',
    location: {
      city: 'Cairo',
      address: 'Maadi, Cairo',
      coordinates: {
        type: 'Point',
        coordinates: [31.2833, 29.9667] // Maadi coordinates
      },
      area: 'Maadi'
    },
    contactInfo: {
      phone: ['+20 2 2524 1234'],
      email: 'info@assalamhospital.com',
      website: 'www.assalamhospital.com',
      socialMedia: {
        facebook: 'AssalamHospital',
        twitter: '@AssalamHospital',
        instagram: 'assalam_hospital'
      }
    },
    services: {
      specialties: ['General Medicine', 'Surgery', 'Cardiology'],
      departments: ['Emergency', 'ICU', 'Surgery', 'Cardiology'],
      emergency: {
        available: true,
        hours: '24/7'
      },
      icu: true,
      operatingRooms: 5,
      diagnosticServices: ['MRI', 'CT Scan', 'X-Ray', 'Laboratory']
    },
    insurance: {
      acceptedPlans: ['Standard', 'Premium'],
      averageClaimAmount: 6000,
      paymentMethods: ['Cash', 'Credit Card', 'Insurance']
    },
    quality: {
      accreditation: 'ISO 9001',
      rating: 4.4,
      ratingCount: 1100,
      bedCount: 160,
      staffCount: 280,
      establishedYear: 1992
    },
    operations: {
      hours: {
        weekdays: '24/7',
        weekend: '24/7'
      },
      emergencyHours: '24/7',
      appointmentProcess: 'Phone and Online Booking',
      parking: true
    },
    features: {
      languages: ['Arabic', 'English'],
      internationalServices: true,
      medicalTourism: false,
      translationServices: true,
      amenities: ['Cafeteria', 'Pharmacy', 'Prayer Room']
    }
  },
  {
    name: 'Cleopatra Hospital',
    location: {
      city: 'Cairo',
      address: 'Heliopolis, Cairo',
      coordinates: {
        type: 'Point',
        coordinates: [31.3333, 30.1000] // Heliopolis coordinates
      },
      area: 'Heliopolis'
    },
    contactInfo: {
      phone: ['+20 2 2415 5555'],
      email: 'info@cleopatrahospital.com',
      website: 'www.cleopatrahospital.com',
      socialMedia: {
        facebook: 'CleopatraHospital',
        twitter: '@CleopatraHosp',
        instagram: 'cleopatra_hospital'
      }
    },
    services: {
      specialties: ['General Medicine', 'Surgery', 'Obstetrics'],
      departments: ['Emergency', 'ICU', 'Surgery', 'Obstetrics'],
      emergency: {
        available: true,
        hours: '24/7'
      },
      icu: true,
      operatingRooms: 6,
      diagnosticServices: ['MRI', 'CT Scan', 'X-Ray', 'Laboratory']
    },
    insurance: {
      acceptedPlans: ['Standard', 'Premium'],
      averageClaimAmount: 5500,
      paymentMethods: ['Cash', 'Credit Card', 'Insurance']
    },
    quality: {
      accreditation: 'ISO 9001',
      rating: 4.3,
      ratingCount: 950,
      bedCount: 170,
      staffCount: 300,
      establishedYear: 1985
    },
    operations: {
      hours: {
        weekdays: '24/7',
        weekend: '24/7'
      },
      emergencyHours: '24/7',
      appointmentProcess: 'Phone and Walk-in',
      parking: true
    },
    features: {
      languages: ['Arabic', 'English'],
      internationalServices: true,
      medicalTourism: false,
      translationServices: true,
      amenities: ['Cafeteria', 'Pharmacy', 'Prayer Room']
    }
  },
  {
    name: 'Dar Al Fouad Hospital',
    location: {
      city: 'Cairo',
      address: '6th of October City, Cairo',
      coordinates: {
        type: 'Point',
        coordinates: [30.9667, 29.9667] // 6th of October City coordinates
      },
      area: '6th of October City'
    },
    contactInfo: {
      phone: ['+20 2 3833 3333'],
      email: 'info@daralfouad.org',
      website: 'www.daralfouad.org',
      socialMedia: {
        facebook: 'DarAlFouadHospital',
        twitter: '@DarAlFouadHosp',
        instagram: 'daralfouad_hospital'
      }
    },
    services: {
      specialties: ['Cardiology', 'Oncology', 'Transplant'],
      departments: ['Emergency', 'ICU', 'Cardiology', 'Oncology'],
      emergency: {
        available: true,
        hours: '24/7'
      },
      icu: true,
      operatingRooms: 8,
      diagnosticServices: ['MRI', 'CT Scan', 'X-Ray', 'Laboratory']
    },
    insurance: {
      acceptedPlans: ['Standard', 'Premium', 'VIP'],
      averageClaimAmount: 8500,
      paymentMethods: ['Cash', 'Credit Card', 'Insurance']
    },
    quality: {
      accreditation: 'JCI Accredited',
      rating: 4.7,
      ratingCount: 1300,
      bedCount: 220,
      staffCount: 400,
      establishedYear: 1999
    },
    operations: {
      hours: {
        weekdays: '24/7',
        weekend: '24/7'
      },
      emergencyHours: '24/7',
      appointmentProcess: 'Online and Phone Booking',
      parking: true
    },
    features: {
      languages: ['Arabic', 'English', 'French'],
      internationalServices: true,
      medicalTourism: true,
      translationServices: true,
      amenities: ['Cafeteria', 'Pharmacy', 'Gift Shop', 'Prayer Room']
    }
  },
  {
    name: 'Egypt Air Hospital',
    location: {
      city: 'Cairo',
      address: 'Cairo International Airport, Cairo',
      coordinates: {
        type: 'Point',
        coordinates: [31.4000, 30.1167] // Airport coordinates
      },
      area: 'Airport Area'
    },
    contactInfo: {
      phone: ['+20 2 2265 4321'],
      email: 'info@egyptairhospital.com',
      website: 'www.egyptairhospital.com',
      socialMedia: {
        facebook: 'EgyptAirHospital',
        twitter: '@EgyptAirHospital',
        instagram: 'egyptair_hospital'
      }
    },
    services: {
      specialties: ['Aviation Medicine', 'General Medicine', 'Emergency'],
      departments: ['Emergency', 'ICU', 'Aviation Medicine', 'General Medicine'],
      emergency: {
        available: true,
        hours: '24/7'
      },
      icu: true,
      operatingRooms: 4,
      diagnosticServices: ['MRI', 'CT Scan', 'X-Ray', 'Laboratory']
    },
    insurance: {
      acceptedPlans: ['Standard', 'Egypt Air Insurance'],
      averageClaimAmount: 4000,
      paymentMethods: ['Cash', 'Credit Card', 'Insurance']
    },
    quality: {
      accreditation: 'ISO 9001',
      rating: 4.2,
      ratingCount: 700,
      bedCount: 120,
      staffCount: 250,
      establishedYear: 1975
    },
    operations: {
      hours: {
        weekdays: '24/7',
        weekend: '24/7'
      },
      emergencyHours: '24/7',
      appointmentProcess: 'Phone and Walk-in',
      parking: true
    },
    features: {
      languages: ['Arabic', 'English'],
      internationalServices: true,
      medicalTourism: false,
      translationServices: true,
      amenities: ['Cafeteria', 'Pharmacy']
    }
  }
];

async function populateHospitals() {
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
      id: `HOSP${String(index + 1).padStart(3, '0')}`
    }));

    // Insert hospitals
    await Provider.insertMany(hospitalsWithIds);
    console.log(`Successfully inserted ${hospitalsWithIds.length} hospitals`);

    // Verify the insertion
    const count = await Provider.countDocuments();
    console.log(`Total providers in collection: ${count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateHospitals(); 