export const RESET_PASSWORD_TEMPLATE = ({ name, resetUrl }) => {
  return `
    <!doctype html>
    <html lang="en">

        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Reset Your Password</title>
        </head>

        <body>
            <div
                style="font-family:'Roboto', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px;">
                <div
                    style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
                    <h2 style="color: #333333; margin-bottom: 20px; font-weight: 700;">
                        Reset Your Password
                    </h2>
                    <p style="color: #555555; font-size: 15px; line-height: 1.6">
                        Hi ${name},
                    </p>
                    <p style="color: #555555; font-size: 15px; line-height: 1.6">
                        We received a request to reset your password. Click the button below to set a new password.
                    </p>
                    <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 15px;">
                        <p style="margin: 5px 0;">
                            This password reset link will expire in <span style="font-weight: 500;">10 minutes</span>.
                        </p>
                    </div>
                    <p style="color: #555555; font-size: 15px">
                        If you did not request a password reset, you can safely ignore this email.
                    </p>
                    <div style="text-align: center; margin: 30px 0">
                        <a href="${resetUrl}"
                            style="background-color: #00a540; color: #ffffff; padding: 8px 12px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Reset Password
                        </a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0" />
                    <p style="font-size: 14px; color: #999999">
                        If the button above does not work, copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 13px; color: #666666; word-break: break-all;">
                        ${resetUrl}
                    </p>
                </div>
            </div>
        </body>
    </html>
    `;
};
