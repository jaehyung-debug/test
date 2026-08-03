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
- 거래처 CRUD와 견적서·견적 품목 CRUD, 개정본 및 엑셀 붙여넣기
- 프로젝트 등록과 비용구분별 예산 편집, 프로젝트 예산·원가·이익 집계
- 프로젝트 비용 등록·수정·소프트 삭제와 다건 엑셀 붙여넣기

## 미완료 범위

품목 마스터, 명세서, 입금 CRUD, 전자결재 워크플로, PDF/Excel 파일 출력, 증빙 파일 스토리지, 실제 대시보드 집계, 상세 RBAC 미들웨어와 E2E 테스트는 아직 구현되지 않았습니다. 이번 프로젝트 비용 기능에는 실제 증빙 업로드나 외부 회계·카드·은행 연동이 포함되지 않습니다.
