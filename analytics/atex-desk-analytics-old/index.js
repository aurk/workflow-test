const { google } = require('googleapis');
const { Storage } = require('@google-cloud/storage');
const { DateTime } = require('luxon');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly'];

function initializeAnalyticsReporting(credentials) {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return google.analyticsreporting({ version: 'v4', auth });
}

async function getReport(analytics, query) {
  const response = await analytics.reports.batchGet({ requestBody: query });
  return response.data;
}

async function getSimpleReport(analytics, query) {
  const report = await getReport(analytics, query);
  const rows = report.reports[0].data.rows;
  const newRows = [];

  for (const row of rows) {
    const newRow = {};

    for (let i = 0; i < row.dimensions.length; i++) {
      newRow[report.reports[0].columnHeader.dimensions[i]] = row.dimensions[i];
    }

    for (let i = 0; i < row.metrics[0].values.length; i++) {
      newRow[report.reports[0].columnHeader.metricHeader.metricHeaderEntries[i].name] =
        row.metrics[0].values[i];
    }

    newRows.push(newRow);
  }

  return newRows;
}

exports.handler = async (event) => {
  const s3Bucket = event.s3_destination.split('/')[0];
  const date = DateTime.now().toFormat('yyyy-MM-dd_HH:mm:ss');
  const s3Key =
    event.s3_destination.split('/')[1] + '/' + event.filename.split('.')[0] + '_' + date + '.json';

  const query = event.query;
  const format = event.format || 'full';
  const credentials = event.ga_credentials;

  const analytics = initializeAnalyticsReporting(credentials);

  let response;

  if (format === 'simple') {
    response = await getSimpleReport(analytics, query);
    response = response.map((row) => JSON.stringify(row)).join(',\n');
  } else {
    response = JSON.stringify(await getReport(analytics, query), null, 2);
  }

  const storage = new Storage();
  const bucket = storage.bucket(s3Bucket);
  const file = bucket.file(s3Key);

  await file.save(Buffer.from(response, 'utf-8'), {
    metadata: { contentType: 'application/json' },
  });

  console.log('File uploaded to S3:', s3Key);

  return {
    statusCode: 200,
    body: 'Success',
  };
};