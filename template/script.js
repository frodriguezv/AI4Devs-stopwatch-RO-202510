// State management
const state = {
  mode: 'stopwatch', // 'stopwatch' | 'countdown'
  running: false,
  startTimestamp: null,
  elapsed: 0, // milliseconds
  targetMs: 0, // for countdown
  animationFrame: null,
  lastRenderTime: null,
  // Preserve state when switching modes
  stopwatchState: { elapsed: 0, running: false, startTimestamp: null },
  countdownState: { elapsed: 0, targetMs: 0, running: false, startTimestamp: null, input: '' }
};

// Time utilities
const timeUtils = {
  formatTime(ms) {
    const totalMs = Math.abs(ms);
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = totalMs % 1000;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  },
  
  parseInputToMs(input) {
    // Input format: HHMMSS (e.g., "12530" = 1:25:30)
    const padded = input.padStart(6, '0');
    const hours = parseInt(padded.slice(0, 2), 10);
    const minutes = parseInt(padded.slice(2, 4), 10);
    const seconds = parseInt(padded.slice(4, 6), 10);
    return (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
  },
  
  formatInput(input) {
    // Format input as HH:MM:SS for display
    const padded = input.padStart(6, '0');
    const hours = padded.slice(0, 2);
    const minutes = padded.slice(2, 4);
    const seconds = padded.slice(4, 6);
    return `${hours}:${minutes}:${seconds}`;
  }
};

// Audio utilities (optional beep)
const audio = {
  audioContext: null,
  
  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  },
  
  beep() {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }
};

// Rendering
const render = {
  updateDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;
    
    if (state.mode === 'stopwatch') {
      display.textContent = timeUtils.formatTime(state.elapsed);
    } else {
      // Countdown: show remaining time
      const remaining = Math.max(0, state.targetMs - state.elapsed);
      display.textContent = timeUtils.formatTime(remaining);
      
      // Flash effect when reaching zero
      if (remaining === 0 && state.running) {
        display.classList.add('flash');
      } else {
        display.classList.remove('flash');
      }
    }
  },
  
  updateButtons() {
    // Stopwatch controls
    const startStopwatchBtn = document.getElementById('btn-start-stopwatch');
    if (startStopwatchBtn) {
      if (state.mode === 'stopwatch' && state.running) {
        startStopwatchBtn.textContent = 'Pause';
        startStopwatchBtn.setAttribute('aria-label', 'Pause stopwatch');
      } else {
        startStopwatchBtn.textContent = state.elapsed > 0 ? 'Resume' : 'Start';
        startStopwatchBtn.setAttribute('aria-label', state.elapsed > 0 ? 'Resume stopwatch' : 'Start stopwatch');
      }
    }
    
    // Countdown controls
    const startCountdownBtn = document.getElementById('btn-start-countdown');
    if (startCountdownBtn) {
      if (state.mode === 'countdown') {
        startCountdownBtn.disabled = state.targetMs === 0;
        if (state.running) {
          startCountdownBtn.textContent = 'Pause';
          startCountdownBtn.setAttribute('aria-label', 'Pause countdown');
        } else {
          startCountdownBtn.textContent = state.elapsed > 0 ? 'Resume' : 'Start';
          startCountdownBtn.setAttribute('aria-label', state.elapsed > 0 ? 'Resume countdown' : 'Start countdown');
        }
      }
    }
  },
  
  updateInputDisplay() {
    const display = document.getElementById('timer-display');
    if (state.mode === 'countdown' && !state.running && state.countdownState.input) {
      const formatted = timeUtils.formatInput(state.countdownState.input);
      display.textContent = formatted;
    }
  }
};

// Animation loop for accurate timing
function animate(currentTime) {
  if (!state.running) {
    state.lastRenderTime = null;
    return;
  }
  
  if (state.lastRenderTime === null) {
    state.lastRenderTime = currentTime;
    state.animationFrame = requestAnimationFrame(animate);
    return;
  }
  
  const delta = currentTime - state.lastRenderTime;
  state.lastRenderTime = currentTime;
  
  if (state.mode === 'stopwatch') {
    state.elapsed += delta;
  } else {
    // Countdown
    state.elapsed += delta;
    if (state.elapsed >= state.targetMs) {
      state.elapsed = state.targetMs;
      stopTimer();
      if (state.targetMs > 0) {
        audio.beep();
        render.updateDisplay();
      }
      return;
    }
  }
  
  render.updateDisplay();
  state.animationFrame = requestAnimationFrame(animate);
}

// Timer control functions
function startTimer() {
  if (state.running) return;
  
  state.running = true;
  const now = performance.now();
  
  if (state.mode === 'stopwatch') {
    state.startTimestamp = now - state.elapsed;
    state.stopwatchState.running = true;
    state.stopwatchState.startTimestamp = state.startTimestamp;
  } else {
    state.startTimestamp = now - state.elapsed;
    state.countdownState.running = true;
    state.countdownState.startTimestamp = state.startTimestamp;
  }
  
  state.lastRenderTime = null;
  state.animationFrame = requestAnimationFrame(animate);
  render.updateButtons();
}

function pauseTimer() {
  if (!state.running) return;
  
  state.running = false;
  
  if (state.animationFrame) {
    cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
  }
  
  if (state.mode === 'stopwatch') {
    state.stopwatchState.running = false;
    state.stopwatchState.elapsed = state.elapsed;
  } else {
    state.countdownState.running = false;
    state.countdownState.elapsed = state.elapsed;
  }
  
  render.updateButtons();
}

function stopTimer() {
  state.running = false;
  
  if (state.animationFrame) {
    cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
  }
  
  state.startTimestamp = null;
  state.lastRenderTime = null;
  render.updateButtons();
}

function clearStopwatch() {
  stopTimer();
  state.elapsed = 0;
  state.stopwatchState.elapsed = 0;
  state.stopwatchState.running = false;
  state.stopwatchState.startTimestamp = null;
  render.updateDisplay();
  render.updateButtons();
}

function clearCountdown() {
  stopTimer();
  state.elapsed = 0;
  state.targetMs = 0;
  state.countdownState.elapsed = 0;
  state.countdownState.targetMs = 0;
  state.countdownState.running = false;
  state.countdownState.startTimestamp = null;
  state.countdownState.input = '';
  render.updateDisplay();
  render.updateButtons();
  render.updateInputDisplay();
}

function setCountdown() {
  if (state.countdownState.input === '') return;
  
  const ms = timeUtils.parseInputToMs(state.countdownState.input);
  if (ms === 0) return;
  
  state.targetMs = ms;
  state.elapsed = 0;
  state.countdownState.targetMs = ms;
  state.countdownState.elapsed = 0;
  
  render.updateDisplay();
  render.updateButtons();
  
  // Update display to show formatted time
  const display = document.getElementById('timer-display');
  if (display) {
    display.textContent = timeUtils.formatTime(ms);
  }
}

// Controls handlers
const controls = {
  init() {
    // Mode selector
    const modeStopwatch = document.getElementById('mode-stopwatch');
    const modeCountdown = document.getElementById('mode-countdown');
    
    modeStopwatch?.addEventListener('click', () => switchMode('stopwatch'));
    modeCountdown?.addEventListener('click', () => switchMode('countdown'));
    
    // Stopwatch controls
    const btnStartStopwatch = document.getElementById('btn-start-stopwatch');
    const btnClearStopwatch = document.getElementById('btn-clear-stopwatch');
    
    btnStartStopwatch?.addEventListener('click', () => {
      if (state.running) {
        pauseTimer();
      } else {
        startTimer();
      }
    });
    
    btnClearStopwatch?.addEventListener('click', clearStopwatch);
    
    // Countdown controls
    const btnStartCountdown = document.getElementById('btn-start-countdown');
    const btnSetCountdown = document.getElementById('btn-set-countdown');
    const btnClearCountdown = document.getElementById('btn-clear-countdown');
    
    btnStartCountdown?.addEventListener('click', () => {
      if (state.running) {
        pauseTimer();
      } else {
        startTimer();
      }
    });
    
    btnSetCountdown?.addEventListener('click', setCountdown);
    btnClearCountdown?.addEventListener('click', clearCountdown);
    
    // Keypad
    const keypad = document.getElementById('countdown-keypad');
    keypad?.addEventListener('click', (e) => {
      if (e.target.classList.contains('keypad-btn')) {
        const digit = e.target.getAttribute('data-digit');
        if (digit !== null && state.countdownState.input.length < 6) {
          state.countdownState.input += digit;
          render.updateInputDisplay();
        }
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (state.mode === 'stopwatch') {
          const btn = document.getElementById('btn-start-stopwatch');
          btn?.click();
        } else {
          if (state.running) {
            pauseTimer();
          } else {
            const btn = document.getElementById('btn-start-countdown');
            if (btn && !btn.disabled) {
              btn.click();
            }
          }
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        if (state.running) {
          pauseTimer();
        } else {
          startTimer();
        }
      } else if (e.key === 'Backspace' && state.mode === 'countdown' && !state.running) {
        e.preventDefault();
        if (state.countdownState.input.length > 0) {
          state.countdownState.input = state.countdownState.input.slice(0, -1);
          render.updateInputDisplay();
        }
      } else if (e.key >= '0' && e.key <= '9' && state.mode === 'countdown' && !state.running) {
        if (state.countdownState.input.length < 6) {
          state.countdownState.input += e.key;
          render.updateInputDisplay();
        }
      }
    });
    
    // Handle window blur/focus for accurate timing
    window.addEventListener('blur', () => {
      // Pause is not ideal, but we'll handle it in the animation loop
    });
    
    window.addEventListener('focus', () => {
      if (state.running && state.startTimestamp) {
        // Recalculate elapsed based on actual time passed
        const now = performance.now();
        const actualElapsed = now - state.startTimestamp;
        
        if (state.mode === 'stopwatch') {
          state.elapsed = actualElapsed;
        } else {
          state.elapsed = actualElapsed;
          if (state.elapsed >= state.targetMs) {
            state.elapsed = state.targetMs;
            stopTimer();
            audio.beep();
          }
        }
        
        state.lastRenderTime = null;
        if (state.animationFrame) {
          cancelAnimationFrame(state.animationFrame);
        }
        state.animationFrame = requestAnimationFrame(animate);
      }
    });
  }
};

// Mode switching
function switchMode(newMode) {
  if (state.mode === newMode) return;
  
  // Stop current timer
  stopTimer();
  
  // Save current state
  if (state.mode === 'stopwatch') {
    state.stopwatchState.elapsed = state.elapsed;
    state.stopwatchState.running = false;
    state.stopwatchState.startTimestamp = null;
  } else {
    state.countdownState.elapsed = state.elapsed;
    state.countdownState.running = false;
    state.countdownState.startTimestamp = null;
  }
  
  // Switch mode
  state.mode = newMode;
  
  // Restore state for new mode
  if (newMode === 'stopwatch') {
    state.elapsed = state.stopwatchState.elapsed;
    state.targetMs = 0;
  } else {
    state.elapsed = state.countdownState.elapsed;
    state.targetMs = state.countdownState.targetMs;
  }
  
  // Update UI
  const modeStopwatch = document.getElementById('mode-stopwatch');
  const modeCountdown = document.getElementById('mode-countdown');
  const stopwatchPanel = document.getElementById('stopwatch-panel');
  const countdownPanel = document.getElementById('countdown-panel');
  
  if (newMode === 'stopwatch') {
    modeStopwatch?.setAttribute('aria-selected', 'true');
    modeCountdown?.setAttribute('aria-selected', 'false');
    stopwatchPanel?.classList.add('active');
    stopwatchPanel?.removeAttribute('hidden');
    countdownPanel?.classList.remove('active');
    countdownPanel?.setAttribute('hidden', '');
  } else {
    modeStopwatch?.setAttribute('aria-selected', 'false');
    modeCountdown?.setAttribute('aria-selected', 'true');
    stopwatchPanel?.classList.remove('active');
    stopwatchPanel?.setAttribute('hidden', '');
    countdownPanel?.classList.add('active');
    countdownPanel?.removeAttribute('hidden');
  }
  
  render.updateDisplay();
  render.updateButtons();
  render.updateInputDisplay();
}

// Initialization
function init() {
  audio.init();
  controls.init();
  render.updateDisplay();
  render.updateButtons();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
