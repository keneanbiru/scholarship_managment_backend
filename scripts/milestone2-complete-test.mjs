import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const base = 'http://localhost:3000';

const now = Date.now();
const adminEmail = `admin_m2c_${now}@example.com`;
const adminPassword = 'AdminPass123!';
const ownerEmail = `owner_m2c_${now}@example.com`;
const ownerPassword = 'OwnerPass123!';
const managerEmail = `manager_m2c_${now}@example.com`;
const managerPassword = 'ManagerPass123!';
const studentEmail = `student_m2c_${now}@example.com`;
const studentPassword = 'StudentPass123!';
const student2Email = `student2_m2c_${now}@example.com`;
const student2Password = 'Student2Pass123!';

const result = [];

const requestJson = async (method, url, body, token) => {
  const response = await fetch(`${base}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, body: data };
};

const check = (name, condition, details = '') => {
  result.push({ name, ok: !!condition, details });
};

const run = async () => {
  const hash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: hash,
      role: 'ADMIN',
      isActive: true
    }
  });

  const adminLogin = await requestJson('POST', '/api/auth/login', {
    email: adminEmail,
    password: adminPassword
  });
  check('admin login', adminLogin.status === 200, `status=${adminLogin.status}`);
  const adminToken = adminLogin.body?.data?.token;

  const createOwner = await requestJson('POST', '/api/users/owners', {
    email: ownerEmail,
    password: ownerPassword
  }, adminToken);
  check('admin creates owner', createOwner.status === 201, `status=${createOwner.status}`);
  const ownerId = createOwner.body?.data?.user?.id;

  const ownerLogin = await requestJson('POST', '/api/auth/login', {
    email: ownerEmail,
    password: ownerPassword
  });
  check('owner login', ownerLogin.status === 200, `status=${ownerLogin.status}`);
  const ownerToken = ownerLogin.body?.data?.token;

  const createManager = await requestJson('POST', '/api/users/managers', {
    email: managerEmail,
    password: managerPassword
  }, ownerToken);
  check('owner creates manager', createManager.status === 201, `status=${createManager.status}`);
  const managerId = createManager.body?.data?.user?.id;

  const ownerCreateOwnerForbidden = await requestJson('POST', '/api/users/owners', {
    email: `x_${now}@example.com`,
    password: 'Xpass1234!'
  }, ownerToken);
  check('owner cannot create owner', ownerCreateOwnerForbidden.status === 403, `status=${ownerCreateOwnerForbidden.status}`);

  const listUsersAdmin = await requestJson('GET', '/api/users?page=1&limit=5', null, adminToken);
  check('admin list users', listUsersAdmin.status === 200, `status=${listUsersAdmin.status}`);

  const listUsersOwner = await requestJson('GET', '/api/users?page=1&limit=10', null, ownerToken);
  check('owner list users', listUsersOwner.status === 200, `status=${listUsersOwner.status}`);
  const ownerScopedUsers = listUsersOwner.body?.data?.users || [];
  check(
    'owner list users are scoped',
    ownerScopedUsers.every((u) => u.createdById === ownerId),
    `count=${ownerScopedUsers.length}`
  );

  const ownerSearchUser = await requestJson('GET', `/api/users?search=${encodeURIComponent('manager_m2c_')}`, null, ownerToken);
  check('owner search users', ownerSearchUser.status === 200, `status=${ownerSearchUser.status}`);

  const adminGetManager = await requestJson('GET', `/api/users/${managerId}`, null, adminToken);
  check('admin get user by id', adminGetManager.status === 200, `status=${adminGetManager.status}`);

  const ownerGetManager = await requestJson('GET', `/api/users/${managerId}`, null, ownerToken);
  check('owner get scoped user by id', ownerGetManager.status === 200, `status=${ownerGetManager.status}`);

  const ownerGetAdminForbidden = await requestJson('GET', `/api/users/${admin.id}`, null, ownerToken);
  check('owner cannot get admin user', ownerGetAdminForbidden.status === 403, `status=${ownerGetAdminForbidden.status}`);

  const registerStudent = await requestJson('POST', '/api/auth/register', {
    email: studentEmail,
    password: studentPassword
  });
  check('student register', registerStudent.status === 201, `status=${registerStudent.status}`);
  const studentId = registerStudent.body?.data?.user?.id;

  const loginStudent = await requestJson('POST', '/api/auth/login', {
    email: studentEmail,
    password: studentPassword
  });
  check('student login', loginStudent.status === 200, `status=${loginStudent.status}`);
  const studentToken = loginStudent.body?.data?.token;

  const studentGetSelf = await requestJson('GET', `/api/users/${studentId}`, null, studentToken);
  check('student get own user by id', studentGetSelf.status === 200, `status=${studentGetSelf.status}`);

  const studentGetOtherForbidden = await requestJson('GET', `/api/users/${managerId}`, null, studentToken);
  check('student cannot get another user', studentGetOtherForbidden.status === 403, `status=${studentGetOtherForbidden.status}`);

  const studentSelfUpdate = await requestJson('PUT', `/api/users/${studentId}`, {
    email: `updated_${studentEmail}`
  }, studentToken);
  check('student update self', studentSelfUpdate.status === 200, `status=${studentSelfUpdate.status}`);

  const studentUpdateOtherForbidden = await requestJson('PUT', `/api/users/${managerId}`, {
    email: `bad_${managerEmail}`
  }, studentToken);
  check('student cannot update other user', studentUpdateOtherForbidden.status === 403, `status=${studentUpdateOtherForbidden.status}`);

  const ownerDeactivateManager = await requestJson('PUT', `/api/users/${managerId}/activate`, {
    isActive: false
  }, ownerToken);
  check('owner deactivates scoped manager', ownerDeactivateManager.status === 200, `status=${ownerDeactivateManager.status}`);

  const managerLoginAfterDeactivate = await requestJson('POST', '/api/auth/login', {
    email: managerEmail,
    password: managerPassword
  });
  check('deactivated manager cannot login', managerLoginAfterDeactivate.status === 401, `status=${managerLoginAfterDeactivate.status}`);

  const ownerReactivateManager = await requestJson('PUT', `/api/users/${managerId}/activate`, {
    isActive: true
  }, ownerToken);
  check('owner reactivates scoped manager', ownerReactivateManager.status === 200, `status=${ownerReactivateManager.status}`);

  const managerLoginAfterReactivate = await requestJson('POST', '/api/auth/login', {
    email: managerEmail,
    password: managerPassword
  });
  check('reactivated manager can login', managerLoginAfterReactivate.status === 200, `status=${managerLoginAfterReactivate.status}`);
  const managerToken = managerLoginAfterReactivate.body?.data?.token;

  const ownerRoleChangeManagerToStudent = await requestJson('PUT', `/api/users/${managerId}/role`, {
    role: 'STUDENT'
  }, ownerToken);
  check('owner changes manager role to student', ownerRoleChangeManagerToStudent.status === 200, `status=${ownerRoleChangeManagerToStudent.status}`);

  const ownerRoleChangeToOwnerForbidden = await requestJson('PUT', `/api/users/${managerId}/role`, {
    role: 'OWNER'
  }, ownerToken);
  check('owner cannot assign OWNER role', ownerRoleChangeToOwnerForbidden.status === 403, `status=${ownerRoleChangeToOwnerForbidden.status}`);

  const adminRoleChangeStudentToManager = await requestJson('PUT', `/api/users/${studentId}/role`, {
    role: 'MANAGER'
  }, adminToken);
  check('admin changes user role', adminRoleChangeStudentToManager.status === 200, `status=${adminRoleChangeStudentToManager.status}`);

  const adminDeactivateStudent = await requestJson('DELETE', `/api/users/${studentId}`, null, adminToken);
  check('admin deactivates user via delete endpoint', adminDeactivateStudent.status === 200, `status=${adminDeactivateStudent.status}`);

  const studentLoginAfterDelete = await requestJson('POST', '/api/auth/login', {
    email: `updated_${studentEmail}`,
    password: studentPassword
  });
  check('deactivated student cannot login', studentLoginAfterDelete.status === 401, `status=${studentLoginAfterDelete.status}`);

  const registerStudent2 = await requestJson('POST', '/api/auth/register', {
    email: student2Email,
    password: student2Password
  });
  check('student2 register', registerStudent2.status === 201, `status=${registerStudent2.status}`);

  const loginStudent2 = await requestJson('POST', '/api/auth/login', {
    email: student2Email,
    password: student2Password
  });
  check('student2 login', loginStudent2.status === 200, `status=${loginStudent2.status}`);
  const student2Token = loginStudent2.body?.data?.token;

  const createProfile = await requestJson('POST', '/api/profile', {
    fullName: 'Student Two',
    university: 'N/A',
    fieldOfStudy: 'Natural Science',
    currentEducationLevel: 'HIGH_SCHOOL',
    targetEducationLevels: ['BACHELOR'],
    gpa: 3.2,
    country: 'Ethiopia',
    preferredLang: 'English'
  }, student2Token);
  check('student creates profile', createProfile.status === 201, `status=${createProfile.status}`);

  const duplicateProfile = await requestJson('POST', '/api/profile', {
    fullName: 'Student Two Dup',
    university: 'N/A',
    fieldOfStudy: 'Natural Science',
    currentEducationLevel: 'HIGH_SCHOOL',
    targetEducationLevels: ['BACHELOR'],
    gpa: 3.1,
    country: 'Ethiopia',
    preferredLang: 'English'
  }, student2Token);
  check('duplicate profile create blocked', duplicateProfile.status === 400, `status=${duplicateProfile.status}`);

  const getProfile = await requestJson('GET', '/api/profile', null, student2Token);
  check('student gets profile', getProfile.status === 200, `status=${getProfile.status}`);

  const updateProfile = await requestJson('PUT', '/api/profile', {
    gpa: 3.9,
    preferredLang: 'Amharic'
  }, student2Token);
  check('student updates profile', updateProfile.status === 200, `status=${updateProfile.status}`);

  const updateProfileInvalidGpa = await requestJson('PUT', '/api/profile', {
    gpa: 4.5
  }, student2Token);
  check('invalid GPA rejected', updateProfileInvalidGpa.status === 400, `status=${updateProfileInvalidGpa.status}`);

  const managerProfileForbidden = await requestJson('GET', '/api/profile', null, managerToken);
  check('non-student profile access forbidden', managerProfileForbidden.status === 403, `status=${managerProfileForbidden.status}`);

  const failed = result.filter((r) => !r.ok);
  console.log(JSON.stringify({ total: result.length, passed: result.length - failed.length, failed }, null, 2));
  if (failed.length > 0) {
    process.exitCode = 1;
  }
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

