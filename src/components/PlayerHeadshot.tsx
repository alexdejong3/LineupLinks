"use client";

import { useState } from "react";

interface PlayerHeadshotProps {
  playerId: number;
  size?: number;
}

export default function PlayerHeadshot({ playerId, size = 40 }: PlayerHeadshotProps) {
  const [failed, setFailed] = useState(false);

  const url = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;

  if (failed) {
    return (
      <div
        className="rounded-full bg-[var(--card-border)] flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
