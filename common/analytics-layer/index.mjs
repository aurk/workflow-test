import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';

const parseDimensionFilter = dimensionFilter => {
    const filterExpressions = [];
    if (dimensionFilter) {
      if(typeof dimensionFilter === 'object') {
        filterExpressions.push(dimensionFilter);
      } else 
      {
        const filters = dimensionFilter.split(",");
        for (const filter of filters) {
          const match = filter.match(/^([^|]+)\|([^|]+)\|(.+)/)
          if (!match) continue
          const fieldName = match[1]
          const matchType = match[2]
          const value = match[3]
          if (fieldName && matchType && value) {
            filterExpressions.push({
              "filter": {
                fieldName,
                "stringFilter": {
                  matchType,
                  value,
                }
              }
            });
          }
        }
      }
    }
    
    return filterExpressions
  }

  const getClient = (credFile) => {
    const auth = new GoogleAuth({
        keyFilename: credFile, //'./atex-desk-analytics/cred.json',
        scopes: 'https://www.googleapis.com/auth/analytics.readonly',
      });
    return new BetaAnalyticsDataClient({ auth });
  }

  const getAnalyticsData =  (event, credFile) => async () => {
    const dimensionFilter = event.dimensionFilter
    const dimensionFilterExclude = event.dimensionFilterExclude
    
    const query = event.query;
    const andGroupExpressions = parseDimensionFilter(dimensionFilter);
    const notExpressions = parseDimensionFilter(dimensionFilterExclude);
    for (const notExpression of notExpressions) {
      andGroupExpressions.push({ notExpression })
    }
    if (andGroupExpressions.length > 0) {
      query.dimensionFilter = {
        "andGroup": {
          "expressions": andGroupExpressions,
        }
      }
    }
    //console.log('QUERY ' + JSON.stringify(query, null, 2))
    // Query for the pageviews
    const [response] = await getClient(credFile).runReport(query);


    return response;

  }

  export default getAnalyticsData;

