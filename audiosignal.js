/*
* AUDIO SYNTHESIS
* Use HTML5 Web Audio to generate required audio signals
*
* Requires browsers to allow autoplay
*/

// Will return null if the browser does not support the WebAudio API
export const AudioCTX  = window.AudioContext || window.webkitAudioContext

// Class::AudioSignal
// Generates and plays square wave tones for a given frequency and duration
//
class AudioSignal {
  // Create an audio object with a play method and two playable tones
  constructor(f) {
    this.audioCTX = new AudioCTX()
    this.tone     = this.createAudio(f)   
  }

  // Create an Audio Graph comprising a square wave oscillator and an amplifier
  // @f - a frequency in Hz for the generated tone
  createAudio(f) {
    const oscillator = this.audioCTX.createOscillator()
    const amplifier  = this.audioCTX.createGain()
    
    amplifier.gain.value = 0
    amplifier.connect(this.audioCTX.destination)

    oscillator.type            = "square"
    oscillator.frequency.value = f
    oscillator.connect(amplifier)
    oscillator.start()

    return amplifier 
  }

  // "Play" a specified signal by adjusting the amplifier gain
  // @duration  - the duration of the signal
  play(duration) {
    this.tone.gain.setValueAtTime(1, this.audioCTX.currentTime)
    this.tone.gain.setValueAtTime(0, this.audioCTX.currentTime + duration/1000)
  }
}

export default AudioSignal

