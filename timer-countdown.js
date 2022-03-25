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
    
    // Bind and run the clock
    this.clock = this.run.bind(this)
    this.clock(null)

    // TODO: Refactor to use ws
    const es     = new EventSource('/timers/reset')
    es.onmessage = this.handleESMessage.bind(this)
  }

  // TODO: Refactor to use ws
  // React to any Server Sent Event message fired by the server
  handleESMessage(eventsource) {
    const now      = parseFloat(eventsource.data)       // (float) milliseconds
    this.model.end = now + ((this.model.end - now) > 0 ? 0 : (this.model.rotation * 1000) + 899)
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
}

export default CountdownTimer
