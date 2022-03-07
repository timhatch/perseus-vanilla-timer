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

  // Play a specified signal by adjusting the amplifier gain
  // @duration  - the duration of the signal
  //
  // sig: (Integer duration) -> void
  play(duration) {
    this.tone.gain.setValueAtTime(1, this.audioCTX.currentTime)
    this.tone.gain.setValueAtTime(0, this.audioCTX.currentTime + duration/1000)
  }
}

// Utility method to return the remaining time in the current period as a string
// formatted as `m:ss`
//
// sig: (Double time) -> (String)
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
    const p = options.interval   || 0           // (int) seconds
    const n = (window.ServerDate || Date).now() // (int) milliseconds
    const h = performance.now()                 // (float) milliseconds
    this.model = {
      rotation: c + p,    // The full Rotation Period (s)
      remaining: c + p,   // The initial time remaining in the rotation period
      climbing: c,        // The Climbing Period (s)
      preparation: p,     // The Transition/Preparation Period (s) FOLLOWING the Climbing Period
      start: n - h        // The time at which we start the lock (last whole ms)
    }

    // Scale the displayed text to the screen dimensions
    const viewportHeight     = document.documentElement.clientHeight
    this.el                  = document.getElementById('inner')
    this.el.style.lineHeight = (1.0 * viewportHeight)+'px'
    this.el.style.fontSize   = (0.7 * viewportHeight)+'px'
  }
  
  // Given a fractional time in seconds, compare it with the stored time remaining on the clock and if
  // the two are different:
  // (a) update the displayed time and 
  // (b) if audio is supported play any relevant audio signal
  // 
  // The point of using Math.floor() here is that `run` can be called multiple times every second,
  // but the display will be repainted only once every second. This minimises CPU load.
  //
  // sig: (Double timestamp) -> void
  run(timestamp) {
    if (Math.floor(timestamp) !== Math.floor(this.model.remaining)) {
      this.model.remaining = timestamp
      this.setDisplayedTime()
      this.audio && this.playSound()
    }
  }

  // Play audio signals (650ms for the rotation start/end and one minute warning, 325ms for the five
  // second countdown
  //
  // sig: () -> void
  playSound() {
    const t = this.remainingTime()
    // PLay tone #2 when the countdown starts/ends and when 1 minute remains
    if (t === 0 || t === 60 || t === this.model.rotation) this.audio[1].play(650)
    // Play tone #1 as a 5 second countdown (5/4/2/3/1)
    if (t < 6 && t > 0) this.audio[0].play(325)
  }

  // Set (update) the time displayed on the screen
  //
  // If the remaining time in the Rotation Period > 0, display the time remaining in the
  // current period (i.e. the time remaining in either the Climbing Period or the
  // Preparation/Transition Period. 
  // If the remaining time in the Attepmt/Rotation period is 0, display the Climbing Period.
  // This gives a display sequence at the end of the climbing period as follows:
  // 0:03
  // 0:02
  // 0:01
  // 4:00
  // 3:59
  //
  // sig () -> void
  setDisplayedTime() {
    const t = Math.floor(this.model.remaining) ? this.remainingTime() : this.model.climbing

    this.el.textContent = toString(t)
  }

  // Calculate the time left in the current period, i.e. either
  // (a) the time remaining in the Climbing Period; or
  // (b) the time remaining in the Preparation/Transition Period
  // 
  // The assumption here is that if the remaining time is greater than the duration of the
  // Preparation/Transition Period, then we must be in the Climbing Period. In which case we
  // display `remaining - preparation` (rounded down to the nearest second)
  // Conversely, if the remaining time is less than or equal to the preparation period, we
  // must be in the Preparation/Tranistion Period following the Climbing Period, in which
  // case we simply return the remaining time in seconds
  //
  // sig () -> (Integer)
  remainingTime() {
    const t = this.model.remaining > this.model.preparation
                ? this.model.remaining - this.model.preparation
                : this.model.remaining

    return Math.floor(t)
  }

  // Send a message to reset the clock
  //
  // sig: () -> void
  reset() {
    const data   = (window.ServerDate || Date).now()
    const client = new XMLHttpRequest()
    client.open("POST", '/timers/reset', true)
    client.setRequestHeader('Content-Type', 'application/json')
    client.send(data)
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
  // NOTE: The required properties for the`options` Hash are defined in the TimerView superclass
  //
  // sig: (Hash options) -> void
  constructor(options) {
    super(options)

    // bind the run method and run the clock
    this.clock = this.run.bind(this)
    this.clock(null)

    // Handle es messages
    const es     = new EventSource('/timers/reset')
    es.onmessage = this.handleESMessage.bind(this)
  }

  // React to any Server Sent Event message fired by the server
  handleESMessage(eventsource) {
    const now      = parseFloat(eventsource.data)       // (float) milliseconds
    //  
    this.model.end = now + ((this.model.end - now) > 0 ? 0 : (this.model.rotation * 1000) + 899)
  }
  
  // Commanded countdown timer
  run(timestamp) {
    const now       = this.model.start + timestamp      // (float) milliseconds
    const diff      = (this.model.end - now) / 1000     // (float) seconds
    const remaining = diff > 0 ? diff : 0               // (float) seconds

    super.run(remaining)
    
    // Use requestAnimationFrame() in preference to setTimeout()
    // TODO: Add commentary on rationale for using requestAnimationFrame 
    requestAnimationFrame(this.clock)
  }
}
