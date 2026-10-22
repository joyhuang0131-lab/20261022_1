// ==========================================
// 全局變數宣告 (Global Variables)
// ==========================================

// 存放 6 個題目與正確答案的資料結構
let quizData = [
  { id: 0, text: '1. 妝前保濕與防曬', correctTargetId: 0 },
  { id: 1, text: '2. 校色遮瑕與底妝', correctTargetId: 1 },
  { id: 2, text: '3. 定妝蜜粉鎖水', correctTargetId: 2 },
  { id: 3, text: '4. 眉毛形狀勾勒', correctTargetId: 3 },
  { id: 4, text: '5. 眼影腮紅氣色', correctTargetId: 4 },
  { id: 5, text: '6. 唇膏打亮潤色', correctTargetId: 5 }
];

// 存放上方目標框與下方可拖曳文字選項的陣列
let targetBoxes = [];
let draggableItems = [];

// 當前正在拖曳中的選項
let draggedItem = null;

// 測驗與 UI 狀態控制變數
let showSubmitButton = false; // 是否顯示交卷按鈕
let submitBtnRect = { x: 0, y: 0, w: 220, h: 50 }; // 交卷按鈕範圍
let quizSubmitted = false;    // 是否已交卷
let finalScore = 0;           // 計算出的成績 (百分制)

// 彩帶特效粒子陣列與動畫角度
let confettiParticles = [];
let animAngle = 0;

// ==========================================
// 初始化設定 (Setup Canvas)
// ==========================================
function setup() {
  // 建立全螢幕響應式畫布
  createCanvas(windowWidth, windowHeight);
  
  // 設定繪圖對齊模式
  textAlign(CENTER, CENTER);
  rectMode(CORNER);
  
  // 初始化畫面上所有卡片與框的位置
  initLayout();
}

// ==========================================
// 響應式版面佈局計算 (Layout Engine)
// ==========================================
function initLayout() {
  targetBoxes = [];
  draggableItems = [];
  
  // 自動判斷手機或電腦螢幕 (電腦 3 欄，手機 2 欄)
  let cols = windowWidth > 768 ? 3 : 2;
  let rows = ceil(6 / cols);
  
  // 計算目標框的寬高與間距
  let boxWidth = min((windowWidth - 60) / cols, 180);
  let boxHeight = boxWidth * 0.9;
  let spacingX = (windowWidth - (boxWidth * cols)) / (cols + 1);
  let startY = 100;
  
  // 1. 建立上方 6 個 GIF/動畫目標放置框
  for (let i = 0; i < 6; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = spacingX + col * (boxWidth + spacingX);
    let y = startY + row * (boxHeight + 15);
    
    targetBoxes.push({
      id: i,
      x: x,
      y: y,
      w: boxWidth,
      h: boxHeight,
      occupant: null // 記錄當前放置的文字卡片
    });
  }

  // 2. 計算下方拖曳文字卡片的位置
  let textStartY = startY + rows * (boxHeight + 15) + 20;
  let textWidth = boxWidth;
  let textHeight = 42;

  // 隨機打亂題目選項順序
  let shuffledData = shuffle([...quizData]);

  // 建立 6 個可拖曳選項卡片
  for (let i = 0; i < shuffledData.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = spacingX + col * (textWidth + spacingX);
    let y = textStartY + row * (textHeight + 12);
    
    draggableItems.push({
      data: shuffledData[i],
      homeX: x,       // 原始歸位 X 座標
      homeY: y,       // 原始歸位 Y 座標
      x: x,           // 當前 X 座標
      y: y,           // 當前 Y 座標
      w: textWidth,   // 卡片寬度
      h: textHeight,  // 卡片高度
      isDragging: false,
      placedTargetId: null // 記錄放到了哪個目標框中
    });
  }

  // 3. 計算交卷按鈕的位置（固定在畫面底部適當區域）
  let btnY = textStartY + ceil(6 / cols) * (textHeight + 12) + 15;
  // 確保按鈕不會超出螢幕底端
  if (btnY + 60 > windowHeight) {
    btnY = windowHeight - 70;
  }
  submitBtnRect.w = min(220, windowWidth * 0.7);
  submitBtnRect.h = 48;
  submitBtnRect.x = (windowWidth - submitBtnRect.w) / 2;
  submitBtnRect.y = btnY;
}

// ==========================================
// 主繪圖循環 (Main Draw Loop)
// ==========================================
function draw() {
  // 粉色系背景
  background(253, 245, 246);

  // 增加圖示動畫旋轉角
  animAngle += 0.03;

  // 1. 繪製標題與說明文字
  drawHeader();

  // 2. 繪製上方 6 個 GIF/動畫目標框
  drawTargetBoxes();

  // 3. 繪製下方文字選項卡片
  drawDraggableItems();

  // 4. 檢查是否有卡片被放上目標框，決定是否顯示交卷按鈕
  checkPlacedCount();

  // 5. 繪製「交卷看成績」按鈕
  if (showSubmitButton && !quizSubmitted) {
    drawSubmitButton();
  }

  // 6. 如果已交卷，繪製成績彈窗與彩帶
  if (quizSubmitted) {
    drawScoreBoard();
    if (finalScore >= 80) {
      updateAndDrawConfetti(); // 繪製彩帶動畫
    }
  }

  // 7. 確保被拖曳中的卡片繪製在最頂層
  if (draggedItem) {
    drawSingleItem(draggedItem, true);
  }
}

// ==========================================
// 頂部標題繪製 (Header UI)
// ==========================================
function drawHeader() {
  fill(80, 50, 60);
  noStroke();
  textSize(min(22, windowWidth * 0.055));
  textStyle(BOLD);
  text("✨ 化妝基礎知識 - 拖曳對應測驗 ✨", width / 2, 35);

  textSize(13);
  textStyle(NORMAL);
  fill(120, 90, 100);
  text("將下方步驟拖曳至對應的動畫圖示框中，完成後點擊交卷", width / 2, 65);
}

// ==========================================
// 繪製目標放置框與動態 GIF 圖示
// ==========================================
function drawTargetBoxes() {
  for (let box of targetBoxes) {
    // 繪製外框底盒
    stroke(230, 180, 190);
    strokeWeight(2);
    fill(255, 255, 255, 220);
    rect(box.x, box.y, box.w, box.h, 10);

    // 繪製內部動態化妝步驟圖示 (模擬 GIF 特效)
    push();
    translate(box.x + 8, box.y + 8);
    drawStepAnimation(box.id, box.w - 16, box.h - 36);
    pop();

    // 繪製卡片吸附提示虛線框
    stroke(200, 150, 160);
    strokeWeight(1);
    drawingContext.setLineDash([4, 4]);
    noFill();
    rect(box.x + 4, box.y + box.h - 26, box.w - 8, 22, 5);
    drawingContext.setLineDash([]); // 恢復實線

    // 當前框未被放置卡片時顯示提示文字
    fill(160, 120, 130);
    noStroke();
    textSize(11);
    if (box.occupant === null) {
      text("拖曳選項至此", box.x + box.w / 2, box.y + box.h - 15);
    }
  }
}

// ==========================================
// 模擬 6 個 GIF 步驟的動態繪圖
// ==========================================
function drawStepAnimation(stepId, w, h) {
  fill(250, 235, 238);
  noStroke();
  rect(0, 0, w, h, 6);

  push();
  translate(w / 2, h / 2);

  // 根據步驟畫出不同的化妝小圖案動畫
  if (stepId === 0) {
    // 1. 保濕防曬
    fill(255, 180, 0);
    circle(0, -4, 20);
    fill(100, 200, 255, 180 + sin(animAngle * 4) * 60);
    triangle(-6, 10, 0, -2, 6, 10);
  } else if (stepId === 1) {
    // 2. 底妝遮瑕
    fill(240, 200, 180);
    rect(-16, -10, 32, 20, 5);
    fill(220, 140, 160);
    circle(0, sin(animAngle * 4) * 3, 14);
  } else if (stepId === 2) {
    // 3. 蜜粉定妝
    fill(220, 190, 170);
    circle(0, 4, 20);
    rotate(sin(animAngle * 3) * 0.2);
    stroke(120, 80, 90);
    strokeWeight(3);
    line(0, 4, 0, -14);
  } else if (stepId === 3) {
    // 4. 眉毛勾勒
    stroke(100, 70, 80);
    strokeWeight(3);
    noFill();
    arc(0, 0, 26, 12, PI + 0.2, TWO_PI - 0.2);
    let px = cos(animAngle * 3) * 8;
    stroke(80);
    strokeWeight(2);
    line(px, -6, px + 6, -15);
  } else if (stepId === 4) {
    // 5. 眼影腮紅
    noStroke();
    fill(230, 130, 150);
    rect(-12, -8, 10, 10, 2);
    fill(240, 170, 130);
    rect(2, -8, 10, 10, 2);
    fill(255, 200, 220, 150 + sin(animAngle * 5) * 100);
    circle(0, 6, 12);
  } else if (stepId === 5) {
    // 6. 唇膏打亮
    fill(180);
    rect(-5, 0, 10, 12, 2);
    fill(230, 60, 90);
    let lipH = 10 + sin(animAngle * 3) * 3;
    rect(-4, -lipH, 8, lipH, 2);
  }
  pop();

  fill(130, 90, 100);
  textSize(10);
  textStyle(BOLD);
  text(`GIF 步驟 ${stepId + 1}`, w / 2, h - 6);
}

// ==========================================
// 繪製可拖曳文字選項卡片
// ==========================================
function drawDraggableItems() {
  for (let item of draggableItems) {
    if (item === draggedItem) continue; // 被拖曳中的卡片最後獨立繪製
    drawSingleItem(item, false);
  }
}

// 繪製單一文字選項卡片
function drawSingleItem(item, isElevated) {
  push();
  if (isElevated) {
    drawingContext.shadowBlur = 12;
    drawingContext.shadowColor = 'rgba(225, 112, 137, 0.5)';
  } else {
    drawingContext.shadowBlur = 3;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.08)';
  }

  stroke(220, 160, 175);
  strokeWeight(1.5);
  fill(255);
  rect(item.x, item.y, item.w, item.h, 6);

  fill(70, 50, 60);
  noStroke();
  textSize(min(12, item.w * 0.085));
  textStyle(NORMAL);
  text(item.data.text, item.x + item.w / 2, item.y + item.h / 2);
  pop();
}

// ==========================================
// 檢查是否有卡片被填入框中
// ==========================================
function checkPlacedCount() {
  let placedCount = 0;
  for (let item of draggableItems) {
    if (item.placedTargetId !== null) {
      placedCount++;
    }
  }
  // 只要有放置卡片（至少 1 個），就顯示「交卷看成績」按鈕
  showSubmitButton = (placedCount > 0);
}

// ==========================================
// 繪製「交卷看成績」按鈕
// ==========================================
function drawSubmitButton() {
  push();
  // 判斷滑鼠是否懸浮在按鈕上
  let isHover = mouseX > submitBtnRect.x && mouseX < submitBtnRect.x + submitBtnRect.w &&
                mouseY > submitBtnRect.y && mouseY < submitBtnRect.y + submitBtnRect.h;

  fill(isHover ? color(240, 80, 120) : color(225, 112, 137));
  noStroke();
  rect(submitBtnRect.x, submitBtnRect.y, submitBtnRect.w, submitBtnRect.h, 25);

  fill(255);
  textSize(16);
  textStyle(BOLD);
  text("📝 交卷看成績", submitBtnRect.x + submitBtnRect.w / 2, submitBtnRect.y + submitBtnRect.h / 2);
  pop();
}

// ==========================================
// 成績計算與彈出式成績單
// ==========================================
function calculateScore() {
  let correctCount = 0;
  for (let item of draggableItems) {
    // 檢查卡片放置的目標框 ID 是否等於該題目的正確解答 ID
    if (item.placedTargetId === item.data.correctTargetId) {
      correctCount++;
    }
  }

  // 計算百分制成績 (每題 16.66 分，全對 100 分)
  finalScore = Math.round((correctCount / 6) * 100);
  quizSubmitted = true;

  // 當成績大於等於 80 分時，觸發彩帶噴發動畫
  if (finalScore >= 80) {
    createConfetti();
  }
}

// 繪製成績視窗
function drawScoreBoard() {
  push();
  // 半透明背景遮罩
  fill(0, 0, 0, 140);
  rect(0, 0, width, height);

  // 成績彈窗框體
  let cardW = min(340, width * 0.85);
  let cardH = 260;
  let cardX = (width - cardW) / 2;
  let cardY = (height - cardH) / 2;

  fill(255);
  stroke(230, 180, 190);
  strokeWeight(3);
  rect(cardX, cardY, cardW, cardH, 18);

  // 評語與分數
  noStroke();
  fill(80, 50, 60);
  textSize(22);
  textStyle(BOLD);
  text("🎉 測驗結果 🎉", width / 2, cardY + 45);

  textSize(42);
  fill(225, 80, 110);
  text(`${finalScore} 分`, width / 2, cardY + 110);

  textSize(14);
  textStyle(NORMAL);
  fill(100);
  if (finalScore >= 80) {
    text("太棒了！您對基礎美妝順序非常瞭解！✨", width / 2, cardY + 165);
  } else {
    text("再接再厲！繼續加油複習美妝步驟吧！💪", width / 2, cardY + 165);
  }

  // 「重新測驗」按鈕
  let retryW = 140;
  let retryH = 40;
  let retryX = (width - retryW) / 2;
  let retryY = cardY + 200;

  fill(240, 140, 160);
  rect(retryX, retryY, retryW, retryH, 20);
  fill(255);
  textSize(14);
  textStyle(BOLD);
  text("🔄 重新測驗", width / 2, retryY + retryH / 2);
  pop();
}

// ==========================================
// 拖曳與點擊事件處理 (Mouse & Touch Events)
// ==========================================
function mousePressed() {
  handleStart(mouseX, mouseY);
}

function touchStarted() {
  let tX = touches[0] ? touches[0].x : mouseX;
  let tY = touches[0] ? touches[0].y : mouseY;
  handleStart(tX, tY);
  return false; // 防止行動裝置畫面上下滾動
}

function handleStart(pX, pY) {
  // 1. 若已經交卷，檢查是否點擊「重新測驗」
  if (quizSubmitted) {
    let cardH = 260;
    let cardY = (height - cardH) / 2;
    let retryX = (width - 140) / 2;
    let retryY = cardY + 200;
    
    if (pX > retryX && pX < retryX + 140 && pY > retryY && pY < retryY + 40) {
      resetQuiz();
    }
    return;
  }

  // 2. 檢查是否點擊「交卷看成績」按鈕
  if (showSubmitButton && pX > submitBtnRect.x && pX < submitBtnRect.x + submitBtnRect.w &&
      pY > submitBtnRect.y && pY < submitBtnRect.y + submitBtnRect.h) {
    calculateScore();
    return;
  }

  // 3. 檢查是否點擊可拖曳卡片
  for (let item of draggableItems) {
    if (pX > item.x && pX < item.x + item.w && pY > item.y && pY < item.y + item.h) {
      draggedItem = item;
      draggedItem.isDragging = true;

      // 若卡片原本已放在某個目標框，釋放該目標框的佔用
      if (item.placedTargetId !== null) {
        let prevBox = targetBoxes.find(b => b.id === item.placedTargetId);
        if (prevBox) prevBox.occupant = null;
        item.placedTargetId = null;
      }
      break;
    }
  }
}

function mouseDragged() {
  handleMove(mouseX, mouseY);
}

function touchMoved() {
  if (touches.length > 0) {
    handleMove(touches[0].x, touches[0].y);
  }
  return false;
}

function handleMove(pX, pY) {
  if (draggedItem) {
    // 讓卡片中心跟隨滑鼠/手指
    draggedItem.x = pX - draggedItem.w / 2;
    draggedItem.y = pY - draggedItem.h / 2;
  }
}

function mouseReleased() {
  handleEnd();
}

function touchEnded() {
  handleEnd();
}

function handleEnd() {
  if (!draggedItem) return;

  let droppedInBox = false;

  // 檢測卡片是否釋放在某個目標放置框內
  for (let box of targetBoxes) {
    let itemCenterX = draggedItem.x + draggedItem.w / 2;
    let itemCenterY = draggedItem.y + draggedItem.h / 2;

    if (itemCenterX > box.x && itemCenterX < box.x + box.w &&
        itemCenterY > box.y && itemCenterY < box.y + box.h) {
      
      // 若該目標框已有其他卡片，將舊卡片送回原位
      if (box.occupant !== null && box.occupant !== draggedItem) {
        let existingItem = draggableItems.find(it => it === box.occupant);
        if (existingItem) {
          existingItem.x = existingItem.homeX;
          existingItem.y = existingItem.homeY;
          existingItem.placedTargetId = null;
        }
      }

      // 卡片精確吸附對齊至目標框底部
      draggedItem.x = box.x + (box.w - draggedItem.w) / 2;
      draggedItem.y = box.y + box.h - draggedItem.h - 3;
      draggedItem.placedTargetId = box.id;
      box.occupant = draggedItem;

      droppedInBox = true;
      break;
    }
  }

  // 若未放入任何目標框，自動退回原位
  if (!droppedInBox) {
    draggedItem.x = draggedItem.homeX;
    draggedItem.y = draggedItem.homeY;
    draggedItem.placedTargetId = null;
  }

  draggedItem.isDragging = false;
  draggedItem = null;
}

// 重設測驗
function resetQuiz() {
  quizSubmitted = false;
  showSubmitButton = false;
  confettiParticles = [];
  initLayout();
}

// 螢幕尺寸改變時自動調整佈局
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initLayout();
}

// ==========================================
// 彩帶飄落特效粒子系統 (Confetti Particle System)
// ==========================================
function createConfetti() {
  confettiParticles = [];
  let colors = [
    color(255, 105, 180), color(255, 182, 193), color(255, 215, 0),
    color(135, 206, 250), color(147, 112, 219), color(144, 238, 144)
  ];

  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: random(width),
      y: random(-height, 0),
      size: random(7, 13),
      color: random(colors),
      vx: random(-2.5, 2.5),
      vy: random(2.5, 6.5),
      rotation: random(TWO_PI),
      vRot: random(-0.12, 0.12)
    });
  }
}

function updateAndDrawConfetti() {
  push();
  noStroke();
  for (let p of confettiParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.vRot;

    // 觸底重置回頂部，產生持續飄落效果
    if (p.y > height) {
      p.y = random(-40, 0);
      p.x = random(width);
    }

    push();
    translate(p.x, p.y);
    rotate(p.rotation);
    fill(p.color);
    rect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    pop();
  }
  pop();
}