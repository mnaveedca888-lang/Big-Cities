import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthService from '../auth/auth.service';
import registerUserRoutes from './user.controller';
import registerUserProfileRoutes from './user.profile.controller';

const userId = 'user-1';
const eventId = 'event-1';
const staleSavedEvent = {
  id: '060ba22d-cf22-47ca-a079-390aff77d821',
  userId,
  eventId: '123e4567-e89b-12d3-a456-426614174000',
  createdAt: new Date('2026-08-03T12:45:41.855Z'),
};

const routeRegistrars = [
  ['user routes', registerUserRoutes],
  ['user profile routes', registerUserProfileRoutes],
] as const;

function setup(registerRoutes: (app: any, prisma: any) => void) {
  const handlers = new Map<string, (request: any, reply: any) => Promise<unknown>>();
  const app: any = {
    get: (path: string, handler: (request: any, reply: any) => Promise<unknown>) => handlers.set(`GET ${path}`, handler),
    post: (path: string, handler: (request: any, reply: any) => Promise<unknown>) => handlers.set(`POST ${path}`, handler),
    patch: (path: string, handler: (request: any, reply: any) => Promise<unknown>) => handlers.set(`PATCH ${path}`, handler),
    delete: (path: string, handler: (request: any, reply: any) => Promise<unknown>) => handlers.set(`DELETE ${path}`, handler),
    log: { warn: vi.fn() },
  };
  const prisma: any = {
    event: { findUnique: vi.fn() },
    savedEvent: {
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
  vi.spyOn(AuthService.prototype, 'verifyAccessToken').mockResolvedValue(userId);
  registerRoutes(app, prisma);

  function makeReply() {
    const reply: any = {
      statusCode: 200,
      payload: undefined,
      code(statusCode: number) {
        this.statusCode = statusCode;
        return this;
      },
      send(payload?: unknown) {
        this.payload = payload;
        return this;
      },
    };
    return reply;
  }

  return { handlers, prisma, makeReply };
}

afterEach(() => vi.restoreAllMocks());

describe.each(routeRegistrars)('%s saved-event routes', (_label, registerRoutes) => {
  it('saves an existing event', async () => {
    const { handlers, prisma, makeReply } = setup(registerRoutes);
    const saved = { id: 'saved-1', userId, eventId };
    prisma.event.findUnique.mockResolvedValue({ id: eventId });
    prisma.savedEvent.upsert.mockResolvedValue(saved);
    const reply = makeReply();

    await handlers.get('POST /users/me/saved-events')!(
      { headers: { authorization: 'Bearer test-token' }, body: { eventId } },
      reply,
    );

    expect(prisma.event.findUnique).toHaveBeenCalledWith({ where: { id: eventId }, select: { id: true } });
    expect(prisma.savedEvent.upsert).toHaveBeenCalledWith({
      where: { userId_eventId: { userId, eventId } },
      update: {},
      create: { userId, eventId },
    });
    expect(reply.statusCode).toBe(201);
    expect(reply.payload).toEqual({ success: true, data: saved });
  });

  it('rejects an event ID that does not exist', async () => {
    const { handlers, prisma, makeReply } = setup(registerRoutes);
    prisma.event.findUnique.mockResolvedValue(null);
    const reply = makeReply();

    await handlers.get('POST /users/me/saved-events')!(
      { headers: { authorization: 'Bearer test-token' }, body: { eventId } },
      reply,
    );

    expect(reply.statusCode).toBe(404);
    expect(reply.payload).toEqual({ success: false, error: { message: 'Not found' } });
    expect(prisma.savedEvent.upsert).not.toHaveBeenCalled();
  });

  it('returns an existing stale saved reference without deleting or resolving it', async () => {
    const { handlers, prisma, makeReply } = setup(registerRoutes);
    prisma.savedEvent.findMany.mockResolvedValue([staleSavedEvent]);
    prisma.savedEvent.count.mockResolvedValue(1);
    const reply = makeReply();

    await handlers.get('GET /users/me/saved-events')!(
      { headers: { authorization: 'Bearer test-token' }, query: {} },
      reply,
    );

    expect(reply.statusCode).toBe(200);
    expect(reply.payload.data.items).toEqual([staleSavedEvent]);
    expect(reply.payload.data.pagination.total).toBe(1);
    expect(prisma.event.findUnique).not.toHaveBeenCalled();
    expect(prisma.savedEvent.deleteMany).not.toHaveBeenCalled();
  });
});
