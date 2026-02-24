export const USER_CREATED_TEMPLATE = ({ name, email, randomPassword }) => {
  return `
    <!doctype html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>User created</title>
        </head>
        <body>
            <div
                style="font-family:'Roboto', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px;">
                <div
                    style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
                    <h2 style="color: #333333; margin-bottom: 20px; font-weight: 700;">Welcome, ${name}</h2>
                    <p style="color: #555555; font-size: 15px; line-height: 1.6">
                        Your account has been successfully created by the administrator.
                    </p>
                    <div style="background-color: #f8f9fa;padding: 16px; border-radius: 6px;margin: 20px 0; font-size: 15px;">
                        <p style="margin: 5px 0">
                            <span style="font-weight: 500;">Email:</span> ${email}
                        </p>
                        <p style="margin: 5px 0">
                            <span style="font-weight: 500;">Temporary Password:</span> ${randomPassword}
                        </p>
                    </div>
                    <p style="color: #555555; font-size: 15px">
                        For security reasons, please log in and change your password immediately.
                    </p>
                    <div style="text-align: center; margin: 30px 0">
                        <a href="${process.env.CLIENT_URL}"
                            style="background-color: #00a540; color: #ffffff; padding: 8px 12px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Login to Your Account
                        </a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0" />
                    <p style="font-size: 14px; color: #999999">
                        If you did not expect this email, please contact the administrator.
                    </p>
                </div>
            </div>
        </body>
    </html>
  `;
};
