# 콘크리트 3D 프린터 코드 생성기

콘크리트 3D 프린터의 엔드이펙터(노즐) 회전을 제어하는 아두이노 코드를 자동 생성하는 웹 도구입니다.

## 🌐 GitHub Pages 배포 방법 (Windows)

### 방법 1: GitHub 웹사이트에서 직접 업로드

1. [GitHub](https://github.com) 로그인
2. 우측 상단 `+` 버튼 → `New repository` 클릭
3. Repository name 입력 (예: `concrete-printer-generator`)
4. `Public` 선택 → `Create repository` 클릭
5. `uploading an existing file` 클릭
6. `index.html`, `style.css`, `script.js` 3개 파일 드래그 앤 드롭
7. `Commit changes` 클릭
8. `Settings` 탭 → 좌측 메뉴 `Pages` 클릭
9. Source에서 `Deploy from a branch` 선택
10. Branch를 `main` → `/ (root)` 선택 → `Save` 클릭
11. 몇 분 후 `https://[사용자명].github.io/[레포명]` 에서 접속 가능

### 방법 2: Git 사용 (명령어)

```bash
# 1. 폴더 생성 및 이동
mkdir concrete-printer-generator
cd concrete-printer-generator

# 2. 파일 3개를 이 폴더에 복사 (index.html, style.css, script.js)

# 3. Git 초기화 및 커밋
git init
git add .
git commit -m "Initial commit"

# 4. GitHub 레포지토리 연결 (미리 GitHub에서 레포 생성 필요)
git remote add origin https://github.com/[사용자명]/[레포명].git
git branch -M main
git push -u origin main

# 5. GitHub Settings → Pages에서 배포 설정
```

---

## 🔧 아두이노 라이브러리 설치

생성된 코드를 사용하려면 다음 라이브러리가 필요합니다:

### LiquidCrystal_I2C 라이브러리

1. Arduino IDE 실행
2. `스케치` → `라이브러리 포함하기` → `라이브러리 관리...` 클릭
3. 검색창에 `LiquidCrystal I2C` 입력
4. **Frank de Brabander**의 `LiquidCrystal I2C` 설치

또는 수동 설치:
- [GitHub 다운로드](https://github.com/johnrickman/LiquidCrystal_I2C)
- ZIP 파일 다운로드 → `스케치` → `라이브러리 포함하기` → `.ZIP 라이브러리 추가...`

### Wire 라이브러리
- Arduino IDE에 기본 포함되어 있음 (별도 설치 불필요)

---

## 📝 사용법

### 1. 웹 도구 접속
배포된 GitHub Pages URL 또는 `index.html` 파일을 브라우저로 열기

### 2. 설정 입력
| 항목 | 설명 | 기본값 |
|-----|------|-------|
| Z축 이동 시간 | 레이어 완료 후 Z축 상승 시간 (ms) | 2000 |
| 스텝 딜레이 | JOG 모드 기본 속도 (μs) | 150 |
| JOG 방향 | 수동 회전 방향 | CCW |
| JOG 스텝 | 수동 회전 스텝 수 | 8000 |

### 3. 명령어 입력

한 줄에 하나씩 입력:

```
1 시간           → LINEAR (직선 이동)
2 시간 스텝      → CW (시계방향 회전)
3 시간 스텝      → CCW (반시계방향 회전)
```

**예시 (정사각형 패턴):**
```
1 3000
3 3000 8000
1 3000
3 3000 8000
1 3000
3 3000 8000
1 3000
3 3000 8000
```

**참고:**
- `8000 스텝 = 90°` (기어비 1:5 기준)
- 회전 시간이 0이면 기본 스텝 딜레이 사용

### 4. 미리보기 & 코드 생성
- `미리보기` 버튼: 경로 시각화
- `코드 생성` 버튼: 아두이노 코드 출력
- `복사` 버튼: 클립보드에 복사

### 5. 아두이노 업로드
1. Arduino IDE에 코드 붙여넣기
2. 보드 및 포트 선택
3. 업로드

---

## 🎮 버튼 기능

| 버튼 | 색상 | 핀 | 기능 |
|-----|------|-----|------|
| START | 파랑 | 28 | 시작 |
| STOP | 빨강 | 34 | 일시정지/재개 |
| SKIP | 노랑 | 32 | LINEAR 스킵 |
| JOG | 초록 | 30 | 수동 90° 회전 |

---

## 📁 파일 구조

```
/
├── index.html    # 메인 페이지
├── style.css     # 스타일
├── script.js     # 로직
└── README.md     # 사용 설명서
```

---

## ⚙️ 하드웨어 연결

### 스텝 모터 드라이버 (A4988)
| 핀 | 아두이노 | 설명 |
|-----|---------|------|
| DIR | 3 | 회전 방향 |
| STEP | 4 | 스텝 신호 |
| SLEEP | 10 | 슬립 모드 |
| RESET | 9 | 리셋 |
| ENABLE | 5 | 모터 활성화 |
| MS1 | 6 | 마이크로스테핑 |
| MS2 | 7 | 마이크로스테핑 |
| MS3 | 8 | 마이크로스테핑 |

### LCD (I2C)
| 핀 | 아두이노 |
|-----|---------|
| SDA | SDA |
| SCL | SCL |
| VCC | 5V |
| GND | GND |

---

## 📜 라이선스

MIT License