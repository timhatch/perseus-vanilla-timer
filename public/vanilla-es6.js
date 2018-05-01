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

class AudioSignal {
  // Create an audio object with a play method and two playable tones
  constructor(audioContext) {
    this.audioCTX = new audioContext()
    this.beep1    = this.createAudio(425)  // The 5 second warning 
    this.beep2    = this.createAudio(600)  // Commencement of rotation & 1 min warning
  }

  // Create an Audio Graph comprising a square wave oscillator and an amplifier
  // @f - a frequency in Hz for the generated tone
  createAudio(f) {
    const oscillator = this.audioCTX.createOscillator()
    const amplifier  = this.audioCTX.createGain()
    
    amplifier.gain.value = 0
    amplifier.connect(this.audioCTX.destination)

    oscillator.type = "square"
    oscillator.frequency.value = f
    oscillator.connect(amplifier)
    oscillator.start()

    return amplifier 
  }

  // "Play" a specified signal by adjusting the amplifier gain
  // @tone      - the signal to play
  // @duration  - the duration of the signal
  play(tone, duration) {
    tone.gain.setValueAtTime(1, this.audioCTX.currentTime)
    tone.gain.setValueAtTime(0, this.audioCTX.currentTime + duration/1000)
  }
}

class TimerView {
  
  constructor(options) {
    // If webAudio is supported, create the required audio signals
    const audioContext = window.AudioContext || window.webkitAudioContext
    this.audio = audioContext ? new AudioSignal(audioContext) : null 
    
    // Instantiate the timer model
    const time      = options.seconds || 300  // (int) seconds
    const hiResTime = performance.now()       // (float) milliseconds
    this.model      = { rotation: time, remaining: time, startTime: Date.now() - hiResTime }

    // Set the font and line heights
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

  // Play audio signals
  playSound() {
    const a = this.audio
    const t = Math.floor(this.model.remaining)  // (int) seconds
    if (t === 0 || t === 60 || t === this.model.rotation) a.play(a.beep2, 666)
    if (t < 6 && t > 0) a.play(a.beep1, 333)
  }

  // Update the time display & play any relevant audible signal
  // this implementation assume that upDateClock is called only where time remaining
  // *in seconds* changes
  updateClock() {
    const t = Math.floor(this.model.remaining)  // (int) seconds
    const m = Math.floor(t / 60)                // (int) minutes
    let   s = t % 60

    if (s < 10) s = '0' + s
    this.el.textContent = m + ':' + s
    //this.el.textContent = m + ':' + s.toLocaleString('en-US', { minimumIntegerDigits: 2 })
  }
}

class RotationTimer extends TimerView {
  
  constructor(options) {
    super(options)
    // run the clock
    this.clock = this.run.bind(this)
    this.clock(null)
  }
  
  // Rotation countdown timer
  run(timestamp) {
    const now       = (this.model.startTime + timestamp) / 1000         // (float) seconds
    const remaining = this.model.rotation - (now % this.model.rotation) // (float) seconds

    super.run(remaining)
    
    requestAnimationFrame(this.clock)
  }
}

class CountdownTimer extends TimerView {
  
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
    const now      = parseFloat(eventsource.data)     // (float) milliseconds
    this.model.end = now + ((this.model.end - now) > 0 ? 0 : (this.model.rotation * 1000) + 899)
  }
  
  // Commanded countdown timer
  run(timestamp) {
    const now       = this.model.startTime + timestamp  // (float) milliseconds
    const diff      = (this.model.end - now) / 1000     // (float) seconds
    const remaining = diff > 0 ? diff : 0               // (float) seconds

    super.run(remaining)
    
    requestAnimationFrame(this.clock)
  }
}
