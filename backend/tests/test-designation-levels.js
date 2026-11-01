const assert = require('assert');
const { mapDesignationToSeniority } = require('../utils/designationHelper');

async function runDesignationTests() {
  console.log('\n======================================================');
  console.log('🧪 TESTING AUTOMATIC DESIGNATION TO SENIORITY MAPPING');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  const testCases = [
    // Level 3: Leadership & Full Professors
    { input: 'Professor', expected: 3 },
    { input: 'Prof. Rajesh Kumar', expected: 3 },
    { input: 'Distinguished Professor', expected: 3 },
    { input: 'Chair Professor', expected: 3 },
    { input: 'Dean Academic Affairs', expected: 3 },
    { input: 'Director', expected: 3 },
    { input: 'HOD CSE', expected: 3 },
    { input: 'Head of Department', expected: 3 },
    { input: 'Principal', expected: 3 },

    // Level 2: Associate & Senior Assistant Professors
    { input: 'Associate Professor', expected: 2 },
    { input: 'Assoc. Professor', expected: 2 },
    { input: 'Reader', expected: 2 },
    { input: 'Senior Assistant Professor', expected: 2 },
    { input: 'Sr. Assistant Professor', expected: 2 },

    // Level 1: Assistant Professors, Lecturers, Visiting Faculty
    { input: 'Assistant Professor', expected: 1 },
    { input: 'Asst. Professor', expected: 1 },
    { input: 'Lecturer', expected: 1 },
    { input: 'Senior Lecturer', expected: 1 },
    { input: 'Visiting Faculty', expected: 1 },
    { input: 'Adjunct Faculty', expected: 1 },
    { input: 'Guest Faculty', expected: 1 },

    // Level 0: PhD Scholars, TAs, Lab Staff
    { input: 'PhD Scholar', expected: 0 },
    { input: 'Ph.D. Candidate', expected: 0 },
    { input: 'Doctorate Scholar', expected: 0 },
    { input: 'Teaching Assistant', expected: 0 },
    { input: 'Research Scholar', expected: 0 },
    { input: 'Research Assistant', expected: 0 },
    { input: 'Lab Instructor', expected: 0 },
    { input: 'Lab Assistant', expected: 0 },
    { input: 'Teaching Fellow', expected: 0 },
    { input: 'TA', expected: 0 },
    { input: 'RA', expected: 0 },

    // Edge cases
    { input: '', expected: 1 },
    { input: 'Unknown Designation', expected: 1 }
  ];

  for (const tc of testCases) {
    total++;
    const actual = mapDesignationToSeniority(tc.input);
    if (actual === tc.expected) {
      console.log(`✅ [PASS] "${tc.input}" -> Level ${actual}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] "${tc.input}" -> Got Level ${actual}, Expected ${tc.expected}`);
    }
  }

  console.log('\n======================================================');
  console.log(`🎯 RESULT: ${passed} / ${total} DESIGNATION TESTS PASSED`);
  console.log('======================================================\n');

  assert.strictEqual(passed, total, 'All designation test cases must pass');
}

runDesignationTests();
