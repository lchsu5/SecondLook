import test from 'node:test';
import assert from 'node:assert/strict';
import { requestScreenShare, screenShareError } from '../src/lib/screenShare.js';

test('opens the browser picker synchronously without AI setup or credentials', async () => {
  let called = false;
  const stream = { getVideoTracks: () => [] };
  const result = requestScreenShare({
    isSecureContext: true,
    navigator: { mediaDevices: { getDisplayMedia(options) {
      called = true;
      assert.deepEqual(options, { video: true, audio: false });
      return Promise.resolve(stream);
    } } },
  });
  assert.equal(called, true);
  assert.equal(await result, stream);
});

test('explains unsupported browsers and insecure pages before requesting capture', () => {
  assert.throws(() => requestScreenShare({ isSecureContext: false }), /HTTPS/);
  assert.throws(() => requestScreenShare({ isSecureContext: true }), /desktop browser/);
});

test('does not reopen the picker after cancellation or denial', async () => {
  let calls = 0;
  const error = Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' });
  await assert.rejects(requestScreenShare({
    isSecureContext: true,
    navigator: { mediaDevices: { getDisplayMedia() {
      calls += 1;
      return Promise.reject(error);
    } } },
  }), error);
  assert.equal(calls, 1);
  assert.match(screenShareError(error), /cancelled or blocked/);
});

test('distinguishes operating system permissions from focus and unavailable sources', () => {
  assert.match(screenShareError({ name: 'NotReadableError' }), /screen-recording permissions/);
  assert.match(screenShareError({ name: 'InvalidStateError' }), /focus/);
  assert.match(screenShareError({ name: 'NotFoundError' }), /No screen or window/);
  assert.match(screenShareError({ name: 'AbortError' }), /interrupted/);
});
