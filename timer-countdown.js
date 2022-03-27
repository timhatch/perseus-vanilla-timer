import BaseTimer from './timer-baseclass.js'

/*
* COUNTDONW TIMER IMPLEMENTATION
* Implement an interruptible countdown timer
*/

// BaseTimer::CountdownTimer
// Sub-class timerview to run a simple rotating timer.
class CountdownTimer extends BaseTimer {
  // Constructor
  constructor(options) {
    // Instantiate the timer
    super(options)

    // Bind and run the clock
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
    this.model.remaining = tick - 1   // (int) seconds

    setTimeout(this.clock, 1000)
  }

  // Handle clock interrupts
  // If the clock is running, then set model.remaining == 0 (i.e. stop the clock).
  // If the clock is already stopped (model.remaining <= 0) then restart
  reset() {
    const now = this.model.remaining
    this.model.remaining = (now > 0) ? 0 : this.model.rotation
  }
}

export default CountdownTimer
