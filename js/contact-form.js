/**
 * 백록마케팅 - 문의 폼 처리
 * StorageBackend (Supabase/localStorage)를 사용한 데이터 저장
 */

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) {
        console.error('Contact form not found');
        return;
    }

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 폼 데이터 수집
        const formData = new FormData(contactForm);
        
        // 제출 버튼 비활성화 및 로딩 표시
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>제출 중...';
        
        try {
            // API 요청 데이터 구성
            const inquiryData = {
                company_name: formData.get('company_name'),
                contact_name: formData.get('contact_name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                inquiry_type: formData.get('inquiry_type'),
                message: formData.get('message'),
                privacy_agreed: formData.get('privacy_agreed') === 'on',
                submitted_at: new Date().toISOString()
            };
            
            // StorageBackend로 데이터 저장
            const result = await StorageBackend.create(inquiryData);
            console.log('문의 제출 성공:', result);
            
            // 성공 메시지 표시
            showSuccessMessage();
            
            // 폼 초기화
            contactForm.reset();
            
        } catch (error) {
            console.error('문의 제출 실패:', error);
            showErrorMessage();
        } finally {
            // 버튼 복구
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
    
    // 성공 메시지 표시
    function showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'form-message form-message-success';
        message.innerHTML = `
            <div style="background: rgba(81, 180, 152, 0.15); border: 2px solid #51B498; border-radius: 16px; padding: 20px; margin-top: 20px; text-align: center;">
                <i class="fas fa-check-circle" style="color: #51B498; font-size: 48px; margin-bottom: 12px;"></i>
                <h3 style="color: #FFFFFF; font-size: 20px; font-weight: bold; margin-bottom: 8px;">문의가 성공적으로 접수되었습니다!</h3>
                <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin: 0;">빠른 시일 내에 연락드리겠습니다.</p>
            </div>
        `;
        
        const formContainer = document.querySelector('.bk-subscribe__form');
        formContainer.insertBefore(message, formContainer.firstChild);
        
        // 3초 후 메시지 제거
        setTimeout(() => {
            message.style.transition = 'opacity 0.5s';
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 500);
        }, 3000);
        
        // 메시지 위치로 스크롤
        message.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // 에러 메시지 표시
    function showErrorMessage() {
        const message = document.createElement('div');
        message.className = 'form-message form-message-error';
        message.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid #EF4444; border-radius: 16px; padding: 20px; margin-top: 20px; text-align: center;">
                <i class="fas fa-exclamation-circle" style="color: #EF4444; font-size: 48px; margin-bottom: 12px;"></i>
                <h3 style="color: #FFFFFF; font-size: 20px; font-weight: bold; margin-bottom: 8px;">문의 제출에 실패했습니다.</h3>
                <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin: 0;">잠시 후 다시 시도해주세요.</p>
            </div>
        `;
        
        const formContainer = document.querySelector('.bk-subscribe__form');
        formContainer.insertBefore(message, formContainer.firstChild);
        
        // 5초 후 메시지 제거
        setTimeout(() => {
            message.style.transition = 'opacity 0.5s';
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 500);
        }, 5000);
        
        // 메시지 위치로 스크롤
        message.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});
