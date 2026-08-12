# 영업조직 핵심과제 Tracker

기존 "영업조직 핵심과제 tracker" 구글 스프레드시트를 대체하는 웹 대시보드입니다.
전체 인원이 열람 가능하고, 누구나 과제를 생성할 수 있으며, 과제 수정은 작성자 본인과 관리자/CEO만 가능합니다.

## 스택

- Next.js 16 (App Router, Proxy — `middleware`가 아니라 `proxy.js`로 이름이 바뀐 버전)
- Supabase (Postgres DB + Auth, 이메일 인증 기반 자체 계정)
- Tailwind CSS v4, Recharts
- Vercel 배포

## 최초 셋업

### 1. Supabase 프로젝트 생성

1. https://supabase.com 에서 새 프로젝트 생성
2. **Authentication → Providers → Email**에서 "Confirm email"이 켜져 있는지 확인 (기본값 On) — 이 설정이 "사내 이메일 인증" 역할을 합니다.
3. **SQL Editor**에서 [`supabase/schema.sql`](supabase/schema.sql) 전체 내용을 실행합니다. (이미 schema.sql을 실행한 프로젝트라면 `supabase/migrations/`에 있는 파일들을 번호 순서대로 추가 실행하세요.)

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`Project Settings → API`에서 값을 채웁니다.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 앱 런타임에서 사용
- `SUPABASE_SERVICE_ROLE_KEY`: `scripts/import-tasks.mjs`(1회성 데이터 이관) + 사용자 추방 기능(`lib/admin-actions.js`)에서 서버 사이드로만 사용. 브라우저에 절대 노출되지 않지만, 앱이 실제로 동작하려면 배포 환경에도 반드시 설정해야 함 — 절대 커밋 금지
- `ALLOWED_EMAIL_DOMAIN`: 가입 허용 이메일 도메인 (기본 `wonandone.co.kr`)

### 3. 의존성 설치 및 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인합니다.

### 4. 최초 관리자 계정 만들기

1. 앱에서 `/signup`으로 본인 계정을 가입 (사내 이메일 인증 메일이 발송됩니다)
2. 이메일의 인증 링크 클릭 후 로그인
3. Supabase SQL Editor에서 본인을 관리자로 승격:

```sql
update profiles set role = 'admin' where email = 'you@wonandone.co.kr';
```

4. 이후부터는 앱의 "권한 관리" 화면에서 다른 가입자의 권한을 조정할 수 있습니다.

### 5. 기존 스프레드시트 데이터 이관

`SUPABASE_SERVICE_ROLE_KEY`가 `.env.local`에 설정되어 있어야 합니다.

```bash
npm run import:tasks
```

`핵심`, `부서별` 두 탭의 데이터를 읽어 `tasks` 테이블에 삽입하고, "업무 진행이력" 컬럼은 `task_updates`에 첫 이력으로 기록합니다.

**확인 필요**: 스프레드시트의 "완료일정" 컬럼은 연도가 없는 형식(`08월 14일`)이라 스크립트가 올해 연도로 가정합니다. 이관 후 날짜가 맞는지 화면에서 한 번씩 확인해주세요.

## 권한 구조

| 역할 | 권한 |
| --- | --- |
| `viewer` (기본값, 화면엔 무표시) | 전체 과제 열람, 과제 생성, **본인이 생성한 과제**만 수정, 진행이력 등록 |
| `admin` (관리자) | 모든 과제 수정/삭제 + 사용자 권한 관리 |
| `ceo` (대표이사) | admin과 동일한 권한 — 등급 구분용 별도 라벨 |

신규 가입자는 `viewer`로 시작하며, 관리자/CEO가 "권한 관리" 화면에서 승격합니다.
자신이 만들지 않은 과제는 admin/ceo가 아닌 이상 조회만 가능하고 수정할 수 없습니다 (테이블/보드에 🔒 표시).
관리자/CEO는 "권한 관리" 화면에서 다른 계정을 추방(계정 완전 삭제)할 수 있습니다 — 본인 계정은 추방 불가, 되돌릴 수 없음.

## 화면 구성

- **개요**: 전체 통계 카드, Status 분포, 사업부별 평균 진척률, 대표이사 의사결정 카드 보드 — 카드 클릭 시 과제 상세 모달이 그 자리에서 열림
- **과제**: 핵심과제·부서별 과제 통합 목록. 칸반 보드(드래그로 Status 이동) ↔ 테이블 뷰 전환, 필터(유형/사업부/Status/의사결정 필요), "+ 새 과제"와 기존 과제 클릭이 동일한 상세 모달로 연결
- **대표이사 보고 리포트** (`/report`): 통계 요약 + 의사결정 카드 보드를 인쇄용으로 정리한 화면. "인쇄 / PDF로 저장" 버튼 클릭 → 브라우저 인쇄 대화상자에서 "PDF로 저장" 선택
- **권한 관리** (admin/ceo 전용): 가입자 목록 및 역할 변경

## Vercel 배포

```bash
npx vercel
```

Vercel 프로젝트 설정의 Environment Variables에 `.env.local`과 동일한 값을 모두 등록합니다 (`SUPABASE_SERVICE_ROLE_KEY` 포함 — 사용자 추방 기능에 필요).
