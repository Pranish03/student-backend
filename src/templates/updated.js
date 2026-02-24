export const PASSWORD_UPDATE_TEMPLATE = ({ name, loginUrl }) => {
  return `
        <!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Password Update Successful</title>
            </head>
            <body>
                <div
                    style="font-family:'Roboto', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px;">
                    <div
                        style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
                        <h2 style="color: #333333; margin-bottom: 20px; font-weight: 700;">
                            Password Update Successful
                        </h2>
                        <p style="color: #555555; font-size: 15px; line-height: 1.6">
                            Hi ${name},
                        </p>
                        <p style="color: #555555; font-size: 15px; line-height: 1.6">
                            This is a confirmation that your account password was recently changed.
                        </p>
                        <div style="text-align: center; margin: 30px 0">
                            <a href="${loginUrl}"
                                style="background-color: #00a540; color: #ffffff; padding: 8px 12px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Login to Your Account
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0" />
                        <p style="font-size: 14px; color: #999999">
                            If you did not perform this action, please reset your password or contact adminstrator immediately.
                        </p>
                    </div>
                </div>
            </body>
        </html>
    `;
};
