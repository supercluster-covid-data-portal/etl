/**
 * Timer utility to measure the duration of actions.
 * Useful for logging the time that different actions take, especially when optimizing code during development.
 *
 * Code Example:
 *   const myTimer = Timer();
 *   myTimer.start(); // Optional, will start when initialized
 *   const timeSinceStart = myTimer.step();
 *   const timeSinceLastStep = myTimer.step();
 *   const totalTimeSinceStart = myTimer.time();
 *
 *   myTimer.start(); // Reset the start time (restart)
 *
 */
const Timer = () => {
  let startTime: number;
  let stepTime: number;

  const start = () => {
    startTime = Date.now();
    stepTime = startTime;
  };

  /**
   * Get the total time since this timer was last started
   * @returns
   */
  const time = () => Date.now() - startTime;

  /**
   * Get the total time since this timer was last
   * @returns
   */
  const step = () => {
    const currentTime = Date.now();
    const output = currentTime - stepTime;
    stepTime = currentTime;
    return output;
  };

  start();
  return { start, step, time };
};
export default Timer;
