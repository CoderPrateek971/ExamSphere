/**
 * seedBmuExamData.js
 * Seeds the complete BML Munjal University (SOET) Mid-Term Examination (March 2026) dataset:
 * - Real courses, credits, coordinators & target batches
 * - Real examination rooms with capacities & special constraints
 * - Faculty, PhD research scholars, and lab staff with emails & phone numbers
 * - Question Paper (QP) requirements
 * - Room constraints & scheduling discussions
 * - Real student attendance samples from the sheet
 */

const { query } = require('../config/db');

async function seedBmuExamData() {
  console.log('\n======================================================');
  console.log('🏛️  Seeding BML Munjal University Exam Management Data...');
  console.log('======================================================\n');

  try {
    // -------------------------------------------------------------
    // 1. COURSES MASTER
    // -------------------------------------------------------------
    console.log('📚 Seeding Courses...');
    const courses = [
      { code: 'MTH1803', name: 'Discrete Mathematics', dept: 'CSE', branches: 'CSE, Mech', credits: 3.0, batch: '2025', coordinator: 'Dr. Palak Goel' },
      { code: 'MTH2801', name: 'Probability and Statistics', dept: 'CSE', branches: 'CSE, ECOM, Mech', credits: 3.0, batch: '2025', coordinator: 'Dr. Luckshay Batra' },
      { code: 'PRJ1101', name: 'Joy of Engineering', dept: 'SOET', branches: 'CSE, ECOM, Mech', credits: 3.0, batch: '2025', coordinator: 'Dr Hirdesh Pharasi' },
      { code: 'SKL1712', name: 'Spanish as a Foreign Language', dept: 'SOET', branches: 'CSE, ECOM, Mech', credits: 2.0, batch: '2025', coordinator: 'Ms. Aditi Virmani' },
      { code: 'ECE1101', name: 'Basic Electrical and Electronics Engineering', dept: 'ECE', branches: 'CSE 1,2,3,4', credits: 3.0, batch: '2025', coordinator: 'Dr. Asif Iqbal' },
      { code: 'MEC1101', name: 'Elements of Mechanical Engineering', dept: 'ME', branches: 'CSE, ECOM, Mech', credits: 3.0, batch: '2025', coordinator: 'Dr Ranbir Singh' },
      { code: 'MTH1802', name: 'Numerical Methods', dept: 'CSE', branches: 'CSE, Mech', credits: 3.0, batch: '2025', coordinator: 'Dr. Satpal Singh' },
      { code: 'PSP1805', name: 'Science, Technology, and Public Policy', dept: 'SOET', branches: 'CSE, Mech', credits: 2.0, batch: '2025', coordinator: 'Dr. Ajay Mohan Goel' },
      { code: 'SKL2711', name: 'Career Training and Corporate Skills', dept: 'SOET', branches: 'CSE, Ecom', credits: 2.0, batch: '2024', coordinator: 'Dr. Kiran Khatter' },
      { code: 'CSE2029', name: 'Data Communications & Computer Networks', dept: 'CSE', branches: 'CSE, Ecom', credits: 3.0, batch: '2024', coordinator: 'Dr. Pramod Maurya' },
      { code: 'MEC2025', name: 'Casting and welding of Metals', dept: 'ME', branches: 'ME', credits: 3.0, batch: '2024', coordinator: 'Dr. N CH. Kaushik' },
      { code: 'ECE2705', name: 'Circuit Analysis and Synthesis', dept: 'ECE', branches: 'Ecom', credits: 3.0, batch: '2024', coordinator: 'Dr. Anubhav Agrawal' },
      { code: 'ECE2016', name: 'Linear Integrated Circuits', dept: 'ECE', branches: 'Ecom', credits: 3.0, batch: '2024', coordinator: 'Dr. Asif Iqbal' },
      { code: 'CSE2021', name: 'Database Management System', dept: 'CSE', branches: 'CSE, Ecom', credits: 3.0, batch: '2024', coordinator: 'Dr. Nishtha Phutela', is_lab: true },
      { code: 'MEC2740', name: 'Applied Engineering Thermodynamics', dept: 'ME', branches: 'ME', credits: 3.0, batch: '2024', coordinator: 'Dr. Rojo Kurian' },
      { code: 'PSP4706', name: 'Logical Reasoning and Quantitative Analysis', dept: 'SOET', branches: 'Basic, Data Sc.-CSE, CYB, Ecom, Mech', credits: 1.0, batch: '2023', coordinator: 'Dr. Kiran Khatter' },
      { code: 'CSE3702', name: 'Theory of Computation', dept: 'CSE', branches: 'Basic, Data Sc.-CSE, CYB', credits: 3.0, batch: '2023', coordinator: 'Dr. Isha Ganguli' },
      { code: 'CSE3722', name: 'IoT Networks, Architectures and Applications', dept: 'CSE', branches: 'Basic, Data Sc.-CSE, CYB', credits: 3.0, batch: '2023', coordinator: 'Dr. Sandeep Kumar' },
      { code: 'CSE3703', name: 'Cryptography', dept: 'CSE', branches: 'Basic, Data Sc.-CSE, CYB', credits: 3.0, batch: '2023', coordinator: 'Dr. Satyendr Singh' },
      { code: 'CSE4007', name: 'Deep Learning', dept: 'CSE', branches: 'Basic, Data Sc.-CSE, Ecom', credits: 3.0, batch: '2023', coordinator: 'Dr. Manisha Saini' },
      { code: 'CSE3726', name: 'Blockchain and Cryptocurrency Technologies', dept: 'CSE', branches: 'CYB', credits: 3.0, batch: '2023', coordinator: 'Dr. Pramod Maurya' },
      { code: 'MEC3711', name: 'Production Planning and Control', dept: 'ME', branches: 'Mech', credits: 3.0, batch: '2023', coordinator: 'Dr. Rojo Kurian' },
      { code: 'FIN1001', name: 'Financial Markets: From Fundamentals to AI-Driven Analytics', dept: 'MDC', branches: 'Multi-Disciplinary Course', credits: 2.0, batch: 'ALL', coordinator: 'Dr. Amar Rao/ Dr. Hirdesh', is_mdc: true }
    ];

    for (const c of courses) {
      await query(
        `INSERT INTO courses (course_code, course_name, department, eligible_branches, credits, target_batch, course_coordinator_name, is_lab_course, is_multidisciplinary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            course_name = VALUES(course_name),
            department = VALUES(department),
            eligible_branches = VALUES(eligible_branches),
            credits = VALUES(credits),
            target_batch = VALUES(target_batch),
            course_coordinator_name = VALUES(course_coordinator_name),
            is_lab_course = VALUES(is_lab_course),
            is_multidisciplinary = VALUES(is_multidisciplinary)`,
        [c.code, c.name, c.dept, c.branches, c.credits, c.batch, c.coordinator, !!c.is_lab, !!c.is_mdc]
      );
    }
    console.log(`✅ ${courses.length} Courses seeded/updated.`);

    // -------------------------------------------------------------
    // 2. ROOMS MASTER & CONSTRAINTS
    // -------------------------------------------------------------
    console.log('🏛️  Seeding Rooms & Exam Venues...');
    const rooms = [
      { num: 'NB105', bldg: 'NB', cap: 120, rows: 10, cols: 12 },
      { num: 'GA204', bldg: 'GA', cap: 64, rows: 8, cols: 8 },
      { num: 'GA205', bldg: 'GA', cap: 60, rows: 6, cols: 10 },
      { num: 'GA302A', bldg: 'GA', cap: 60, rows: 6, cols: 10 },
      { num: 'GA302B', bldg: 'GA', cap: 60, rows: 6, cols: 10 },
      { num: 'GA304', bldg: 'GA', cap: 60, rows: 6, cols: 10 },
      { num: 'GAL04', bldg: 'GA', cap: 60, rows: 6, cols: 10 },
      { num: 'NB106', bldg: 'NB', cap: 60, rows: 6, cols: 10 },
      { num: 'NB201', bldg: 'NB', cap: 30, rows: 5, cols: 6 },
      { num: 'NB203', bldg: 'NB', cap: 66, rows: 6, cols: 11 },
      { num: 'NB205', bldg: 'NB', cap: 60, rows: 6, cols: 10 },
      { num: 'NB206', bldg: 'NB', cap: 60, rows: 6, cols: 10 },
      { num: 'NB207', bldg: 'NB', cap: 60, rows: 6, cols: 10 },
      { num: 'NB211', bldg: 'NB', cap: 66, rows: 6, cols: 11 },
      { num: 'NB212', bldg: 'NB', cap: 66, rows: 6, cols: 11 },
      { num: 'NB213', bldg: 'NB', cap: 60, rows: 6, cols: 10, notes: 'dont use on entire day on thursday' },
      { num: 'NB214', bldg: 'NB', cap: 60, rows: 6, cols: 10 },
      { num: 'NB215', bldg: 'NB', cap: 60, rows: 6, cols: 10, notes: 'dont use on friday Ist half' },
      { num: 'NB307', bldg: 'NB', cap: 66, rows: 6, cols: 11 },
      { num: 'NB311', bldg: 'NB', cap: 66, rows: 6, cols: 11 },
      { num: 'NB312', bldg: 'NB', cap: 60, rows: 6, cols: 10 },
      { num: 'NB313', bldg: 'NB', cap: 60, rows: 6, cols: 10 },
      { num: 'NB314', bldg: 'NB', cap: 60, rows: 6, cols: 10 },
      { num: 'GA 102', bldg: 'GA', cap: 60, rows: 6, cols: 10, notes: 'Reserved for Elements of Mechanical Engg' },
      { num: 'GBL01', bldg: 'GBL', cap: 120, rows: 10, cols: 12, notes: 'Large Lecture Hall for Corporate Skills & Aptitude' }
    ];

    for (const r of rooms) {
      await query(
        `INSERT INTO rooms (room_number, building, capacity, rows_count, cols_count, special_instructions)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            capacity = VALUES(capacity),
            rows_count = VALUES(rows_count),
            cols_count = VALUES(cols_count),
            special_instructions = VALUES(special_instructions)`,
        [r.num, r.bldg, r.cap, r.rows, r.cols, r.notes || null]
      );
    }
    console.log(`✅ ${rooms.length} Rooms registered.`);

    // -------------------------------------------------------------
    // 3. FACULTY, RESEARCH SCHOLARS (RS) & LAB STAFF
    // -------------------------------------------------------------
    console.log('👨‍🏫 Seeding Faculty & Staff Directory...');
    const personnel = [
      { code: 'FAC_PALAK', name: 'Dr. Palak Goel', email: 'palak.goel@bmu.edu.in', phone: '7838887146', cat: 'FACULTY', dept: 'CSE', desig: 'Assistant Professor' },
      { code: 'FAC_SATPAL', name: 'Dr. Satpal Singh', email: 'satpal.singh1@bmu.edu.in', phone: '8949204178', cat: 'FACULTY', dept: 'CSE', desig: 'Associate Professor' },
      { code: 'FAC_ZIYA', name: 'Prof. Ziya Uddin', email: 'ziya.uddin@bmu.edu.in', phone: '8295200293', cat: 'FACULTY', dept: 'CSE', desig: 'Professor' },
      { code: 'FAC_LUCKSHAY', name: 'Dr. Luckshay Batra', email: 'luckshay.batra@bmu.edu.in', phone: '9910931128', cat: 'FACULTY', dept: 'CSE', desig: 'Assistant Professor' },
      { code: 'FAC_ISHA', name: 'Dr. Isha Ganguli', email: 'isha.ganguli@bmu.edu.in', phone: '9903871550', cat: 'FACULTY', dept: 'CSE', desig: 'Associate Professor' },
      { code: 'FAC_SANDEEP', name: 'Dr. Sandeep Kumar', email: 'sandeep.kumar@bmu.edu.in', phone: '9133872511', cat: 'FACULTY', dept: 'CSE', desig: 'Associate Professor' },
      { code: 'FAC_PRAMOD', name: 'Dr. Pramod Kumar Maurya', email: 'pramod.maurya@bmu.edu.in', phone: '9643322724', cat: 'FACULTY', dept: 'CSE', desig: 'Assistant Professor' },
      { code: 'FAC_ASIF', name: 'Dr. Asif Iqbal', email: 'asif.iqbal@bmu.edu.in', phone: '8770423343', cat: 'FACULTY', dept: 'ECE', desig: 'Assistant Professor' },
      { code: 'FAC_HIRDESH', name: 'Dr. Hirdesh Kumar Pharasi', email: 'hirdesh.pharasi@bmu.edu.in', phone: '9775550708', cat: 'FACULTY', dept: 'SOET', desig: 'Associate Professor' },
      { code: 'FAC_MANISHA', name: 'Dr. Manisha Saini', email: 'manisha.saini@bmu.edu.in', phone: '9999305497', cat: 'FACULTY', dept: 'CSE', desig: 'Assistant Professor' },
      { code: 'FAC_ROJO', name: 'Dr. Rojo Kurian Daniels', email: 'rojo.daniels@bmu.edu.in', phone: '7025576308', cat: 'FACULTY', dept: 'ME', desig: 'Associate Professor' },
      { code: 'FAC_KAUSHIK', name: 'Dr. Nallan Chakravartula Kaushik', email: 'n.kaushik@bmu.edu.in', phone: '9030879876', cat: 'FACULTY', dept: 'ME', desig: 'Professor' },
      { code: 'FAC_KIRAN_K', name: 'Dr. Kiran Khatter', email: 'kiran.khatter@bmu.edu.in', phone: '9899960660', cat: 'FACULTY', dept: 'CSE', desig: 'Professor' },
      { code: 'FAC_NISHTHA', name: 'Dr. Nishtha Phutela', email: 'nishtha.phutela@bmu.edu.in', phone: '9540172255', cat: 'FACULTY', dept: 'CSE', desig: 'Assistant Professor' },
      { code: 'FAC_SUMIT_B', name: 'Dr. Sumit Badotra', email: 'sumit.badotra@bmu.edu.in', phone: '9816338848', cat: 'FACULTY', dept: 'CSE', desig: 'Assistant Professor' },

      // PhD Research Scholars (RS)
      { code: 'RS_NISHU', name: 'Ms. Nishu (RS)', email: 'nishu.23pd@bmu.edu.in', phone: '9800000001', cat: 'PHD_SCHOLAR', dept: 'SOET', desig: 'Research Scholar' },
      { code: 'RS_ANAMIKA', name: 'Ms. Anamika (RS)', email: 'anamika.22pd@bmu.edu.in', phone: '9800000002', cat: 'PHD_SCHOLAR', dept: 'SOET', desig: 'Research Scholar' },
      { code: 'RS_GOURAV', name: 'Mr. Gourav Sharma (RS)', email: 'gourav.sharma.22pd@bmu.edu.in', phone: '9800000003', cat: 'PHD_SCHOLAR', dept: 'SOET', desig: 'Research Scholar' },
      { code: 'RS_EKTA', name: 'Ms. Ekta Yadav (RS)', email: 'ekta.yadav.23pd@bmu.edu.in', phone: '9800000004', cat: 'PHD_SCHOLAR', dept: 'SOET', desig: 'Research Scholar' },
      { code: 'RS_NUTAN', name: 'Ms. Nutan (RS)', email: 'nutan.23pd@bmu.edu.in', phone: '9800000005', cat: 'PHD_SCHOLAR', dept: 'SOET', desig: 'Research Scholar' },
      { code: 'RS_RITU', name: 'Ms. Ritu (RS)', email: 'ritu.23pd@bmu.edu.in', phone: '9800000006', cat: 'PHD_SCHOLAR', dept: 'SOET', desig: 'Research Scholar' },
      { code: 'RS_SATENDRA', name: 'Mr. Satendra Singh (RS)', email: 'satendra.singh.24pd@bmu.edu.in', phone: '9800000007', cat: 'PHD_SCHOLAR', dept: 'SOET', desig: 'Research Scholar' },
      { code: 'RS_JYOTI', name: 'Ms. Jyoti (RS)', email: 'jyoti.24pd@bmu.edu.in', phone: '9800000008', cat: 'PHD_SCHOLAR', dept: 'SOET', desig: 'Research Scholar' },
      { code: 'RS_AMIT_R', name: 'Mr. Amit Rohilla (RS)', email: 'amit.25pd@bmu.edu.in', phone: '9800000009', cat: 'PHD_SCHOLAR', dept: 'SOET', desig: 'Research Scholar' },

      // Lab Staff
      { code: 'STAFF_SUMIT', name: 'Mr. Sumit', email: 'sumit.kumar@bmu.edu.in', phone: '9800000010', cat: 'LAB_STAFF', dept: 'SOET', desig: 'Lab Technician' },
      { code: 'STAFF_DUSHYANT', name: 'Mr. Dushyant Kataria', email: 'dushyant.kataria@bmu.edu.in', phone: '9800000011', cat: 'LAB_STAFF', dept: 'SOET', desig: 'Lab Assistant' },
      { code: 'STAFF_MANISH', name: 'Mr. Manish Sharma', email: 'manish.sharma@bmu.edu.in', phone: '9800000012', cat: 'LAB_STAFF', dept: 'SOET', desig: 'Lab Technician' },
      { code: 'STAFF_TIRATH', name: 'Mr. Tirath Kumar', email: 'tirath.kumar@bmu.edu.in', phone: '9800000013', cat: 'LAB_STAFF', dept: 'SOET', desig: 'Lab Assistant' },
      { code: 'STAFF_YAZPAL', name: 'Mr. Yazpal', email: 'yazpal@bmu.edu.in', phone: '9800000014', cat: 'LAB_STAFF', dept: 'SOET', desig: 'Lab Staff' }
    ];

    for (const p of personnel) {
      await query(
        `INSERT INTO faculty (faculty_code, name, email, contact_number, department, designation, staff_category, seniority_level, max_duties)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            name = VALUES(name),
            contact_number = VALUES(contact_number),
            department = VALUES(department),
            designation = VALUES(designation),
            staff_category = VALUES(staff_category)`,
        [p.code, p.name, p.email, p.phone, p.dept, p.desig, p.cat, p.cat === 'FACULTY' ? 2 : 1, p.cat === 'FACULTY' ? 6 : 8]
      );
    }
    console.log(`✅ ${personnel.length} Personnel records seeded.`);

    // -------------------------------------------------------------
    // 4. QUESTION PAPER (QP) LOGISTICS
    // -------------------------------------------------------------
    console.log('📝 Seeding Question Paper Status Table...');
    const qpData = [
      { subject: 'Deep Learning', coord: 'Manisha Saini / Hirdesh Pharasi', qp: 190, status: 'RECEIVED' },
      { subject: 'Casting & Welding of metals', coord: 'N Ch Kaushik', qp: 13, status: 'RECEIVED' },
      { subject: 'Numerical Methods', coord: 'Satpal Singh', qp: 59, status: 'RECEIVED' },
      { subject: 'Theory of Computation', coord: 'Isha Ganguli', qp: 425, status: 'RECEIVED' },
      { subject: 'Probability & Statistics', coord: 'Luckshay Batra', qp: 502, status: 'RECEIVED' },
      { subject: 'Cryptography', coord: 'Satyendr Singh', qp: 410, status: 'RECEIVED' },
      { subject: 'Linear Integrated Circuits', coord: 'Asif Iqbal', qp: 18, status: 'RECEIVED' },
      { subject: 'Discrete Mathematics', coord: 'Palak Goel', qp: 252, status: 'RECEIVED' },
      { subject: 'Joy of Engineering', coord: 'Dr. Hirdesh Kumar Pharasi', qp: 502, status: 'PENDING' },
      { subject: 'Circuit Analysis and Synthesis', coord: 'Anubhav Agrawal', qp: 18, status: 'PENDING' },
      { subject: 'Data Communications and Computer Networks', coord: 'Pramod Kumar Maurya', qp: 445, status: 'RECEIVED' },
      { subject: 'IoT Networks, Architectures and Applications', coord: 'Dr. Sandeep Kumar', qp: 406, status: 'RECEIVED' }
    ];

    const [allCourses] = await query('SELECT id, course_name FROM courses');
    for (const q of qpData) {
      const match = allCourses.find(c => c.course_name.toLowerCase().includes(q.subject.toLowerCase()) || q.subject.toLowerCase().includes(c.course_name.toLowerCase()));
      if (match) {
        await query(
          `INSERT INTO question_paper_logistics (course_id, coordinator_name, required_qp_count, receiving_status, is_received)
           VALUES (?, ?, ?, ?, ?)`,
          [match.id, q.coord, q.qp, q.status, q.status === 'RECEIVED']
        );
      }
    }
    console.log('✅ Question Paper Logistics seeded.');

    // -------------------------------------------------------------
    // 5. REAL STUDENTS (from SOET Attendance Sheet)
    // -------------------------------------------------------------
    console.log('🎓 Seeding Real Students from Attendance Sheet...');
    const students = [
      { roll: '250C2030116', uid: '250378', name: 'GATIK YADAV', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030117', uid: '250379', name: 'GAURAV SARKAR', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030118', uid: '250380', name: 'GAZAL MAHAJAN', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030135', uid: '250397', name: 'HIMANK JAIN', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030152', uid: '250414', name: 'KABIR ARORA', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030222', uid: '250484', name: 'PAVITRA CHAUHAN', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030236', uid: '250498', name: 'PRAYAG KHANDELWAL', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030279', uid: '250541', name: 'SANSKAR UDAGE', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030303', uid: '250565', name: 'SHRIYA KUKREJA', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030312', uid: '250574', name: 'OMKAR RAOSAHEB SONJI', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030333', uid: '250595', name: 'UDIT AGARWAL', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030347', uid: '250609', name: 'VANSH CHAUDHARY', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030364', uid: '250626', name: 'VIVEK MALIK', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030375', uid: '250637', name: 'KARTIKEYA', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030387', uid: '250649', name: 'ARYAN KUMAR', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030388', uid: '250650', name: 'SOUHAM VASHISTHA', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030390', uid: '250652', name: 'ARYA SRIVASTAV', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030395', uid: '250657', name: 'DEVANSHI YADAV', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030402', uid: '250664', name: 'YASH KUMAR SHARMA', sec: 'CSE V', dept: 'CSE' },
      { roll: '250C2030024', uid: '250286', name: 'AGRIM TONK', sec: 'CSE VI', dept: 'CSE' },
      { roll: '250C2030034', uid: '250296', name: 'AMANDEEP SINGH', sec: 'CSE VI', dept: 'CSE' },
      { roll: '250C2030037', uid: '250299', name: 'ANAY GARG', sec: 'CSE VI', dept: 'CSE' },
      { roll: '250C2030085', uid: '250347', name: 'CHAHAT YADAV', sec: 'CSE VI', dept: 'CSE' },
      { roll: '250C2030094', uid: '250356', name: 'DEEPIKA DATA', sec: 'CSE VI', dept: 'CSE' },
      { roll: '250C2030099', uid: '250361', name: 'DHAIRYA KANSAL', sec: 'CSE VI', dept: 'CSE' },
      { roll: '250C2030104', uid: '250366', name: 'DISHA', sec: 'CSE VI', dept: 'CSE' },
      { roll: '250C2030137', uid: '250399', name: 'HIMANSHU PAL', sec: 'CSE VI', dept: 'CSE' },
      { roll: '250C2030149', uid: '250411', name: 'JATIN KUMAR YADAV', sec: 'CSE VI', dept: 'CSE' },
      { roll: '250C2030192', uid: '250454', name: 'MIMANSA MEHTANI', sec: 'CSE VI', dept: 'CSE' },
      { roll: '250C2030195', uid: '250457', name: 'MOHIT SAIN', sec: 'CSE VI', dept: 'CSE' }
    ];

    for (const s of students) {
      const email = `${s.name.toLowerCase().replace(/\s+/g, '.')}.${s.uid}@bmu.edu.in`;
      await query(
        `INSERT INTO students (enrollment_no, unique_id, name, email, department, stream_section, batch_year, semester, program)
         VALUES (?, ?, ?, ?, ?, ?, '2025', 2, 'B.Tech')
         ON DUPLICATE KEY UPDATE 
            unique_id = VALUES(unique_id),
            name = VALUES(name),
            stream_section = VALUES(stream_section)`,
        [s.roll, s.uid, s.name, email, s.dept, s.sec]
      );
    }
    console.log(`✅ ${students.length} Student records registered.`);

    // -------------------------------------------------------------
    // 6. SCHEDULED EXAMINATIONS (from Date-Sheet)
    // -------------------------------------------------------------
    console.log('📅 Seeding Examination Date-Sheet (March 23-27, 2026)...');
    const examSchedules = [
      { code: 'MTH1803', date: '2026-03-23', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 240, rooms: 8, batch: '2025' },
      { code: 'MTH1802', date: '2026-03-23', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 57, rooms: 2, batch: '2025' },
      { code: 'SKL2711', date: '2026-03-23', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 425, rooms: 6, batch: '2024' },
      { code: 'CSE3722', date: '2026-03-23', shift: 'AFTERNOON', rep: '01:30:00', start: '14:00:00', end: '16:00:00', students: 392, rooms: 13, batch: '2023' },
      { code: 'MTH2801', date: '2026-03-24', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 479, rooms: 16, batch: '2025' },
      { code: 'CSE2021', date: '2026-03-24', shift: 'FULL_DAY', rep: '09:00:00', start: '09:30:00', end: '17:00:00', students: 425, rooms: 4, batch: '2024' },
      { code: 'CSE3702', date: '2026-03-24', shift: 'AFTERNOON', rep: '01:30:00', start: '14:00:00', end: '15:30:00', students: 391, rooms: 13, batch: '2023' },
      { code: 'FIN1001', date: '2026-03-24', shift: 'EVENING', rep: '03:30:00', start: '16:00:00', end: '17:30:00', students: 42, rooms: 2, batch: 'ALL' },
      { code: 'PSP1805', date: '2026-03-25', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 175, rooms: 6, batch: '2025' },
      { code: 'CSE2029', date: '2026-03-25', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 425, rooms: 14, batch: '2024' },
      { code: 'PSP4706', date: '2026-03-25', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 408, rooms: 6, batch: '2023' },
      { code: 'PRJ1101', date: '2026-03-25', shift: 'AFTERNOON', rep: '01:30:00', start: '14:00:00', end: '16:00:00', students: 479, rooms: 16, batch: '2025' },
      { code: 'MEC2740', date: '2026-03-25', shift: 'AFTERNOON', rep: '01:30:00', start: '14:00:00', end: '16:00:00', students: 12, rooms: 1, batch: '2024' },
      { code: 'MEC3711', date: '2026-03-25', shift: 'AFTERNOON', rep: '01:30:00', start: '14:00:00', end: '16:00:00', students: 6, rooms: 1, batch: '2023' },
      { code: 'SKL1712', date: '2026-03-25', shift: 'EVENING', rep: '03:30:00', start: '16:00:00', end: '17:30:00', students: 125, rooms: 4, batch: '2025' },
      { code: 'ECE1101', date: '2026-03-26', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 255, rooms: 9, batch: '2025' },
      { code: 'MEC1101', date: '2026-03-26', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 61, rooms: 1, batch: '2025' },
      { code: 'ECE2016', date: '2026-03-26', shift: 'AFTERNOON', rep: '01:30:00', start: '14:00:00', end: '16:00:00', students: 17, rooms: 1, batch: '2024' },
      { code: 'CSE4007', date: '2026-03-26', shift: 'AFTERNOON', rep: '01:30:00', start: '14:00:00', end: '16:00:00', students: 180, rooms: 6, batch: '2023' },
      { code: 'CSE3726', date: '2026-03-26', shift: 'AFTERNOON', rep: '01:30:00', start: '14:00:00', end: '16:00:00', students: 44, rooms: 2, batch: '2023' },
      { code: 'MEC2025', date: '2026-03-27', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 12, rooms: 1, batch: '2024' },
      { code: 'ECE2705', date: '2026-03-27', shift: 'MORNING', rep: '09:30:00', start: '10:00:00', end: '12:00:00', students: 17, rooms: 1, batch: '2024' },
      { code: 'CSE3703', date: '2026-03-27', shift: 'AFTERNOON', rep: '01:30:00', start: '14:00:00', end: '16:00:00', students: 395, rooms: 13, batch: '2023' }
    ];

    const [allCoursesForExams] = await query('SELECT id, course_code, course_name FROM courses');
    const courseByCode = {};
    allCoursesForExams.forEach(c => { courseByCode[c.course_code] = c; });

    for (const ex of examSchedules) {
      const crs = courseByCode[ex.code];
      if (crs) {
        const examName = `${crs.course_name} (${ex.code}) Mid-Term`;
        await query(
          `INSERT INTO exams (course_id, exam_name, exam_type, target_batch, academic_session, exam_date, shift, reporting_time, start_time, end_time, duration_minutes, registered_students_count, required_rooms_count, status)
           VALUES (?, ?, 'MID_TERM', ?, 'MID_TERM_MARCH_2026', ?, ?, ?, ?, ?, 120, ?, ?, 'SCHEDULED')
           ON DUPLICATE KEY UPDATE 
              exam_date = VALUES(exam_date),
              shift = VALUES(shift),
              reporting_time = VALUES(reporting_time),
              start_time = VALUES(start_time),
              end_time = VALUES(end_time),
              registered_students_count = VALUES(registered_students_count),
              required_rooms_count = VALUES(required_rooms_count)`,
          [crs.id, examName, ex.batch, ex.date, ex.shift, ex.rep, ex.start, ex.end, ex.students, ex.rooms]
        );
      }
    }
    console.log(`✅ ${examSchedules.length} Examinations scheduled in database.`);

    // -------------------------------------------------------------
    // 7. EXAM SCHEDULING DISCUSSIONS
    // -------------------------------------------------------------
    console.log('💬 Seeding Exam Planning & Discussion Notes...');
    const discussions = [
      {
        topic: 'IoT Networks Afternoon Shift Scheduling',
        query: 'Can we schedule "IoT Networks, Architectures and Applications" on Monday afternoon?',
        resolution: 'Yes, in fact would make sense, we can do it with less rooms then. Shifted to Monday Afternoon.',
        batch: '2023'
      },
      {
        topic: 'Tuesday Theory of Computation vs Prob & Stats Room Shortage',
        query: 'Can we schedule one exam on Tuesday to Afternoon? Possibly Theory of Computation? Because Tuesday also, we have large no. of students giving exams.',
        resolution: 'Except Logical Reasoning, put all other 2023 batch in Afternoon shift. Theory of Computation (409 students) kept in Afternoon.',
        batch: '2023'
      },
      {
        topic: 'DBMS Full Day Lab Scheduling',
        query: 'Nishtha maam exam is scheduled in three slots. Can we schedule it as it is?',
        resolution: 'Yes, we are not using any labs on Tuesday, give them entire day. Seating and slots will be shared by course coordinator.',
        batch: '2024'
      }
    ];

    for (const d of discussions) {
      await query(
        `INSERT INTO exam_scheduling_discussions (discussion_topic, query_text, resolution_text, affected_batch)
         VALUES (?, ?, ?, ?)`,
        [d.topic, d.query, d.resolution, d.batch]
      );
    }
    console.log('✅ Exam Scheduling Discussions seeded.');

    console.log('\n======================================================');
    console.log('🎯 BMU Examination Data successfully seeded into MySQL!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Error during seeding:', err.message);
  }
}

module.exports = { seedBmuExamData };

if (require.main === module) {
  seedBmuExamData().then(() => process.exit(0));
}

