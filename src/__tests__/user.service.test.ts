import { describe, it, expect, mock, beforeEach } from "bun:test";
import { UserService } from "../services/user.service";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUser = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  passwordHash: "hashed_password",
  role: "admin_export" as const,
  branchId: null,
  isActive: true,
  tokenVersion: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRepo() {
  return {
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(undefined as typeof mockUser | undefined)),
    findByEmail: mock(() => Promise.resolve(undefined as typeof mockUser | undefined)),
    findByRole: mock(() => Promise.resolve([])),
    findByBranch: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve(mockUser)),
    update: mock((_: number, data: any) => Promise.resolve({ ...mockUser, ...data })),
    incrementTokenVersion: mock(() => Promise.resolve()),
    deactivate: mock(() => Promise.resolve(mockUser)),
    delete: mock(() => Promise.resolve(mockUser)),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("UserService", () => {
  let repo: ReturnType<typeof makeRepo>;
  let service: UserService;

  beforeEach(() => {
    repo = makeRepo();
    service = new UserService(repo as any);
  });

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("returns all users from repo", async () => {
      repo.findAll = mock(() => Promise.resolve([mockUser]));
      expect(await service.getAll()).toEqual([mockUser]);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe("getById", () => {
    it("returns user when found", async () => {
      repo.findById = mock(() => Promise.resolve(mockUser));
      expect(await service.getById(1)).toEqual(mockUser);
    });

    it("throws when user not found", async () => {
      expect(service.getById(99)).rejects.toThrow("not found");
    });
  });

  // ── getByEmail ─────────────────────────────────────────────────────────────

  describe("getByEmail", () => {
    it("returns user when found by email", async () => {
      repo.findByEmail = mock(() => Promise.resolve(mockUser));
      expect(await service.getByEmail("john@example.com")).toEqual(mockUser);
    });

    it("throws when email not found", async () => {
      expect(service.getByEmail("nobody@example.com")).rejects.toThrow("not found");
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("creates user when email is unique", async () => {
      repo.findByEmail = mock(() => Promise.resolve(undefined));
      repo.create = mock(() => Promise.resolve(mockUser));

      const result = await service.create({ ...mockUser } as any);
      expect(result).toEqual(mockUser);
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it("throws when email already exists", async () => {
      repo.findByEmail = mock(() => Promise.resolve(mockUser));
      expect(service.create({ ...mockUser } as any)).rejects.toThrow("already exists");
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("throws when user not found", async () => {
      expect(service.update(99, { name: "New Name" })).rejects.toThrow("not found");
    });

    it("updates user and returns updated record", async () => {
      repo.findById = mock(() => Promise.resolve(mockUser));
      repo.findByEmail = mock(() => Promise.resolve(undefined));
      repo.update = mock(() => Promise.resolve({ ...mockUser, name: "New Name" }));

      const result = await service.update(1, { name: "New Name" });
      expect(result.name).toBe("New Name");
    });

    it("throws when updating email to one already taken by another user", async () => {
      const otherUser = { ...mockUser, id: 2, email: "other@example.com" };
      repo.findById = mock(() => Promise.resolve(mockUser));
      repo.findByEmail = mock(() => Promise.resolve(otherUser));

      expect(
        service.update(1, { email: "other@example.com" })
      ).rejects.toThrow("already taken");
    });

    it("allows updating email to same user's current email", async () => {
      repo.findById = mock(() => Promise.resolve(mockUser));
      repo.findByEmail = mock(() => Promise.resolve(mockUser)); // same user
      repo.update = mock(() => Promise.resolve(mockUser));

      const result = await service.update(1, { email: mockUser.email });
      expect(result).toEqual(mockUser);
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────────

  describe("logout", () => {
    it("throws when user not found", async () => {
      expect(service.logout(99)).rejects.toThrow("not found");
    });

    it("increments token version on logout", async () => {
      repo.findById = mock(() => Promise.resolve(mockUser));
      repo.incrementTokenVersion = mock(() => Promise.resolve());

      await service.logout(1);
      expect(repo.incrementTokenVersion).toHaveBeenCalledWith(1);
    });
  });

  // ── deactivate ─────────────────────────────────────────────────────────────

  describe("deactivate", () => {
    it("throws when user not found", async () => {
      expect(service.deactivate(99)).rejects.toThrow("not found");
    });

    it("deactivates user and returns record", async () => {
      repo.findById = mock(() => Promise.resolve(mockUser));
      const deactivated = { ...mockUser, isActive: false };
      repo.deactivate = mock(() => Promise.resolve(deactivated));

      const result = await service.deactivate(1);
      expect(result.isActive).toBe(false);
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe("delete", () => {
    it("throws when user not found", async () => {
      expect(service.delete(99)).rejects.toThrow("not found");
    });

    it("deletes and returns deleted user", async () => {
      repo.findById = mock(() => Promise.resolve(mockUser));
      repo.delete = mock(() => Promise.resolve(mockUser));

      const result = await service.delete(1);
      expect(result).toEqual(mockUser);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
