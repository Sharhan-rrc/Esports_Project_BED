/**
 * Jest setup file - Runs before each test
 * Path: tests/jest.setup.ts
 */

// Mock Firebase for all tests
jest.mock("../src/config/firebaseConfig", () => ({
  auth: {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    createUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    updateUser: jest.fn(),
  },
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    add: jest.fn(),
    where: jest.fn().mockReturnThis(),
    runTransaction: jest.fn(),
    batch: jest.fn(),
  },
}));

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  jest.resetModules();
});