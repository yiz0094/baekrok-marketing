/**
 * 백록마케팅 - 자동 알림 발송 시스템
 * 문의 제출 시 이메일 + SMS 자동 발송
 *
 * 필요한 서비스:
 * 1. Cal.com - 미팅 일정 예약 링크
 * 2. Solapi - SMS 발송
 * 3. EmailJS - 이메일 발송 (클라이언트 사이드, 무료)
 */

// ============================================
// 설정 - 각 서비스 가입 후 값을 입력하세요
// ============================================
const NOTIFY_CONFIG = {
    // Cal.com 미팅 예약 링크
    calcom: {
        bookingUrl: 'https://cal.com/이재은-이즈/30min'
    },

    // Solapi SMS 설정
    solapi: {
        apiKey: 'NCSWXXG9WFDSIPEV',
        apiSecret: 'IYSX0VFLQOWSBC1UBB6R20AQY2Z7PVP8',
        senderPhone: '01036556080',
        apiUrl: 'https://api.solapi.com/messages/v4/send-many'
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
        `[백록마케팅] ${name}님, 미팅 신청 감사합니다.\n\n` +
        `아래 링크에서 편하신 시간을 선택해주세요.\n` +
        `${bookingUrl}\n\n` +
        `궁금한 점은 언제든 연락주세요.`,

    // 이메일 제목
    emailSubject: (name) =>
        `[백록마케팅] ${name}님, 전략 팀장 미팅 일정을 선택해주세요`,

    // 이메일 본문 (HTML)
    emailBody: (name, company, bookingUrl) => `
        <div style="max-width:600px; margin:0 auto; font-family:'Apple SD Gothic Neo','Pretendard',sans-serif; color:#333; line-height:1.7;">
            <div style="background:#0E1114; padding:32px; border-radius:12px 12px 0 0; text-align:center;">
                <h1 style="color:#51B498; font-size:20px; margin:0;">백록마케팅</h1>
                <p style="color:#A0A8B4; font-size:14px; margin:8px 0 0;">월 100만원 마케팅 전략 팀장</p>
            </div>

            <div style="padding:32px; background:#f9fafb; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 12px 12px;">
                <p style="font-size:16px; margin-bottom:24px;">
                    안녕하세요, <strong>${name}</strong>님.<br>
                    <strong>${company}</strong>의 미팅 신청 감사드립니다.
                </p>

                <p style="font-size:15px; margin-bottom:24px;">
                    아래 버튼을 클릭하시면 편하신 시간대를 직접 선택하실 수 있습니다.<br>
                    선택해주신 시간에 맞춰 Google Meet 링크를 보내드리겠습니다.
                </p>

                <div style="text-align:center; margin:32px 0;">
                    <a href="${bookingUrl}"
                       style="display:inline-block; padding:14px 40px; background:#51B498; color:#fff;
                              text-decoration:none; border-radius:8px; font-weight:700; font-size:16px;">
                        미팅 일정 선택하기 →
                    </a>
                </div>

                <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:20px; margin-top:24px;">
                    <p style="font-size:14px; color:#6B7280; margin:0 0 8px;"><strong>미팅에서 이런 이야기를 나눕니다:</strong></p>
                    <ul style="font-size:14px; color:#6B7280; margin:0; padding-left:20px;">
                        <li>회사 소개 (업종, 타겟 고객, 주요 상품/서비스)</li>
                        <li>현재 겪고 있는 마케팅 고민이나 문제</li>
                        <li>지금까지 시도했던 마케팅 이력 (광고, 채널 등)</li>
                        <li>백록마케팅에 기대하는 점</li>
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
 * Solapi HMAC-SHA256 인증 헤더 생성
 */
async function createSolapiAuthHeader() {
    const cfg = NOTIFY_CONFIG.solapi;
    const date = new Date().toISOString();
    const salt = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw', encoder.encode(cfg.apiSecret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(date + salt));
    const signature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');

    return `HMAC-SHA256 apiKey=${cfg.apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

/**
 * SMS 발송 (Solapi 직접 호출)
 */
async function sendSMS(phone, name, bookingUrl) {
    const cfg = NOTIFY_CONFIG.solapi;
    if (cfg.apiKey === 'YOUR_SOLAPI_API_KEY') {
        console.warn('Solapi 미설정 - SMS 발송 건너뜀');
        return null;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = TEMPLATES.sms(name, bookingUrl);
    const authHeader = await createSolapiAuthHeader();

    const response = await fetch('https://api.solapi.com/messages/v4/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
        },
        body: JSON.stringify({
            message: {
                to: cleanPhone,
                from: cfg.senderPhone,
                text: text
            }
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.errorMessage || 'SMS 발송 실패');
    }
    return response.json();
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
    const results = { email: null, sms: null };

    // 이메일 발송 (비동기, 실패해도 SMS는 발송)
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
