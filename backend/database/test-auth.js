const authService = require('../services/authService');

async function testLogins() {
  try {
    const adminRes = await authService.loginUser({ email: 'admin@examsphere.edu', password: 'admin123' });
    console.log(' Admin authenticated successfully:', adminRes.user.name, '| Role:', adminRes.user.role, '| Dept:', adminRes.user.department);

    const facultyRes = await authService.loginUser({ email: 'faculty@examsphere.edu', password: 'faculty123' });
    console.log(' Faculty authenticated successfully:', facultyRes.user.name, '| Role:', facultyRes.user.role, '| Dept:', facultyRes.user.department, '| FacultyId:', facultyRes.user.facultyId);

    try {
      await authService.loginUser({ email: 'admin@examsphere.edu', password: 'wrongpassword' });
      console.error('❌ Wrong password was incorrectly allowed!');
    } catch (err) {
      console.log(' Correctly rejected wrong password:', err.message);
    }
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    process.exit(0);
  }
}

testLogins();
