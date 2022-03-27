import AudioSignal, {AudioCTX} from "./audiosignal.js"

import {format, display}       from "./timer-utils.js"

const compose = (...fns) => (initialVal) => fns.reduceRight((val, fn) => fn(val), initialVal)

/*
* BASE TIMER IMPLEMENTATION
* Define methods common to all timer types
*/

const audio = AudioCTX ? [425, 600].map((f) => new AudioSignal(f)) : null

const socket = new WebSocket(`ws://${window.location.hostname}/pub`)

// BaseTimer
// A generic timer class 
class BaseTimer {
  // Contructor
  constructor(options) {
    // Instantiate the timer model.
    const climbing    = options.climbing   || 300         // (int) seconds
    const preparation = options.interval   || 0           // (int) seconds
    const rotation    = climbing + preparation            // (int) seconds
    const remaining   = rotation                          // (int) seconds

    // Model properties
    this.model  = {climbing, preparation, rotation, remaining}
  }

  // Given a `tick` value corresponding to the time in seconds:
  // - set the remaining time
  // - broadcast the model data
  // - play any relevant sound
  run(tick) {
    if (tick < 0) return    // Ignore negative time (e.g. time-expired on a countdown clock)

    this.model.remaining = tick
    broadcast(this.model)
    playSound(this.model)
  }
}

export default BaseTimer

// Broadcast time changes using websockets
function broadcast(model) {
  const time = compose(format, display)(model)
  socket.send(time)
  // console.log(model)
}

// Play audio signals:
// - tone[1] / 650ms for the start/end of the climbing period and the one minute warning
// - tone[0] / 325ms for each five second countdown
function playSound(model) {
  if (AudioCTX) {
    const t = display(model)
    if (t === 0 || t === 60 || t === model.climbing) audio[1].play(650)
    if (t < 6 && t > 0) audio[0].play(325)
  }
}
