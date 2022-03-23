import TimerView from './timer-baseclass.js'

/*
* ROTATION TIMER IMPLEMENTATION
* Implement a rolling countdown timer
*/

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

    // Use requestAnimationFrame() in preference to setTimeout(). requestAnimationFrame notionally runs locked
    // to the screen refresh rate. Running faster than this is unnecessary.
    requestAnimationFrame(this.clock)
  }
}

export default RotationTimer
