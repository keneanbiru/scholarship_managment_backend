import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const base = 'http://localhost:3000';
const now = Date.now();

const creds = {
  admin: { email: `admin_m34_${now}@example.com`, password: 'AdminPass123!' },
  owner: { email: `owner_m34_${now}@example.com`, password: 'OwnerPass123!' },
  manager1: { email: `manager1_m34_${now}@example.com`, password: 'ManagerPass123!' },
  manager2: { email: `manager2_m34_${now}@example.com`, password: 'ManagerPass123!' },
  student: { email: `student_m34_${now}@example.com`, password: 'StudentPass123!' }
};

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

const requestJson = async (method, url, body, token) => {
  const response = await fetch(`${base}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const parsed = await response.json().catch(() => ({}));
  return { status: response.status, body: parsed };
};

const requestMultipart = async (url, formData, token) => {
  const response = await fetch(`${base}${url}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });
  const parsed = await response.json().catch(() => ({}));
  return { status: response.status, body: parsed };
};

const createUser = async ({ email, password, role, createdById = null }) => {
  const hash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      role,
      isActive: true,
      ...(createdById ? { createdById } : {})
    }
  });
};

const loginGetToken = async ({ email, password }) => {
  const resp = await requestJson('POST', '/api/auth/login', { email, password });
  return { response: resp, token: resp.body?.data?.token };
};

const run = async () => {
  const admin = await createUser({ ...creds.admin, role: 'ADMIN' });
  const owner = await createUser({ ...creds.owner, role: 'OWNER', createdById: admin.id });
  const manager1 = await createUser({ ...creds.manager1, role: 'MANAGER', createdById: owner.id });
  const manager2 = await createUser({ ...creds.manager2, role: 'MANAGER', createdById: owner.id });
  const student = await createUser({ ...creds.student, role: 'STUDENT' });

  const adminLogin = await loginGetToken(creds.admin);
  const ownerLogin = await loginGetToken(creds.owner);
  const manager1Login = await loginGetToken(creds.manager1);
  const manager2Login = await loginGetToken(creds.manager2);
  const studentLogin = await loginGetToken(creds.student);

  check('admin login', adminLogin.response.status === 200, `status=${adminLogin.response.status}`);
  check('owner login', ownerLogin.response.status === 200, `status=${ownerLogin.response.status}`);
  check('manager1 login', manager1Login.response.status === 200, `status=${manager1Login.response.status}`);
  check('manager2 login', manager2Login.response.status === 200, `status=${manager2Login.response.status}`);
  check('student login', studentLogin.response.status === 200, `status=${studentLogin.response.status}`);

  const adminToken = adminLogin.token;
  const ownerToken = ownerLogin.token;
  const manager1Token = manager1Login.token;
  const manager2Token = manager2Login.token;
  const studentToken = studentLogin.token;

  // Milestone 3 endpoints
  const adminDashboard = await requestJson('GET', '/api/admin/dashboard', null, adminToken);
  const adminStats = await requestJson('GET', '/api/admin/statistics', null, adminToken);
  const adminUsers = await requestJson('GET', '/api/admin/users?page=1&limit=5', null, adminToken);
  const adminAudit = await requestJson('GET', '/api/admin/audit-logs?page=1&limit=5', null, adminToken);
  check('M3 admin dashboard works', adminDashboard.status === 200, `status=${adminDashboard.status}`);
  check('M3 admin statistics works', adminStats.status === 200, `status=${adminStats.status}`);
  check('M3 admin users works', adminUsers.status === 200, `status=${adminUsers.status}`);
  check('M3 admin audit logs works', adminAudit.status === 200, `status=${adminAudit.status}`);

  const studentAdminForbidden = await requestJson('GET', '/api/admin/dashboard', null, studentToken);
  check('M3 student blocked from admin dashboard', studentAdminForbidden.status === 403, `status=${studentAdminForbidden.status}`);

  const ownerDashboard = await requestJson('GET', '/api/owner/dashboard', null, ownerToken);
  const ownerStats = await requestJson('GET', '/api/owner/statistics', null, ownerToken);
  check('M3 owner dashboard works', ownerDashboard.status === 200, `status=${ownerDashboard.status}`);
  check('M3 owner statistics works', ownerStats.status === 200, `status=${ownerStats.status}`);

  const managerOwnerForbidden = await requestJson('GET', '/api/owner/dashboard', null, manager1Token);
  check('M3 manager blocked from owner dashboard', managerOwnerForbidden.status === 403, `status=${managerOwnerForbidden.status}`);

  // Milestone 4 endpoints
  const scholarshipPayload = {
    title: 'Global STEM Grant',
    provider: 'A2SV Foundation',
    country: 'Ethiopia',
    targetEducationLevels: ['BACHELOR'],
    scholarshipType: 'STEM',
    fieldOfStudy: 'Computer Science',
    fundingType: 'FULLY_FUNDED',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    officialLink: 'https://example.org/stem-grant',
    description: 'Scholarship for high-performing students',
    status: 'DRAFT'
  };

  const createByManager = await requestJson('POST', '/api/scholarships', scholarshipPayload, manager1Token);
  check('M4 manager create scholarship', createByManager.status === 201, `status=${createByManager.status}`);
  const scholarshipId = createByManager.body?.data?.scholarship?.id;

  const createByStudentForbidden = await requestJson('POST', '/api/scholarships', scholarshipPayload, studentToken);
  check('M4 student blocked from create', createByStudentForbidden.status === 403, `status=${createByStudentForbidden.status}`);

  const updateOwnByManager = await requestJson('PUT', `/api/scholarships/${scholarshipId}`, { title: 'Global STEM Grant Updated' }, manager1Token);
  check('M4 manager updates own scholarship', updateOwnByManager.status === 200, `status=${updateOwnByManager.status}`);

  const updateOtherByManagerForbidden = await requestJson('PUT', `/api/scholarships/${scholarshipId}`, { title: 'Hacked Title' }, manager2Token);
  check('M4 manager blocked updating others scholarship', updateOtherByManagerForbidden.status === 403, `status=${updateOtherByManagerForbidden.status}`);

  const updateAnyByAdmin = await requestJson('PUT', `/api/scholarships/${scholarshipId}`, { status: 'PENDING' }, adminToken);
  check('M4 admin updates scholarship', updateAnyByAdmin.status === 200, `status=${updateAnyByAdmin.status}`);

  const getById = await requestJson('GET', `/api/scholarships/${scholarshipId}`);
  check('M4 get scholarship by id', getById.status === 200, `status=${getById.status}`);

  const listAll = await requestJson('GET', '/api/scholarships?page=1&limit=10');
  check('M4 list scholarships', listAll.status === 200, `status=${listAll.status}`);

  const listMyManager = await requestJson('GET', '/api/scholarships/my-scholarships?page=1&limit=10', null, manager1Token);
  const listMyOwner = await requestJson('GET', '/api/scholarships/my-scholarships?page=1&limit=10', null, ownerToken);
  check('M4 manager my-scholarships', listMyManager.status === 200, `status=${listMyManager.status}`);
  check('M4 owner my-scholarships', listMyOwner.status === 200, `status=${listMyOwner.status}`);

  const form = new FormData();
  form.append('file', new Blob(['hello scholarship'], { type: 'text/plain' }), 'note.txt');
  const uploadDoc = await requestMultipart(`/api/scholarships/${scholarshipId}/documents`, form, manager1Token);
  check('M4 upload scholarship document', uploadDoc.status === 201, `status=${uploadDoc.status}`);

  const deleteOtherByManagerForbidden = await requestJson('DELETE', `/api/scholarships/${scholarshipId}`, null, manager2Token);
  check('M4 manager blocked deleting others scholarship', deleteOtherByManagerForbidden.status === 403, `status=${deleteOtherByManagerForbidden.status}`);

  const deleteByAdmin = await requestJson('DELETE', `/api/scholarships/${scholarshipId}`, null, adminToken);
  check('M4 admin deletes scholarship', deleteByAdmin.status === 200, `status=${deleteByAdmin.status}`);

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed }, null, 2));
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

