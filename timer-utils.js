// Utility method to return the remaining time in the current period
// Format the time into a mm:ss string
//
// sig: (Double time) -> String
export function format(time) {
  const m = Math.floor(time / 60)
  const s = Math.floor(time % 60)

  return (m + ':' + s.toLocaleString('en-US', {minimumIntegerDigits: 2}))
}

// Return the time to be displayed
// Assumes the following IFSC time periods are provided:
// climbing:    the allowed climbing period
// preparation: the allowed interval following a climbing period (e.g. in boulder, the transition time)
// remaining:   the calculated time  remaining within the rotation/attempt period
//
// sig: (Hash) -> Double
export function display({remaining, climbing, preparation}) {
  // If there's no time left in the rotation/attempt period, return the climbing time
  if (!Math.floor(remaining)) return climbing

  // Otherwise. calculate whether we're in the climbing or preparation period and return the
  // remaining time within the relevant period
  return remaining > preparation ? (remaining - preparation) : remaining
}
