/**
 * Designation to Seniority Level Mapper
 * 
 * Maps academic and research designations to seniority hierarchy:
 * - Level 3 (Senior Faculty & Leadership): Professor, Distinguished Professor, Chair Professor, Dean, Director, HOD, Principal
 * - Level 2 (Mid-Level Faculty): Associate Professor, Reader, Senior Assistant Professor
 * - Level 1 (Junior Regular Faculty): Assistant Professor, Lecturer, Visiting/Adjunct Faculty
 * - Level 0 (Research & Academic Support): PhD Scholar, Research Scholar, Teaching Assistant (TA), Research Assistant (RA), Lab Instructor
 */
function mapDesignationToSeniority(designation = '') {
  if (!designation) return 1;
  const d = String(designation).toLowerCase().trim();

  // Level 3: Leadership & Full Professors
  if (
    d.includes('dean') ||
    d.includes('director') ||
    d.includes('hod') ||
    d.includes('head') ||
    d.includes('principal') ||
    d.includes('distinguished') ||
    d.includes('chair') ||
    ((d.includes('professor') || d.includes('prof.') || d.startsWith('prof ') || d === 'prof') && !d.includes('assistant') && !d.includes('associate') && !d.includes('asst') && !d.includes('assoc'))
  ) {
    return 3;
  }

  // Level 2: Associate & Senior Assistant Professors
  if (
    d.includes('associate') ||
    d.includes('assoc') ||
    d.includes('reader') ||
    d.includes('senior assistant') ||
    d.includes('sr. assistant') ||
    d.includes('sr assistant')
  ) {
    return 2;
  }

  // Level 0: PhD Scholars, TAs, Lab Staff & Research Fellows
  if (
    d.includes('phd') ||
    d.includes('ph.d') ||
    d.includes('doctorate scholar') ||
    d.includes('scholar') ||
    d.includes('teaching assistant') ||
    d.includes('research assistant') ||
    d.includes('lab instructor') ||
    d.includes('lab assistant') ||
    d.includes('fellow') ||
    d === 'ta' ||
    d === 'ra'
  ) {
    return 0;
  }

  // Level 1: Assistant Professors, Lecturers, Visiting Faculty (Default)
  return 1;
}

module.exports = {
  mapDesignationToSeniority
};
