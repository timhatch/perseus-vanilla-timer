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

class TimerView {
  
  constructor(options) {
    // If webAudio is supported, instantiate audio signals
    this.supportsAudio = window.AudioContext || window.webkitAudioContext
    if (this.supportsAudio) {
      this.audioCTX = new this.supportsAudio()
      this.beep1    = this.createAudio(425)  // The 5 second warning 
      this.beep2    = this.createAudio(600)  // Commencement of rotation & 1 min warning
    }
    
    // Instantiate the timer model
    const time = options.seconds || 300
    this.model = { rotation: time, remaining: time }

    // Set the font and line heights
    const viewportHeight     = document.documentElement.clientHeight
    this.el                  = document.getElementById('inner')
    this.el.style.lineHeight = (1.0 * viewportHeight)+'px'
    this.el.style.fontSize   = (0.7 * viewportHeight)+'px'
  }

  // Create an Audio Graph comprising a square wave oscillator and an amplifier
  // @f - a frequency in Hz for the generated tone
  createAudio(f) {
    var oscillator = this.audioCTX.createOscillator()
    var amplifier  = this.audioCTX.createGain()
    
    amplifier.gain.value = 0
    amplifier.connect(this.audioCTX.destination)

    oscillator.type = "square"
    oscillator.frequency.value = f
    oscillator.connect(amplifier)
    oscillator.start()

    return amplifier 
  }

  // "Play" a sound by adjusting the amplifier gain
  play(tone, duration) {
    tone.gain.setValueAtTime(1, this.audioCTX.currentTime)
    tone.gain.setValueAtTime(0, this.audioCTX.currentTime + duration/1000)
  }

  // Play audio signals
  playSound() {
    var t = Math.floor(this.model.remaining)  // (int) seconds
    if (this.supportsAudio) {
      if (t === 0 || t === 60 || t === this.model.rotation) this.play(this.beep2, 666)
      if (t < 6 && t > 0) this.play(this.beep1, 333)
    }
  }

  // Update the time display & play any relevant audible signal
  // this implementation assume that upDateClock is called only where time remaining
  // *in seconds* changes
  updateClock() {
    var t = Math.floor(this.model.remaining)  // (int) seconds
    var m = Math.floor(t / 60)                // (int) minutes
    var s = t % 60
    if (s < 10) s = '0'+s
    this.el.textContent = m + ':' + s
    //this.el.textContent = m + ':' + s.toLocaleString('en-US', { minimumIntegerDigits: 2 })
  }
}

class RotationTimer extends TimerView {
  
  constructor(options) {
    super(options)
    // run the clock
    const hiResTime      = performance.now()      // (float) milliseconds
    this.model.startTime = Date.now() - hiResTime // (float) milliseconds
    this.clock           = this.run.bind(this)
    this.clock(hiResTime)
  }
  
  // Rotation countdown timer
  // TODO: Check seconds vs milliseconds
  run(timestamp) {
    const currentTime = (this.model.startTime + timestamp) / 1000                 // (float) seconds
    const remaining   = this.model.rotation - (currentTime % this.model.rotation) // (float) seconds
    
    if (Math.floor(remaining) !== Math.floor(this.model.remaining)) {
      this.model.remaining = remaining
      this.updateClock()
      this.playSound()
    }
    
    requestAnimationFrame(this.clock)
  }
}

class CountdownTimer extends TimerView {
  
  constructor(options) {
    super(options)
    
  }
  
  // Commanded countdown timer
  // TODO: Check seconds vs milliseconds
  run(timestamp) {
    const currentTime = this.model.startTime + timestamp
    const remaining   = (this.model.startTime + 1000 * this.model.rotation) 
      - (this.model.startTime + timestamp)
      
    if (Math.floor(remaining) !== Math.floor(this.model.remaining)) {
      this.model.remaining = remaining
      this.updateClock()
    }
    
    requestAnimationFrame(this.run)
  }
}
