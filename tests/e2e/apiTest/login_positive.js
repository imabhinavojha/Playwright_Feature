
import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m30s', target: 5 },
    { duration: '20s', target: 0 },
  ],
};

let baseUrl = 'https://opensource-demo.orangehrmlive.com/web/index.php';

let validPayload = {
    username: 'Admin',
    password: 'admin123',
};

let invalidPayload = {
    username: 'Admin',
    password: 'wrongpass',
};

export default function () {

    group('Load Login Page', function () {
        const res = http.get(`${baseUrl}/auth/login`);

        check(res, {
            'login page loaded': (r) => r.status === 200,
        });

    });

    group('Valid Login Test', function () {
        const res = http.post(`${baseUrl}/auth/validate`, validPayload);

        check(res, {
            'login successful': (r) => r.status === 200 || r.status === 302,
        });

        // Try accessing dashboard
        const dashboardRes = http.get(`${baseUrl}/dashboard/index`);

        check(dashboardRes, {
            'dashboard accessible after login': (r) => {
                if (r.status !== 200) {
                    console.error(`❌ Dashboard failed. Status: ${r.status}`);
                    console.error(`Response URL: ${r.url}`);
                    console.error(`Response Body: ${String(r.body).substring(0, 300)}`);
                    return false;
                }
                return true;
            }
        });
    });

    group('Invalid Login Test', function () {

        const res = http.post(`${baseUrl}/auth/validate`, invalidPayload);

        check(res, {
            'invalid login returns 200/302': (r) => r.status === 200 || r.status === 302,
        });

        // Try accessing dashboard
        const dashboardRes = http.get(`${baseUrl}/dashboard/index`);

        check(dashboardRes, {
            'dashboard NOT accessible': (r) => r.status !== 200,
        });
    });

    sleep(1);
}