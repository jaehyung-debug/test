# 견적·명세·프로젝트 비용관리

Next.js, Prisma, PostgreSQL 기반 업무 관리 시스템입니다. 현재 **1단계 기반 구성**과 전체 데이터 모델, 공통 금액 계산의 첫 구현을 제공합니다.

## 실행

```bash
cp .env.example .env
# AUTH_SECRET, ADMIN_PASSWORD를 안전한 값으로 설정
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate --name init
pnpm db:seed
pnpm dev
```

관리자 이메일은 `ADMIN_EMAIL`(기본 `admin@example.com`), 비밀번호는 반드시 환경변수 `ADMIN_PASSWORD`에서만 읽습니다.

## 검사

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 구현됨

- 요청 모델·enum·관계·고유 제약·소프트 삭제 인덱스를 포함한 Prisma schema
- PostgreSQL Docker Compose, 환경변수 예제, 환경변수 기반 관리자/비용구분 seed
- Auth.js Credentials 인증 기반, 비활성/삭제 계정 차단, bcrypt 검증, 로그인 감사 로그
- 역할/권한 기반 모듈, 동시성 안전 문서번호 발급 모듈
- bigint 기반 견적/프로젝트 금액 계산 및 단위 테스트
- 공통 관리자 레이아웃과 기반 대시보드

## 미완료 범위

요구사항 전체는 여러 개발 단계에 해당합니다. 현재 거래처·품목·견적·명세·프로젝트·지출·입금 CRUD API/UI, 승인 워크플로, PDF/Excel, 파일 스토리지, 실제 대시보드 집계, 상세 RBAC 미들웨어, 통합/E2E 테스트는 아직 구현되지 않았습니다. 대시보드의 `—` 값은 이 사실을 명확히 표시하며 임시 업무 데이터는 사용하지 않습니다.

다음 단계에서는 기준정보 CRUD를 서비스 계층, Zod 검증, 감사 로그와 함께 구현해야 합니다.
