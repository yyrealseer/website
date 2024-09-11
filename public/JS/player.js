{
    class AudioPlayer extends HTMLElement {
        playing = false;
        currentTime = 0;
        duration = 0;
        volume = 2;
        initialized = false;
        title = 'untitled';
        img = 'BEAT/img/LOGO_Black.png'

        constructor() {
            super();

            this.attachShadow({ mode: 'open' });
            this.render();
        }

        static get observedAttributes() {
            return ['src', 'title', 'crossorigin', 'loop', 'preload'];
        }

        async attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'src') {
                if (this.playing) {
                    await this.togglePlay();
                }

                this.initialized = false;
                this.render();
            } else if (name === 'title') {
                this.title = newValue;

                if (this.titleElement) {
                    this.titleElement.textContent = this.title;
                }
            }

            for (let i = 0; i < this.attributes.length; i++) {
                const attr = this.attributes[i];

                if (attr.value && attr.name !== 'title') {
                    this.audio.setAttribute(attr.name, attr.value);
                }
            }

            if (!this.initialized) {
                this.initializeAudio();
            }
        }

        initializeAudio() {
            if (this.initialized) return;

            this.initialized = true;

            this.audioCtx = new AudioContext();

            this.track = this.audioCtx.createMediaElementSource(this.audio);
            this.gainNode = this.audioCtx.createGain();
            this.analyzerNode = this.audioCtx.createAnalyser();

            this.analyzerNode.fftSize = 2048;
            this.bufferLength = this.analyzerNode.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            this.analyzerNode.getByteFrequencyData(this.dataArray);


            this.track
                .connect(this.gainNode)
                .connect(this.analyzerNode)
                .connect(this.audioCtx.destination);

            this.attachEvents();
        }

        updateFrequency() {
            if (!this.playing) return;

            this.analyzerNode.getByteFrequencyData(this.dataArray);

            this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 0)';
            this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const barWidth = 3;
            const gap = 2;
            const barCount = this.bufferLength / ((barWidth + gap) - gap);
            let x = 0;

            for (let i = 0; i < barCount; i++) {
                const perc = (this.dataArray[i] * 100) / 255;
                const h = (perc * this.canvas.height) / 100;

                this.canvasCtx.fillStyle = 'rgba(207, 207, 207, 0.5)';
                this.canvasCtx.fillRect(x, this.canvas.height - h, barWidth, h);

                x += barWidth + gap;
            }

            requestAnimationFrame(this.updateFrequency.bind(this));
        }

        attachEvents() {
            this.playPauseBtn.addEventListener('click', this.togglePlay.bind(this), false);
            this.volumeBar.addEventListener('input', this.changeVolume.bind(this), false);
            this.progressBar.addEventListener('input', () => {
                this.seekTo(this.progressBar.value);
            }, false);

            this.audio.addEventListener('loadedmetadata', () => {
                this.duration = this.audio.duration;
                this.progressBar.max = this.duration;

                const secs = `${parseInt(`${this.duration % 60}`, 10)}`.padStart(2, '0');
                const mins = parseInt(`${(this.duration / 60) % 60}`, 10);

                this.durationEl.textContent = `${mins}:${secs}`;
            })

            this.audio.addEventListener('timeupdate', () => {
                this.updateAudioTime(this.audio.currentTime)
            })
            this.audio.addEventListener('ended', () => {
                this.playing = false;
                this.playPauseBtn.textContent = 'play'
            })

            this.audio.addEventListener('pause', () => {
                this.playing = false;
                this.playPauseBtn.textContent = 'play';
                this.playPauseBtn.classList.remove('playing');
            }, false);

            this.audio.addEventListener('play', () => {
                this.playing = true;
                this.playPauseBtn.textContent = 'pause';
                this.playPauseBtn.classList.add('playing');
                this.updateFrequency();
            }, false);

        }

        async togglePlay() {
            if (this.audioCtx.state === 'suspended') {
                await this.audioCtx.resume();
            }

            if (this.playing) {
                await this.audio.pause();
                this.playing = false;
                this.playPauseBtn.textContent = 'play';
            } else {
                await this.audio.play();
                this.playing = true;
                this.playPauseBtn.textContent = 'pause';
                this.updateFrequency();
            }
        }

        async thumbPlay() {
            await this.audio.play();
            this.playing = true;
            this.playPauseBtn.textContent = 'pause';
        }

        seekTo(value) {
            this.audio.currentTime = value;
        }

        updateAudioTime(time) {
            this.currentTime = time;
            this.progressBar.value = this.currentTime;

            const secs = `${parseInt(`${time % 60}`, 10)}`.padStart(2, '0');
            const mins = parseInt(`${(time / 60) % 60}`, 10);

            this.currentTimeEl.textContent = `${mins}:${secs}`;
        }

        changeVolume() {
            this.volume = this.volumeBar.value;
            this.gainNode.gain.value = this.volume;
        }

        changeAudio(src, title) {
            const audioPlayer = document.getElementById('AudioPlayer');

            var element = event.target; // 取得被按下的按鈕元素
            var computedStyle = window.getComputedStyle(element); // 取得按鈕的計算樣式
            var thumbnail = computedStyle['background-image']; // 取得按鈕的背景圖片
            var url = thumbnail.replace(/url\(["']?(.+?)["']?\)/, '$1');

            this.img = url; // 更新封面
            audioPlayer.setAttribute('src', src); // 更新 src 屬性
            audioPlayer.setAttribute('title', title); // 更新 title 屬性


            // 使用 setTimeout 來延遲 thumbPlay() 的執行
            setTimeout(() => {
                this.thumbPlay();
            }, 200); // 延遲 1000 毫秒（1秒）
        }


        style() {
            return `
        <style>
          :host {
            width: 98vw;
            padding: 12px 0;
            font-family: Arial, sans-serif !important;
            background-color: #f0f0f5;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            position: fixed;
            bottom: 10px;
            left: 50%;
            transform: translate(-50%, 0);
            height: 8%;
          }

          .audio-player {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            top: -15px;
            position: absolute;
            width: 95%;
        }

          .player-thumbnail {
            width: 50px;
            height: 50px;
            border-radius: 3px;
            box-shadow: 2px 1px 4px #555;
        }

          .audio-name {
            font-size: 14px;
            color: #333;
            max-width: 50px;
            margin: auto;
          }

          canvas {
            position: absolute;
            left: 50%;
            width: 80%;
            height: 80%;
            transform: translate(-50%, -50%);
            top: 50%;
          }

          .play-btn {
            width: 30px;
            min-width: 30px;
            height: 30px;
            background: url("./BEAT/img/audio-player-icon-sprite.png") 0 center/500% 100% no-repeat; /* 替換為您的播放圖標 */
            appearance: none;
            border: none;
            text-indent: -999999px;
            overflow: hidden;
              z-index: 2;
          }

          .play-btn.playing {
              background: url("./BEAT/img/audio-player-icon-sprite.png") 25% center/500% 100% no-repeat;/* 替換為您的暫停圖標 */
          }

          .progress-indicator {
              flex: 2;
              display: flex;
              align-items: center;
          }

          .progress-bar {
              width: 100%;
              -webkit-appearance: none;
              appearance: none;
              height: 5px;
              background-color: #ddd;
              border-radius: 3px;
              margin: 0 10px;
              z-index: 2;
          }

          .progress-bar::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 10px;
              height: 10px;
              background-color: #666;
              border-radius: 50%;
              cursor: pointer;
              position: relative;
              top: -3px;
          }

          .duration,
          .current-time {
              font-size: 12px;
              color: #666;
              margin: 0 5px;
          }

          .volume-bar {
              display: flex;
              align-items: center;
          }

          .volume-field {
              width: 70px;
              -webkit-appearance: none;
              appearance: none;
              height: 5px;
              background-color: #ddd;
              border-radius: 3px;
              cursor: pointer;
          }

          .volume-field::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 10px;
              height: 10px;
              background-color: #666;
              border-radius: 50%;
              cursor: pointer;
          }
          @media (max-width: 767px) {
              .audio-player {
                width: 85%;
              }

              canvas {
                  width: 50%;
                  height: 40%;
              }
          }
        </style>
          `
        }

        render() {
            this.shadowRoot.innerHTML = `
            
            ${this.style()}
            <figcaption class="audio-name">${this.title}</figcaption>
                <figure class="audio-player">
                <img src="${this.img}" class="player-thumbnail";">
                <audio style="display: none"></audio>
                <button class="play-btn" type="button">play</button>
                <canvas></canvas>
                <div class="progress-indicator">
                <span class="current-time">0:00</span>
                <input type="range" max="100" value="0" class="progress-bar">
                <span class="duration">0:00</span>
                </div>
                <div class="volume-bar">
                <input type="range" min="0" max="2" step="0.01" value="${this.volume}" class="volume-field">
                </div>
            </figure>
                `;


            this.audio = this.shadowRoot.querySelector('audio');
            this.canvas = this.shadowRoot.querySelector('canvas');
            this.playPauseBtn = this.shadowRoot.querySelector('.play-btn');
            this.thumbNail = document.querySelector('.thumbnail');
            this.titleElement = this.shadowRoot.querySelector('.audio-name');
            this.volumeBar = this.shadowRoot.querySelector('.volume-field');
            this.progressIndicator = this.shadowRoot.querySelector('.progress-indicator');
            this.currentTimeEl = this.progressIndicator.children[0];
            this.progressBar = this.progressIndicator.children[1];
            this.durationEl = this.progressIndicator.children[2];

            this.canvasCtx = this.canvas.getContext('2d');
        }
    }

    customElements.define('audio-player', AudioPlayer)
}