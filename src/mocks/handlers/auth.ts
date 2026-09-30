import { http, HttpResponse } from 'msw';
import { seedUsers, seedProfiles } from '../data/users';
import { seedClubMemberships } from '../data/clubs';
import { mockDelay } from '../utils';

export const authHandlers = [
  http.post('/api/v1/auth/login', async ({ request }) => {
    await mockDelay();
    const body = (await request.json()) as { email?: string; password?: string };
    const user = seedUsers.find((u) => u.email === body.email && u.password === body.password);

    if (!user) {
      return HttpResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng' } },
        { status: 401 }
      );
    }

    if (user.status === 'locked') {
      return HttpResponse.json(
        { error: { code: 'ACCOUNT_LOCKED', message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên' } },
        { status: 423 }
      );
    }

    if (user.status === 'unverified') {
      return HttpResponse.json(
        { error: { code: 'EMAIL_UNVERIFIED', message: 'Tài khoản chưa được xác minh email' } },
        { status: 403 }
      );
    }

    const { password: _, ...safeUser } = user;
    const userMemberships = seedClubMemberships.filter((m) => m.userId === user.id);

    return HttpResponse.json({
      data: {
        user: safeUser,
        token: `mock_jwt_token_${user.id}`,
        memberships: userMemberships,
      },
    });
  }),

  http.post('/api/v1/auth/google/mock', async () => {
    await mockDelay();
    const user = seedUsers.find((u) => u.id === 'usr_student_01') || seedUsers[0];
    const { password: _, ...safeUser } = user;
    const userMemberships = seedClubMemberships.filter((m) => m.userId === user.id);

    return HttpResponse.json({
      data: {
        user: safeUser,
        token: `mock_jwt_token_${user.id}`,
        memberships: userMemberships,
        isNewUser: false,
      },
    });
  }),

  http.post('/api/v1/auth/register', async ({ request }) => {
    await mockDelay();
    const body = (await request.json()) as {
      fullName: string;
      email: string;
      school?: string;
      studentCode?: string;
      password: string;
    };

    if (seedUsers.some((u) => u.email === body.email)) {
      return HttpResponse.json(
        { error: { code: 'EMAIL_ALREADY_EXISTS', message: 'Email đã được sử dụng trong hệ thống' } },
        { status: 409 }
      );
    }

    const newUser: typeof seedUsers[0] = {
      id: `usr_${Date.now()}`,
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      school: body.school || 'FPT University',
      studentCode: body.studentCode,
      roles: ['student'],
      status: 'unverified',
      createdAt: new Date().toISOString(),
    };

    seedUsers.push(newUser);
    const { password: _, ...safeUser } = newUser;

    return HttpResponse.json({ data: safeUser });
  }),

  http.post('/api/v1/auth/verify-email', async ({ request }) => {
    await mockDelay();
    const body = (await request.json()) as { token: string; email?: string };

    if (body.email) {
      const user = seedUsers.find((u) => u.email === body.email);
      if (user) {
        user.status = 'active';
      }
    }

    return HttpResponse.json({ data: { status: 'verified' } });
  }),

  http.post('/api/v1/auth/forgot-password', async () => {
    await mockDelay();
    return HttpResponse.json({ data: { message: 'Đã gửi hướng dẫn đặt lại mật khẩu' } });
  }),

  http.post('/api/v1/auth/reset-password', async () => {
    await mockDelay();
    return HttpResponse.json({ data: { message: 'Đặt lại mật khẩu thành công' } });
  }),

  http.get('/api/v1/auth/me', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } },
        { status: 401 }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('mock_jwt_token_', '');
    const user = seedUsers.find((u) => u.id === userId);

    if (!user) {
      return HttpResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng' } },
        { status: 404 }
      );
    }

    const { password: _, ...safeUser } = user;
    const profile = seedProfiles[user.id];
    const userMemberships = seedClubMemberships.filter((m) => m.userId === user.id);

    return HttpResponse.json({
      data: {
        user: safeUser,
        profile,
        memberships: userMemberships,
      },
    });
  }),
];
