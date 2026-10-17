/**
 * Online Survey Application - Step-by-Step Wizard (One Question at a Time)
 * Automatically parses questions from CSV and sends survey responses to thanhtoicntt2000@gmail.com.
 */

// Global State
const TARGET_EMAIL = 'thanhtoicntt2000@gmail.com';

const surveyState = {
  questions: [],
  answers: {}, // map of { questionId: { letter: 'A', text: '...', customText: '...' } }
  currentStep: 0, // 0 = Intro, 1..N = Question 1..N, N+1 = Review & Submit
};

// Default fallback questions tailored for friend beach trip (exact 10 questions matching questions.csv)
const DEFAULT_QUESTIONS = [
  { id: "1", question: "Bạn đã sẵn sàng cho chuyến đi này chưa!", option_a: "Có", option_b: "Kó", option_c: "Yes", option_d: "Ý kiến khác (Bạn tự điền gu trải nghiệm riêng)" },
  { id: "2", question: "Về ăn uống bạn có bị dị ứng loại hải sản nào không?", option_a: "Không dị ứng gì ăn sập biển cả", option_b: "Dị tôm cua ghẹ còn vỏ :))", option_c: "Dị ứng các loại ốc - sò - nghêu", option_d: "Dị ứng món khác hoặc ăn chay (Bạn tự điền)" },
  { id: "3", question: "Bạn có muốn đi Tour câu mực đêm trên biển (~200k - 250k/người, gồm cần câu + nấu cháo/mực tươi tại tàu) không?", option_a: "Rất hào hứng! Nhất định phải thử câu và ăn mực tươi sống tại chỗ", option_b: "Thích trải nghiệm nhưng sợ say sóng (cần chuẩn bị sẵn thuốc chống say)", option_c: "Không đi - thích ở lại bờ/homestay nhậu và chill hơn", option_d: "Ý kiến khác (Đề xuất hoạt động biển khác bạn muốn)" },
  { id: "4", question: "Lịch rảnh của bạn có thể đi vào thời gian nào phù hợp nhất? với tour 3N2D", option_a: "Đi dịp cuối tuần (Thứ 7 & Chủ Nhật & Thứ2)", option_b: "Đi trọn vẹn 3 ngày cuối tuần (Thứ 6 đến Chủ Nhật)", option_c: "Ngày nào cũng được miễn báo trước 1 tuần", option_d: "Ý kiến khác (Điền ngày/tháng bạn rảnh có thể đi)" },
  { id: "5", question: "Chọn ngày đi phù hợp nhất cho tour 3N2Đ (sẽ chốt theo ngày có nhiều người vote nhất)?", option_a: "13 -> 15 tháng 11", option_b: "14 -> 16 tháng 11", option_c: "27 -> 29 tháng 11", option_d: "28 -> 30 tháng 11" },
  { id: "6", question: "Hãy chọn địa điểm nhà nghỉ / homestay bạn muốn ở nhất tại đảo Nam Du?", option_a: "Thảo Thường Camp (Homestay Cầu Vồng - View biển đẹp & sân nướng BBQ sát sóng)", option_b: "Khu du lịch Humiso Nam Du (Bãi biển riêng & cầu gỗ check-in ngắm hoàng hôn đỉnh nhất)", option_c: "Bãi Sỏi Beach Nam Du (Biệt lập yên tĩnh & bãi san hô tự nhiên lặn ngắm cá)", option_d: "Langchia Nam Du Resort (Nghỉ dưỡng sang xịn nhất & có hồ bơi vô cực sát biển)" },
  { id: "7", question: "Về cách chia phòng ngủ bạn muốn sắp xếp như thế nào?", option_a: "Chia 2 phòng to (Nam 1 phòng & Nữ 1 phòng riêng để tối ưu chi phí)", option_b: "Thuê Bungalow / Villa tập thể (Chung nhà có phòng khách quẩy & chia phòng riêng)", option_c: "Mỗi người hoặc mỗi cặp 1 phòng riêng tư tuyệt đối (Chi phí cao hơn)", option_d: "Ý kiến khác (Gợi ý phương án hoặc yêu cầu riêng của bạn)" },
  { id: "8", question: "Buổi tối bên bờ biển bạn muốn tụ tập làm gì nhất?", option_a: "Tiệc nướng BBQ hải sản bãi biển + cụng bia tâm sự", option_b: "Đi bar / pub bãi biển nghe nhạc sống chill chill", option_c: "Oanh tạc chợ đêm ăn vặt và mua quà đặc sản", option_d: "Ý kiến khác (Đề xuất hoạt động buổi tối bạn muốn)" },
  { id: "9", question: "Mức chi phí (Budget) dự kiến mỗi người bạn cảm thấy hợp lý nhất? (Tour 3N2D)", option_a: "Khoảng 3.0 - 3.8 triệu / người", option_b: "Khoảng 4.0 - 5.0 triệu / người", option_c: "Khoảng 5.0 - 7.0 triệu / người", option_d: "Ý kiến khác" },
  { id: "10", question: "Bạn có thể kiêm nhiệm vai trò gì trong chuyến đi này?", option_a: "Thủ quỹ tay hòm chìa khóa chia tiền siêu chuẩn", option_b: "Phó nháy chụp ảnh quay clip sống ảo có tâm", option_c: "Tài xế lái xe hoặc chuyên gia săn quán ngon", option_d: "Ý kiến đóng góp khác (Nhập vai trò hoặc lời nhắn riêng)" }
];

// ==========================================================================
// Relaxing Beach Ambient & Gentle Sound Effects Engine
// ==========================================================================
class BeachAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlayingMusic = true;
    this.isExplicitlyPaused = false;
    this.volume = 0.55; // 55% pleasant audible volume
    this.audioElement = null;
  }

  ensureContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  getAudioEl() {
    if (!this.audioElement) {
      this.audioElement = document.getElementById('bgBeachAudio');
    }
    return this.audioElement;
  }

  startAmbient() {
    this.isExplicitlyPaused = false;
    this.ensureContext();
    const audio = this.getAudioEl();
    if (!audio) return;

    audio.volume = this.volume;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.isPlayingMusic = true;
        updateAudioUIState(true);
      }).catch(err => {
        // Will start automatically on user's first touch/click
      });
    }
  }

  stopAmbient() {
    this.isExplicitlyPaused = true;
    const audio = this.getAudioEl();
    if (audio) {
      audio.pause();
    }
    this.isPlayingMusic = false;
    updateAudioUIState(false);
  }

  toggleMusic() {
    this.ensureContext();
    const audio = this.getAudioEl();
    if (!audio) return false;

    if (audio.paused) {
      this.startAmbient();
      return true;
    } else {
      this.stopAmbient();
      return false;
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, parseFloat(val)));
    const audio = this.getAudioEl();
    if (audio) {
      audio.volume = this.volume;
    }
  }

  // --- SOUND EFFECTS (SFX) ---
  
  // Option selection: Soft organic water bubble / marimba note (clearly audible!)
  playOptionSelect(optionLetter = 'A') {
    this.ensureContext();
    if (!this.ctx) return;

    const pitches = {
      'A': 523.25, // C5
      'B': 587.33, // D5
      'C': 659.25, // E5
      'D': 783.99  // G5
    };
    const freq = pitches[optionLetter] || 523.25;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Gentle droplet pitch glide
    osc.frequency.setValueAtTime(freq * 1.15, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.05);

    // Punchy, satisfying & warm volume
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Navigation button click: Soft acoustic wood tap
  playNavTap() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.06);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.48, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Next Question whoosh / chime
  playStepChime() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.32, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  // Success celebration arpeggio: C5 - E5 - G5 - C6
  playSuccessFanfare() {
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.10;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.45, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.85);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.90);
    });
  }
}

const beachAudio = new BeachAudioEngine();

// DOM Elements
const stepIntro = document.getElementById('stepIntro');
const stepQuestion = document.getElementById('stepQuestion');
const stepReview = document.getElementById('stepReview');

const currentQuestionBadge = document.getElementById('currentQuestionBadge');
const currentQuestionTitle = document.getElementById('currentQuestionTitle');
const singleOptionsContainer = document.getElementById('singleOptionsContainer');
const singleCustomOpinionWrap = document.getElementById('singleCustomOpinionWrap');
const singleCustomOpinionInput = document.getElementById('singleCustomOpinionInput');

const startSurveyBtn = document.getElementById('startSurveyBtn');
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const stepDots = document.getElementById('stepDots');
const reviewBackBtn = document.getElementById('reviewBackBtn');
const reviewAnswersList = document.getElementById('reviewAnswersList');

const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');

const submitSurveyBtn = document.getElementById('submitSurveyBtn');
const submitBtnText = document.getElementById('submitBtnText');
const submitSpinner = document.getElementById('submitSpinner');
const submitIcon = document.getElementById('submitIcon');
const validationAlert = document.getElementById('validationAlert');
const validationMsg = document.getElementById('validationMsg');
const exportDataBtn = document.getElementById('exportDataBtn');

const successModal = document.getElementById('successModal');
const submissionSummary = document.getElementById('submissionSummary');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const newSurveyBtn = document.getElementById('newSurveyBtn');
const toastContainer = document.getElementById('toastContainer');

// STEP PLAN DOM Elements
const stepPlan = document.getElementById('stepPlan');
const planRespondentName = document.getElementById('planRespondentName');
const planHotelName = document.getElementById('planHotelName');
const planSquidTour = document.getElementById('planSquidTour');
const planBudgetValue = document.getElementById('planBudgetValue');
const planTimelineContainer = document.getElementById('planTimelineContainer');
const copyPlanTextBtn = document.getElementById('copyPlanTextBtn');
const planBackToSurveyBtn = document.getElementById('planBackToSurveyBtn');

const togglePlanCostBtn = document.getElementById('togglePlanCostBtn');
const togglePlanCostLabel = document.getElementById('togglePlanCostLabel');
const openPlanCostModalBtn = document.getElementById('openPlanCostModalBtn');
const costBreakdownCard = document.getElementById('costBreakdownCard');
const costComparisonModal = document.getElementById('costComparisonModal');
const costComparisonModalContent = document.getElementById('costComparisonModalContent');
const closeCostModalBtn = document.getElementById('closeCostModalBtn');
const closeCostModalFooterBtn = document.getElementById('closeCostModalFooterBtn');

// Beach Music DOM Elements
const bgMusicToggleBtn = document.getElementById('bgMusicToggleBtn');
const musicBtnLabel = document.getElementById('musicBtnLabel');
const bgMusicVolume = document.getElementById('bgMusicVolume');

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Load questions from CSV
  initQuestions();

  // Register Event Listeners
  setupEventListeners();

  // Always keep beach ambient music on by default
  updateAudioUIState(true);
  beachAudio.startAmbient();
});

// ==========================================================================
// CSV Data Fetching & Parsing
// ==========================================================================
async function initQuestions() {
  try {
    const cacheBuster = `_t=${Date.now()}`;
    const response = await fetch(`questions.csv?${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    parseCSVData(csvText, 'questions.csv');
  } catch (err) {
    console.warn('Dùng tập 8 câu hỏi mặc định:', err);
    surveyState.questions = DEFAULT_QUESTIONS;
    surveyState.currentStep = 0;
    renderCurrentStep();
  }
}

function parseCSVData(csvString, sourceName = 'Tệp CSV') {
  Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    complete: function(results) {
      if (results.data && results.data.length > 0) {
        const parsed = results.data.map((row, index) => {
          const keys = Object.keys(row);
          const findKey = (candidates) => keys.find(k => candidates.includes(k.toLowerCase().trim()));

          const idKey = findKey(['id', 'stt', 'câu', 'cau', 'ma']) || keys[0];
          const questionKey = findKey(['question', 'câu hỏi', 'cauhoi', 'text', 'noidung', 'content']) || keys[1];
          const optAKey = findKey(['option_a', 'a', 'đáp án a', 'dap an a', 'opta']) || keys[2];
          const optBKey = findKey(['option_b', 'b', 'đáp án b', 'dap an b', 'optb']) || keys[3];
          const optCKey = findKey(['option_c', 'c', 'đáp án c', 'dap an c', 'optc']) || keys[4];
          const optDKey = findKey(['option_d', 'd', 'đáp án d', 'dap an d', 'optd', 'gop y', 'y kien']) || keys[5];

          return {
            id: String(row[idKey] || (index + 1)).trim(),
            question: String(row[questionKey] || `Câu hỏi số ${index + 1}`).trim(),
            option_a: String(row[optAKey] || 'Lựa chọn A').trim(),
            option_b: String(row[optBKey] || 'Lựa chọn B').trim(),
            option_c: String(row[optCKey] || 'Lựa chọn C').trim(),
            option_d: String(row[optDKey] || 'Ý kiến khác (Góp ý riêng của bạn)').trim(),
          };
        }).filter(q => q.question.length > 0);

        if (parsed.length > 0) {
          surveyState.questions = parsed;
          surveyState.answers = {};
          surveyState.currentStep = 0;
          renderCurrentStep();
        } else {
          showToast('File CSV không có dữ liệu câu hỏi hợp lệ.', 'error');
        }
      } else {
        showToast('Không thể đọc dữ liệu từ file CSV.', 'error');
      }
    },
    error: function(error) {
      showToast(`Lỗi đọc CSV: ${error.message}`, 'error');
    }
  });
}

// User uploads their own custom CSV file
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const csvContent = e.target.result;
    parseCSVData(csvContent, file.name);
  };
  reader.onerror = function() {
    showToast('Lỗi khi đọc file CSV từ thiết bị.', 'error');
  };
  reader.readAsText(file, 'UTF-8');
}

// ==========================================================================
// Step-by-Step Wizard Engine (One Question at a Time)
// ==========================================================================
function renderCurrentStep() {
  const total = surveyState.questions.length || 8;
  const step = surveyState.currentStep;

  // Hide all step sections first
  stepIntro.style.display = 'none';
  stepQuestion.style.display = 'none';
  stepReview.style.display = 'none';
  if (stepPlan) stepPlan.style.display = 'none';

  if (step === 0) {
    stepIntro.style.display = 'flex';
    updateProgress(0, total, 'Sẵn sàng bắt đầu');
  } else if (step >= 1 && step <= total) {
    stepQuestion.style.display = 'flex';
    renderSingleQuestion(step - 1);
    updateProgress(step, total, `Câu ${step} / ${total}`);
  } else if (step === total + 1) {
    stepReview.style.display = 'flex';
    renderReviewSummary();
    updateProgress(total, total, 'Hoàn thành 100%');
  } else {
    // Step Plan (Personalized Itinerary after submit)
    if (stepPlan) {
      stepPlan.style.display = 'flex';
      renderPersonalizedPlan();
      updateProgress(total, total, 'Lịch trình 3N2Đ cá nhân hóa ✨');
    }
  }

  window.scrollTo({ top: 90, behavior: 'smooth' });
}

function renderSingleQuestion(index) {
  const q = surveyState.questions[index];
  if (!q) return;

  const total = surveyState.questions.length;
  const currentNum = index + 1;

  currentQuestionBadge.textContent = `Câu ${currentNum} / ${total}`;
  currentQuestionTitle.textContent = q.question;

  singleOptionsContainer.innerHTML = `
    ${renderOptionItem(q.id, 'A', q.option_a)}
    ${renderOptionItem(q.id, 'B', q.option_b)}
    ${renderOptionItem(q.id, 'C', q.option_c)}
    ${renderOptionItem(q.id, 'D', q.option_d)}
  `;

  const currentAns = surveyState.answers[q.id];
  if (currentAns) {
    const activeOpt = singleOptionsContainer.querySelector(`.option-item[data-option="${currentAns.letter}"]`);
    if (activeOpt) {
      activeOpt.classList.add('selected');
      const radio = activeOpt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }

    if (isCustomOption(currentAns.letter, currentAns.text)) {
      singleCustomOpinionWrap.style.display = 'block';
      singleCustomOpinionInput.value = currentAns.customText || '';
    } else {
      singleCustomOpinionWrap.style.display = 'none';
      singleCustomOpinionInput.value = '';
    }
  } else {
    singleCustomOpinionWrap.style.display = 'none';
    singleCustomOpinionInput.value = '';
  }

  singleOptionsContainer.querySelectorAll('.option-item').forEach(opt => {
    opt.addEventListener('click', function() {
      const qId = this.dataset.questionId;
      const letter = this.dataset.option;
      const text = this.dataset.optionText;

      handleOptionSelection(qId, letter, text);
    });
  });

  renderStepDots(currentNum, total);

  prevQuestionBtn.style.visibility = (currentNum === 1 && !document.getElementById('respondentName').value.trim()) ? 'hidden' : 'visible';
  nextQuestionBtn.querySelector('span').textContent = (currentNum === total) ? 'Xem lại & Gửi' : 'Tiếp theo';
}

function isCustomOption(letter, text) {
  if (letter !== 'D' || !text) return false;
  const lower = text.toLowerCase();
  return lower.includes('khác') ||
         lower.includes('tự điền') ||
         lower.includes('góp ý') ||
         lower.includes('đóng góp') ||
         lower.includes('lời nhắn') ||
         lower.includes('yêu cầu riêng');
}

function getGoogleViewLink(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  
  if (lower.includes('thảo thường')) {
    return {
      url: 'https://www.google.com/maps/search/?api=1&query=Th%E1%BA%A3o+Th%C6%B0%E1%BB%9Dng+Camp+Nam+Du',
      label: '📍 Xem ảnh & view thực tế trên Google ↗'
    };
  }
  if (lower.includes('humiso')) {
    return {
      url: 'https://www.google.com/maps/search/?api=1&query=Khu+du+l%E1%BB%8Bch+Humiso+Nam+Du',
      label: '📍 Xem ảnh & view thực tế trên Google ↗'
    };
  }
  if (lower.includes('bãi sỏi')) {
    return {
      url: 'https://www.google.com/maps/search/?api=1&query=B%C3%A3i+S%E1%BB%8Fi+Beach+Nam+Du',
      label: '📍 Xem ảnh & view thực tế trên Google ↗'
    };
  }
  if (lower.includes('langchia')) {
    return {
      url: 'https://www.google.com/maps/search/?api=1&query=Langchia+Nam+Du+Resort',
      label: '📍 Xem ảnh & view thực tế trên Google ↗'
    };
  }
  
  return null;
}

function renderOptionItem(qId, letter, text) {
  if (!text) return '';
  const viewLink = getGoogleViewLink(text);
  const linkHtml = viewLink ? `
    <a href="${viewLink.url}" target="_blank" rel="noopener noreferrer" class="option-link-pill" onclick="event.stopPropagation();" title="Mở Google Maps xem phòng, view biển và ảnh thực tế">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
      <span>${escapeHtml(viewLink.label)}</span>
    </a>
  ` : '';

  return `
    <div class="option-item" data-question-id="${qId}" data-option="${letter}" data-option-text="${escapeHtml(text)}">
      <input type="radio" name="single_q_${qId}" id="opt_${qId}_${letter}" value="${letter}" />
      <span class="option-badge">${letter}</span>
      <div class="option-content-wrap">
        <span class="option-text">${escapeHtml(text)}</span>
        ${linkHtml}
      </div>
    </div>
  `;
}

function handleOptionSelection(qId, letter, text) {
  // Play pleasant organic water drop sound on option click
  beachAudio.playOptionSelect(letter);

  const isCustom = isCustomOption(letter, text);
  const existingCustom = singleCustomOpinionInput.value.trim();
  surveyState.answers[qId] = {
    letter: letter,
    text: text,
    customText: isCustom ? existingCustom : ''
  };

  singleOptionsContainer.querySelectorAll('.option-item').forEach(item => {
    const isThis = item.dataset.option === letter;
    item.classList.toggle('selected', isThis);
    const radio = item.querySelector('input[type="radio"]');
    if (radio) radio.checked = isThis;
  });

  if (isCustom) {
    singleCustomOpinionWrap.style.display = 'block';
    setTimeout(() => singleCustomOpinionInput.focus(), 150);
  } else {
    singleCustomOpinionWrap.style.display = 'none';
    singleCustomOpinionInput.value = '';
    setTimeout(() => {
      advanceNextQuestion();
    }, 280);
  }
}

if (singleCustomOpinionInput) {
  singleCustomOpinionInput.addEventListener('input', function() {
    const currentQ = surveyState.questions[surveyState.currentStep - 1];
    if (currentQ && surveyState.answers[currentQ.id]) {
      surveyState.answers[currentQ.id].customText = this.value.trim();
    }
  });
}

function renderStepDots(currentNum, total) {
  stepDots.innerHTML = '';
  for (let i = 1; i <= total; i++) {
    const dot = document.createElement('div');
    dot.className = 'step-dot';
    if (i === currentNum) {
      dot.classList.add('active');
    } else if (surveyState.answers[surveyState.questions[i - 1]?.id]) {
      dot.classList.add('completed');
    }

    dot.addEventListener('click', () => {
      beachAudio.playNavTap();
      surveyState.currentStep = i;
      renderCurrentStep();
    });

    stepDots.appendChild(dot);
  }
}

function advanceNextQuestion() {
  const currentIdx = surveyState.currentStep - 1;
  const currentQ = surveyState.questions[currentIdx];

  if (currentQ && !surveyState.answers[currentQ.id]) {
    beachAudio.playNavTap();
    showToast(`Vui lòng chọn 1 đáp án cho Câu #${surveyState.currentStep}!`, 'error');
    stepQuestion.classList.add('highlight-missing');
    setTimeout(() => stepQuestion.classList.remove('highlight-missing'), 500);
    return;
  }

  beachAudio.playStepChime();
  surveyState.currentStep++;
  renderCurrentStep();
}

function advancePrevQuestion() {
  if (surveyState.currentStep > 0) {
    beachAudio.playNavTap();
    surveyState.currentStep--;
    renderCurrentStep();
  }
}

function renderReviewSummary() {
  reviewAnswersList.innerHTML = '';
  surveyState.questions.forEach((q, idx) => {
    const ans = surveyState.answers[q.id];
    const item = document.createElement('div');
    item.className = 'review-answer-item';
    
    let answerDisplay = `<span style="color:#ef4444;">Chưa trả lời</span>`;
    if (ans) {
      const extra = (ans.letter === 'D' && ans.customText) ? ` ➔ <em>"${escapeHtml(ans.customText)}"</em>` : '';
      const viewLink = getGoogleViewLink(ans.text);
      const linkBadge = viewLink ? ` <a href="${viewLink.url}" target="_blank" rel="noopener noreferrer" class="option-link-pill review-pill" onclick="event.stopPropagation();" title="Xem view & ảnh thực tế trên Google Maps">📍 Xem view trên GG ↗</a>` : '';
      answerDisplay = `<strong>[${ans.letter}]</strong> ${escapeHtml(ans.text)}${extra}${linkBadge}`;
    }

    item.innerHTML = `
      <span class="review-answer-num">#${idx + 1}</span>
      <div style="flex:1;">
        <div style="font-weight:600; color:#0c2340;">${escapeHtml(q.question)}</div>
        <div style="color:#0369a1; margin-top:2px;">${answerDisplay}</div>
      </div>
    `;

    item.style.cursor = 'pointer';
    item.title = 'Bấm vào để sửa câu này';
    item.addEventListener('click', () => {
      surveyState.currentStep = idx + 1;
      renderCurrentStep();
    });

    reviewAnswersList.appendChild(item);
  });
}

function updateProgress(step, total, text) {
  const percentage = Math.round((step / total) * 100);
  progressText.textContent = text || `Câu ${step} / ${total}`;
  progressBar.style.width = `${percentage}%`;
  progressPercent.textContent = `${percentage}%`;
}

// ==========================================================================
// Form Submission & Automatic Email Dispatch to thanhtoicntt2000@gmail.com
// ==========================================================================
async function handleSubmitSurvey() {
  hideValidationAlert();

  const nameInput = document.getElementById('respondentName');
  const deptInput = document.getElementById('respondentDept');
  const feedbackInput = document.getElementById('additionalFeedback');

  const respondentName = nameInput.value.trim();

  if (!respondentName) {
    showValidationAlert('Vui lòng nhập Tên của bạn ở bước đầu tiên.');
    surveyState.currentStep = 0;
    renderCurrentStep();
    nameInput.focus();
    return;
  }

  // Validate Questions Completion
  const missing = [];
  surveyState.questions.forEach((q, idx) => {
    if (!surveyState.answers[q.id]) {
      missing.push(idx + 1);
    }
  });

  if (missing.length > 0) {
    showValidationAlert(`Bạn chưa chọn đáp án cho Câu #${missing.join(', #')}. Bấm vào câu để trả lời nhé!`);
    return;
  }

  // Prepare Payload
  const submissionData = {
    respondent: {
      name: respondentName,
      department: deptInput.value.trim() || 'Thành viên nhóm',
      submittedAt: new Date().toLocaleString('vi-VN')
    },
    feedback: feedbackInput.value.trim() || 'Không có',
    answers: surveyState.questions.map((q, idx) => {
      const ans = surveyState.answers[q.id];
      const customDetail = (ans.letter === 'D' && ans.customText) ? ` -> [Ý kiến riêng: "${ans.customText}"]` : '';
      return {
        index: idx + 1,
        id: q.id,
        question: q.question,
        chosenOption: ans.letter,
        chosenText: `${ans.text}${customDetail}`,
        customOpinion: ans.customText || ''
      };
    })
  };

  await dispatchSurveyToEmail(submissionData);
}

async function dispatchSurveyToEmail(data) {
  setSubmitting(true);

  const emailSubject = `[Nam Du 3N2Đ] Bình chọn từ: ${data.respondent.name} (${data.respondent.department})`;
  
  let formattedSummary = `=== THÔNG TIN BẠN BÈ THAM GIA KHẢO SÁT ===\n`;
  formattedSummary += `Tên: ${data.respondent.name}\n`;
  formattedSummary += `Biệt danh: ${data.respondent.department}\n`;
  formattedSummary += `Thời gian nộp: ${data.respondent.submittedAt}\n\n`;
  formattedSummary += `=== KẾT QUẢ BÌNH CHỌN (${data.answers.length} CÂU HỎI) ===\n`;
  data.answers.forEach(a => {
    formattedSummary += `Câu ${a.index}. ${a.question}\n-> Đáp án chọn: [${a.chosenOption}] ${a.chosenText}\n\n`;
  });
  formattedSummary += `=== GÓP Ý / LỜI NHẮN NHỦ THÊM ===\n${data.feedback}\n`;

  // 1. Always save locally to server (survey_submissions.json & survey_submissions.csv)
  if (window.location.protocol.startsWith('http')) {
    try {
      await fetch('/api/submit', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      console.log("Đã lưu kết quả khảo sát thành công trên máy chủ cục bộ.");
    } catch (localErr) {
      console.warn("Không thể lưu cục bộ (nếu chạy static hosting):", localErr);
    }
  }

  // 2. Send email via FormSubmit AJAX service
  try {
    const formSubmitUrl = `https://formsubmit.co/ajax/${TARGET_EMAIL}`;
    // 2. Build detailed email payload where each question & chosen answer is a distinct table row
    const emailPayload = {
      _subject: emailSubject,
      _template: "table",
      _captcha: "false",
      "Họ và tên": data.respondent.name,
      "Biệt danh trong nhóm": data.respondent.department || "Thành viên nhóm",
      "Thời gian nộp bài": data.respondent.submittedAt,
    };

    // Add each question and the chosen option into the email table
    data.answers.forEach(a => {
      emailPayload[`Câu ${a.index}: ${a.question}`] = `[${a.chosenOption}] ${a.chosenText}`;
    });

    if (data.feedback && data.feedback !== 'Không có') {
      emailPayload["Lời nhắn / Góp ý riêng"] = data.feedback;
    }

    emailPayload["Tổng hợp toàn bộ câu trả lời"] = formattedSummary;

    const response = await fetch(formSubmitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(emailPayload)
    });

    const result = await response.json();
    console.log("FormSubmit response:", result);

    if (result.success === "false" || result.success === false) {
      console.warn("FormSubmit notice:", result.message);
      if (window.location.protocol === 'file:') {
        showToast('Vui lòng mở web bằng http://localhost:5500 để gửi email được nhé!', 'warning');
      } else {
        showToast(`Thông báo mail: ${result.message}`, 'info');
      }
    }

    // Pastel Party Confetti Celebration
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#fb7185', '#f472b6', '#38bdf8', '#34d399', '#fde047', '#fed7aa', '#c084fc']
      });
    }

    beachAudio.playSuccessFanfare();
    showToast('🎉 Gửi khảo sát thành công về email! Đang mở lịch trình 3N2Đ dành riêng cho bạn...', 'success');

    // Automatically transition to Personalized 3D2N Itinerary Plan
    surveyState.currentStep = surveyState.questions.length + 2;
    renderCurrentStep();
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
    showToast('Đã lưu dữ liệu bình chọn của bạn! Đang mở lịch trình 3N2Đ...', 'info');
    surveyState.currentStep = surveyState.questions.length + 2;
    renderCurrentStep();
  } finally {
    setSubmitting(false);
  }
}

// ==========================================================================
// UI Helpers & Modals
// ==========================================================================
function showSuccessModal(data, targetEmail, isFallback = false) {
  // Celebration tropical fanfare chime
  beachAudio.playSuccessFanfare();

  const successDesc = document.getElementById('successMessageDetail');
  successDesc.innerHTML = `Cảm ơn bạn iu đã bình chọn! Toàn bộ <strong>${data.answers.length}</strong> câu trả lời đã được gửi trực tiếp về email chủ xị: <strong>${escapeHtml(targetEmail)}</strong>.`;

  submissionSummary.innerHTML = `
    <p><strong>Người gửi:</strong> ${escapeHtml(data.respondent.name)}</p>
    <p><strong>Biệt danh:</strong> ${escapeHtml(data.respondent.department)}</p>
    <hr style="margin: 10px 0; border: none; border-top: 1px solid #fce7f3;">
    <div style="font-weight: 700; margin-bottom: 6px; color:#e11d48;">Tóm tắt câu đã chọn nè:</div>
    <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 4px;">
      ${data.answers.map(a => `<li><strong>Câu ${a.index}:</strong> [${a.chosenOption}] ${escapeHtml(a.chosenText)}</li>`).join('')}
    </ul>
    ${data.feedback !== 'Không có' ? `<p style="margin-top: 8px;"><strong>Lời nhắn:</strong> ${escapeHtml(data.feedback)}</p>` : ''}
    <div style="margin-top: 14px; padding: 10px 14px; background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 12px; font-size: 0.84rem; color: #065f46; line-height: 1.5;">
      ✨ Toàn bộ lựa chọn đã được gửi trực tiếp về email chủ xị thành công!
    </div>
  `;

  successModal.style.display = 'flex';
}

function showValidationAlert(msg) {
  beachAudio.playNavTap();
  validationMsg.textContent = msg;
  validationAlert.style.display = 'flex';
}

function hideValidationAlert() {
  validationAlert.style.display = 'none';
}

function setSubmitting(isSubmitting) {
  submitSurveyBtn.disabled = isSubmitting;
  submitSpinner.style.display = isSubmitting ? 'inline-block' : 'none';
  submitIcon.style.display = isSubmitting ? 'none' : 'inline-block';
  submitBtnText.textContent = isSubmitting ? 'Đang gửi chốt deal...' : 'Chốt Deal 🚀';
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// Personalized 3D2N Itinerary Plans Engine (Dynamic Hotel Replacement)
// ==========================================================================
let currentActivePlanKey = 'chill';

const TRIP_PLANS = {
  chill: {
    id: 'chill',
    name: 'Plan 1: Chill & BBQ Bãi Biển (Lịch trình thực tế chuẩn nhất)',
    badge: '🌴 Cân Bằng Nghỉ Dưỡng, Check-in & Hải Sản Bãi Biển',
    desc: 'Lịch trình thực tế được 80% bạn trẻ lựa chọn: Tắm biển Bãi Cây Mến cát trắng dừa nghiêng, cano tham quan Hòn Dầu - Hòn Mấu - Hòn Hai Bờ Đập, và mở tiệc BBQ hải sản nướng bên sóng biển.',
    days: [
      {
        dayNum: 1,
        title: 'Ngày 1: Rạch Giá ➔ Nam Du ➔ Nhận Phòng {HOTEL} ➔ Vi Vu 14km Ven Đảo ➔ Tắm Bãi Cây Mến ➔ BBQ Hải Sản',
        events: [
          {
            time: '05:30 - 08:45',
            icon: '🚢',
            name: 'Bến Tàu Rạch Giá ➔ Tàu Cao Tốc Ra Đảo Nam Du',
            desc: 'Xe giường nằm đến Rạch Giá lúc 05h00 - 05h30 sáng, di chuyển ra Bến tàu Rạch Giá ăn sáng tô bún cá Kiên Giang nóng hổi. Lên tàu cao tốc Superdong / Phú Quốc Express (chuyến 06h30 hoặc 07h30), vi vu 2 tiếng 15 phút ngắm trọn vẻ đẹp vịnh biển Kiên Giang ra đảo Nam Du (Hòn Lớn - Củ Tron).'
          },
          {
            time: '09:00 - 12:30',
            icon: '🏨',
            name: 'Cập Cảng Bãi Chệt ➔ Đón Về Chỗ Ở & Bữa Trưa Đặc Sản Cá Bớp',
            desc: 'Tàu cập cảng Bãi Chệt (trung tâm đảo). Xe ôm / xe trung chuyển đón đoàn đưa hành lý về thẳng <strong>{HOTEL}</strong>. Thưởng thức bữa trưa cơm gia đình miền biển chuẩn vị: cá bớp kho tộ đậm đà, canh chua cá bớp béo ngậy, mực xào chua ngọt và rau muống biển xào tỏi.'
          },
          {
            time: '13:00 - 15:00',
            icon: '🛏️',
            name: 'Check-in Nhận Phòng & Nghỉ Trưa Lấy Lại Thể Lực',
            desc: 'Nhận phòng tại <strong>{HOTEL}</strong>. Tận hưởng làn gió biển mát rượi đặc trưng, nghỉ trưa thư giãn sau chặng đường dài di chuyển.'
          },
          {
            time: '15:30 - 18:00',
            icon: '🛵',
            name: 'Thuê Xe Máy Chinh Phục Cung Đường 14km Quanh Đảo & Tắm Biển Bãi Cây Mến',
            desc: 'Nhận xe máy (150k/xe) vi vu cung đèo ven biển tuyệt đẹp quanh Hòn Lớn: dừng chân check-in Dốc Ông Tình ngắm toàn cảnh thung lũng Bãi Ngự, chụp ảnh Cây Bàng Cô Đơn cheo leo vách đá. Sau đó xuống tắm biển tại Bãi Cây Mến - bãi tắm đẹp nhất Nam Du với bờ cát trắng mịn, làn nước trong vắt như gương và hàng dừa hơn 70 năm tuổi nghiêng bóng sát mép sóng. Thưởng thức trái dừa chỉ ngọt thanh mát lạnh (25k - 30k/trái).'
          },
          {
            time: '18:30 - 22:30',
            icon: '🦞',
            name: 'Đại Tiệc Nướng BBQ Hải Sản Bãi Biển Bên Sóng Biển',
            desc: 'Quây quần tại sân nướng ven biển của <strong>{HOTEL}</strong>: Mực ống Nam Du nướng sa tế giòn ngọt, nhum biển nướng mỡ hành trứng cút béo ngậy, sò tộ nướng, cá bớp nướng muối ớt và lẩu hải sản chua cay. Cụng bia lạnh, nghe tiếng sóng vỗ rì rào và cùng nhau đàn hát tâm sự.'
          }
        ]
      },
      {
        dayNum: 2,
        title: 'Ngày 2: Cano Khám Phá Quần Đảo ➔ Hòn Dầu ➔ Hòn Mấu ➔ Lặn San Hô Hai Bờ Đập ➔ Hoàng Hôn & Hoạt Động Đêm',
        events: [
          {
            time: '07:00 - 08:00',
            icon: '☕',
            name: 'Bình Minh Biển Đảo & Bữa Sáng Năng Lượng',
            desc: 'Dậy sớm đón bình minh tuyệt đẹp ngay tại khuôn viên <strong>{HOTEL}</strong>, hít căng lồng ngực không khí trong lành của biển đảo. Thưởng thức bữa sáng bánh mì chả cá thu hoặc hủ tiếu hải sản cùng ly cà phê đậm đà.'
          },
          {
            time: '08:00 - 11:30',
            icon: '🚤',
            name: 'Cano Tour Quần Đảo: Check-in Cây Dừa Nằm Hòn Dầu & Thiên Đường Hòn Mấu',
            desc: 'Cano cao tốc đón đoàn tại bến xuất phát đi tour các đảo hoang sơ: Ghé Hòn Dầu check-in cây dừa cong nằm ngang biển huyền thoại và xích đu giữa biển. Tiếp tục sang Hòn Mấu - hòn đảo có bãi tắm đẹp nhất Nam Du: tự do tắm biển tại Bãi Chướng (cát trắng mịn nước xanh ngọc bích như Maldives thu nhỏ), check-in Bãi Đá Đen kỳ vĩ với những viên đá núi lửa nhẵn bóng do sóng biển bào mòn.'
          },
          {
            time: '11:45 - 13:30',
            icon: '🐟',
            name: 'Thưởng Thức Bữa Trưa Hải Sản Tươi Sống Trên Nhà Bè Hòn Ngang / Hòn Mấu',
            desc: 'Dùng bữa trưa trên nhà bè giữa vịnh biển: cá xanh xương nướng bẹ chuối (đặc sản có 1-0-2 của Nam Du thịt ngọt bùi chấm muối ớt chanh), mực hấp gừng giòn sần sật, sò mai nướng mỡ hành và cháo nhum nóng hổi thơm nức.'
          },
          {
            time: '13:45 - 15:30',
            icon: '🤿',
            name: 'Lặn Ngắm Rạn San Hô Tự Nhiên & Bắt Nhum Tại Hòn Hai Bờ Đập',
            desc: 'Cano đưa đoàn đến Hòn Hai Bờ Đập - nơi sở hữu rạn san hô tự nhiên đẹp nhất quần đảo. Trang bị áo phao, kính lặn ngắm nhìn đàn cá biển sọc bơi lượn quanh rạn san hô bắp cải và thử tài câu cá biển, bắt nhum cùng ngư dân.'
          },
          {
            time: '16:00 - 18:00',
            icon: '🌅',
            name: 'Về Chỗ Ở Tắm Tráng & Ngắm Hoàng Hôn Rực Rỡ Vách Đá Nam Du',
            desc: 'Cano đưa đoàn về lại <strong>{HOTEL}</strong> tắm tráng nước ngọt và nghỉ ngơi. Chiều tà ghé quán cà phê ven đèo ngắm hoàng hôn màu cam đỏ buông xuống đường chân trời vịnh Thái Lan.'
          },
          {
            time: '18:30 - 22:30',
            icon: '🦑',
            name: 'Trải Nghiệm Đêm: Câu Mực Khơi Xa Hoặc Chill Bờ Biển',
            desc: '{SQUID_ACTIVITY}'
          }
        ]
      },
      {
        dayNum: 3,
        title: 'Ngày 3: Dạo Chợ Cảng Bãi Chệt ➔ Mua Đặc Sản Mực Một Nắng & Khô Cá Xanh Xương ➔ Tàu Về Rạch Giá',
        events: [
          {
            time: '06:30 - 08:30',
            icon: '📸',
            name: 'Check-in Buổi Sáng & Chụp Ảnh Kỷ Niệm Tập Thể',
            desc: 'Tận hưởng buổi sáng thanh bình cuối cùng trên đảo, chụp bộ ảnh kỷ niệm tập thể nhóm trước các góc check-in view biển tuyệt đẹp của <strong>{HOTEL}</strong>.'
          },
          {
            time: '08:30 - 10:30',
            icon: '🛍️',
            name: 'Oanh Tạc Chợ Cảng Bãi Chệt - Chọn Mua Đặc Sản Nam Du',
            desc: 'Ghé chợ cảng Bãi Chệt mua quà gửi về đất liền: Mực một nắng dẻo thơm, khô cá xanh xương rút xương nướng bẹ chuối, chả cá thu chiên nóng hổi vừa ra lò, tôm khô biển và me ngào đường thốt nốt.'
          },
          {
            time: '10:45 - 11:30',
            icon: '🧳',
            name: 'Check-out & Di Chuyển Ra Cầu Cảng',
            desc: 'Về lại <strong>{HOTEL}</strong> đóng gói hành lý và thùng xốp hải sản, làm thủ tục check-out. Xe đưa đoàn ra cầu cảng Bãi Chệt chuẩn bị lên tàu.'
          },
          {
            time: '11:50 - 14:15',
            icon: '🚤',
            name: 'Tàu Cao Tốc Rời Nam Du Về Lại Bến Tàu Rạch Giá',
            desc: 'Lên tàu cao tốc chuyến trưa (11h50 - 14h05 cập cảng Rạch Giá). Xe đón về bến xe Rạch Giá bắt tuyến xe khách về lại TP.HCM / tỉnh nhà. Kết thúc chuyến du lịch Nam Du 3N2Đ trọn vẹn niềm vui và đầy ắp trải nghiệm đáng nhớ!'
          }
        ]
      }
    ]
  },
  luxury: {
    id: 'luxury',
    name: 'Plan 2: Nghỉ Dưỡng & Tận Hưởng Biển Đảo (Thư thái, sang xịn)',
    badge: '🏊‍♂️ Thư Thái, Không Hối Hả & Tối Ưu Nghỉ Dưỡng',
    desc: 'Lịch trình thong thả dành cho người thích nghỉ ngơi: tận hưởng tối đa hồ bơi vô cực view biển / bãi riêng, chèo SUP thư thái, ngắm hoàng hôn từ ban công phòng và thưởng thức set menu hải sản cao cấp.',
    days: [
      {
        dayNum: 1,
        title: 'Ngày 1: Rạch Giá ➔ Check-in Phòng View Biển {HOTEL} ➔ Hồ Bơi Biển & Thư Thái Hoàng Hôn',
        events: [
          {
            time: '07:30 - 10:30',
            icon: '🚢',
            name: 'Tàu Cao Tốc Sang Đảo & Xe Đón Riêng Về Resort',
            desc: 'Lên tàu cao tốc chuyến 07h30 hoặc 08h30 thong thả từ Rạch Giá ra đảo Nam Du. Đội ngũ của <strong>{HOTEL}</strong> hỗ trợ hành lý đón đoàn tại cầu cảng Bãi Chệt, xe di chuyển êm ái về điểm lưu trú.'
          },
          {
            time: '11:00 - 13:30',
            icon: '🍲',
            name: 'Bữa Trưa Set Menu Ẩm Thực Biển Đảo & Check-in',
            desc: 'Check-in nhận phòng view biển tuyệt đẹp tại <strong>{HOTEL}</strong>. Thưởng thức bữa trưa ấm cúng với set menu đặc sản: cá bớp kho tộ, tôm ram mặn ngọt, mực xào cần tỏi và canh chua cá bớp béo ngọt thơm ngát.'
          },
          {
            time: '14:30 - 17:30',
            icon: '🏊‍♂️',
            name: 'Tận Hưởng Hồ Bơi Vô Cực / Bãi Biển Riêng & Chèo Thuyền Kayak/SUP',
            desc: 'Nghỉ dưỡng thư thái tại <strong>{HOTEL}</strong>. Tắm hồ bơi vô cực sát biển ngắm mây trời bao la, chụp ảnh check-in sống ảo sang xịn, hoặc chèo thuyền Kayak / SUP nhẹ nhàng trên mặt vịnh biển phẳng lặng như gương.'
          },
          {
            time: '18:30 - 21:30',
            icon: '🍷',
            name: 'Bữa Tối Hải Sản Lãng Mạn & Nhâm Nhi Cocktail Bên Sóng Biển',
            desc: 'Bữa tối tại nhà hàng sát biển của <strong>{HOTEL}</strong> với lẩu cá bớp măng chua, mực lá nướng sa tế giòn ngọt, sò mai nướng mỡ hành, gỏi cá trích cuốn bánh tráng. Nhâm nhi ly cocktail mát lạnh hoặc bia ướp lạnh dưới bầu trời sao lấp lánh.'
          }
        ]
      },
      {
        dayNum: 2,
        title: 'Ngày 2: Cano Riêng Dạo Vịnh Đảo ➔ Hòn Mấu ➔ Ăn Trưa Bè Nổi ➔ Thư Giãn Hoàng Hôn',
        events: [
          {
            time: '07:30 - 09:00',
            icon: '🥐',
            name: 'Bữa Sáng Thảnh Thơi & Cà Phê Ngắm Bình Minh',
            desc: 'Thức giấc tự nhiên theo tiếng sóng biển rì rào tại <strong>{HOTEL}</strong>. Thưởng thức bữa sáng nóng hổi, nhâm nhi tách trà/cà phê ngắm bình minh phản chiếu lung linh trên mặt biển.'
          },
          {
            time: '09:30 - 13:00',
            icon: '🚤',
            name: 'Cano Riêng Dạo Vịnh Đảo Êm Đềm & Tắm Biển Hòn Mấu',
            desc: 'Cano riêng đón đoàn lướt êm qua các vịnh biển thanh bình. Ghé Bãi Chướng Hòn Mấu thả mình vào làn nước trong vắt cát trắng phau, lặn ngắm san hô nhẹ nhàng gần bờ với áo phao và kính bơi.'
          },
          {
            time: '13:00 - 15:00',
            icon: '🐟',
            name: 'Thưởng Thức Bữa Trưa Cao Cấp Trên Nhà Bè Hải Sản',
            desc: 'Dùng bữa trưa trên nhà bè giữa biển: cá mú hấp xì dầu tươi rói cuốn bánh tráng, tôm mũ ni nướng, mực hấp hành gừng thơm lừng và nhum nướng mỡ hành béo ngậy.'
          },
          {
            time: '15:30 - 18:00',
            icon: '🌅',
            name: 'Trở Về Chỗ Ở & Ngắm Hoàng Hôn Từ Ban Công Phòng',
            desc: 'Về lại <strong>{HOTEL}</strong> nghỉ ngơi thư thái. Dành trọn buổi chiều đọc sách, nghe nhạc lofi, ngâm chân thư giãn và ngắm khoảnh khắc hoàng hôn nhuộm hồng chân trời ngay từ ban công phòng.'
          },
          {
            time: '18:30 - 22:00',
            icon: '🎶',
            name: 'Tối Acoustic & Tâm Sự Bạn Bè Không Gian Riêng Tư',
            desc: 'Bữa tối nhẹ nhàng bên bạn bè tại khuôn viên <strong>{HOTEL}</strong>, mở playlist acoustic nhẹ nhàng, cùng nhau ôn lại kỷ niệm và tận hưởng không gian yên tĩnh tuyệt đối của biển đảo.'
          }
        ]
      },
      {
        dayNum: 3,
        title: 'Ngày 3: Đón Bình Minh Phòng Biển ➔ Mua Đặc Sản Cao Cấp ➔ Tàu Về Đất Liền',
        events: [
          {
            time: '07:00 - 09:30',
            icon: '☀️',
            name: 'Mở Rèm Ngắm Trọn Bình Minh Trên Giường Ngủ',
            desc: 'Đón những tia nắng sớm chiếu rọi vào phòng nghỉ <strong>{HOTEL}</strong>. Tắm bơi sáng sớm thanh lọc cơ thể và thưởng thức bữa sáng thong thả.'
          },
          {
            time: '10:00 - 11:30',
            icon: '🎁',
            name: 'Chọn Mua Đặc Sản Cao Cấp Đảo Nam Du',
            desc: 'Ghé cơ sở hải sản uy tín đóng thùng xốp cá bớp tươi sống, mực một nắng câu loại 1, tôm khô chất lượng mang về biếu gia đình.'
          },
          {
            time: '11:45 - 14:00',
            icon: '🚢',
            name: 'Check-out Thong Thả & Tàu Cao Tốc Về Rạch Giá',
            desc: 'Check-out tại <strong>{HOTEL}</strong>, xe đưa ra cầu cảng lên tàu cao tốc trở về đất liền với tâm trạng thư thái, tràn đầy năng lượng tươi mới!'
          }
        ]
      }
    ]
  },
  adventure: {
    id: 'adventure',
    name: 'Plan 3: Khám Phá Hoang Sơ & Bắt Mực Đêm (Trải nghiệm khơi xa)',
    badge: '🦑 Trekking Hải Đăng 308m, Bãi Sỏi & Săn Mực Đêm',
    desc: 'Dành cho nhóm bạn trẻ năng động thích khám phá: chinh phục đỉnh Hải Đăng Nam Du ngắm 21 hòn đảo, lặn san hô rạn đá Bãi Sỏi, ra khơi câu mực đêm ăn cháo nóng hổi trên boong tàu.',
    days: [
      {
        dayNum: 1,
        title: 'Ngày 1: Chinh Phục Cung Đèo Ven Biển ➔ Lặn San Hô Bãi Sỏi ➔ TÂM ĐIỂM RA KHƠI CÂU MỰC ĐÊM',
        events: [
          {
            time: '06:00 - 09:30',
            icon: '🚢',
            name: 'Cập Cảng Nam Du & Nhận Xe Máy Khám Phá Biển Đảo',
            desc: 'Tàu cao tốc cập cảng Bãi Chệt. Nhận ngay dàn xe máy vi vu biển đảo, chạy theo cung đường quanh đảo ngoạn mục về gửi đồ tại <strong>{HOTEL}</strong>.'
          },
          {
            time: '10:00 - 12:30',
            icon: '🍜',
            name: 'Ăn Trưa Năng Lượng & Nghỉ Ngơi Tại Chỗ Ở',
            desc: 'Thưởng thức bún kèn Kiên Giang / cơm chiên hải sản thơm lừng. Nhận phòng và chợp mắt nghỉ ngơi tại <strong>{HOTEL}</strong>.'
          },
          {
            time: '13:30 - 17:00',
            icon: '⛰️',
            name: 'Chinh Phục Cây Bàng Cô Đơn, Dốc Ông Tình & Tự Do Lặn Biển Bãi Sỏi',
            desc: 'Chạy xe máy chinh phục cung đường đèo ven biển: check-in Cây Bàng Cô Đơn trên vách đá biển, đứng trên đỉnh Dốc Ông Tình phóng tầm mắt ngắm toàn cảnh Bãi Ngự xanh biếc. Ghé Bãi Sỏi tự do mang kính lặn ngắm rạn đá san hô tự nhiên, bắt ốc mắt ngọc và ngắm đàn cá bơi lội ngay sát bờ.'
          },
          {
            time: '17:30 - 22:30',
            icon: '🦑',
            name: 'TÂM ĐIỂM: Đi Tàu Ra Khơi Câu Mực Đêm & Ăn Cháo Mực Tươi Boong Tàu',
            desc: 'Xe đón đoàn ra tàu chuyên dụng câu mực đêm. Tàu rọi giàn đèn pha sáng rực giữa biển đêm mênh mông, thuyền trưởng hướng dẫn giũ mồi câu đàn mực ống háu ăn. Cảm giác tự tay giật cần câu được những con mực ống nhấp nháy ánh sao biển cực kỳ phấn khích! Mực vừa câu lên còn sống nguyên được nướng mọi ngọt lịm hoặc thả vào nồi cháo mực bốc khói nghi ngút ăn ngay trên boong tàu giữa biển đêm lộng gió! Sau đó tàu đưa đoàn về lại <strong>{HOTEL}</strong> ngủ say giấc.'
          }
        ]
      },
      {
        dayNum: 2,
        title: 'Ngày 2: Săn Bình Minh Hải Đăng Nam Du (Đỉnh 308m) ➔ Tour Hòn Dầu & Hòn Mấu ➔ Tiệc Nướng Hoang Dã',
        events: [
          {
            time: '05:30 - 08:30',
            icon: '🗼',
            name: 'Trekking / Xe Máy Lên Đỉnh Hải Đăng Nam Du (Điểm Cao Nhất Đảo)',
            desc: 'Dậy sớm chạy xe máy số / xe ôm người bản địa lên đỉnh ngọn Hải Đăng Nam Du (độ cao 308m so với mực nước biển). Đón khoảnh khắc mặt trời đỏ ửng nhô lên khỏi biển sương, phóng tầm mắt 360 độ ngắm trọn vẹn 21 hòn đảo lớn nhỏ của quần đảo Nam Du và hải phận biển Tây Nam hùng vĩ.'
          },
          {
            time: '09:00 - 12:30',
            icon: '🚤',
            name: 'Tour Tàu Khám Phá Hòn Dầu, Hòn Mấu & Lặn San Hô Hai Bờ Đập',
            desc: 'Ăn sáng nạp năng lượng tại <strong>{HOTEL}</strong> rồi lên tàu đi tour quần đảo: check-in cây dừa nằm huyền thoại Hòn Dầu, tắm biển cát trắng Bãi Chướng Hòn Mấu và lặn ngắm san hô bắp cải rực rỡ tại Hòn Hai Bờ Đập.'
          },
          {
            time: '12:30 - 14:30',
            icon: '🦐',
            name: 'Ăn Trưa Hải Sản Tươi Sống Đậm Chất Ngư Dân Trên Nhà Bè',
            desc: 'Ăn trưa thịnh soạn trên bè nổi: ốc nhảy hấp sả, nhum nướng mỡ hành béo ngậy, cá xanh xương nướng bẹ chuối ngọt bùi, ghẹ hấp ngọt thịt và lẩu cá bớp đậm đà.'
          },
          {
            time: '15:30 - 18:00',
            icon: '🏖️',
            name: 'Khám Phá Xóm Chài Bãi Ngự & Tìm Hiểu Dấu Tích Giếng Vua',
            desc: 'Chạy xe máy vào xóm chài Bãi Ngự tìm hiểu nhịp sống bình dị của ngư dân miền biển, tham quan Giếng Vua quanh năm không cạn nước ngọt gắn với tích vua Gia Long lánh nạn, rồi về lại <strong>{HOTEL}</strong> tắm biển và nghỉ ngơi.'
          },
          {
            time: '18:30 - 22:30',
            icon: '🔥',
            name: 'Tiệc Nướng BBQ Hoang Dã Sát Biển & Giao Lưu Hết Nấc',
            desc: 'Quây quần tại sân biển của <strong>{HOTEL}</strong>, tự tay nướng hải sản, lai rai khô cá xanh xương cùng bia lạnh, mở loa di động hát hò và chia sẻ những câu chuyện vui cùng bạn bè.'
          }
        ]
      },
      {
        dayNum: 3,
        title: 'Ngày 3: Dạo Cảng Sáng Sớm ➔ Đóng Thùng Xốp Hải Sản Sống Cấp Đông ➔ Về Lại Đất Liền',
        events: [
          {
            time: '06:30 - 09:00',
            icon: '🌅',
            name: 'Dạo Cảng Bãi Chệt Sáng Sớm & Thưởng Thức Bánh Mì Chả Cá Thu',
            desc: 'Dạo bộ cảng Bãi Chệt sáng sớm ngắm cảnh ghe tàu tấp nập cập bến sau chuyến đánh bắt đêm, ăn sáng ổ bánh mì chả cá thu chiên nóng hổi giòn rụm với rau răm nước sốt cay ngọt.'
          },
          {
            time: '09:00 - 11:30',
            icon: '📦',
            name: 'Mua Hải Sản Sống Cấp Đông Đóng Thùng Xốp Mang Về Đất Liền',
            desc: 'Chọn mua cá bớp tươi rói, ghẹ sống, mực lá vừa cập bến đóng vào thùng xốp ướp đá giữ nhiệt để mang về đất liền mở tiệc lẩu cùng gia đình.'
          },
          {
            time: '11:45 - 14:15',
            icon: '🚤',
            name: 'Check-out & Tàu Cao Tốc Về Lại Rạch Giá',
            desc: 'Thu dọn hành lý tại <strong>{HOTEL}</strong>, lên tàu cao tốc trở về bến tàu Rạch Giá với album ảnh sống ảo nghìn like và vô vàn kỷ niệm chinh phục biển đảo tuyệt vời!'
          }
        ]
      }
    ]
  }
};

function getSelectedHotel() {
  const hotelAns = surveyState.answers['6'];
  if (!hotelAns) return 'Homestay / Resort Nam Du';
  if (hotelAns.letter === 'A') return 'Thảo Thường Camp (Homestay Cầu Vồng)';
  if (hotelAns.letter === 'B') return 'Khu du lịch Humiso Nam Du';
  if (hotelAns.letter === 'C') return 'Bãi Sỏi Beach Nam Du';
  if (hotelAns.letter === 'D') {
    if (hotelAns.customText && hotelAns.customText.trim()) {
      return hotelAns.customText.trim();
    }
    return 'Langchia Nam Du Resort';
  }
  return hotelAns.text || 'Homestay / Resort Nam Du';
}

function getSelectedSquidTour() {
  const squidAns = surveyState.answers['3'];
  if (!squidAns) return 'Rất hào hứng thử câu mực đêm 🦑';
  if (squidAns.letter === 'A') return 'Rất hào hứng! Sẽ câu mực & ăn cháo tàu 🦑';
  if (squidAns.letter === 'B') return 'Thích đi nhưng sợ say sóng (uống thuốc) 💊';
  if (squidAns.letter === 'C') return 'Ở lại bờ / homestay chill & nhậu 🍻';
  if (squidAns.letter === 'D' && squidAns.customText) return squidAns.customText.trim();
  return squidAns.text;
}

function getSelectedBudget() {
  const budgetAns = surveyState.answers['9'];
  if (!budgetAns) return 'Khoảng 3.0 - 5.0 triệu / người';
  if (budgetAns.letter === 'A') return 'Khoảng 3.0 - 3.8 triệu / người';
  if (budgetAns.letter === 'B') return 'Khoảng 4.0 - 5.0 triệu / người';
  if (budgetAns.letter === 'C') return 'Khoảng 5.0 - 7.0 triệu / người';
  if (budgetAns.letter === 'D' && budgetAns.customText) return budgetAns.customText.trim();
  return budgetAns.text;
}

function getSquidActivitySummary(hotelName) {
  const squidAns = surveyState.answers['3'];
  if (squidAns && squidAns.letter === 'C') {
    return `Nhóm ở lại bờ / khuôn viên <strong>${escapeHtml(hotelName)}</strong>: nướng khô mực, cụng bia lạnh, nghe nhạc acoustic và ngắm đèn tàu câu mực sáng rực ngoài khơi xa.`;
  } else if (squidAns && squidAns.letter === 'B') {
    return `Chuẩn bị sẵn thuốc chống say, lên tàu ra khơi săn mực đêm. Tận mắt ngắm mực ống nhấp nháy và thưởng thức bát cháo mực tươi nóng hổi ngay trên boong tàu. Về lại <strong>${escapeHtml(hotelName)}</strong> nghỉ ngơi.`;
  } else {
    return `Lên tàu ra khơi câu mực đêm lúc 18h30. Trải nghiệm tự tay giật cần câu mực tươi sống dưới ánh đèn lung linh và thưởng thức cháo mực nóng hổi ngay trên boong tàu giữa biển đêm bao la. Về lại <strong>${escapeHtml(hotelName)}</strong> nghỉ ngơi say giấc.`;
  }
}

function getHotelCostDetails() {
  const hotelAns = surveyState.answers['6'];
  if (!hotelAns) {
    return {
      name: 'Homestay / Resort Nam Du',
      desc: 'Phòng view biển / bungalow chia sẻ theo nhóm (2 đêm)',
      priceRange: '~500.000 - 800.000 đ',
      minPrice: 500000,
      maxPrice: 800000
    };
  }
  if (hotelAns.letter === 'A') {
    return {
      name: 'Thảo Thường Camp (Homestay Cầu Vồng)',
      desc: 'Bungalow màu sắc sát mép biển, sân BBQ ngắm bình minh (khoảng 250k - 350k/người/đêm)',
      priceRange: '~500.000 - 700.000 đ',
      minPrice: 500000,
      maxPrice: 700000
    };
  }
  if (hotelAns.letter === 'B') {
    return {
      name: 'Khu du lịch Humiso Nam Du',
      desc: 'Bungalow mái lá view biển riêng, cầu gỗ hoàng hôn (khoảng 300k - 450k/người/đêm)',
      priceRange: '~600.000 - 900.000 đ',
      minPrice: 600000,
      maxPrice: 900000
    };
  }
  if (hotelAns.letter === 'C') {
    return {
      name: 'Bãi Sỏi Beach Nam Du',
      desc: 'Nhà gỗ biệt lập bên bãi san hô hoang sơ (khoảng 300k - 400k/người/đêm)',
      priceRange: '~600.000 - 800.000 đ',
      minPrice: 600000,
      maxPrice: 800000
    };
  }
  if (hotelAns.letter === 'D') {
    const custom = (hotelAns.customText && hotelAns.customText.trim()) ? hotelAns.customText.trim() : 'Langchia Nam Du Resort';
    return {
      name: custom,
      desc: 'Resort cao cấp có hồ bơi vô cực sát biển (khoảng 450k - 750k/người/đêm)',
      priceRange: '~900.000 - 1.500.000 đ',
      minPrice: 900000,
      maxPrice: 1500000
    };
  }
  return {
    name: hotelAns.text || 'Nhà nghỉ đảo Nam Du',
    desc: 'Phòng nghỉ tiện nghi 2 đêm chia nhóm',
    priceRange: '~500.000 - 800.000 đ',
    minPrice: 500000,
    maxPrice: 800000
  };
}

function renderPersonalizedPlan(planKey) {
  if (planKey) {
    currentActivePlanKey = planKey;
  }
  const activePlan = TRIP_PLANS[currentActivePlanKey] || TRIP_PLANS.chill;

  // Update tabs active state
  document.querySelectorAll('.plan-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-plan') === currentActivePlanKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const respondentName = document.getElementById('respondentName').value.trim() || 'Bạn';
  const hotelName = getSelectedHotel();
  const squidTour = getSelectedSquidTour();
  const budget = getSelectedBudget();
  const hotelCost = getHotelCostDetails();

  if (planRespondentName) planRespondentName.textContent = respondentName;
  if (planHotelName) planHotelName.textContent = hotelName;
  if (planSquidTour) planSquidTour.textContent = squidTour;
  if (planBudgetValue) planBudgetValue.textContent = budget;

  // Update dynamic cost table card
  const costSelectedHotelName = document.getElementById('costSelectedHotelName');
  const costSelectedHotelDesc = document.getElementById('costSelectedHotelDesc');
  const costSelectedHotelPrice = document.getElementById('costSelectedHotelPrice');
  const costEstimatedTotal = document.getElementById('costEstimatedTotal');
  const costSquidRowVal = document.getElementById('costSquidRowVal');

  // Update toggle button text according to active plan
  if (togglePlanCostLabel) {
    const planShortName = currentActivePlanKey === 'chill' ? 'Plan 1 (Chill)' :
                          currentActivePlanKey === 'luxury' ? 'Plan 2 (Nghỉ Dưỡng)' : 'Plan 3 (Khám Phá)';
    togglePlanCostLabel.textContent = `Chi phí ${planShortName}`;
  }

  // Calculate costs tailored for currentActivePlanKey
  // Plan 1 (Chill): Standard BBQ + Standard Cano + Squid optional
  // Plan 2 (Luxury): Resort/Homestay cao cấp hơn + Thưởng thức hải sản cao cấp + Cano dạo vịnh nhẹ
  // Plan 3 (Adventure): Trekking + Lặn bãi sỏi + Chắc chắn đi tàu câu mực đêm
  let planHotelCost = hotelCost;
  let planFoodCost = { min: 750000, max: 950000, desc: '2 bữa trưa cơm gia đình cá bớp + 1 tiệc BBQ hải sản bãi biển + 1 bữa tối tự do' };
  let planActivityCost = { min: 400000, max: 500000, desc: 'Thuê xe máy 2 ngày + cano tham quan 3 hòn & lặn san hô Hai Bờ Đập' };
  let planSquidCost = { min: 0, max: 0, desc: 'Tùy chọn theo khảo sát' };

  if (currentActivePlanKey === 'luxury') {
    planFoodCost = { min: 950000, max: 1250000, desc: 'Bữa trưa cá mú/tôm mũ ni nhà bè + tiệc tối acoustic riêng tư' };
    planActivityCost = { min: 450000, max: 600000, desc: 'Cano riêng dạo vịnh êm đềm + xe đưa đón các điểm check-in' };
    planSquidCost = { min: 0, max: 0, desc: 'Nghỉ dưỡng & ngắm đèn mực từ ban công (0đ)' };
  } else if (currentActivePlanKey === 'adventure') {
    planFoodCost = { min: 700000, max: 900000, desc: 'Cơm chiên hải sản + cháo mực tươi đêm boong tàu + tiệc nướng hoang dã' };
    planActivityCost = { min: 450000, max: 550000, desc: 'Xe máy đèo dốc lên Hải Đăng Nam Du (308m) + lặn rạn đá Bãi Sỏi + cano đảo' };
    planSquidCost = { min: 200000, max: 250000, desc: 'Bao gồm tàu đêm + cần câu + cháo mực nóng hổi ngay trên boong' };
  } else {
    // Chill
    const squidAns = surveyState.answers['3'];
    const wantsSquid = !squidAns || squidAns.letter === 'A' || squidAns.letter === 'B';
    planSquidCost = {
      min: wantsSquid ? 200000 : 0,
      max: wantsSquid ? 250000 : 0,
      desc: wantsSquid ? 'Tour câu mực đêm trên biển + cháo mực tươi' : 'Ở lại bờ chill cụng bia nghe sóng (0đ)'
    };
  }

  if (costSelectedHotelName) costSelectedHotelName.textContent = `(${planHotelCost.name})`;
  if (costSelectedHotelDesc) costSelectedHotelDesc.textContent = planHotelCost.desc;
  if (costSelectedHotelPrice) costSelectedHotelPrice.textContent = planHotelCost.priceRange;
  if (costSquidRowVal) {
    costSquidRowVal.textContent = planSquidCost.min > 0 ? `~${planSquidCost.min.toLocaleString('vi-VN')} - ${planSquidCost.max.toLocaleString('vi-VN')} đ` : '0 đ (Chọn ở bờ)';
  }

  // Base: Phương Trang (360k-400k) + Superdong (500k-520k) + Ăn sáng 3 ngày (120k-150k)
  const baseTransportAndBfastMin = 360000 + 500000 + 120000;
  const baseTransportAndBfastMax = 400000 + 520000 + 150000;

  const minTotal = baseTransportAndBfastMin + planFoodCost.min + planHotelCost.minPrice + planActivityCost.min + planSquidCost.min;
  const maxTotal = baseTransportAndBfastMax + planFoodCost.max + planHotelCost.maxPrice + planActivityCost.max + planSquidCost.max;

  if (costEstimatedTotal) {
    costEstimatedTotal.textContent = `~${(minTotal / 1000000).toFixed(2)} - ${(maxTotal / 1000000).toFixed(2)} triệu VNĐ / người`;
  }

  if (!planTimelineContainer) return;

  const squidSummaryHtml = getSquidActivitySummary(hotelName);

  let html = '';
  activePlan.days.forEach(day => {
    const renderedDayTitle = day.title.replace(/\{HOTEL\}/g, hotelName);

    html += `
      <div class="plan-day-card">
        <div class="plan-day-header">
          <span class="plan-day-badge">NGÀY 0${day.dayNum}</span>
          <h3 class="plan-day-title">${escapeHtml(renderedDayTitle)}</h3>
        </div>
        <div class="plan-events-list">
    `;

    day.events.forEach(ev => {
      const renderedDesc = ev.desc
        .replace(/\{HOTEL\}/g, `<strong style="color:#e11d48;">${escapeHtml(hotelName)}</strong>`)
        .replace(/\{SQUID_ACTIVITY\}/g, squidSummaryHtml);

      html += `
        <div class="plan-event-item">
          <div class="plan-event-icon">${ev.icon}</div>
          <div class="plan-event-content">
            <div class="plan-event-time">${escapeHtml(ev.time)}</div>
            <div class="plan-event-name">${escapeHtml(ev.name)}</div>
            <div class="plan-event-desc">${renderedDesc}</div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  planTimelineContainer.innerHTML = html;
}

function copyPlanTextToClipboard() {
  beachAudio.playOptionSelect('C');
  const plan = TRIP_PLANS[currentActivePlanKey] || TRIP_PLANS.chill;
  const respondentName = document.getElementById('respondentName').value.trim() || 'Thành viên nhóm';
  const hotelName = getSelectedHotel();
  const hotelCost = getHotelCostDetails();
  const squidTour = getSelectedSquidTour();
  const budget = getSelectedBudget();

  let text = `🏝️ KẾ HOẠCH & DỰ TOÁN CHI PHÍ NAM DU (3 NGÀY 2 ĐÊM) 🌴\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📌 Lịch trình: ${plan.name}\n`;
  text += `👤 Dành cho: ${respondentName} & Hội bạn thân\n`;
  text += `🏨 Điểm lưu trú (Đã chọn): ${hotelName}\n`;
  text += `🦑 Tour câu mực đêm: ${squidTour}\n`;
  text += `💰 Ngân sách mong muốn: ${budget}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  text += `📊 DỰ TOÁN CHI PHÍ CHI TIẾT (ƯỚC TÍNH / NGƯỜI):\n`;
  text += `1. 🚌 Xe Phương Trang khứ hồi (SG ⇄ Rạch Giá): ~360.000 - 400.000 đ (180k - 200k/lượt)\n`;
  text += `2. 🚢 Tàu Superdong khứ hồi (Rạch Giá ⇄ Nam Du): ~500.000 - 520.000 đ (đồng giá vé 250k - 260k/lượt)\n`;
  text += `3. 🥣 Ăn sáng 3 ngày trên đảo: ~120.000 - 150.000 đ (3 bữa: bún cá, hủ tiếu hải sản, bún quậy ~40k - 50k/bữa)\n`;
  text += `4. 🦞 Ăn uống chính 3N2Đ (2 trưa + tiệc BBQ hải sản tối + 1 tối tự do): ~750.000 - 950.000 đ\n`;
  text += `5. 🏨 Nhà nghỉ/Homestay 2 đêm (${hotelCost.name}): ${hotelCost.priceRange}\n`;
  text += `6. 🛵 Xe máy 2 ngày + Cano tham quan 3 hòn & lặn san hô: ~400.000 - 500.000 đ\n`;
  text += `7. 🦑 Tour câu mực đêm (nếu tham gia): ~200.000 - 250.000 đ\n`;
  text += `➔ 💵 TỔNG CHI PHÍ DỰ KIẾN: ~2.800.000 - 3.400.000 VNĐ / người trọn gói\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  plan.days.forEach(d => {
    const dayTitle = d.title.replace(/\{HOTEL\}/g, hotelName);
    text += `📅 ${dayTitle.toUpperCase()}\n`;
    text += `─────────────────────────────────\n`;
    d.events.forEach(ev => {
      const cleanDesc = ev.desc
        .replace(/<strong>(.*?)<\/strong>/g, '$1')
        .replace(/\{HOTEL\}/g, hotelName)
        .replace(/\{SQUID_ACTIVITY\}/g, getSquidActivitySummary(hotelName).replace(/<strong>(.*?)<\/strong>/g, '$1'));
      text += `⏱️ [${ev.time}] ${ev.icon} ${ev.name}\n`;
      text += `   ➔ ${cleanDesc}\n\n`;
    });
    text += `\n`;
  });

  text += `✨ Lịch trình & chi phí tự động cá nhân hóa từ kết quả khảo sát nhóm! Chốt deal xách balo lên và đi thôi nào anh em ơi 🚀🏝️`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 Đã sao chép lịch trình! Bạn có thể dán ngay vào Zalo/Messenger của nhóm.', 'success');
    }).catch(() => {
      fallbackCopyText(text);
    });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('📋 Đã sao chép lịch trình! Bạn có thể dán ngay vào Zalo/Messenger của nhóm.', 'success');
  } catch (e) {
    showToast('Không thể tự động sao chép. Vui lòng chụp màn hình lịch trình nhé!', 'warning');
  }
  document.body.removeChild(ta);
}

// Export Survey Answers as JSON
function exportSurveyData() {
  beachAudio.playNavTap();
  const answeredCount = Object.keys(surveyState.answers).length;
  if (answeredCount === 0) {
    showToast('Chưa có câu trả lời nào để xuất file.', 'error');
    return;
  }

  const exportPayload = {
    respondentName: document.getElementById('respondentName').value.trim() || 'Anonymous',
    department: document.getElementById('respondentDept').value.trim() || 'N/A',
    recipientEmail: TARGET_EMAIL,
    timestamp: new Date().toISOString(),
    results: surveyState.questions.map(q => {
      const ans = surveyState.answers[q.id];
      return {
        id: q.id,
        question: q.question,
        chosenOption: ans ? ans.letter : null,
        chosenText: ans ? ans.text : null,
        customOpinion: (ans && ans.letter === 'D') ? (ans.customText || '') : null
      };
    })
  };

  const jsonBlob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(jsonBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `namdu-survey-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã tải xuống file kết quả khảo sát!', 'success');
}

function resetSurvey() {
  beachAudio.playNavTap();
  surveyState.answers = {};
  surveyState.currentStep = 0;
  document.getElementById('surveyForm').reset();

  renderCurrentStep();
  hideValidationAlert();
  successModal.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateAudioUIState(isPlaying) {
  if (!bgMusicToggleBtn || !musicBtnLabel) return;
  if (isPlaying) {
    bgMusicToggleBtn.classList.add('active');
    musicBtnLabel.textContent = 'Nhạc Nền: Bật';
  } else {
    bgMusicToggleBtn.classList.remove('active');
    musicBtnLabel.textContent = 'Nhạc Nền: Tắt';
  }
}

// ==========================================================================
// Event Listeners Setup
// ==========================================================================
function setupEventListeners() {
  // Start Survey Button (From Step 0 to Step 1)
  startSurveyBtn.addEventListener('click', () => {
    const name = document.getElementById('respondentName').value.trim();

    if (!name) {
      beachAudio.playNavTap();
      showToast('Vui lòng nhập tên của bạn trước khi bắt đầu!', 'error');
      document.getElementById('respondentName').focus();
      return;
    }

    // Auto-start ambient beach music and play gentle transition chime
    beachAudio.startAmbient();
    beachAudio.playStepChime();
    updateAudioUIState(true);

    surveyState.currentStep = 1;
    renderCurrentStep();
  });

  // Music toggle button & volume
  if (bgMusicToggleBtn) {
    bgMusicToggleBtn.addEventListener('click', () => {
      const isPlaying = beachAudio.toggleMusic();
      updateAudioUIState(isPlaying);
      if (isPlaying) {
        showToast('🎵 Đang phát nhạc nền chill', 'info');
      } else {
        showToast('🔇 Đã tạm dừng nhạc nền', 'info');
      }
    });
  }

  if (bgMusicVolume) {
    bgMusicVolume.addEventListener('input', (e) => {
      beachAudio.setVolume(e.target.value);
    });
  }

  // Guarantee audio plays as soon as user touches or clicks anywhere on page
  const startMusicOnAnyGesture = () => {
    beachAudio.ensureContext();
    if (!beachAudio.isExplicitlyPaused) {
      beachAudio.startAmbient();
    }
  };
  ['click', 'touchstart', 'pointerdown', 'keydown', 'scroll'].forEach(evt => {
    window.addEventListener(evt, startMusicOnAnyGesture, { capture: true, once: true });
  });

  // Keep playing if tab becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !beachAudio.isExplicitlyPaused) {
      beachAudio.startAmbient();
    }
  });

  const bgAudioEl = document.getElementById('bgBeachAudio');
  if (bgAudioEl) {
    bgAudioEl.addEventListener('ended', () => {
      if (!beachAudio.isExplicitlyPaused) {
        bgAudioEl.currentTime = 0;
        bgAudioEl.play().catch(() => {});
      }
    });
  }

  // Next and Prev Question Buttons
  nextQuestionBtn.addEventListener('click', advanceNextQuestion);
  prevQuestionBtn.addEventListener('click', advancePrevQuestion);
  reviewBackBtn.addEventListener('click', () => {
    beachAudio.playNavTap();
    surveyState.currentStep = surveyState.questions.length;
    renderCurrentStep();
  });

  // Submit and export
  submitSurveyBtn.addEventListener('click', () => {
    beachAudio.playNavTap();
    handleSubmitSurvey();
  });
  if (exportDataBtn) exportDataBtn.addEventListener('click', exportSurveyData);
  if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', exportSurveyData);
  if (newSurveyBtn) newSurveyBtn.addEventListener('click', resetSurvey);

  // Plan Tab Switching Event Listeners
  const planTabBtns = document.querySelectorAll('.plan-tab-btn');
  planTabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      beachAudio.playNavTap();
      const planKey = e.currentTarget.getAttribute('data-plan');
      planTabBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      renderPersonalizedPlan(planKey);
    });
  });

  // Copy Plan Text Button
  if (copyPlanTextBtn) {
    copyPlanTextBtn.addEventListener('click', copyPlanTextToClipboard);
  }

  // Plan Back To Survey Button
  if (planBackToSurveyBtn) {
    planBackToSurveyBtn.addEventListener('click', () => {
      beachAudio.playNavTap();
      resetSurvey();
    });
  }

  // Toggle Cost Breakdown Card Button for current plan
  if (togglePlanCostBtn && costBreakdownCard) {
    togglePlanCostBtn.addEventListener('click', () => {
      beachAudio.playNavTap();
      const isVisible = costBreakdownCard.style.display !== 'none';
      if (isVisible) {
        costBreakdownCard.style.display = 'none';
        togglePlanCostBtn.classList.remove('active');
      } else {
        costBreakdownCard.style.display = 'block';
        togglePlanCostBtn.classList.add('active');
        costBreakdownCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Open Cost Comparison Modal Button (Compare All 3 Plans)
  if (openPlanCostModalBtn && costComparisonModal) {
    openPlanCostModalBtn.addEventListener('click', () => {
      beachAudio.playOptionSelect('B');
      renderCostComparisonModal();
      costComparisonModal.style.display = 'flex';
    });
  }

  if (closeCostModalBtn && costComparisonModal) {
    closeCostModalBtn.addEventListener('click', () => {
      beachAudio.playNavTap();
      costComparisonModal.style.display = 'none';
    });
  }

  if (closeCostModalFooterBtn && costComparisonModal) {
    closeCostModalFooterBtn.addEventListener('click', () => {
      beachAudio.playNavTap();
      costComparisonModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === successModal) successModal.style.display = 'none';
    if (e.target === costComparisonModal) costComparisonModal.style.display = 'none';
  });

  // Keyboard navigation support: Enter to go next
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && costComparisonModal && costComparisonModal.style.display === 'flex') {
      costComparisonModal.style.display = 'none';
    }
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      if (surveyState.currentStep === 0) {
        startSurveyBtn.click();
      } else if (surveyState.currentStep >= 1 && surveyState.currentStep <= surveyState.questions.length) {
        if (e.target !== singleCustomOpinionInput) {
          nextQuestionBtn.click();
        }
      }
    }
  });
}

function renderCostComparisonModal() {
  if (!costComparisonModalContent) return;

  const hotelName = getSelectedHotel();
  const hotelCost = getHotelCostDetails();
  const squidAns = surveyState.answers['3'];
  const wantsSquid = !squidAns || squidAns.letter === 'A' || squidAns.letter === 'B';

  const plansData = [
    {
      key: 'chill',
      tag: 'Gợi ý số 1',
      tagClass: 'col-tag-chill',
      title: 'Plan 1: Chill & BBQ Bãi Biển',
      desc: 'Cân bằng nghỉ dưỡng, tắm biển Bãi Cây Mến, cano 3 hòn & mở tiệc BBQ nướng bên sóng biển.',
      hotel: `${hotelCost.name}: ${hotelCost.priceRange}`,
      transport: 'Xe Phương Trang (360k-400k) + Tàu Superdong (500k-520k)',
      bfast: '3 bữa sáng đặc sản: ~120k - 150k',
      food: '2 trưa cơm cá bớp + 1 tiệc tối BBQ hải sản: ~750k - 950k',
      activities: 'Thuê xe máy 2 ngày + cano 3 hòn & lặn san hô: ~400k - 500k',
      squid: wantsSquid ? 'Tour câu mực đêm: ~200k - 250k' : 'Ở lại bờ chill: 0đ',
      minTotal: 360000 + 500000 + 120000 + 750000 + hotelCost.minPrice + 400000 + (wantsSquid ? 200000 : 0),
      maxTotal: 400000 + 520000 + 150000 + 950000 + hotelCost.maxPrice + 500000 + (wantsSquid ? 250000 : 0)
    },
    {
      key: 'luxury',
      tag: 'Nghỉ dưỡng',
      tagClass: 'col-tag-luxury',
      title: 'Plan 2: Nghỉ Dưỡng & Hồ Bơi Biển',
      desc: 'Thư giãn tuyệt đối, hồ bơi vô cực ngắm hoàng hôn, cano dạo vịnh êm và tiệc tối acoustic riêng tư.',
      hotel: 'Resort hồ bơi / Bungalow cao cấp: ~900k - 1.500k',
      transport: 'Xe Phương Trang (360k-400k) + Tàu Superdong (500k-520k)',
      bfast: '3 bữa sáng thong thả cà phê: ~150k - 200k',
      food: 'Bữa trưa cá mú/tôm mũ ni nhà bè + tiệc tối riêng: ~950k - 1.250k',
      activities: 'Cano dạo vịnh nhẹ nhàng + xe đưa đón check-in: ~450k - 600k',
      squid: 'Ngắm đèn mực từ ban công resort: 0đ',
      minTotal: 360000 + 500000 + 150000 + 950000 + 900000 + 450000,
      maxTotal: 400000 + 520000 + 200000 + 1250000 + 1500000 + 600000
    },
    {
      key: 'adventure',
      tag: 'Trải nghiệm',
      tagClass: 'col-tag-adventure',
      title: 'Plan 3: Khám Phá & Bắt Mực Đêm',
      desc: 'Trekking Hải Đăng Nam Du đỉnh 308m ngắm 21 hòn đảo, lặn san hô Bãi Sỏi & đi tàu câu mực đêm.',
      hotel: `${hotelCost.name}: ${hotelCost.priceRange}`,
      transport: 'Xe Phương Trang (360k-400k) + Tàu Superdong (500k-520k)',
      bfast: '3 bữa sáng nạp năng lượng: ~120k - 150k',
      food: 'Cơm chiên hải sản + tiệc nướng + cháo mực tàu: ~700k - 900k',
      activities: 'Xe máy đèo Hải Đăng 308m + lặn Bãi Sỏi + cano: ~450k - 550k',
      squid: 'Bao gồm trọn gói tàu câu mực đêm + cháo mực boong tàu: ~200k - 250k',
      minTotal: 360000 + 500000 + 120000 + 700000 + hotelCost.minPrice + 450000 + 200000,
      maxTotal: 400000 + 520000 + 150000 + 900000 + hotelCost.maxPrice + 550000 + 250000
    }
  ];

  let html = `<div class="plans-compare-grid">`;

  plansData.forEach(p => {
    const isCurrent = p.key === currentActivePlanKey;
    html += `
      <div class="plan-compare-col ${isCurrent ? 'active-plan-col' : ''}">
        <span class="plan-col-tag ${p.tagClass}">${p.tag} ${isCurrent ? '★ (Đang xem)' : ''}</span>
        <h4 class="plan-col-title">${escapeHtml(p.title)}</h4>
        <p class="plan-col-desc">${escapeHtml(p.desc)}</p>

        <div class="plan-col-total-box">
          <div class="col-total-label">DỰ TOÁN TRỌN GÓI / NGƯỜI</div>
          <div class="col-total-val">~${(p.minTotal / 1000000).toFixed(2)} - ${(p.maxTotal / 1000000).toFixed(2)} Tr</div>
        </div>

        <div class="plan-col-items-list">
          <div class="plan-col-item">
            <span class="item-key">🚌 Xe Phương Trang:</span>
            <span class="item-val">~360k - 400k</span>
          </div>
          <div class="plan-col-item">
            <span class="item-key">🚢 Tàu Superdong:</span>
            <span class="item-val">~500k - 520k</span>
          </div>
          <div class="plan-col-item">
            <span class="item-key">🥣 Ăn sáng 3 ngày:</span>
            <span class="item-val">~120k - 150k</span>
          </div>
          <div class="plan-col-item">
            <span class="item-key">🏨 Nơi lưu trú (2 đêm):</span>
            <span class="item-val">${p.key === 'luxury' ? '~900k - 1.5Tr' : hotelCost.priceRange}</span>
          </div>
          <div class="plan-col-item">
            <span class="item-key">🦞 Ăn uống chính:</span>
            <span class="item-val">${p.key === 'luxury' ? '~950k - 1.25Tr' : '~700k - 950k'}</span>
          </div>
          <div class="plan-col-item">
            <span class="item-key">🛵 Vui chơi &amp; cano:</span>
            <span class="item-val">~400k - 550k</span>
          </div>
          <div class="plan-col-item">
            <span class="item-key">🦑 Tour câu mực đêm:</span>
            <span class="item-val">${p.key === 'luxury' ? '0đ' : p.key === 'adventure' ? '~200k - 250k' : (wantsSquid ? '~200k - 250k' : '0đ')}</span>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  costComparisonModalContent.innerHTML = html;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

