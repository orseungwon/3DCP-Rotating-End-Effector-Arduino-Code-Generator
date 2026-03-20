// =====================================================
// DOM Elements
// =====================================================
const zAxisTimeInput = document.getElementById('zAxisTime');
const stepDelayInput = document.getElementById('stepDelay');
const jogDirSelect = document.getElementById('jogDir');
const jogStepsInput = document.getElementById('jogSteps');
const commandInput = document.getElementById('commandInput');
const errorMessage = document.getElementById('errorMessage');
const previewBtn = document.getElementById('previewBtn');
const generateBtn = document.getElementById('generateBtn');
const outputSection = document.getElementById('outputSection');
const codeOutput = document.getElementById('codeOutput').querySelector('code');
const copyBtn = document.getElementById('copyBtn');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

// =====================================================
// Command Parser
// =====================================================
function parseCommands(text) {
    const lines = text.trim().split('\n');
    const commands = [];
    const errors = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed === '') return; // 빈 줄 무시

        const parts = trimmed.split(/\s+/).map(Number);
        const lineNum = index + 1;

        // 유효성 검사
        if (parts.some(isNaN)) {
            errors.push(`${lineNum}번째 줄: 숫자만 입력하세요`);
            return;
        }

        const type = parts[0];

        if (type === 1) {
            // LINEAR: "1 시간"
            if (parts.length < 2) {
                errors.push(`${lineNum}번째 줄: LINEAR는 "1 시간" 형식입니다`);
                return;
            }
            commands.push({
                type: 1,
                timeMs: parts[1],
                steps: 0
            });
        } else if (type === 2 || type === 3) {
            // ROTATE: "2 시간 스텝" 또는 "3 시간 스텝"
            if (parts.length < 3) {
                errors.push(`${lineNum}번째 줄: 회전은 "타입 시간 스텝" 형식입니다`);
                return;
            }
            commands.push({
                type: type,
                timeMs: parts[1],
                steps: parts[2]
            });
        } else {
            errors.push(`${lineNum}번째 줄: 타입은 1, 2, 3 중 하나여야 합니다`);
        }
    });

    return { commands, errors };
}

// =====================================================
// Preview Drawing
// =====================================================
function drawPreview(commands) {
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    // Clear canvas
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (commands.length === 0) {
        ctx.fillStyle = '#71717a';
        ctx.font = '14px "Noto Sans KR"';
        ctx.textAlign = 'center';
        ctx.fillText('명령어를 입력하세요', canvas.width / 2, canvas.height / 2);
        return;
    }

    // 경로 계산
    const path = calculatePath(commands);
    
    if (path.length === 0) return;

    // 경로 범위 계산
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    path.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    });

    // 스케일 계산
    const pathWidth = maxX - minX || 1;
    const pathHeight = maxY - minY || 1;
    const scale = Math.min(width / pathWidth, height / pathHeight) * 0.8;

    // 중앙 정렬 오프셋
    const offsetX = padding + (width - pathWidth * scale) / 2 - minX * scale;
    const offsetY = padding + (height - pathHeight * scale) / 2 - minY * scale;

    // 그리드 그리기
    drawGrid(offsetX, offsetY, scale);

    // 경로 그리기
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    path.forEach((point, index) => {
        const x = point.x * scale + offsetX;
        const y = point.y * scale + offsetY;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // 시작점 그리기
    const startX = path[0].x * scale + offsetX;
    const startY = path[0].y * scale + offsetY;
    
    ctx.beginPath();
    ctx.fillStyle = '#22c55e';
    ctx.arc(startX, startY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#0a0a0b';
    ctx.arc(startX, startY, 4, 0, Math.PI * 2);
    ctx.fill();

    // 끝점 그리기
    const endX = path[path.length - 1].x * scale + offsetX;
    const endY = path[path.length - 1].y * scale + offsetY;

    ctx.beginPath();
    ctx.fillStyle = '#f97316';
    ctx.arc(endX, endY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#0a0a0b';
    ctx.arc(endX, endY, 4, 0, Math.PI * 2);
    ctx.fill();

    // 방향 화살표 그리기
    drawArrows(path, scale, offsetX, offsetY);
}

function calculatePath(commands) {
    const path = [{ x: 0, y: 0 }];
    let currentX = 0;
    let currentY = 0;
    let currentAngle = 0; // 라디안, 0 = 오른쪽

    // LINEAR 시간의 최대값 찾기 (스케일링용)
    const maxTime = Math.max(...commands.filter(c => c.type === 1).map(c => c.timeMs), 1);

    commands.forEach(cmd => {
        if (cmd.type === 1) {
            // LINEAR: 현재 방향으로 이동
            const length = (cmd.timeMs / maxTime) * 100; // 시간에 비례한 길이
            currentX += Math.cos(currentAngle) * length;
            currentY += Math.sin(currentAngle) * length;
            path.push({ x: currentX, y: currentY });
        } else if (cmd.type === 2) {
            // CW: 시계방향 회전 (각도 증가)
            const angleDelta = (cmd.steps / 8000) * (Math.PI / 2);
            currentAngle += angleDelta;
        } else if (cmd.type === 3) {
            // CCW: 반시계방향 회전 (각도 감소)
            const angleDelta = (cmd.steps / 8000) * (Math.PI / 2);
            currentAngle -= angleDelta;
        }
    });

    return path;
}

function drawGrid(offsetX, offsetY, scale) {
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.5;

    const gridSize = 50;
    const numLines = 10;

    for (let i = -numLines; i <= numLines; i++) {
        // 수직선
        ctx.beginPath();
        ctx.moveTo(i * gridSize * scale / 100 + offsetX, -numLines * gridSize * scale / 100 + offsetY);
        ctx.lineTo(i * gridSize * scale / 100 + offsetX, numLines * gridSize * scale / 100 + offsetY);
        ctx.stroke();

        // 수평선
        ctx.beginPath();
        ctx.moveTo(-numLines * gridSize * scale / 100 + offsetX, i * gridSize * scale / 100 + offsetY);
        ctx.lineTo(numLines * gridSize * scale / 100 + offsetX, i * gridSize * scale / 100 + offsetY);
        ctx.stroke();
    }
}

function drawArrows(path, scale, offsetX, offsetY) {
    if (path.length < 2) return;

    ctx.fillStyle = '#3b82f6';

    for (let i = 0; i < path.length - 1; i++) {
        const x1 = path[i].x * scale + offsetX;
        const y1 = path[i].y * scale + offsetY;
        const x2 = path[i + 1].x * scale + offsetX;
        const y2 = path[i + 1].y * scale + offsetY;

        // 중간 지점에 화살표
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// =====================================================
// Code Generator
// =====================================================
function generateCode(commands, settings) {
    // 명령어 배열 문자열 생성 (주석 포함)
    const commandsStr = commands.map(cmd => {
        let comment = '';
        if (cmd.type === 1) {
            comment = `LINEAR ${cmd.timeMs / 1000}초`;
        } else if (cmd.type === 2) {
            const degrees = (cmd.steps / 8000) * 90;
            comment = `CW ${degrees}도 회전 (${cmd.timeMs / 1000}초)`;
        } else if (cmd.type === 3) {
            const degrees = (cmd.steps / 8000) * 90;
            comment = `CCW ${degrees}도 회전 (${cmd.timeMs / 1000}초)`;
        }
        return `  {${cmd.type}, ${cmd.timeMs}, ${cmd.steps}},      // ${comment}`;
    }).join('\n');

    const jogDirName = settings.jogDir === 2 ? 'CMD_CW' : 'CMD_CCW';

    return `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// =====================================================
// LCD 설정
// =====================================================
LiquidCrystal_I2C lcd(0x27, 16, 2);

// =====================================================
// 핀 정의
// =====================================================
// 스텝 모터 드라이버 핀
const int PIN_DIR    = 3;   // 회전 방향
const int PIN_STEP   = 4;   // 스텝 신호
const int PIN_SLEEP  = 10;  // 슬립 모드
const int PIN_RESET  = 9;   // 리셋
const int PIN_ENABLE = 5;   // 모터 활성화

// 마이크로스테핑 설정 핀
const int PIN_MS1 = 6;
const int PIN_MS2 = 7;
const int PIN_MS3 = 8;

// 버튼 핀 (INPUT_PULLUP 사용)
const int PIN_START = 28;  // 파란색 - 시작 버튼
const int PIN_STOP  = 34;  // 빨간색 - 일시정지/재개 버튼
const int PIN_SKIP  = 32;  // 노란색 - LINEAR 스킵 버튼
const int PIN_JOG   = 30;  // 초록색 - 수동 90도 회전 버튼

// =====================================================
// 기본 모션 파라미터
// =====================================================
const int STEP_DELAY_US = ${settings.stepDelay};  // JOG 모드에서 사용할 기본 스텝 딜레이 (마이크로초)
                                 // 값이 클수록 회전 속도가 느려짐

// =====================================================
// Z축 이동 시간 설정
// =====================================================
const unsigned long Z_AXIS_MOVE_TIME_MS = ${settings.zAxisTime};  // 레이어 완료 후 Z축 이동 시간 (밀리초)

// =====================================================
// 명령어 구조체 및 타입 정의
// =====================================================
// type: 1 = LINEAR (직선 이동), 2 = CW (시계방향 회전), 3 = CCW (반시계방향 회전)
// timeMs: 동작 시간 (밀리초)
//         - LINEAR: 직선 이동 지속 시간
//         - 회전: 회전에 걸리는 시간 (정확히 이 시간만큼 회전)
// steps: 회전 스텝 수 (회전 명령어에만 사용, 8000 = 90도)
//
// 예시:
//   {2, 3000, 8000}  : CW 방향으로 정확히 3초 동안 8000스텝(90도) 회전
//   {1, 3000, 0}     : Linear 모드로 3초 동안 이동
//   {3, 5000, 8000}  : CCW 방향으로 정확히 5초 동안 8000스텝(90도) 회전
// =====================================================

enum CommandType {
  CMD_LINEAR = 1,  // 직선 이동
  CMD_CW     = 2,  // 시계방향 회전
  CMD_CCW    = 3   // 반시계방향 회전
};

struct Command {
  int type;              // 명령어 타입 (1: LINEAR, 2: CW, 3: CCW)
  unsigned long timeMs;  // 동작 시간 (밀리초)
  long steps;            // 회전 스텝 수 (회전 명령어에만 사용)
};

// =====================================================
// 명령어 배열 (패턴 정의) - 자동 생성됨
// =====================================================
// 여기를 수정하여 다양한 패턴 생성 가능
// 각 명령어는 순서대로 실행됨
const Command commands[] = {
${commandsStr}
};

const int COMMAND_COUNT = sizeof(commands) / sizeof(commands[0]);

// =====================================================
// LINEAR 명령어 개수 계산 (LCD 표시용)
// =====================================================
int countLinearCommands() {
  int count = 0;
  for (int i = 0; i < COMMAND_COUNT; i++) {
    if (commands[i].type == CMD_LINEAR) count++;
  }
  return count;
}

// =====================================================
// 시스템 상태 FSM (Finite State Machine)
// =====================================================
enum SystemState {
  WAIT_FOR_START,   // 시작 대기 상태
  RUNNING_LINEAR,   // LINEAR 동작 실행 중
  RUNNING_ROTATE,   // 회전 동작 실행 중
  Z_AXIS_MOVE,      // Z축 이동 중
  STOPPED           // 일시정지 상태
};

SystemState currentState = WAIT_FOR_START;
SystemState prevState    = WAIT_FOR_START;  // 일시정지 전 상태 저장

// =====================================================
// 런타임 변수들
// =====================================================
// 레이어 및 명령어 추적
int currentLayer = 1;      // 현재 레이어 번호
int commandIndex = 0;      // 현재 실행 중인 명령어 인덱스
int linearCount  = 0;      // 현재 레이어에서 실행한 LINEAR 개수
int totalLinear  = 0;      // 레이어당 총 LINEAR 개수

// 타이밍 변수
unsigned long stateStartTimeMs = 0;  // 현재 상태 시작 시간 (밀리초)
unsigned long lastStepTimeUs   = 0;  // 마지막 스텝 신호 시간 (마이크로초)

// 회전 관련 변수
long rotateStepCounter = 0;                      // 현재 회전한 스텝 수
long targetRotateSteps = 0;                      // 목표 회전 스텝 수
unsigned long currentRotateDelayUs = STEP_DELAY_US;  // 현재 회전에 사용할 스텝 딜레이

// JOG 모드 관련 변수
bool jogRotateMode = false;                      // JOG 모드 활성화 여부
const int JOG_ROTATE_DIR = ${jogDirName};              // JOG 회전 방향 (CMD_CW 또는 CMD_CCW)
const long JOG_ROTATE_STEPS = ${settings.jogSteps};              // JOG 회전 스텝 수 (90도)
unsigned long jogRotateStartTime = 0;            // JOG 회전 시작 시간
unsigned long jogRotateEndTime = 0;              // JOG 회전 종료 시간

// =====================================================
// 버튼 상태 추적 (엣지 감지용)
// =====================================================
bool lastStartState = HIGH;
bool lastStopState  = HIGH;
bool lastSkipState  = HIGH;
bool lastJogState   = HIGH;

// =====================================================
// 함수 프로토타입
// =====================================================
void enterCommand();                           // 현재 명령어 진입
void enterLinear();                            // LINEAR 모드 진입
void enterRotate(int dir, long steps);         // 회전 모드 진입
void enterZAxis();                             // Z축 이동 모드 진입
bool updateLinear(unsigned long nowMs);        // LINEAR 동작 업데이트
bool updateRotate(unsigned long nowUs);        // 회전 동작 업데이트
void advanceCommand();                         // 다음 명령어로 진행
void restoreLCD();                             // LCD 상태 복원 (재개 시)

// =====================================================
// Setup - 초기 설정
// =====================================================
void setup() {
  // LCD 초기화
  lcd.init();
  lcd.backlight();
  lcd.print("WAIT FOR START");

  // 모터 드라이버 핀 설정
  pinMode(PIN_DIR, OUTPUT);
  pinMode(PIN_STEP, OUTPUT);
  pinMode(PIN_SLEEP, OUTPUT);
  pinMode(PIN_RESET, OUTPUT);
  pinMode(PIN_ENABLE, OUTPUT);

  // 마이크로스테핑 핀 설정
  pinMode(PIN_MS1, OUTPUT);
  pinMode(PIN_MS2, OUTPUT);
  pinMode(PIN_MS3, OUTPUT);

  // 버튼 핀 설정 (풀업 저항 사용)
  pinMode(PIN_START, INPUT_PULLUP);
  pinMode(PIN_STOP,  INPUT_PULLUP);
  pinMode(PIN_SKIP,  INPUT_PULLUP);
  pinMode(PIN_JOG,   INPUT_PULLUP);

  // 1/16 마이크로스테핑 설정 (MS1=MS2=MS3=HIGH)
  digitalWrite(PIN_MS1, HIGH);
  digitalWrite(PIN_MS2, HIGH);
  digitalWrite(PIN_MS3, HIGH);

  // 모터 드라이버 활성화
  digitalWrite(PIN_SLEEP, HIGH);  // 슬립 모드 해제
  digitalWrite(PIN_RESET, HIGH);  // 리셋 해제
  digitalWrite(PIN_ENABLE, LOW);  // 모터 활성화

  // 기본 회전 방향 설정
  digitalWrite(PIN_DIR, HIGH);

  // LINEAR 명령어 총 개수 계산
  totalLinear = countLinearCommands();
}

// =====================================================
// Loop - 메인 루프
// =====================================================
void loop() {
  unsigned long nowMs = millis();   // 현재 시간 (밀리초)
  unsigned long nowUs = micros();   // 현재 시간 (마이크로초)

  // ---------------- STOP 버튼 처리 (일시정지/재개) ----------------
  bool stopBtn = digitalRead(PIN_STOP);
  if (lastStopState == HIGH && stopBtn == LOW) {  // 버튼이 눌렸을 때
    if (currentState != STOPPED) {
      // 일시정지
      prevState = currentState;              // 현재 상태 저장
      currentState = STOPPED;                // 정지 상태로 전환
      digitalWrite(PIN_ENABLE, HIGH);        // 모터 비활성화
      lcd.clear();
      lcd.print("PAUSED");
    } else {
      // 재개
      currentState = prevState;              // 이전 상태로 복원
      stateStartTimeMs = nowMs;              // 시간 재설정
      digitalWrite(PIN_ENABLE, LOW);         // 모터 활성화
      restoreLCD();                          // LCD 화면 복원
    }
  }
  lastStopState = stopBtn;

  // ---------------- START 버튼 처리 (시작) ----------------
  bool startBtn = digitalRead(PIN_START);
  if ((currentState == WAIT_FOR_START || currentState == STOPPED) &&
      lastStartState == HIGH && startBtn == LOW) {  // 버튼이 눌렸을 때

    digitalWrite(PIN_ENABLE, LOW);  // 모터 활성화

    // 초기화
    currentLayer = 1;
    commandIndex = 0;
    linearCount  = 0;

    enterCommand();  // 첫 번째 명령어 실행
  }
  lastStartState = startBtn;

  // ---------------- JOG 버튼 처리 (수동 90도 회전) ----------------
  bool jogBtn = digitalRead(PIN_JOG);
  if (lastJogState == HIGH && jogBtn == LOW &&
      currentState != RUNNING_ROTATE && currentState != STOPPED) {  // 버튼이 눌렸을 때

    jogRotateMode = true;                    // JOG 모드 활성화
    jogRotateStartTime = nowMs;              // 시작 시간 기록
    enterRotate(JOG_ROTATE_DIR, JOG_ROTATE_STEPS);  // 회전 시작

    lcd.clear();
    lcd.print("JOG ROTATE");
  }
  lastJogState = jogBtn;

  // ---------------- SKIP 버튼 처리 (LINEAR 스킵) ----------------
  bool skipBtn = digitalRead(PIN_SKIP);
  if (currentState == RUNNING_LINEAR &&
      lastSkipState == HIGH && skipBtn == LOW) {  // LINEAR 모드에서 버튼이 눌렸을 때
    advanceCommand();  // 다음 명령어로 진행
  }
  lastSkipState = skipBtn;

  // ---------------- FSM (상태 기계) ----------------
  switch (currentState) {

    case WAIT_FOR_START:  // 시작 대기
    case STOPPED:         // 일시정지
      // 아무 동작도 하지 않음
      break;

    case RUNNING_LINEAR:  // LINEAR 동작 중
      if (updateLinear(nowMs)) {  // 지정된 시간이 지나면
        advanceCommand();         // 다음 명령어로 진행
      }
      break;

    case RUNNING_ROTATE:  // 회전 동작 중
      if (updateRotate(nowUs)) {  // 목표 스텝에 도달하면
        if (jogRotateMode) {
          // JOG 모드 완료 처리
          jogRotateMode = false;
          jogRotateEndTime = millis();  // 종료 시간 기록
          
          // 경과 시간 계산 및 표시
          float elapsedTime = (jogRotateEndTime - jogRotateStartTime) / 1000.0;
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("JOG COMPLETE");
          lcd.setCursor(0, 1);
          lcd.print("Time: ");
          lcd.print(elapsedTime, 2);  // 소수점 둘째자리까지 표시
          lcd.print("s");
          
          delay(2000);  // 2초간 결과 표시
          
          currentState = WAIT_FOR_START;
          lcd.clear();
          lcd.print("READY");
        } else {
          // 일반 회전 완료
          advanceCommand();  // 다음 명령어로 진행
        }
      }
      break;

    case Z_AXIS_MOVE:  // Z축 이동 중
      if (nowMs - stateStartTimeMs >= Z_AXIS_MOVE_TIME_MS) {  // 이동 시간이 지나면
        currentLayer++;    // 다음 레이어로
        commandIndex = 0;  // 명령어 인덱스 초기화
        linearCount = 0;   // LINEAR 카운트 초기화
        enterCommand();    // 첫 번째 명령어 실행
      }
      break;
  }
}

// =====================================================
// 명령어 제어 함수들
// =====================================================

// 현재 commandIndex에 해당하는 명령어 실행
void enterCommand() {
  if (commandIndex >= COMMAND_COUNT) {
    // 모든 명령어 완료 -> Z축 이동
    enterZAxis();
    return;
  }

  Command cmd = commands[commandIndex];

  // 명령어 타입에 따라 실행
  switch (cmd.type) {
    case CMD_LINEAR:
      linearCount++;
      enterLinear();
      break;
    case CMD_CW:
      enterRotate(CMD_CW, cmd.steps);
      break;
    case CMD_CCW:
      enterRotate(CMD_CCW, cmd.steps);
      break;
  }
}

// LINEAR 모드 진입
void enterLinear() {
  currentState = RUNNING_LINEAR;
  stateStartTimeMs = millis();

  // LCD 표시
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LAYER ");
  lcd.print(currentLayer);

  lcd.setCursor(0, 1);
  lcd.print("LINEAR ");
  lcd.print(linearCount);
  lcd.print("/");
  lcd.print(totalLinear);
}

// 회전 모드 진입
void enterRotate(int dir, long steps) {
  currentState = RUNNING_ROTATE;
  rotateStepCounter = 0;
  targetRotateSteps = steps;

  // 스텝 딜레이 계산
  if (jogRotateMode) {
    // JOG 모드: 기본 STEP_DELAY_US 사용
    currentRotateDelayUs = STEP_DELAY_US;
  } else {
    // 일반 모드: commands[]의 timeMs를 사용하여 정확한 시간에 회전
    Command cmd = commands[commandIndex];
    if (cmd.timeMs > 0 && steps > 0) {
      // 공식: currentRotateDelayUs = (timeMs * 1000) / steps / 2
      // 예: 8000스텝을 3초에 회전 -> (3000 * 1000) / 8000 / 2 = 187.5μs
      currentRotateDelayUs = (cmd.timeMs * 1000UL) / steps / 2;
    } else {
      // timeMs가 0이면 기본 값 사용
      currentRotateDelayUs = STEP_DELAY_US;
    }
  }

  // 회전 방향 설정
  if (dir == CMD_CW) {
    digitalWrite(PIN_DIR, HIGH);   // 시계방향
  } else {
    digitalWrite(PIN_DIR, LOW);    // 반시계방향
  }

  // LCD 표시 (JOG 모드가 아닐 때만)
  if (!jogRotateMode) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ROTATE ");
    lcd.print(dir == CMD_CW ? "CW" : "CCW");

    lcd.setCursor(0, 1);
    lcd.print(steps);
    lcd.print(" steps");
  }
}

// Z축 이동 모드 진입
void enterZAxis() {
  currentState = Z_AXIS_MOVE;
  stateStartTimeMs = millis();

  // LCD 표시
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Z-AXIS MOVING");

  lcd.setCursor(0, 1);
  lcd.print("LAYER ");
  lcd.print(currentLayer);
  lcd.print("->");
  lcd.print(currentLayer + 1);
}

// =====================================================
// 업데이트 함수들
// =====================================================

// LINEAR 동작 업데이트
bool updateLinear(unsigned long nowMs) {
  unsigned long t = commands[commandIndex].timeMs;
  return (nowMs - stateStartTimeMs >= t);  // 지정된 시간이 지났는지 확인
}

// 회전 동작 업데이트
bool updateRotate(unsigned long nowUs) {
  // 목표 스텝에 도달했으면 완료
  if (rotateStepCounter >= targetRotateSteps) return true;

  // 스텝 신호 전송 타이밍 체크
  if (nowUs - lastStepTimeUs >= currentRotateDelayUs * 2) {
    lastStepTimeUs = nowUs;

    // 스텝 펄스 생성
    digitalWrite(PIN_STEP, HIGH);
    delayMicroseconds(currentRotateDelayUs);
    digitalWrite(PIN_STEP, LOW);

    rotateStepCounter++;  // 스텝 카운터 증가
  }
  return false;
}

// =====================================================
// 명령어 진행
// =====================================================
void advanceCommand() {
  commandIndex++;  // 다음 명령어로

  if (commandIndex >= COMMAND_COUNT) {
    // 레이어의 모든 명령어 완료 -> Z축 이동
    enterZAxis();
  } else {
    // 다음 명령어 실행
    enterCommand();
  }
}

// =====================================================
// LCD 복원 (재개 시)
// =====================================================
void restoreLCD() {
  if (currentState == RUNNING_LINEAR) {
    enterLinear();
  } else if (currentState == RUNNING_ROTATE) {
    Command cmd = commands[commandIndex];
    enterRotate(cmd.type, cmd.steps);
  } else if (currentState == Z_AXIS_MOVE) {
    enterZAxis();
  }
}
`;
}

// =====================================================
// Event Handlers
// =====================================================
previewBtn.addEventListener('click', () => {
    const { commands, errors } = parseCommands(commandInput.value);

    if (errors.length > 0) {
        errorMessage.textContent = errors[0];
        commandInput.classList.add('error');
        return;
    }

    errorMessage.textContent = '';
    commandInput.classList.remove('error');
    drawPreview(commands);
});

generateBtn.addEventListener('click', () => {
    const { commands, errors } = parseCommands(commandInput.value);

    if (errors.length > 0) {
        errorMessage.textContent = errors[0];
        commandInput.classList.add('error');
        return;
    }

    if (commands.length === 0) {
        errorMessage.textContent = '명령어를 입력하세요';
        return;
    }

    errorMessage.textContent = '';
    commandInput.classList.remove('error');

    const settings = {
        zAxisTime: parseInt(zAxisTimeInput.value) || 2000,
        stepDelay: parseInt(stepDelayInput.value) || 150,
        jogDir: parseInt(jogDirSelect.value),
        jogSteps: parseInt(jogStepsInput.value) || 8000
    };

    const code = generateCode(commands, settings);
    codeOutput.textContent = code;
    outputSection.classList.add('visible');

    // 코드 출력 영역으로 스크롤
    outputSection.scrollIntoView({ behavior: 'smooth' });
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(codeOutput.textContent).then(() => {
        copyBtn.textContent = '복사됨!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = '복사';
            copyBtn.classList.remove('copied');
        }, 2000);
    });
});

// 입력 시 에러 상태 초기화
commandInput.addEventListener('input', () => {
    errorMessage.textContent = '';
    commandInput.classList.remove('error');
});

// 초기 미리보기
window.addEventListener('load', () => {
    const { commands } = parseCommands(commandInput.value);
    drawPreview(commands);
});
