import AudioSignal, {AudioCTX} from "./audiosignal.js"

import {format, display}       from "./timer-views.js"

/*
* BASE TIMER IMPLEMENTATION
* Define methods common to all timer types
*/

// Class::TimerView
// A generic timer class 
class TimerView {
  
  constructor(options) {
    // Instantiate the timer model.
    const start       = Date.now()                        // (int) milliseconds
    const climbing    = options.climbing   || 300         // (int) seconds
    const preparation = options.interval   || 0           // (int) seconds
    const remaining   = climbing + preparation

    // Model properties
    this.model  = {climbing, preparation, start, remaining}

    // Associate a websockt instance with the timer
    this.socket = options.socket

    // If the WebAudio API is supported, create the required audio signals
    this.audio = AudioCTX ? [425, 600].map((f) => new AudioSignal(f)) : null
  }

  // Given a time in seconds, compare it with the stored time remaining on the clock and if
  // the two are different (a) update the displayed time and (b) if audio is supported play any
  // relevant audio signal
  // The point here is to allow the clock to iterate multiple times per second, but only refresh
  // the display when the number of seconds remaining changes
  run(timestamp) {
    if (Math.floor(timestamp) !== Math.floor(this.model.remaining)) {
      this.model.remaining = timestamp
      this.broadcast()
      this.playSound()
    }
  }

  // Play audio signals (650ms for the rotation start/end and one minute warning, 325ms for the five
  // second countdown
  playSound() {
    if (!this.audio) return

    const r = display(this.model)
    const t = Math.floor(r)
    if (t === 0 || t === 60 || t === this.model.climbing) this.audio[1].play(650)
    if (t < 6 && t > 0) this.audio[0].play(325)
  }

  // Broadcast time changes using websockets
  // this implementation assumes that upDateClock is called only where time remaining
  // *in seconds* changes
  broadcast() {
    const data = JSON.stringify(this.model)
    this.socket.send(data)
  }
}

export default TimerView
