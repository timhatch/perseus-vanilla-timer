import AudioSignal, {AudioCTX} from "./audiosignal.js"

import {format, display}       from "./timer-views.js"

const compose = (...fns) => (initialVal) => fns.reduceRight((val, fn) => fn(val), initialVal)

/*
* BASE TIMER IMPLEMENTATION
* Define methods common to all timer types
*/
const audio = AudioCTX ? [425, 600].map((f) => new AudioSignal(f)) : null

const socket = new WebSocket(`ws://${window.location.hostname}/pub`)

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
  }

  // Given a time in seconds, compare it with the stored time remaining on the clock and if
  // the two are different (a) update the displayed time and (b) if audio is supported play any
  // relevant audio signal
  // The point here is to allow the clock to iterate multiple times per second, but only refresh
  // the display when the number of seconds remaining changes
  run(timestamp) {
    if (Math.floor(timestamp) !== Math.floor(this.model.remaining)) {
      this.model.remaining = timestamp
      broadcast(this.model)
      playSound(this.model)
    }
  }
}

export default TimerView

// Broadcast time changes using websockets
function broadcast(model) {
  const time = compose(format, display)(model)
  socket.send(time)
  console.log(model)
}

// Play audio signals:
// - tone[1] / 650ms for the start/end of the climbing period and the one minute warning
// - tone[0] / 325ms for each five second countdown
function playSound(model) {
  if (AudioCTX) {
    const r = display(model)
    const t = Math.floor(r)
    if (t === 0 || t === 60 || t === model.climbing) audio[1].play(650)
    if (t < 6 && t > 0) audio[0].play(325)
  }
}
