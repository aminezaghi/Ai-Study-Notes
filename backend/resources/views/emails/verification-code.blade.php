<!DOCTYPE html>
<html>
<head>
    <title>Email Verification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .verification-code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #007bff; 
            text-align: center; 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            font-size: 14px; 
            color: #666; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        
        <p>Hello {{ $user->name }},</p>
        
        <p>Thank you for registering! Please use the following verification code to verify your email address:</p>
        
        <div class="verification-code">
            {{ $verificationCode }}
        </div>
        
        <p>This code will expire in 15 minutes.</p>
        
        <p>If you didn't create an account, please ignore this email.</p>
        
        <div class="footer">
            <p>Best regards,<br>StudyMate Team</p>
        </div>
    </div>
</body>
</html>