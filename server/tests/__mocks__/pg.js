// Mock pg module for testing
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockRelease = jest.fn();
const mockEnd = jest.fn();

const mockClient = {
  query: mockQuery,
  release: mockRelease
};

const mockPool = {
  query: mockQuery,
  connect: mockConnect.mockResolvedValue(mockClient),
  end: mockEnd
};

class Pool {
  constructor() {
    return mockPool;
  }
}

export { Pool };
export default { Pool };

// Export mock functions for test manipulation
export const __mockQuery = mockQuery;
export const __mockConnect = mockConnect;
export const __mockRelease = mockRelease;
export const __mockPool = mockPool;
export const __mockClient = mockClient;
export const __resetMocks = () => {
  mockQuery.mockReset();
  mockConnect.mockReset().mockResolvedValue(mockClient);
  mockRelease.mockReset();
  mockEnd.mockReset();
};
