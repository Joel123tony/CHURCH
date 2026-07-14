const imaps = require('imap-simple');

async function getOTP(email, password) {
  const config = {
    imap: {
      user: email,
      password: password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000
    }
  };

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Search for unread emails with subject 'MTC Admin - Password Reset OTP' since yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const searchCriteria = ['UNSEEN', ['SINCE', yesterday.toISOString()], ['SUBJECT', 'MTC Admin - Password Reset OTP']];
    const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'], markSeen: true };

    let attempts = 0;
    while (attempts < 15) { // Try for 30 seconds
      console.log(`Checking inbox... attempt ${attempts + 1}`);
      const messages = await connection.search(searchCriteria, fetchOptions);
      
      if (messages.length > 0) {
        // Get the latest message
        const message = messages[messages.length - 1];
        const bodyPart = message.parts.find(p => p.which === 'TEXT');
        
        if (bodyPart) {
          const body = bodyPart.body;
          // The OTP is a 6-digit number in the email.
          // In the template, it's wrapped in HTML spaces. Let's look for a 6-digit number.
          const match = body.match(/\b\d{6}\b/);
          if (match) {
            connection.end();
            return match[0];
          }
        }
      }
      
      // Wait 2 seconds before checking again
      await new Promise(res => setTimeout(res, 2000));
      attempts++;
    }

    connection.end();
    throw new Error('OTP email not found in inbox within timeout.');

  } catch (error) {
    console.error('IMAP Error:', error);
    throw error;
  }
}

module.exports = { getOTP };
