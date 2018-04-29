'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//  A javascript timer for WC-format bouldering competitions.
//  Uses WebAudio to generate a standardised audio signals without latency effects
//  Copyright 2012-18  T J Hatch
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

var TimerView = function () {
  function TimerView(options) {
    _classCallCheck(this, TimerView);

    // If webAudio is supported, instantiate audio signals
    this.supportsAudio = window.AudioContext || window.webkitAudioContext;
    if (this.supportsAudio) {
      this.audioCTX = new this.supportsAudio();
      this.beep1 = this.createAudio(425); // The 5 second warning 
      this.beep2 = this.createAudio(600); // Commencement of rotation & 1 min warning
    }

    // Instantiate the timer model
    var time = options.seconds || 300;
    this.model = { rotation: time, remaining: time

      // Set the font and line heights
    };var viewportHeight = document.documentElement.clientHeight;
    this.el = document.getElementById('inner');
    this.el.style.lineHeight = 1.0 * viewportHeight + 'px';
    this.el.style.fontSize = 0.7 * viewportHeight + 'px';
  }

  // Create an Audio Graph comprising a square wave oscillator and an amplifier
  // @f - a frequency in Hz for the generated tone


  _createClass(TimerView, [{
    key: 'createAudio',
    value: function createAudio(f) {
      var oscillator = this.audioCTX.createOscillator();
      var amplifier = this.audioCTX.createGain();

      amplifier.gain.value = 0;
      amplifier.connect(this.audioCTX.destination);

      oscillator.type = "square";
      oscillator.frequency.value = f;
      oscillator.connect(amplifier);
      oscillator.start();

      return amplifier;
    }

    // "Play" a sound by adjusting the amplifier gain

  }, {
    key: 'play',
    value: function play(tone, duration) {
      tone.gain.setValueAtTime(1, this.audioCTX.currentTime);
      tone.gain.setValueAtTime(0, this.audioCTX.currentTime + duration / 1000);
    }

    // Update the time display & play any relevant audible signal
    // this implementation assume that upDateClock is called only where time remaining
    // *in seconds* changes

  }, {
    key: 'updateClock',
    value: function updateClock() {
      var t = Math.floor(this.model.remaining); // (int) seconds
      var m = Math.floor(t / 60); // (int) minutes
      var s = t % 60;
      if (s < 10) s = '0' + s;
      this.el.textContent = m + ':' + s;
    }

    // Play audio signals

  }, {
    key: 'playSound',
    value: function playSound() {
      var t = Math.floor(this.model.remaining); // (int) seconds
      if (this.supportsAudio) {
        if (t === 0 || t === 60 || t === this.model.rotation) this.play(this.beep2, 666);
        if (t < 6 && t > 0) this.play(this.beep1, 333);
      }
    }
  }]);

  return TimerView;
}();

var RotationTimer = function (_TimerView) {
  _inherits(RotationTimer, _TimerView);

  function RotationTimer(options) {
    _classCallCheck(this, RotationTimer);

    // run the clock
    var _this = _possibleConstructorReturn(this, (RotationTimer.__proto__ || Object.getPrototypeOf(RotationTimer)).call(this, options));

    var hiResTime = performance.now(); // (float) milliseconds
    _this.model.startTime = Date.now() - hiResTime; // (float) milliseconds
    _this.clock = _this.run.bind(_this);
    _this.clock(hiResTime);
    return _this;
  }

  // Rotation countdown timer
  // TODO: Check seconds vs milliseconds


  _createClass(RotationTimer, [{
    key: 'run',
    value: function run(timestamp) {
      var currentTime = (this.model.startTime + timestamp) / 1000; // (float) seconds
      var remaining = this.model.rotation - currentTime % this.model.rotation; // (float) seconds

      if (Math.floor(remaining) !== Math.floor(this.model.remaining)) {
        this.model.remaining = remaining;
        this.updateClock();
        this.playSound();
      }

      requestAnimationFrame(this.clock);
    }
  }]);

  return RotationTimer;
}(TimerView);

var CountdownTimer = function (_TimerView2) {
  _inherits(CountdownTimer, _TimerView2);

  function CountdownTimer(options) {
    _classCallCheck(this, CountdownTimer);

    return _possibleConstructorReturn(this, (CountdownTimer.__proto__ || Object.getPrototypeOf(CountdownTimer)).call(this, options));
  }

  // Commanded countdown timer
  // TODO: Check seconds vs milliseconds


  _createClass(CountdownTimer, [{
    key: 'run',
    value: function run(timestamp) {
      var currentTime = this.model.startTime + timestamp;
      var remaining = this.model.startTime + 1000 * this.model.rotation - (this.model.startTime + timestamp);

      if (Math.floor(remaining) !== Math.floor(this.model.remaining)) {
        this.model.remaining = remaining;
        this.updateClock();
      }

      requestAnimationFrame(this.run);
    }
  }]);

  return CountdownTimer;
}(TimerView);
