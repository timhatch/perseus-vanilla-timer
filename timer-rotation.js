import BaseTimer from './timer-baseclass.js'

/*
* ROTATION TIMER IMPLEMENTATION
* Implement a non-interruptible rolling countdown timer
*/

// BaseTimer::RotationTimer
// Sub-class timerview to run a simple rotating timer.
class RotationTimer extends BaseTimer {
  // Constructor
  constructor(options) {
    // Instantiate the timer
    super(options)

    // run the clock
    this.clock = this.run.bind(this)
    this.clock()
  }

  // Override the `run` method from the BaseTimer class
  // Run the clock using a tick count rather than machine time. This obviates the need to
  // correct for drift, but means that the clock is as accurate only as the executing
  // interpreter. e.g. if the preceding code takes 1ms to run, then the effective interval
  // between ticks will be 1000ms (from the setTimeout) + 1ms (for execution)
  run() {
    const tick = this.model.remaining

    super.run(tick)
    this.model.remaining = tick - 1 || this.model.rotation  // (float) seconds

    setTimeout(this.clock, 1000)
  }
}

export default RotationTimer
