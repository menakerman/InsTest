import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your-sendgrid-api-key-here') {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export const sendPasswordResetEmail = async (email, token, firstName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@instest.local',
    subject: 'איפוס סיסמה - מערכת קורס מדריכי צלילה',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0077b6;">איפוס סיסמה</h2>
        <p>שלום ${firstName},</p>
        <p>קיבלנו בקשה לאיפוס הסיסמה שלך במערכת קורס מדריכי צלילה.</p>
        <p>לחץ על הכפתור הבא לאיפוס הסיסמה:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #0077b6; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            איפוס סיסמה
          </a>
        </p>
        <p>או העתק את הקישור הבא לדפדפן:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>קישור זה יפוג תוך שעה אחת.</strong></p>
        <p>אם לא ביקשת לאפס את הסיסמה, התעלם מהודעה זו.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          הודעה זו נשלחה אוטומטית ממערכת קורס מדריכי צלילה.
        </p>
      </div>
    `
  };

  // Check if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your-sendgrid-api-key-here') {
    console.log('SendGrid not configured. Reset URL:', resetUrl);
    console.log('To send emails, configure SENDGRID_API_KEY in .env');
    return { success: true, simulated: true, resetUrl };
  }

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    throw new Error('שגיאה בשליחת אימייל');
  }
};

export default { sendPasswordResetEmail };
