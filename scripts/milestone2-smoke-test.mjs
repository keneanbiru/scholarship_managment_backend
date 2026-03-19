import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const base = 'http://localhost:3000';

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

const now = Date.now();
const adminEmail = `admin_m2_${now}@example.com`;
const adminPassword = 'AdminPass123!';
const ownerEmail = `owner_m2_${now}@example.com`;
const ownerPassword = 'OwnerPass123!';
const managerEmail = `manager_m2_${now}@example.com`;
const managerPassword = 'ManagerPass123!';
const studentEmail = `student_m2_${now}@example.com`;
const studentPassword = 'StudentPass123!';

const ensureAdmin = async () => {
  const hash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: hash,
      role: 'ADMIN',
      isActive: true
    }
  });
  return admin;
};

const run = async () => {
  const out = {};
  await ensureAdmin();

  out.loginAdmin = await requestJson('POST', '/api/auth/login', {
    email: adminEmail,
    password: adminPassword
  });
  const adminToken = out.loginAdmin.body?.data?.token;

  out.createOwner = await requestJson(
    'POST',
    '/api/users/owners',
    { email: ownerEmail, password: ownerPassword },
    adminToken
  );

  out.loginOwner = await requestJson('POST', '/api/auth/login', {
    email: ownerEmail,
    password: ownerPassword
  });
  const ownerToken = out.loginOwner.body?.data?.token;

  out.createManager = await requestJson(
    'POST',
    '/api/users/managers',
    { email: managerEmail, password: managerPassword },
    ownerToken
  );

  out.ownerListUsers = await requestJson('GET', '/api/users?page=1&limit=10', null, ownerToken);

  out.registerStudent = await requestJson('POST', '/api/auth/register', {
    email: studentEmail,
    password: studentPassword
  });

  out.loginStudent = await requestJson('POST', '/api/auth/login', {
    email: studentEmail,
    password: studentPassword
  });
  const studentToken = out.loginStudent.body?.data?.token;

  out.studentCreateProfile = await requestJson(
    'POST',
    '/api/profile',
    {
      fullName: 'Test Student',
      university: 'N/A',
      fieldOfStudy: 'General Studies',
      currentEducationLevel: 'HIGH_SCHOOL',
      targetEducationLevels: ['BACHELOR'],
      gpa: 3.5,
      country: 'Ethiopia',
      preferredLang: 'English'
    },
    studentToken
  );

  out.studentGetProfile = await requestJson('GET', '/api/profile', null, studentToken);
  out.studentUpdateProfile = await requestJson(
    'PUT',
    '/api/profile',
    { gpa: 3.8, preferredLang: 'Amharic' },
    studentToken
  );

  out.studentListUsersForbidden = await requestJson('GET', '/api/users', null, studentToken);

  console.log(JSON.stringify(out, null, 2));
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

