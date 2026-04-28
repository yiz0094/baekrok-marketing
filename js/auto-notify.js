/**
 * 백록마케팅 - 자동 알림 발송 시스템
 * 문의 제출 시 이메일 + SMS 자동 발송
 *
 * 필요한 서비스:
 * 1. Cal.com - 미팅 일정 예약 링크
 * 2. Apps Script Web App - SMS 발송 프록시 (Solapi 시크릿을 서버에서 보관)
 *    배포 가이드: apps-script/README.md
 * 3. EmailJS - 이메일 발송 (클라이언트 사이드 publicKey만 사용 → 안전)
 */

// ============================================
// 설정 - 각 서비스 가입 후 값을 입력하세요
// ============================================
const NOTIFY_CONFIG = {
    // 관리자 알림 이메일
    adminEmail: 'yiz.mkt@gmail.com',

    // Cal.com 미팅 예약 링크
    calcom: {
        bookingUrl: 'https://cal.com/이재은-이즈/30min'
    },

    // SMS 프록시 (Apps Script Web App - 시크릿은 서버 측에 보관)
    // 배포 가이드: apps-script/README.md
    // 배포 후 받은 /exec URL을 endpoint 값에 붙여넣으세요.
    smsProxy: {
        endpoint: 'https://script.google.com/macros/s/AKfycbzbzKwR0RsXm3V7lK-0YC_GecbEQVPlXlVncyxmkX1ll21qsgE6vT1sKeKdIHqNwgH7/exec'
    },

    // EmailJS 설정 (무료: 월 200건)
    emailjs: {
        serviceId: 'service_3xp00xh',
        templateId: 'template_egkgkwh',
        publicKey: 'wnpjeGS6v_msLkqeq'
    }
};

// ============================================
// 멘트 템플릿
// ============================================
const TEMPLATES = {
    // SMS 멘트 (90바이트 이내 권장, 초과 시 LMS로 전환)
    sms: (name, bookingUrl) =>
        `[백록마케팅] ${name}님, 무료 상담 신청 감사합니다.\n\n` +
        `아래 링크에서 편하신 시간을 선택해주세요.\n` +
        `${bookingUrl}\n\n` +
        `3개월이면 마케팅 방향이 달라집니다.`,

    // 이메일 제목
    emailSubject: (name) =>
        `[백록마케팅] ${name}님, 마케팅 구조 진단 상담 일정을 선택해주세요`,

    // 관리자 알림 이메일 제목
    adminSubject: (name, company) =>
        `[새 상담] ${company} - ${name}님이 무료 상담을 신청했습니다`,

    // 관리자 알림 이메일 본문 (HTML)
    adminBody: (name, company, phone, email) => `
        <div style="max-width:600px; margin:0 auto; font-family:'Apple SD Gothic Neo','Pretendard',sans-serif; color:#333; line-height:1.7;">
            <div style="background:#0E1114; padding:32px; border-radius:12px 12px 0 0; text-align:center;">
                <h1 style="color:#51B498; font-size:20px; margin:0;">새 무료 상담 신청이 들어왔습니다</h1>
            </div>
            <div style="padding:32px; background:#f9fafb; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 12px 12px;">
                <table style="width:100%; border-collapse:collapse; font-size:15px;">
                    <tr style="border-bottom:1px solid #e5e7eb;">
                        <td style="padding:12px 8px; font-weight:700; color:#6B7280; width:100px;">회사명</td>
                        <td style="padding:12px 8px;">${company}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e5e7eb;">
                        <td style="padding:12px 8px; font-weight:700; color:#6B7280;">담당자</td>
                        <td style="padding:12px 8px;">${name}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e5e7eb;">
                        <td style="padding:12px 8px; font-weight:700; color:#6B7280;">연락처</td>
                        <td style="padding:12px 8px;">${phone || '-'}</td>
                    </tr>
                    <tr>
                        <td style="padding:12px 8px; font-weight:700; color:#6B7280;">이메일</td>
                        <td style="padding:12px 8px;">${email || '-'}</td>
                    </tr>
                </table>
                <div style="text-align:center; margin-top:24px;">
                    <a href="https://100record.com/admin.html"
                       style="display:inline-block; padding:12px 32px; background:#51B498; color:#fff;
                              text-decoration:none; border-radius:8px; font-weight:700; font-size:14px;">
                        관리자 페이지에서 확인 →
                    </a>
                </div>
            </div>
        </div>
    `,

    // 고객용 이메일 본문 (HTML)
    emailBody: (name, company, bookingUrl) => `
        <div style="max-width:600px; margin:0 auto; font-family:'Apple SD Gothic Neo','Pretendard',sans-serif; color:#333; line-height:1.7;">
            <div style="background:#0E1114; padding:32px; border-radius:12px 12px 0 0; text-align:center;">
                <h1 style="color:#51B498; font-size:20px; margin:0;">백록마케팅</h1>
                <p style="color:#A0A8B4; font-size:14px; margin:8px 0 0;">마케팅 방향이 맞는지, 3개월이면 답이 나옵니다</p>
            </div>

            <div style="padding:32px; background:#f9fafb; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 12px 12px;">
                <p style="font-size:16px; margin-bottom:24px;">
                    안녕하세요, <strong>${name}</strong>님.<br>
                    <strong>${company}</strong>의 무료 상담 신청 감사드립니다.
                </p>

                <p style="font-size:15px; margin-bottom:24px;">
                    30분 무료 상담에서 현재 마케팅 구조를 함께 진단해드립니다.<br>
                    아래 버튼을 클릭하시면 편하신 시간대를 직접 선택하실 수 있습니다.
                </p>

                <div style="text-align:center; margin:32px 0;">
                    <a href="${bookingUrl}"
                       style="display:inline-block; padding:14px 40px; background:#51B498; color:#fff;
                              text-decoration:none; border-radius:8px; font-weight:700; font-size:16px;">
                        상담 일정 선택하기 →
                    </a>
                </div>

                <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:20px; margin-top:24px;">
                    <p style="font-size:14px; color:#6B7280; margin:0 0 8px;"><strong>상담에서 이런 이야기를 나눕니다:</strong></p>
                    <ul style="font-size:14px; color:#6B7280; margin:0; padding-left:20px;">
                        <li>현재 마케팅 구조 진단 (광고, 채널, 데이터)</li>
                        <li>성과가 안 나오는 근본 원인 분석</li>
                        <li>3개월 전략 설계 방향 제안</li>
                        <li>백록마케팅 협업 방식 안내</li>
                    </ul>
                </div>

                <p style="font-size:13px; color:#9CA3AF; margin-top:24px; text-align:center;">
                    궁금한 점이 있으시면 언제든 연락주세요.<br>
                    백록마케팅 드림
                </p>
            </div>
        </div>
    `
};

// ============================================
// 발송 함수
// ============================================

/**
 * SMS 발송 (Apps Script 프록시 → Solapi)
 *
 * 시크릿은 Apps Script Script Properties에만 보관되고,
 * 브라우저는 endpoint URL만 알면 됨.
 * SMS 본문 자체도 Apps Script가 서버 측에서 조립하므로 변조 불가.
 */
async function sendSMS(phone, name, bookingUrl) {
    const cfg = NOTIFY_CONFIG.smsProxy;
    if (!cfg.endpoint || cfg.endpoint.indexOf('PASTE_DEPLOYMENT_ID') !== -1) {
        console.warn('SMS 프록시 미설정 - SMS 발송 건너뜀');
        return null;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Content-Type: text/plain → CORS simple request (preflight 없음).
    // Apps Script doPost는 e.postData.contents를 raw로 받으므로 JSON 파싱은 서버에서 처리.
    const response = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
            phone: cleanPhone,
            name: name,
            bookingUrl: bookingUrl
        })
    });

    if (!response.ok) {
        throw new Error('SMS 프록시 HTTP ' + response.status);
    }

    const result = await response.json();
    if (!result.ok) {
        throw new Error(result.error || 'SMS 발송 실패');
    }
    return result;
}

/**
 * 이메일 발송 (EmailJS - 클라이언트 사이드)
 */
async function sendEmail(email, name, company, bookingUrl) {
    const cfg = NOTIFY_CONFIG.emailjs;
    if (cfg.serviceId === 'YOUR_EMAILJS_SERVICE_ID') {
        console.warn('EmailJS 미설정 - 이메일 발송 건너뜀');
        return null;
    }

    // EmailJS SDK가 로드되어 있는지 확인
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS SDK 미로드');
        return null;
    }

    const templateParams = {
        to_email: email,
        to_name: name,
        company_name: company,
        subject: TEMPLATES.emailSubject(name),
        message_html: TEMPLATES.emailBody(name, company, bookingUrl),
        booking_url: bookingUrl
    };

    return emailjs.send(cfg.serviceId, cfg.templateId, templateParams, cfg.publicKey);
}

/**
 * 관리자 알림 이메일 발송
 */
async function sendAdminNotification(formData) {
    const cfg = NOTIFY_CONFIG.emailjs;
    if (cfg.serviceId === 'YOUR_EMAILJS_SERVICE_ID' || typeof emailjs === 'undefined') {
        return null;
    }

    const { contact_name, company_name, phone, email } = formData;
    const templateParams = {
        to_email: NOTIFY_CONFIG.adminEmail,
        to_name: '백록마케팅',
        company_name: company_name,
        subject: TEMPLATES.adminSubject(contact_name, company_name),
        message_html: TEMPLATES.adminBody(contact_name, company_name, phone, email),
        booking_url: 'https://100record.com/admin.html'
    };

    return emailjs.send(cfg.serviceId, cfg.templateId, templateParams, cfg.publicKey);
}

/**
 * 통합 자동 발송
 * 폼 제출 성공 후 호출됨
 */
async function sendAutoNotifications(formData) {
    const bookingUrl = NOTIFY_CONFIG.calcom.bookingUrl;

    if (bookingUrl === 'YOUR_CALCOM_BOOKING_URL') {
        console.warn('Cal.com 미설정 - 자동 발송 비활성화');
        return;
    }

    const { contact_name, company_name, phone, email } = formData;
    const results = { email: null, sms: null, adminEmail: null };

    // 관리자 알림 이메일 발송
    try {
        results.adminEmail = await sendAdminNotification(formData);
        console.log('관리자 알림 발송 성공:', NOTIFY_CONFIG.adminEmail);
    } catch (err) {
        console.error('관리자 알림 발송 실패:', err);
    }

    // 고객 이메일 발송 (비동기, 실패해도 SMS는 발송)
    if (email) {
        try {
            results.email = await sendEmail(email, contact_name, company_name, bookingUrl);
            console.log('이메일 발송 성공:', email);
        } catch (err) {
            console.error('이메일 발송 실패:', err);
        }
    }

    // SMS 발송 (비동기)
    if (phone) {
        try {
            results.sms = await sendSMS(phone, contact_name, bookingUrl);
            console.log('SMS 발송 성공:', phone);
        } catch (err) {
            console.error('SMS 발송 실패:', err);
        }
    }

    return results;
}
