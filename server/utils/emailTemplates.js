// Branded HTML email templates. These are new, reusable template functions — existing
// call sites (e.g. authController.js's verification/reset emails) were intentionally
// left as-is per "do not modify authentication"; they can adopt these templates later
// as a deliberate, separate change. Every template shares one visual wrapper so emails
// look consistent regardless of which feature triggered them.

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const wrapper = (title, bodyHtml, ctaText, ctaUrl) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#08060f;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08060f;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#12102080;border:1px solid rgba(196,181,253,0.14);border-radius:20px;overflow:hidden;">
        <tr><td style="padding:32px 32px 0 32px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,#f0b429,#ec4899);"></span>
            <span style="font-weight:800;font-size:18px;color:#f4f1fa;">PrernaNode</span>
          </div>
          <h1 style="font-size:22px;color:#f4f1fa;margin:0 0 16px 0;">${title}</h1>
          <div style="color:#a79fc2;font-size:14px;line-height:1.6;">${bodyHtml}</div>
        </td></tr>
        ${
          ctaUrl
            ? `<tr><td style="padding:24px 32px;">
                <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#f0b429,#f6cf6b);color:#08060f;font-weight:600;font-size:14px;padding:14px 28px;border-radius:100px;text-decoration:none;">${ctaText}</a>
              </td></tr>`
            : ''
        }
        <tr><td style="padding:24px 32px 32px 32px;border-top:1px solid rgba(196,181,253,0.14);">
          <p style="color:#635c78;font-size:11px;margin:16px 0 0 0;">Connect. Inspire. Rise. — PrernaNode</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const templates = {
  welcome: (name) => ({
    subject: 'Welcome to PrernaNode 🎉',
    html: wrapper(
      `Welcome, ${name}!`,
      `Your account is ready. PrernaNode connects you with mentors, a maker marketplace, professional communities, and AI-powered career tools built for where you're headed next.`,
      'Explore your feed',
      `${CLIENT_URL}/feed`
    ),
  }),

  mentorshipRequestReceived: (mentorName, studentName, skillName) => ({
    subject: `New mentorship request: ${skillName}`,
    html: wrapper(
      `New mentorship request`,
      `${studentName} requested a session for <strong>${skillName}</strong>. Review the request and respond from your dashboard.`,
      'View request',
      `${CLIENT_URL}/mentor-requests`
    ),
  }),

  communityInvite: (communityName, inviterName) => ({
    subject: `${inviterName} invited you to join ${communityName}`,
    html: wrapper(
      `You're invited`,
      `${inviterName} thinks you'd be a great fit for <strong>${communityName}</strong> on PrernaNode.`,
      'View community',
      `${CLIENT_URL}/communities`
    ),
  }),

  eventReminder: (eventTitle, dateLabel) => ({
    subject: `Reminder: ${eventTitle} is coming up`,
    html: wrapper(
      `Event reminder`,
      `<strong>${eventTitle}</strong> is happening ${dateLabel}. Don't miss it.`,
      'View event',
      `${CLIENT_URL}/events`
    ),
  }),

  opportunityDeadlineReminder: (title, deadlineLabel) => ({
    subject: `Deadline approaching: ${title}`,
    html: wrapper(
      `Deadline approaching`,
      `The application deadline for <strong>${title}</strong> is ${deadlineLabel}. If you bookmarked it, now's the time.`,
      'View opportunity',
      `${CLIENT_URL}/opportunities`
    ),
  }),

  businessInquiry: (businessName, inquirerName) => ({
    subject: `New inquiry for ${businessName}`,
    html: wrapper(
      `New business inquiry`,
      `${inquirerName} reached out about <strong>${businessName}</strong>.`,
      'View inquiry',
      `${CLIENT_URL}/inquiries`
    ),
  }),

  productInquiry: (productName, buyerName) => ({
    subject: `New inquiry: ${productName}`,
    html: wrapper(
      `New product inquiry`,
      `${buyerName} is interested in <strong>${productName}</strong>.`,
      'View inquiry',
      `${CLIENT_URL}/inquiries`
    ),
  }),

  weeklyDigest: (name, { newStories, newOpportunities, newMentors }) => ({
    subject: 'Your PrernaNode weekly digest',
    html: wrapper(
      `Your week on PrernaNode`,
      `Hi ${name} — here's what's new since last week:
        <ul style="padding-left:18px;">
          <li>${newStories} new stories in your network</li>
          <li>${newOpportunities} new opportunities posted</li>
          <li>${newMentors} new mentors joined</li>
        </ul>`,
      'Open PrernaNode',
      `${CLIENT_URL}/feed`
    ),
  }),
};

module.exports = templates;
