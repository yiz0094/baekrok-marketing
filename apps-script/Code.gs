/**
 * 백록마케팅 SMS 프록시 (Solapi)
 *
 * 역할: 100record.com 사이트(클라이언트 JS)에서 직접 Solapi를 호출하면
 *       API key/secret이 브라우저에 노출되므로, 이 Apps Script가 대신 호출한다.
 *
 * 배포 방법(요약 - apps-script/README.md 참고):
 *   1. https://script.google.com 에서 새 프로젝트 생성
 *   2. 본 파일 내용 그대로 복사/붙여넣기 (파일명: Code.gs)
 *   3. 프로젝트 설정 → Script Properties 에 아래 4개 키 추가
 *        SOLAPI_API_KEY      = (새로 발급받은 Solapi API Key)
 *        SOLAPI_API_SECRET   = (새로 발급받은 Solapi API Secret)
 *        SOLAPI_FROM         = 01036556080
 *        ALLOWED_ORIGINS     = https://100record.com,https://www.100record.com
 *   4. 배포 → 새 배포 → 유형: 웹앱
 *        - 실행 계정: 나(yiz.mkt@gmail.com)
 *        - 액세스 권한: 모든 사용자
 *   5. 배포 후 받은 /exec URL을 js/auto-notify.js 의 NOTIFY_CONFIG.smsProxy.endpoint 에 입력
 */

// ============================================
// 설정
// ============================================
const RATE_LIMIT_PER_HOUR = 30;  // 시간당 최대 SMS 발송 (abuse 방지)

// ============================================
// HTTP 핸들러
// ============================================
function doGet(e) {
  return jsonOut({ ok: true, msg: 'baekrok-sms-proxy alive' });
}

function doPost(e) {
  try {
    // 1) 입력 파싱
    let body;
    try {
      body = JSON.parse(e.postData.contents || '{}');
    } catch (parseErr) {
      return jsonOut({ ok: false, error: 'invalid_json' });
    }

    const { phone, name, bookingUrl } = body;

    // 2) 필수 필드 검증
    if (!phone || !name || !bookingUrl) {
      return jsonOut({ ok: false, error: 'missing_fields' });
    }

    // 3) 휴대폰 번호 형식 검증 (한국 번호만)
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (!/^010\d{8}$/.test(cleanPhone)) {
      return jsonOut({ ok: false, error: 'invalid_phone_format' });
    }

    // 4) bookingUrl 화이트리스트 (Cal.com 도메인만 허용 → 임의 URL을 SMS에 박는 abuse 차단)
    if (!/^https:\/\/cal\.com\//.test(String(bookingUrl))) {
      return jsonOut({ ok: false, error: 'invalid_booking_url' });
    }

    // 5) Rate limit
    if (isRateLimited()) {
      return jsonOut({ ok: false, error: 'rate_limited' });
    }

    // 6) Solapi 호출
    const text = buildSmsText(String(name).slice(0, 30), String(bookingUrl));
    const result = sendViaSolapi(cleanPhone, text);
    incrementRateCount();

    return jsonOut({ ok: true, messageId: result.messageId || null });

  } catch (err) {
    console.error('doPost error:', err);
    return jsonOut({ ok: false, error: 'internal_error', detail: String(err.message || err) });
  }
}

// ============================================
// SMS 본문
// ============================================
function buildSmsText(name, bookingUrl) {
  return '[백록마케팅] ' + name + '님, 무료 상담 신청 감사합니다.\n\n' +
         '아래 링크에서 편하신 시간을 선택해주세요.\n' +
         bookingUrl + '\n\n' +
         '3개월이면 마케팅 방향이 달라집니다.';
}

// ============================================
// Solapi 호출
// ============================================
function sendViaSolapi(toPhone, text) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('SOLAPI_API_KEY');
  const apiSecret = props.getProperty('SOLAPI_API_SECRET');
  const from = props.getProperty('SOLAPI_FROM');

  if (!apiKey || !apiSecret || !from) {
    throw new Error('Solapi credentials not set in Script Properties');
  }

  const date = new Date().toISOString();
  const salt = Utilities.getUuid();
  const signatureBytes = Utilities.computeHmacSha256Signature(date + salt, apiSecret);
  const signature = signatureBytes.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');

  const authHeader = 'HMAC-SHA256 apiKey=' + apiKey +
                     ', date=' + date +
                     ', salt=' + salt +
                     ', signature=' + signature;

  const response = UrlFetchApp.fetch('https://api.solapi.com/messages/v4/send', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: authHeader },
    payload: JSON.stringify({
      message: { to: toPhone, from: from, text: text }
    }),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const responseText = response.getContentText();
  if (code >= 400) {
    throw new Error('Solapi HTTP ' + code + ': ' + responseText);
  }
  return JSON.parse(responseText);
}

// ============================================
// Rate limit (시간당 발송 횟수 제한)
// ============================================
function isRateLimited() {
  const cache = CacheService.getScriptCache();
  const count = parseInt(cache.get('sms_count_hourly') || '0', 10);
  return count >= RATE_LIMIT_PER_HOUR;
}

function incrementRateCount() {
  const cache = CacheService.getScriptCache();
  const current = parseInt(cache.get('sms_count_hourly') || '0', 10);
  cache.put('sms_count_hourly', String(current + 1), 3600);
}

// ============================================
// 응답 헬퍼 (Apps Script Web App은 HTTP status 직접 설정 불가, body의 ok 필드로 판별)
// ============================================
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// 수동 테스트용 (Apps Script 에디터에서 직접 실행)
// ============================================
function _testSendSelf() {
  const props = PropertiesService.getScriptProperties();
  const from = props.getProperty('SOLAPI_FROM');
  if (!from) throw new Error('SOLAPI_FROM not set');
  const result = sendViaSolapi(from, '[백록마케팅] SMS 프록시 테스트입니다.');
  console.log(JSON.stringify(result, null, 2));
}
