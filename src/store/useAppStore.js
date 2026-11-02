import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { askAgent } from '../api/client'

// ── 앱 전체가 함께 쓰는 상태(store) ──────────────────────
// 여러 페이지에서 같이 쓰는 데이터는 여기에 둡니다. (한 페이지에서만 쓰면 useState)
// 사용법:  const nickname = useAppStore((s) => s.nickname)
export const useAppStore = create(
  persist(
    (set, get) => ({
      // ① 사용자 — localStorage 에 저장되어 새로고침해도 유지
      nickname: '',
      setNickname: (nickname) => set({ nickname: nickname.trim() }),

      // ② 알림(토스트) — 어느 페이지에서든 get().toast('메시지')
      toasts: [],
      toast: (message, variant = 'success') => {
        const id = Date.now() + Math.random()
        set({ toasts: [...get().toasts, { id, message, variant }] })
        setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 2500)
      },

      // ③ 즐겨찾기 — Supabase favorites 테이블과 동기화 (STEP 5)
      favorites: [],
      favLoading: false,
      loadFavorites: async () => {
        if (!supabase) return get().toast('Supabase 설정(.env.local)이 필요해요', 'warning')
        set({ favLoading: true })
        const { data, error } = await supabase
          .from('favorites').select('*')
          .eq('nickname', get().nickname || '익명')
          .order('created_at', { ascending: false })
        set({ favLoading: false })
        if (error) return get().toast(error.message, 'danger')
        set({ favorites: data })
      },
      addFavorite: async ({ source, id, title }) => {
        if (!supabase) return get().toast('Supabase 설정(.env.local)이 필요해요', 'warning')
        const nickname = get().nickname || '익명'
        const row = { nickname, source, item_id: String(id), title }
        // 같은 항목을 두 번 담지 않도록 먼저 확인해요
        const { data: dup } = await supabase.from('favorites').select('id')
          .eq('nickname', nickname).eq('source', source).eq('item_id', row.item_id).limit(1)
        if (dup?.length) return get().toast('이미 올레 수첩에 담겨 있어요', 'warning')
        const { data, error } = await supabase.from('favorites').insert(row).select().single()
        if (error) return get().toast(error.message, 'danger')
        set({ favorites: [data, ...get().favorites] })
        get().toast('올레 수첩에 담았어요')
      },
      // 수첩에서 빼기 — Supabase 에서 지우고 화면 목록에서도 바로 뺍니다
      removeFavorite: async (id) => {
        if (!supabase) return get().toast('Supabase 설정(.env.local)이 필요해요', 'warning')
        const { data, error } = await supabase.from('favorites').delete().eq('id', id).select()
        if (error) return get().toast(error.message, 'danger')
        // 삭제 권한(RLS 정책)이 없으면 오류 없이 0건이 지워져요 → 안내
        if (!data?.length) return get().toast('삭제되지 않았어요. Supabase 에 delete 정책을 추가해야 해요 (README 참고)', 'danger')
        set({ favorites: get().favorites.filter((f) => f.id !== id) })
        get().toast('올레 수첩에서 뺐어요')
      },

      // ④ STEP 6: 에이전트 대화 — 페이지를 옮겨도 대화가 남도록 store 에 둡니다
      messages: [],          // { role: 'user' | 'assistant', text, steps }
      chatLoading: false,
      sendMessage: async (text) => {
        const history = get().messages.map((m) => ({ role: m.role, content: m.text }))  // Claude 형식
        set({ messages: [...get().messages, { role: 'user', text }], chatLoading: true })
        try {
          const { answer, steps } = await askAgent(text, history)
          set({ messages: [...get().messages, { role: 'assistant', text: answer, steps }] })
        } catch (e) {
          get().toast(e.message, 'danger')
        } finally {
          set({ chatLoading: false })
        }
      },
    }),
    {
      name: 'jeju-ip-store',                          // localStorage 키 이름
      partialize: (s) => ({ nickname: s.nickname }),  // 저장할 항목만 고르기
    },
  ),
)
