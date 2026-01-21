# 콘크리트 3D 프린터 코드 생성기

콘크리트 3D 프린터의 엔드이펙터(노즐) 회전을 제어하는 아두이노 코드를 자동 생성하는 웹 도구입니다.


## 🔧 아두이노 라이브러리 설치

생성된 코드를 사용하려면 다음 라이브러리가 필요합니다:

### LiquidCrystal 라이브러리

1. Arduino IDE 실행
2. `스케치` → `라이브러리 포함하기` → `라이브러리 관리...` 클릭
3. 검색창에 `LiquidCrystal` 입력
4. `LiquidCrystal` 설치

<img width="2933" height="1747" alt="image" src="https://github.com/user-attachments/assets/e3a79702-3ac3-48aa-8d4c-585c7f7eb465" />
<img width="3083" height="1750" alt="image" src="https://github.com/user-attachments/assets/18581b93-d279-40c7-876f-f3f39d354cdd" />

---

## 📝 사용법

### 1. 웹 도구 접속
https://orseungwon.github.io/3DCP-Rotating-End-Effector-Arduino-Code-Generator/ 접속

### 2. 설정 입력
| 항목 | 설명 | 기본값 |
|-----|------|-------|
| Z축 이동 시간 | 레이어 완료 후 Z축 상승 시간 (ms) | 2000 |
| 스텝 딜레이 | JOG 모드 기본 속도 (μs) | 150 |
| JOG 방향 | JOG 모드 수동 회전 방향 | CCW |
| JOG 스텝 | JOG 모드 수동 회전 스텝 수 | 8000 |

<img width="505" height="797" alt="image" src="https://github.com/user-attachments/assets/a759a9d6-48ce-471c-a354-e5b738fa56fa" />


### 3. 명령어 입력

한 줄에 하나씩 입력:

```
1 시간               → LINEAR (직선 이동)
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

<img width="1946" height="890" alt="image" src="https://github.com/user-attachments/assets/72044659-60e5-4a44-84a4-a00f60f64afb" />


**참고:**
- `8000 스텝 = 90°` (기어비 1:5 기준)
- 회전 시간이 0이면 기본 스텝 딜레이 사용

### 4. 미리보기 & 코드 생성
- `미리보기` 버튼: 경로 시각화
- `코드 생성` 버튼: 아두이노 코드 출력
- `복사` 버튼: 클립보드에 복사

<img width="1367" height="952" alt="image" src="https://github.com/user-attachments/assets/8cc326e2-5ed8-4fa7-87fa-d0424649f32a" />
<img width="1999" height="1358" alt="image" src="https://github.com/user-attachments/assets/0e801ed9-0204-4c5a-95e6-7ccd82c95a71" />


### 5. 아두이노 업로드
1. Arduino IDE에 코드 붙여넣기
2. 보드 및 포트 선택
3. 업로드

<img width="2758" height="1583" alt="image" src="https://github.com/user-attachments/assets/a499a187-e8f8-4a8d-be31-cc81644ef23e" />
<img width="2467" height="1448" alt="image" src="https://github.com/user-attachments/assets/297c080c-1e29-4e9a-8903-46fa99ce95cd" />
<img width="2598" height="1528" alt="image" src="https://github.com/user-attachments/assets/da2233ce-51d8-4370-9f6f-49508258311e" />


---

## 🎮 버튼 기능

| 버튼 | 색상 | 핀 | 기능 |
|-----|------|-----|------|
| START | 파랑 | 28 | 시작 |
| STOP | 빨강 | 34 | 일시정지/재개 |
| SKIP | 노랑 | 32 | LINEAR 스킵 |
| JOG | 초록 | 30 | 수동 90° 회전 |

**참고:**
- 빨강 버튼을 눌러서 중지 후, 파랑 버튼을 누르면 재시작
  
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
