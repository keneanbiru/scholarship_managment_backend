import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const base = 'http://localhost:3000';
const now = Date.now();

const req = async (method, url, body, token) => {
  const res = await fetch(`${base}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
};

const createUser = async (email, password, role, createdById) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      isActive: true,
      ...(createdById ? { createdById } : {})
    }
  });
};

try {
  const adminPass = 'AdminPass123!';
  const ownerPass = 'OwnerPass123!';
  const mgrPass = 'ManagerPass123!';
  const admin = await createUser(`admdbg_${now}@ex.com`, adminPass, 'ADMIN');
  const owner = await createUser(`owndbg_${now}@ex.com`, ownerPass, 'OWNER', admin.id);
  await createUser(`mgrdbg_${now}@ex.com`, mgrPass, 'MANAGER', owner.id);

  const adminLogin = await req('POST', '/api/auth/login', { email: admin.email, password: adminPass });
  const ownerLogin = await req('POST', '/api/auth/login', { email: owner.email, password: ownerPass });
  const mgrLogin = await req('POST', '/api/auth/login', { email: `mgrdbg_${now}@ex.com`, password: mgrPass });

  const adminToken = adminLogin.body?.data?.token;
  const ownerToken = ownerLogin.body?.data?.token;
  const mgrToken = mgrLogin.body?.data?.token;

  const dash = await req('GET', '/api/admin/dashboard', null, adminToken);
  const stats = await req('GET', '/api/admin/statistics', null, adminToken);
  const audit = await req('GET', '/api/admin/audit-logs?page=1&limit=5', null, adminToken);
  const ownerDash = await req('GET', '/api/owner/dashboard', null, ownerToken);

  const payload = {
    title: 'Debug Scholarship',
    provider: 'Debug Org',
    country: 'Ethiopia',
    targetEducationLevels: ['BACHELOR'],
    scholarshipType: 'STEM',
    fieldOfStudy: 'Computer Science',
    fundingType: 'FULLY_FUNDED',
    deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
    officialLink: 'https://example.org',
    description: 'Debug description',
    status: 'DRAFT'
  };
  const create = await req('POST', '/api/scholarships', payload, mgrToken);

  console.log(JSON.stringify({
    adminDashboard: dash,
    adminStatistics: stats,
    adminAuditLogs: audit,
    ownerDashboard: ownerDash,
    createScholarship: create
  }, null, 2));
} finally {
  await prisma.$disconnect();
}

