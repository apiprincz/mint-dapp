import React from 'react';
import CountdownTimer from '../CountdownTimer';


export default function Countdown() {
  const THREE_DAYS_IN_MS = 1 * 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
  const NOW_IN_MS = new Date().getTime(1676318400619);
  // 6647377788458959
  const dateTimeAfterThreeDays = NOW_IN_MS + THREE_DAYS_IN_MS;
  const dateTimeAfterSevenDays = NOW_IN_MS + SEVEN_DAYS_IN_MS;

  return (
    <div>
      {/* <h2>Countdown To Mint Day</h2> */}

      {/* <h2>Expires after 3 days!!!</h2> */}
      <CountdownTimer targetDate={NOW_IN_MS} />

      {/* <h2>Expires after 7 days!!!</h2>
      <CountdownTimer targetDate={dateTimeAfterSevenDays} /> */}
    </div>
  );
}
