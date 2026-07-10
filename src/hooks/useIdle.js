import { useState, useEffect, useRef, useCallback } from 'react';

const IDLE_EVENTS = [
  'mousemove', 'mousedown', 'click', 'touchstart', 'touchmove', 'keydown', 'wheel', 'pointerdown', 'pointermove'
];
const DEBOUNCE_TIME = 150;

export const useIdle = (onIdle, idleTime = 180000) => {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutId = useRef();
  const debounceTimeoutId = useRef();

  const handleTimeout = () => {
    setIsIdle(true);
    if (typeof onIdle === 'function') {
      onIdle();
    }
  };

  const reset = useCallback(() => {
    setIsIdle(false);
    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(handleTimeout, idleTime);
  }, [idleTime]);

  const handleEvent = useCallback(() => {
    clearTimeout(debounceTimeoutId.current);
    debounceTimeoutId.current = setTimeout(() => {
        if (!isIdle) {
            reset();
        }
    }, DEBOUNCE_TIME);
  }, [isIdle, reset]);

  const start = useCallback(() => {
    IDLE_EVENTS.forEach(event => {
      window.addEventListener(event, handleEvent);
    });
    reset();
  }, [handleEvent, reset]);

  const stop = useCallback(() => {
    IDLE_EVENTS.forEach(event => {
      window.removeEventListener(event, handleEvent);
    });
    clearTimeout(timeoutId.current);
    clearTimeout(debounceTimeoutId.current);
  }, [handleEvent]);

  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, stop]);
  
  return { isIdle, reset, start, stop };
};