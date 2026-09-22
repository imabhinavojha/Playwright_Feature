import http from 'k6/http';
import { sleep, check } from 'k6';

// basic options for a quick load test
export let options = {
  vus: 10,         // number of virtual users
  duration: '30s', // total duration of the test
};

export default function () {
  // target URL for the load test
  const res = http.get('https://test.k6.io');

  // simple check to assert the endpoint is healthy
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // each virtual user sleeps for 1 second between iterations
  sleep(1);
}
