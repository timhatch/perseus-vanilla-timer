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

// NOTE
// epiphany browser (3.8.2) as used in raspbian stretch:
// - does not support es6 in the browser, so transpilation of this code is required
// - does not support toLocaleString

// Will return null if the browser does not support the WebAudio API
const AudioCTX  = window.AudioContext || window.webkitAudioContext

// Class::AudioSignal
// Generates and plays square wave tones for a given frequency and duration
//
class AudioSignal {
  // Create an audio object with a play method and two playable tones
  constructor(f) {
    this.audioCTX = new AudioCTX()
    this.tone     = this.createAudio(f)   
  }

  // Create an Audio Graph comprising a square wave oscillator and an amplifier
  // @f - a frequency in Hz for the generated tone
  createAudio(f) {
    const oscillator = this.audioCTX.createOscillator()
    const amplifier  = this.audioCTX.createGain()
    
    amplifier.gain.value = 0
    amplifier.connect(this.audioCTX.destination)

    oscillator.type            = "square"
    oscillator.frequency.value = f
    oscillator.connect(amplifier)
    oscillator.start()

    return amplifier 
  }

  // "Play" a specified signal by adjusting the amplifier gain
  // @duration  - the duration of the signal
  play(duration) {
    this.tone.gain.setValueAtTime(1, this.audioCTX.currentTime)
    this.tone.gain.setValueAtTime(0, this.audioCTX.currentTime + duration/1000)
  }
}

// Utility method to return the remaining time in the current period
const toString = (time) => {
    const m = Math.floor(time / 60)
    let   s = time % 60

    // return (m + ':' + s.toLocaleString('en-US', { minimumIntegerDigits: 2 }))
    // NOTE: Some browsers don't yet support toLocaleString, to format manually
    if (s < 10) s = '0' + s
    return `${m}:${s}`
}

// Class::TimerView
// A generic timer class 
class TimerView {
  
  constructor(options) {
    // If the WebAudio API is supported, create the required audio signals
    this.audio = AudioCTX ? [425, 600].map((f) => new AudioSignal(f)) : null

    // Instantiate the timer model.
    // Use the ServerDate library to synchronise time if it has been included
    const c = options.climbing   || 300         // (int) seconds
    const p = options.interval   || 15          // (int) seconds
    const n = (window.ServerDate || Date).now() // (int) milliseconds
    const h = performance.now()                 // (float) milliseconds
    this.model      = {rotation: c + p, remaining: c + p, preparation: p, start: n - h}

    // Scale the displayed text to the screen dimensions
    const viewportHeight     = document.documentElement.clientHeight
    this.el                  = document.getElementById('inner')
    this.el.style.lineHeight = (1.0 * viewportHeight)+'px'
    this.el.style.fontSize   = (0.7 * viewportHeight)+'px'
  }
  
  // Given a time in seconds, compare it with the stored time remaining on the clock and if
  // the two are different (a) update the displayed time and (b) if audio is supported play any
  // relevant audio signal
  // The point here is to allow the clock to iterate multiple times per second, but only refresh
  // the display when the number of seconds remaining changes
  run(timestamp) {
    if (Math.floor(timestamp) !== Math.floor(this.model.remaining)) {
      this.model.remaining = timestamp
      this.updateClock()
      this.audio && this.playSound()
    }
  }

  // Play audio signals (650ms for the rotation start/end and one minute warning, 325ms for the five
  // second countdown
  playSound() {
    const t = this.remainingTime()
    if (t === 0 || t === 60 || t === this.model.rotation) this.audio[1].play(650)
    if (t < 6 && t > 0) this.audio[0].play(325)
  }

  // Update the time display & play any relevant audible signal
  // this implementation assume that upDateClock is called only where time remaining
  // *in seconds* changes
  updateClock() {
    const t = this.remainingTime()

    this.el.textContent = toString(t)
  }

  // Utility method to return the remaining time in the current period
  remainingTime() {
    const t = this.model.remaining > this.model.preparation
                ? this.model.remaining - this.model.preparation 
                : this.model.remaining
    return Math.floor(t)
  }
}

// Class::TimerView::RotationTimer
// Sub-class timerview to run a simple rotating timer. Use requestAnimationFrame to run as close
// as possible to the screen refresh rate
class RotationTimer extends TimerView {
  // Constructor
  constructor(options) {
    super(options)
    // run the clock
    this.clock = this.run.bind(this)
    this.clock(null)
  }
  
  // Rotation countdown timer
  run(timestamp) {
    const now       = (this.model.start + timestamp) / 1000             // (float) seconds
    const remaining = this.model.rotation - (now % this.model.rotation) // (float) seconds

    super.run(remaining)
    
    requestAnimationFrame(this.clock)
  }
}

class CountdownTimer extends TimerView {
  // Constructor
  constructor(options) {
    super(options)
    // run the clock
    this.clock = this.run.bind(this)
    this.clock(null)
    // Handle es messages
    const es     = new EventSource('/timers/reset')
    es.onmessage = this.handleESMessage.bind(this)
  }

  // React to any Server Sent Event message fired by the server
  handleESMessage(eventsource) {
    const now      = parseFloat(eventsource.data)       // (float) milliseconds
    this.model.end = now + ((this.model.end - now) > 0 ? 0 : (this.model.rotation * 1000) + 899)
  }
  
  // Commanded countdown timer
  run(timestamp) {
    const now       = this.model.start + timestamp      // (float) milliseconds
    const diff      = (this.model.end - now) / 1000     // (float) seconds
    const remaining = diff > 0 ? diff : 0               // (float) seconds

    super.run(remaining)
    
    requestAnimationFrame(this.clock)
  }
}
