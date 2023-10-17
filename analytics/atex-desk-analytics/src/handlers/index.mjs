import getAnalyticsData from 'analytics-helper';
import s3fileUploader from 's3-helper';

const getFormattedDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`;  
}

const uploadResultInS3 = async (response, s3_destination, filename) => {
  const s3Bucket = s3_destination.split('/')[0];
  
  const s3Key = s3_destination.split('/')[1] + '/' + filename.split('.')[0] + '_' + getFormattedDate() + '.json';
  await s3fileUploader(s3Bucket, s3Key, JSON.stringify(response, null, 2));
}

const generateSimpleReport = (response) => {
  let result = [];
  response.rows.forEach(row => {
    result.push(
      {
        "ga:pagepath": row.dimensionValues[1].value,
        "ga:dimension9": row.dimensionValues[0].value,
        "ga:date": "" + row.dimensionValues[2].value,
        "ga:dimension1": row.dimensionValues[3].value, 
        "ga:dimension4": row.dimensionValues[4].value, 
        "ga:pageviews": Number(row.metricValues[0].value), 
        "ga:avgTimeOnPage": Number(row.metricValues[1].value), 

      }
    )
  });

  return result;  
}

export const deskAnalytics = async (event) => {
  try {
    let response = await getAnalyticsData(event, './cred.json')()
    
    if(event.format == 'simple') {
      response = generateSimpleReport(response);
    }
  
    await uploadResultInS3(response, event.s3_destination, event.filename);
  
  } catch (error) {
    console.error(error);
  }
};

