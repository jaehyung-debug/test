# 견적·명세·프로젝트 비용관리

## Windows 초보자용 실행법 (Docker 불필요)

이 프로그램은 로컬 SQLite 파일을 사용하므로 PostgreSQL이나 Docker Desktop을 설치할 필요가 없습니다.

1. 프로젝트 ZIP 파일을 다운로드합니다.
2. 원하는 폴더에 ZIP 압축을 해제합니다.
3. 압축을 푼 폴더의 **`start-local.bat`을 더블클릭**합니다.
4. 설치가 끝나고 서버가 시작되면 브라우저에서 <http://localhost:3000>에 접속합니다.
5. 이메일 **`admin@example.com`**, 비밀번호 **`Test1234!`**로 로그인합니다.

Node.js가 없다면 실행 창에 표시되는 안내에 따라 [Node.js LTS](https://nodejs.org/)를 먼저 설치하십시오. 첫 실행에서는 pnpm과 패키지를 설치하고, `prisma/dev.db` SQLite 데이터베이스를 자동 생성한 뒤 초기 데이터를 넣습니다. 이후 실행해도 Seed는 기존 데이터를 갱신하므로 중복 오류가 발생하지 않습니다.

> `.env.example`의 계정과 인증 키는 로컬 개발 편의를 위한 기본값입니다. 외부에 공개하거나 운영 환경에서 사용할 때는 반드시 변경하십시오.

## 명령줄에서 실행

```bash
cp .env.example .env       # Windows 명령 프롬프트: copy .env.example .env
pnpm install
pnpm db:setup              # Prisma Client 생성 + SQLite DB 반영 + Seed
pnpm dev
```

`pnpm local`을 사용하면 DB 준비와 개발 서버 실행을 한 번에 수행할 수 있습니다. 별도의 데이터베이스 서버는 필요하지 않습니다.

## 검사

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## 데이터베이스

- Prisma SQLite connector를 사용합니다.
- 기본 연결 문자열은 `file:./dev.db`이며 실제 파일은 `prisma/dev.db`에 생성됩니다.
- 금액 필드는 Prisma `Decimal`로 유지하되 PostgreSQL 전용 native type annotation은 사용하지 않습니다.
- 문서번호 Sequence 갱신은 원자적 `upsert`/`increment`와 일시적인 SQLite 잠금 재시도로 처리합니다.

## 구현됨

- 업무 모델, enum, 관계, 고유 제약, 소프트 삭제 인덱스를 포함한 Prisma schema
- 환경변수 기반 관리자 및 기본 비용 구분을 중복 없이 생성하는 Seed
- Auth.js Credentials 인증, 비활성/삭제 계정 차단, bcrypt 검증, 로그인 감사 로그
- 역할/권한 모듈, 문서번호 발급 모듈
- bigint 기반 견적/프로젝트 금액 계산과 단위 테스트
- 공통 관리자 레이아웃과 기반 대시보드

## 후속 개발 범위

1차 MVP 이후 거래명세서, 다단계 승인 워크플로, PDF/Excel, 첨부파일 스토리지, 역할별 세부 데이터 접근범위, 보고서와 브라우저 E2E 테스트를 순차적으로 구현할 예정입니다. 제공하지 않는 기능은 사이드바에서 `준비 중`으로 명확히 표시합니다.

## 1차 MVP 업무 기능

로그인 후 사이드바에서 거래처, 품목, 견적서, 프로젝트, 프로젝트 비용, 입금 및 미수금을 실제 SQLite 데이터로 관리할 수 있습니다. 견적 품목은 등록 품목 선택 또는 직접 입력을 지원하며 서버에서 합계를 다시 계산합니다. 견적서의 프로젝트 전환, 프로젝트별 비용·입금 집계와 대시보드 실시간 집계가 연결되어 있습니다. 아직 제공하지 않는 메뉴는 사이드바에서 `준비 중`으로 표시됩니다.
