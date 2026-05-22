import { Resend } from 'resend';

export async function notifyAdminFolderAccessRequest(
  userName: string,
  userEmail: string,
  folderName: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'noreply@maiphotos.com';
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping notification');
    return;
  }
  if (adminEmails.length === 0) {
    console.warn('[email] ADMIN_EMAILS not set — skipping notification');
    return;
  }

  const resend = new Resend(apiKey);

  console.log(`[email] Sending access request notification to ${adminEmails.join(', ')}`);
  const result = await resend.emails.send({
    from,
    to: adminEmails,
    subject: `Access request: ${folderName}`,
    html: `
      <p><strong>${userName}</strong> (${userEmail}) has requested access to the folder <strong>${folderName}</strong>.</p>
      <p>Log in to the admin panel to approve or reject this request.</p>
    `,
  });
  console.log('[email] Resend result:', JSON.stringify(result));
}

export async function notifyUserFolderAccessApproved(
  userEmail: string,
  userName: string,
  folderName: string,
  folderId: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'noreply@maiphotos.com';
  const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '');

  if (!apiKey) return;

  const folderUrl = siteUrl ? `${siteUrl}/folder/${folderId}` : null;

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: [userEmail],
    subject: `Access approved: ${folderName}`,
    html: `
      <p>Hi ${userName},</p>
      <p>Your request to access the folder <strong>${folderName}</strong> has been approved.</p>
      <p>You can now view and download all photos in that folder.</p>
      ${folderUrl ? `<p><a href="${folderUrl}">Open ${folderName}</a></p>` : ''}
    `,
  });
  console.log('[email] Approval notification result:', JSON.stringify(result));
}
