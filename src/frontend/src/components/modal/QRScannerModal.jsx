// components/QRScannerModal.jsx
import React, { useEffect, useRef } from 'react'
import Webcam from 'react-webcam'
import jsQR from 'jsqr'

const videoConstraints = {
  width: 400,
  height: 300,
  facingMode: 'environment',
}

const QRScannerModal = ({ onClose, onScan }) => {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code) {
          onScan(code.data)
          onClose()
          clearInterval(interval)
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [onClose, onScan])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="p-6 text-center bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Scan QR Code</h2>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="border rounded-md"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <button
          onClick={onClose}
          className="px-4 py-2 mt-4 btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default QRScannerModal