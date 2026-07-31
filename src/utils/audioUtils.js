export function createAudioRecorder() {
  let mediaRecorder = null
  let stream = null
  let chunks = []

  async function start() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4'
    mediaRecorder = new MediaRecorder(stream, { mimeType })
    chunks = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }
    mediaRecorder.start()
  }

  function stop() {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder) {
        reject(new Error('Recorder was not started'))
        return
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType })
        stream.getTracks().forEach((track) => track.stop())
        resolve(blob)
      }
      mediaRecorder.stop()
    })
  }

  function cancel() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    chunks = []
  }

  return { start, stop, cancel }
}

export function getAudioDuration(blob) {
  return new Promise((resolve) => {
    const audio = new Audio(URL.createObjectURL(blob))
    audio.addEventListener('loadedmetadata', () => {
      resolve(Number.isFinite(audio.duration) ? audio.duration : 0)
    })
    audio.addEventListener('error', () => resolve(0))
  })
}
