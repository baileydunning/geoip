import fs from 'fs';
import csv from 'csv-parser';

const inputFile = '/Users/bailey/Desktop/IP2LOCATION-LITE-DB11.IPV6.CSV'; // Update path as needed
const outputCsvFile = '/Users/bailey/Desktop/geoip_output_filtered.csv';

console.log('Starting CSV filter and conversion...');
const output = fs.createWriteStream(outputCsvFile);
output.write('ipFrom,ipTo,countryCode,countryName,regionName,cityName,latitude,longitude,zipCode,timeZone\n');
let rowCount = 0;
let writtenCount = 0;

fs.createReadStream(inputFile)
  .pipe(csv({ headers: false }))
  .on('data', (row) => {
    rowCount++;
    const record = {
      ipFrom: row[0],
      ipTo: row[1],
      countryCode: row[2],
      countryName: row[3],
      regionName: row[4],
      cityName: row[5],
      latitude: Number.parseFloat(row[6]),
      longitude: Number.parseFloat(row[7]),
      zipCode: row[8],
      timeZone: row[9],
    };
    // Filter out records with placeholder or missing data
    const isPlaceholder =
      record.countryCode === '-' &&
      record.countryName === '-' &&
      record.regionName === '-' &&
      record.cityName === '-' &&
      record.latitude === 0 &&
      record.longitude === 0 &&
      record.zipCode === '-' &&
      record.timeZone === '-';
    if (isPlaceholder) return;
    output.write(
      `${record.ipFrom},${record.ipTo},"${record.countryCode}","${record.countryName}","${record.regionName}","${record.cityName}",${record.latitude},${record.longitude},"${record.zipCode}","${record.timeZone}"\n`
    );
    writtenCount++;
    if (rowCount <= 5) {
      console.log(`Row ${rowCount}:`, record);
    } else if (rowCount === 6) {
      console.log('...');
    }
    if (rowCount % 10000 === 0) {
      console.log(`Processed ${rowCount} rows...`);
    }
  })
  .on('end', () => {
    output.end();
    console.log(`Finished reading CSV. Total rows: ${rowCount}`);
    console.log(`Filtered CSV written to ${outputCsvFile} with ${writtenCount} records.`);
    console.log('Conversion complete!');
  });