# MedBond API

Health Insurance API with employee health data, wearable tracking, and insurance policy management.

## Project Structure

```
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middlewares/      # Express middlewares
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── models/               # MongoDB schemas and models
├── scripts/              # Utility scripts
├── .env                  # Environment variables
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   ```
4. Start the server:
   ```
   npm start
   ```
   
## Development

Run the server in development mode with automatic restart:
```
npm run dev
```

## Testing

Test the MongoDB connection:
```
npm run test-connection
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy to Vercel:
   ```
   vercel
   ```

4. For production deployment:
   ```
   vercel --prod
   ```

### Environment Variables

Make sure to set these environment variables in your Vercel project settings:

- `MONGODB_URI`: Your MongoDB connection string
- `NODE_ENV`: Set to `production` for production deployments

## API Endpoints

### Root
- `GET /` - API status
- `GET /api` - API information
- `GET /health` - Health check with MongoDB status

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID (supports employeeId, Policy_ID, or _id)
- `POST /api/employees` - Create a new employee
- `PUT /api/employees/:id` - Update an employee
- `DELETE /api/employees/:id` - Delete an employee

### Health Data
- `GET /api/health` - Get all health data
- `GET /api/health/employee/:employeeId` - Get health data by employee ID
- `POST /api/health` - Create health data
- `PUT /api/health/:id` - Update health data
- `DELETE /api/health/:id` - Delete health data

### Sleep Data
- `GET /api/sleep` - Get all sleep data
- `GET /api/sleep/employee/:employeeId` - Get sleep data by employee ID
- `POST /api/sleep` - Create sleep data
- `PUT /api/sleep/:id` - Update sleep data
- `DELETE /api/sleep/:id` - Delete sleep data

### Wearable Data
- `GET /api/wearables` - Get all wearable data
- `GET /api/wearables/employee/:employeeId` - Get wearable data by employee ID
- `POST /api/wearables` - Create wearable data
- `PUT /api/wearables/:id` - Update wearable data
- `DELETE /api/wearables/:id` - Delete wearable data

### Providers
- `GET /api/providers` - Get all healthcare providers
- `GET /api/providers/:id` - Get provider by ID
- `GET /api/providers/specialty/:specialty` - Get providers by specialty
- `POST /api/providers` - Create a new provider
- `POST /api/providers/:id/reviews` - Add a review for a provider
- `GET /api/providers/:id/reviews` - Get provider reviews

### Analytics
- `GET /api/analytics/employee/:id` - Get analytics for a specific employee
- `GET /api/analytics/organization` - Get organization-wide analytics
- `GET /api/analytics/alerts` - Get health alerts
- `GET /api/analytics/all-data` - Get all analytics data

### Policies
- `GET /api/policies` - Get all policies
- `GET /api/policies/:id` - Get policy by ID
- `POST /api/policies` - Create a new policy
- `PUT /api/policies/:id` - Update a policy
- `DELETE /api/policies/:id` - Delete a policy

### Claims
- `GET /api/claims` - Get all claims
- `GET /api/claims/:id` - Get claim by ID
- `GET /api/claims/employee/:employeeId` - Get claims by employee ID
- `POST /api/claims` - Create a new claim
- `PUT /api/claims/:id` - Update a claim
- `DELETE /api/claims/:id` - Delete a claim

### Complaints
- `GET /api/complaints` - Get all complaints
- `GET /api/complaints/:id` - Get complaint by ID
- `POST /api/complaints` - Create a new complaint
- `PUT /api/complaints/:id` - Update a complaint
- `DELETE /api/complaints/:id` - Delete a complaint

## Features

- Direct MongoDB connection with models aligned to actual database structure
- RESTful endpoints to retrieve health-related data
- Health check endpoint to verify database connectivity

## MongoDB Data Model

The MongoDB database contains the following collections:

### Core Collections (with data):
- **employees** (238 records): Employee information including demographics, health metrics, policy details, and scores
- **healthdatas** (238 records): Health metrics with scores and policy information
- **sleepdatas** (30 records): Sleep tracking data including quality, duration, and heart rate
- **wearabledatas** (22 records): Wearable device data with various health and activity metrics
- **doctors** (775 records): Medical professionals with specialization, fees, and ratings
- **claims** (1314 records): Insurance claims with details about patients, providers, and procedures
- **feedbacks** (3 records): User feedback with ratings and status
- **predictions** (4 records): Health prediction data with confidence scores

### Supporting Collections:
- **attachments** (3 records): References to uploaded files
- **policydocuments** (6 records): Documents related to insurance policies
- **uploads.files** & **uploads.chunks** (10 records each): GridFS storage for uploaded files

### Empty Collections:
- **reviews** (0 records): Structure for provider reviews
- **policies** (0 records): Policy information structure
- **providers** (0 records): Provider information structure
- **complainttickets** (0 records): Structure for handling complaints

## Running the API

1. Make sure MongoDB connection string is set in the `.env` file
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```
   
4. For testing the MongoDB connection:
   ```
   npm run test-connection
   ```

## Available Endpoints

### Core Endpoints
- `GET /` - Root endpoint that confirms API is running
- `GET /api` - Lists all available API endpoints
- `GET /health` - Health check endpoint that shows MongoDB connection status

### Employee Data
- `GET /employees` - List all employees (limited to 10)
- `GET /employees/:id` - Get a specific employee by ID, Policy_ID, or MongoDB ObjectId

### Health Data
- `GET /health` - List health data records (limited to 10)
- `GET /health/employee/:employeeId` - Get health data for a specific employee

### Sleep Data
- `GET /sleep` - List sleep data records (limited to 10)
- `GET /sleep/employee/:employeeId` - Get sleep data for a specific employee

### Wearable Data
- `GET /wearables` - List wearable data records (limited to 10)
- `GET /wearables/employee/:employeeId` - Get wearable data for a specific employee

### Other Data
- `GET /doctors` - List doctors (limited to 10)
- `GET /claims` - List claims (limited to 10)
- `GET /feedback` - List feedback (limited to 10)
- `GET /predictions` - List predictions (limited to 10)

## Sample Data

### Employee Data Sample
```json
{
  "_id": "680b5bf8188b32ebb3c4cf7f",
  "Age": "27",
  "Gender": "Male",
  "Weight_kg": "69.2",
  "Height_cm": "186.4",
  "BMI": "19.92",
  "Chronic_Disease": "Chronic Kidney Disease",
  "Policy_ID": "593d038e-8268-483c-803b-f9d6c37cb69d",
  "employeeId": "8f7b7927-6c04-401a-ab0b-61000132f970"
}
```

### Health Data Sample
```json
{
  "employee": "8f7b7927-6c04-401a-ab0b-61000132f970",
  "weight": 69.2,
  "height": 186.4,
  "bmi": 19.92,
  "hemoglobin": 15.3,
  "cholesterol": 175,
  "bloodSugar": 135,
  "chronicDisease": "Chronic Kidney Disease",
  "wellnessScore": 0.75
}
```

### Sleep Data Sample
```json
{
  "employee": "8f7b7927-6c04-401a-ab0b-61000132f970",
  "startTime": "2025-08-02T19:57:49.000Z",
  "endTime": "2025-08-02T04:30:13.000Z",
  "sleepQuality": 100,
  "timeInBed": 512,
  "heartRate": 59
}
```

### Wearable Data Sample
```json
{
  "employee": "8f7b7927-6c04-401a-ab0b-61000132f970",
  "date": "2025-08-01T21:00:00.000Z",
  "heartRateAvg": 78.32,
  "stepCount": 1232,
  "walkingRunningDistance": 0.923
}
``` 