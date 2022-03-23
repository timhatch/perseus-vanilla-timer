import TimerView from './timer-baseclass.js'

class CountdownTimer extends TimerView {
  // Constructor
  constructor(options) {
    // Instantiate the timer
    super(options)
    
    // Bind and run the clock
    this.clock = this.run.bind(this)
    this.clock(null)
    
    // Handle es messages
    const es     = new EventSource('/timers/reset')
    es.onmessage = this.handleESMessage.bind(this)
  }

  // React to any Server Sent Event message fired by the server
  handleESMessage(eventsource) {
    const now      = parseFloat(eventsource.data)       // (float) milliseconds
    this.model.end = now + ((this.model.end - now) > 0 ? 0 : (this.model.rotation * 1000) + 899)
  }
  
  // Override the `run` method from the base TimerView class, looping using requestAnimationFrame
  run(timestamp) {
    const now       = this.model.start + timestamp      // (float) milliseconds
    const diff      = (this.model.end - now) / 1000     // (float) seconds
    const remaining = diff > 0 ? diff : 0               // (float) seconds

    super.run(remaining)
    
    requestAnimationFrame(this.clock)
  }
}

export default CountdownTimer
