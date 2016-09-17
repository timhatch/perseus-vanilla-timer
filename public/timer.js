//  A backbone based Network Timer for WC-format bouldering competitions.
//  Uses the ServerDate.js library for server synchronisation 
//  https://www.nodeguy.com/serverdate
//
//  Copyright 2012-16  T J Hatch
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

window.App = window.App || {}

App.Timer  = Backbone.Model.extend({
  audio    : [],
  end      : 0,

  // Initialize the model - set the rotation interval in minutes and initiate the relevant timer type
  //
  initialize: function(options){
    this.rotation = (options.duration || 300)
    this[options.type]()
    // Create a streaming connection to the server and react to messages
    var es       = new EventSource('/timers/reset')
    es.onmessage = this.handleESMessage.bind(this)
    // Synchronise to the server clock every 20 seconds
    // Amortize and time difference by a maximum step of 50ms every second
    // If the local clock is more tham 4 seconds out, just use the server clock
    ServerDate.synchronizationIntervalDelay = 20 * 1000
    ServerDate.amortizationRate             = 50
    ServerDate.amortizationThreshold        = 4000
  },
  
  // Recursively call a timer to manage timer 'drift', the Backbone .set() function
  // only triggers when the data passed as 'minutes' and 'seconds' has changed
  // 
  rotationTimer: function(){
    var rotation = this.rotation/60
    var now      = ServerDate
    var min      = now.getUTCMinutes()
    var sec      = now.getUTCSeconds() + now.getUTCMilliseconds()/1000

    // var t0 = performance.now();
    // Update the model  
    this.set({ 
      'minutes' : (rotation * (1 + Math.floor(min/rotation))) - (min + 1), 
      'seconds' : 59 - Math.floor(sec)
    })
    // console.log(performance.now() - t0)
    this.timer = requestAnimationFrame(this.rotationTimer.bind(this))
  },

  // React to any Server Sent Event message fired by the server
  //
  handleESMessage: function(eventsource){
    var now  = parseFloat(eventsource.data)
    this.end = now + ((this.end - now) > 0 ? 0 : (this.rotation * 1000) + 999)
  },

  // Timer function for a single countdown timer. i.e. IFSC Final format
  //
  countdownTimer: function(){
    var diff      = this.end - ServerDate.now() 
    var remaining = diff > 0 ? diff : 0 
    var min       = Math.floor(remaining/60000) 
    
    this.set({
      'minutes' : min,
      'seconds' : Math.floor(remaining/1000 - (min * 60))
    })
    
    this.timer = requestAnimationFrame(this.countdownTimer.bind(this))
  }
})

