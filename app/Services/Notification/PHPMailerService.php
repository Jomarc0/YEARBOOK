<?php

namespace App\Services\Notification;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PHPMailerService
{
    protected PHPMailer $mailer;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);

        $this->mailer->isSMTP();
        $this->mailer->Host       = config('phpmailer.host');
        $this->mailer->SMTPAuth   = true;
        $this->mailer->Username   = config('phpmailer.username');
        $this->mailer->Password   = config('phpmailer.password');
        $this->mailer->SMTPSecure = config('phpmailer.encryption', PHPMailer::ENCRYPTION_STARTTLS);
        $this->mailer->Port       = config('phpmailer.port', 587);

        $this->mailer->setFrom(
            config('phpmailer.from_address'),
            config('phpmailer.from_name')
        );

        $this->mailer->isHTML(true);
        $this->mailer->CharSet = 'UTF-8';
    }

    // ── 1. OTP (login / registration) ─────────────────────────────────

    public function sendOtp(string $toEmail, string $toName, string $otp): bool
    {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = 'Your Sinag-Bughaw Verification Code';
            $this->mailer->Body    = $this->otpTemplate($otp);
            $this->mailer->AltBody = "Your OTP code is: $otp. It expires in 10 minutes.";
            $this->mailer->send();
            return true;
        } catch (Exception $e) {
            Log::error('PHPMailer OTP error: ' . $e->getMessage());
            return false;
        }
    }

    // ── 2. Password Reset OTP ─────────────────────────────────────────

    public function sendPasswordReset(string $toEmail, string $toName, string $otp): bool
    {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = 'Reset Your Sinag-Bughaw Password';
            $this->mailer->Body    = $this->passwordResetTemplate($toName, $otp);
            $this->mailer->AltBody = "Your password reset code is: $otp. It expires in 10 minutes. If you did not request this, ignore this email.";
            $this->mailer->send();
            return true;
        } catch (Exception $e) {
            Log::error('PHPMailer PasswordReset error: ' . $e->getMessage());
            return false;
        }
    }

    // ── 3. Announcement ───────────────────────────────────────────────

    public function sendAnnouncement(
        string $toEmail,
        string $toName,
        string $title,
        string $body,
        ?string $actionUrl   = null,
        ?string $actionLabel = null
    ): bool {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = "[Sinag-Bughaw] $title";
            $this->mailer->Body    = $this->announcementTemplate($toName, $title, $body, $actionUrl, $actionLabel);
            $this->mailer->AltBody = "$title\n\n$body";
            $this->mailer->send();
            return true;
        } catch (Exception $e) {
            Log::error('PHPMailer Announcement error: ' . $e->getMessage());
            return false;
        }
    }

    // ── 4. Graduation Reminder ────────────────────────────────────────

    public function sendGraduationReminder(
        string $toEmail,
        string $toName,
        string $eventName,
        string $eventDate,
        string $eventVenue,
        ?string $actionUrl = null
    ): bool {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = "🎓 Graduation Reminder — $eventName";
            $this->mailer->Body    = $this->graduationTemplate($toName, $eventName, $eventDate, $eventVenue, $actionUrl);
            $this->mailer->AltBody = "Reminder: $eventName on $eventDate at $eventVenue.";
            $this->mailer->send();
            return true;
        } catch (Exception $e) {
            Log::error('PHPMailer Graduation error: ' . $e->getMessage());
            return false;
        }
    }

    // ── 5. Photo Tagged ───────────────────────────────────────────────

    public function sendTaggedNotification(
        string $toEmail,
        string $toName,
        string $taggedBy,
        string $photoUrl,
        ?string $actionUrl   = null,
        ?string $actionLabel = null
    ): bool {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = "📸 {$taggedBy} tagged you in a photo";
            $this->mailer->Body    = $this->taggedTemplate($toName, $taggedBy, $photoUrl, $actionUrl, $actionLabel);
            $this->mailer->AltBody = "Hi $toName, $taggedBy tagged you in a photo."
                . ($actionUrl ? " View it here: $actionUrl" : '');
            $this->mailer->send();
            return true;
        } catch (Exception $e) {
            Log::error('PHPMailer Tagged error: ' . $e->getMessage());
            return false;
        }
    }

    // ── 6. New Message ────────────────────────────────────────────────

    public function sendNewMessageNotification(
        string $toEmail,
        string $toName,
        string $senderName,
        string $messagePreview,
        ?string $actionUrl = null
    ): bool {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = "💬 New message from {$senderName} — Sinag-Bughaw";
            $this->mailer->Body    = $this->newMessageTemplate($toName, $senderName, $messagePreview, $actionUrl);
            $this->mailer->AltBody = "Hi $toName, you have a new message from $senderName: \"$messagePreview\""
                . ($actionUrl ? " Reply here: $actionUrl" : '');
            $this->mailer->send();
            return true;
        } catch (Exception $e) {
            Log::error('PHPMailer NewMessage error: ' . $e->getMessage());
            return false;
        }
    }

    // ── 7. Subscription Confirmed ─────────────────────────────────────

    public function sendSubscriptionConfirmed(
        string $toEmail,
        string $toName,
        string $planName,
        string $expiryDate,
        ?string $actionUrl = null
    ): bool {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($toEmail, $toName);
            $this->mailer->Subject = "🎉 Your Sinag-Bughaw subscription is active!";
            $this->mailer->Body    = $this->subscriptionConfirmedTemplate($toName, $planName, $expiryDate, $actionUrl);
            $this->mailer->AltBody = "Hi $toName, your $planName plan is now active until $expiryDate.";
            $this->mailer->send();
            return true;
        } catch (Exception $e) {
            Log::error('PHPMailer SubscriptionConfirmed error: ' . $e->getMessage());
            return false;
        }
    }

    // ══ Templates ══════════════════════════════════════════════════════

    private function header(): string
    {
        return '<!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:Inter,Arial,sans-serif;background:#f1f5f9;padding:40px 20px}
          .wrap{max-width:520px;margin:0 auto}
          .header{background:linear-gradient(135deg,#1d2b4b,#3f51b5);border-radius:16px 16px 0 0;padding:28px 32px}
          .header-title{color:#fff;font-size:15px;font-weight:900;letter-spacing:2px;text-transform:uppercase}
          .header-sub{color:#fdb813;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-top:2px}
          .card{background:#fff;border-radius:0 0 16px 16px;padding:36px 32px;box-shadow:0 8px 32px rgba(0,0,0,0.08)}
          h1{color:#1d2b4b;font-size:22px;font-weight:900;margin-bottom:8px}
          p{color:#64748b;font-size:14px;line-height:1.7;margin-bottom:16px}
          .btn{display:inline-block;background:#3f51b5;color:#fff!important;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;margin-top:8px}
          .footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:24px}
          .divider{height:1px;background:#e2e8f0;margin:24px 0}
          .badge{display:inline-block;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px}
          .info-table{width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;padding:20px 24px;border:1px solid #e2e8f0}
          .info-table td{padding:8px 0;font-size:14px}
          .info-label{color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:12px;width:40%}
          .info-value{color:#1d2b4b;font-weight:700}
        </style></head><body><div class="wrap">
        <div class="header">
          <div class="header-title">Sinag-Bughaw</div>
          <div class="header-sub">Digital Yearbook · NU Lipa</div>
        </div>
        <div class="card">';
    }

    private function footer(): string
    {
        return '</div>
        <div class="footer">
          © ' . date('Y') . ' National University Lipa · Sinag-Bughaw Project<br>
          If you did not request this email, you can safely ignore it.
        </div></div></body></html>';
    }

    private function otpTemplate(string $otp): string
    {
        return $this->header() . '
          <h1>Verification Code</h1>
          <p>Use the code below to verify your identity. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:28px;text-align:center;margin:24px 0">
            <div style="font-size:44px;font-weight:900;color:#3f51b5;letter-spacing:14px">' . $otp . '</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px">One-time verification code</div>
          </div>
          <div style="background:#fef9ec;border-left:4px solid #fdb813;border-radius:8px;padding:12px 16px;font-size:12px;color:#92400e">
            🔒 Never share this code. NU Lipa staff will never ask for it.
          </div>
        ' . $this->footer();
    }

    private function passwordResetTemplate(string $toName, string $otp): string
    {
        return $this->header() . '
          <div class="badge" style="background:#fee2e2;color:#dc2626">🔑 Password Reset</div>
          <h1>Reset Your Password</h1>
          <p>Hi <strong>' . htmlspecialchars($toName) . '</strong>,</p>
          <p>We received a request to reset your Sinag-Bughaw password. Use the code below to proceed. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:28px;text-align:center;margin:24px 0">
            <div style="font-size:44px;font-weight:900;color:#1d2b4b;letter-spacing:14px">' . $otp . '</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px">Password reset code</div>
          </div>
          <div class="divider"></div>
          <p style="font-size:13px">If you did not request a password reset, your account is safe — simply ignore this email and your password will remain unchanged.</p>
          <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:12px 16px;font-size:12px;color:#991b1b">
            🔒 Never share this code with anyone. NU Lipa staff will never ask for it.
          </div>
        ' . $this->footer();
    }

    private function announcementTemplate(
        string $toName, string $title, string $body,
        ?string $actionUrl, ?string $actionLabel
    ): string {
        $btn = $actionUrl
            ? "<a href=\"$actionUrl\" class=\"btn\">" . ($actionLabel ?? 'View Details') . "</a>"
            : '';
        return $this->header() . "
          <div class='badge' style='background:#e0e7ff;color:#3f51b5'>📢 Announcement</div>
          <h1>$title</h1>
          <p>Hi <strong>$toName</strong>,</p>
          <p>$body</p>
          $btn
          <div class='divider'></div>
          <p style='font-size:12px;color:#94a3b8'>Sent to all Sinag-Bughaw members.</p>
        " . $this->footer();
    }

    private function graduationTemplate(
        string $toName, string $eventName,
        string $eventDate, string $eventVenue, ?string $actionUrl
    ): string {
        $btn = $actionUrl ? "<a href=\"$actionUrl\" class=\"btn\">View Details</a>" : '';
        return $this->header() . "
          <div class='badge' style='background:#dcfce7;color:#16a34a'>🎓 Graduation Reminder</div>
          <h1>Don't Forget, $toName!</h1>
          <p>You have an upcoming graduation event. Here are the details:</p>
          <table class='info-table'>
            <tr><td class='info-label'>Event</td><td class='info-value'>$eventName</td></tr>
            <tr><td class='info-label'>Date</td><td class='info-value'>$eventDate</td></tr>
            <tr><td class='info-label'>Venue</td><td class='info-value'>$eventVenue</td></tr>
          </table>
          <div style='margin-top:20px'>$btn</div>
          <div class='divider'></div>
          <p style='font-size:12px;color:#94a3b8'>Congratulations on your achievement, Pioneer! 🎉</p>
        " . $this->footer();
    }

    private function taggedTemplate(
        string $toName, string $taggedBy, string $photoUrl,
        ?string $actionUrl, ?string $actionLabel
    ): string {
        $btn = $actionUrl
            ? "<a href=\"$actionUrl\" class=\"btn\">" . ($actionLabel ?? 'View Photo') . "</a>"
            : '';
        return $this->header() . "
          <div class='badge' style='background:#fce7f3;color:#db2777'>📸 Photo Tag</div>
          <h1>You were tagged!</h1>
          <p>Hi <strong>" . htmlspecialchars($toName) . "</strong>,</p>
          <p><strong>" . htmlspecialchars($taggedBy) . "</strong> tagged you in a photo on your Sinag-Bughaw yearbook.</p>
          <div style='margin:24px 0;text-align:center;'>
            <img src=\"$photoUrl\" alt=\"Tagged photo\"
                 style=\"max-width:100%;max-height:300px;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.08);\" />
          </div>
          $btn
          <div class='divider'></div>
          <p style='font-size:12px;color:#94a3b8'>
            You can manage your tagged photos from your profile settings.
          </p>
        " . $this->footer();
    }

    private function newMessageTemplate(
        string $toName, string $senderName,
        string $messagePreview, ?string $actionUrl
    ): string {
        $btn = $actionUrl
            ? "<a href=\"$actionUrl\" class=\"btn\">Reply to Message</a>"
            : '';
        $preview = htmlspecialchars(Str::limit($messagePreview, 120));
        return $this->header() . "
          <div class='badge' style='background:#e0f2fe;color:#0369a1'>💬 New Message</div>
          <h1>You have a new message</h1>
          <p>Hi <strong>" . htmlspecialchars($toName) . "</strong>,</p>
          <p><strong>" . htmlspecialchars($senderName) . "</strong> sent you a message on Sinag-Bughaw.</p>
          <div style='background:#f8fafc;border-left:4px solid #3f51b5;border-radius:8px;padding:16px 20px;margin:20px 0;'>
            <div style='font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;'>Message Preview</div>
            <div style='font-size:14px;color:#1d2b4b;font-style:italic;line-height:1.6;'>\"$preview\"</div>
          </div>
          $btn
          <div class='divider'></div>
          <p style='font-size:12px;color:#94a3b8'>
            You are receiving this because someone sent you a message on Sinag-Bughaw.
            Log in to view the full conversation.
          </p>
        " . $this->footer();
    }

    private function subscriptionConfirmedTemplate(
        string $toName, string $planName,
        string $expiryDate, ?string $actionUrl
    ): string {
        $btn = $actionUrl
            ? "<a href=\"$actionUrl\" class=\"btn\">Explore Premium Features</a>"
            : '';
        return $this->header() . "
          <div class='badge' style='background:#fef9c3;color:#854d0e'>⭐ Subscription Active</div>
          <h1>Welcome to Premium, $toName!</h1>
          <p>Your subscription has been confirmed. You now have full access to all Sinag-Bughaw premium features.</p>
          <table class='info-table' style='margin:24px 0;'>
            <tr><td class='info-label'>Plan</td><td class='info-value'>" . htmlspecialchars($planName) . "</td></tr>
            <tr><td class='info-label'>Valid Until</td><td class='info-value'>" . htmlspecialchars($expiryDate) . "</td></tr>
            <tr><td class='info-label'>Status</td><td class='info-value' style='color:#16a34a;'>✓ Active</td></tr>
          </table>
          $btn
          <div class='divider'></div>
          <p style='font-size:12px;color:#94a3b8'>
            Thank you for supporting Sinag-Bughaw. If you have questions about your subscription,
            please contact the NU Lipa administration.
          </p>
        " . $this->footer();
    }
}