import BaseTimer from './timer-baseclass.js'

/*
* ROTATION TIMER IMPLEMENTATION
* Implement a non-interruptible rolling countdown timer
*/

// BaseTimer::RotationTimer
// Sub-class timerview to run a simple rotating timer. 
// Use requestAnimationFrame to run as close as possible to the screen refresh rate
class RotationTimer extends BaseTimer {
  // Constructor
  constructor(options) {
    // Instantiate the timer
    super(options)

    // Define the rotation period
    this.model.rotation = this.model.climbing + this.model.preparation

    // run the clock
    this.clock = this.run.bind(this)
    this.clock(0)
  }
  
  // Override the `run` method from the BaseTimer class, looping using requestAnimationFrame
  run() {
    const now       = Date.now() / 1000                                   // (float) seconds
    const remaining = this.model.rotation - (now % this.model.rotation)   // (float) seconds

    super.run(remaining)

    // Use requestAnimationFrame() in preference to setTimeout(). requestAnimationFrame notionally runs locked
    // to the screen refresh rate. Running faster than this is unnecessary.
    setTimeout(this.clock, 1000)
  }
}

export default RotationTimer
