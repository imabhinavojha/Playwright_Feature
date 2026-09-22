const { test, expect } = require('@playwright/test');

// GraphQL API endpoint - Using a public GraphQL API for testing
// You can replace this with your own GraphQL endpoint
const GRAPHQL_URL = 'https://countries.trevorblades.com/graphql';

test.describe('GraphQL API Testing', () => {
  
  test('10.2 GraphQL query - Basic query with variables', async ({ request }) => {
    const query = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
          posts {
            title
          }
        }
      }
    `;

    // Note: This is a template example. For actual testing, use a real GraphQL endpoint
    // Using Countries API as an alternative example
    const countriesQuery = `
      query GetCountry($code: ID!) {
        country(code: $code) {
          code
          name
          capital
          currency
          languages {
            name
          }
        }
      }
    `;

    const response = await request.post(GRAPHQL_URL, {
      data: {
        query: countriesQuery,
        variables: { code: 'US' }
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    
    // Verify response structure
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('country');
    expect(result.data.country).toHaveProperty('name');
    expect(result.data.country).toHaveProperty('code', 'US');
    expect(result.data.country.languages).toBeInstanceOf(Array);
  });

  test('GraphQL query - Simple query without variables', async ({ request }) => {
    const query = `
      query {
        countries {
          code
          name
        }
      }
    `;

    const response = await request.post(GRAPHQL_URL, {
      data: {
        query
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('countries');
    expect(Array.isArray(result.data.countries)).toBeTruthy();
    expect(result.data.countries.length).toBeGreaterThan(0);
    
    // Verify structure of first country
    expect(result.data.countries[0]).toHaveProperty('code');
    expect(result.data.countries[0]).toHaveProperty('name');
  });

  test('GraphQL query - Nested query with multiple levels', async ({ request }) => {
    const query = `
      query GetCountryDetails($code: ID!) {
        country(code: $code) {
          code
          name
          capital
          currency
          languages {
            code
            name
          }
          continent {
            code
            name
          }
        }
      }
    `;

    const response = await request.post(GRAPHQL_URL, {
      data: {
        query,
        variables: { code: 'IN' }
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    
    expect(result.data.country.name).toBeTruthy();
    expect(result.data.country.continent).toHaveProperty('name');
    expect(result.data.country.languages.length).toBeGreaterThan(0);
  });

  test('GraphQL query - Query with aliases', async ({ request }) => {
    const query = `
      query GetMultipleCountries {
        usa: country(code: "US") {
          name
          capital
        }
        india: country(code: "IN") {
          name
          capital
        }
        uk: country(code: "GB") {
          name
          capital
        }
      }
    `;

    const response = await request.post(GRAPHQL_URL, {
      data: { query },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    
    expect(result.data).toHaveProperty('usa');
    expect(result.data).toHaveProperty('india');
    expect(result.data).toHaveProperty('uk');
    
    expect(result.data.usa.name).toBe('United States');
    expect(result.data.india.name).toBe('India');
    expect(result.data.uk.name).toBe('United Kingdom');
  });

  test('GraphQL query - Query with fragments', async ({ request }) => {
    const query = `
      fragment CountryInfo on Country {
        code
        name
        capital
        currency
      }
      
      query GetCountriesWithFragment {
        country1: country(code: "US") {
          ...CountryInfo
        }
        country2: country(code: "IN") {
          ...CountryInfo
        }
      }
    `;

    const response = await request.post(GRAPHQL_URL, {
      data: { query },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    
    expect(result.data.country1).toHaveProperty('code', 'US');
    expect(result.data.country1).toHaveProperty('name');
    expect(result.data.country2).toHaveProperty('code', 'IN');
    expect(result.data.country2).toHaveProperty('name');
  });

  test('GraphQL mutation - Create operation example', async ({ request }) => {
    // Note: This is a template for mutation. 
    // Most public GraphQL APIs are read-only, so this demonstrates the pattern
    const mutation = `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          name
          email
          createdAt
        }
      }
    `;

    // Example mutation payload (would work with a real mutation endpoint)
    const mutationData = {
      query: mutation,
      variables: {
        input: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    };

    // For demonstration, we'll show the structure
    // In real scenarios, replace with actual mutation endpoint
    console.log('Mutation example structure:', JSON.stringify(mutationData, null, 2));
    
    // This would be the actual request (commented out as it requires a real mutation endpoint)
    /*
    const response = await request.post('YOUR_GRAPHQL_ENDPOINT', {
      data: mutationData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN' // If authentication required
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.data.createUser).toHaveProperty('id');
    expect(result.data.createUser.name).toBe('John Doe');
    */
  });

  test('GraphQL query - Error handling', async ({ request }) => {
    const invalidQuery = `
      query GetInvalidData {
        invalidField {
          id
        }
      }
    `;

    const response = await request.post(GRAPHQL_URL, {
      data: {
        query: invalidQuery
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200); // GraphQL returns 200 even for errors
    const result = await response.json();
    
    // GraphQL errors are in the errors array, not as HTTP errors
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.errors)).toBeTruthy();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('GraphQL query - Invalid variable type', async ({ request }) => {
    const query = `
      query GetCountry($code: ID!) {
        country(code: $code) {
          name
        }
      }
    `;

    // Passing wrong variable type
    const response = await request.post(GRAPHQL_URL, {
      data: {
        query,
        variables: { code: 123 } // Should be string, not number
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    // May return error or coerce the value
    if (result.errors) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  test('GraphQL query - Multiple queries in sequence', async ({ request }) => {
    // First query: Get country list
    const countriesQuery = `
      query {
        countries {
          code
          name
        }
      }
    `;

    const countriesResponse = await request.post(GRAPHQL_URL, {
      data: { query: countriesQuery },
      headers: { 'Content-Type': 'application/json' }
    });

    expect(countriesResponse.status()).toBe(200);
    const countriesResult = await countriesResponse.json();
    const firstCountryCode = countriesResult.data.countries[0].code;

    // Second query: Get details of first country
    const countryDetailsQuery = `
      query GetCountryDetails($code: ID!) {
        country(code: $code) {
          code
          name
          capital
          currency
        }
      }
    `;

    const detailsResponse = await request.post(GRAPHQL_URL, {
      data: {
        query: countryDetailsQuery,
        variables: { code: firstCountryCode }
      },
      headers: { 'Content-Type': 'application/json' }
    });

    expect(detailsResponse.status()).toBe(200);
    const detailsResult = await detailsResponse.json();
    expect(detailsResult.data.country.code).toBe(firstCountryCode);
  });

  test('GraphQL query - With custom headers and authentication', async ({ request }) => {
    const query = `
      query {
        countries {
          code
          name
        }
      }
    `;

    const response = await request.post(GRAPHQL_URL, {
      data: { query },
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'test-value',
        // 'Authorization': 'Bearer YOUR_TOKEN' // Uncomment if auth required
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.data).toBeDefined();
  });

  test('GraphQL query - Response time and performance', async ({ request }) => {
    const query = `
      query {
        countries {
          code
          name
          capital
          currency
          languages {
            name
          }
        }
      }
    `;

    const startTime = Date.now();
    const response = await request.post(GRAPHQL_URL, {
      data: { query },
      headers: { 'Content-Type': 'application/json' }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    
    const result = await response.json();
    expect(result.data.countries.length).toBeGreaterThan(0);
  });

  test('GraphQL query - Validate response structure', async ({ request }) => {
    const query = `
      query GetCountry($code: ID!) {
        country(code: $code) {
          code
          name
          capital
          currency
          languages {
            code
            name
          }
        }
      }
    `;

    const response = await request.post(GRAPHQL_URL, {
      data: {
        query,
        variables: { code: 'CA' }
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    
    // Validate complete response structure
    expect(result).toMatchObject({
      data: {
        country: {
          code: expect.any(String),
          name: expect.any(String),
          capital: expect.any(String),
          currency: expect.any(String),
          languages: expect.any(Array)
        }
      }
    });
    
    // Validate languages array structure
    if (result.data.country.languages.length > 0) {
      expect(result.data.country.languages[0]).toHaveProperty('code');
      expect(result.data.country.languages[0]).toHaveProperty('name');
    }
  });

  test('GraphQL query - Using GET method (if supported)', async ({ request }) => {
    // Some GraphQL endpoints support GET requests
    const query = `
      query {
        countries {
          code
          name
        }
      }
    `;

    // URL encode the query for GET request
    const encodedQuery = encodeURIComponent(query);
    
    // Note: This endpoint may not support GET, but demonstrates the pattern
    try {
      const response = await request.get(`${GRAPHQL_URL}?query=${encodedQuery}`);
      
      if (response.status() === 200) {
        const result = await response.json();
        expect(result.data).toBeDefined();
      }
    } catch (error) {
      // GET may not be supported, which is fine
      console.log('GET method not supported, using POST is standard');
    }
  });

  test('GraphQL query - Batch queries', async ({ request }) => {
    // Some GraphQL servers support batch queries
    const queries = [
      {
        query: `
          query {
            country(code: "US") {
              name
            }
          }
        `
      },
      {
        query: `
          query {
            country(code: "IN") {
              name
            }
          }
        `
      }
    ];

    // Note: Batch support depends on the GraphQL server
    // This demonstrates the pattern
    const response = await request.post(GRAPHQL_URL, {
      data: queries,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Response may be array of results or single result
    const result = await response.json();
    
    if (Array.isArray(result)) {
      expect(result.length).toBe(2);
      expect(result[0].data).toBeDefined();
      expect(result[1].data).toBeDefined();
    } else {
      // Single query response
      expect(result.data).toBeDefined();
    }
  });
});

