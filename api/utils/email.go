package utils

import (
	"fmt"
	"os"
	"strconv"

	"gopkg.in/gomail.v2"
)

// SendInviteEmail sends a document invitation email
func SendInviteEmail(recipientEmail, recipientName, documentTitle, inviteURL, senderName string) error {
	// Email configuration from environment variables
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	// Convert port to int
	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		return fmt.Errorf("invalid SMTP port: %v", err)
	}

	// Create message
	m := gomail.NewMessage()
	m.SetHeader("From", smtpUser)
	m.SetHeader("To", recipientEmail)
	m.SetHeader("Subject", fmt.Sprintf("%s invited you to collaborate on '%s'", senderName, documentTitle))

	// Email body (HTML)
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
			<div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
				<h2 style="color: #028090;">You've been invited to collaborate!</h2>
				<p>Hi <strong>%s</strong>,</p>
				<p><strong>%s</strong> has invited you to collaborate on the document:</p>
				<h3 style="color: #333; margin: 20px 0;">📄 %s</h3>
				<p>Click the button below to open the document:</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="%s" style="background-color: #028090; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Open Document</a>
				</div>
				<p style="color: #666; font-size: 14px;">Or copy this link: <a href="%s" style="color: #028090;">%s</a></p>
				<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
				<p style="color: #888; font-size: 12px; text-align: center;">CoWrite - Collaborative Document Editing</p>
			</div>
		</body>
		</html>
	`, recipientName, senderName, documentTitle, inviteURL, inviteURL, inviteURL)

	m.SetBody("text/html", body)

	// Send email
	d := gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPass)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}