import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const base = 'http://localhost:3000';
const now = Date.now();

const users = {
  admin: { email: `admin_m5_${now}@example.com`, password: 'AdminPass123!', role: 'ADMIN' },
  owner: { email: `owner_m5_${now}@example.com`, password: 'OwnerPass123!', role: 'OWNER' },
  manager: { email: `manager_m5_${now}@example.com`, password: 'ManagerPass123!', role: 'MANAGER' },
  student: { email: `student_m5_${now}@example.com`, password: 'StudentPass123!', role: 'STUDENT' }
};

const checks = [];
const check = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail });

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

const createUser = async ({ email, password, role, createdById = null }) => {
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

const login = async ({ email, password }) => {
  const r = await req('POST', '/api/auth/login', { email, password });
  return { response: r, token: r.body?.data?.token };
};

const run = async () => {
  const admin = await createUser(users.admin);
  const owner = await createUser({ ...users.owner, createdById: admin.id });
  const manager = await createUser({ ...users.manager, createdById: owner.id });
  await createUser(users.student);

  const adminLogin = await login(users.admin);
  const managerLogin = await login(users.manager);
  const studentLogin = await login(users.student);
  const adminToken = adminLogin.token;
  const managerToken = managerLogin.token;
  const studentToken = studentLogin.token;

  check('login admin', adminLogin.response.status === 200, `status=${adminLogin.response.status}`);
  check('login manager', managerLogin.response.status === 200, `status=${managerLogin.response.status}`);
  check('login student', studentLogin.response.status === 200, `status=${studentLogin.response.status}`);

  const createScholarship = await req('POST', '/api/scholarships', {
    title: 'M5 Workflow Scholarship',
    provider: 'Workflow Org',
    country: 'Ethiopia',
    targetEducationLevels: ['BACHELOR'],
    scholarshipType: 'STEM',
    fieldOfStudy: 'Computer Science',
    fundingType: 'FULLY_FUNDED',
    deadline: new Date(Date.now() + 86400000 * 20).toISOString(),
    officialLink: 'https://example.org/m5',
    description: 'For milestone 5 verification workflow',
    status: 'DRAFT'
  }, managerToken);
  check('manager creates draft scholarship', createScholarship.status === 201, `status=${createScholarship.status}`);
  const scholarshipId = createScholarship.body?.data?.scholarship?.id;

  const pendingListBeforeSubmit = await req('GET', '/api/admin/scholarships/pending?page=1&limit=20', null, adminToken);
  check('admin pending list endpoint works', pendingListBeforeSubmit.status === 200, `status=${pendingListBeforeSubmit.status}`);

  const submitForReview = await req('PUT', `/api/scholarships/${scholarshipId}/submit`, null, managerToken);
  check('manager submits scholarship for review', submitForReview.status === 200, `status=${submitForReview.status}`);
  check(
    'submitted status is pending',
    submitForReview.body?.data?.scholarship?.status === 'PENDING',
    `statusValue=${submitForReview.body?.data?.scholarship?.status}`
  );

  const pendingListAfterSubmit = await req('GET', '/api/admin/scholarships/pending?page=1&limit=20', null, adminToken);
  const pendingItems = pendingListAfterSubmit.body?.data?.items || [];
  check(
    'pending queue contains submitted scholarship',
    pendingListAfterSubmit.status === 200 && pendingItems.some((s) => s.id === scholarshipId),
    `status=${pendingListAfterSubmit.status}`
  );

  const studentListDefault = await req('GET', '/api/scholarships?page=1&limit=20', null, studentToken);
  const studentVisibleBeforeVerify = (studentListDefault.body?.data?.items || []).some((s) => s.id === scholarshipId);
  check('students do not see non-verified by default', studentListDefault.status === 200 && !studentVisibleBeforeVerify, `status=${studentListDefault.status}`);

  const verifyScholarship = await req('PUT', `/api/admin/scholarships/${scholarshipId}/verify`, null, adminToken);
  check('admin verifies scholarship', verifyScholarship.status === 200, `status=${verifyScholarship.status}`);
  check(
    'verified status set',
    verifyScholarship.body?.data?.scholarship?.status === 'VERIFIED',
    `statusValue=${verifyScholarship.body?.data?.scholarship?.status}`
  );

  const studentListAfterVerify = await req('GET', '/api/scholarships?page=1&limit=20', null, studentToken);
  const studentVisibleAfterVerify = (studentListAfterVerify.body?.data?.items || []).some((s) => s.id === scholarshipId);
  check('students see verified scholarship by default', studentListAfterVerify.status === 200 && studentVisibleAfterVerify, `status=${studentListAfterVerify.status}`);

  const createScholarship2 = await req('POST', '/api/scholarships', {
    title: 'M5 Reject Scholarship',
    provider: 'Workflow Org',
    country: 'Ethiopia',
    targetEducationLevels: ['BACHELOR'],
    scholarshipType: 'RESEARCH',
    fieldOfStudy: 'Engineering',
    fundingType: 'PARTIALLY_FUNDED',
    deadline: new Date(Date.now() + 86400000 * 20).toISOString(),
    officialLink: 'https://example.org/m5-reject',
    description: 'For rejection test',
    status: 'PENDING'
  }, managerToken);
  const scholarship2Id = createScholarship2.body?.data?.scholarship?.id;
  check('manager creates pending scholarship for rejection', createScholarship2.status === 201, `status=${createScholarship2.status}`);

  const rejectScholarship = await req('PUT', `/api/admin/scholarships/${scholarship2Id}/reject`, { reason: 'Missing eligibility details' }, adminToken);
  check('admin rejects scholarship', rejectScholarship.status === 200, `status=${rejectScholarship.status}`);
  check('rejected status set', rejectScholarship.body?.data?.scholarship?.status === 'REJECTED', `statusValue=${rejectScholarship.body?.data?.scholarship?.status}`);

  const createScholarship3 = await req('POST', '/api/scholarships', {
    title: 'M5 Flag Scholarship',
    provider: 'Workflow Org',
    country: 'Ethiopia',
    targetEducationLevels: ['BACHELOR'],
    scholarshipType: 'COMMUNITY',
    fieldOfStudy: 'Social Studies',
    fundingType: 'SELF_FUNDED',
    deadline: new Date(Date.now() + 86400000 * 20).toISOString(),
    officialLink: 'https://example.org/m5-flag',
    description: 'For flagging test',
    status: 'PENDING'
  }, managerToken);
  const scholarship3Id = createScholarship3.body?.data?.scholarship?.id;
  check('manager creates pending scholarship for flagging', createScholarship3.status === 201, `status=${createScholarship3.status}`);

  const flagScholarship = await req('POST', `/api/admin/scholarships/${scholarship3Id}/flag`, { reason: 'Potential policy violation' }, adminToken);
  check('admin flags scholarship endpoint works', flagScholarship.status === 200, `status=${flagScholarship.status}`);
  check('flag sets rejected status', flagScholarship.body?.data?.scholarship?.status === 'REJECTED', `statusValue=${flagScholarship.body?.data?.scholarship?.status}`);

  const adminPendingAsStudentForbidden = await req('GET', '/api/admin/scholarships/pending', null, studentToken);
  check('student blocked from pending queue', adminPendingAsStudentForbidden.status === 403, `status=${adminPendingAsStudentForbidden.status}`);

  const managerVerifyForbidden = await req('PUT', `/api/admin/scholarships/${scholarshipId}/verify`, null, managerToken);
  check('manager blocked from verify endpoint', managerVerifyForbidden.status === 403, `status=${managerVerifyForbidden.status}`);

  // Expiry job core check (usecase side-effect): create already expired scholarship then run endpoint-like behavior via usecase is internal.
  const expiredScholarship = await prisma.scholarship.create({
    data: {
      title: 'Already expired',
      provider: 'Old Org',
      fieldOfStudy: 'History',
      officialLink: 'https://example.org/expired',
      description: 'Should auto-expire',
      scholarshipType: 'ACADEMIC',
      fundingType: 'FULLY_FUNDED',
      status: 'PENDING',
      deadline: new Date(Date.now() - 86400000),
      targetEducationLevels: ['BACHELOR'],
      country: 'Ethiopia',
      createdById: manager.id
    }
  });
  // Trigger one-time expiry check by importing usecase directly in test.
  const { ExpireScholarships } = await import('../src/usecases/scholarships/ExpireScholarships.js');
  const expiryUsecase = new ExpireScholarships();
  const expiryResult = await expiryUsecase.execute(new Date());
  const expiredAfterJob = await prisma.scholarship.findUnique({ where: { id: expiredScholarship.id } });
  check('expiry usecase marks past-deadline scholarships', expiryResult.expiredCount >= 1 && expiredAfterJob?.status === 'EXPIRED', `expiredCount=${expiryResult.expiredCount}`);

  const managerNotifications = await prisma.notification.findMany({
    where: { userId: manager.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  check('verification notifications created', managerNotifications.length > 0, `count=${managerNotifications.length}`);

  const failed = checks.filter((x) => !x.ok);
  console.log(JSON.stringify({ total: checks.length, passed: checks.length - failed.length, failed }, null, 2));
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

