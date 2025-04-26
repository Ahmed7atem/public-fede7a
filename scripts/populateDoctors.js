const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const iconv = require('iconv-lite');

// MongoDB Atlas connection string
const uri = 'mongodb+srv://ahmedhatem:Rk23610359@cluster0.wz0tern.mongodb.net/health_prediction?retryWrites=true&w=majority';
const client = new MongoClient(uri);

async function run() {
  try {
    // Step 1: Read and parse the CSV file
    console.log('Reading and parsing CSV file...');
    const csvData = [];
    const uniqueRecords = new Set();
    let totalRows = 0;
    let duplicateCount = 0;
    let unknownSpecializationRows = [];

    const csvFilePath = path.join(__dirname, '..', 'data', 'Egyptian Doctors Data.csv');
    console.log(`Reading CSV from: ${csvFilePath}`);

    // Verify file exists
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found at ${csvFilePath}`);
    }

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(iconv.decodeStream('utf8'))
        .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
        .on('columns', (columns) => {
          console.log('CSV Headers:', columns);
          if (!columns.includes('specialization')) {
            console.error('Error: "specialization" column not found in CSV headers');
          }
        })
        .on('data', (row) => {
          totalRows++;
          // Log raw row for debugging (first 5 rows and any with missing specialization)
          if (totalRows <= 5 || !row.specialization) {
            console.log(`Raw row ${totalRows}:`, row);
          }

          // Create a unique key for the row to identify duplicates
          const rowKey = `${row.specialization || ''}|${row.fees || ''}|${row.avg_rate || ''}|${row.waiting_time || ''}|${row.clinic_location || ''}|${row.rate_count || ''}`;
          if (!uniqueRecords.has(rowKey)) {
            uniqueRecords.add(rowKey);

            // Clean and transform the data
            const specialization = row.specialization && row.specialization.trim() !== '' ? row.specialization.trim() : 'unknown';
            const fees = row.fees && row.fees.trim() !== '' ? row.fees.trim() : 'unknown';
            const avg_rate = row.avg_rate && row.avg_rate.trim() !== '' ? parseFloat(row.avg_rate.trim()) : null;
            const waiting_time = row.waiting_time && row.waiting_time.trim() !== 'null' ? row.waiting_time.trim() : 'unknown';
            const clinic_location = row.clinic_location && row.clinic_location.trim() !== '' ? row.clinic_location.trim() : 'unknown';
            let rate_count = null;
            if (row.rate_count && row.rate_count.trim() !== 'null') {
              const match = row.rate_count.match(/From (\d+) Visitors/);
              rate_count = match ? parseInt(match[1]) : null;
            }

            // Track rows where specialization is set to "unknown"
            if (specialization === 'unknown') {
              unknownSpecializationRows.push({ rowNumber: totalRows, rawRow: row });
            }

            csvData.push({
              specialization,
              fees,
              avg_rate,
              waiting_time,
              clinic_location,
              rate_count
            });
          } else {
            duplicateCount++;
          }
        })
        .on('end', () => {
          console.log(`Total rows in CSV: ${totalRows}`);
          console.log(`Duplicates found: ${duplicateCount}`);
          console.log(`Parsed ${csvData.length} unique rows from CSV`);

          // Log rows where specialization was set to "unknown"
          if (unknownSpecializationRows.length > 0) {
            console.log('\nRows with specialization set to "unknown":');
            unknownSpecializationRows.forEach(({ rowNumber, rawRow }) => {
              console.log(`Row ${rowNumber}:`, rawRow);
            });
          } else {
            console.log('\nNo rows had specialization set to "unknown".');
          }

          // Log a sample of the parsed data
          console.log('\nSample of parsed CSV data (first 5 rows):');
          csvData.slice(0, 5).forEach((row, index) => {
            console.log(`Row ${index + 1}:`, row);
          });
          resolve();
        })
        .on('error', (err) => reject(err));
    });

    // Step 2: Connect to MongoDB Atlas
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    const db = client.db('health_prediction');
    const collection = db.collection('doctors');

    // Step 3: Delete all existing documents
    const deleteResult = await collection.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing documents from the doctors collection`);

    // Step 4: Insert the new documents in batches
    console.log(`Preparing to insert ${csvData.length} documents...`);
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      try {
        const insertResult = await collection.insertMany(batch, { ordered: false });
        totalInserted += insertResult.insertedCount;
        console.log(`Inserted batch ${i / batchSize + 1}: ${insertResult.insertedCount} documents`);
      } catch (err) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, err);
      }
    }

    console.log(`Total documents inserted: ${totalInserted}`);

    // Step 5: Verify the inserted documents
    const sampleDoctors = await collection.find({}, { projection: { _id: 0 } }).limit(5).toArray();
    console.log('\nSample of inserted doctors (first 5):');
    sampleDoctors.forEach(doc => {
      console.log(doc);
    });

    // Verify the total number of documents
    const totalCount = await collection.countDocuments();
    console.log(`\nTotal documents in doctors collection: ${totalCount}`);

    // Check for documents with "unknown" specialization
    const unknownCount = await collection.countDocuments({ specialization: 'unknown' });
    console.log(`\nDocuments with specialization "unknown": ${unknownCount}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

run().catch(console.dir); 