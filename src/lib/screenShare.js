export function requestScreenShare(environment = globalThis) {
  if (!environment.isSecureContext) {
    throw new Error('Screen sharing requires HTTPS. Open the secure SecondLook website and try again.');
  }
  const devices = environment.navigator?.mediaDevices;
  if (typeof devices?.getDisplayMedia !== 'function') {
    throw new Error('Screen sharing is unavailable in this browser. Open SecondLook in a desktop browser that supports screen sharing.');
  }
  // Call immediately from the click handler, before any network or AI setup.
  return devices.getDisplayMedia({ video: true, audio: false });
}

export function screenShareError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
      return 'Screen sharing was cancelled or blocked. Click Start Session and allow sharing in your browser and system settings.';
    case 'NotReadableError':
      return 'Your system could not share that screen. Check screen-recording permissions or choose another window.';
    case 'NotFoundError':
      return 'No screen or window is available to share. Open the window you want to share and try again.';
    case 'InvalidStateError':
      return 'Bring this tab into focus, then click Start Session again.';
    case 'AbortError':
      return 'Screen sharing was interrupted. Click Start Session to try again.';
    default:
      return error?.message || 'Could not start screen sharing. Please try again.';
  }
}
