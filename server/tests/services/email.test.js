import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock SendGrid before importing
jest.unstable_mockModule('@sendgrid/mail', () => ({
  default: {
    setApiKey: jest.fn(),
    send: jest.fn()
  },
  setApiKey: jest.fn(),
  send: jest.fn()
}));

const sgMail = await import('@sendgrid/mail');
const { sendPasswordResetEmail } = await import('../../services/email.js');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPasswordResetEmail', () => {
    it('should return simulated success when SendGrid is not configured', async () => {
      const originalKey = process.env.SENDGRID_API_KEY;
      process.env.SENDGRID_API_KEY = 'your-sendgrid-api-key-here';

      const result = await sendPasswordResetEmail(
        'test@example.com',
        'reset-token-123',
        'John'
      );

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.resetUrl).toContain('reset-token-123');
      expect(sgMail.default.send).not.toHaveBeenCalled();

      process.env.SENDGRID_API_KEY = originalKey;
    });

    it('should call SendGrid when properly configured', async () => {
      const originalKey = process.env.SENDGRID_API_KEY;
      process.env.SENDGRID_API_KEY = 'SG.valid-api-key';
      sgMail.default.send.mockResolvedValue([{ statusCode: 202 }]);

      const result = await sendPasswordResetEmail(
        'test@example.com',
        'reset-token-456',
        'Jane'
      );

      expect(result.success).toBe(true);
      expect(sgMail.default.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('איפוס סיסמה')
        })
      );

      process.env.SENDGRID_API_KEY = originalKey;
    });

    it('should include correct reset URL in email', async () => {
      const originalKey = process.env.SENDGRID_API_KEY;
      process.env.SENDGRID_API_KEY = 'SG.valid-api-key';
      sgMail.default.send.mockResolvedValue([{ statusCode: 202 }]);

      await sendPasswordResetEmail(
        'test@example.com',
        'my-reset-token',
        'TestUser'
      );

      const callArg = sgMail.default.send.mock.calls[0][0];
      expect(callArg.html).toContain('my-reset-token');
      expect(callArg.html).toContain(process.env.FRONTEND_URL);

      process.env.SENDGRID_API_KEY = originalKey;
    });

    it('should include user first name in email', async () => {
      const originalKey = process.env.SENDGRID_API_KEY;
      process.env.SENDGRID_API_KEY = 'SG.valid-api-key';
      sgMail.default.send.mockResolvedValue([{ statusCode: 202 }]);

      await sendPasswordResetEmail(
        'test@example.com',
        'token',
        'שלום'
      );

      const callArg = sgMail.default.send.mock.calls[0][0];
      expect(callArg.html).toContain('שלום');

      process.env.SENDGRID_API_KEY = originalKey;
    });

    it('should throw error when SendGrid fails', async () => {
      const originalKey = process.env.SENDGRID_API_KEY;
      process.env.SENDGRID_API_KEY = 'SG.valid-api-key';
      sgMail.default.send.mockRejectedValue(new Error('SendGrid error'));

      await expect(
        sendPasswordResetEmail('test@example.com', 'token', 'User')
      ).rejects.toThrow('שגיאה בשליחת אימייל');

      process.env.SENDGRID_API_KEY = originalKey;
    });
  });
});
