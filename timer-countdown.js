import BaseTimer from './timer-baseclass.js'

/*
* ROTATION TIMER IMPLEMENTATION
* Implement an interruptible countdown timer
*/

// BaseTimer::CountdownTimer
// Sub-class timerview to run a simple rotating timer. 
// Use requestAnimationFrame to run as close as possible to the screen refresh rate

class CountdownTimer extends BaseTimer {
  // Constructor
  constructor(options) {
    // Instantiate the timer
    super(options)

    this.model.rotation = this.model.climbing + this.model.preparation
    this.model.end      = this.model.start

    // Bind and run the clock
    this.clock = this.run.bind(this)
    this.clock(0)
  }
  
  // Override the `run` method from the BaseTimer class, looping using requestAnimationFrame
  run(timestamp) {
    const now       = this.model.start + timestamp      // (float) milliseconds
    const diff      = (this.model.end - now) / 1000     // (float) seconds
    const remaining = diff > 0 ? diff : 0               // (float) seconds

    super.run(remaining)
    
    // Use requestAnimationFrame() in preference to setTimeout(). requestAnimationFrame notionally runs locked
    // to the screen refresh rate. Running faster than this is unnecessary.
    requestAnimationFrame(this.clock)
  }

  // Handle clock interrupts
  reset() {
    const offset     = 1000                         // Move actions 1s into the future (Human Factors)
    const reset_abs  = offset + Date.now()          // Actual time at which reset was initiated
    const reset_rel  = offset + performance.now()   // Time Offset at which reset was initiated


    // If time remained on the clock when the reset occurred, zero the clock (by setting the remaining
    // time to zero. Otherwise the new end time will be equal to `this.model.rotation` milliseconds
    const new_end    = (this.model.end - reset_abs) > 0 ? 0 : (this.model.rotation * 1000) 

    // Reset start and end times for the clock.
    // Set the new start time relative to the clock used by requestAnimationFrame by subtracting the
    // "relative time" (i.e. the time reference used by requestAnimationFrame) from "real time" when
    // the reset occurred.
    // The end time is set in "true" time
    this.model.start = reset_abs - reset_rel
    this.model.end   = reset_abs + new_end
  }
}

export default CountdownTimer
