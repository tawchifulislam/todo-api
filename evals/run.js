const fs = require('fs');
const path = require('path');

const cases = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf-8'),
);

async function runEvals() {
  let passed = 0;
  const failed = [];

  for (const testCase of cases) {
    const response = await fetch('http://localhost:3001/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: testCase.input }),
    });

    const body = await response.json();

    let matched = true;
    for (const key of Object.keys(testCase.expected)) {
      if (body[key] !== testCase.expected[key]) {
        matched = false;
      }
    }

    if (matched) {
      passed++;
    } else {
      failed.push({
        id: testCase.id,
        input: testCase.input,
        expected: testCase.expected,
        got: body,
      });
    }
  }

  console.log(`${passed}/${cases.length} passed`);

  if (failed.length > 0) {
    console.log('Failed cases:');
    console.log(JSON.stringify(failed, null, 2));
  }
}

runEvals();
