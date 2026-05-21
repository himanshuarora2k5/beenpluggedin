document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 2. Theme Switcher
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme');
      if (currentTheme === 'light') {
        htmlElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        htmlElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  // 3. Ambient Canvas Animation (Fluid Particles)
  const canvas = document.getElementById('ambient-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let mouse = { x: null, y: null };

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });
    
    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > width || this.x < 0) this.speedX *= -1;
        if (this.y > height || this.y < 0) this.speedY *= -1;
        
        if (mouse.x != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 150) {
            this.x -= dx * 0.01;
            this.y -= dy * 0.01;
          }
        }
      }
      draw() {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-glow').trim() || '#D4AF37';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const initParticles = () => {
      particles = [];
      let numParticles = (width * height) / 15000;
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
      }
    };
    initParticles();

    const connectParticles = () => {
      let maxDistance = 150;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < maxDistance) {
            let opacity = 1 - (distance / maxDistance);
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-glow').trim() || '#D4AF37';
            ctx.globalAlpha = opacity * 0.2;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      connectParticles();
      requestAnimationFrame(animate);
    };
    animate();
  }

  // 4. Reveal Animations Observer
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

  revealElements.forEach(el => revealObserver.observe(el));


  // 5. RT60 Acoustics Calculator (room-acoustics.html)
  const calcLength = document.getElementById('room-length');
  const calcWidth = document.getElementById('room-width');
  const calcHeight = document.getElementById('room-height');
  const calcMaterial = document.getElementById('wall-material');
  const rt60Output = document.getElementById('rt60-value');
  const rt60Status = document.getElementById('rt60-status');
  const rt60Meter = document.getElementById('rt60-meter-fill');
  const rt60Blueprint = document.getElementById('rt60-blueprint');

  if (calcLength && calcWidth && calcHeight && calcMaterial && rt60Output) {
    const coefficients = {
      'drywall': 0.05,
      'concrete': 0.02,
      'hardwood': 0.06,
      'carpet': 0.15,
      'glass': 0.03
    };

    const updateCalculator = () => {
      const l = parseFloat(calcLength.value) * 0.3048; // convert ft to meters
      const w = parseFloat(calcWidth.value) * 0.3048;
      const h = parseFloat(calcHeight.value) * 0.3048;
      
      const volume = l * w * h;
      
      // Approximate total surface area
      const floorArea = l * w;
      const ceilingArea = l * w;
      const wallArea = (2 * l * h) + (2 * w * h);
      const totalArea = floorArea + ceilingArea + wallArea;
      
      const materialCoeff = coefficients[calcMaterial.value];
      
      // Calculate total absorption (A)
      // Assuming floor is same as walls for simple estimation, or base it on material.
      // To keep it simple for the user, we'll apply the material coeff to the walls and ceiling, and assume a generic floor.
      const A = (wallArea * materialCoeff) + (ceilingArea * materialCoeff) + (floorArea * 0.1); 
      
      // Sabine's Formula: RT60 = 0.161 * (V / A)
      let rt60 = (0.161 * volume) / A;
      
      // Cap values for UI
      if (rt60 > 5) rt60 = 5.0;
      if (rt60 < 0.1) rt60 = 0.1;

      rt60Output.textContent = rt60.toFixed(2) + 's';
      
      // Update Meter (Max 3s for meter scale)
      let percentage = (rt60 / 3.0) * 100;
      if (percentage > 100) percentage = 100;
      rt60Meter.style.width = percentage + '%';
      
      // Status & Blueprint logic
      if (rt60 < 0.4) {
        rt60Status.textContent = "Excellent - Professional Studio Quality";
        rt60Status.style.color = "#4CAF50";
        rt60Meter.style.background = "#4CAF50";
        rt60Blueprint.innerHTML = "Your room is highly controlled. Focus on <strong>diffusion</strong> on the back wall rather than absorption to keep the room sounding natural.";
      } else if (rt60 < 0.8) {
        rt60Status.textContent = "Good - Standard Podcast Room";
        rt60Status.style.color = "var(--accent-glow)";
        rt60Meter.style.background = "var(--accent-glow)";
        rt60Blueprint.innerHTML = "A solid starting point. Add <strong>4 rigid fiberglass panels</strong> at first reflection points and <strong>2 bass traps</strong> in the front corners to tighten the low end.";
      } else {
        rt60Status.textContent = "Poor - High Flutter Echo Warning";
        rt60Status.style.color = "#F44336";
        rt60Meter.style.background = "#F44336";
        rt60Blueprint.innerHTML = "Significant echo detected. You need heavy absorption: <strong>8-10 fiberglass panels</strong> spread across walls and ceiling cloud, plus <strong>4 corner bass traps</strong>.";
      }

      // Update Slider display values
      document.getElementById('val-length').textContent = calcLength.value + ' ft';
      document.getElementById('val-width').textContent = calcWidth.value + ' ft';
      document.getElementById('val-height').textContent = calcHeight.value + ' ft';
    };

    calcLength.addEventListener('input', updateCalculator);
    calcWidth.addEventListener('input', updateCalculator);
    calcHeight.addEventListener('input', updateCalculator);
    calcMaterial.addEventListener('change', updateCalculator);
    
    updateCalculator();
  }


  // 6. Audio Troubleshooter / Doctor (mic-calibration.html)
  const symptomSelect = document.getElementById('trouble-symptom');
  const setupSelect = document.getElementById('trouble-setup');
  const doctorBtn = document.getElementById('run-doctor-btn');
  const doctorResults = document.getElementById('doctor-results');

  if (symptomSelect && setupSelect && doctorBtn && doctorResults) {
    doctorBtn.addEventListener('click', () => {
      doctorResults.style.display = 'block';
      doctorResults.innerHTML = '';
      
      const s = symptomSelect.value;
      const setup = setupSelect.value;
      
      let html = '<h3 style="color: var(--accent-glow); margin-bottom: 1.5rem;">Diagnostic Report</h3>';
      
      if (s === 'static') {
        html += `<p><strong>Diagnosis:</strong> Ground loop or high noise floor from preamp.</p>`;
        html += `<ul style="margin-left: 1.5rem; margin-bottom: 2rem;">`;
        if (setup === 'usb') {
          html += `<li>Lower your microphone's physical gain dial.</li><li>Ensure you are not plugged into a USB hub; plug directly into the motherboard.</li><li>Apply a Noise Gate in OBS or Discord.</li>`;
        } else {
          html += `<li>Check XLR cable for shielding issues.</li><li>Ensure your audio interface is not stacked on top of a power brick.</li><li>Engage the PAD switch if the signal is running too hot.</li>`;
        }
        html += `</ul>`;
      } else if (s === 'muffled') {
        html += `<p><strong>Diagnosis:</strong> Proximity effect mismanagement or poor off-axis frequency response.</p>`;
        html += `<ul style="margin-left: 1.5rem; margin-bottom: 2rem;">`;
        html += `<li>Ensure you are speaking into the <em>front</em> of the capsule, not the top (especially for Blue Yeti and AT2020).</li>`;
        html += `<li>Back away 2-3 inches to reduce muddy bass frequencies (proximity effect).</li>`;
        html += `<li>Apply a High-Pass Filter (HPF) at 80Hz in your EQ settings.</li>`;
        html += `</ul>`;
      } else if (s === 'echo') {
        html += `<p><strong>Diagnosis:</strong> Room reflections overpowering the direct signal.</p>`;
        html += `<ul style="margin-left: 1.5rem; margin-bottom: 2rem;">`;
        html += `<li>Move the microphone closer to your mouth (2-4 inches) and lower the gain. This increases the direct-to-reverberant sound ratio.</li>`;
        html += `<li>If using a condenser mic in an untreated room, consider switching to a dynamic microphone.</li>`;
        html += `<li>Place a thick blanket or acoustic panel directly behind your monitor (the first reflection point).</li>`;
        html += `</ul>`;
      }

      html += `
        <div class="glass-card" style="padding: 2rem; background: rgba(0,0,0,0.2);">
          <h4>Signal Chain Visualizer</h4>
          <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between; margin-top: 1rem; opacity: 0.8; flex-wrap: wrap;">
            <div style="text-align: center;"><i data-lucide="mic" style="color: ${s==='muffled'?'#F44336':'var(--text-primary)'};"></i><br><small>Capsule</small></div>
            <i data-lucide="arrow-right"></i>
            <div style="text-align: center;"><i data-lucide="box" style="color: ${s==='static' && setup==='xlr'?'#F44336':'var(--text-primary)'};"></i><br><small>Interface/ADC</small></div>
            <i data-lucide="arrow-right"></i>
            <div style="text-align: center;"><i data-lucide="laptop" style="color: ${s==='static' && setup==='usb'?'#F44336':'var(--text-primary)'};"></i><br><small>OS Driver</small></div>
            <i data-lucide="arrow-right"></i>
            <div style="text-align: center;"><i data-lucide="headphones" style="color: var(--text-primary);"></i><br><small>Output</small></div>
          </div>
        </div>
      `;

      doctorResults.innerHTML = html;
      lucide.createIcons();
    });
  }


  // 7. Gear Finder Logic (gear.html)
  const gearPersona = document.getElementById('gear-persona');
  const gearBudget = document.getElementById('gear-budget');
  const gearBtn = document.getElementById('find-gear-btn');
  const gearResults = document.getElementById('gear-results');

  if (gearBtn && gearResults) {
    gearBtn.addEventListener('click', () => {
      gearResults.style.display = 'block';
      const p = gearPersona.value;
      const b = gearBudget.value;
      
      let title = "Your Perfect Setup";
      let mic = "";
      let interfaceGear = "";
      let headphones = "";
      let why = "";

      if (b === 'budget') {
        if (p === 'streamer') {
          mic = "Samson Q2U (Dynamic USB/XLR)";
          interfaceGear = "None needed (USB)";
          headphones = "Audio-Technica ATH-M20x";
          why = "Dynamic mics reject background noise like mechanical keyboards perfectly. USB means no extra interface cost.";
        } else {
          mic = "Fifine K669B or Audio-Technica AT2020USB";
          interfaceGear = "None needed (USB)";
          headphones = "KZ ZSN Pro X In-Ear Monitors";
          why = "Incredible value for crisp, clear vocals on Zoom or online classes.";
        }
      } else if (b === 'mid') {
        mic = "Rode PodMic or Shure MV7";
        interfaceGear = "Focusrite Scarlett Solo 4th Gen";
        headphones = "Sony MDR-7506";
        why = "The industry standard mid-tier broadcast setup. The PodMic offers excellent off-axis rejection and a rich, professional tone.";
      } else {
        mic = "Shure SM7B or Electro-Voice RE20";
        interfaceGear = "Universal Audio Apollo Solo";
        headphones = "Sennheiser HD600 (Open Back)";
        why = "The ultimate high-end vocal chain. The Apollo provides zero-latency DSP processing for a broadcast-ready sound directly into OBS or your DAW.";
      }

      gearResults.innerHTML = `
        <div class="glass-card" style="margin-top: 2rem;">
          <h3 style="color: var(--accent-glow); margin-bottom: 2rem;">${title}</h3>
          <div class="grid grid-3">
            <div style="background: var(--input-bg); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--card-border);">
              <i data-lucide="mic" style="margin-bottom: 1rem; color: var(--accent-glow);"></i>
              <h4>Microphone</h4>
              <p style="color: var(--text-primary); font-weight: 500;">${mic}</p>
            </div>
            <div style="background: var(--input-bg); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--card-border);">
              <i data-lucide="box" style="margin-bottom: 1rem; color: var(--accent-glow);"></i>
              <h4>Interface</h4>
              <p style="color: var(--text-primary); font-weight: 500;">${interfaceGear}</p>
            </div>
            <div style="background: var(--input-bg); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--card-border);">
              <i data-lucide="headphones" style="margin-bottom: 1rem; color: var(--accent-glow);"></i>
              <h4>Monitoring</h4>
              <p style="color: var(--text-primary); font-weight: 500;">${headphones}</p>
            </div>
          </div>
          <div style="margin-top: 2rem; border-top: 1px solid var(--card-border); padding-top: 2rem;">
            <h4>Why this works for you:</h4>
            <p>${why}</p>
          </div>
        </div>
      `;
      lucide.createIcons();
    });
  }


  // 8. Productivity Lounge - Cadence Chatbot & Web Audio API
  const chatInput = document.getElementById('chat-input');
  const chatBtn = document.getElementById('chat-send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const playerDeck = document.getElementById('player-deck-container');

  if (chatBtn && chatInput && chatMessages && playerDeck) {
    const addMessage = (text, sender) => {
      const div = document.createElement('div');
      div.className = `message-bubble ${sender === 'user' ? 'message-user' : 'message-ai'}`;
      div.textContent = text;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleChat = () => {
      const text = chatInput.value.trim();
      if (!text) return;
      
      addMessage(text, 'user');
      chatInput.value = '';
      
      setTimeout(() => {
        let response = "Loading up the perfect soundscape for you...";
        let videoId = "5qap5aO4i9A"; // Lofi Girl fallback
        
        const lower = text.toLowerCase();
        if (lower.includes('synth') || lower.includes('cyber') || lower.includes('wave')) {
          response = "Initiating retro-futuristic synthwave protocols. Get in the zone.";
          videoId = "4xDzrIxZZAc"; // Synthwave
        } else if (lower.includes('focus') || lower.includes('study') || lower.includes('lofi')) {
          response = "Dialing in smooth lofi beats for deep focus.";
          videoId = "jfKfPfyJRdk"; // Lofi
        } else if (lower.includes('metal') || lower.includes('heavy') || lower.includes('gym')) {
          response = "High-energy tracks engaged. Let's go.";
          videoId = "K1rI4a92YtE"; // Metal/Rock instrumental
        } else if (lower.includes('jazz') || lower.includes('coffee') || lower.includes('rain')) {
          response = "Pouring a cup of dark roast jazz.";
          videoId = "FxQkI1GqI1o"; // Jazz
        }

        addMessage(response, 'ai');
        
        // Embed YouTube video
        playerDeck.innerHTML = `
          <div style="position: relative; padding-bottom: 56.25%; height: 0; width: 100%; overflow: hidden; border-radius: 16px; border: 1px solid var(--card-border);">
            <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0" 
                    title="YouTube video player" frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>
          </div>
        `;
      }, 600);
    };

    chatBtn.addEventListener('click', handleChat);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleChat();
    });


    // --- Web Audio API Synth Engine (Noise Mixer) ---
    let audioCtx;
    let brownNoiseNode, rainOsc, crackleOsc;
    let brownGain, rainGain, crackleGain;

    const initAudio = () => {
      if (audioCtx) return; // already initialized
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      // 1. Brown Noise Generator
      const bufferSize = 2 * audioCtx.sampleRate;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Compensate gain
      }
      brownNoiseNode = audioCtx.createBufferSource();
      brownNoiseNode.buffer = noiseBuffer;
      brownNoiseNode.loop = true;

      brownGain = audioCtx.createGain();
      brownGain.gain.value = 0; // Start silent
      brownNoiseNode.connect(brownGain);
      brownGain.connect(audioCtx.destination);
      brownNoiseNode.start();

      // We can create similar oscillators for Rain/Crackle if needed, but for now 
      // we'll link the sliders to just control the volume of our synthesized brown noise 
      // as a "Space Drone" or "Deep Focus" track.
    };

    const brownSlider = document.getElementById('mixer-brown');
    if (brownSlider) {
      brownSlider.addEventListener('input', (e) => {
        if (!audioCtx) initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const val = parseInt(e.target.value) / 100;
        if (brownGain) {
          // Use exponential curve for smoother volume feeling
          brownGain.gain.setTargetAtTime(val * val, audioCtx.currentTime, 0.1); 
        }
      });
    }

    // Pomodoro Timer Logic
    const pomoMins = document.getElementById('pomo-mins');
    const pomoSecs = document.getElementById('pomo-secs');
    const pomoStartBtn = document.getElementById('pomo-start-btn');
    let pomoInterval;
    let pomoTimeLeft = 25 * 60;
    let pomoRunning = false;

    if (pomoStartBtn && pomoMins) {
      pomoStartBtn.addEventListener('click', () => {
        if (pomoRunning) {
          clearInterval(pomoInterval);
          pomoStartBtn.textContent = 'Start';
          pomoRunning = false;
        } else {
          pomoRunning = true;
          pomoStartBtn.textContent = 'Pause';
          pomoInterval = setInterval(() => {
            pomoTimeLeft--;
            if (pomoTimeLeft <= 0) {
              clearInterval(pomoInterval);
              pomoRunning = false;
              pomoStartBtn.textContent = 'Done!';
            }
            let m = Math.floor(pomoTimeLeft / 60);
            let s = pomoTimeLeft % 60;
            pomoMins.textContent = m.toString().padStart(2, '0');
            pomoSecs.textContent = s.toString().padStart(2, '0');
          }, 1000);
        }
      });
    }
  }

});
