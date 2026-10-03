# CS 국가기관 네트워크망 관리 V1

Next.js 16 + Supabase. 기획은 상위 폴더의 `PRD.md`, `디자인.md` 참고.

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # Supabase URL, publishable(anon) 키 입력
npm run dev                        # http://localhost:3000
```

## Supabase 준비

SQL Editor 에서 [supabase/schema.sql](supabase/schema.sql) 전체 실행 (테이블, 권한, 샘플 직원·기관).

## Vercel 배포 (vercel.com)

1. 이 폴더를 GitHub 저장소로 올린다.
2. vercel.com → **Add New → Project** → 저장소 **Import**.
3. Framework Preset 은 **Next.js** 로 자동 인식된다. 저장소 루트가 이 폴더가 아니면 **Root Directory** 를 `cs-network` 로 지정.
4. **Environment Variables** 에 두 개 추가 후 **Deploy**:

| 이름 | 값 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Publishable key (`sb_publishable_...`) |

AI 기능(기관 점검 분석, 보고서 종합 의견, 기술지원 AI 질문)을 쓰려면 하나 더 추가한다. 서버에서만 쓰는 비밀 키이므로 `NEXT_PUBLIC_` 를 붙이지 않는다.

| 이름 | 값 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API 키 (`sk-ant-...`, console.anthropic.com 에서 발급) |

환경변수를 나중에 바꾸면 **Redeploy** 해야 반영된다 (`NEXT_PUBLIC_` 값은 빌드 시점에 들어간다).

## 주의

V1 은 로그인이 없다. 배포 주소를 아는 사람은 누구나 데이터를 읽고 쓸 수 있으므로 IP·계정·망 구성도는 저장하지 않는다.
