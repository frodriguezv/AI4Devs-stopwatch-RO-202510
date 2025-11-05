// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
  mode: 'stopwatch', // 'stopwatch' or 'countdown'
  running: false,
  
  // Stopwatch state
  stopwatch: {
    startTimestamp: null,
    elapsed: 0, // in milliseconds
    pausedElapsed: 0
  },
  
  // Countdown state
  countdown: {
    targetMs: 0, // target time in milliseconds
    remaining: 0, // remaining time in milliseconds
    inputDigits: [], // array of digits entered via keypad
    isSet: false
  },
  
  // Animation frame
  animationFrameId: null
};

// ============================================
// TIME UTILITIES
// ============================================
const timeUtils = {
  // Format milliseconds to HH:MM:SS.mmm
  formatTime(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(ms % 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  },
  
  // Format seconds to HH:MM:SS (for countdown input display)
  formatInputTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },
  
  // Convert digit array to seconds (HHMMSS format)
  digitsToSeconds(digits) {
    if (digits.length === 0) return 0;
    
    // Take last 6 digits for HHMMSS
    const relevantDigits = digits.slice(-6);
    let seconds = 0;
    
    if (relevantDigits.length >= 2) {
      seconds += parseInt(relevantDigits[relevantDigits.length - 2] + relevantDigits[relevantDigits.length - 1], 10);
    }
    if (relevantDigits.length >= 4) {
      seconds += parseInt(relevantDigits[relevantDigits.length - 4] + relevantDigits[relevantDigits.length - 3], 10) * 60;
    }
    if (relevantDigits.length >= 6) {
      seconds += parseInt(relevantDigits[relevantDigits.length - 6] + relevantDigits[relevantDigits.length - 5], 10) * 3600;
    }
    
    return seconds;
  }
};

// ============================================
// RENDERING
// ============================================
const render = {
  // Update timer display
  updateTimer() {
    const timerDisplay = document.getElementById('timer-display');
    let displayMs = 0;
    
    if (state.mode === 'stopwatch') {
      if (state.running) {
        const now = performance.now();
        displayMs = state.stopwatch.elapsed + (now - state.stopwatch.startTimestamp);
      } else {
        displayMs = state.stopwatch.elapsed;
      }
    } else {
      // countdown
      if (state.running) {
        const now = performance.now();
        const elapsed = now - state.countdown.startTimestamp;
        displayMs = Math.max(0, state.countdown.remaining - elapsed);
        
        // Check if countdown reached zero
        if (displayMs <= 0 && state.countdown.remaining > 0) {
          this.handleCountdownComplete();
          return; // Exit early, handleCountdownComplete will update display
        }
      } else {
        displayMs = state.countdown.remaining;
      }
    }
    
    timerDisplay.textContent = timeUtils.formatTime(displayMs);
  },
  
  // Update countdown input display
  updateCountdownInput() {
    const inputDisplay = document.getElementById('countdown-input-display');
    const seconds = timeUtils.digitsToSeconds(state.countdown.inputDigits);
    inputDisplay.textContent = timeUtils.formatInputTime(seconds);
  },
  
  // Update button states
  updateButtons() {
    // Stopwatch buttons
    const stopwatchStart = document.getElementById('stopwatch-start');
    if (state.mode === 'stopwatch') {
      stopwatchStart.textContent = state.running ? 'Pause' : 'Resume';
      stopwatchStart.disabled = false;
    } else {
      stopwatchStart.disabled = true;
    }
    
    // Countdown buttons
    const countdownStart = document.getElementById('countdown-start');
    const countdownSet = document.getElementById('countdown-set');
    
    if (state.mode === 'countdown') {
      countdownStart.disabled = !state.countdown.isSet || state.running;
      countdownSet.disabled = state.running || state.countdown.inputDigits.length === 0;
      countdownStart.textContent = state.running ? 'Pause' : 'Start';
    } else {
      countdownStart.disabled = true;
      countdownSet.disabled = true;
    }
  },
  
  // Animation loop
  animate() {
    this.updateTimer();
    state.animationFrameId = requestAnimationFrame(() => this.animate());
  },
  
  // Handle countdown completion
  handleCountdownComplete() {
    if (state.running && state.countdown.remaining > 0) {
      state.countdown.remaining = 0;
      controls.stop();
      audio.playBeep();
      this.flashDisplay();
      this.updateTimer(); // Update display to show 00:00:00.000
    }
  },
  
  // Flash display when countdown completes
  flashDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    timerDisplay.classList.add('flash');
    setTimeout(() => {
      timerDisplay.classList.remove('flash');
    }, 1000);
  }
};

// ============================================
// CONTROLS
// ============================================
const controls = {
  // Switch mode
  switchMode(newMode) {
    // Stop current timer if running
    if (state.running) {
      this.stop();
    }
    
    state.mode = newMode;
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === newMode);
      btn.setAttribute('aria-selected', btn.dataset.mode === newMode);
    });
    
    const stopwatchPanel = document.getElementById('stopwatch-panel');
    const countdownPanel = document.getElementById('countdown-panel');
    
    if (newMode === 'stopwatch') {
      stopwatchPanel.hidden = false;
      countdownPanel.hidden = true;
    } else {
      stopwatchPanel.hidden = true;
      countdownPanel.hidden = false;
    }
    
    render.updateButtons();
    render.updateTimer();
  },
  
  // Start stopwatch
  startStopwatch() {
    if (state.running) {
      // Pause
      const now = performance.now();
      state.stopwatch.elapsed += now - state.stopwatch.startTimestamp;
      state.stopwatch.pausedElapsed = state.stopwatch.elapsed;
      state.running = false;
      
      if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
      }
    } else {
      // Start or resume
      state.stopwatch.startTimestamp = performance.now();
      state.running = true;
      
      if (!state.animationFrameId) {
        render.animate();
      }
    }
    
    render.updateButtons();
  },
  
  // Clear stopwatch
  clearStopwatch() {
    state.running = false;
    state.stopwatch.elapsed = 0;
    state.stopwatch.pausedElapsed = 0;
    state.stopwatch.startTimestamp = null;
    
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
    
    render.updateTimer();
    render.updateButtons();
  },
  
  // Add digit to countdown input
  addCountdownDigit(digit) {
    if (state.running) return;
    
    state.countdown.inputDigits.push(digit);
    if (state.countdown.inputDigits.length > 6) {
      state.countdown.inputDigits.shift();
    }
    
    render.updateCountdownInput();
    render.updateButtons();
  },
  
  // Remove last digit from countdown input
  removeCountdownDigit() {
    if (state.running) return;
    
    state.countdown.inputDigits.pop();
    render.updateCountdownInput();
    render.updateButtons();
  },
  
  // Set countdown time
  setCountdown() {
    if (state.running || state.countdown.inputDigits.length === 0) return;
    
    const seconds = timeUtils.digitsToSeconds(state.countdown.inputDigits);
    state.countdown.targetMs = seconds * 1000;
    state.countdown.remaining = state.countdown.targetMs;
    state.countdown.isSet = true;
    
    render.updateTimer();
    render.updateButtons();
  },
  
  // Start countdown
  startCountdown() {
    if (!state.countdown.isSet) return;
    
    if (state.running) {
      // Pause
      const now = performance.now();
      state.countdown.remaining -= (now - state.countdown.startTimestamp);
      if (state.countdown.remaining < 0) state.countdown.remaining = 0;
      state.running = false;
      
      if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
      }
    } else {
      // Start
      state.countdown.startTimestamp = performance.now();
      state.running = true;
      
      if (!state.animationFrameId) {
        render.animate();
      }
    }
    
    render.updateButtons();
  },
  
  // Clear countdown
  clearCountdown() {
    state.running = false;
    state.countdown.targetMs = 0;
    state.countdown.remaining = 0;
    state.countdown.inputDigits = [];
    state.countdown.isSet = false;
    state.countdown.startTimestamp = null;
    
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
    
    render.updateTimer();
    render.updateCountdownInput();
    render.updateButtons();
  },
  
  // Stop (generic, used when switching modes)
  stop() {
    if (state.mode === 'stopwatch') {
      if (state.running) {
        const now = performance.now();
        state.stopwatch.elapsed += now - state.stopwatch.startTimestamp;
        state.stopwatch.pausedElapsed = state.stopwatch.elapsed;
      }
    } else {
      if (state.running) {
        const now = performance.now();
        state.countdown.remaining -= (now - state.countdown.startTimestamp);
        if (state.countdown.remaining < 0) state.countdown.remaining = 0;
      }
    }
    
    state.running = false;
    
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
    
    render.updateButtons();
  }
};

// ============================================
// AUDIO
// ============================================
const audio = {
  // Play beep sound when countdown completes
  playBeep() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      // Audio not supported, silently fail
    }
  }
};

// ============================================
// INITIALIZATION
// ============================================
const init = {
  setupEventListeners() {
    // Mode selector
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        controls.switchMode(btn.dataset.mode);
      });
    });
    
    // Stopwatch controls
    document.getElementById('stopwatch-start').addEventListener('click', () => {
      controls.startStopwatch();
    });
    
    document.getElementById('stopwatch-clear').addEventListener('click', () => {
      controls.clearStopwatch();
    });
    
    // Countdown keypad
    document.querySelectorAll('.keypad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        controls.addCountdownDigit(btn.dataset.digit);
      });
    });
    
    // Countdown controls
    document.getElementById('countdown-set').addEventListener('click', () => {
      controls.setCountdown();
    });
    
    document.getElementById('countdown-start').addEventListener('click', () => {
      controls.startCountdown();
    });
    
    document.getElementById('countdown-clear').addEventListener('click', () => {
      controls.clearCountdown();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Enter = start/pause
      if (e.key === 'Enter') {
        e.preventDefault();
        if (state.mode === 'stopwatch') {
          controls.startStopwatch();
        } else if (state.countdown.isSet) {
          controls.startCountdown();
        }
      }
      
      // Space = pause/resume (stopwatch) or start/pause (countdown)
      if (e.key === ' ') {
        e.preventDefault();
        if (state.mode === 'stopwatch') {
          controls.startStopwatch();
        } else if (state.countdown.isSet) {
          controls.startCountdown();
        }
      }
      
      // Backspace = delete last digit (countdown mode only)
      if (e.key === 'Backspace' && state.mode === 'countdown') {
        e.preventDefault();
        controls.removeCountdownDigit();
      }
      
      // Number keys (0-9) = add digit (countdown mode only)
      if (state.mode === 'countdown' && /^[0-9]$/.test(e.key)) {
        e.preventDefault();
        controls.addCountdownDigit(e.key);
      }
    });
    
    // Handle window blur/focus for timing accuracy
    window.addEventListener('blur', () => {
      // When tab goes to background, update elapsed time immediately
      if (state.running) {
        if (state.mode === 'stopwatch') {
          const now = performance.now();
          state.stopwatch.elapsed += now - state.stopwatch.startTimestamp;
          state.stopwatch.startTimestamp = now;
        } else {
          const now = performance.now();
          state.countdown.remaining -= (now - state.countdown.startTimestamp);
          if (state.countdown.remaining < 0) state.countdown.remaining = 0;
          state.countdown.startTimestamp = now;
        }
      }
    });
  },
  
  init() {
    this.setupEventListeners();
    render.updateTimer();
    render.updateButtons();
    render.updateCountdownInput();
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init.init());
} else {
  init.init();
}
