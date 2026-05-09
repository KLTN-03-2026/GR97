# Penetration Testing Suite - HealthyAI

## Automated Security Testing Script

This script performs automated penetration testing on the HealthyAI platform to identify common vulnerabilities.

```javascript
// penetration-test.js
import axios from 'axios';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

class PenetrationTester {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 10000,
      validateStatus: () => true, // Don't throw on error status
    });
  }

  async runTests() {
    console.log('🚀 Starting Penetration Testing Suite for HealthyAI\n');

    const results = {
      authentication: await this.testAuthentication(),
      authorization: await this.testAuthorization(),
      inputValidation: await this.testInputValidation(),
      rateLimiting: await this.testRateLimiting(),
      cors: await this.testCORS(),
      fileUpload: await this.testFileUpload(),
    };

    this.generateReport(results);
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication...');

    const tests = [
      // SQL Injection attempts
      { name: 'SQL Injection - Login', payload: { identifier: "admin' OR '1'='1", password: 'password' } },
      { name: 'SQL Injection - Register', payload: { fullName: 'Test', email: "test@example.com'--", password: 'Password123!', phone: '0123456789' } },

      // Weak passwords
      { name: 'Weak Password', payload: { identifier: 'test@example.com', password: '123456' } },

      // JWT manipulation
      { name: 'JWT Manipulation', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.manipulated' },

      // Brute force simulation
      { name: 'Brute Force Simulation', attempts: 15 }
    ];

    const results = [];

    for (const test of tests) {
      try {
        let response;
        if (test.name.includes('Login')) {
          response = await this.client.post('/auth/login', test.payload);
        } else if (test.name.includes('Register')) {
          response = await this.client.post('/auth/register', test.payload);
        } else if (test.name === 'JWT Manipulation') {
          response = await this.client.get('/users/profile', {
            headers: { Authorization: `Bearer ${test.token}` }
          });
        } else if (test.name === 'Brute Force Simulation') {
          // Simulate multiple login attempts
          const promises = [];
          for (let i = 0; i < test.attempts; i++) {
            promises.push(this.client.post('/auth/login', {
              identifier: 'test@example.com',
              password: 'wrongpassword'
            }));
          }
          const responses = await Promise.all(promises);
          response = responses[responses.length - 1]; // Check last response
        }

        results.push({
          test: test.name,
          status: response.status,
          success: response.status < 400,
          message: response.data?.message || 'No message'
        });

      } catch (error) {
        results.push({
          test: test.name,
          status: 'ERROR',
          success: false,
          message: error.message
        });
      }
    }

    return results;
  }

  async testAuthorization() {
    console.log('🔒 Testing Authorization...');

    // First get a valid token
    const loginResponse = await this.client.post('/auth/login', {
      identifier: 'patient@example.com', // Use test user
      password: 'TestPassword123!'
    });

    const token = loginResponse.data?.token;
    const results = [];

    if (!token) {
      return [{ test: 'Get Auth Token', success: false, message: 'Cannot obtain valid token' }];
    }

    const authTests = [
      { endpoint: '/admin/doctors', method: 'GET', role: 'patient', shouldFail: true },
      { endpoint: '/doctor-portal/appointments', method: 'GET', role: 'patient', shouldFail: true },
      { endpoint: '/users/profile', method: 'GET', role: 'patient', shouldFail: false },
    ];

    for (const test of authTests) {
      try {
        const response = await this.client.request({
          url: test.endpoint,
          method: test.method,
          headers: { Authorization: `Bearer ${token}` }
        });

        const success = test.shouldFail ? response.status >= 400 : response.status < 400;

        results.push({
          test: `${test.method} ${test.endpoint} (${test.role})`,
          status: response.status,
          success,
          message: response.data?.message || 'OK'
        });

      } catch (error) {
        results.push({
          test: `${test.method} ${test.endpoint} (${test.role})`,
          status: 'ERROR',
          success: false,
          message: error.message
        });
      }
    }

    return results;
  }

  async testInputValidation() {
    console.log('📝 Testing Input Validation...');

    const tests = [
      // Oversized payloads
      { name: 'Oversized JSON', payload: { message: 'x'.repeat(10000) } },
      { name: 'Invalid JSON Structure', payload: '{"invalid": json' },
      { name: 'XSS Payload', payload: { message: '<script>alert("xss")</script>' } },
      { name: 'Path Traversal', payload: { filePath: '../../../etc/passwd' } },
    ];

    const results = [];

    for (const test of tests) {
      try {
        const response = await this.client.post('/chat/support', test.payload, {
          headers: { Authorization: `Bearer ${this.getTestToken()}` }
        });

        results.push({
          test: test.name,
          status: response.status,
          success: response.status >= 400, // Should be rejected
          message: response.data?.message || 'Accepted (potential issue)'
        });

      } catch (error) {
        results.push({
          test: test.name,
          status: 'ERROR',
          success: true, // Error is expected for invalid input
          message: error.message
        });
      }
    }

    return results;
  }

  async testRateLimiting() {
    console.log('⚡ Testing Rate Limiting...');

    const requests = [];
    const startTime = Date.now();

    // Send 50 requests in quick succession
    for (let i = 0; i < 50; i++) {
      requests.push(
        this.client.post('/auth/login', {
          identifier: 'test@example.com',
          password: 'wrongpassword'
        })
      );
    }

    const responses = await Promise.allSettled(requests);
    const endTime = Date.now();

    const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status < 400).length;
    const rateLimited = responses.filter(r => r.status === 'fulfilled' && r.value.status === 429).length;

    return [{
      test: 'Rate Limiting Effectiveness',
      totalRequests: requests.length,
      successfulRequests: successful,
      rateLimitedRequests: rateLimited,
      duration: `${endTime - startTime}ms`,
      success: rateLimited > 0,
      message: rateLimited > 0 ? 'Rate limiting working' : 'Rate limiting not effective'
    }];
  }

  async testCORS() {
    console.log('🌐 Testing CORS Configuration...');

    try {
      // Test with allowed origin
      const allowedResponse = await this.client.get('/health', {
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });

      // Test with disallowed origin (should be blocked)
      const blockedResponse = await this.client.get('/health', {
        headers: {
          'Origin': 'http://malicious-site.com'
        }
      });

      return [
        {
          test: 'CORS - Allowed Origin',
          status: allowedResponse.status,
          success: allowedResponse.status === 200,
          message: 'Allowed origin accepted'
        },
        {
          test: 'CORS - Disallowed Origin',
          status: blockedResponse.status,
          success: blockedResponse.status !== 200,
          message: blockedResponse.status !== 200 ? 'Disallowed origin blocked' : 'CORS misconfiguration'
        }
      ];

    } catch (error) {
      return [{
        test: 'CORS Testing',
        status: 'ERROR',
        success: false,
        message: error.message
      }];
    }
  }

  async testFileUpload() {
    console.log('📎 Testing File Upload Security...');

    const tests = [
      // Valid image
      { name: 'Valid Image Upload', file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD', expected: true },
      // Invalid file type
      { name: 'Invalid File Type', file: 'data:text/plain;base64,SGVsbG8gV29ybGQ=', expected: false },
      // Oversized file
      { name: 'Oversized File', file: 'data:image/jpeg;base64,' + 'A'.repeat(1000000), expected: false },
      // Malicious content
      { name: 'Malicious Content', file: 'data:image/jpeg;base64,PHNjcmlwdD5hbGVydCgieHNzIik8L3NjcmlwdD4=', expected: false },
    ];

    const results = [];

    for (const test of tests) {
      try {
        const response = await this.client.post('/chat/analyze-image', {
          image: test.file,
          imageType: 'general'
        });

        const success = test.expected ? response.status === 200 : response.status >= 400;

        results.push({
          test: test.name,
          status: response.status,
          success,
          message: response.data?.message || 'OK'
        });

      } catch (error) {
        results.push({
          test: test.name,
          status: 'ERROR',
          success: !test.expected, // Error expected for invalid files
          message: error.message
        });
      }
    }

    return results;
  }

  getTestToken() {
    // Return a test JWT token for testing (this would be obtained from login in real scenario)
    return 'test.jwt.token';
  }

  generateReport(results) {
    console.log('\n📊 PENETRATION TESTING REPORT\n');
    console.log('=' .repeat(50));

    let totalTests = 0;
    let passedTests = 0;

    for (const [category, tests] of Object.entries(results)) {
      console.log(`\n🔍 ${category.toUpperCase()}`);
      console.log('-'.repeat(30));

      for (const test of tests) {
        totalTests++;
        if (test.success) passedTests++;

        const status = test.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${test.test}`);
        console.log(`   Status: ${test.status}`);
        console.log(`   Message: ${test.message}\n`);
      }
    }

    console.log('='.repeat(50));
    console.log(`📈 SUMMARY: ${passedTests}/${totalTests} tests passed`);
    console.log(`🔒 Security Score: ${Math.round((passedTests/totalTests) * 100)}%`);

    if (passedTests < totalTests) {
      console.log('\n⚠️  VULNERABILITIES FOUND - IMMEDIATE ACTION REQUIRED');
    } else {
      console.log('\n✅ ALL TESTS PASSED - GOOD SECURITY POSTURE');
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        score: Math.round((passedTests/totalTests) * 100)
      },
      results
    };

    fs.writeFileSync('penetration-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to penetration-test-report.json');
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PenetrationTester();
  tester.runTests().catch(console.error);
}

export default PenetrationTester;
```

## Manual Penetration Testing Checklist

### Authentication Testing
- [ ] Test password brute force protection
- [ ] Test account lockout mechanisms
- [ ] Test password reset functionality
- [ ] Test session management
- [ ] Test logout functionality

### Authorization Testing
- [ ] Test role-based access controls
- [ ] Test privilege escalation
- [ ] Test IDOR (Insecure Direct Object References)
- [ ] Test mass assignment vulnerabilities

### Input Validation Testing
- [ ] Test SQL injection
- [ ] Test XSS injection
- [ ] Test command injection
- [ ] Test file inclusion
- [ ] Test buffer overflow

### Session Management Testing
- [ ] Test session fixation
- [ ] Test session hijacking
- [ ] Test concurrent session handling
- [ ] Test session timeout

### File Upload Testing
- [ ] Test file type validation
- [ ] Test file size limits
- [ ] Test directory traversal
- [ ] Test malicious file uploads

### API Testing
- [ ] Test API rate limiting
- [ ] Test input validation
- [ ] Test error handling
- [ ] Test authentication bypass
- [ ] Test parameter tampering

## Running the Tests

```bash
# Install dependencies
npm install axios

# Run penetration tests
node penetration-test.js

# Or run specific test category
node -e "import('./penetration-test.js').then(m => m.default.prototype.testAuthentication())"
```

## Interpreting Results

- **High Priority Issues**: Authentication bypass, SQL injection, XSS
- **Medium Priority Issues**: Rate limiting bypass, weak configurations
- **Low Priority Issues**: Information disclosure, cosmetic issues

## Remediation Priority

1. **Critical**: Fix authentication and authorization issues
2. **High**: Address injection vulnerabilities
3. **Medium**: Improve configurations and monitoring
4. **Low**: Code quality and documentation improvements