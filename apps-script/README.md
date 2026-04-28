# Apps Script SMS 프록시 — 배포 가이드

> 이 폴더의 `Code.gs`를 Google Apps Script에 배포하면, 100record.com 사이트에서 Solapi API key/secret을 더 이상 브라우저에 노출하지 않고도 SMS를 발송할 수 있습니다.

## 왜 이걸 만들었나

기존 `js/auto-notify.js`는 **브라우저에서 직접 Solapi API를 호출**하는 구조라 API key/secret이 페이지 소스에 그대로 박혀 있었습니다. 누구나 DevTools만 열면 볼 수 있었고, GitHub PUBLIC repo에도 평문으로 푸시된 상태였습니다.

**해결 방향**: 사이트(브라우저) → Apps Script Web App(서버) → Solapi 순서로 호출. 시크릿은 Apps Script의 Script Properties에만 있고, 사이트에는 Apps Script의 공개 URL만 노출됩니다 (URL이 노출돼도 시크릿이 아님).

## 배포 절차 (10분)

### 1. Solapi 신규 키 발급 & 옛 키 폐기

1. <https://console.solapi.com/credentials> 접속
2. 기존 API Key 항목 **삭제 또는 비활성화** — 단, 새 endpoint 검증이 끝나기 전까지는 살려둠
3. "신규 발급" → 새 API Key + Secret 복사 (이때만 표시됨)

### 2. Apps Script 프로젝트 생성

1. <https://script.google.com> 에서 **새 프로젝트** 만들기
2. 프로젝트 이름: `baekrok-sms-proxy` (예시)
3. 좌측 `Code.gs` 파일을 열고 **이 폴더의 `Code.gs` 내용을 그대로 복사/붙여넣기**

### 3. Script Properties 설정

1. 좌측 톱니바퀴 아이콘(프로젝트 설정) 클릭
2. 하단 "스크립트 속성" → "스크립트 속성 추가"
3. 아래 4개 키-값 등록:

| 속성 이름 | 값 |
|---|---|
| `SOLAPI_API_KEY` | (1번에서 발급받은 새 API Key) |
| `SOLAPI_API_SECRET` | (1번에서 발급받은 새 API Secret) |
| `SOLAPI_FROM` | `01036556080` |
| `ALLOWED_ORIGINS` | `https://100record.com,https://www.100record.com` |

> ⚠ Script Properties는 코드와 분리되어 저장됩니다. GitHub repo에 절대 들어가지 않습니다.

### 4. 자기 자신에게 SMS 보내서 테스트

1. 좌측 함수 드롭다운에서 `_testSendSelf` 선택
2. "실행" 클릭 → Google 권한 승인 (Solapi API + UrlFetch 필요)
3. 로그(`Ctrl/Cmd + Enter`)에 정상 응답 보이면 성공
4. **본인 휴대폰(01036556080)으로 테스트 문자 도착 확인**

### 5. 웹앱으로 배포

1. 우측 상단 "배포" → "새 배포"
2. 유형 선택: ⚙ → **웹 앱**
3. 설정:
   - 설명: `baekrok sms proxy v1`
   - 다음 사용자 인증으로 실행: **나(yiz.mkt@gmail.com)**
   - 액세스 권한: **모든 사용자**
4. "배포" 클릭 → 권한 승인
5. **"웹앱 URL" 복사** (예: `https://script.google.com/macros/s/AKfycbx.../exec`)

### 6. 배포 후 endpoint 단독 테스트

터미널에서:
```bash
curl -X POST 'https://script.google.com/macros/s/PASTE_HERE/exec' \
  -H 'Content-Type: application/json' \
  -d '{"phone":"01036556080","name":"테스트","bookingUrl":"https://cal.com/이재은-이즈/30min"}'
```

응답이 `{"ok":true,...}` 이고 본인 휴대폰에 SMS 도착하면 OK.

### 7. js/auto-notify.js 의 endpoint 업데이트

이미 같은 PR에서 클라이언트 코드는 수정되어 있습니다. 다만 endpoint URL이 placeholder이므로 본인의 배포 URL로 교체해야 합니다.

```js
// js/auto-notify.js (이미 수정된 상태)
smsProxy: {
    endpoint: 'https://script.google.com/macros/s/PASTE_DEPLOYMENT_ID/exec'
    //                                         ^^^^^^^^^^^^^^^^^^^^
    //                                         이 부분을 본인 URL로 교체
}
```

### 8. main 푸시 → GitHub Pages 자동 배포

```bash
git add js/auto-notify.js apps-script/
git commit -m "SMS 발송을 Apps Script 프록시로 이전 (Solapi 키 클라이언트 노출 제거)"
git push origin main
```

GitHub Pages가 자동으로 새 버전 배포 (보통 1~2분).

### 9. 사이트에서 실제 폼 제출 테스트

1. <https://100record.com> 에서 본인 정보로 폼 제출
2. 이메일 + SMS 모두 정상 도착 확인
3. Apps Script 좌측 "실행" 메뉴에서 호출 로그 확인

### 10. 옛 Solapi 키 완전 폐기

신규 endpoint가 안정적으로 동작하는 것을 24시간 정도 모니터링 후:
1. <https://console.solapi.com/credentials> 에서 옛 키 **완전 삭제**
2. Solapi 콘솔 → 발송 내역에서 의심스러운 발송 없는지 점검

### 11. git history 정리 (최종 단계)

옛 키는 이미 폐기됐지만, 자동화된 Secret Scanning이 GitHub history를 계속 인덱싱할 수 있으므로 history도 정리합니다.

```bash
# git-filter-repo 설치 (Python)
pip3 install --user git-filter-repo

# 백업 먼저
cp -r ~/Documents/클로드코딩/월100만원마케팅팀장사이트 ~/Desktop/baekrok-backup-$(date +%Y%m%d)

# 옛 시크릿 문자열을 history 전체에서 redact
# (아래 OLD_KEY_HERE / OLD_SECRET_HERE 자리에 본인의 옛 Solapi 값을 직접 붙여넣으세요.
#  이 파일 자체는 /tmp 에만 두고 commit 하지 마세요.)
cat > /tmp/baekrok-replace.txt <<'EOF'
OLD_KEY_HERE==>REDACTED_OLD_SOLAPI_KEY
OLD_SECRET_HERE==>REDACTED_OLD_SOLAPI_SECRET
EOF
# 직접 편집하려면:
#   nano /tmp/baekrok-replace.txt

cd ~/Documents/클로드코딩/월100만원마케팅팀장사이트
git filter-repo --replace-text /tmp/baekrok-replace.txt --force

# remote 다시 설정 (filter-repo가 origin 제거함)
git remote add origin https://github.com/yiz0094/baekrok-marketing.git

# force push
git push origin --force --all
git push origin --force --tags
```

> ⚠ 다른 곳에 clone이 있다면 모두 재clone 필요.

### 12. GitHub Secret Scanning 알림 처리

<https://github.com/yiz0094/baekrok-marketing/security/secret-scanning> 에서 자동 검출 알림이 있으면:
- "Mark as revoked" 처리 (이미 옛 키는 폐기됨)

## 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| `_testSendSelf` 실행 시 권한 요청 무한 반복 | Solapi 발신번호 인증이 안 되어 있을 수 있음. Solapi 콘솔에서 `01036556080` 발신번호 등록 확인 |
| `{"ok":false,"error":"rate_limited"}` | 시간당 30건 초과. `Code.gs` 의 `RATE_LIMIT_PER_HOUR` 조정 |
| `{"ok":false,"error":"invalid_booking_url"}` | bookingUrl이 `cal.com` 도메인이 아님. `Code.gs` doPost의 정규식 수정 |
| CORS 에러 (브라우저 콘솔) | Apps Script Web App은 자동으로 모든 origin 허용. 다른 에러일 가능성 큼. 응답 body 확인 |
| 배포 후 URL이 동작 안 함 | "배포 → 배포 관리" 에서 활성 상태 확인. 코드 수정 후엔 "새 배포"가 아니라 기존 배포 "버전" 업데이트 가능 |

## 보안 메모

- Apps Script Web App URL은 누구나 호출 가능. abuse 방지 장치:
  1. **Rate limit** — 시간당 30건 (Code.gs 내부)
  2. **휴대폰 형식 검증** — 한국 010 번호만
  3. **bookingUrl 화이트리스트** — Cal.com 도메인만
  4. **Solapi 자체 limit** — Solapi 콘솔에서 일일 발송 한도 별도 설정 권장
- 추가 강화 옵션 (필요 시):
  - 폼에 hidden honeypot 필드 추가 후 Apps Script에서 검증
  - Cloudflare Turnstile / reCAPTCHA v3 토큰 검증
  - 폼 제출 IP 단위 rate limit (CacheService 활용)
