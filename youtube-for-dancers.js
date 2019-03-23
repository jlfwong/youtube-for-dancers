const video = document.querySelector("video.html5-main-video")
var isFlipped = false

// Video in time in seconds for when the video should repeat from, or null if no repeating
var repeatStart = null
// Video in time in seconds for when the video should repeat to, or null if no repeating
var repeatEnd = null

function setRepeatStart(time = video.currentTime) {
  repeatStart = time
  if (repeatEnd == null || repeatEnd <= repeatStart) {
    repeatEnd = video.duration
  }
  updateUI()
}

function setRepeatEnd(time = video.currentTime) {
  repeatEnd = time
  if (repeatStart == null || repeatStart >= repeatEnd) {
    repeatStart = 0
  }
  updateUI()
}

function bindListeners() {
  var seeking = false
  video.addEventListener('seeking', () => { seeking = true })
  video.addEventListener('seeked', () => { seeking = false })
  video.addEventListener('timeupdate', () => {
    if (repeatStart != null && repeatEnd != null) {
      if (video.currentTime - repeatEnd > 0.1) {
        if (seeking) {
          // The user is seeking in the timeline past the repeat range! Extend the
          // end of the repeat range to the end of the video to allow continued
          // seeking.
          repeatEnd = video.duration
          updateUI()
        } else {
          // This is the result of regular playback, and we've reached the end of
          // the repeat range! Go back to the start.
          video.currentTime = repeatStart
        }
      } else if (repeatStart - video.currentTime > 0.1) {
        if (seeking) {
          // The user is seeking in the timeline before the repeat range! Extend
          // the start of the repeat range to thestartend of the video to allow
          // continued seeking.
          repeatStart = 0
          updateUI()
        }
      }
    }
  })

  window.addEventListener('keydown', (e) => {
    if (e.key === '\\') {
      isFlipped = !isFlipped
      video.style.transform = `scaleX(${isFlipped ? -1 : 1})`
      updateUI()
      return
    }

    if (e.key === '+' || e.key === '=') {
      video.playbackRate += 0.05
      updateUI()
      return
    }

    if (e.key === '-' || e.key === '_') {
      video.playbackRate -= 0.05
      updateUI()
      return
    }

    if (e.key === 's') {
      setRepeatStart()
      return
    }

    if (e.key === 'e') {
      setRepeatEnd()
      return
    }
  })
}

const updateUI = (function() {
  const videoContainer = document.getElementById("movie_player")
  const timeDisplay = document.querySelector(".ytp-time-display")
  const textReadout = document.createElement("span")
  timeDisplay.appendChild(textReadout)

  const progressList = document.querySelector(".ytp-progress-list")

  const markerSize = 10

  const beforeRepeatStartCover = document.createElement("div")
  beforeRepeatStartCover.style.height = '100%'
  beforeRepeatStartCover.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
  beforeRepeatStartCover.style.zIndex = 999
  beforeRepeatStartCover.style.position = "absolute"

  const repeatStartMarker = document.createElement("div")
  repeatStartMarker.style.width = 0
  repeatStartMarker.style.height = 0
  repeatStartMarker.style.borderTop = repeatStartMarker.style.borderBottom = `${markerSize}px solid transparent`
  repeatStartMarker.style.borderLeft = `${markerSize}px solid #f00`
  repeatStartMarker.style.position = "absolute"
  repeatStartMarker.style.top = `calc(-50% - ${markerSize/2}px)`
  repeatStartMarker.style.zIndex = 999

  function timeFromEvent(ev) {
    const bounds = progressList.getBoundingClientRect()
    return video.duration * (ev.screenX - bounds.x) / bounds.width
  }

  repeatStartMarker.addEventListener("mousedown", function() {
    function onMouseMove(ev) {
      setRepeatStart(timeFromEvent(ev))
    }
    function onMouseUp(ev) {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  })

  const repeatEndMarker = document.createElement("div")
  repeatEndMarker.style.position = "absolute"
  repeatEndMarker.style.width = 0
  repeatEndMarker.style.height = 0
  repeatEndMarker.style.borderTop = repeatEndMarker.style.borderBottom = `${markerSize}px solid transparent`
  repeatEndMarker.style.borderRight = `${markerSize}px solid #f00`
  repeatEndMarker.style.position = "absolute"
  repeatEndMarker.style.top = `calc(-50% - ${markerSize/2}px)`
  repeatEndMarker.style.zIndex = 999

  repeatEndMarker.addEventListener("mousedown", function() {
    function onMouseMove(ev) {
      setRepeatEnd(timeFromEvent(ev))
    }
    function onMouseUp(ev) {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  })

  const afterRepeatEndCover = document.createElement("div")
  afterRepeatEndCover.style.height = '100%'
  afterRepeatEndCover.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
  afterRepeatEndCover.style.zIndex = 999
  afterRepeatEndCover.style.position = "absolute"
  afterRepeatEndCover.style.right = "0"

  const progressListRepeatContainer = document.createElement("div")
  progressList.appendChild(progressListRepeatContainer)
  progressListRepeatContainer.appendChild(beforeRepeatStartCover)
  progressListRepeatContainer.appendChild(afterRepeatEndCover)
  progressListRepeatContainer.appendChild(repeatStartMarker)
  progressListRepeatContainer.appendChild(repeatEndMarker)

  function zeroPad(str, length) {
    str = `${str}`
    while (str.length < length) str = '0' + str
    return str
  }

  function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${zeroPad(Math.floor(seconds) % 60, 2)}`
  }

  return function update() {
    let readout = ` @ ${Math.round(video.playbackRate * 100)}%`
    if (isFlipped) {
      readout += ', flipped'
    }
    if (repeatStart != null && repeatEnd != null) {
      readout += `, repeating from ${formatTime(repeatStart)} to ${formatTime(repeatEnd)}`
    }
    textReadout.innerHTML = readout

    if (repeatStart != null && repeatEnd != null) {
      progressListRepeatContainer.style.display = 'block'

      beforeRepeatStartCover.style.width = `${(repeatStart/video.duration) * 100}%`
      repeatStartMarker.style.left = `calc(${(repeatStart/video.duration) * 100}% - ${markerSize}px)`
      repeatEndMarker.style.left = `${(repeatEnd/video.duration) * 100}%`
      afterRepeatEndCover.style.width = `${(1 - repeatEnd/video.duration) * 100}%`
    } else {
      progressListRepeatContainer.style.display = 'none'
    }

    // After the text readout has been updated, fake a mouse move event to force
    // the readout to be displayed.
    videoContainer.dispatchEvent(new MouseEvent('mousemove', {clientX: 1, clientY: 1}))
    videoContainer.dispatchEvent(new MouseEvent('mousemove', {clientX: 2, clientY: 2}))
  }
})()

function main() {
  bindListeners()
  updateUI()
  console.log("YouTube for Dancers installed!")
}

main()