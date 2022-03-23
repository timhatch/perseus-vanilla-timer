//  A javascript timer for WC-format competitions.
//  Uses WebAudio to generate a standardised audio signals without latency effects
//  Copyright 2012-22  T J Hatch
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

// NOTE
// Older browsers may not support es6 in which case this code will need to be transpiled to es5
// Support for `toLocaleString` is not required/assumed


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

/*
* COUNTDOWN TIMER IMPLEMENTATION
* Implement a user-controlled countdown timer
*/

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

