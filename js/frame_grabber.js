// frame_grabber.js

/**
 * FrameGrabber handles reading frames from the video element using a Canvas2D context.
 */
const FrameGrabber = (() => {
  let canvas = null;
  let context = null;

  /**
   * Initialize the FrameGrabber with a canvas size.
   * @param {Object} size - Object containing width and height of the canvas.
   */
  const init = (size) => {
    canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    context = canvas.getContext("2d", { willReadFrequently: true }); // Enable willReadFrequently flag
    console.log("FrameGrabber initialized with Canvas2D context.");
  };

  /**
   * Grab a frame from the video element.
   * @param {HTMLVideoElement} videoElement - The video element to capture frames from.
   * @returns {ImageData} - The frame data.
   */
  const grabFrame = (videoElement) => {
    if (!context) {
      throw new Error("FrameGrabber not initialized. Call init() first.");
    }
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  };

  return {
    init,
    grabFrame,
  };
})();

export default FrameGrabber;
