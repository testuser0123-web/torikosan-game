"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

const filemap: { [K: string]: string } = {
  "トリコさん！": "/audio/torikosan.wav",
  "小松ゥ！": "/audio/komatuu.wav",
  "マツ！": "/audio/matsu.mp3",
  "小松くん！": "/audio/komatsukun.mp3",
  "小僧ォ！": "/audio/kozo.mp3",
};

type AudioProps = {
  queue: string[];
  setQueue: Dispatch<SetStateAction<string[]>>;
};

export default function AudioPlayer({ queue, setQueue }: AudioProps) {
  const [isMute, setIsMute] = useState(true);

  useEffect(() => {
    const play = async () => {
      if (queue.length > 0) {
        const call = queue.pop();
        if (call && call in filemap) {
          await playAudio(filemap[call]);
        }
        setQueue([...queue]);
      }
    };
    if (!isMute) {
      play();
    }
  }, [queue, isMute]);

  const playAudio = (file: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(file);
      audio.play();

      audio.onended = () => resolve();
      audio.onerror = (error) => reject(error);
    });
  };

  const handleClick = () => {
    setIsMute((prev) => !prev);
  };

  return (
    <button style={{ flex: 1 }} onClick={handleClick}>
      {isMute ? "🔇" : "🔊"}
    </button>
  );
}
