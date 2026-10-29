# ITDA 도메인 분리 / 편집 도구 안내 (v3)

## 현재 코드에서 적용한 주소 분리

| 공개 주소 | 시작 화면 | 주소 등록 |
| --- | --- | --- |
| `itda.ink` | ITDA 메인 포털 | Vercel Settings → Domains |
| `customer.itda.ink` | 소비자용 거리 탐색 | 동일 Vercel 프로젝트에 등록 |
| `owner.itda.ink` | 점주용 콘텐츠 제안 **시연** | 동일 Vercel 프로젝트에 등록 |
| `editor.itda.ink` | 관리자 편집 대시보드 | 동일 Vercel 프로젝트에 등록 |

- Vercel의 `*.vercel.app` 미리보기에서는 `/` 소비자 페이지, `/owner`, `/editor`, `/map-editor`, `/street-editor`, `/welcome` 등 **기존 경로를 유지**합니다.
- 고객용/점주용/관리자용 화면은 `window.location.hostname`을 기준으로 선택합니다. **서브도메인만 연결한다고 데이터가 공유되지는 않습니다.**
- `editor.itda.ink/map-editor` : 경계, 보행 동선, 촬영 지점, 가게 위치
- `editor.itda.ink/street-editor` : 지점별 촬영 사진, 점포 외곽선
- `editor.itda.ink/preview/customer` : **같은 원본 주소 내 임시 미리보기**. 실제 `customer.itda.ink`와 동일한 공개 데이터가 아닙니다.
- `owner.itda.ink/preview/customer` : 점주 홍보 승인 내용을 같은 브라우저 저장소에서 확인하는 **시연 미리보기**. 실제 공개 반영이 아닙니다.

## Namecheap + Vercel 연결

1. Namecheap에서 `itda.ink`를 구매한 후 기존 Vercel 프로젝트 설정 > Domains에서 위 4개 이름을 등록합니다.
2. Domain Settings에 나온 프로젝트별 DNS 값들을 확인합니다.
3. Namecheap Domain List > Manage > Advanced DNS에서, Namecheap을 DNS 제공자로 사용할 경우, 루트 `@` A 레코드와 각 서브도메인 `customer`, `owner`, `editor` CNAME을 설정합니다. **Vercel이 실제로 제시한 값을 사용**합니다. 기존 충돌 레코드와 Nameserver 설정을 확인하세요.
4. DNS 검증, HTTPS 인증서 발급, 각 주소의 실제 접속과 새로고침 동작을 확인합니다.
5. DNS 구성만으로 운영 중인 앱의 데이터를 이전하거나 서버 인증을 제공하지 않습니다.

## 관리자 데이터 백업 / 도메인 이사

- 기존 `*.vercel.app/editor`에 저장된 데이터가 있다면 **사진 포함 전체 백업**을 눌러 JSON 파일로 저장하세요.
- `editor.itda.ink`에 접속하여 **전체 백업 가져오기**를 누르면 **그 주소 브라우저 저장소로** 설정을 복원할 수 있습니다.
- JSON은 사진 데이터까지 포함하므로 크기가 클 수 있고, 사진 사용권에 유의하세요.
- 지도/사진을 편집한 뒤에는 **같은 주소의 `/preview/customer`**에서 확인하세요.
- 실제 소비자/점주가 모든 기기에서 같은 데이터를 보게 하려면 **DB + 파일 스토리지 + 인증 + 서버 게시/승인 API**가 필요합니다. 이 배포에 포함되어 있지 않습니다.

## 보안 및 실제 구현 범위

- **관리자 접근 제어는 미구현**. `/editor`를 다른 서브도메인으로 분리하는 것은 보안 수단이 아닙니다. 공개 서버 운영 전 Vercel의 배포 보호 또는 서버 측 인증, 데이터 수정 권한 검증이 필요합니다.
- 점주용 홍보 제안은 코드에 작성한 예시 문구 선택 방식입니다. **실제 AI API 호출이나 생성형 AI 모델은 연결되지 않았습니다.**
- 가게 이름/층/좌표는 시연 데이터이고 AI 점포 자동 인식, 공공데이터 API 연동, 자동 게시, 360도 파노라마는 아직 구현하지 않았습니다.
- 기존 지도가 외부 지도 서비스 캡처인 경우 공개 서비스 사용 전에 라이선스를 확인해야 합니다.
- 도메인 분리 후 localStorage/IndexedDB는 브라우저의 **서로 다른 출처(origin)**에 격리되므로, 홍보 문구와 지도 데이터는 자동으로 주고받지 않습니다.

## 사용자 테스트

- `npm ci`, `npm run build`로 검증합니다.
- Namecheap 도메인 연결 전에는 기존 Vercel 주소에서 `/welcome`으로 메인 포털 시연, `/editor`에서 관리자 대시보드를 테스트할 수 있습니다.
- 이후 도메인 연결되면 루트 포털, 소비자, 점주, 편집 각 서브도메인 접속을 확인하세요.
