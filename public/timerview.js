//  A backbone based Timer for WC-format bouldering competitions.
//  Uses WebAudio to generate standardised audio signals without latency effects
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

window.App    = window.App || {}

Backbone.View = Backbone.NativeView

App.AudioCTX  = new (window.AudioContext || window.webkitAudioContext)()

App.TimerView = Backbone.View.extend({

  // Initialise the view (bind the view to changes in the minutes/seconds attributes of 
  // the timer model)
  //
  initialize: function(options){
    var viewportHeight = document.documentElement.clientHeight
    var fontHeight     = (viewportHeight > 480) ? viewportHeight : 72
    
    // Instantiate the timer model and audio files used by the display
    this.model = new App.Timer(options)
    this.beep1 = this.createAudio(425)  // The 5 second warning 
    this.beep2 = this.createAudio(600)  // Commencement of rotation & 1 min warning

    // Bind the ::updateClock function to any change in the related model.
    this.listenTo(this.model, 'change', this.updateClock, this)

    // Set the font and line heights
    this.el.style.lineHeight = (1.0*viewportHeight)+'px'
    this.el.style.fontSize   = (0.7*fontHeight)+'px'
  },

  // Create an Audio Graph comprising a square wave oscillator and an amplifier
  // @param - a frequency in Hz for the generated tone
  //
  createAudio: function(f){
    var oscillator = App.AudioCTX.createOscillator()
    var amplifier  = App.AudioCTX.createGain()
    
    amplifier.gain.value = 0
    amplifier.connect(App.AudioCTX.destination)

    oscillator.type = "square"
    oscillator.frequency.value = f
    oscillator.connect(amplifier)
    oscillator.start()

    return amplifier 
  },

  // "Play" a sound by adjusting the amplifier gain
  //
  play: function(tone, duration){
    tone.gain.setValueAtTime(1, App.AudioCTX.currentTime)
    tone.gain.setValueAtTime(0, App.AudioCTX.currentTime + duration/1000)
  },

  // Update the time display & play any relevant audible signal
  //
  updateClock: function(){
    var m = this.model.get('minutes')
    var s = this.model.get('seconds')
    var t = (m * 60) + s
    
    if (t === 0 || t === 60 || t === this.model.rotation) this.play(this.beep2, 500)
    if (t < 6 && t > 0) this.play(this.beep1, 250)

    this.el.textContent = m + ':' + s.toLocaleString('en-US', { minimumIntegerDigits: 2 })
  }
})
