import AudioSignal, {AudioCTX} from "./audiosignal.js"

// Utility method to return the remaining time in the current period
const toString = (time) => {
    const m = Math.floor(time / 60)
    let   s = time % 60

    // return (m + ':' + s.toLocaleString('en-US', { minimumIntegerDigits: 2 }))
    // NOTE: Some browsers don't yet support toLocaleString, to format manually
    if (s < 10) s = '0' + s
    return `${m}:${s}`
}

/*
* BASE TIMER IMPLEMENTATION
* Define methods common to all timer types
*/

// Class::TimerView
// A generic timer class 
class TimerView {
  
  constructor(options) {
    // Associate a websockt instance with the timer
    this.socket = options.socket

    // If the WebAudio API is supported, create the required audio signals
    this.audio = AudioCTX ? [425, 600].map((f) => new AudioSignal(f)) : null

    // Instantiate the timer model.
    const c = options.climbing   || 300         // (int) seconds
    const p = options.interval   || 0           // (int) seconds
    const n = Date.now() // (int) milliseconds
    const h = performance.now()                 // (float) milliseconds
    this.model = {rotation: c + p, remaining: c + p, climbing: c, preparation: p, start: n - h}

    // Scale the displayed text to the screen dimensions
    const viewportHeight     = document.documentElement.clientHeight
    this.el                  = document.getElementById('inner')
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
      this.broadcast()
    }
  }

  // Play audio signals (650ms for the rotation start/end and one minute warning, 325ms for the five
  // second countdown
  playSound() {
    const t = this.remainingTime()
    if (t === 0 || t === 60 || t === this.model.rotation) this.audio[1].play(650)
    if (t < 6 && t > 0) this.audio[0].play(325)
  }

  // Broadcast time changes using websockets
  // this implementation assumes that upDateClock is called only where time remaining
  // *in seconds* changes
  broadcast() {
    const data = JSON.stringify(this.model)
    this.socket.send(data)
  }

  // Update the time display & play any relevant audible signal
  // this implementation assume that upDateClock is called only where time remaining
  // *in seconds* changes
  updateClock() {
    const t = Math.floor(this.model.remaining) ? this.remainingTime() : this.model.climbing

    this.el.textContent = toString(t)
  }

  remainingTime() {
    const t = this.model.remaining > this.model.preparation
                ? this.model.remaining - this.model.preparation 
                : this.model.remaining
    return Math.floor(t)
  }

  // Send a message to reset the clock
  reset() {
    const data   = Date.now()
    const client = new XMLHttpRequest()
    client.open("POST", '/timers/reset', true)
    client.setRequestHeader('Content-Type', 'application/json')
    client.send(data)
  }
}

export default TimerView
