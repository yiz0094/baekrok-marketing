/**
 * 백록마케팅 - 백엔드 연동 레이어
 * Supabase 연동 + localStorage 폴백
 *
 * 사용법:
 * 1. Supabase 프로젝트 생성 후 아래 URL과 KEY를 입력
 * 2. 미설정 시 자동으로 localStorage 사용 (개발/데모용)
 */

// ============================================
// Supabase 설정 - 프로젝트 생성 후 값을 입력하세요
// ============================================
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const TABLE_NAME = 'contact_inquiries';

// Supabase 클라이언트 초기화
let supabaseClient = null;
const isSupabaseConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

if (isSupabaseConfigured && typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase 연결 완료');
} else if (!isSupabaseConfigured) {
    console.log('Supabase 미설정 - localStorage 모드로 작동합니다.');
}

// ============================================
// localStorage 폴백 구현
// ============================================
const LocalStorage = {
    STORAGE_KEY: 'baekrok_contact_inquiries',

    _getData() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    },

    _saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    },

    async getAll({ limit = 1000, sort = '-created_at' } = {}) {
        let data = this._getData();
        const desc = sort.startsWith('-');
        const field = sort.replace(/^-/, '');
        data.sort((a, b) => {
            const valA = a[field] || a.submitted_at || '';
            const valB = b[field] || b.submitted_at || '';
            return desc ? valB.localeCompare(valA) : valA.localeCompare(valB);
        });
        if (limit) data = data.slice(0, limit);
        return { data };
    },

    async create(inquiryData) {
        const data = this._getData();
        const record = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2),
            ...inquiryData,
            created_at: inquiryData.created_at || inquiryData.submitted_at || new Date().toISOString()
        };
        data.push(record);
        this._saveData(data);
        return record;
    },

    async delete(id) {
        let data = this._getData();
        data = data.filter(item => item.id !== id);
        this._saveData(data);
        return { success: true };
    }
};

// ============================================
// Supabase 백엔드 구현
// ============================================
const SupabaseBackend = {
    async getAll({ limit = 1000, sort = '-created_at' } = {}) {
        const desc = sort.startsWith('-');
        const field = sort.replace(/^-/, '');
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .order(field, { ascending: !desc })
            .limit(limit);
        if (error) throw new Error(error.message);
        return { data: data || [] };
    },

    async create(inquiryData) {
        const record = {
            ...inquiryData,
            created_at: inquiryData.created_at || inquiryData.submitted_at || new Date().toISOString()
        };
        const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .insert([record])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    async delete(id) {
        const { error } = await supabaseClient
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);
        if (error) throw new Error(error.message);
        return { success: true };
    }
};

// ============================================
// 통합 백엔드 인터페이스
// ============================================
const StorageBackend = isSupabaseConfigured && supabaseClient ? SupabaseBackend : LocalStorage;
